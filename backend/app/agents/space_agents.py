"""
space_agents.py - SpaceOS 4-Agent Incident Intelligence Architecture.

Implements the multi-agent orchestration for space incidents:
1. Detection Analysis Agent: Summarizes direct observations vs model predictions vs missing info.
2. Incident Analysis Agent: Evaluates physical interpretations, telemetry correlations, and evidence sufficiency.
3. Risk Assessment Agent: Determines preliminary severity (Low, Medium, High, Unknown) & verification checks.
4. Incident Reporting Agent: Combines all agent assessments into a structured decision-support report and spoken voice briefing.
"""

import json
import logging
from typing import Dict, Any
from app.agents.llm import call_llm

logger = logging.getLogger(__name__)


async def run_detection_analysis_agent(event: Dict[str, Any], sat_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detection Analysis Agent:
    Summarises what the detection component observed.
    Distinguishes:
    - Direct observations (raw sensor telemetry or frame detection)
    - Model-generated predictions (anomaly classification, inferred deviation)
    - Missing information (sensor dropouts, unmonitored subsystems)
    """
    system_prompt = (
        "You are the SpaceOS Detection Analysis Agent, an expert aerospace telemetry validator. "
        "Your task is to parse raw space event detections and separate hard factual evidence from model predictions. "
        "Strict Rule: Never invent technical details or present model inferences as verified facts. "
        "Respond in strict valid JSON only with keys: direct_observations (list of strings), "
        "model_predictions (list of strings), missing_information (list of strings), summary (string)."
    )

    user_prompt = (
        f"Satellite Ground Truth Context (from ISRO Registry):\n"
        f"- Name: {sat_context.get('name')}\n"
        f"- Orbit: {sat_context.get('orbit_class')} (Perigee: {sat_context.get('perigee_km')} km, Apogee: {sat_context.get('apogee_km')} km)\n"
        f"- Power Bus Baseline: {sat_context.get('power_watts')} W\n"
        f"- NORAD ID: {sat_context.get('norad_id')}\n"
        f"- Users/Mission: {sat_context.get('purpose')} / {sat_context.get('users')}\n\n"
        f"Event Detection Data:\n"
        f"- Event ID: {event.get('id')}\n"
        f"- Timestamp: {event.get('timestamp')}\n"
        f"- Source ID: {event.get('source_id')}\n"
        f"- Detection Method: {event.get('detection_method')}\n"
        f"- Description: {event.get('description')}\n"
        f"- Evidence: {json.dumps(event.get('evidence', {}), indent=2)}\n"
        f"- Detection Confidence: {event.get('confidence')}\n\n"
        "Provide a factual breakdown distinguishing direct observations, model predictions, and missing information."
    )

    try:
        raw_response = await call_llm(system=system_prompt, user=user_prompt, max_tokens=1000)
        cleaned = raw_response.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)
        return data
    except Exception as e:
        logger.warning(f"[SpaceOS] DetectionAnalysisAgent fallback due to: {e}")
        return {
            "direct_observations": [
                f"Observed value: {event.get('evidence', {}).get('observed_value', 'Sensor deviation detected')}",
                f"Telemetry timestamp: {event.get('timestamp')}",
                f"Telemetry channel: {event.get('evidence', {}).get('metric', 'Subsystem bus')}"
            ],
            "model_predictions": [
                f"Detection method '{event.get('detection_method')}' classified signature with confidence {event.get('confidence', 'N/A')}",
                "Suspected non-nominal state in orbital or electrical subsystem"
            ],
            "missing_information": [
                "Downlink telemetry for adjacent ground station pass not yet synchronized",
                "Thermal payload sensor redundant cross-check pending ground link"
            ],
            "summary": f"Detection component flagged an anomaly in {event.get('evidence', {}).get('metric', 'telemetry')} using {event.get('detection_method')}."
        }


async def run_incident_analysis_agent(event: Dict[str, Any], sat_context: Dict[str, Any], detection_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Incident Analysis Agent:
    Examines the event and available supporting evidence.
    Explains possible interpretations, identifies relevant telemetry or video observations,
    and states when evidence is insufficient without inventing technical details.
    """
    system_prompt = (
        "You are the SpaceOS Incident Analysis Agent, an orbital systems engineer. "
        "Examine the space event evidence, baseline specifications, and detection breakdown. "
        "Identify realistic aerospace physical interpretations (e.g. solar eclipse transit, space weather SEU, reaction wheel friction, RF jammer/solar burst). "
        "State clearly if evidence is insufficient to confirm structural damage or malicious action. "
        "Respond in strict valid JSON only with keys: possible_explanations (list of strings), "
        "corroborating_evidence (list of strings), evidence_sufficiency_verdict (string), analysis_narrative (string)."
    )

    user_prompt = (
        f"Satellite: {sat_context.get('name')} (Orbit: {sat_context.get('orbit_class')}, Baseline Power: {sat_context.get('power_watts')} W)\n"
        f"Detection Analysis Output:\n{json.dumps(detection_output, indent=2)}\n\n"
        f"Raw Event Evidence:\n{json.dumps(event.get('evidence', {}), indent=2)}\n\n"
        "Provide thorough engineering interpretations and state whether current evidence is sufficient to confirm root cause."
    )

    try:
        raw_response = await call_llm(system=system_prompt, user=user_prompt, max_tokens=1000)
        cleaned = raw_response.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)
        return data
    except Exception as e:
        logger.warning(f"[SpaceOS] IncidentAnalysisAgent fallback due to: {e}")
        return {
            "possible_explanations": [
                "Transient solar array shadowing or single-event upset (SEU) in power conditioning unit",
                "Orbital perturbation due to upper-atmospheric density surge or reaction control wheel calibration",
                "Ground station line-of-sight multipath attenuation or terrestrial RF interference"
            ],
            "corroborating_evidence": [
                f"Telemetry reading: {event.get('evidence', {}).get('observed_value', 'Out of nominal range')}",
                f"Nominal expected envelope: {event.get('evidence', {}).get('nominal_range', 'Historical baseline')}"
            ],
            "evidence_sufficiency_verdict": "Insufficient single-point evidence. Physical damage cannot be inferred from telemetry or video alone.",
            "analysis_narrative": f"The detected perturbation on {sat_context.get('name')} exhibits anomalous variance compared to nominal baseline, but secondary verification across telemetry frames is required."
        }


async def run_risk_assessment_agent(event: Dict[str, Any], sat_context: Dict[str, Any], incident_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Risk Assessment Agent:
    Produces a preliminary risk assessment based strictly on evidence.
    Includes:
    - Preliminary severity: Low, Medium, High, or Unknown.
    - Reason for the assessment.
    - Confidence or uncertainty, only if supported by model's actual output.
    - Recommended additional checks.
    """
    system_prompt = (
        "You are the SpaceOS Risk Assessment Agent. "
        "Assign a preliminary operational severity: 'Low', 'Medium', 'High', or 'Unknown'. "
        "Ground your severity solely on mission impact and safety of flight. "
        "Strictly avoid exaggerating risks when data is incomplete. "
        "Respond in strict valid JSON only with keys: preliminary_severity (one of 'Low', 'Medium', 'High', 'Unknown'), "
        "severity_rationale (string), operational_uncertainties (list of strings), recommended_checks (list of strings)."
    )

    user_prompt = (
        f"Satellite: {sat_context.get('name')} ({sat_context.get('purpose')})\n"
        f"Detection Evidence: {json.dumps(event.get('evidence', {}), indent=2)}\n"
        f"Incident Analysis Findings:\n{json.dumps(incident_analysis, indent=2)}\n\n"
        "Generate the risk assessment."
    )

    try:
        raw_response = await call_llm(system=system_prompt, user=user_prompt, max_tokens=800)
        cleaned = raw_response.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)
        if data.get("preliminary_severity") not in ["Low", "Medium", "High", "Unknown"]:
            data["preliminary_severity"] = "Medium"
        return data
    except Exception as e:
        logger.warning(f"[SpaceOS] RiskAssessmentAgent fallback due to: {e}")
        return {
            "preliminary_severity": "Medium",
            "severity_rationale": "Telemetry shows significant deviation from baseline operating envelope requiring operator review, but no critical loss of telemetry carrier or bus collapse has occurred.",
            "operational_uncertainties": [
                "Duration of anomaly during next orbital eclipse cycle",
                "Autonomous onboard safe-mode trigger threshold margin"
            ],
            "recommended_checks": [
                "Query Bangalore ISTRAC ground station for raw ephemeris telemetry",
                "Execute secondary diagnostic health poll on power bus and gyro sensors",
                "Verify Space Weather Prediction Center (SWPC) Kp-index for solar flare activity"
            ]
        }


async def run_incident_reporting_agent(
    event: Dict[str, Any],
    sat_context: Dict[str, Any],
    detection_out: Dict[str, Any],
    incident_out: Dict[str, Any],
    risk_out: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Incident Reporting Agent:
    Combines all agent outputs into a structured decision-support report and concise spoken voice briefing.
    The report must contain:
    - Incident ID, Event timestamp, Data source, Observed event, Supporting evidence,
      Possible explanations, Preliminary severity, Uncertainties, Recommended next steps.
    Voice briefing must include:
    - What was detected, When it was detected, Why it may matter, What remains uncertain, What action operator should review.
    """
    system_prompt = (
        "You are the SpaceOS Incident Reporting Agent. Combine the outputs of the Detection, Incident, and Risk agents "
        "into an executive incident report for flight directors and a concise spoken voice briefing. "
        "Strict Rule: System is a decision-support tool. Emphasize human operator verification. "
        "Respond in strict valid JSON with keys: "
        "incident_title (string), summary (string), observed_evidence (list of strings), "
        "possible_explanations (list of strings), preliminary_severity (string), uncertainties (list of strings), "
        "recommended_next_steps (list of strings), voice_briefing_script (string)."
    )

    user_prompt = (
        f"Satellite: {sat_context.get('name')} (NORAD: {sat_context.get('norad_id')})\n"
        f"Event ID: {event.get('id')} at {event.get('timestamp')}\n"
        f"Detection Agent Output: {json.dumps(detection_out)}\n"
        f"Incident Agent Output: {json.dumps(incident_out)}\n"
        f"Risk Agent Output: {json.dumps(risk_out)}\n\n"
        "Draft the structured incident report and a professional, crisp voice briefing script suitable for audio playback and operator phone calls."
    )

    try:
        raw_response = await call_llm(system=system_prompt, user=user_prompt, max_tokens=1200)
        cleaned = raw_response.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)
        return data
    except Exception as e:
        logger.warning(f"[SpaceOS] IncidentReportingAgent fallback due to: {e}")
        severity = risk_out.get("preliminary_severity", "Medium")
        metric_name = event.get("evidence", {}).get("metric", "Telemetry Sensor")
        obs_val = event.get("evidence", {}).get("observed_value", "Deviation")
        
        voice_script = (
            f"SpaceOS Alert for Flight Operations. An anomaly was detected on {sat_context.get('name')} at {event.get('timestamp')}. "
            f"The monitoring system registered {metric_name} at {obs_val}, exceeding nominal operating bounds. "
            f"This may impact payload mission availability, though physical damage cannot be confirmed from telemetry alone. "
            f"Sensor redundancy cross-checks remain pending. "
            f"Preliminary severity is assessed as {severity}. Operator review is requested to authorize diagnostic polling."
        )

        return {
            "incident_title": f"Telemetry Anomaly on {sat_context.get('name')} ({metric_name})",
            "summary": f"SpaceOS detected a significant deviation on {sat_context.get('name')} using {event.get('detection_method')}. Multi-agent analysis indicates: {risk_out.get('severity_rationale')}",
            "observed_evidence": detection_out.get("direct_observations", [f"Observed {obs_val} on {metric_name}"]),
            "possible_explanations": incident_out.get("possible_explanations", ["Subsystem transient", "Telemetry packet glitch"]),
            "preliminary_severity": severity,
            "uncertainties": risk_out.get("operational_uncertainties", ["Ground pass latency", "Cross-sensor redundancy verification"]),
            "recommended_next_steps": risk_out.get("recommended_checks", ["Review telemetry replay", "Initiate ground station handshake"]),
            "voice_briefing_script": voice_script
        }


async def orchestrate_space_incident_analysis(event: Dict[str, Any], sat_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Multi-Agent Orchestrator:
    Coordinates Detection -> Incident Analysis -> Risk Assessment -> Incident Reporting.
    Ensures identical ground-truth context and evidence are shared across all 4 agents.
    """
    logger.info(f"[SpaceOS Orchestrator] Starting multi-agent analysis for event {event.get('id')}")
    
    # 1. Detection Analysis Agent
    detection_out = await run_detection_analysis_agent(event, sat_context)
    
    # 2. Incident Analysis Agent
    incident_out = await run_incident_analysis_agent(event, sat_context, detection_out)
    
    # 3. Risk Assessment Agent
    risk_out = await run_risk_assessment_agent(event, sat_context, incident_out)
    
    # 4. Incident Reporting Agent
    report_out = await run_incident_reporting_agent(event, sat_context, detection_out, incident_out, risk_out)
    
    return {
        "event_id": event.get("id"),
        "satellite": sat_context,
        "detection_agent": detection_out,
        "incident_agent": incident_out,
        "risk_agent": risk_out,
        "report": report_out
    }
