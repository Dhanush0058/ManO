import { useEffect, useState, useCallback } from 'react';
import { ListTodo, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    <div className="glass-panel rounded-2xl flex flex-col h-full z-10">
      <div className="p-4 border-b border-white/5 bg-[#020205]/45 flex items-center justify-between">
        <h2 className="font-semibold text-gray-200 text-sm flex items-center gap-2 tracking-wide">
          <ListTodo className="w-4 h-4 text-purple-400" />
          Approvals & Tasks
        </h2>
        {pending.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-400 border border-rose-500/30">
            {pending.length}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
        {error && <p className="text-xs text-red-400">Couldn&apos;t load tasks: {error}</p>}

        {!error && pending.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 text-gray-600 gap-2.5">
            <CheckCircle2 className="w-8 h-8 text-gray-700 animate-pulse" />
            <p className="text-[13px] font-medium">No approvals waiting.</p>
          </div>
        )}

        {pending.map((task) => (
          <div key={task.id} className="bg-[#1b111e]/40 border border-rose-500/10 p-4 rounded-xl shadow-lg relative overflow-hidden">
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-[13px] font-semibold text-rose-300">{task.title}</h3>
                <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">{task.description}</p>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handle(task.id, 'approve')}
                    disabled={busyId === task.id}
                    className="text-[11.5px] font-semibold px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 disabled:opacity-50 active:scale-[0.96]"
                  >
                    {busyId === task.id ? 'Working…' : 'Review & Approve'}
                  </button>
                  <button
                    onClick={() => handle(task.id, 'reject')}
                    disabled={busyId === task.id}
                    className="text-[11.5px] font-medium px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-400 hover:text-gray-200 rounded-lg transition-all disabled:opacity-50 active:scale-[0.96]"
                  >
                    Reject
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
