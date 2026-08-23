import { useEffect, useState } from 'react';
import { 
  Coins, Megaphone, UserCheck, Scale, FileText, 
  User, MapPin 
} from 'lucide-react';
import { 
  fetchDashboardStats, fetchLeads, fetchCandidates, fetchDocuments,
  type DashboardStats, type Lead, type Candidate, type Document 
} from '../../lib/api';

// ==========================================
// 1. FINANCE DESK
// ==========================================
export function FinanceDesk() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="p-6 text-gray-500">Loading Finance Desk data...</div>;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Coins className="text-emerald-400" />
          Finance Specialist Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">Real-time runway auditing, expenses, and burn calculations.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Available Cash</span>
          <h2 className="text-2xl font-bold text-emerald-400 mt-1">₹{stats.cash_balance.toLocaleString()}</h2>
          <p className="text-[11px] text-gray-400 mt-2">Deposited in SQLite local instance.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Monthly Operating Burn</span>
          <h2 className="text-2xl font-bold text-rose-400 mt-1">₹{stats.monthly_burn.toLocaleString()}</h2>
          <p className="text-[11px] text-gray-400 mt-2">Includes payroll, software, and rent.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Projected Runway</span>
          <h2 className="text-2xl font-bold text-blue-400 mt-1">{stats.runway_months} months</h2>
          <p className="text-[11px] text-gray-400 mt-2">Months until company cash reserves exhaust.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Finance Agent Autonomy Permissions</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
            <span className="text-gray-300">read_financial_data</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Allowed</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
            <span className="text-gray-300">calculate_runway</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Allowed</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
            <span className="text-gray-300">generate_forecast</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Allowed</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">execute_payment</span>
            <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Denied (Gate Required)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. GTM DESK
// ==========================================
export function GTMDesk() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchLeads().then(setLeads).catch(console.error);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Megaphone className="text-indigo-400" />
            Go-To-Market Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">Lead scores, conversions, and target gym accounts in CRM.</p>
        </div>
        <span className="text-xs text-gray-500 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-medium">
          Leads Pool: {leads.length} accounts
        </span>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full border-collapse text-left text-xs text-gray-400">
            <thead className="bg-[#0b0c16]/55 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider sticky top-0">
              <tr>
                <th className="p-4">Gym Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4">Lead Status</th>
                <th className="p-4">Core Pain Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent font-medium">
              {leads.slice(0, 40).map((l) => (
                <tr key={l.lead_id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 text-gray-200 font-bold">{l.company_name}</td>
                  <td className="p-4 whitespace-nowrap text-gray-400 flex items-center gap-1">
                    <MapPin size={12} className="text-gray-500" />
                    {l.location}
                  </td>
                  <td className="p-4 whitespace-nowrap text-gray-500">{l.email}</td>
                  <td className="p-4 text-center">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${l.lead_score >= 80 ? 'text-emerald-400 bg-emerald-500/10' : l.lead_score >= 50 ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 bg-gray-500/5'}`}>
                      {l.lead_score}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${l.status === 'qualified' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : l.status === 'contacted' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-gray-400" title={l.pain_point || ''}>{l.pain_point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. HIRING DESK
// ==========================================
export function HiringDesk() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    fetchCandidates().then(setCandidates).catch(console.error);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <UserCheck className="text-purple-400" />
            Hiring Specialist Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">Screening matches, candidate pipelines, and interview profiles.</p>
        </div>
        <span className="text-xs text-gray-500 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-medium">
          Applicants pool: {candidates.length} candidates
        </span>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full border-collapse text-left text-xs text-gray-400">
            <thead className="bg-[#0b0c16]/55 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider sticky top-0">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Skills</th>
                <th className="p-4 text-center">Exp (Yrs)</th>
                <th className="p-4">Exp Salary</th>
                <th className="p-4 text-center">Match</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent font-medium">
              {candidates.slice(0, 30).map((c) => (
                <tr key={c.candidate_id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-gray-200 font-bold flex items-center gap-1">
                        <User size={12} className="text-gray-500" />
                        {c.name}
                      </span>
                      <span className="text-[10px] text-gray-500">{c.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{c.skills}</td>
                  <td className="p-4 text-center text-gray-300 font-bold">{c.experience}</td>
                  <td className="p-4 text-gray-300">₹{c.expected_salary?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${c.match_score >= 85 ? 'text-emerald-400 bg-emerald-500/10' : c.match_score >= 60 ? 'text-yellow-400 bg-yellow-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {c.match_score}%
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${c.status === 'offered' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : c.status === 'interviewed' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : c.status === 'screened' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. LEGAL DESK
// ==========================================
export function LegalDesk() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments().then(setDocs).catch(console.error);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Scale className="text-rose-400" />
          Legal & Compliance Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">Drafting agreements, evaluating risks, and preparing contracts.</p>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="col-span-1 glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 bg-white/5 border-b border-white/5 font-semibold text-gray-200 text-xs tracking-wider uppercase">
            Document Repository
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {docs.map((d) => (
              <button
                key={d.document_id}
                onClick={() => setActiveDoc(d)}
                className={`w-full text-left p-3.5 hover:bg-white/5 transition-colors flex flex-col gap-1 ${activeDoc?.document_id === d.document_id ? 'bg-white/5 border-l-2 border-rose-500' : ''}`}
              >
                <span className="text-xs font-semibold text-gray-200 truncate">{d.title}</span>
                <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                  <span>Type: {d.type}</span>
                  <span className={`font-bold ${d.approval_status === 'signed' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {d.approval_status.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 glass-panel rounded-2xl border border-white/5 flex flex-col h-[400px] bg-[#0c0d21]/30">
          {activeDoc ? (
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{activeDoc.title}</h3>
                  <span className="text-[10px] text-gray-400">Created by: {activeDoc.created_by}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeDoc.approval_status === 'signed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                  Status: {activeDoc.approval_status}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto mt-4 p-4 bg-[#030307]/50 rounded-xl font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                {activeDoc.content}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600 gap-2">
              <FileText size={32} className="text-gray-700" />
              <p className="text-xs font-medium">Select a document from the repository list to review drafts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
