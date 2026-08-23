const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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

export interface DashboardStats {
  cash_balance: number;
  monthly_burn: number;
  runway_months: number;
  employees_count: number;
  open_positions: number;
  active_leads: number;
  customers_count: number;
  pending_approvals: number;
  active_tasks: number;
}

export interface Lead {
  lead_id: number;
  company_name: string;
  industry: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  lead_score: number;
  status: string;
  pain_point: string | null;
  last_contacted: string | null;
}

export interface Candidate {
  candidate_id: number;
  name: string;
  email: string;
  phone: string | null;
  skills: string | null;
  experience: number | null;
  expected_salary: number | null;
  location: string | null;
  resume: string | null;
  status: string;
  match_score: number;
}

export interface Document {
  document_id: number;
  type: string;
  title: string;
  content: string | null;
  status: string;
  created_by: string | null;
  approval_status: string;
}

export interface AuditLog {
  log_id: number;
  timestamp: string;
  agent: string;
  action: string;
  input: string | null;
  output: string | null;
  status: string;
}

export interface IntegrationItem {
  name: string;
  status: 'Connected' | 'Not Connected';
  last_sync: string;
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

// --- Extended endpoints ---

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/api/dashboard/stats`);
  return handle<DashboardStats>(res);
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(`${BASE_URL}/api/leads`);
  return handle<Lead[]>(res);
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${BASE_URL}/api/candidates`);
  return handle<Candidate[]>(res);
}

export async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${BASE_URL}/api/documents`);
  return handle<Document[]>(res);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${BASE_URL}/api/audit-logs`);
  return handle<AuditLog[]>(res);
}

export async function fetchMode(): Promise<{ mode: string }> {
  const res = await fetch(`${BASE_URL}/api/settings/mode`);
  return handle<{ mode: string }>(res);
}

export async function updateMode(mode: 'live' | 'demo'): Promise<{ mode: string }> {
  const res = await fetch(`${BASE_URL}/api/settings/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  return handle<{ mode: string }>(res);
}

export async function fetchIntegrations(): Promise<IntegrationItem[]> {
  const res = await fetch(`${BASE_URL}/api/integrations`);
  return handle<IntegrationItem[]>(res);
}

export async function triggerSeed(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/database/seed`, { method: 'POST' });
  return handle<{ status: string; message: string }>(res);
}
