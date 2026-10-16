import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { fetchTasks, approveTask, rejectTask, type PendingApproval } from '../../lib/api';

export function TaskTracker() {
  const [tasks, setTasks] = useState<PendingApproval[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchTasks()
      .then(setTasks)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const pending = tasks.filter((t) => t.status === 'pending');

  const handle = async (id: number, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      if (action === 'approve') {
        await approveTask(id);
      } else {
        await rejectTask(id);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-2xl flex flex-col h-full shadow-xs z-10 overflow-hidden">
      <div className="p-4 border-b border-[#E5E5E7] bg-[#FAFAFC] flex items-center justify-between">
        <h2 className="font-bold text-[#1E1E24] text-sm flex items-center gap-2 tracking-wide uppercase">
          <ShieldAlert className="w-4 h-4 text-[#F27A30]" />
          Flight Operations Approvals
        </h2>
        {pending.length > 0 && (
          <span className="flex h-5 px-2 items-center justify-center rounded-full bg-[#FFF4ED] text-[10px] font-bold text-[#C85006] border border-[#F27A30]/30 font-mono">
            {pending.length} ACTION REQUIRED
          </span>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
        {error && <p className="text-xs text-red-500">Couldn&apos;t load approvals: {error}</p>}

        {!error && pending.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 text-[#6E6E73] gap-2.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
            <p className="text-[13px] font-medium text-[#1E1E24]">All mission operator actions approved.</p>
            <p className="text-xs text-[#6E6E73]">Constellation in nominal automated orbit tracking.</p>
          </div>
        )}

        {pending.map((task) => (
          <div key={task.id} className="bg-[#F4F4F6] border border-[#E5E5E7] p-4 rounded-xl shadow-xs hover:border-[#F27A30]/40 transition-all">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[#F27A30] mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-bold text-[#1E1E24]">{task.title}</h3>
                  <span className="text-[10px] font-mono font-bold bg-[#FFF4ED] text-[#C85006] border border-[#F27A30]/30 px-1.5 py-0.5 rounded uppercase">
                    {task.agent_name || 'MISSION AGENT'}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#6E6E73] mt-1 leading-relaxed">{task.description}</p>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handle(task.id, 'approve')}
                    disabled={busyId === task.id}
                    className="btn-orange text-[11.5px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs disabled:opacity-50 active:scale-[0.96] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{busyId === task.id ? 'Authorizing…' : 'Review & Approve'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    onClick={() => handle(task.id, 'reject')}
                    disabled={busyId === task.id}
                    className="btn-secondary text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 active:scale-[0.96] cursor-pointer"
                  >
                    Hold Action
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
