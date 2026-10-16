import asyncio
import os
from typing import Any, Dict, List, Optional, TypedDict
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from langgraph.graph import END, START, StateGraph

from app.agents.finance_agent import run_finance_agent
from app.agents.gtm_agent import run_gtm_agent
from app.agents.hiring_agent import run_hiring_agent
from app.agents.legal_agent import run_legal_agent
from app.agents.llm import call_llm, parse_json_response
from app.agents.research_agent import run_research_agent
from app.config import settings
from app.models.database import SessionLocal, Task, Approval, AuditLogEntry, utcnow

# Global configuration for Live vs Demo Simulation Mode
# Auto-detect if API key is not configured properly, fallback to demo
AI_MODE = os.getenv("AI_MODE", "live")

CLASSIFY_SYSTEM = """You are the Flight Intelligence Orchestrator inside SpaceXOS, an aerospace decision-support platform for satellite operations leads, ISRO flight controllers, and space situational awareness (SSA) teams. Given a flight director's command or inquiry, decide which specialist aerospace agents should weigh in.

Available agents: "gtm", "finance", "hiring", "legal", "research".
- gtm: space & defense market strategy, sovereign contracts (ISRO, DSA, DoD), commercial mega-constellations (Pixxel, Planet Labs, OneWeb), and partnership roadmaps
- finance: spacecraft power budget, telemetry nominal envelopes, battery depth-of-discharge, solar array wattage, delta-V propellant budgets
- hiring: flight operations crew, satellite subsystem controllers, attitude determination and control (ADCS) specialists, orbital analysts
- legal: orbital compliance, space debris mitigation (IADC 25-year guidelines), ITU spectrum coordination, emergency collision avoidance approvals
- research: space situational awareness, ISRO satellite registry (Cartosat, RISAT, GSAT), orbital ephemeris, solar weather (geomagnetic storms, solar flux)

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"relevant_agents": ["gtm"], "needs_clarification": false, "clarifying_question": null}

Pick 1 to 4 relevant agents ordered by relevance. Set needs_clarification to true ONLY if the command is completely blank or undecipherable.
"""

AGENT_FUNCS = {
    "finance": run_finance_agent,
    "hiring": run_hiring_agent,
    "legal": run_legal_agent,
    "gtm": run_gtm_agent,
    "research": run_research_agent,
}

AGENT_DISPLAY_NAMES = {
    "finance": "Telemetry & Power Agent",
    "hiring": "Flight Dynamics Agent",
    "legal": "Orbital Compliance Agent",
    "gtm": "Mission Strategy Agent",
    "research": "Space Domain Intel Agent",
}


class OrchestratorState(TypedDict):
    query: str
    relevant_agents: List[str]
    needs_clarification: bool
    clarifying_question: Optional[str]
    agent_responses: List[Dict[str, Any]]


async def classify_node(state: OrchestratorState) -> OrchestratorState:
    # 1. Instant keyword routing check to avoid multiple LLM calls and reduce latency
    q = state["query"].lower()
    agents = []
    if any(w in q for w in ["runway", "burn", "budget", "finance", "money", "afford", "cash", "bank", "revenue", "spend"]):
        agents.append("finance")
    if any(w in q for w in ["hire", "recruiting", "recruit", "candidate", "developer", "resume", "job", "hired", "salary", "employee"]):
        agents.append("hiring")
    if any(w in q for w in ["nda", "contract", "agreement", "legal", "compliance", "policy", "sign", "lawsuit"]):
        agents.append("legal")
    if any(w in q for w in ["gtm", "market", "sales", "leads", "customer", "customer acquisition", "pipeline", "deal"]):
        agents.append("gtm")
    
    if agents:
        return {
            **state,
            "relevant_agents": agents,
            "needs_clarification": False,
            "clarifying_question": None,
        }

    # 2. Fallback to LLM classification if query is complex
    try:
        raw = await call_llm(CLASSIFY_SYSTEM, state["query"])
        data = parse_json_response(raw)
        agents = [a for a in data.get("relevant_agents", []) if a in AGENT_FUNCS]
        return {
            **state,
            "relevant_agents": agents,
            "needs_clarification": bool(data.get("needs_clarification", False)) and not agents,
            "clarifying_question": data.get("clarifying_question"),
        }
    except Exception:
        return {
            **state,
            "relevant_agents": ["research"],
            "needs_clarification": False,
            "clarifying_question": None,
        }


def route_after_classify(state: OrchestratorState) -> str:
    return "clarify" if state["needs_clarification"] else "dispatch"


async def dispatch_node(state: OrchestratorState) -> OrchestratorState:
    # Limit to primary matching agent for voice call clarity and low latency
    agents = [state["relevant_agents"][0]] if state["relevant_agents"] else ["research"]
    
    # Run agent executions
    results = await asyncio.gather(
        *[AGENT_FUNCS[name](state["query"]) for name in agents],
        return_exceptions=True,
    )
    responses = []
    for name, result in zip(agents, results):
        if isinstance(result, Exception):
            responses.append(
                {
                    "agent_name": AGENT_DISPLAY_NAMES.get(name, name),
                    "message": f"This agent hit an error: {result}",
                    "action": {"type": "none", "requires_approval": False},
                }
            )
        else:
            responses.append(result)
    return {**state, "agent_responses": responses}


async def clarify_node(state: OrchestratorState) -> OrchestratorState:
    question = state.get("clarifying_question") or "Could you give me a bit more detail on what you need?"
    return {
        **state,
        "agent_responses": [
            {"agent_name": "Orchestrator", "message": question, "action": {"type": "none", "requires_approval": False}}
        ],
    }


def build_graph():
    graph = StateGraph(OrchestratorState)
    graph.add_node("classify", classify_node)
    graph.add_node("dispatch", dispatch_node)
    graph.add_node("clarify", clarify_node)
    graph.add_edge(START, "classify")
    graph.add_conditional_edges("classify", route_after_classify, {"dispatch": "dispatch", "clarify": "clarify"})
    graph.add_edge("dispatch", END)
    graph.add_edge("clarify", END)
    return graph.compile()


_GRAPH = build_graph()


async def run_orchestration(query: str) -> OrchestratorState:
    # Always use live AI state machine for all queries, including email commands

    print("Running in 100% DYNAMIC LIVE AI MODE")
    initial: OrchestratorState = {
        "query": query,
        "relevant_agents": [],
        "needs_clarification": False,
        "clarifying_question": None,
        "agent_responses": [],
    }
    
    try:
        return await _GRAPH.ainvoke(initial)
    except Exception as exc:
        print(f"[Orchestrator] Graph execution warning: {exc}. Generating dynamic response via AI router...")
        try:
            dynamic_answer = await call_llm(
                "You are the SpaceXOS Flight Intelligence Orchestrator. Answer the flight director clearly, concisely, and dynamically regarding space missions, orbital telemetry, defense partner strategy, or constellation operations.",
                query,
                max_tokens=600
            )
            return {
                "query": query,
                "relevant_agents": ["gtm"],
                "needs_clarification": False,
                "clarifying_question": None,
                "agent_responses": [
                    {
                        "agent_name": "SpaceXOS Flight Intelligence",
                        "message": dynamic_answer.strip(),
                        "action": {"type": "none", "requires_approval": False, "payload": {}}
                    }
                ]
            }
        except Exception as e2:
            raise RuntimeError(f"All AI LLMs failed: {e2}")


async def run_demo_simulation(query: str) -> OrchestratorState:
    """High-fidelity aerospace fallback simulation for SpaceXOS Flight Intelligence."""
    await asyncio.sleep(1.2)
    q_lower = query.lower()
    
    # Check if they are inquiring about Market Strategy, Defense, or Partners
    is_market_strategy = any(w in q_lower for w in ["market", "strategy", "gtm", "defense", "partner", "commercial", "sales", "customer"])
    
    if is_market_strategy:
        responses = [
            {
                "agent_name": "Mission Strategy Agent",
                "message": "SpaceXOS commercialization and mission partner strategy centers on three core aerospace pillars:\n1. Sovereign Defense & Space Agency Partnerships: Providing automated telemetry anomaly triage, space situational awareness (SSA), and threat detection for ISRO (ISTRAC), Indian Defence Space Agency (DSA), and international space commands.\n2. Commercial Mega-Constellation Operations: Delivering autonomous decision-support software for LEO constellation operators (e.g. Pixxel, Planet Labs, OneWeb) to reduce flight controller cognitive load, prevent satellite loss, and automate collision avoidance maneuvers.\n3. Space Domain Awareness (SDA) Data Feeds: Providing real-time orbital debris conjunction analysis (<500m miss distance alerts) and space weather resilience modeling.",
                "action": {
                    "type": "none",
                    "requires_approval": False
                }
            }
        ]
        return {
            "query": query,
            "relevant_agents": ["gtm"],
            "needs_clarification": False,
            "clarifying_question": None,
            "agent_responses": responses
        }
        
    # Default aerospace fallbacks
    agents = []
    responses = []
    
    if any(w in q_lower for w in ["power", "telemetry", "solar", "battery", "voltage", "eps", "runway", "burn"]):
        agents.append("finance")
        responses.append({
            "agent_name": "Telemetry & Power Agent",
            "message": "Cartosat-3 and RISAT-2BR1 telemetry streams are nominal. Solar array bus generation is at 1,850 W with battery state-of-charge at 98.4%. No anomalous bus impedance or thermal shunt degradation detected.",
            "action": {"type": "none", "requires_approval": False}
        })
        
    if any(w in q_lower for w in ["crew", "controller", "hire", "personnel", "adcs", "dynamics", "mechanics"]):
        agents.append("hiring")
        responses.append({
            "agent_name": "Flight Dynamics Agent",
            "message": "Orbital flight operations staffing is fully allocated. Primary console positions active: Astrodynamics & Orbit Determination Controller, Spacecraft ADCS Controller, and Ground Station Link Lead.",
            "action": {"type": "none", "requires_approval": False}
        })
        
    if any(w in q_lower for w in ["contract", "legal", "approval", "cola", "debris", "compliance", "itu", "burn"]):
        agents.append("legal")
        responses.append({
            "agent_name": "Orbital Compliance Agent",
            "message": "Space Debris Mitigation protocol verified under IADC 25-year deorbit guidelines. ITU frequency coordination active for X-band 8.2 GHz payload downlink. Collision avoidance burn directive queued for Flight Director review.",
            "action": {"type": "none", "requires_approval": True, "summary": "Authorize Collision Avoidance Burn Sequence"}
        })
        
    if not responses:
        agents.append("research")
        responses.append({
            "agent_name": "Space Domain Intel Agent",
            "message": "SpaceXOS Flight Intelligence active. Monitoring 4 active spacecraft across SSO, GEO, and LEO orbits. Tracking solar flux F10.7 (142 sfu) and space weather geomagnetic Kp index (2.1 - Quiet). Ready for flight commands.",
            "action": {"type": "none", "requires_approval": False}
        })
        
    return {
        "query": query,
        "relevant_agents": agents,
        "needs_clarification": False,
        "clarifying_question": None,
        "agent_responses": responses
    }
