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
    <div className="glass-panel rounded-2xl p-5 z-10">
      <div className="flex items-center justify-between mb-4.5">
        <h2 className="font-semibold text-gray-200 text-sm flex items-center gap-2 tracking-wide">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Financial Pulse
        </h2>
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-emerald-950/20 text-emerald-400 rounded-full border border-emerald-500/20">
          Live
        </span>
      </div>

      {error && <p className="text-xs text-red-400">Couldn&apos;t load: {error}</p>}

      {!error && !snapshot && (
        <div className="grid grid-cols-2 gap-3.5 animate-pulse">
          <div className="bg-[#0c0e1a]/80 p-4 rounded-xl border border-white/5 h-20" />
          <div className="bg-[#0c0e1a]/80 p-4 rounded-xl border border-white/5 h-20" />
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-[#0c0e1a]/80 p-4 rounded-xl border border-white/5 border-t-2 border-t-emerald-500/40 shadow-inner flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Runway</div>
            <div className="text-2xl font-bold text-gray-100 mt-auto leading-none">
              {snapshot.runway_months} <span className="text-xs font-medium text-gray-500">months</span>
            </div>
          </div>
          <div className="bg-[#0c0e1a]/80 p-4 rounded-xl border border-white/5 border-t-2 border-t-rose-500/40 shadow-inner flex flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Burn Rate</div>
            <div className="text-2xl font-bold text-gray-100 mt-auto leading-none flex items-baseline gap-1.5">
              ${Math.round(snapshot.burn_rate_usd / 1000)}K 
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 self-center" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
