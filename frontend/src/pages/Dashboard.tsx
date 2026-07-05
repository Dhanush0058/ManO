import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { HomeView } from '../components/dashboard/HomeView';
import { CommandCenter } from '../components/dashboard/CommandCenter';
import { FinancialWidget } from '../components/dashboard/FinancialWidget';
import { TaskTracker } from '../components/dashboard/TaskTracker';
import { queryOrchestrator } from '../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent?: string;
  text: string;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: "Hello Founder. I'm ready to coordinate your agents. What do you need?" },
  ]);
  const [hasQueried, setHasQueried] = useState(false);

  const handleSendMessage = async (msg: string) => {
    setIsLoading(true);
    setHasQueried(true);

    const processingId = Date.now().toString();

    setMessages((prev) => [...prev, { id: `${processingId}-user`, role: 'user', text: msg }]);

    try {
      const data = await queryOrchestrator(msg);

      // Every agent response is already real and complete by the time the
      // request resolves — this stagger is purely a display animation
      // (matching the pop-in style used elsewhere), not simulated latency.
      data.agent_responses.forEach((resp, idx) => {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `${processingId}-msg-${idx}`,
              role: 'assistant',
              agent: resp.agent_name,
              text: resp.message,
            },
          ]);
        }, idx * 150);
      });
    } catch (error) {
      const errorText = `Failed: ${error instanceof Error ? error.message : 'unknown error'}`;

      setMessages((prev) => [
        ...prev,
        { id: `${processingId}-error`, role: 'assistant', text: errorText },
      ]);
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
        <div className="flex-1 h-full min-h-0 grid grid-cols-3 gap-4 p-4 overflow-hidden">
          <div className="col-span-2 h-full">
            <CommandCenter messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
          <div className="col-span-1 h-full flex flex-col gap-4 overflow-y-auto">
            <FinancialWidget />
            <div className="flex-1 min-h-[220px]">
              <TaskTracker />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
