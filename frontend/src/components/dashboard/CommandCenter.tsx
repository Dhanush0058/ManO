import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, Loader2, Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useVoiceRecognition } from '../../lib/useVoiceRecognition';
import { useTextToSpeech } from '../../lib/useTextToSpeech';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent?: string;
  text: string;
}

interface TimelineEvent {
  event: string;
  message: string;
  timestamp: string;
}

interface CommandCenterProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

const getAgentTheme = (agentName?: string) => {
  const name = (agentName || '').toLowerCase();
  if (name.includes('finance') || name.includes('detection')) {
    return { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', text: '#60a5fa', badgeBg: 'rgba(59, 130, 246, 0.1)', label: 'Detection Agent' };
  }
  if (name.includes('legal') || name.includes('reporting')) {
    return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.05)', text: '#c084fc', badgeBg: 'rgba(168, 85, 247, 0.1)', label: 'Mission Reporting' };
  }
  if (name.includes('gtm') || name.includes('incident')) {
    return { border: '#f97316', bg: 'rgba(249, 115, 22, 0.05)', text: '#fb923c', badgeBg: 'rgba(249, 115, 22, 0.1)', label: 'Incident Diagnostics' };
  }
  if (name.includes('hiring') || name.includes('risk')) {
    return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', text: '#34d399', badgeBg: 'rgba(16, 185, 129, 0.1)', label: 'Risk Assessment' };
  }
  return { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)', text: '#818cf8', badgeBg: 'rgba(99, 102, 241, 0.1)', label: agentName || 'SpaceXOS Orchestrator' };
};

export function CommandCenter({ messages, onSendMessage, isLoading }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Text-To-Speech hook
  const { isSpeaking, currentSpeakingId, toggleSpeak } = useTextToSpeech();

  // Speech-To-Text / Voice Recognition hook
  const {
    isListening,
    isTranscribing,
    transcript,
    error: voiceError,
    isSupported: isVoiceSupported,
    toggleListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition((liveText) => {
    if (liveText) {
      setInput(liveText);
    }
  });

  // Sync transcript to input if updated
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // 2. Manage SSE timeline streaming when load starts
  useEffect(() => {
    if (isLoading) {
      setTimelineEvents([]);
      const sseUrl = 'http://127.0.0.1:8000/api/live-events';
      const eventSource = new EventSource(sseUrl);
      
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setTimelineEvents((prev) => [...prev, data]);
        } catch (err) {
          console.error(err);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isLoading, timelineEvents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      resetTranscript();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (!isLoading) {
      if (isListening) stopListening();
      onSendMessage(prompt);
    }
  };

  // Determine if we have sent any user message yet
  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="flex-grow flex flex-col h-full bg-[#000000]/10 overflow-hidden">
      {/* 1. Spacecraft Overview Metrics Grid */}
      <div className="grid grid-cols-8 gap-3 p-4 border-b border-white/5 bg-[#020205]/45">
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Satellites</span>
          <span className="text-[12px] font-bold text-blue-400 mt-1 block">4 Active</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Ingestion</span>
          <span className="text-[12px] font-bold text-emerald-400 mt-1 block">42 ms</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Solar Bus</span>
          <span className="text-[12px] font-bold text-white mt-1 block">1850 W</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Pointing Jitter</span>
          <span className="text-[12px] font-bold text-white mt-1 block">0.048°</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">X-Band SNR</span>
          <span className="text-[12px] font-bold text-emerald-400 mt-1 block">26.9 dB</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Thermal Bus</span>
          <span className="text-[12px] font-bold text-white mt-1 block">18.8 °C</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Conjunction</span>
          <span className="text-[12px] font-bold text-emerald-400 mt-1 block">SAFE</span>
        </div>
        <div className="glass-panel p-2.5 rounded-xl text-center border-yellow-500/10">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Detections</span>
          <span className="text-[12px] font-bold text-yellow-400 mt-1 block">3 Logged</span>
        </div>
      </div>

      {/* 2. Chat Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5">
        {/* Welcome Dashboard (Before first user search) */}
        {!hasUserMessages && (
          <div className="flex flex-col items-center justify-center py-12 px-6 max-w-2xl mx-auto space-y-6 text-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 animate-pulse blur-md opacity-60" />
              <div className="relative w-12 h-12 rounded-full bg-[#0a0c18] border border-white/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Tell SpaceXOS Flight Commander what to coordinate...</h1>
              <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                SpaceXOS coordinates Detection, Incident Diagnostics, Risk Assessment, and Reporting agents. Type or use the <span className="text-cyan-400 font-semibold">🎙️ Microphone</span> to speak your commands naturally.
              </p>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-3 text-left">
              <button 
                onClick={() => handleSuggestedPrompt("Evaluate CartoSat-1 and Cartosat-3 solar bus deviations and flag any Kalman filter spikes.")}
                className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-blue-500/30 text-xs text-gray-300 hover:text-white transition-all text-left col-span-2 sm:col-span-1"
              >
                <span className="font-semibold text-blue-400 block mb-1">🛰️ Orbital Telemetry Scan</span>
                &ldquo;Evaluate CartoSat-1 and Cartosat-3 solar bus deviations and flag any Kalman filter spikes.&rdquo;
              </button>
              <button 
                onClick={() => handleSuggestedPrompt("Run physical subsystem correlation for RISAT-2BR1 gyro pointing jitter anomaly.")}
                className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-emerald-500/30 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                <span className="font-semibold text-emerald-400 block mb-1">🔍 Incident Diagnostics</span>
                &ldquo;Run physical subsystem correlation for RISAT-2BR1 gyro pointing jitter anomaly.&rdquo;
              </button>
              <button 
                onClick={() => handleSuggestedPrompt("Calculate collision probability against space debris track #48812 in proximity cone.")}
                className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-amber-500/30 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                <span className="font-semibold text-amber-400 block mb-1">🛡️ Safety of Flight</span>
                &ldquo;Calculate collision probability against space debris track #48812 in proximity cone.&rdquo;
              </button>
              <button 
                onClick={() => handleSuggestedPrompt("Compile incident dossier for EVT-434DB3BE and prepare Twilio voice briefing dispatch.")}
                className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-purple-500/30 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                <span className="font-semibold text-purple-400 block mb-1">📞 Operator Briefing</span>
                &ldquo;Compile incident dossier for EVT-434DB3BE and prepare Twilio voice briefing dispatch.&rdquo;
              </button>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {hasUserMessages && messages.map((m) => {
          if (m.role === 'assistant') {
            const theme = getAgentTheme(m.agent);
            const isThisSpeaking = isSpeaking && currentSpeakingId === m.id;
            return (
              <div key={m.id} className="max-w-[85%] animate-fade-in group relative">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  {m.agent && (
                    <div 
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block border"
                      style={{ 
                        color: theme.text, 
                        backgroundColor: theme.badgeBg, 
                        borderColor: `rgba(${theme.border === '#10b981' ? '16, 185, 129' : theme.border === '#f43f5e' ? '244, 63, 94' : theme.border === '#06b6d4' ? '6, 181, 212' : theme.border === '#a855f7' ? '168, 85, 247' : theme.border === '#3b82f6' ? '59, 130, 246' : '99, 102, 241'}, 0.25)` 
                      }}
                    >
                      {theme.label}
                    </div>
                  )}

                  {/* Read Aloud Button */}
                  <button
                    type="button"
                    onClick={() => toggleSpeak(m.text, m.id)}
                    title={isThisSpeaking ? "Stop voice readout" : "Listen to agent report"}
                    className={`text-gray-400 hover:text-white transition-colors p-1 rounded-md text-[11px] flex items-center gap-1 opacity-70 hover:opacity-100 ${isThisSpeaking ? 'text-cyan-400 opacity-100' : ''}`}
                  >
                    {isThisSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                        <span className="text-[10px] text-cyan-400 font-mono">Speaking...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] text-gray-500 hover:text-gray-300">Listen</span>
                      </>
                    )}
                  </button>
                </div>

                <div 
                  className="assistant-bubble text-[13px] text-gray-100 p-4 rounded-2xl rounded-tl-none border-l-4 leading-relaxed relative"
                  style={{ 
                    borderLeftColor: theme.border,
                    backgroundColor: theme.bg,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          } else {
            return (
              <div key={m.id} className="max-w-[85%] ml-auto animate-fade-in">
                <div className="user-bubble text-[13px] text-white p-3.5 bg-[#1b1e36]/60 rounded-2xl rounded-tr-none border border-white/5 leading-relaxed">
                  {m.text}
                </div>
              </div>
            );
          }
        })}

        {/* 3. Live Execution Timelines (SSE streams) */}
        {isLoading && (
          <div className="glass-panel p-5 rounded-2xl border border-white/5 max-w-[85%] bg-[#080a14]/60 space-y-3.5">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Live Orchestrator Execution Plan Flow
            </h4>
            
            <div className="space-y-2 border-l border-white/5 pl-3">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="text-[11.5px] text-gray-300 flex items-start gap-2.5 animate-fade-in">
                  <span className="text-gray-500 font-mono text-[10px] mt-0.5">{ev.timestamp}</span>
                  <span className="font-semibold text-sky-400 shrink-0">[{ev.event}]</span>
                  <span className="leading-snug text-gray-400">{ev.message}</span>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <div className="text-[11px] text-gray-600 italic">Initializing state graph classify nodes...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Goal Input Composer Form with Voice Recognition */}
      <div className="p-4 bg-[#020205]/45 border-t border-white/5">
        {/* Voice Error Warning Banner */}
        {voiceError && (
          <div className="mb-3 px-3 py-2 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Active Voice Listening Banner */}
        {isListening && (
          <div className="mb-3 px-3 py-2 bg-gradient-to-r from-cyan-950/50 via-blue-950/50 to-indigo-950/50 border border-cyan-500/30 rounded-xl flex items-center justify-between animate-fade-in shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-2.5">
              {/* Dynamic Sound Wave Bars */}
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-4" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-2.5" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.3s] h-4" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.15s] h-3" />
              </div>
              <span className="text-xs font-semibold text-cyan-300">
                Listening to Flight Director voice... <span className="text-[11px] text-gray-400 font-normal">Speak your mission command</span>
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-[10.5px] font-bold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* AI Whisper Transcribing Banner */}
        {isTranscribing && (
          <div className="mb-3 px-3 py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-2 text-indigo-300 text-xs animate-fade-in">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Processing voice audio with Groq Whisper AI...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Transcribing your voice in real time..." : "Ask Flight Director / SpaceXOS Mission Control what you want to accomplish (or click mic to speak)..."}
            className={`w-full bg-[#0c0e21] border text-gray-100 rounded-xl py-3.5 pl-4 pr-24 focus:outline-none text-sm transition-all placeholder:text-gray-500 shadow-inner ${
              isListening
                ? 'border-cyan-500/50 ring-2 ring-cyan-500/20 bg-[#0e122b]'
                : 'border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20'
            }`}
            disabled={isLoading || isTranscribing}
          />
          
          {/* Action Buttons: Voice Input & Send */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isVoiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading || isTranscribing}
                title={isListening ? "Stop listening" : "Click to speak with voice recognition"}
                className={`p-2.5 rounded-lg border transition-all duration-200 active:scale-95 ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse shadow-lg shadow-rose-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || isTranscribing || !input.trim()}
              title="Execute goal"
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-500 hover:to-blue-500 active:scale-90 disabled:opacity-30 disabled:active:scale-100 transition-all duration-150 border border-indigo-400/20 shadow-md"
            >
              {isLoading || isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
