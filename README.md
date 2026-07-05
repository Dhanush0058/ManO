# ManO

An AI agent-staff platform for startup founders. A founder asks a question or
states a goal; an orchestrator agent figures out which specialist agents
(Finance, Hiring, Legal, GTM, Research) should weigh in, runs them concurrently,
and gates any real-world action (sending an email, signing a document, moving
money) behind a founder approval step before anything executes.

This is a working implementation of that loop — verified end-to-end in
development, described honestly below.

## Quick start

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and paste in a real ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for interactive API docs.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`.

You need both running at once, in separate terminals.

## What's genuinely real here

- **The orchestrator is a real LangGraph state machine** (`backend/app/agents/orchestrator.py`):
  a `classify` node reads the founder's query and decides which specialist
  agents are relevant, with a conditional edge that routes to a `clarify`
  node instead if the query is too vague to route. A `dispatch` node then
  calls the relevant specialists **concurrently** via `asyncio.gather`, and
  keeps working even if one agent fails (a broken agent doesn't take down
  the whole request — tested).
- **Each specialist agent makes a real LLM call** (Anthropic's Messages API,
  called directly via `httpx` — no key baked in, you provide your own).
  Each has its own system prompt matching its role and returns structured
  JSON so the orchestrator knows whether an action needs approval.
- **The approval gate is real and persisted.** When an agent's action would
  send something external or move money, it's written to a SQLite database
  as a pending approval — not executed. `TaskTracker` in the UI polls for
  these, and Approve/Reject actually hit the backend and change real rows.
- **The audit log is real** — every agent response and every founder
  approve/reject decision is appended to an `audit_log` table.
- **The whole pipeline was tested**, not just written: a smoke test exercises
  every endpoint (with the LLM call mocked, since I don't have your API key)
  including the approval-creation → list → approve → mock-execute flow, plus
  the clarification branch and a simulated agent failure. The frontend was
  actually `npm install`-ed, type-checked (`tsc -b`, zero errors under your
  strict config), linted (`oxlint`, zero warnings), and production-built
  (`vite build`) — not just eyeballed.

## What's simplified or mocked (and why)

The pitch deck's architecture diagram includes several things a real
fundraise-stage product would have that don't make sense to fake for a
first working build:

- **Database: SQLite, not PostgreSQL.** Same SQLAlchemy models either way —
  swap `DATABASE_URL` in `.env` to a real Postgres URL and it works
  unchanged. SQLite means this runs with zero infra setup.
  Vector DB (ChromaDB/pgvector) for RAG isn't included at all — there's no
  domain-document corpus yet to retrieve from, so it would be empty
  scaffolding with nothing real to point at.
- **No real tool execution.** `backend/app/agents/tools.py` has mock
  functions standing in for sending an email, signing a document, or
  moving money — they return a string describing what *would* happen. No
  Gmail API, e-signature, or Plaid integration is wired up. This is the
  main thing to build next, and the approval flow is already structured so
  a real integration slots into `tools.py` without touching anything else.
- **No HashiCorp Vault, Docker/Kubernetes.** Those are deployment/infra
  concerns for when this is running in production with real credentials
  and real traffic — premature for a local working build.
- **Finance Pulse numbers are seeded, not computed.** The `/api/finance/snapshot`
  endpoint is real and the widget genuinely fetches from it, but the
  underlying runway/burn figures are placeholder values (matching the
  deck's own example numbers) — there's no bank connection to compute them
  from yet.
- **No real-time WebSocket streaming**, despite the architecture diagram
  showing it. Agent responses come back as one REST response once all
  agents finish, then reveal in the UI with a short staggered animation
  (150ms apart) — that stagger is cosmetic, not simulated latency. True
  per-agent streaming (showing "Finance Agent is thinking..." the instant
  it starts, not just when it finishes) is a reasonable next step and would
  use the same `dispatch_node` logic, just pushed over a WebSocket instead
  of returned all at once — flagging it now so you know it's a deliberate
  scope cut, not an oversight.

## Project structure

```
backend/
  app/
    main.py                 FastAPI app, mounts all routers + CORS
    config.py                Loads .env (API key, model, DB URL, CORS origins)
    agents/
      orchestrator.py         The LangGraph state machine described above
      llm.py                   Shared Anthropic API call + robust JSON parsing
      finance_agent.py, hiring_agent.py, legal_agent.py,
      gtm_agent.py, research_agent.py    One system prompt each
      tools.py                 Mock tool-execution layer (see above)
    api/
      orchestrator.py          POST /api/orchestrator/query
      tasks.py                  GET /api/tasks, POST .../approve, .../reject
      finance.py                 GET /api/finance/snapshot
      agents.py                   GET /api/agents
      health.py                    GET /api/health
    models/
      database.py               SQLAlchemy models + session
      schemas.py                 Pydantic request/response shapes
  requirements.txt
  .env.example

frontend/
  src/
    pages/Dashboard.tsx        Top-level layout, owns the orchestrator call
    components/layout/Sidebar.tsx
    components/dashboard/
      HomeView.tsx              Landing screen (before first query)
      CommandCenter.tsx          Chat input (active-session view)
      AgentFeed.tsx               Live feed of agent activity
      FinancialWidget.tsx          Fetches /api/finance/snapshot
      TaskTracker.tsx               Fetches /api/tasks, Approve/Reject buttons
    lib/api.ts                  All backend calls go through here
```

## A note on the ANTHROPIC_API_KEY

Nothing in this build works without one — get a key at
[console.anthropic.com](https://console.anthropic.com/) and put it in
`backend/.env`. The default model is `claude-sonnet-5`; swap to
`claude-haiku-4-5-20251001` in `.env` if you want faster/cheaper responses
while you're iterating.
