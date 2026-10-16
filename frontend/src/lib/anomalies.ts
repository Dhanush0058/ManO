export interface SpaceAnomaly {
  id: string;
  image: string;
  beforeImage?: string; // Pre-incident optical baseline capture
  title: string;
  spacecraft: string;
  noradId: string;
  coordinates: string;
  sensor: string;
  metric: string;
  observedValue: string;
  expectedBaseline: string;
  deviationSigma: number;
  detectionSummary: string;
  diagnosticsSummary: string;
  riskSummary: string;
  reportingSummary: string;
  recommendedAction: string;
}

export const SPACE_ANOMALIES: SpaceAnomaly[] = [
  {
    id: 'anomaly-1',
    image: '/anomalies/anomaly-1.jpg',
    beforeImage: '/anomalies/before-anomaly-1.jpg',
    title: 'Massive Wildfire Thermal Plume & Anomalous Heat Zone',
    spacecraft: 'Cartosat-3 Optical Transponder',
    noradId: '44804',
    coordinates: '38°N, 122°W (Northern Ridge Sector)',
    sensor: 'MS-INFRARED / ANOMALY DETECTED',
    metric: 'Thermal Bus & IR Radiance Flux',
    observedValue: '+54.2°C / 4,820 W/m²',
    expectedBaseline: '18.0 - 25.0°C / < 350 W/m²',
    deviationSigma: 8.4,
    detectionSummary: 'Multi-spectral infrared sensor detected catastrophic thermal surge (σ = 8.4) with dense pyrocumulonimbus smoke obscuration across pixel coordinates (612, 440). Solar array bus output dropped 62% due to atmospheric particulate blanket.',
    diagnosticsSummary: 'Convective thermal wildfire plume spreading at 14.8 km/hr with eastward atmospheric advection. Primary optical payload CCD thermal saturation confirmed. No physical spacecraft damage; payload sensor flare matches terrestrial thermal event.',
    riskSummary: 'Criticality Tier-1. High risk of persistent optical sensor blinding on subsequent low-elevation orbital transits. Zero civil aviation visibility in lower flight levels. Regional emergency alert initiated.',
    reportingSummary: 'Executive Incident Dossier generated. Tasked RISAT-2BR1 SAR follow-up pass in 42 minutes for smoke-penetrating perimeter mapping. Direct emergency dispatch transmitted to Administrator Dhanush (dhanushr672@gmail.com).',
    recommendedAction: 'Engage optical shutter attenuation filter; downlink high-priority perimeter coordinates to National Disaster Management and Wildfire Command.'
  },
  {
    id: 'anomaly-2',
    image: '/anomalies/anomaly-2.jpg',
    beforeImage: '/anomalies/before-anomaly-1.jpg',
    title: 'Active Volcanic Eruption & Pyroclastic Ash Plume',
    spacecraft: 'RISAT-2BR1 / ISS Recon Track',
    noradId: '44857',
    coordinates: '18°S, 168°E (Island Subduction Arc)',
    sensor: 'SENSOR: ACTIVE ERUPTION DETECTED',
    metric: 'SO2 Absorption & Ash Column Height',
    observedValue: '380 DU / 16.4 km altitude',
    expectedBaseline: '< 2.0 DU / 0 km',
    deviationSigma: 9.6,
    detectionSummary: 'Multi-spectral optical & SAR scanning captured high-velocity explosive eruption vent with basaltic lava effusion and vertical ash plume ascending into lower stratosphere at 35 m/s.',
    diagnosticsSummary: 'Explosive sub-aerial volcanic eruption with pyroclastic debris entering coastal waters. Subsystem RF transponder experienced 14.2 dB signal attenuation during plume transit. Spacecraft star tracker blinding prevented by autonomous yaw offset.',
    riskSummary: 'Severe trans-oceanic aviation hazard (SIGMET Level Red). Elevated abrasive silicate particles in LEO orbit corridor; coastal marine tsunami risk within 120 nm perimeter.',
    reportingSummary: 'ICAO/VAAC aviation bulletin dispatched. Spacecraft safe-mode optical aperture shielding confirmed for upcoming transit. Comprehensive incident intelligence dossier dispatched to Administrator Dhanush (dhanushr672@gmail.com).',
    recommendedAction: 'Execute safe-mode optical shutter closure; transmit volcanic ash trajectory model to aviation command.'
  },
  {
    id: 'anomaly-3',
    image: '/anomalies/anomaly-3.jpg',
    beforeImage: '/anomalies/before-anomaly-1.jpg',
    title: 'Seismic Surface Fault Rupture & Large-Scale Subsidence',
    spacecraft: 'Cartosat-3 High-Res Imager',
    noradId: '44804',
    coordinates: "35°76'N, 28°18'E (Continental Fault Zone)",
    sensor: 'SEISMIC RUPTURE ZONE / GROUND DISPLACEMENT',
    metric: 'Differential InSAR Ground Offset',
    observedValue: '4.8 m lateral displacement',
    expectedBaseline: '0.00 m (Stable Ground)',
    deviationSigma: 7.9,
    detectionSummary: 'Sub-meter optical satellite scanning identified catastrophic 4.8-meter ground displacement rupture trace severing arterial roadways and rural settlements. Circular sinkhole collapse zone measured at 45m diameter.',
    diagnosticsSummary: 'Mw 7.4 tectonic strike-slip event along regional fault boundary. Primary optical alignment verified nominal; spatial correlation confirms severe infrastructure collapse and ground fissures across 22 km corridor.',
    riskSummary: 'High civilian infrastructure risk. Critical transportation networks, bridges, and buried pipelines severed; high likelihood of rupture aftershocks.',
    reportingSummary: 'Geospatial damage assessment package compiled. Transmitted to International Disaster Charter and emergency rescue response teams. Alert notification sent to Administrator Dhanush (dhanushr672@gmail.com).',
    recommendedAction: 'Schedule emergency multi-spectral change-detection orbit at T+90 minutes; route damage vectors to civil rescue dispatch.'
  },
  {
    id: 'anomaly-4',
    image: '/anomalies/anomaly-4.jpg',
    beforeImage: '/anomalies/before-anomaly-1.jpg',
    title: 'Massive Glacial Ice Shelf Calving & Marine Thermal Bloom',
    spacecraft: 'GSAT-7A / Polar Earth Observation',
    noradId: '43864',
    coordinates: "78°12'N, 15°30'E (Svalbard Fjord Margin)",
    sensor: 'POLAR RADIOMETER / CRYOSPHERE ANOMALY',
    metric: 'Surface Albedo & SST Deviation',
    observedValue: 'Albedo 0.18 / SST +4.1°C',
    expectedBaseline: 'Albedo 0.82 / SST -1.2°C',
    deviationSigma: 6.8,
    detectionSummary: 'Cryospheric radiometer detected massive ice front detachment yielding tabular icebergs into open fjord waters, accompanied by intense localized thermal and sediment upwelling bloom.',
    diagnosticsSummary: 'Rapid structural shear failure along longitudinal crevasse system. High meltwater discharge accelerating basal glacial slide velocity into marine basin.',
    riskSummary: 'High maritime navigation hazard for polar shipping lanes; rapid freshwater injection impacting local thermohaline circulation and marine ecosystem.',
    reportingSummary: 'Maritime Ice Navigation Advisory published. High-cadence radar tracking scheduled on descending polar passes. Advisory dispatched to Administrator Dhanush (dhanushr672@gmail.com).',
    recommendedAction: 'Broadcast iceberg drift trajectory forecast to maritime coast guards and maintain polar orbit observation.'
  }
];
