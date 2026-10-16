import React, { useState, useEffect } from 'react';
import { 
  Phone,
  PhoneCall, 
  PhoneForwarded,
  Volume2, 
  Radio, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  UserCheck,
  Coins,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useTextToSpeech } from '../../lib/useTextToSpeech';

interface OutboundCallRecord {
  id: string;
  timestamp: string;
  recipientName: string;
  toPhone: string;
  topic: string;
  status: string;
  callSid?: string;
  spokenText: string;
}

export function TwilioVoicePanel() {
  const [selectedContact, setSelectedContact] = useState<'dhanush' | 'ajay' | 'rahul' | 'custom'>('dhanush');
  const [outboundPhone, setOutboundPhone] = useState('+919347249697');
  const [recipientName, setRecipientName] = useState('Dhanush (Administrator)');
  const [outboundTopic, setOutboundTopic] = useState('Critical Orbital Anomaly Incident Briefing');
  const [isDialing, setIsDialing] = useState(false);
  
  interface OutboundAlert {
    type: 'success' | 'error';
    title: string;
    message: string;
    sid?: string;
    phone?: string;
  }
  const [outboundAlert, setOutboundAlert] = useState<OutboundAlert | null>(null);

  const [previewText, setPreviewText] = useState(
    "Critical Flight Alert: SpaceXOS telemetry detection identified a Level 4 thermal anomaly in the Cartosat-3 optical sector. Incident Diagnostics and Risk Assessment corroborate severe sensor flare. Manual flight director review requested."
  );

  const [callHistory, setCallHistory] = useState<OutboundCallRecord[]>([
    {
      id: 'call-1',
      timestamp: 'Just now',
      recipientName: 'Dhanush',
      toPhone: '+919347249697',
      topic: 'Cartosat-3 Optical & Thermal Incident Briefing',
      status: 'Dispatched (SID: CA33d79f7bd92dc89a3eec6beae76f4e08)',
      callSid: 'CA33d79f7bd92dc89a3eec6beae76f4e08',
      spokenText: 'Level 4 optical anomaly detected on Cartosat-3. Multi-agent diagnostic corroboration active. Flight authorization required.'
    }
  ]);

  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  // Helper to clean raw terminal ANSI codes & boilerplate errors
  const cleanErrorMessage = (msg: string): string => {
    if (!msg) return 'Failed to initiate outbound call.';
    let cleaned = msg
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/≡\[[0-9;]*m/g, '')
      .replace(/\[[0-9;]*m/g, '')
      .replace(/HTTP Error/gi, '')
      .replace(/POST \/Accounts\/[^\s]+/gi, '')
      .replace(/Twilio returned the following information:/gi, '')
      .replace(/Twilio outbound call failed:/gi, '')
      .replace(/Unable to create record:/gi, '')
      .trim();

    cleaned = cleaned.replace(/More information may be available here:[^\s]*/gi, '').trim();
    return cleaned || 'Twilio voice request was rejected. Please verify the recipient number is registered in Twilio Console.';
  };

  // Contact preset selection
  const handleSelectContact = (key: 'dhanush' | 'ajay' | 'rahul' | 'custom') => {
    setSelectedContact(key);
    if (key === 'dhanush') {
      setOutboundPhone('+919347249697');
      setRecipientName('Dhanush (Administrator)');
    } else if (key === 'ajay') {
      setOutboundPhone('+917730838447');
      setRecipientName('Ajay Kumar (EPS & Power Flight Controller)');
    } else if (key === 'rahul') {
      setOutboundPhone('+918886544423');
      setRecipientName('Rahul Sharma (ADCS & Flight Dynamics Lead)');
    } else {
      setOutboundPhone('+91');
      setRecipientName('External Space Command');
    }
  };

  // Update preview text when topic changes
  useEffect(() => {
    if (outboundTopic.includes('Anomaly') || outboundTopic.includes('Incident')) {
      setPreviewText(
        "Critical Flight Alert: SpaceXOS telemetry detection identified a Level 4 thermal anomaly in the Cartosat-3 optical sector. Incident Diagnostics and Risk Assessment corroborate severe sensor flare. Manual flight director review requested."
      );
    } else if (outboundTopic.includes('Collision') || outboundTopic.includes('Maneuver')) {
      setPreviewText(
        "Emergency Collision Avoidance Notice: Close-approach conjunction detected with orbital track #48812. Miss distance 340 meters. Flight Director authorization required for 12-second delta-V thruster burn."
      );
    } else if (outboundTopic.includes('Volcano') || outboundTopic.includes('Ash')) {
      setPreviewText(
        "Space Situational Awareness Warning: Sub-orbital ash plume elevation detected exceeding 14.5 kilometers. Lower LEO optical star tracker protection protocol activated."
      );
    } else {
      setPreviewText(
        "Spacecraft Telemetry Status: Subsystem telemetry nominal across solar array generation and battery state-of-charge. Optical downlink locked at 1080P 60 frames per second."
      );
    }
  }, [outboundTopic]);

  // Dispatch real outbound call via Twilio
  const handleTriggerOutboundCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outboundPhone) return;

    setIsDialing(true);
    setOutboundAlert(null);

    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiBase}/api/twilio/voice/outbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_phone: outboundPhone,
          topic: outboundTopic,
          caller_name: recipientName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Call dispatch failed');
      }
      
      const newSid = data.call_sid || `CA${Math.random().toString(36).substring(2, 12)}`;
      setOutboundAlert({
        type: 'success',
        title: 'Outbound Call Dispatched',
        message: `Ringing ${recipientName}`,
        phone: outboundPhone,
        sid: newSid
      });
      
      setCallHistory(prev => [
        {
          id: Date.now().toString(),
          timestamp: 'Just now',
          recipientName: recipientName,
          toPhone: outboundPhone,
          topic: outboundTopic,
          status: `Dispatched (SID: ${newSid})`,
          callSid: newSid,
          spokenText: previewText
        },
        ...prev
      ]);
    } catch (err: any) {
      const cleanMsg = cleanErrorMessage(err.message);
      setOutboundAlert({
        type: 'error',
        title: 'Call Dispatch Alert',
        message: cleanMsg,
        phone: outboundPhone
      });
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-r from-blue-950/20 via-indigo-950/20 to-emerald-950/20">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <PhoneForwarded className="w-3.5 h-3.5 animate-pulse" />
              <span>Twilio Outbound AI Voice Telephony</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Emergency Outbound Flight Briefings</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Initiate automated voice briefings to space flight directors, mission administrators, and payload controllers. The AI voice delivers real-time orbital anomaly notifications, collision avoidance alerts, and safe-mode contingency directives.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Caller Line</span>
              <span className="text-xs font-semibold text-blue-400 font-mono">+1 (737) 250-8034</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Outbound Call Dispatch Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Place Outbound AI Call</h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                Twilio Cloud Active
              </span>
            </div>

            {/* Quick Contact Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Select Target Recipient
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectContact('dhanush')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedContact === 'dhanush'
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-600/10'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white block truncate">Dhanush</span>
                    <UserCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate">+91 9347249697</span>
                  <span className="text-[9px] text-blue-400/80 font-medium">Founder / CEO</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectContact('ajay')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedContact === 'ajay'
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-600/10'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white block truncate">Ajay Kumar</span>
                    <Coins className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate">+91 7730838447</span>
                  <span className="text-[9px] text-emerald-400/80 font-medium">EPS & Power Controller</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectContact('rahul')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedContact === 'rahul'
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-600/10'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white block truncate">Rahul Sharma</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate">+91 8886544423</span>
                  <span className="text-[9px] text-purple-400/80 font-medium">Hiring Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectContact('custom')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedContact === 'custom'
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-md shadow-blue-600/10'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white block truncate">Custom</span>
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate">Any Number</span>
                  <span className="text-[9px] text-gray-400/80 font-medium">Direct Dial</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleTriggerOutboundCall} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={outboundPhone}
                    onChange={(e) => setOutboundPhone(e.target.value)}
                    placeholder="+91 8886544423"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Executive Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Briefing Topic
                </label>
                <select
                  value={outboundTopic}
                  onChange={(e) => setOutboundTopic(e.target.value)}
                  className="w-full bg-[#0b0e1c] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Critical Orbital Anomaly Incident Briefing">🚨 Critical Orbital Anomaly Incident Briefing</option>
                  <option value="Collision Avoidance Burn Order (COLA-2026-08)">🛰️ Collision Avoidance Burn Order (COLA-2026-08)</option>
                  <option value="Active Volcanic Ash Plume Flight Hazard Warning">🌋 Active Volcanic Ash Plume Flight Hazard Warning</option>
                  <option value="Spacecraft Safe-Mode Contingency Directive">🛡️ Spacecraft Safe-Mode Contingency Directive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isDialing}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isDialing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dialing Phone Call via Twilio...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span>Place Outbound Call Now</span>
                  </>
                )}
              </button>
            </form>

            {/* High-Visibility Outbound Alert Display - Zero Muddy Gray, Crisp Contrast */}
            {outboundAlert && (
              <div
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 shadow-xl ${
                  outboundAlert.type === 'success'
                    ? 'bg-[#04160c] border-emerald-500/50 shadow-emerald-950/40'
                    : 'bg-[#18080d] border-rose-500/60 shadow-rose-950/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                        outboundAlert.type === 'success'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {outboundAlert.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            outboundAlert.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {outboundAlert.title}
                        </span>
                        {outboundAlert.phone && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-medium">
                            {outboundAlert.phone}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          outboundAlert.type === 'success' ? 'text-emerald-100' : 'text-rose-100'
                        }`}
                      >
                        {outboundAlert.message}
                      </p>

                      {outboundAlert.sid && (
                        <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                          <span className="text-gray-400 font-sans">Twilio SID:</span>
                          <span className="bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-white select-all">
                            {outboundAlert.sid}
                          </span>
                        </div>
                      )}

                      {outboundAlert.type === 'error' && (
                        <div className="pt-2 mt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="text-rose-300/80 font-medium">Verified Caller ID:</span>
                          <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">
                            +1 (737) 250-8034
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOutboundAlert(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Speech Preview & Audio Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Spoken Voice Script</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Polly.Matthew</span>
            </div>

            <p className="text-[11px] text-gray-400">
              The AI voice will speak the following message when the call connects:
            </p>

            <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
              <p className="text-xs text-gray-200 leading-relaxed italic">
                &ldquo;{previewText}&rdquo;
              </p>
              
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => isSpeaking ? stopSpeaking() : speak(previewText)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeaking ? 'Stop Audio Preview' : 'Listen to Audio Preview'}</span>
                </button>
                <span className="text-[10px] text-gray-500">Natural Indian English</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-gray-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Twilio Outbound Verification</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Twilio dials from <span className="text-white font-mono">+1 (737) 250-8034</span> directly to your phone. Ensure verified caller ID status on trial numbers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Calls History */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-white">Outbound Call Dispatch Log</h3>
          </div>
          <span className="text-xs text-gray-500">{callHistory.length} calls logged</span>
        </div>

        <div className="space-y-2.5">
          {callHistory.map(log => (
            <div key={log.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Outbound Call
                  </span>
                  <span className="text-xs font-semibold text-white">{log.recipientName} ({log.toPhone})</span>
                </div>
                <p className="text-xs text-gray-300 font-medium">{log.topic}</p>
                <p className="text-xs text-gray-400 line-clamp-1 italic">&ldquo;{log.spokenText}&rdquo;</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-500 block">{log.timestamp}</span>
                <span className="text-[11px] font-mono text-emerald-400">{log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}