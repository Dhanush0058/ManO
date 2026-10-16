import { Satellite, Activity, Radio } from 'lucide-react';

export function FinancialWidget() {
  return (
    <div className="bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs z-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#1E1E24] text-sm flex items-center gap-2 tracking-wide uppercase">
          <Satellite className="w-4 h-4 text-[#F27A30]" />
          Orbital Telemetry Pulse
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {/* Metric 1: Monitored Constellation */}
        <div className="bg-[#F4F4F6] p-4 rounded-xl border border-[#E5E5E7] border-t-2 border-t-[#F27A30] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] mb-1">
            Active Spacecraft
          </div>
          <div className="text-2xl font-black text-[#1E1E24] font-mono leading-none my-1">
            4 <span className="text-xs font-semibold text-[#6E6E73] font-sans">Satellites</span>
          </div>
          <div className="text-[10px] font-medium text-[#6E6E73] truncate" title="Cartosat-3, RISAT-2BR1, GSAT-7A, CartoSat-1">
            Cartosat-3 • RISAT • GSAT
          </div>
        </div>

        {/* Metric 2: Constellation Health */}
        <div className="bg-[#F4F4F6] p-4 rounded-xl border border-[#E5E5E7] border-t-2 border-t-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6E6E73] mb-1">
            Telemetry Envelope
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono leading-none my-1 flex items-baseline gap-1.5">
            98.4% 
            <Activity className="w-3.5 h-3.5 text-emerald-600 self-center" />
          </div>
          <div className="text-[10px] font-medium text-emerald-700">
            Nominal Kalman Baseline
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="pt-2 border-t border-[#F4F4F6] flex items-center justify-between text-[11px] font-mono text-[#6E6E73]">
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-[#F27A30]" />
          ISTRAC Ground Link: 42 ms
        </span>
        <span className="text-[#C85006] font-semibold">4 Channels Locked</span>
      </div>
    </div>
  );
}
