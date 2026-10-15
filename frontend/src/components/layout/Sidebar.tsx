import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
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
      className={`h-screen shrink-0 bg-[#030307]/95 border-r border-white/5 flex flex-col py-5 transition-all duration-300 ease-in-out z-10 ${
        collapsed ? 'w-14 px-2' : 'w-60 px-3'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center mb-6 px-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="founder-brand-card flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200">
            <span className="serif-heading text-[15px] font-extrabold text-white tracking-wide">FounderOS</span>
            <span className="badge-beta text-[9px] font-bold text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 rounded px-1.5 py-0.5">
              Beta
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-500 hover:text-gray-200 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Main Section */}
        <div className="space-y-0.5">
          {menuItems.filter(item => !item.category).map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                }`}
                title={item.label}
              >
                <Icon size={16} className={isSelected ? 'text-blue-400' : 'text-gray-500'} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Specialists Section */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-600 tracking-wider uppercase px-3 mb-1.5">Specialists</p>
          )}
          <div className="space-y-0.5">
            {menuItems.filter(item => item.category === 'specialists').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-gray-500'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-600 tracking-wider uppercase px-3 mb-1.5">Management</p>
          )}
          <div className="space-y-0.5">
            {menuItems.filter(item => item.category === 'management').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-purple-600/10 text-purple-400 border-l-2 border-purple-500'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-purple-400' : 'text-gray-500'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* System Section */}
        <div className="pt-2 border-t border-white/5">
          <div className="space-y-0.5">
            {menuItems.filter(item => item.category === 'system').map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isSelected
                      ? 'bg-gray-800 text-gray-200 border-l-2 border-gray-500'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isSelected ? 'text-gray-200' : 'text-gray-500'} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile Footer */}
      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 border border-indigo-400/20 flex items-center justify-center text-xs font-semibold text-white shadow-md">
            MO
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-gray-300">ManO Workspace</span>
            <span className="text-[10px] text-gray-500">Synthetic Data</span>
          </div>
        </div>
      )}
    </div>
  );
}
