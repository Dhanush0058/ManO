import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { HomeView } from '../components/dashboard/HomeView';
import { CommandCenter } from '../components/dashboard/CommandCenter';
import { AgentFeed } from '../components/dashboard/AgentFeed';
import { FinancialWidget } from '../components/dashboard/FinancialWidget';
import { TaskTracker } from '../components/dashboard/TaskTracker';
import { queryOrchestrator } from '../lib/api';

interface Activity {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'success' | 'running';
  time: string;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const handleSendMessage = async (msg: string) => {
    setIsLoading(true);
    setHasQueried(true);

    const processingId = Date.now().toString();
    setActivities((prev) => [
      {
        id: processingId,
        agent: 'Orchestrator',
        action: `Processing query: "${msg}"`,
        status: 'running',
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    try {
      const data = await queryOrchestrator(msg);

      setActivities((prev) => prev.filter((a) => a.id !== processingId));

      // Every agent response is already real and complete by the time the
      // request resolves — this stagger is purely a display animation
      // (matching the pop-in style used elsewhere), not simulated latency.
      data.agent_responses.forEach((resp, idx) => {
        setTimeout(() => {
          setActivities((prev) => [
            {
              id: `${processingId}-${idx}`,
              agent: resp.agent_name,
              action: resp.message,
              status: 'success',
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }, idx * 150);
      });
    } catch (error) {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === processingId
            ? { ...a, status: 'pending', action: `Failed: ${error instanceof Error ? error.message : 'unknown error'}` }
            : a
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececec]">
      <Sidebar />

      {!hasQueried ? (
        <HomeView onSendMessage={handleSendMessage} isLoading={isLoading} />
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
          <div className="col-span-2 h-full">
            <CommandCenter onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
          <div className="col-span-1 h-full flex flex-col gap-4 overflow-y-auto">
            <FinancialWidget />
            <div className="flex-1 min-h-[220px]">
              <TaskTracker />
            </div>
            <div className="flex-1 min-h-[220px]">
              <AgentFeed activities={activities} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
