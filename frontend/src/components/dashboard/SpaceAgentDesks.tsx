import { 
  Scan, ShieldAlert, ShieldCheck, FileSpreadsheet, 
  Satellite, Activity 
} from 'lucide-react';

// ==========================================
// 1. DETECTION ANALYSIS AGENT DESK
// ==========================================
export function DetectionAgentDesk() {

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Scan className="text-blue-400" />
          Detection Analysis Agent Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Continuous raw orbital telemetry monitoring, Z-score envelope verification, and Kalman filter deviation detection.
        </p>
      </div>

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
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">3 Events</h2>
          <p className="text-[11px] text-gray-400 mt-1">Awaiting multi-agent incident corroboration</p>
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

      {/* Permissions & Autonomy */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-4">Detection Agent Autonomy Permissions</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-gray-300">ingest_spacecraft_telemetry_stream</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Autonomous</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-gray-300">evaluate_zscore_nominal_envelopes</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Autonomous</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-gray-300">register_unconfirmed_space_event</span>
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Autonomous</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">declare_confirmed_space_incident</span>
            <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Requires Human Review Gate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. INCIDENT DIAGNOSTICS AGENT DESK
// ==========================================
export function IncidentDiagnosticsDesk() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <ShieldAlert className="text-orange-400" />
          Incident Diagnostics Agent Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Physical subsystem root-cause analysis, power dissipation modeling, and multi-sensor telemetry correlation.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Power Subsystem (EPS)</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">1113 W</h2>
          <p className="text-[11px] text-gray-400 mt-1">Solar array regulator operating nominally</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Attitude (ADCS)</span>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">0.048 deg</h2>
          <p className="text-[11px] text-gray-400 mt-1">3-Axis reaction wheels jitter nominal</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">RF Transponder (TTC)</span>
          <h2 className="text-2xl font-bold text-blue-400 font-mono mt-1">26.9 dB</h2>
          <p className="text-[11px] text-gray-400 mt-1">X-Band downlink link budget steady</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Thermal Bus (TCS)</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">18.8 °C</h2>
          <p className="text-[11px] text-gray-400 mt-1">Within standard 18 - 25 °C envelope</p>
        </div>
      </div>

      {/* Corroborated Physical Hypotheses */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Active Physical Subsystem Hypotheses</h3>
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Hypothesis 1: Partial Eclipse Shadowing Transition</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Likelihood: 78%</span>
            </div>
            <p className="text-gray-300">
              Solar array drop on Cartosat-3 correlates with penumbra orbital passage. Voltage regulator step-down matches historical solar eclipse profiles.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Hypothesis 2: Gyro Reaction Wheel Momentum Dump Anomaly</span>
              <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Likelihood: 64%</span>
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
export function RiskAssessmentDesk() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" />
          Risk Assessment Agent Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Safety of flight evaluation, space debris conjunction screening, and orbital collision probabilities.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Flight Safety Envelope</span>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono mt-1">NOMINAL</h2>
          <p className="text-[11px] text-gray-400 mt-1">No imminent collision hazard</p>
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
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">LOW-MEDIUM</h2>
          <p className="text-[11px] text-gray-400 mt-1">Operational impact manageable</p>
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
export function MissionReportingDesk() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <FileSpreadsheet className="text-purple-400" />
          Mission Reporting Agent Desk
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Structured incident dossier compilation, ISRO telemetry annexes, and automated operator voice briefings.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Compiled Dossiers</span>
          <h2 className="text-2xl font-bold text-white font-mono mt-1">3 Reports</h2>
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
          <h2 className="text-2xl font-bold text-yellow-400 font-mono mt-1">2 Pending</h2>
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
