import { Activity, CheckCircle2, Clock } from 'lucide-react';

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'success' | 'running';
  time: string;
}

export function AgentFeed({ activities }: { activities: AgentActivity[] }) {
  return (
    <div className="glass-panel rounded-xl h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
        <Activity className="text-green-400 w-5 h-5" />
        <h2 className="font-semibold text-gray-200">Live Agent Feed</h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 text-sm">
            <div className="mt-1">
              {activity.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {activity.status === 'running' && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
              {activity.status === 'pending' && <Clock className="w-4 h-4 text-gray-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-400">{activity.agent}</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              <p className="text-gray-300 mt-0.5">{activity.action}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-gray-500 text-center py-8 text-sm">
            No active agent tasks.
          </div>
        )}
      </div>
    </div>
  );
}
