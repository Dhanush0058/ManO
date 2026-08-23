import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { fetchLeads, fetchCandidates, fetchDashboardStats, type Lead, type Candidate, type DashboardStats } from '../../lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchLeads(), fetchCandidates()])
      .then(([s, l, c]) => {
        setStats(s);
        setLeads(l);
        setCandidates(c);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Loading analytics metrics...
      </div>
    );
  }

  // 1. Process Lead Funnel Data
  const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const leadFunnelData = leadStatuses.map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    Count: leads.filter((l) => l.status === status).length
  }));

  // 2. Process Candidates Match Scores Data
  const candidateScores = [
    { name: '90%+ Match', value: candidates.filter((c) => c.match_score >= 90).length },
    { name: '80-89% Match', value: candidates.filter((c) => c.match_score >= 80 && c.match_score < 90).length },
    { name: '70-79% Match', value: candidates.filter((c) => c.match_score >= 70 && c.match_score < 80).length },
    { name: '<70% Match', value: candidates.filter((c) => c.match_score < 70).length }
  ].filter((item) => item.value > 0);

  // 3. Process Runway Forecast Data
  const runwayMonths = Math.ceil(stats.runway_months) || 6;
  const forecastData = Array.from({ length: runwayMonths + 1 }).map((_, idx) => {
    const projectedCash = Math.max(0, stats.cash_balance - idx * stats.monthly_burn);
    return {
      month: `M+${idx}`,
      Cash: projectedCash
    };
  });

  // 4. Expense Breakdown
  const expenseData = [
    { name: 'Payroll', value: stats.monthly_burn * 0.5 },
    { name: 'Marketing', value: stats.monthly_burn * 0.25 },
    { name: 'Software/Cloud', value: stats.monthly_burn * 0.15 },
    { name: 'Office Space', value: stats.monthly_burn * 0.1 }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-wide">Workspace Analytics</h1>
        <p className="text-xs text-gray-400 mt-1">Real-time performance graphs compiled from company databases.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500">Runway</span>
            <h3 className="text-lg font-bold text-white">{stats.runway_months} months</h3>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <TrendingUp className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500">Monthly Burn</span>
            <h3 className="text-lg font-bold text-white">₹{stats.monthly_burn.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Users className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500">Active Leads</span>
            <h3 className="text-lg font-bold text-white">{leads.length}</h3>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#e8b14b]/10 border border-[#e8b14b]/20 flex items-center justify-center">
            <BarChart3 className="text-[#e8b14b] w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500">Open Roles</span>
            <h3 className="text-lg font-bold text-white">{stats.open_positions} open</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lead acquisition funnel */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-80">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Lead Funnel Distribution
          </h3>
          <div className="flex-1 min-h-0 text-[11px] text-gray-400">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1123', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Bar dataKey="Count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Runway Forecast */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-80">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Cash Runway Forecast (Burn Rate: ₹{stats.monthly_burn.toLocaleString()}/mo)
          </h3>
          <div className="flex-1 min-h-0 text-[11px] text-gray-400">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1123', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="Cash" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matches Score Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-80">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            Candidate Matching Scores
          </h3>
          <div className="flex-1 min-h-0 flex items-center text-[11px] text-gray-400">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={candidateScores}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {candidateScores.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1123', borderColor: 'rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-4">
              {candidateScores.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-300 font-medium">{entry.name}:</span>
                  <span className="text-white font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-80">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#e8b14b]" />
            Monthly Expense Distribution
          </h3>
          <div className="flex-1 min-h-0 flex items-center text-[11px] text-gray-400">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1123', borderColor: 'rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-4">
              {expenseData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                  <span className="text-gray-300 font-medium">{entry.name}:</span>
                  <span className="text-white font-bold">₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
