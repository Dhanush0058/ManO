import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Satellite,
  Brain,
  Coins,
  Megaphone,
  UserCheck,
  Scale,
  PhoneCall,
  ListTodo,
  Blocks,
  BarChart3,
  History,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'spaceos', label: 'SpaceOS Intel', icon: Satellite },
    { id: 'command', label: 'Command Center', icon: LayoutDashboard },
    { id: 'orchestrator', label: 'AI Orchestrator', icon: Brain },
    { id: 'finance', label: 'Finance', icon: Coins, category: 'specialists' },
    { id: 'gtm', label: 'GTM', icon: Megaphone, category: 'specialists' },
    { id: 'hiring', label: 'Hiring', icon: UserCheck, category: 'specialists' },
    { id: 'legal', label: 'Legal', icon: Scale, category: 'specialists' },
    { id: 'voice_calling', label: 'Voice Calling (Twilio)', icon: PhoneCall, category: 'specialists' },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, category: 'management' },
    { id: 'integrations', label: 'Integrations', icon: Blocks, category: 'management' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'management' },
    { id: 'audit_logs', label: 'Audit Log', icon: History, category: 'management' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'system' }
  ];

  return (
    <div
      className={`h-screen shrink-0 bg-[#000000] border-r border-white/10 flex flex-col py-5 transition-all duration-300 ease-in-out z-10 font-sans ${
        collapsed ? 'w-14 px-2' : 'w-60 px-3'
      }`}
    >
      {/* Brand Header */}
      <div className={`-mt-5 mb-5 py-3.5 flex items-center border-b border-white/10 bg-black ${
        collapsed ? '-mx-2 px-2 justify-center' : '-mx-3 px-3.5 justify-between'
      }`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-black text-white tracking-widest uppercase select-none">
              SPACEOS
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white text-black">
              v0.2
            </span>
          </div>
        )}
        {collapsed && (
          <span className="text-[13px] font-black text-white select-none">
            SO
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-zinc-400 hover:text-white w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-900 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Groups in Black and White */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Main Section */}
        <div className="space-y-1">
          {menuItems.filter(item => !item.category).map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-bold transition-all duration-150 ${
                  isSelected
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon size={16} className={isSelected ? 'text-black' : 'text-zinc-400'} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Specialists Section */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase px-3 mb-1.5 font-mono">Specialists</p>
          )}
          <div className="space-y-1">
            {menuItems.filter(item => item.category === 'specialists').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-black' : 'text-zinc-400'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase px-3 mb-1.5 font-mono">Management</p>
          )}
          <div className="space-y-1">
            {menuItems.filter(item => item.category === 'management').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-black' : 'text-zinc-400'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* System Section */}
        <div className="pt-2 border-t border-white/10">
          <div className="space-y-1">
            {menuItems.filter(item => item.category === 'system').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-black' : 'text-zinc-400'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Footer */}
      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded bg-white text-black font-bold flex items-center justify-center text-xs">
            SO
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-white uppercase font-mono">Flight Control</span>
            <span className="text-[10px] text-zinc-400 font-mono">ISTRAC LINK</span>
          </div>
        </div>
      )}
    </div>
  );
}
