import { useEffect, useState } from 'react';
import { Brain, ArrowRight, ShieldCheck, Activity, CheckSquare } from 'lucide-react';
import { fetchTasks, type PendingApproval } from '../../lib/api';

export function AIOrchestratorPanel() {
  const [tasks, setTasks] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks()
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Brain className="text-blue-400" />
          AI Orchestrator Engine
        </h1>
        <p className="text-xs text-gray-400 mt-1">Central coordination brain that decomposes goals and manages permissions.</p>
      </div>

      {/* Graph Visualizer */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#030307]/30 flex flex-col items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Orchestration Graph Lifecycle</h3>
        
        <div className="flex items-center gap-4 w-full max-w-3xl justify-between text-center">
          <div className="flex flex-col items-center w-28">
            <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shadow-lg shadow-blue-500/5">
              Goal
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-2">Founder Query</span>
            <span className="text-[9px] text-gray-500 mt-0.5">Prompt input</span>
          </div>

          <ArrowRight className="text-gray-600 w-4 h-4" />

          <div className="flex flex-col items-center w-28">
            <div className="w-20 h-20 rounded-full bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-lg shadow-indigo-500/5">
              Classify
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-2">Router Node</span>
            <span className="text-[9px] text-gray-500 mt-0.5">Determine agents</span>
          </div>

          <ArrowRight className="text-gray-600 w-4 h-4" />

          <div className="flex flex-col items-center w-28">
            <div className="w-20 h-20 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs shadow-lg shadow-purple-500/5">
              Dispatch
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-2">Concurrences</span>
            <span className="text-[9px] text-gray-500 mt-0.5">asyncio.gather</span>
          </div>

          <ArrowRight className="text-gray-600 w-4 h-4" />

          <div className="flex flex-col items-center w-28">
            <div className="w-20 h-20 rounded-full bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs shadow-lg shadow-rose-500/5">
              Gate
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-2">Approval Node</span>
            <span className="text-[9px] text-gray-500 mt-0.5">Human-in-the-loop</span>
          </div>

          <ArrowRight className="text-gray-600 w-4 h-4" />

          <div className="flex flex-col items-center w-28">
            <div className="w-20 h-20 rounded-full bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shadow-lg shadow-emerald-500/5">
              Execute
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-2">Update DB</span>
            <span className="text-[9px] text-gray-500 mt-0.5">Integration commit</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Active tasks statuses */}
        <div className="col-span-2 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-[320px]">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            Active Tasks Statuses
          </h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500">Loading tasks...</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {tasks.map((task) => (
                <div key={task.id} className="p-3 bg-[#111221]/50 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-gray-500" />
                    <div>
                      <h4 className="font-semibold text-gray-200">{task.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Agent: {task.agent_name}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${task.status === 'executed' ? 'text-emerald-400 bg-emerald-500/10' : task.status === 'pending' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-gray-400 bg-gray-500/5'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-gray-500 text-center py-12">No current tasks in queue.</div>
              )}
            </div>
          )}
        </div>

        {/* Right: State variables */}
        <div className="col-span-1 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-[320px]">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Safety Gates
          </h3>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#161214]/50 border border-rose-500/15 rounded-xl">
              <span className="font-bold text-rose-400 block mb-1">High Risk Actions</span>
              <p className="text-[10.5px] text-gray-400 leading-normal">
                Hiring candidates, signing contract NDAs, and executing payments always request founder sign-off before committing.
              </p>
            </div>
            <div className="p-3 bg-[#111612]/50 border border-emerald-500/15 rounded-xl">
              <span className="font-bold text-emerald-400 block mb-1">Autonomous Actions</span>
              <p className="text-[10.5px] text-gray-400 leading-normal">
                Resume parsing, lead checks, and runway forecasting run automatically within specialist sandboxes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
