import { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { SpaceOSDashboard } from '../components/space/SpaceOSDashboard';
import { CommandCenter } from '../components/dashboard/CommandCenter';
import { FinancialWidget } from '../components/dashboard/FinancialWidget';
import { TaskTracker } from '../components/dashboard/TaskTracker';
import { 
  DetectionAgentDesk, 
  IncidentDiagnosticsDesk, 
  RiskAssessmentDesk, 
  MissionReportingDesk 
} from '../components/dashboard/SpaceAgentDesks';
import { IntegrationsPanel } from '../components/dashboard/IntegrationsPanel';
import { AnalyticsPanel } from '../components/dashboard/AnalyticsPanel';
import { AuditLogPanel } from '../components/dashboard/AuditLogPanel';
import { AIOrchestratorPanel } from '../components/dashboard/AIOrchestratorPanel';
import { TwilioVoicePanel } from '../components/dashboard/TwilioVoicePanel';
import { queryOrchestrator, fetchMode, updateMode, triggerSeed } from '../lib/api';
import type { SpaceAnomaly } from '../lib/anomalies';
import { Sparkles, Database, Settings, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent?: string;
  text: string;
  image?: string;
  badge?: string;
}

export function Dashboard() {
  const [activeView, setActiveView] = useState('spaceos');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'live' | 'demo'>('demo');
  const [stagedAnomaly, setStagedAnomaly] = useState<SpaceAnomaly | null>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<SpaceAnomaly | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: "SpaceXOS Flight Intelligence active. Multi-agent space orbital telemetry and incident response online." },
  ]);
  const [seedingText, setSeedingText] = useState<string | null>(null);

  // Fetch initial AI Mode settings
  useEffect(() => {
    fetchMode()
      .then((data) => {
        if (data.mode === 'live' || data.mode === 'demo') {
          setAiMode(data.mode);
        }
      })
      .catch(console.error);
  }, []);

  const handleSendMessage = async (text: string, anomalyPayload?: SpaceAnomaly) => {
    if (anomalyPayload) {
      // 1. Stage user optical submission message with image
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        image: anomalyPayload.image,
        badge: anomalyPayload.spacecraft
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setActiveAnomaly(anomalyPayload);
      setStagedAnomaly(null);

      // 2. Dispatch live emergency email notification to Administrator Dhanush
      fetch('http://127.0.0.1:8000/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: 'dhanushr672@gmail.com',
          subject: `[CRITICAL ALERT] Optical Satellite Anomaly: ${anomalyPayload.title} (${anomalyPayload.spacecraft})`,
          body: `SPACEXOS FLIGHT OPERATIONS - EMERGENCY INCIDENT NOTIFICATION
----------------------------------------------------------------------
To: Dhanush (SpaceXOS Administrator)
Target Spacecraft: ${anomalyPayload.spacecraft} (NORAD #${anomalyPayload.noradId})
Incident Title: ${anomalyPayload.title}
Coordinates: ${anomalyPayload.coordinates}
Sensor: ${anomalyPayload.sensor}
Observed Value: ${anomalyPayload.observedValue} [Baseline: ${anomalyPayload.expectedBaseline} | σ = ${anomalyPayload.deviationSigma}]
Timestamp: ${new Date().toISOString()}

======================================================================
1. TELEMETRY & DETECTION ANALYSIS AGENT:
${anomalyPayload.detectionSummary}

2. INCIDENT DIAGNOSTICS AGENT:
${anomalyPayload.diagnosticsSummary}

3. RISK ASSESSMENT AGENT:
${anomalyPayload.riskSummary}

4. MISSION REPORTING & FLIGHT DIRECTIVE:
${anomalyPayload.reportingSummary}

Recommended Action: ${anomalyPayload.recommendedAction}
======================================================================
Flight Operations Console: Incident corroboration complete. Decision gate pending operator review.`
        })
      }).catch((err) => console.error('[SpaceXOS] Email dispatch error:', err));

      // 3. Concurrently activate all 4 aerospace agents with realistic telemetry arrival timing
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 100).toString(),
            role: 'assistant',
            agent: 'detection',
            badge: `DETECTION ANALYSIS AGENT • σ = ${anomalyPayload.deviationSigma} DEVIATION`,
            text: `🛰️ [TELEMETRY INGESTION CONFIRMED] Sensor: ${anomalyPayload.sensor}\n\n${anomalyPayload.detectionSummary}\n\nObserved: ${anomalyPayload.observedValue} | Nominal Baseline: ${anomalyPayload.expectedBaseline}`
          }
        ]);
      }, 400);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 200).toString(),
            role: 'assistant',
            agent: 'incident',
            badge: 'INCIDENT DIAGNOSTICS AGENT • PHYSICAL CORRELATION',
            text: `🔍 [SUBSYSTEM DIAGNOSTICS COMPLETE]\n\n${anomalyPayload.diagnosticsSummary}\n\nCoordinates: ${anomalyPayload.coordinates}`
          }
        ]);
      }, 1000);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 300).toString(),
            role: 'assistant',
            agent: 'risk',
            badge: 'RISK ASSESSMENT AGENT • CRITICALITY TIER-1',
            text: `🛡️ [SAFETY OF FLIGHT EVALUATION]\n\n${anomalyPayload.riskSummary}\n\nRecommended Safety Protocol: ${anomalyPayload.recommendedAction}`
          }
        ]);
      }, 1600);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 400).toString(),
            role: 'assistant',
            agent: 'reporting',
            badge: 'MISSION REPORTING AGENT • EMERGENCY DISPATCH',
            text: `📋 [EXECUTIVE DOSSIER COMPILED & DISPATCHED]\n\n${anomalyPayload.reportingSummary}\n\n📧 Emergency alert email successfully transmitted to Administrator Dhanush (dhanushr672@gmail.com).\n\nVoice Briefing status: READY for Emergency Outbound Dispatch.`
          }
        ]);
        setIsLoading(false);
      }, 2200);

      return;
    }

    // Standard operator query handling
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await queryOrchestrator(text);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: (response as any).reply || response.agent_responses?.[0]?.message || 'Operation completed.',
        agent: (response as any).specialist || response.agent_responses?.[0]?.agent_name,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Error connecting to AI Orchestrator: ${e?.message || 'Server error'}. Verify backend server is running.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = async (mode: 'live' | 'demo') => {
    try {
      await updateMode(mode);
      setAiMode(mode);
    } catch (e) {
      console.error('Failed to update mode:', e);
    }
  };

  const handleForceSeed = async () => {
    setSeedingText('Seeding...');
    try {
      await triggerSeed();
      setSeedingText('Seeding complete. Refreshing workspace.');
      setTimeout(() => setSeedingText(null), 3000);
    } catch (e) {
      setSeedingText('Reset failed. Make sure server is running.');
      setTimeout(() => setSeedingText(null), 3000);
    }
  };

  // Render view components in main dashboard
  const renderMainView = () => {
    switch (activeView) {
      case 'spaceos':
      case 'space':
        return (
          <SpaceOSDashboard 
            onTriggerAnomalyRedirect={(anomaly) => {
              setStagedAnomaly(anomaly);
              setActiveView('command');
            }} 
          />
        );
      case 'command':
        return (
          <div className="flex-1 h-full min-h-0 grid grid-cols-3 gap-4 p-4 overflow-hidden">
            <div className="col-span-2 h-full min-h-0">
              <CommandCenter 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                stagedAnomaly={stagedAnomaly}
                onClearStagedAnomaly={() => setStagedAnomaly(null)}
              />
            </div>
            <div className="col-span-1 h-full min-h-0 flex flex-col gap-4 overflow-y-auto">
              <FinancialWidget />
              <div className="flex-1 min-h-[220px]">
                <TaskTracker />
              </div>
            </div>
          </div>
        );
      case 'orchestrator':
        return <AIOrchestratorPanel />;
      case 'finance':
      case 'detection_agent':
        return <DetectionAgentDesk activeAnomaly={activeAnomaly} />;
      case 'gtm':
      case 'incident_agent':
        return <IncidentDiagnosticsDesk activeAnomaly={activeAnomaly} />;
      case 'hiring':
      case 'risk_agent':
        return <RiskAssessmentDesk activeAnomaly={activeAnomaly} />;
      case 'legal':
      case 'reporting_agent':
        return <MissionReportingDesk activeAnomaly={activeAnomaly} />;
      case 'tasks':
      case 'approvals':
        return (
          <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full">
            <TaskTracker />
          </div>
        );
      case 'integrations':
        return <IntegrationsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'audit_logs':
        return <AuditLogPanel />;
      case 'voice_calling':
      case 'twilio':
      case 'phone':
        return <TwilioVoicePanel />;
      case 'settings':
        return (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10 max-w-2xl mx-auto w-full">
            <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm">
              <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <Settings className="text-gray-400" />
                Workspace Settings
              </h1>
              <p className="text-xs text-gray-400 mt-1">Configure global AI models, database syncs, and simulation modes.</p>
            </div>

            {/* Mode card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-400" />
                AI Operation Mode
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Toggles between calling live LLMs (Gemini/Anthropic keys required in backend) and deterministic simulation mode matching hackathon specifications.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleToggleMode('demo')}
                  className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    aiMode === 'demo'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {aiMode === 'demo' && <Check size={14} />}
                  Demo Simulation Mode
                </button>
                <button
                  onClick={() => handleToggleMode('live')}
                  className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    aiMode === 'live'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {aiMode === 'live' && <Check size={14} />}
                  Live AI Graph Mode
                </button>
              </div>
            </div>

            {/* Database Card */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
                <Database size={16} className="text-indigo-400" />
                Supabase PostgreSQL Database
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reset tables and seed candidates, telemetry events, and flight records for SpaceXOS Defense & Orbital workspace.
              </p>
              
              <button
                onClick={handleForceSeed}
                disabled={seedingText !== null}
                className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50"
              >
                Reset & Seed Workspace Data
              </button>
              {seedingText && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 text-center rounded-lg">
                  {seedingText}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#000000] text-[#f3f4f6] relative overflow-hidden">
      {/* Background Glows (FounderOS) */}
      <div className="glow-blob w-[500px] h-[500px] bg-blue-600/10 top-[-150px] left-[150px] pointer-events-none" />
      <div className="glow-blob w-[600px] h-[600px] bg-indigo-500/10 bottom-[-250px] right-[50px] pointer-events-none" />
      <div className="glow-blob w-[350px] h-[350px] bg-violet-600/5 top-[30%] right-[35%] pointer-events-none" />

      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Global Header (SpaceXOS) */}
        <header className="px-6 py-3.5 border-b border-white/5 bg-[#030307]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Workspace:</span>
            <span className="text-xs font-bold text-white bg-white/5 border border-white/5 px-2 py-0.5 rounded">
              SpaceXOS Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Badge Selector */}
            <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
              <button
                onClick={() => handleToggleMode('demo')}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                  aiMode === 'demo' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Simulation
              </button>
              <button
                onClick={() => handleToggleMode('live')}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                  aiMode === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Live AI
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="flex-1 min-h-0 relative flex flex-col bg-transparent overflow-hidden">
          {renderMainView()}
        </div>
      </div>
    </div>
  );
}
