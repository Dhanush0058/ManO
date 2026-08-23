import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '../../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent?: string;
  text: string;
}

interface TimelineEvent {
  event: string;
  message: string;
  timestamp: string;
}

interface CommandCenterProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

const getAgentTheme = (agentName?: string) => {
  const name = (agentName || '').toLowerCase();
  if (name.includes('finance')) {
    return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', text: '#34d399', badgeBg: 'rgba(16, 185, 129, 0.1)', label: 'Finance' };
  }
  if (name.includes('legal')) {
    return { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.05)', text: '#fb7185', badgeBg: 'rgba(244, 63, 94, 0.1)', label: 'Legal' };
  }
  if (name.includes('gtm')) {
    return { border: '#06b6d4', bg: 'rgba(6, 181, 212, 0.05)', text: '#22d3ee', badgeBg: 'rgba(6, 181, 212, 0.1)', label: 'GTM' };
  }
  if (name.includes('hiring')) {
    return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.05)', text: '#c084fc', badgeBg: 'rgba(168, 85, 247, 0.1)', label: 'Hiring' };
  }
  if (name.includes('research')) {
    return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', text: '#60a5fa', badgeBg: 'rgba(59, 130, 246, 0.1)', label: 'Research' };
  }
  return { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)', text: '#818cf8', badgeBg: 'rgba(99, 102, 241, 0.1)', label: agentName || 'Orchestrator' };
};

export function CommandCenter({ messages, onSendMessage, isLoading }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch dashboard stats
  const loadStats = () => {
    fetchDashboardStats()
      .then(setStats)
      .catch(console.error);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Manage SSE timeline streaming when load starts
  useEffect(() => {
    if (isLoading) {
      setTimelineEvents([]);
      const sseUrl = 'http://127.0.0.1:8000/api/live-events';
      const eventSource = new EventSource(sseUrl);
      
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setTimelineEvents((prev) => [...prev, data]);
        } catch (err) {
          console.error(err);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isLoading, timelineEvents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt);
    }
  };

  // Determine if we have sent any user message yet
  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="flex-grow flex flex-col h-full bg-[#000000]/10 overflow-hidden">
      {/* 1. Startup Overview Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-8 gap-3 p-4 border-b border-white/5 bg-[#020205]/45">
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Cash</span>
            <span className="text-[12px] font-bold text-emerald-400 mt-1 block">₹{stats.cash_balance.toLocaleString()}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Monthly Burn</span>
            <span className="text-[12px] font-bold text-rose-400 mt-1 block">₹{stats.monthly_burn.toLocaleString()}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Runway</span>
            <span className="text-[12px] font-bold text-blue-400 mt-1 block">{stats.runway_months} mos</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Employees</span>
            <span className="text-[12px] font-bold text-white mt-1 block">{stats.employees_count}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Open Positions</span>
            <span className="text-[12px] font-bold text-white mt-1 block">{stats.open_positions}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Leads</span>
            <span className="text-[12px] font-bold text-white mt-1 block">{stats.active_leads}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Customers</span>
            <span className="text-[12px] font-bold text-white mt-1 block">{stats.customers_count}</span>
          </div>
          <div className="glass-panel p-2.5 rounded-xl text-center border-rose-500/10">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Approvals</span>
            <span className="text-[12px] font-bold text-rose-400 mt-1 block">{stats.pending_approvals}</span>
          </div>
        </div>
      )}

      {/* 2. Chat Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5">
        {/* Welcome Dashboard (Before first user search) */}
        {!hasUserMessages && (
          <div className="flex flex-col items-center justify-center py-12 px-6 max-w-2xl mx-auto space-y-6 text-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 animate-pulse blur-md opacity-60" />
              <div className="relative w-12 h-12 rounded-full bg-[#0a0c18] border border-white/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Tell your AI CEO what you want to accomplish...</h1>
              <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                FounderOS is an AI operating system. Provide a high-level goal, and the orchestrator will coordinate specialist agents, retrieve database context, and present plan reports.
              </p>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-3 text-left">
              <button 
                onClick={() => handleSuggestedPrompt("I want to get 20 new gym customers in Hyderabad within 30 days and hire 2 React developers under ₹60,000 per month.")}
                className="glass-panel p-4 rounded-xl border border-white/5 hover:border-blue-500/30 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                <span className="font-semibold text-blue-400 block mb-1">💡 Main Hackathon Demo Goal</span>
                &ldquo;Get 20 customers in Hyderabad + hire 2 React developers under ₹60k/month.&rdquo;
              </button>
              <button 
                onClick={() => handleSuggestedPrompt("Can we afford to hire another developer? Analyze runway impact.")}
                className="glass-panel p-4 rounded-xl border border-white/5 hover:border-purple-500/30 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                <span className="font-semibold text-purple-400 block mb-1">💰 Runway Affordability</span>
                &ldquo;Can we afford to hire another developer? Analyze burn rate impact.&rdquo;
              </button>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {hasUserMessages && messages.map((m) => {
          if (m.role === 'assistant') {
            const theme = getAgentTheme(m.agent);
            return (
              <div key={m.id} className="max-w-[85%] animate-fade-in">
                {m.agent && (
                  <div 
                    className="text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1 px-2.5 py-0.5 rounded-full inline-block border"
                    style={{ 
                      color: theme.text, 
                      backgroundColor: theme.badgeBg, 
                      borderColor: `rgba(${theme.border === '#10b981' ? '16, 185, 129' : theme.border === '#f43f5e' ? '244, 63, 94' : theme.border === '#06b6d4' ? '6, 181, 212' : theme.border === '#a855f7' ? '168, 85, 247' : theme.border === '#3b82f6' ? '59, 130, 246' : '99, 102, 241'}, 0.25)` 
                    }}
                  >
                    {theme.label}
                  </div>
                )}
                <div 
                  className="assistant-bubble text-[13px] text-gray-100 p-4 rounded-2xl rounded-tl-none border-l-4 leading-relaxed"
                  style={{ 
                    borderLeftColor: theme.border,
                    backgroundColor: theme.bg,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          } else {
            return (
              <div key={m.id} className="max-w-[85%] ml-auto animate-fade-in">
                <div className="user-bubble text-[13px] text-white p-3.5 bg-[#1b1e36]/60 rounded-2xl rounded-tr-none border border-white/5 leading-relaxed">
                  {m.text}
                </div>
              </div>
            );
          }
        })}

        {/* 3. Live Execution Timelines (SSE streams) */}
        {isLoading && (
          <div className="glass-panel p-5 rounded-2xl border border-white/5 max-w-[85%] bg-[#080a14]/60 space-y-3.5">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Live Orchestrator Execution Plan Flow
            </h4>
            
            <div className="space-y-2 border-l border-white/5 pl-3">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="text-[11.5px] text-gray-300 flex items-start gap-2.5 animate-fade-in">
                  <span className="text-gray-500 font-mono text-[10px] mt-0.5">{ev.timestamp}</span>
                  <span className="font-semibold text-sky-400 shrink-0">[{ev.event}]</span>
                  <span className="leading-snug text-gray-400">{ev.message}</span>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <div className="text-[11px] text-gray-600 italic">Initializing state graph classify nodes...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Goal Input Composer Form */}
      <div className="p-4 bg-[#020205]/45 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell your AI CEO what you want to accomplish..."
            className="w-full bg-[#0c0e21] border border-white/5 text-gray-100 rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm transition-all placeholder:text-gray-500 shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-500 hover:to-blue-500 active:scale-90 disabled:opacity-30 disabled:active:scale-100 transition-all duration-150 border border-indigo-400/20 shadow-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
