import { 
  Scan, ShieldAlert, ShieldCheck, FileSpreadsheet, 
  Satellite, Activity, AlertTriangle, CheckCircle, Mail, MapPin
} from 'lucide-react';
import type { SpaceAnomaly } from '../../lib/anomalies';

interface DeskProps {
  activeAnomaly?: SpaceAnomaly | null;
}

// ==========================================
// 1. DETECTION ANALYSIS AGENT DESK
// ==========================================
export function DetectionAgentDesk({ activeAnomaly }: DeskProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Scan className="text-blue-400" />
            Detection Analysis Agent Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Continuous raw orbital telemetry monitoring, Z-score envelope verification, and Kalman filter deviation detection.
          </p>
        </div>
        {activeAnomaly && (
          <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            LIVE ANOMALY CORRELATION ACTIVE
          </span>
        )}
      </div>

      {/* Active Anomaly Evidence Spotlight */}
      {activeAnomaly && (
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-950/20 via-black/40 to-transparent flex flex-col md:flex-row gap-5 items-start">
          <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden border border-orange-500/50 shrink-0 relative shadow-lg shadow-orange-950/30">
            <img src={activeAnomaly.image} alt={activeAnomaly.title} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-orange-300 border border-white/10">
              FRAME EVIDENCE
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded">
                σ = {activeAnomaly.deviationSigma} DEVIATION
              </span>
              <span className="text-xs font-mono text-gray-300 font-bold">{activeAnomaly.spacecraft} (NORAD #{activeAnomaly.noradId})</span>
            </div>
            <h2 className="text-base font-bold text-white">{activeAnomaly.title}</h2>
            <p className="text-xs text-gray-300 leading-relaxed">{activeAnomaly.detectionSummary}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px] uppercase">SENSOR METRIC</span>
                <span className="text-white font-bold">{activeAnomaly.metric}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px] uppercase">OBSERVED VALUE</span>
                <span className="text-rose-400 font-bold">{activeAnomaly.observedValue}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px] uppercase">EXPECTED BASELINE</span>
                <span className="text-emerald-400 font-bold">{activeAnomaly.expectedBaseline}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Monitored Spacecraft</span>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">4 Satellites</h2>
          <p className="text-[11px] text-gray-400 mt-1">CartoSat-1, RISAT-2BR1, GSAT-7A, Cartosat-3</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Stream Ingestion Rate</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">42 ms</h2>
          <p className="text-[11px] text-gray-400 mt-1">Continuous ISRO telemetry stream active</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Telemetry Envelopes</span>
          <h2 className="text-2xl font-bold text-blue-400 font-mono mt-1">6 Channels</h2>
          <p className="text-[11px] text-gray-400 mt-1">Altitude, Solar, Battery, SNR, Thermal, Jitter</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Logged Detections</span>
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">
            {activeAnomaly ? '4 Events' : '3 Events'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Multi-agent incident corroboration online</p>
        </div>
      </div>

      {/* Detection Engine Logs */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Live Spacecraft Detection Streams
          </h3>
          <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            DETECTOR ONLINE
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {activeAnomaly && (
            <div className="p-3 bg-orange-950/30 rounded-xl border border-orange-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Satellite className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="font-bold text-white">{activeAnomaly.spacecraft}</span>
                  <span className="text-gray-400 ml-2 font-mono">NORAD #{activeAnomaly.noradId}</span>
                  <p className="text-[11px] text-orange-300">{activeAnomaly.title}: {activeAnomaly.metric} = {activeAnomaly.observedValue}</p>
                </div>
              </div>
              <span className="text-orange-400 font-bold font-mono px-2 py-0.5 bg-orange-500/10 rounded border border-orange-500/20">
                σ = {activeAnomaly.deviationSigma} ACTIVE ANOMALY
              </span>
            </div>
          )}

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Satellite className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-bold text-white">Cartosat-3</span>
                <span className="text-gray-400 ml-2 font-mono">NORAD #44804</span>
                <p className="text-[11px] text-gray-400">Solar Array Bus Output: 840 W (Expected: 1850 - 2100 W)</p>
              </div>
            </div>
            <span className="text-yellow-400 font-bold font-mono px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
              σ = 4.2 DEVIATION
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Satellite className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-bold text-white">RISAT-2BR1</span>
                <span className="text-gray-400 ml-2 font-mono">NORAD #44857</span>
                <p className="text-[11px] text-gray-400">Gyro Pointing Jitter: 2.45 deg variance (Expected: &lt; 0.08 deg)</p>
              </div>
            </div>
            <span className="text-yellow-400 font-bold font-mono px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
              KALMAN RESIDUAL SPIKE
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Satellite className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-bold text-white">GSAT-7A (Angry Bird)</span>
                <span className="text-gray-400 ml-2 font-mono">NORAD #43865</span>
                <p className="text-[11px] text-gray-400">X-Band Downlink SNR: 8.4 dB (Baseline: 22.0 - 28.0 dB)</p>
              </div>
            </div>
            <span className="text-yellow-400 font-bold font-mono px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
              CARRIER MARGIN DROP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. INCIDENT DIAGNOSTICS AGENT DESK
// ==========================================
export function IncidentDiagnosticsDesk({ activeAnomaly }: DeskProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="text-orange-400" />
            Incident Diagnostics Agent Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Physical subsystem root-cause analysis, power dissipation modeling, and multi-sensor telemetry correlation.
          </p>
        </div>
        {activeAnomaly && (
          <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
            PHYSICAL ROOT-CAUSE CORRELATED
          </span>
        )}
      </div>

      {/* Corroborated Physical Subsystem Hypotheses */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Active Physical Subsystem Hypotheses</h3>
        <div className="space-y-3 text-xs">
          {activeAnomaly && (
            <div className="p-4 bg-orange-950/20 rounded-xl border border-orange-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  Primary Hypothesis: {activeAnomaly.title}
                </span>
                <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 font-mono">
                  Confidence: 94.8%
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed">
                {activeAnomaly.diagnosticsSummary}
              </p>
              <div className="pt-2 text-[11px] font-mono text-gray-400 flex items-center gap-4 border-t border-white/5">
                <span>Coordinates: {activeAnomaly.coordinates}</span>
                <span>•</span>
                <span>Spacecraft: {activeAnomaly.spacecraft}</span>
                <span>•</span>
                <span>Sensor: {activeAnomaly.sensor}</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Secondary Hypothesis: Solar Shunt Penumbra Transition</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Likelihood: 78%
              </span>
            </div>
            <p className="text-gray-300">
              Solar array drop on Cartosat-3 correlates with penumbra orbital passage. Voltage regulator step-down matches historical solar eclipse profiles.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Tertiary Hypothesis: ADCS Momentum Desaturation Impulse</span>
              <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                Likelihood: 64%
              </span>
            </div>
            <p className="text-gray-300">
              Pointing variance on RISAT-2BR1 occurred during scheduled magnetorquer desaturation cycle. Gyro telemetry confirms transient torque impulse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. RISK ASSESSMENT AGENT DESK
// ==========================================
export function RiskAssessmentDesk({ activeAnomaly }: DeskProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" />
            Risk Assessment Agent Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Safety of flight evaluation, space debris conjunction screening, and orbital collision probabilities.
          </p>
        </div>
        {activeAnomaly && (
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            CRITICALITY TIER-1 ASSESSED
          </span>
        )}
      </div>

      {/* Active Anomaly Risk Assessment Profile */}
      {activeAnomaly && (
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-black/40 to-transparent space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Incident Safety & Collateral Risk Analysis: {activeAnomaly.title}
            </h3>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              HIGH RISK
            </span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed">
            {activeAnomaly.riskSummary}
          </p>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-indigo-300">
            <span className="font-bold text-white block mb-0.5">Recommended Safety Protocol:</span>
            {activeAnomaly.recommendedAction}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Flight Safety Envelope</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">NOMINAL</h2>
          <p className="text-[11px] text-gray-400 mt-1">No imminent spacecraft loss</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Max Collision Probability</span>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">1.4e-6</h2>
          <p className="text-[11px] text-gray-400 mt-1">Well below 1.0e-4 threshold</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tracked Debris in Cone</span>
          <h2 className="text-2xl font-bold text-blue-400 font-mono mt-1">14 Objects</h2>
          <p className="text-[11px] text-gray-400 mt-1">LEO orbital corridor screened</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Severity Classification</span>
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">
            {activeAnomaly ? 'CRITICAL' : 'LOW-MEDIUM'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Multi-agent safety active</p>
        </div>
      </div>

      {/* Conjunction Assessment Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Orbital Conjunction Risk Screening</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase">
              <th className="pb-3">OBJECT ID</th>
              <th className="pb-3">TARGET SPACECRAFT</th>
              <th className="pb-3">MISS DISTANCE</th>
              <th className="pb-3">PROBABILITY (Pc)</th>
              <th className="pb-3 text-right">ACTION STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            <tr>
              <td className="py-3 font-mono">DEB-COSMOS-2251</td>
              <td className="py-3">CartoSat-1 (LEO)</td>
              <td className="py-3 font-mono">4.82 km</td>
              <td className="py-3 font-mono text-emerald-400">1.42e-6</td>
              <td className="py-3 text-right">
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Clear</span>
              </td>
            </tr>
            <tr>
              <td className="py-3 font-mono">DEB-FENGYUN-1C</td>
              <td className="py-3">RISAT-2BR1 (LEO)</td>
              <td className="py-3 font-mono">7.15 km</td>
              <td className="py-3 font-mono text-emerald-400">4.10e-7</td>
              <td className="py-3 text-right">
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Clear</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 4. MISSION REPORTING AGENT DESK
// ==========================================
export function MissionReportingDesk({ activeAnomaly }: DeskProps) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="text-purple-400" />
            Mission Reporting Agent Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Structured incident dossier compilation, ISRO telemetry annexes, and emergency operator voice briefings.
          </p>
        </div>
        {activeAnomaly && (
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            ALERT DISPATCHED TO DHANUSH
          </span>
        )}
      </div>

      {/* Active Anomaly Dossier Spotlight */}
      {activeAnomaly && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/20 via-black/40 to-transparent space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
                DOSSIER: {activeAnomaly.id.toUpperCase()}
              </span>
              <span className="text-xs text-white font-bold">{activeAnomaly.title}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              Email Alert Dispatched to dhanushr672@gmail.com
            </span>
          </div>

          <p className="text-xs text-gray-200 leading-relaxed">
            {activeAnomaly.reportingSummary}
          </p>

          <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-gray-300 space-y-1">
            <div className="text-[10px] uppercase font-bold text-purple-300">Executive Dispatch Summary:</div>
            <div>• Target Spacecraft: {activeAnomaly.spacecraft} (NORAD #{activeAnomaly.noradId})</div>
            <div>• Coordinates: {activeAnomaly.coordinates}</div>
            <div>• Subsystem Metric: {activeAnomaly.metric} ({activeAnomaly.observedValue})</div>
            <div>• Recommended Directive: {activeAnomaly.recommendedAction}</div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Compiled Dossiers</span>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">
            {activeAnomaly ? '4 Reports' : '3 Reports'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Available for export & review</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Voice Briefings</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">Ready</h2>
          <p className="text-[11px] text-gray-400 mt-1">Twilio call & browser speech</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dataset Attribution</span>
          <h2 className="text-2xl font-bold text-blue-400 font-mono mt-1">ISRO Registry</h2>
          <p className="text-[11px] text-gray-400 mt-1">Kaggle Verified dataset</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Operator Sign-Off</span>
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">
            {activeAnomaly ? 'Pending Human Gate' : '2 Pending'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Human-in-the-loop review</p>
        </div>
      </div>

      {/* Incident Dossiers Queue */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Generated Incident Intelligence Dossiers</h3>
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-white">INC-20261016-C3</span>
              <span className="text-gray-400 ml-2 font-mono">Cartosat-3 Telemetry Drop Dossier</span>
              <p className="text-[11px] text-gray-400 mt-1">Includes 4-agent analysis, raw ISRO bus logs, and mitigation recommendations.</p>
            </div>
            <span className="text-white bg-blue-600 hover:bg-blue-500 font-bold px-3 py-1.5 rounded cursor-pointer transition-colors">
              Export Markdown
            </span>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-white">INC-20261016-R2</span>
              <span className="text-gray-400 ml-2 font-mono">RISAT-2BR1 Pointing Jitter Dossier</span>
              <p className="text-[11px] text-gray-400 mt-1">Attitude gyro telemetry residual analysis with safe-mode verification.</p>
            </div>
            <span className="text-white bg-blue-600 hover:bg-blue-500 font-bold px-3 py-1.5 rounded cursor-pointer transition-colors">
              Export Markdown
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
