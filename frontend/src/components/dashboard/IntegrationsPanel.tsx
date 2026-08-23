import { useEffect, useState } from 'react';
import { Blocks, RefreshCw, CheckCircle2, Link2 } from 'lucide-react';
import { fetchIntegrations, triggerSeed, type IntegrationItem } from '../../lib/api';

export function IntegrationsPanel() {
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    fetchIntegrations().then(setItems).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      await triggerSeed();
      setMessage('Successfully synchronized with all operational sources.');
      load();
    } catch (err) {
      setMessage('Synchronization failed. Check backend database logs.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Workspace Integrations</h1>
          <p className="text-xs text-gray-400 mt-1">Connect your startup&apos;s external operational tools and databases.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/5 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/10 active:scale-[0.96] transition-all duration-150 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          Sync All Now
        </button>
      </div>

      {message && (
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 rounded-xl">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => {
          const isConnected = item.status === 'Connected';
          return (
            <div key={item.name} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between h-40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConnected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800 border border-white/5'}`}>
                    <Blocks size={16} className={isConnected ? 'text-emerald-400' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                    <p className="text-[10px] text-gray-500">Adapter Integration</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isConnected ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {item.status}
                </span>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span>Sync: {item.last_sync}</span>
                {item.name === 'AI Calling Agent' ? (
                  <button className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold">
                    <Link2 size={12} />
                    Connect
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 size={12} />
                    Active
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
