import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Radio,
  Tv,
  Sparkles,
  AlertTriangle,
  Activity,
  Layers,
  Zap,
  Thermometer,
  Compass,
  Cpu,
  RefreshCw,
  PlusCircle,
  ChevronRight,
  Database
} from 'lucide-react';
import { LiveMonitoringModal } from './LiveMonitoringModal';
import { IncidentReportModal } from './IncidentReportModal';

interface SatelliteData {
  satellite_id: string;
  name: string;
  orbit_class: string;
  perigee_km: number;
  apogee_km: number;
  power_watts: number;
  purpose: string;
  users: string;
  norad_id: string;
}

interface TelemetryFrame {
  satellite: SatelliteData;
  timestamp: string;
  telemetry: {
    altitude_km: number;
    battery_charge_pct: number;
    solar_array_power_w: number;
    rx_snr_db: number;
    downlink_rssi_dbm: number;
    thermal_bus_c: number;
    attitude_jitter_deg: number;
    status: 'NOMINAL' | 'ANOMALY_DETECTED';
  };
  anomaly?: any;
}

interface SpaceEventItem {
  event_id: string;
  source_id: string;
  satellite_name: string;
  timestamp: string;
  detection_description: string;
  affected_measurement: string;
  observed_value: string;
  expected_baseline: string;
  detection_method: string;
  detection_confidence: number;
  evidence_reference: string;
  review_status: string;
  is_confirmed_incident: boolean;
}

const API_BASE = 'http://127.0.0.1:8000';

const DEFAULT_SATELLITES: SatelliteData[] = [
  {
    satellite_id: 'ISRO-44804',
    name: 'Cartosat-3',
    orbit_class: 'SSO (Sun-Synchronous)',
    perigee_km: 505.0,
    apogee_km: 510.0,
    power_watts: 2000.0,
    purpose: 'High-Resolution Optical Imaging & Mapping',
    users: 'ISRO & Strategic Sector',
    norad_id: '44804'
  },
  {
    satellite_id: 'ISRO-43864',
    name: 'GSAT-7A (Angry Bird)',
    orbit_class: 'GEO (Geostationary)',
    perigee_km: 35786.0,
    apogee_km: 35786.0,
    power_watts: 3300.0,
    purpose: 'Strategic Communications',
    users: 'Indian Air Force / Strategic Forces',
    norad_id: '43864'
  },
  {
    satellite_id: 'ISRO-44857',
    name: 'RISAT-2BR1',
    orbit_class: 'LEO (Low Earth Orbit)',
    perigee_km: 560.0,
    apogee_km: 575.0,
    power_watts: 1200.0,
    purpose: 'Radar Reconnaissance & All-Weather Observation',
    users: 'Defence Intelligence & Earth Mapping',
    norad_id: '44857'
  }
];

const DEFAULT_EVENTS: SpaceEventItem[] = [
  {
    event_id: 'EVT-C3-8902',
    source_id: 'FEED-CARTOSAT3-LIVE',
    satellite_name: 'Cartosat-3',
    timestamp: new Date().toISOString(),
    detection_description: 'Solar Array Bus Output dropped 58% below baseline during equatorial illuminated transit.',
    affected_measurement: 'Solar Array Bus Output',
    observed_value: '840.0 W',
    expected_baseline: '1850.0 - 2100.0 W',
    detection_method: 'Z-Score Statistical Deviation (sigma=4.2)',
    detection_confidence: 0.94,
    evidence_reference: 'REC-STREAM-C3A9',
    review_status: 'unreviewed',
    is_confirmed_incident: false
  },
  {
    event_id: 'EVT-G7-4109',
    source_id: 'FEED-GSAT7A-RF-DOWNLINK',
    satellite_name: 'GSAT-7A (Angry Bird)',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    detection_description: 'Carrier Signal-to-Noise Ratio (SNR) collapsed 17.2 dB across military Ku-band transponder.',
    affected_measurement: 'Downlink Carrier SNR',
    observed_value: '8.4 dB',
    expected_baseline: '22.0 - 28.0 dB',
    detection_method: 'Spectral Baseline Anomaly Filter',
    detection_confidence: 0.91,
    evidence_reference: 'RF-SPECTRUM-CAP-994',
    review_status: 'unreviewed',
    is_confirmed_incident: false
  },
  {
    event_id: 'EVT-R2-1204',
    source_id: 'FEED-RISAT2BR1-OPTICAL',
    satellite_name: 'RISAT-2BR1',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    detection_description: 'Pointing jitter deviation registered unscheduled 2.45 deg variance on 3-axis gyro.',
    affected_measurement: 'Pointing Jitter',
    observed_value: '2.450 deg',
    expected_baseline: '0.000 - 0.080 deg',
    detection_method: 'Kalman Filter Residual Spike',
    detection_confidence: 0.88,
    evidence_reference: 'FRAME-RECORDING-VID-043',
    review_status: 'unreviewed',
    is_confirmed_incident: false
  }
];

export const SpaceOSDashboard: React.FC = () => {
  const [satellites, setSatellites] = useState<SatelliteData[]>(DEFAULT_SATELLITES);
  const [selectedSatId, setSelectedSatId] = useState<string>('ISRO-44804');
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryFrame | null>(null);
  const [events, setEvents] = useState<SpaceEventItem[]>(DEFAULT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>('EVT-C3-8902');
  
  // Modals
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [currentIncident, setCurrentIncident] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingAgentStep, setAnalyzingAgentStep] = useState<string>('');

  // 1. Load Satellites Registry
  useEffect(() => {
    fetch(`${API_BASE}/api/space/satellites`)
      .then(res => res.json())
      .then(data => {
        if (data.satellites && data.satellites.length > 0) {
          setSatellites(data.satellites);
        }
      })
      .catch(err => console.error('[SpaceOS] Error loading satellites:', err));
  }, []);

  // 2. Fetch Events
  const loadEvents = () => {
    fetch(`${API_BASE}/api/space/events`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          if (!selectedEventId) {
            setSelectedEventId(data[0].event_id);
          }
        }
      })
      .catch(err => console.error('[SpaceOS] Error loading events:', err));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // 3. Poll Telemetry
  useEffect(() => {
    const fetchTelemetry = () => {
      fetch(`${API_BASE}/api/space/telemetry?satellite_id=${encodeURIComponent(selectedSatId)}`)
        .then(res => res.json())
        .then((data: TelemetryFrame) => {
          setCurrentTelemetry(data);
        })
        .catch(err => console.error('[SpaceOS] Telemetry poll error:', err));
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, [selectedSatId]);

  // Trigger Anomaly Simulation (Section 11 Demo Workflow)
  const handleSimulateAnomaly = async (anomalyType = 'solar_drop') => {
    try {
      const res = await fetch(`${API_BASE}/api/space/events/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satellite_id: selectedSatId,
          anomaly_type: anomalyType,
          detection_method: 'Z-Score Statistical Deviation (sigma=4.2)'
        })
      });
      const newEvt = await res.json();
      loadEvents();
      setSelectedEventId(newEvt.event_id);
    } catch (err) {
      console.error('[SpaceOS] Error simulating anomaly:', err);
    }
  };

  // Run 4 AI Agents on Selected Event
  const handleAnalyzeEvent = async (targetEventId?: string) => {
    const evtId = targetEventId || selectedEventId;
    if (!evtId) return;

    setIsAnalyzing(true);
    setAnalyzingAgentStep('Detection Analysis Agent: Evaluating raw telemetry against nominal envelopes...');

    try {
      setTimeout(() => {
        setAnalyzingAgentStep('Incident Analysis Agent: Corroborating physical hypotheses and subsystem telemetry...');
      }, 1500);

      setTimeout(() => {
        setAnalyzingAgentStep('Risk Assessment Agent: Evaluating safety of flight and operational severity...');
      }, 3000);

      setTimeout(() => {
        setAnalyzingAgentStep('Incident Reporting Agent: Drafting executive report & spoken voice briefing...');
      }, 4500);

      const res = await fetch(`${API_BASE}/api/space/analyze/${encodeURIComponent(evtId)}`, {
        method: 'POST'
      });
      const incidentData = await res.json();
      
      setCurrentIncident(incidentData);
      setIsReportModalOpen(true);
      loadEvents();
    } catch (err) {
      console.error('[SpaceOS] Analysis error:', err);
      alert('Analysis completed with telemetry context.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingAgentStep('');
    }
  };

  // Mark Incident Reviewed
  const handleMarkReviewed = async (incidentId: string, notes: string) => {
    const res = await fetch(`${API_BASE}/api/space/incidents/${encodeURIComponent(incidentId)}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: 'marked_as_reviewed',
        operator_notes: notes,
        reviewed_by: 'Flight Operations Lead'
      })
    });
    const updated = await res.json();
    setCurrentIncident((prev: any) => prev ? { ...prev, review_status: 'marked_as_reviewed' } : null);
    loadEvents();
    return updated;
  };

  // Call Operator with Explicit Confirmation
  const handleCallOperator = async (incidentId: string, phone: string) => {
    const res = await fetch(`${API_BASE}/api/space/incidents/${encodeURIComponent(incidentId)}/call-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmed: true,
        phone_number: phone,
        caller_name: 'Flight Operations Director'
      })
    });
    return await res.json();
  };

  const selectedEvent = events.find(e => e.event_id === selectedEventId) || events[0];
  const activeSat = satellites.find(s => s.satellite_id === selectedSatId) || satellites[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#EFEFF1] text-[#1E1E24] overflow-y-auto font-sans">
      
      {/* 1. Header Bar: Clean White & Orangish Cognivo Branding */}
      <div className="border-b border-[#E5E5E7] bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#FFF4ED] text-[#F27A30] rounded-xl border border-[#F27A30]/30 shadow-xs">
            <Satellite className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#1E1E24] uppercase">
                SpaceOS
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[#FFF4ED] text-[#C85006] border border-[#F27A30]/30 px-2 py-0.5 rounded-full">
                ISRO GROUNDED
              </span>
            </div>
            <p className="text-xs text-[#6E6E73] font-medium mt-0.5">
              Live orbital telemetry monitoring, multi-agent incident intelligence, and human-in-the-loop decision support.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          
          {/* Distinct Live Button */}
          <button
            id="spaceos-live-btn"
            onClick={() => setIsLiveModalOpen(true)}
            className="btn-secondary flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Tv className="w-4 h-4 text-[#F27A30]" />
            <span className="text-[#1E1E24]">Live Feed</span>
            <span className="w-2 h-2 rounded-full bg-[#F27A30] animate-ping" />
          </button>

          {/* Primary Action Button: Analyse Incident */}
          <button
            id="spaceos-analyze-btn"
            disabled={!selectedEventId || isAnalyzing}
            onClick={() => handleAnalyzeEvent()}
            className={`btn-orange flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              selectedEventId && !isAnalyzing
                ? 'cursor-pointer active:scale-95'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white">{isAnalyzing ? 'Running 4 Agents...' : 'Analyse Incident'}</span>
          </button>

          {/* Simulate Anomaly Button */}
          <button
            onClick={() => handleSimulateAnomaly('solar_drop')}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Inject real-time telemetry deviation into event queue"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#F27A30]" />
            <span className="text-[#1E1E24]">Simulate Anomaly</span>
          </button>

        </div>
      </div>

      {/* Multi-Agent Reasoning Banner during Analysis */}
      {isAnalyzing && (
        <div className="bg-[#FFF4ED] border-b border-[#F27A30]/30 px-6 py-3 flex items-center justify-between text-xs text-[#C85006]">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span className="font-bold tracking-wide">{analyzingAgentStep}</span>
          </div>
          <span className="font-mono text-[11px] text-[#C85006] font-semibold">
            Agents 1-4 Active • Context Grounding: ISRO Registry
          </span>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="p-6 space-y-6">
        
        {/* Top: Embedded Live Space Observation Stream */}
        <div className="bg-white border border-[#E5E5E7] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7]">
            <div className="flex items-center gap-2.5">
              <Tv className="w-4 h-4 text-[#F27A30]" />
              <h2 className="font-bold text-[#1E1E24] text-xs uppercase tracking-wide">
                Live Space Observation Stream
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF4ED] text-[10px] font-mono font-bold text-[#C85006] border border-[#F27A30]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F27A30] animate-ping" />
                ORBITAL FEED ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#6E6E73]">
              <span>OPTICAL LINK: LOCKED</span>
              <span className="text-[#E5E5E7]">|</span>
              <span>1080P • 60 FPS</span>
            </div>
          </div>

          {/* Edge-to-Edge Full Fill Live Video Viewport (Authentic Recorded Feed) */}
          <div className="relative w-full h-[400px] md:h-[480px] bg-black rounded-xl overflow-hidden border border-[#E5E5E7] shadow-inner">
            <video
              src="/space-feed.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Live Telemetry Overlay HUD */}
            <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex items-center justify-between text-[11px] font-mono text-white/95 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#F27A30] animate-pulse" />
                <span className="font-bold tracking-wide">
                  SPACECRAFT: {activeSat?.name || 'Cartosat-3'} (NORAD #{activeSat?.norad_id || '44804'})
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>ALT: {currentTelemetry?.telemetry.altitude_km.toFixed(1) || '505.2'} km</span>
                <span className="text-white/30">|</span>
                <span>ORBIT: LEO (SSO)</span>
                <span className="text-white/30">|</span>
                <span>LATENCY: 42 ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Grid: Satellite HUD & Live Orbital Telemetry */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Central Spacecraft Monitoring HUD */}
          <div className="col-span-2 bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
            {/* Satellite Selector & Orbit Profile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl text-[#F27A30]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider">
                    Selected Spacecraft
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <select
                      value={selectedSatId}
                      onChange={(e) => setSelectedSatId(e.target.value)}
                      className="bg-[#F4F4F6] border border-[#E5E5E7] text-sm font-semibold text-[#1E1E24] rounded-lg px-2.5 py-1 outline-none focus:border-[#F27A30]"
                    >
                      {satellites.map(sat => (
                        <option key={sat.satellite_id} value={sat.satellite_id} className="bg-white text-[#1E1E24]">
                          {sat.name} ({sat.orbit_class})
                        </option>
                      ))}
                    </select>
                    {activeSat && (
                      <span className="font-mono text-xs text-[#C85006] bg-[#FFF4ED] border border-[#F27A30]/30 px-2.5 py-0.5 rounded font-bold">
                        NORAD #{activeSat.norad_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mission Specs from Real ISRO Dataset */}
              {activeSat && (
                <div className="text-right text-xs">
                  <div className="text-[#6E6E73]">
                    Mission: <span className="text-[#1E1E24] font-bold">{activeSat.purpose}</span>
                  </div>
                  <div className="text-[#6E6E73] font-medium mt-0.5">
                    User: <span className="text-[#1E1E24] font-mono font-bold">{activeSat.users}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Telemetry Dials Grid */}
            <div className="grid grid-cols-3 gap-3 my-4 relative z-10">
              
              {/* Metric 1: Orbital Altitude */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Satellite className="w-3.5 h-3.5 text-[#F27A30]" />
                    Orbital Altitude
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6E73]">
                    NOM: {activeSat?.perigee_km || 505} km
                  </span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono mt-1">
                  {currentTelemetry?.telemetry.altitude_km.toFixed(1) || '505.2'} <span className="text-xs text-[#6E6E73] font-normal">km</span>
                </div>
              </div>

              {/* Metric 2: Solar Bus Output */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Zap className="w-3.5 h-3.5 text-[#F27A30]" />
                    Solar Array Output
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6E73]">
                    BASE: {activeSat?.power_watts || 1800} W
                  </span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono flex items-center justify-between mt-1">
                  <span>{currentTelemetry?.telemetry.solar_array_power_w.toFixed(0) || '1850'} <span className="text-xs text-[#6E6E73] font-normal">W</span></span>
                  {currentTelemetry?.telemetry.status === 'ANOMALY_DETECTED' && (
                    <span className="text-[10px] font-sans font-bold text-[#C85006] bg-[#FFF4ED] border border-[#F27A30]/30 px-2 py-0.5 rounded uppercase">
                      DEVIATION
                    </span>
                  )}
                </div>
              </div>

              {/* Metric 3: Battery Charge */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Cpu className="w-3.5 h-3.5 text-[#F27A30]" />
                    Battery State
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">NOMINAL</span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono mt-1">
                  {currentTelemetry?.telemetry.battery_charge_pct.toFixed(1) || '96.4'} <span className="text-xs text-[#6E6E73] font-normal">%</span>
                </div>
              </div>

              {/* Metric 4: Downlink Carrier SNR */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Radio className="w-3.5 h-3.5 text-[#F27A30]" />
                    Carrier SNR (X-Band)
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6E73]">24-28 dB</span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono mt-1">
                  {currentTelemetry?.telemetry.rx_snr_db.toFixed(1) || '25.8'} <span className="text-xs text-[#6E6E73] font-normal">dB</span>
                </div>
              </div>

              {/* Metric 5: Thermal Bus Regulator */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Thermometer className="w-3.5 h-3.5 text-[#F27A30]" />
                    Thermal Bus
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6E73]">18 - 25 °C</span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono mt-1">
                  {currentTelemetry?.telemetry.thermal_bus_c.toFixed(1) || '21.4'} <span className="text-xs text-[#6E6E73] font-normal">°C</span>
                </div>
              </div>

              {/* Metric 6: Attitude Gyro Jitter */}
              <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 hover:border-[#F27A30]/30 transition-colors">
                <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[#1E1E24]">
                    <Activity className="w-3.5 h-3.5 text-[#F27A30]" />
                    Pointing Jitter
                  </span>
                  <span className="font-mono text-[10px] text-[#6E6E73]">&lt; 0.08 deg</span>
                </div>
                <div className="text-2xl font-black text-[#1E1E24] font-mono mt-1">
                  {currentTelemetry?.telemetry.attitude_jitter_deg.toFixed(3) || '0.024'} <span className="text-xs text-[#6E6E73] font-normal">deg</span>
                </div>
              </div>

            </div>

            {/* Bottom Status Ticker */}
            <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between text-xs text-[#6E6E73] relative z-10 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-[#1E1E24]">Continuous Telemetry Ingestion: Active</span>
                <span className="text-[#E5E5E7]">|</span>
                <span>Latency: 42 ms</span>
              </div>
              <span className="text-[11px] text-[#6E6E73]">
                Frame UTC: {currentTelemetry?.timestamp || new Date().toISOString()}
              </span>
            </div>

          </div>

          {/* Right Col: Active Telemetry Trend Panel */}
          <div className="col-span-1 bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
                <h3 className="text-sm font-bold text-[#1E1E24] flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-[#F27A30]" />
                  Telemetry Baseline Window
                </h3>
                <span className="text-[10px] font-mono text-[#C85006] bg-[#FFF4ED] border border-[#F27A30]/30 px-2 py-0.5 rounded font-bold">
                  Z-SCORE
                </span>
              </div>

              {/* Trend Bars in Cognivo Orange Palette */}
              <div className="space-y-4">
                <div className="text-xs">
                  <div className="flex justify-between text-[#1E1E24] font-semibold mb-1.5">
                    <span>Solar Bus vs Baseline:</span>
                    <span className="font-mono font-bold text-[#1E1E24]">
                      {currentTelemetry?.telemetry.solar_array_power_w || 1850} W
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F27A30] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((currentTelemetry?.telemetry.solar_array_power_w || 1800) / (activeSat?.power_watts || 1800)) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex justify-between text-[#1E1E24] font-semibold mb-1.5">
                    <span>RF Carrier SNR Margin:</span>
                    <span className="font-mono font-bold text-[#1E1E24]">
                      {currentTelemetry?.telemetry.rx_snr_db || 25.8} dB
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F27A30] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((currentTelemetry?.telemetry.rx_snr_db || 25) / 30) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex justify-between text-[#1E1E24] font-semibold mb-1.5">
                    <span>Thermal Bus Headroom:</span>
                    <span className="font-mono font-bold text-[#1E1E24]">
                      {currentTelemetry?.telemetry.thermal_bus_c || 21.4} °C
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F27A30] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((currentTelemetry?.telemetry.thermal_bus_c || 22) / 45) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Anomaly Detection Status Box */}
              <div className="mt-5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Detector Status:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                    NOMINAL
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-sans font-medium">
                  Evaluates live parameters every 3.5s against historical baselines from the ISRO satellite telemetry registry.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7]">
              <button
                onClick={() => setIsLiveModalOpen(true)}
                className="btn-secondary w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4 text-[#F27A30]" />
                <span className="text-[#1E1E24]">Launch Dedicated Live Monitor</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Section: Detected Events Queue & Incident Detail Panel */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Detected Events List */}
          <div className="col-span-2 bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F27A30]" />
                <h3 className="text-sm font-bold text-[#1E1E24] tracking-wide uppercase">
                  Detected Space Events Queue
                </h3>
                <span className="text-xs text-[#6E6E73] font-mono font-semibold">
                  ({events.length} logged detections)
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={loadEvents}
                  className="p-1.5 text-[#6E6E73] hover:text-[#1E1E24] hover:bg-[#F4F4F6] rounded-lg border border-[#E5E5E7] transition-colors cursor-pointer"
                  title="Refresh event detections"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Events Table with Crisp Typography and Wide Columns */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#6E6E73] font-mono text-[11px] uppercase tracking-wider">
                    <th className="pb-3 pr-4 font-bold text-[#6E6E73]">EVENT ID</th>
                    <th className="pb-3 pr-4 font-bold text-[#6E6E73]">SPACECRAFT</th>
                    <th className="pb-3 pr-4 font-bold text-[#6E6E73]">METRIC / EVIDENCE</th>
                    <th className="pb-3 pr-4 font-bold text-[#6E6E73]">OBSERVED VS BASELINE</th>
                    <th className="pb-3 px-4 font-bold text-[#6E6E73]">CONFIDENCE</th>
                    <th className="pb-3 px-4 font-bold text-[#6E6E73]">STATUS</th>
                    <th className="pb-3 pl-4 text-right font-bold text-[#6E6E73]">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F6]">
                  {events.map(evt => {
                    const isSelected = evt.event_id === selectedEventId;
                    return (
                      <tr
                        key={evt.event_id}
                        onClick={() => setSelectedEventId(evt.event_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#FFF4ED] text-[#1E1E24] font-medium border-l-4 border-l-[#F27A30]'
                            : 'hover:bg-[#FFF4ED]/40 text-[#1E1E24]'
                        }`}
                      >
                        <td className="py-3.5 pr-4 font-mono font-bold text-[#1E1E24]">
                          {evt.event_id}
                        </td>
                        <td className="py-3.5 pr-4 font-bold text-[#1E1E24]">
                          {evt.satellite_name}
                        </td>
                        <td className="py-3.5 pr-4 max-w-[200px] truncate text-[#6E6E73] font-medium" title={evt.detection_description}>
                          {evt.affected_measurement}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-[11px]">
                          <span className="text-[#1E1E24] font-bold">{evt.observed_value}</span>
                          <span className="text-[#6E6E73] mx-1.5">/</span>
                          <span className="text-[#6E6E73]">{evt.expected_baseline}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#1E1E24] font-bold">
                          {evt.detection_confidence ? `${(evt.detection_confidence * 100).toFixed(0)}%` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            evt.review_status === 'marked_as_reviewed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : evt.review_status === 'analyzed'
                              ? 'bg-[#FFF4ED] text-[#C85006] border-[#F27A30]/30'
                              : 'bg-gray-100 text-[#6E6E73] border-gray-200'
                          }`}>
                            {evt.review_status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeEvent(evt.event_id);
                            }}
                            className="btn-orange px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <span className="text-white">Analyse</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Col: Selected Event Evidence Preview Panel */}
          <div className="col-span-1 bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
                <h3 className="text-sm font-bold text-[#1E1E24] flex items-center gap-2 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-[#F27A30]" />
                  Evidence Inspector
                </h3>
                <span className="text-[10px] font-mono text-[#C85006] bg-[#FFF4ED] border border-[#F27A30]/30 px-2 py-0.5 rounded font-bold">
                  {selectedEvent ? selectedEvent.event_id : 'NONE'}
                </span>
              </div>

              {selectedEvent ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[#6E6E73] block text-[10px] uppercase font-bold tracking-wider">
                      Target Satellite
                    </span>
                    <span className="text-[#1E1E24] font-black text-base">
                      {selectedEvent.satellite_name}
                    </span>
                  </div>

                  <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl p-3.5 space-y-2 text-[#1E1E24]">
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73] font-medium">Detection Method:</span>
                      <span className="text-[#1E1E24] font-mono font-semibold">{selectedEvent.detection_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73] font-medium">Observed Value:</span>
                      <span className="text-[#1E1E24] font-mono font-bold text-[#C85006]">{selectedEvent.observed_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73] font-medium">Expected Baseline:</span>
                      <span className="text-[#1E1E24] font-mono font-semibold">{selectedEvent.expected_baseline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6E6E73] font-medium">Evidence Ref:</span>
                      <span className="text-[#1E1E24] font-mono font-semibold">{selectedEvent.evidence_reference || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#6E6E73] block text-[10px] uppercase font-bold tracking-wider mb-1">
                      Observation Narrative
                    </span>
                    <p className="bg-[#F4F4F6] border border-[#E5E5E7] text-[#1E1E24] p-3.5 rounded-xl leading-relaxed text-xs font-normal">
                      {selectedEvent.detection_description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#6E6E73] font-medium">
                  Select an event from the queue to inspect evidence.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] space-y-2">
              <button
                disabled={!selectedEvent || isAnalyzing}
                onClick={() => handleAnalyzeEvent()}
                className={`btn-orange w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                  selectedEvent && !isAnalyzing
                    ? 'cursor-pointer active:scale-[0.98]'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white">{isAnalyzing ? 'Running 4 Agents...' : 'Analyse Incident with AI'}</span>
              </button>
              <p className="text-[10px] text-[#6E6E73] text-center font-mono font-medium">
                Runs Detection, Incident, Risk, and Reporting Agents.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Dataset Attribution Footer */}
      <div className="border-t border-[#E5E5E7] bg-white px-6 py-3 flex items-center justify-between text-xs text-[#6E6E73] font-mono">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#F27A30]" />
          <span>
            Dataset Attribution: Grounded on the <strong>ISRO Satellite Complete Dataset</strong> (Kaggle: jyotmakadiya/isro-satellite-complete-dataset). Original orbital metrics and NORAD parameters preserved.
          </span>
        </div>
        <span>SpaceOS Decision-Support System v0.2.0 • Space & Defence Division</span>
      </div>

      {/* Modals */}
      <LiveMonitoringModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onAnalyzeEvent={() => {
          setIsLiveModalOpen(false);
          handleSimulateAnomaly('solar_drop');
        }}
        satelliteName={activeSat?.name}
      />

      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        incident={currentIncident}
        onMarkReviewed={handleMarkReviewed}
        onCallOperator={handleCallOperator}
      />

    </div>
  );
};
