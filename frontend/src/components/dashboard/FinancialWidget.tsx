import { useEffect, useState } from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';
import { fetchFinanceSnapshot, type FinanceSnapshot } from '../../lib/api';

export function FinancialWidget() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinanceSnapshot()
      .then(setSnapshot)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-200 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Financial Pulse
        </h2>
        <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded-full border border-emerald-800/50">
          Live
        </span>
      </div>

      {error && <p className="text-xs text-red-400">Couldn&apos;t load: {error}</p>}

      {!error && !snapshot && (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 h-16" />
          <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 h-16" />
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Runway</div>
            <div className="text-2xl font-bold text-gray-100">
              {snapshot.runway_months} <span className="text-sm font-normal text-gray-500">months</span>
            </div>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Burn Rate</div>
            <div className="text-xl font-bold text-gray-100 flex items-center gap-2">
              ${Math.round(snapshot.burn_rate_usd / 1000)}K <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
