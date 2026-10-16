import os
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from twilio.rest import Client

from app.models.database import get_session, utcnow
from app.models.space_models import SpaceEvent, SpaceIncident
from app.services.space_telemetry import (
    load_isro_satellites,
    get_satellite_by_id,
    generate_live_telemetry_frame
)
from app.agents.space_agents import orchestrate_space_incident_analysis
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/space", tags=["SpaceOS Monitoring & Incident Intelligence"])


# ---------- Pydantic Request & Response Schemas ----------

class SimulateEventRequest(BaseModel):
    satellite_id: str = "ISRO-44804"  # Default Cartosat-3
    anomaly_type: Optional[str] = "solar_drop"  # solar_drop, rf_interference, attitude_deviation, orbital_decay_pulse
    detection_method: Optional[str] = "Z-Score Thresholding (sigma=4.2)"

class ReviewIncidentRequest(BaseModel):
    review_status: str = Field(..., description="e.g. marked_as_reviewed, under_review, dismissed")
    operator_notes: Optional[str] = None
    reviewed_by: Optional[str] = "Flight Ops Lead"

class CallOperatorRequest(BaseModel):
    confirmed: bool = Field(..., description="Explicit human operator confirmation required")
    phone_number: Optional[str] = "+919347249697"
    caller_name: Optional[str] = "Flight Operations Director"


# ---------- Helper to Seed Default Realistic Events ----------

def ensure_initial_events_seeded(session: Session):
    count = session.query(SpaceEvent).count()
    if count == 0:
        logger.info("[SpaceOS] Seeding initial realistic ISRO telemetry events...")
        default_events = [
            SpaceEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                source_id="FEED-CARTOSAT3-TELEMETRY",
                satellite_name="Cartosat-3",
                timestamp=utcnow(),
                detection_description="Solar Array Bus Output dropped 58% below nominal baseline during equatorial sunlit pass.",
                affected_measurement="Solar Array Bus Output",
                observed_value="840.0 W",
                expected_baseline="1850.0 - 2100.0 W",
                detection_method="Z-Score Statistical Deviation (sigma=4.2)",
                detection_confidence=0.94,
                evidence_reference="TELEMETRY-PKT-2026-X1092",
                review_status="unreviewed",
                is_confirmed_incident=0
            ),
            SpaceEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                source_id="FEED-GSAT7A-RF-DOWNLINK",
                satellite_name="GSAT-7A (Angry Bird)",
                timestamp=utcnow(),
                detection_description="Downlink Signal-to-Noise Ratio (SNR) collapsed from 25.4 dB to 8.4 dB over Ku-band military transponder.",
                affected_measurement="Downlink SNR",
                observed_value="8.4 dB",
                expected_baseline="22.0 - 28.0 dB",
                detection_method="Spectral Baseline Anomaly Filter",
                detection_confidence=0.91,
                evidence_reference="RF-SPECTRUM-CAP-994",
                review_status="unreviewed",
                is_confirmed_incident=0
            ),
            SpaceEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                source_id="FEED-RISAT2BR1-OPTICAL",
                satellite_name="RISAT-2BR1",
                timestamp=utcnow(),
                detection_description="Computer vision detection registered high-reflectance object in proximity cone during orbital day transition.",
                affected_measurement="Optical Track Jitter",
                observed_value="2.45 deg pointing variance",
                expected_baseline="0.00 - 0.08 deg",
                detection_method="YOLOv8 Spacecraft Object Detector",
                detection_confidence=0.88,
                evidence_reference="FRAME-RECORDING-VID-043",
                review_status="unreviewed",
                is_confirmed_incident=0
            )
        ]
        session.add_all(default_events)
        session.commit()


# ---------- Endpoints ----------

@router.get("/satellites")
def list_satellites():
    """Returns ISRO Satellite registry grounded on real dataset."""
    return {
        "dataset_source": "ISRO Satellite Complete Dataset (Kaggle: jyotmakadiya/isro-satellite-complete-dataset)",
        "satellites": load_isro_satellites()
    }


@router.get("/telemetry")
def get_live_telemetry(
    satellite_id: str = Query("ISRO-44804", description="Satellite ID or Name"),
    inject_anomaly: bool = Query(False, description="Simulate an anomaly frame for testing"),
    anomaly_type: Optional[str] = Query(None, description="solar_drop, rf_interference, attitude_deviation, orbital_decay_pulse")
):
    """Generates continuous or anomalous telemetry frame grounded on real satellite parameters."""
    frame = generate_live_telemetry_frame(satellite_id, inject_anomaly=inject_anomaly, anomaly_type=anomaly_type)
    return frame


@router.get("/events")
def list_events(session: Session = Depends(get_session)):
    """Lists all detected space events."""
    ensure_initial_events_seeded(session)
    events = session.query(SpaceEvent).order_by(SpaceEvent.timestamp.desc()).all()
    return [
        {
            "event_id": e.event_id,
            "source_id": e.source_id,
            "satellite_name": e.satellite_name,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "detection_description": e.detection_description,
            "affected_measurement": e.affected_measurement,
            "observed_value": e.observed_value,
            "expected_baseline": e.expected_baseline,
            "detection_method": e.detection_method,
            "detection_confidence": e.detection_confidence,
            "evidence_reference": e.evidence_reference,
            "review_status": e.review_status,
            "is_confirmed_incident": bool(e.is_confirmed_incident)
        }
        for e in events
    ]


@router.post("/events/simulate")
def simulate_new_event(payload: SimulateEventRequest, session: Session = Depends(get_session)):
    """Simulates an anomaly detection on the live stream and records it as an unreviewed space event."""
    frame = generate_live_telemetry_frame(payload.satellite_id, inject_anomaly=True, anomaly_type=payload.anomaly_type)
    sat = frame["satellite"]
    anom = frame["anomaly"]

    new_evt_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
    new_event = SpaceEvent(
        event_id=new_evt_id,
        source_id=f"FEED-{sat['name'].upper().replace(' ', '')}-LIVE",
        satellite_name=sat["name"],
        timestamp=utcnow(),
        detection_description=anom["description"],
        affected_measurement=anom["metric"],
        observed_value=anom["observed_value"],
        expected_baseline=anom["nominal_range"],
        detection_method=anom["detection_method"],
        detection_confidence=round(float(abs(anom.get("deviation_pct", 50.0)) / 100.0 * 0.95), 2) if anom.get("deviation_pct") else 0.92,
        evidence_reference=f"REC-STREAM-{uuid.uuid4().hex[:6].upper()}",
        review_status="unreviewed",
        is_confirmed_incident=0
    )

    session.add(new_event)
    session.commit()
    session.refresh(new_event)

    return {
        "event_id": new_event.event_id,
        "satellite_name": new_event.satellite_name,
        "detection_description": new_event.detection_description,
        "affected_measurement": new_event.affected_measurement,
        "observed_value": new_event.observed_value,
        "expected_baseline": new_event.expected_baseline,
        "detection_method": new_event.detection_method,
        "detection_confidence": new_event.detection_confidence,
        "evidence_reference": new_event.evidence_reference,
        "timestamp": new_event.timestamp.isoformat()
    }


@router.post("/analyze/{event_id}")
async def analyze_incident(event_id: str, session: Session = Depends(get_session)):
    """
    Executes the 4 AI Agents:
    1. Detection Analysis Agent
    2. Incident Analysis Agent
    3. Risk Assessment Agent
    4. Incident Reporting Agent
    Generates a structured incident decision-support report and voice briefing.
    """
    event = session.query(SpaceEvent).filter(SpaceEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")

    sat_context = get_satellite_by_id(event.satellite_name) or {
        "name": event.satellite_name,
        "orbit_class": "LEO",
        "perigee_km": 505.0,
        "apogee_km": 510.0,
        "power_watts": 2000.0,
        "norad_id": "44804",
        "purpose": "Observation & Defense Comms"
    }

    event_data = {
        "id": event.event_id,
        "timestamp": event.timestamp.isoformat() if event.timestamp else datetime.utcnow().isoformat(),
        "source_id": event.source_id,
        "detection_method": event.detection_method,
        "confidence": event.detection_confidence,
        "description": event.detection_description,
        "evidence": {
            "metric": event.affected_measurement,
            "observed_value": event.observed_value,
            "nominal_range": event.expected_baseline,
            "reference": event.evidence_reference
        }
    }

    analysis_res = await orchestrate_space_incident_analysis(event_data, sat_context)
    report_data = analysis_res["report"]

    # Store or update in space_incidents table
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    new_incident = SpaceIncident(
        incident_id=incident_id,
        event_id=event.event_id,
        satellite_name=event.satellite_name,
        timestamp=utcnow(),
        data_source=event.source_id,
        observed_event=report_data.get("incident_title", event.detection_description),
        supporting_evidence=json.dumps(report_data.get("observed_evidence", [])),
        possible_explanations=json.dumps(report_data.get("possible_explanations", [])),
        preliminary_severity=report_data.get("preliminary_severity", "Medium"),
        severity_reasoning=analysis_res.get("risk_agent", {}).get("severity_rationale", "Evaluated from telemetry bounds"),
        uncertainties=json.dumps(report_data.get("uncertainties", [])),
        recommended_next_steps=json.dumps(report_data.get("recommended_next_steps", [])),
        voice_briefing_text=report_data.get("voice_briefing_script", ""),
        review_status="unreviewed"
    )

    event.review_status = "analyzed"
    session.add(new_incident)
    session.commit()
    session.refresh(new_incident)

    return {
        "incident_id": new_incident.incident_id,
        "event_id": event.event_id,
        "satellite_name": new_incident.satellite_name,
        "timestamp": new_incident.timestamp.isoformat(),
        "data_source": new_incident.data_source,
        "incident_title": report_data.get("incident_title"),
        "summary": report_data.get("summary"),
        "observed_evidence": report_data.get("observed_evidence"),
        "possible_explanations": report_data.get("possible_explanations"),
        "preliminary_severity": new_incident.preliminary_severity,
        "severity_reasoning": new_incident.severity_reasoning,
        "uncertainties": report_data.get("uncertainties"),
        "recommended_next_steps": report_data.get("recommended_next_steps"),
        "voice_briefing_script": new_incident.voice_briefing_text,
        "review_status": new_incident.review_status,
        "agents_breakdown": {
            "detection_agent": analysis_res.get("detection_agent"),
            "incident_agent": analysis_res.get("incident_agent"),
            "risk_agent": analysis_res.get("risk_agent")
        }
    }


@router.get("/incidents")
def list_incidents(session: Session = Depends(get_session)):
    """Returns all incident records."""
    incidents = session.query(SpaceIncident).order_by(SpaceIncident.timestamp.desc()).all()
    results = []
    for inc in incidents:
        results.append({
            "incident_id": inc.incident_id,
            "event_id": inc.event_id,
            "satellite_name": inc.satellite_name,
            "timestamp": inc.timestamp.isoformat() if inc.timestamp else None,
            "data_source": inc.data_source,
            "observed_event": inc.observed_event,
            "preliminary_severity": inc.preliminary_severity,
            "severity_reasoning": inc.severity_reasoning,
            "review_status": inc.review_status,
            "reviewed_by": inc.reviewed_by,
            "reviewed_at": inc.reviewed_at.isoformat() if inc.reviewed_at else None,
            "voice_briefing_text": inc.voice_briefing_text,
            "outbound_call_dispatched": bool(inc.outbound_call_dispatched)
        })
    return results


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str, session: Session = Depends(get_session)):
    """Returns single detailed incident report."""
    inc = session.query(SpaceIncident).filter(SpaceIncident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    
    return {
        "incident_id": inc.incident_id,
        "event_id": inc.event_id,
        "satellite_name": inc.satellite_name,
        "timestamp": inc.timestamp.isoformat() if inc.timestamp else None,
        "data_source": inc.data_source,
        "observed_event": inc.observed_event,
        "supporting_evidence": json.loads(inc.supporting_evidence) if inc.supporting_evidence else [],
        "possible_explanations": json.loads(inc.possible_explanations) if inc.possible_explanations else [],
        "preliminary_severity": inc.preliminary_severity,
        "severity_reasoning": inc.severity_reasoning,
        "uncertainties": json.loads(inc.uncertainties) if inc.uncertainties else [],
        "recommended_next_steps": json.loads(inc.recommended_next_steps) if inc.recommended_next_steps else [],
        "voice_briefing_script": inc.voice_briefing_text,
        "review_status": inc.review_status,
        "reviewed_by": inc.reviewed_by,
        "reviewed_at": inc.reviewed_at.isoformat() if inc.reviewed_at else None,
        "operator_notes": inc.operator_notes,
        "outbound_call_dispatched": bool(inc.outbound_call_dispatched),
        "outbound_call_sid": inc.outbound_call_sid
    }


@router.patch("/incidents/{incident_id}/review")
def review_incident(incident_id: str, payload: ReviewIncidentRequest, session: Session = Depends(get_session)):
    """Operator reviews incident, adds notes, marks reviewed."""
    inc = session.query(SpaceIncident).filter(SpaceIncident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    
    inc.review_status = payload.review_status
    inc.operator_notes = payload.operator_notes
    inc.reviewed_by = payload.reviewed_by or "Flight Director"
    inc.reviewed_at = utcnow()

    # Also update associated event
    evt = session.query(SpaceEvent).filter(SpaceEvent.event_id == inc.event_id).first()
    if evt:
        evt.review_status = payload.review_status
        if payload.review_status == "marked_as_reviewed":
            evt.is_confirmed_incident = 1

    session.commit()
    session.refresh(inc)

    return {
        "status": "success",
        "incident_id": inc.incident_id,
        "review_status": inc.review_status,
        "reviewed_by": inc.reviewed_by,
        "reviewed_at": inc.reviewed_at.isoformat(),
        "operator_notes": inc.operator_notes
    }


@router.post("/incidents/{incident_id}/call-operator")
def call_operator_with_briefing(incident_id: str, payload: CallOperatorRequest, session: Session = Depends(get_session)):
    """
    Human Operator Calling:
    Requires explicit operator confirmation (payload.confirmed == True).
    Dispatches outbound call via Twilio with the generated AI voice briefing.
    """
    if not payload.confirmed:
        raise HTTPException(status_code=400, detail="Explicit operator confirmation is required before placing outbound call.")

    inc = session.query(SpaceIncident).filter(SpaceIncident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    briefing_text = inc.voice_briefing_text or (
        f"SpaceOS Alert. Incident detected on satellite {inc.satellite_name}. Preliminary severity: {inc.preliminary_severity}."
    )

    to_phone = payload.phone_number or "+919347249697"

    # Check Twilio credentials
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
        # Graceful simulated response when Twilio is unconfigured
        return {
            "status": "simulated",
            "message": "Twilio credentials not configured in backend/.env. Simulated operator call executed.",
            "to": to_phone,
            "briefing_text": briefing_text
        }

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        
        # Inline TwiML response with Polly.Matthew voice
        twiml_instruction = (
            f"<Response>"
            f"<Say voice='Polly.Matthew' language='en-US'>{briefing_text}</Say>"
            f"<Pause length='1'/>"
            f"<Say voice='Polly.Matthew' language='en-US'>Please log in to SpaceOS console to review diagnostic logs. End of transmission.</Say>"
            f"</Response>"
        )

        call = client.calls.create(
            to=to_phone,
            from_=settings.twilio_phone_number,
            twiml=twiml_instruction
        )

        inc.outbound_call_dispatched = 1
        inc.outbound_call_sid = call.sid
        session.commit()

        return {
            "status": "dispatched",
            "call_sid": call.sid,
            "to": to_phone,
            "caller_name": payload.caller_name,
            "briefing_text": briefing_text
        }
    except Exception as e:
        logger.error(f"[SpaceOS] Twilio call failed: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "to": to_phone,
            "briefing_text": briefing_text
        }
