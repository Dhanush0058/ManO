import { useState } from 'react';
import {
  Plus,
  Paperclip,
  Mic,
  ArrowUp,
  FileText,
  MoreHorizontal,
  Calendar,
  ListChecks,
  Blocks,
  StickyNote,
  Bot,
} from 'lucide-react';

interface HomeViewProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

const tasks = [
  'Reconcile last month\u2019s P&L',
  'Flag contracts renewing this quarter',
  'Draft the Q3 hiring plan',
];

const quickActions = [
  { icon: Calendar, label: 'Connect Calendar' },
  { icon: ListChecks, label: 'Demo Task' },
  { icon: Blocks, label: 'Browse Integrations' },
  { icon: StickyNote, label: 'Shared in Notes' },
];

export function HomeView({ onSendMessage, isLoading }: HomeViewProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setValue('');
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-y-auto z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0a0c18]/25 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="serif-heading text-[19px] text-white">ManO</span>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#e8b14b] bg-[#e8b14b]/10 border border-[#e8b14b]/20 rounded-full px-2 py-0.5">
            Board
          </span>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 hover:border-white/20 active:scale-[0.96] transition-all duration-150">
          <Plus size={14} /> New Chat
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-12">
        <div
          className="pop-in text-center"
          style={{ '--delay': '0ms' } as React.CSSProperties}
        >
          {/* Animated Glowing Avatar */}
          <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 animate-pulse blur-md opacity-60" />
            <div className="relative w-14 h-14 rounded-full bg-[#0a0c18] border border-white/10 flex items-center justify-center">
              <Bot className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h1 className="serif-heading text-[32px] text-white mb-2">
            Welcome, Founder 👋
          </h1>
          <p className="text-[14px] text-gray-400 max-w-md mx-auto">
            Tell us what needs deciding, and we&apos;ll route it to the right specialist desk.
          </p>
        </div>

        {/* Card row */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
          <div
            className="pop-in glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-indigo-500/5 duration-300 transition-all cursor-pointer"
            style={{ '--delay': '120ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/20 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                F
              </div>
              <span className="text-[13px] font-semibold text-gray-200">Finance Desk</span>
              <span className="ml-auto text-[9px] font-bold tracking-wider uppercase text-[#6fcf97] bg-[#6fcf97]/10 border border-[#6fcf97]/20 rounded-full px-2 py-0.5">
                Active
              </span>
            </div>
            <p className="text-[12px] text-gray-400 leading-relaxed">
              Watches runway, margins, and burn so you don&apos;t have to ask.
            </p>
          </div>

          <div
            className="pop-in glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-indigo-500/5 duration-300 transition-all cursor-pointer"
            style={{ '--delay': '220ms' } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tasks</span>
              <span className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline active:scale-95 inline-block cursor-pointer transition-all duration-150">
                View All
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12px] text-gray-300">
                  <FileText size={13} className="mt-0.5 shrink-0 text-gray-500" />
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="pop-in glass-panel rounded-2xl p-5 hover:-translate-y-1 hover:shadow-indigo-500/5 duration-300 transition-all cursor-pointer"
            style={{ '--delay': '320ms' } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Suggested prompt</span>
              <MoreHorizontal size={14} className="text-gray-500" />
            </div>
            <p
              className="text-[13px] text-gray-300 leading-relaxed cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => onSendMessage('What are the key financial risks in our current runway?')}
            >
              What are the key financial risks in our current runway?
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="pop-in flex flex-wrap justify-center gap-2.5"
          style={{ '--delay': '420ms' } as React.CSSProperties}
        >
          {quickActions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 text-[13px] text-gray-300 bg-white/5 border border-white/5 rounded-full px-4 py-2 hover:bg-white/10 hover:border-white/10 hover:text-white active:scale-[0.95] hover:shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all duration-150"
            >
              <Icon size={14} className="text-gray-500" />
              {label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div
          className="pop-in w-full max-w-2xl"
          style={{ '--delay': '520ms' } as React.CSSProperties}
        >
          <div className="glass-panel rounded-2xl p-4 shadow-2xl focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all duration-200">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ask me anything..."
              className="w-full bg-transparent border-none outline-none text-[14px] text-gray-100 placeholder:text-gray-500 px-2 pb-3.5"
            />
            <div className="flex items-center justify-between border-t border-white/5 pt-3.5 px-1">
              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 border border-white/5 bg-white/5 rounded-full px-3.5 py-1.5 hover:bg-white/10 hover:text-gray-200 active:scale-[0.96] transition-all duration-150">
                Select Source ⌄
              </button>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-gray-200 active:scale-[0.92] transition-all duration-150">
                  <Paperclip size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-gray-200 active:scale-[0.92] transition-all duration-150">
                  <Mic size={14} />
                </button>
                <button
                  onClick={submit}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg px-4 py-2 hover:from-indigo-500 hover:to-blue-500 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.95] transition-all duration-150 border border-indigo-400/20 disabled:opacity-50 disabled:active:scale-100"
                >
                  Send <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-3.5">
            ManO may display inaccurate info, so please double check the response.
          </p>
        </div>
      </div>
    </div>
  );
}
