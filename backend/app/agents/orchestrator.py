import asyncio
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.finance_agent import run_finance_agent
from app.agents.gtm_agent import run_gtm_agent
from app.agents.hiring_agent import run_hiring_agent
from app.agents.legal_agent import run_legal_agent
from app.agents.llm import call_llm, parse_json_response
from app.agents.research_agent import run_research_agent

CLASSIFY_SYSTEM = """You are the Orchestrator Agent inside ManO, an AI staff platform for startup
founders. Given a founder's goal or question, decide which specialist agents should weigh in.

Available agents: "finance", "hiring", "legal", "gtm", "research".
- finance: runway, budgets, burn rate, financial risk
- hiring: job descriptions, screening, offers, headcount planning
- legal: contracts, compliance, legal risk
- gtm: launch plans, pricing, positioning, marketing/sales
- research: market research, competitor intel, or anything that doesn't fit the above

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"relevant_agents": ["finance", "legal"], "needs_clarification": false, "clarifying_question": null}

Pick 1 to 4 relevant agents ordered by relevance. Set needs_clarification to true ONLY if the goal
is genuinely too vague to route anywhere (e.g. a single ambiguous word) — in that case leave
relevant_agents empty and fill in clarifying_question. Most real questions, even short ones, CAN be
routed — prefer routing over asking for clarification.
"""

AGENT_FUNCS = {
    "finance": run_finance_agent,
    "hiring": run_hiring_agent,
    "legal": run_legal_agent,
    "gtm": run_gtm_agent,
    "research": run_research_agent,
}

AGENT_DISPLAY_NAMES = {
    "finance": "Finance Agent",
    "hiring": "Hiring Agent",
    "legal": "Legal Agent",
    "gtm": "GTM Agent",
    "research": "Research Agent",
}


class OrchestratorState(TypedDict):
    query: str
    relevant_agents: List[str]
    needs_clarification: bool
    clarifying_question: Optional[str]
    agent_responses: List[Dict[str, Any]]


async def classify_node(state: OrchestratorState) -> OrchestratorState:
    raw = await call_llm(CLASSIFY_SYSTEM, state["query"])
    data = parse_json_response(raw)
    agents = [a for a in data.get("relevant_agents", []) if a in AGENT_FUNCS]
    return {
        **state,
        "relevant_agents": agents,
        "needs_clarification": bool(data.get("needs_clarification", False)) and not agents,
        "clarifying_question": data.get("clarifying_question"),
    }


def route_after_classify(state: OrchestratorState) -> str:
    return "clarify" if state["needs_clarification"] else "dispatch"


async def dispatch_node(state: OrchestratorState) -> OrchestratorState:
    agents = state["relevant_agents"] or ["research"]
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
                    "message": f"This agent hit an error and couldn't respond: {result}",
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
    initial: OrchestratorState = {
        "query": query,
        "relevant_agents": [],
        "needs_clarification": False,
        "clarifying_question": None,
        "agent_responses": [],
    }
    return await _GRAPH.ainvoke(initial)
