const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface AgentResponse {
  agent_name: string;
  message: string;
}

export interface PendingApproval {
  id: number;
  agent_name: string;
  action_type: string;
  title: string;
  description: string;
  status: 'pending' | 'executed' | 'rejected';
  result: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface OrchestratorResult {
  agent_responses: AgentResponse[];
  pending_approvals: PendingApproval[];
}

export interface FinanceSnapshot {
  runway_months: number;
  burn_rate_usd: number;
  updated_at: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function queryOrchestrator(query: string): Promise<OrchestratorResult> {
  const res = await fetch(`${BASE_URL}/api/orchestrator/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return handle<OrchestratorResult>(res);
}

export async function fetchTasks(): Promise<PendingApproval[]> {
  const res = await fetch(`${BASE_URL}/api/tasks`);
  return handle<PendingApproval[]>(res);
}

export async function approveTask(id: number): Promise<PendingApproval> {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}/approve`, { method: 'POST' });
  return handle<PendingApproval>(res);
}

export async function rejectTask(id: number): Promise<PendingApproval> {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}/reject`, { method: 'POST' });
  return handle<PendingApproval>(res);
}

export async function fetchFinanceSnapshot(): Promise<FinanceSnapshot> {
  const res = await fetch(`${BASE_URL}/api/finance/snapshot`);
  return handle<FinanceSnapshot>(res);
}
