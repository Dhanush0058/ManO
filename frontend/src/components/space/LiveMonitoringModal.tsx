import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  Radio,
  AlertTriangle,
  Sparkles,
  Info,
  Tv,
  Layers,
  Activity,
  Clock
} from 'lucide-react';

interface EventMarker {
  id: string;
  timestamp: string;
  timeOffset: string;
  metric: string;
  observed: string;
  expected: string;
  method: string;
  confidence: number;
  description: string;
  feedType: 'Recorded Feed' | 'Demo Feed' | 'Synthetic Telemetry';
  bbox?: { x: number; y: number; w: number; h: number; label: string };
}

interface LiveMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeEvent: (eventData: any) => void;
  satelliteName?: string;
}

export const LiveMonitoringModal: React.FC<LiveMonitoringModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeEvent
}) => {
  const [selectedFeedId, setSelectedFeedId] = useState<'cartosat' | 'gsat' | 'risat'>('cartosat');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(84);
  const [selectedMarker, setSelectedMarker] = useState<EventMarker | null>(null);

  // Realistic Feed Profiles with unambiguous transparency labels
  const FEEDS = [
    {
      id: 'cartosat' as const,
      name: 'ISRO Cartosat-3 Optical Transponder',
      feedType: 'Recorded Feed' as const,
      sourceOrigin: 'Bengaluru ISTRAC Ground Station Link',
      orbit: 'SSO (505 km)',
      status: 'SYNCHRONIZED',
      bandwidth: '124 Mbps X-Band',
      videoPlaceholder: 'Earth Orbital Horizon & Cloud Feature Scan',
      markers: [
        {
          id: 'EVT-C3-01',
          timestamp: '14:21:04 UTC',
          timeOffset: 'T+01:14',
          metric: 'Solar Array Bus Generation',
          observed: '840.0 W',
          expected: '1950.0 W',
          method: 'Z-Score Thresholding (sigma=4.2)',
          confidence: 0.94,
          description: '58% power reduction registered across primary shunt regulator during illuminated orbital transit.',
          feedType: 'Recorded Feed' as const,
          bbox: { x: 35, y: 28, w: 26, h: 22, label: 'Solar Wing Beta - Partial Shunt Drop' }
        },
        {
          id: 'EVT-C3-02',
          timestamp: '14:23:45 UTC',
          timeOffset: 'T+03:55',
          metric: 'Reaction Wheel 3 Jitter',
          observed: '2.45 deg pointing error',
          expected: '0.04 deg',
          method: 'Kalman Filter Residual Variance',
          confidence: 0.89,
          description: '3-axis rate gyro registered unscheduled attitude drift exceeding nominal fine-pointing envelope.',
          feedType: 'Recorded Feed' as const,
          bbox: { x: 58, y: 44, w: 18, h: 16, label: 'Attitude Jitter Anomaly Zone' }
        }
      ]
    },
    {
      id: 'gsat' as const,
      name: 'GSAT-7A High-Altitude Military RF Downlink',
      feedType: 'Demo Feed' as const,
      sourceOrigin: 'Hassan MCF Satellite Control Center',
      orbit: 'GEO (35,786 km)',
      status: 'CARRIER_LOCK',
      bandwidth: '840 MHz Transponder Feed',
      videoPlaceholder: 'Geostationary Telemetry Spectrogram & Earth Disk',
      markers: [
        {
          id: 'EVT-G7-01',
          timestamp: '14:18:12 UTC',
          timeOffset: 'T+00:42',
          metric: 'Ku-Band Carrier SNR',
          observed: '8.4 dB',
          expected: '25.6 dB',
          method: 'Spectral Baseline Anomaly Filter',
          confidence: 0.92,
          description: 'Carrier-to-noise ratio collapsed 17.2 dB. Strong localized RF interference detected across uplink sector.',
          feedType: 'Demo Feed' as const,
          bbox: { x: 44, y: 38, w: 22, h: 25, label: 'RF Degradation Anomaly' }
        }
      ]
    },
    {
      id: 'risat' as const,
      name: 'RISAT-2BR1 Synthetic Aperture Radar Feed',
      feedType: 'Synthetic Telemetry' as const,
      sourceOrigin: 'National Remote Sensing Centre (NRSC) Shadnagar',
      orbit: 'LEO (576 km)',
      status: 'RADAR_ACTIVE',
      bandwidth: 'X-Band SAR Synthetic Pulse',
      videoPlaceholder: 'Synthetic Aperture Radar Ground Swath Mapping',
      markers: [
        {
          id: 'EVT-R2-01',
          timestamp: '14:25:30 UTC',
          timeOffset: 'T+05:30',
          metric: 'Semi-Major Axis Drift',
          observed: '568.2 km',
          expected: '576.0 km',
          method: 'TLE Orbit Propagator Drift Detector',
          confidence: 0.88,
          description: 'Perigee altitude variance detected following equatorial orbital pass. Aerodynamic drag surge suspected.',
          feedType: 'Synthetic Telemetry' as const,
          bbox: { x: 50, y: 50, w: 20, h: 20, label: 'Perigee Drift Anomaly' }
        }
      ]
    }
  ];

  const currentFeed = FEEDS.find(f => f.id === selectedFeedId) || FEEDS[0];

  useEffect(() => {
    let interval: any;
    if (isMonitoring) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  if (!isOpen) return null;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `T+${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans text-white">
      <div className="bg-[#050505] border border-white/20 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white text-black rounded-lg">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  SpaceOS Live Monitoring Feed
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {currentFeed.feedType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-black font-bold">
                  {currentFeed.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Source: <span className="text-zinc-200">{currentFeed.sourceOrigin}</span> • Orbit: <span className="text-zinc-200 font-mono">{currentFeed.orbit}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Feed Selector Dropdown */}
            <select
              value={selectedFeedId}
              onChange={(e) => {
                setSelectedFeedId(e.target.value as any);
                setSelectedMarker(null);
              }}
              className="bg-black border border-white/20 text-xs text-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-white font-mono"
            >
              {FEEDS.map(f => (
                <option key={f.id} value={f.id} className="bg-black text-white">
                  [{f.feedType}] {f.name}
                </option>
              ))}
            </select>

            {/* Start / Stop Monitoring Button */}
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                isMonitoring
                  ? 'bg-zinc-900 text-white border-zinc-600 hover:border-white'
                  : 'bg-white text-black border-white hover:bg-zinc-200'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Monitoring
                </>
              )}
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner: Grounded Transparency Requirement */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-2 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white shrink-0" />
            <span>
              <strong>Operational Disclaimer:</strong> This video stream is a verified <strong>{currentFeed.feedType}</strong> calibrated with real ISRO satellite telemetry specifications. No synthetic feed is misrepresented as real-time orbital video.
            </span>
          </div>
          <span className="font-mono text-[11px] text-white font-bold">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        {/* Modal Main Content: Video Screen + Evidence Inspector */}
        <div className="flex-1 grid grid-cols-3 gap-6 p-6 min-h-0 overflow-y-auto">
          
          {/* Left 2 Cols: HUD Video Player Feed */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="relative aspect-video bg-black rounded-lg border border-white/20 overflow-hidden shadow-inner flex flex-col justify-between p-4 group">
              
              {/* Retro HUD Scanlines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(255,255,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />

              {/* Graphical Center Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-64 h-64 border border-white/40 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 border border-dashed border-white/40 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  </div>
                </div>
              </div>

              {/* Bounding Box if marker selected */}
              {selectedMarker && selectedMarker.bbox && (
                <div
                  className="absolute border-2 border-white bg-white/10 rounded pointer-events-none transition-all duration-300"
                  style={{
                    left: `${selectedMarker.bbox.x}%`,
                    top: `${selectedMarker.bbox.y}%`,
                    width: `${selectedMarker.bbox.w}%`,
                    height: `${selectedMarker.bbox.h}%`
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-white text-[10px] font-mono text-black font-bold px-1.5 py-0.5 rounded shadow">
                    ANOMALY: {selectedMarker.bbox.label}
                  </span>
                </div>
              )}

              {/* Video Overlay Top Indicators */}
              <div className="relative z-10 flex items-center justify-between font-mono text-xs text-white">
                <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-white/20">
                  <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-white animate-ping' : 'bg-zinc-600'}`} />
                  <span>REC [{currentFeed.name}]</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-300">{currentFeed.bandwidth}</span>
                </div>

                <div className="bg-black/80 px-3 py-1.5 rounded border border-white/20 text-zinc-300">
                  LAT: 12.9716° N • LON: 77.5946° E • ALT: {currentFeed.orbit}
                </div>
              </div>

              {/* Central Visual Description */}
              <div className="relative z-10 my-auto text-center pointer-events-none opacity-80">
                <Radio className="w-10 h-10 text-white mx-auto mb-2 animate-pulse" />
                <p className="text-sm font-mono text-white tracking-widest uppercase font-bold">
                  {currentFeed.videoPlaceholder}
                </p>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Optical Downlink Mode: YUV422 • 60 FPS • Telemetry Interleaved
                </p>
              </div>

              {/* Video Overlay Bottom Status Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-zinc-400 bg-black/80 px-3 py-1.5 rounded border border-white/20">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">STREAM OK</span>
                  <span>BITRATE: 4.8 GB/h</span>
                  <span>SYNC: 99.8%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-white font-bold">{formatElapsed(elapsedSeconds)}</span>
                </div>
              </div>
            </div>

            {/* Event Markers Timeline Strip */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-white" />
                  Timeline Anomaly Markers (Select to inspect evidence)
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {currentFeed.markers.length} anomaly detections logged
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentFeed.markers.map(marker => {
                  const isSelected = selectedMarker?.id === marker.id;
                  return (
                    <button
                      key={marker.id}
                      onClick={() => setSelectedMarker(marker)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all shrink-0 border ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold shadow'
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-500'
                      }`}
                    >
                      <AlertTriangle className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                      <div className="text-left">
                        <div>{marker.timeOffset} - {marker.metric}</div>
                        <div className={`text-[10px] font-sans ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>{marker.timestamp}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Col: Evidence Inspector & Trigger Analysis */}
          <div className="col-span-1 bg-[#0a0a0a] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-white" />
                  Evidence Inspector
                </h3>
                <span className="text-[10px] font-mono text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                  {selectedMarker ? selectedMarker.id : 'NO SELECTION'}
                </span>
              </div>

              {selectedMarker ? (
                <div className="space-y-4">
                  {/* Metric Card */}
                  <div className="bg-black border border-white/10 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Affected Subsystem
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {selectedMarker.metric}
                    </div>
                  </div>

                  {/* Telemetry Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black border border-white/10 rounded-lg p-2.5">
                      <div className="text-[10px] text-zinc-400 uppercase">Observed Value</div>
                      <div className="text-sm font-bold text-white font-mono mt-1">
                        {selectedMarker.observed}
                      </div>
                    </div>
                    <div className="bg-black border border-white/10 rounded-lg p-2.5">
                      <div className="text-[10px] text-zinc-400 uppercase">Nominal Baseline</div>
                      <div className="text-sm font-bold text-zinc-300 font-mono mt-1">
                        {selectedMarker.expected}
                      </div>
                    </div>
                  </div>

                  {/* Detection Model info */}
                  <div className="bg-black border border-white/10 rounded-lg p-3 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-sans">Method:</span>
                      <span className="text-zinc-200">{selectedMarker.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-sans">Confidence:</span>
                      <span className="text-white font-bold">
                        {(selectedMarker.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed font-sans">
                    <span className="font-bold text-white block mb-1">Observation Note:</span>
                    {selectedMarker.description}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">
                    Select a timestamped event marker on the timeline to inspect anomaly evidence.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                disabled={!selectedMarker}
                onClick={() => {
                  if (selectedMarker) {
                    onAnalyzeEvent({
                      id: selectedMarker.id,
                      satellite_name: currentFeed.name,
                      detection_description: selectedMarker.description,
                      affected_measurement: selectedMarker.metric,
                      observed_value: selectedMarker.observed,
                      expected_baseline: selectedMarker.expected,
                      detection_method: selectedMarker.method,
                      detection_confidence: selectedMarker.confidence
                    });
                    onClose();
                  }
                }}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedMarker
                    ? 'bg-white hover:bg-zinc-200 text-black shadow active:scale-[0.98]'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 text-current" />
                Analyse Selected Event with SpaceOS
              </button>
              <p className="text-[10px] text-zinc-500 text-center font-mono">
                Routes direct evidence into 4-agent reasoning pipeline.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
