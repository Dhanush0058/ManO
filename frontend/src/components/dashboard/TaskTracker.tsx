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
    <div className="glass-panel rounded-xl flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-purple-400" />
          Approvals & Tasks
        </h2>
        {pending.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-xs font-medium text-red-500 border border-red-500/30">
            {pending.length}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {error && <p className="text-xs text-red-400">Couldn&apos;t load tasks: {error}</p>}

        {!error && pending.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-8 text-gray-500 gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <p className="text-sm">No approvals waiting.</p>
          </div>
        )}

        {pending.map((task) => (
          <div key={task.id} className="bg-red-900/10 border border-red-900/30 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-200">{task.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handle(task.id, 'approve')}
                    disabled={busyId === task.id}
                    className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {busyId === task.id ? 'Working…' : 'Review & Approve'}
                  </button>
                  <button
                    onClick={() => handle(task.id, 'reject')}
                    disabled={busyId === task.id}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors border border-gray-700 disabled:opacity-50"
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
