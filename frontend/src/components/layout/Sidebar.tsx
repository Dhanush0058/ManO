import { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

const todayThreads = [
  'Can we afford two more hires?',
  'Draft an NDA for a new vendor',
  'Q3 launch timeline options',
];

const yesterdayThreads = [
  'Runway if we cut ad spend 20%',
  "What's our biggest legal exposure?",
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen shrink-0 bg-[#171717] border-r border-[#333333] flex flex-col py-4 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-14 px-2' : 'w-60 px-3'
      }`}
    >
      <div className={`flex items-center mb-4 px-1 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="text-[15px] font-medium text-[#ececec] whitespace-nowrap">Chat</span>}
        <div className={`flex items-center ${collapsed ? '' : 'gap-1'}`}>
          {!collapsed && (
            <button className="text-[#8a8a8a] hover:text-[#ececec]">
              <Search size={15} />
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[#8a8a8a] hover:text-[#ececec] w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#232323]"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      <button
        className={`flex items-center bg-[#ececec] text-[#171717] text-[13px] font-medium rounded-lg py-2 mb-5 hover:bg-white transition-colors ${
          collapsed ? 'justify-center px-0' : 'justify-center gap-1.5'
        }`}
      >
        <Plus size={14} /> {!collapsed && 'New Chat'}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center gap-3">
          {[...todayThreads, ...yesterdayThreads].slice(0, 5).map((t) => (
            <div
              key={t}
              title={t}
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#8a8a8a] hover:bg-[#232323] hover:text-[#ececec] cursor-pointer"
            >
              <MessageSquare size={15} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-[11px] text-[#8a8a8a] px-1 mb-2 whitespace-nowrap">Today</p>
            {todayThreads.map((t) => (
              <p
                key={t}
                className="text-[13px] text-[#a3a3a3] px-1 py-1.5 rounded-md hover:bg-[#232323] hover:text-[#ececec] cursor-pointer truncate"
              >
                {t}
              </p>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-[#8a8a8a] px-1 mb-2 whitespace-nowrap">Yesterday</p>
            {yesterdayThreads.map((t) => (
              <p
                key={t}
                className="text-[13px] text-[#a3a3a3] px-1 py-1.5 rounded-md hover:bg-[#232323] hover:text-[#ececec] cursor-pointer truncate"
              >
                {t}
              </p>
            ))}
          </div>
        </>
      )}

      <div className="flex-1" />

      <div className="w-8 h-8 rounded-full bg-[#3d4a5c] flex items-center justify-center text-xs font-medium shrink-0 mx-auto">
        S
      </div>
    </div>
  );
}
