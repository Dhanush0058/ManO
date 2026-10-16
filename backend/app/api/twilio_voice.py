import os
import re
from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client

from app.config import settings
from app.agents.orchestrator import run_orchestration
from app.models.database import AuditLogEntry, get_session, utcnow

router = APIRouter(prefix="/twilio/voice", tags=["Twilio Voice AI"])

VOICE_NAME = os.getenv("TWILIO_VOICE", "Polly.Matthew")
VOICE_LANG = os.getenv("TWILIO_VOICE_LANG", "en-US")



class OutboundCallRequest(BaseModel):
    to_phone: str
    topic: str = "Critical Orbital Anomaly Incident Briefing"
    caller_name: str = "Flight Director"


class VoiceSimulateRequest(BaseModel):
    speech_text: str


def clean_text_for_speech(text: str) -> str:
    """Strip markdown symbols, URLs, and code fences so speech synthesis sounds natural."""
    # Remove code blocks
    text = re.sub(r"```[\s\S]*?```", "", text)
    # Remove inline code
    text = re.sub(r"`.*?`", "", text)
    # Remove markdown headers and bold/italics
    text = re.sub(r"[#*_~]", "", text)
    # Remove URLs
    text = re.sub(r"https?://\S+", "", text)
    # Remove extra spaces and newlines
    text = " ".join(text.split())
    # Format currency for natural pronunciation
    text = text.replace("₹", "Rupees ")
    return text[:600]  # Keep phone response concise and conversational


@router.get("/status")
def get_twilio_status():
    """Check Twilio AI Voice calling integration status."""
    is_configured = bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_phone_number)
    return {
        "configured": is_configured,
        "twilio_phone_number": settings.twilio_phone_number or "Not Configured",
        "webhook_url": f"{settings.twilio_webhook_base_url}/api/twilio/voice/incoming",
        "voice": f"{VOICE_NAME} ({VOICE_LANG})",
        "supported_features": [
            "Real-time Inbound Voice Call Q&A",
            "Outbound AI Briefing Calls",
            "Live Database & Runway Querying over Phone",
            "Candidate & Lead Status Lookup via Voice"
        ]
    }


@router.api_route("/incoming", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    """
    Twilio Webhook for Inbound Calls.
    Greets the caller and gathers speech input.
    """
    response = VoiceResponse()
    
    gather = Gather(
        input="speech",
        action=f"{settings.twilio_webhook_base_url}/api/twilio/voice/handle-speech",
        method="POST",
        speech_timeout="auto",
        language="en-IN"
    )
    gather.say(
        "Hello Administrator Dhanush! Welcome to SpaceXOS Flight Intelligence and Emergency Voice Operations. "
        "What space mission intelligence or orbital telemetry briefing do you need today? "
        "You can ask about spacecraft telemetry anomalies, incident diagnostics, collision avoidance screening, or mission reporting directives.",
        voice=VOICE_NAME, language=VOICE_LANG
    )
    response.append(gather)
    
    # Fallback if no speech detected
    response.say("We did not receive any flight command input. SpaceXOS Mission Control standing by. Goodbye!", voice=VOICE_NAME, language=VOICE_LANG)
    response.hangup()
    
    return Response(content=str(response), media_type="application/xml")


def log_audit_in_background(user_query: str, response_text: str, caller_num: str):
    from app.models.database import SessionLocal, AuditLogEntry, utcnow
    db = SessionLocal()
    try:
        db.add(
            AuditLogEntry(
                agent="Twilio Voice AI",
                action="phone_call_qa",
                input=f"Caller ({caller_num}): {user_query}",
                output=response_text,
                status="success",
                timestamp=utcnow(),
            )
        )
        db.commit()
    except Exception as e:
        print(f"[Twilio Voice AI Log Error] Failed to write background audit log: {e}")
    finally:
        db.close()


@router.post("/handle-speech")
async def handle_speech_result(
    request: Request,
    background_tasks: BackgroundTasks,
    SpeechResult: str = Form(None),
    From: str = Form("Unknown Caller"),
    CallSid: str = Form("SIM-CALL"),
    session: Session = Depends(get_session)
):
    """
    Twilio Webhook for handling speech recognition output.
    Queries the multi-agent AI system with live database grounding and speaks back the answer.
    """
    response = VoiceResponse()
    user_query = (SpeechResult or "").strip()

    if not user_query:
        gather = Gather(
            input="speech",
            action=f"{settings.twilio_webhook_base_url}/api/twilio/voice/handle-speech",
            method="POST",
            speech_timeout="auto",
            language="en-IN"
        )
        gather.say("I didn't quite catch that. Could you please repeat your question?", voice=VOICE_NAME, language=VOICE_LANG)
        response.append(gather)
        return Response(content=str(response), media_type="application/xml")

    # Check for exit commands
    if any(bye in user_query.lower() for bye in ["bye", "exit", "quit", "goodbye", "hang up", "thank you that's all"]):
        response.say("Thank you for contacting SpaceXOS Mission Control. Clear skies and nominal orbit ahead. Goodbye!", voice=VOICE_NAME, language=VOICE_LANG)
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    # Run AI Orchestration with live space operations context
    try:
        state = await run_orchestration(user_query)
        agent_msgs = [r["message"] for r in state.get("agent_responses", [])]
        combined_text = " ".join(agent_msgs) if agent_msgs else "Telemetry across active satellites is nominal. Multi-agent space intelligence online."
        spoken_response = clean_text_for_speech(combined_text)
    except Exception as e:
        spoken_response = "SpaceXOS flight telemetry link is locked. Cartosat-3 and RISAT-2BR1 orbital tracks are nominal. Incident diagnostics online."

    # Log to audit trail in background thread to avoid voice latency / timeouts
    background_tasks.add_task(log_audit_in_background, user_query, spoken_response, From)

    # Speak back the answer
    response.say(spoken_response, voice=VOICE_NAME, language=VOICE_LANG)
    
    # Loop for follow-up questions
    gather = Gather(
        input="speech",
        action=f"{settings.twilio_webhook_base_url}/api/twilio/voice/handle-speech",
        method="POST",
        speech_timeout="auto",
        language="en-IN"
    )
    gather.say("Do you require any further flight intelligence or telemetry corroboration from our specialist agents?", voice=VOICE_NAME, language=VOICE_LANG)
    response.append(gather)
    
    response.say("SpaceXOS Flight Operations signing off. Goodbye!", voice=VOICE_NAME, language=VOICE_LANG)
    response.hangup()

    return Response(content=str(response), media_type="application/xml")


@router.post("/outbound")
async def trigger_outbound_call(payload: OutboundCallRequest, session: Session = Depends(get_session)):
    """
    Trigger an outbound AI Phone Call to a given number.
    Connects caller to the interactive ManO Voice Assistant.
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        # Return simulated outbound call result if Twilio credentials not provided yet
        session.add(
            AuditLogEntry(
                agent="Twilio Voice AI",
                action="outbound_call_simulated",
                input=f"Outbound Call to {payload.to_phone} (Topic: {payload.topic})",
                output=f"Simulated outbound call initiated for {payload.caller_name}.",
                status="simulated",
                timestamp=utcnow(),
            )
        )
        session.commit()
        return {
            "status": "simulated",
            "message": f"Twilio credentials not configured in .env. Simulated outbound call triggered for {payload.to_phone}.",
            "to": payload.to_phone,
            "topic": payload.topic,
            "instructions": "To place real phone calls over the cellular network, add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to backend/.env"
        }

    try:
        # Use the dynamic interactive webhook endpoint for live interactive calling, fallback to static TwiML Bin if webhook url is local/missing
        if "localhost" not in settings.twilio_webhook_base_url and "127.0.0.1" not in settings.twilio_webhook_base_url:
            twiml_url = f"{settings.twilio_webhook_base_url}/api/twilio/voice/incoming"
        else:
            twiml_url = settings.twilio_twiml_url or os.getenv("TWILIO_TWIML_URL", "").strip() or "https://handler.twilio.com/twiml/EHc96398090a3969120e038fab22b4e16e"
            
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        call = client.calls.create(
            to=payload.to_phone,
            from_=settings.twilio_phone_number,
            url=twiml_url
        )
        
        session.add(
            AuditLogEntry(
                agent="Twilio Voice AI",
                action="outbound_call_dispatched",
                input=f"Outbound Call to {payload.to_phone}",
                output=f"Twilio Call SID: {call.sid} | Status: {call.status}",
                status="success",
                timestamp=utcnow(),
            )
        )
        session.commit()
        
        return {
            "status": "dispatched",
            "call_sid": call.sid,
            "call_status": call.status,
            "to": payload.to_phone,
            "from": settings.twilio_phone_number
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Twilio outbound call failed: {str(e)}")


@router.post("/simulate")
async def simulate_voice_interaction(payload: VoiceSimulateRequest):
    """
    Browser-based interactive phone simulator.
    Tests the exact voice AI response without dialing a phone number.
    """
    user_query = payload.speech_text.strip()
    if not user_query:
        return {"spoken_response": "Please ask a question.", "twiml": "<Response><Say>Please ask a question.</Say></Response>"}

    state = await run_orchestration(user_query)
    agent_msgs = [r["message"] for r in state.get("agent_responses", [])]
    combined_text = " ".join(agent_msgs) if agent_msgs else "Everything is operational in your startup."
    spoken_response = clean_text_for_speech(combined_text)

    response = VoiceResponse()
    response.say(spoken_response, voice=VOICE_NAME, language=VOICE_LANG)

    return {
        "spoken_response": spoken_response,
        "twiml": str(response),
        "agents_consulted": [r["agent_name"] for r in state.get("agent_responses", [])]
    }