import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  PhoneCall,
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  Brain,
  HelpCircle,
  ArrowRight,
  Loader2,
  Check
} from 'lucide-react';

interface IncidentData {
  incident_id: string;
  event_id: string;
  satellite_name: string;
  timestamp: string;
  data_source: string;
  incident_title?: string;
  summary?: string;
  observed_evidence: string[];
  possible_explanations: string[];
  preliminary_severity: 'Low' | 'Medium' | 'High' | 'Unknown';
  severity_reasoning: string;
  uncertainties: string[];
  recommended_next_steps: string[];
  voice_briefing_script: string;
  review_status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  operator_notes?: string;
  agents_breakdown?: {
    detection_agent?: any;
    incident_agent?: any;
    risk_agent?: any;
  };
}

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentData | null;
  onMarkReviewed: (incidentId: string, notes: string) => Promise<void>;
  onCallOperator: (incidentId: string, phone: string) => Promise<any>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  incident,
  onMarkReviewed,
  onCallOperator
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'agents' | 'briefing'>('report');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [isReviewedSuccess, setIsReviewedSuccess] = useState<boolean>(false);

  // Phone Call Confirmation Modal State (MANDATORY OPERATOR CONFIRMATION)
  const [showCallConfirmModal, setShowCallConfirmModal] = useState<boolean>(false);
  const [targetPhone, setTargetPhone] = useState<string>('+919347249697');
  const [isCallingOperator, setIsCallingOperator] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<any>(null);

  if (!isOpen || !incident) return null;

  // Web Speech API Voice Briefing Player
  const handlePlayVoiceBriefing = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = incident.voice_briefing_script || incident.summary || 'No briefing script available.';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleMarkAsReviewed = async () => {
    setIsSubmittingReview(true);
    try {
      await onMarkReviewed(incident.incident_id, operatorNotes || 'Incident verified by human operator. Routine telemetry diagnostic scheduled.');
      setIsReviewedSuccess(true);
      setIsReviewOpen(false);
    } catch (err) {
      console.error('Error marking reviewed:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleConfirmCallOperator = async () => {
    setIsCallingOperator(true);
    try {
      const res = await onCallOperator(incident.incident_id, targetPhone);
      setCallResult(res);
    } catch (err: any) {
      setCallResult({ status: 'failed', error: err.message });
    } finally {
      setIsCallingOperator(false);
    }
  };

  const handleExportReport = () => {
    const reportText = `
# SPACEOS INCIDENT DECISION-SUPPORT REPORT
Incident ID: ${incident.incident_id}
Event ID: ${incident.event_id}
Target Satellite: ${incident.satellite_name}
Timestamp: ${incident.timestamp}
Data Source: ${incident.data_source}
Preliminary Severity: ${incident.preliminary_severity}

## 1. INCIDENT TITLE
${incident.incident_title || incident.observed_evidence[0]}

## 2. SUMMARY
${incident.summary || 'Evaluated via SpaceOS Multi-Agent Pipeline.'}

## 3. DIRECT OBSERVED EVIDENCE
${incident.observed_evidence.map(e => `- ${e}`).join('\n')}

## 4. POSSIBLE PHYSICAL EXPLANATIONS
${incident.possible_explanations.map(p => `- ${p}`).join('\n')}

## 5. RISK ASSESSMENT & RATIONALE
- Severity: ${incident.preliminary_severity}
- Rationale: ${incident.severity_reasoning}

## 6. OPERATIONAL UNCERTAINTIES
${incident.uncertainties.map(u => `- ${u}`).join('\n')}

## 7. RECOMMENDED NEXT STEPS
${incident.recommended_next_steps.map(r => `- ${r}`).join('\n')}

## 8. SPOKEN VOICE BRIEFING
${incident.voice_briefing_script}

## 9. OPERATOR REVIEW STATUS
Status: ${incident.review_status}
Reviewer: ${incident.reviewed_by || 'Pending Operator Review'}
`;
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpaceOS_Report_${incident.incident_id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans text-white">
      <div className="bg-[#050505] border border-white/20 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white text-black rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  SpaceOS Incident Report
                </h2>
                <span className="font-mono text-xs text-zinc-400">
                  {incident.incident_id}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-white">
                  {incident.preliminary_severity} Severity
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target: <span className="text-zinc-200 font-semibold">{incident.satellite_name}</span> • Source: <span className="text-zinc-300 font-mono">{incident.data_source}</span> • Logged: {new Date(incident.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Operator Review Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border ${
              isReviewedSuccess || incident.review_status === 'marked_as_reviewed'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isReviewedSuccess || incident.review_status === 'marked_as_reviewed' ? 'REVIEWED BY OPERATOR' : 'AWAITING OPERATOR REVIEW'}</span>
            </div>

            <button
              onClick={() => {
                handleStopVoice();
                onClose();
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/10 bg-black text-xs font-mono">
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors uppercase tracking-wider ${
              activeTab === 'report'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Structured Incident Report
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === 'agents'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Multi-Agent Reasoning (4 Agents)
          </button>
          <button
            onClick={() => setActiveTab('briefing')}
            className={`py-3 px-4 font-bold border-b-2 transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === 'briefing'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice Briefing & Operator Calling
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-6 min-h-0 overflow-y-auto space-y-6">
          
          {/* TAB 1: STRUCTURED REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-5">
                <h3 className="text-base font-black text-white mb-2 uppercase tracking-wide">
                  {incident.incident_title || `Telemetry Anomaly on ${incident.satellite_name}`}
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                  {incident.summary || 'Multi-agent analysis flagged an out-of-nominal sensor reading requiring operator assessment.'}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <span className="font-bold text-white">NOTICE:</span>
                  <span>Decision-support outputs. Human flight operator remains responsible for all mission actions.</span>
                </div>
              </div>

              {/* 2-Column Grid: Direct Observations vs Explanations */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Direct Observations */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    Observed Evidence (Direct Telemetry / Vision)
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {incident.observed_evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 bg-black p-2.5 rounded border border-white/10 font-mono text-[11px]">
                        <span className="text-white font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Possible Explanations */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    Possible Explanations (Engineering Hypotheses)
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {incident.possible_explanations.map((exp, i) => (
                      <li key={i} className="flex items-start gap-2 bg-black p-2.5 rounded border border-white/10 font-sans">
                        <span className="text-white font-bold">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Risk Assessment & Rationale */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-zinc-400" />
                    Risk Assessment & Severity Rationale
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase bg-white text-black">
                    {incident.preliminary_severity} Severity
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-black p-3 rounded border border-white/10 font-sans">
                  {incident.severity_reasoning}
                </p>
              </div>

              {/* 2-Column Grid: Uncertainties vs Recommended Next Steps */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Uncertainties */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    Operational Uncertainties
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {incident.uncertainties.map((u, i) => (
                      <li key={i} className="flex items-start gap-2 bg-black p-2.5 rounded border border-white/10">
                        <span className="text-zinc-500 font-bold">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Steps */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                    Recommended Next Steps
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {incident.recommended_next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 bg-black p-2.5 rounded border border-white/10">
                        <ArrowRight className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Review Section Toggle */}
              {isReviewOpen && (
                <div className="bg-[#0c0c0c] border border-white/20 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Operator Review Notes & Flight Signoff
                  </h4>
                  <textarea
                    rows={3}
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    placeholder="Enter operator observations, pass validation notes, or manual cross-check confirmations..."
                    className="w-full bg-black border border-white/20 rounded-lg p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-white resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsReviewOpen(false)}
                      className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSubmittingReview}
                      onClick={handleMarkAsReviewed}
                      className="btn-orange flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Check className="w-3.5 h-3.5 text-white" />}
                      <span className="text-white">Confirm Operator Signoff</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MULTI-AGENT REASONING BREAKDOWN */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 text-xs text-zinc-300 font-sans">
                <span className="font-bold text-white block mb-1 uppercase font-mono">Architecture Note:</span>
                This analysis was orchestrated across 4 logical aerospace agents with strict knowledge boundaries:
                Detection Analysis Agent (factual observations vs predictions) → Incident Analysis Agent (orbital physical hypotheses) → Risk Assessment Agent (flight safety severity) → Incident Reporting Agent (structured report & voice briefing).
              </div>

              {/* Agent 1: Detection Agent */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2 uppercase">
                    <span className="w-5 h-5 rounded bg-white text-black font-bold flex items-center justify-center text-[10px]">1</span>
                    Detection Analysis Agent
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">FACTUAL OBSERVATIONS</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400 font-semibold">Direct Sensor Observations:</span>
                    <ul className="list-disc list-inside text-zinc-300 mt-1 space-y-0.5 font-mono text-[11px]">
                      {incident.observed_evidence.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Agent 2: Incident Analysis Agent */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2 uppercase">
                    <span className="w-5 h-5 rounded bg-white text-black font-bold flex items-center justify-center text-[10px]">2</span>
                    Incident Analysis Agent
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">PHYSICAL HYPOTHESES</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400 font-semibold">Corroborated Hypotheses:</span>
                    <ul className="list-disc list-inside text-zinc-300 mt-1 space-y-0.5">
                      {incident.possible_explanations.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Agent 3: Risk Assessment Agent */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2 uppercase">
                    <span className="w-5 h-5 rounded bg-white text-black font-bold flex items-center justify-center text-[10px]">3</span>
                    Risk Assessment Agent
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">FLIGHT SAFETY</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-zinc-300">{incident.severity_reasoning}</p>
                </div>
              </div>

              {/* Agent 4: Incident Reporting Agent */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2 uppercase">
                    <span className="w-5 h-5 rounded bg-white text-black font-bold flex items-center justify-center text-[10px]">4</span>
                    Incident Reporting Agent
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">EXECUTIVE SYNTHESIS</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1">
                  <span className="text-zinc-400 font-semibold">Generated Voice Script:</span>
                  <p className="bg-black p-2.5 rounded border border-white/10 font-mono text-[11px] leading-relaxed">
                    {incident.voice_briefing_script}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: VOICE BRIEFING & OPERATOR CALLING */}
          {activeTab === 'briefing' && (
            <div className="space-y-6">
              
              {/* Spoken Summary Card */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide">
                    <Volume2 className="w-5 h-5 text-white" />
                    Spoken Executive Briefing Script
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    Voice Profile: Polly.Matthew (Aerospace Dispatch)
                  </span>
                </div>

                {/* Voice Script Text */}
                <div className="bg-black border border-white/15 rounded-lg p-4 text-sm text-zinc-200 font-sans leading-relaxed tracking-wide">
                  "{incident.voice_briefing_script}"
                </div>

                {/* Briefing Mandatory Checklist Indicators */}
                <div className="grid grid-cols-5 gap-2 pt-2 text-[10px] text-zinc-400 font-mono uppercase">
                  <div className="bg-black p-2 rounded text-center border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-1" />
                    What Detected
                  </div>
                  <div className="bg-black p-2 rounded text-center border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-1" />
                    When Detected
                  </div>
                  <div className="bg-black p-2 rounded text-center border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-1" />
                    Why Matters
                  </div>
                  <div className="bg-black p-2 rounded text-center border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-1" />
                    Uncertainties
                  </div>
                  <div className="bg-black p-2 rounded text-center border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-1" />
                    Operator Action
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handlePlayVoiceBriefing}
                    className="btn-orange flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isSpeaking ? (
                      <>
                        <Pause className="w-4 h-4 fill-current text-white" />
                        <span className="text-white">Pause Briefing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-white" />
                        <span className="text-white">Play Spoken Briefing</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleStopVoice}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Audio</span>
                  </button>
                </div>
              </div>

              {/* Twilio Outbound Calling Card */}
              <div className="bg-[#0a0a0a] border border-white/15 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white">
                      <PhoneCall className="w-5 h-5 animate-pulse text-[#F27A30]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                        Emergency Operator Voice Dispatch (Twilio Outbound)
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Transmits this AI incident briefing directly to the Flight Operations Director's cellular line.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCallConfirmModal(true)}
                    className="btn-orange flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-white" />
                    <span className="text-white">Call Operator</span>
                  </button>
                </div>

                <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-zinc-300 flex items-center gap-2 font-mono">
                  <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                  <span>
                    <strong>Safety Constraint:</strong> Outbound cellular calls are never triggered autonomously. Explicit operator confirmation is required prior to placing any call.
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReviewOpen(!isReviewOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              {isReviewOpen ? 'Hide Review Notes' : 'Review Incident'}
            </button>

            <button
              onClick={handleMarkAsReviewed}
              disabled={isSubmittingReview || isReviewedSuccess || incident.review_status === 'marked_as_reviewed'}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isReviewedSuccess || incident.review_status === 'marked_as_reviewed'
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default'
                  : 'btn-orange text-white shadow-sm cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span className="text-white">
                {isReviewedSuccess || incident.review_status === 'marked_as_reviewed'
                  ? 'Marked as Reviewed'
                  : 'Mark as Reviewed'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('briefing')}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-xs font-semibold transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Generate Voice Briefing
            </button>

            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              Export Report
            </button>
          </div>
        </div>

      </div>

      {/* MANDATORY HUMAN OPERATOR CALL CONFIRMATION DIALOG */}
      {showCallConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="bg-[#050505] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white text-black rounded-lg">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Confirm Emergency Operator Call
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Explicit human verification required
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              You are about to initiate an outbound cellular call via Twilio Voice to dispatch the executive incident briefing for <strong>{incident.satellite_name}</strong>.
            </p>

            <div className="bg-black border border-white/10 rounded-lg p-3 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                Destination Phone Number:
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-white"
              />
            </div>

            {callResult && (
              <div className="p-3 rounded text-xs font-mono bg-zinc-900 border border-zinc-700 text-zinc-200">
                <div>Status: {callResult.status.toUpperCase()}</div>
                {callResult.call_sid && <div>Call SID: {callResult.call_sid}</div>}
                {callResult.message && <div>{callResult.message}</div>}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setShowCallConfirmModal(false);
                  setCallResult(null);
                }}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                disabled={isCallingOperator}
                onClick={handleConfirmCallOperator}
                className="btn-orange flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {isCallingOperator ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="text-white">Placing Outbound Call...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 text-white" />
                    <span className="text-white">Authorize & Place Call</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
