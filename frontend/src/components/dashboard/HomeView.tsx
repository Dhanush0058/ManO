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
    <div className="flex-1 flex flex-col bg-[#212121] overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="serif-heading text-[17px] text-[#ececec]">ManO</span>
          <span className="text-[10px] font-medium tracking-wide uppercase text-[#e8b14b] bg-[#e8b14b]/10 border border-[#e8b14b]/30 rounded-full px-2 py-0.5">
            Board
          </span>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#171717] bg-[#ececec] rounded-lg px-3 py-1.5 hover:bg-white hover:shadow-md active:scale-[0.96] transition-all duration-150">
          <Plus size={14} /> New Chat
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-10">
        <div
          className="pop-in text-center"
          style={{ '--delay': '0ms' } as React.CSSProperties}
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6fa8e8] to-[#3d6fd1] mx-auto mb-5" />
          <h1 className="serif-heading text-[26px] text-[#ececec] mb-2">
            Hi, there 👋
          </h1>
          <p className="text-[14px] text-[#a3a3a3]">
            Tell us what needs deciding, and we&apos;ll route it to the right desk.
          </p>
        </div>

        {/* Card row */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-3xl">
          <div
            className="pop-in bg-[#171717] border border-[#333333] rounded-xl p-4"
            style={{ '--delay': '120ms' } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#3d4a5c] flex items-center justify-center text-[10px] font-medium">
                F
              </div>
              <span className="text-[13px] text-[#ececec]">Finance Desk</span>
              <span className="ml-auto text-[10px] font-medium text-[#6fcf97] bg-[#6fcf97]/10 rounded-full px-2 py-0.5">
                Active
              </span>
            </div>
            <p className="text-[12px] text-[#a3a3a3] leading-relaxed">
              Watches runway, margins, and burn so you don&apos;t have to ask.
            </p>
          </div>

          <div
            className="pop-in bg-[#171717] border border-[#333333] rounded-xl p-4"
            style={{ '--delay': '220ms' } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-[#8a8a8a]">Tasks</span>
              <span className="text-[11px] text-[#8a8a8a] hover:text-[#ececec] hover:underline active:scale-95 inline-block cursor-pointer transition-all duration-150">
                View All
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t} className="flex items-start gap-2 text-[12px] text-[#d4d4d4]">
                  <FileText size={13} className="mt-0.5 shrink-0 text-[#8a8a8a]" />
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="pop-in bg-[#171717] border border-[#333333] rounded-xl p-4"
            style={{ '--delay': '320ms' } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-[#8a8a8a]">Suggested prompt</span>
              <MoreHorizontal size={14} className="text-[#8a8a8a]" />
            </div>
            <p
              className="text-[12.5px] text-[#d4d4d4] leading-relaxed cursor-pointer hover:text-[#ececec]"
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
              className="flex items-center gap-2 text-[13px] text-[#d4d4d4] border border-[#333333] rounded-full px-4 py-2 hover:bg-[#2a2a2a] hover:border-[#4a4a4a] hover:text-[#ececec] active:scale-[0.95] transition-all duration-150"
            >
              <Icon size={14} className="text-[#8a8a8a]" />
              {label}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div
          className="pop-in w-full max-w-2xl"
          style={{ '--delay': '520ms' } as React.CSSProperties}
        >
          <div className="bg-[#2f2f2f] border border-[#333333] rounded-2xl p-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ask me anything..."
              className="w-full bg-transparent border-none outline-none text-[14px] text-[#ececec] placeholder:text-[#8a8a8a] px-2 pb-3"
            />
            <div className="flex items-center justify-between border-t border-[#3a3a3a] pt-2.5 px-1">
              <button className="flex items-center gap-1.5 text-[11px] text-[#a3a3a3] border border-[#3a3a3a] rounded-full px-3 py-1.5 hover:bg-[#3a3a3a] hover:text-[#ececec] active:scale-[0.96] transition-all duration-150">
                Select Source ⌄
              </button>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg border border-[#3a3a3a] flex items-center justify-center text-[#a3a3a3] hover:bg-[#3a3a3a] hover:text-[#ececec] active:scale-[0.92] transition-all duration-150">
                  <Paperclip size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg border border-[#3a3a3a] flex items-center justify-center text-[#a3a3a3] hover:bg-[#3a3a3a] hover:text-[#ececec] active:scale-[0.92] transition-all duration-150">
                  <Mic size={14} />
                </button>
                <button
                  onClick={submit}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#171717] bg-[#ececec] rounded-lg px-3.5 py-2 hover:bg-white hover:shadow-md active:scale-[0.95] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
                >
                  Send <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#6b6b6b] text-center mt-3">
            ManO may display inaccurate info, so please double check the response.
          </p>
        </div>
      </div>
    </div>
  );
}
