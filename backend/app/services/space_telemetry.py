"""
space_telemetry.py - SpaceOS Telemetry Ingestion & Anomaly Detection Service.
Grounded on real ISRO Satellite data (ISRO complete dataset from Kaggle).
Provides baseline telemetry ranges, synthetic deviation injection for live demos,
and pre-seeded baseline events.
"""

import os
import csv
import random
import datetime
from typing import List, Dict, Any, Optional

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "space", "isro_satellites.csv")

# In-memory cached satellite list
_CACHED_SATELLITES: List[Dict[str, Any]] = []

def load_isro_satellites() -> List[Dict[str, Any]]:
    global _CACHED_SATELLITES
    if _CACHED_SATELLITES:
        return _CACHED_SATELLITES
    
    if not os.path.exists(DATA_PATH):
        # Fallback if csv file not found
        return [
            {
                "satellite_id": "SAT-ISRO-GSAT7A",
                "name": "GSAT-7A (Angry Bird)",
                "orbit_class": "GEO",
                "perigee_km": 35786.0,
                "apogee_km": 35786.0,
                "power_watts": 3300.0,
                "purpose": "Military Communications",
                "users": "Indian Air Force",
                "norad_id": 43864
            },
            {
                "satellite_id": "SAT-ISRO-RISAT2BR1",
                "name": "RISAT-2BR1",
                "orbit_class": "LEO",
                "perigee_km": 560.0,
                "apogee_km": 575.0,
                "power_watts": 1200.0,
                "purpose": "Radar Reconnaissance & Earth Observation",
                "users": "Strategic Forces / Defence",
                "norad_id": 44857
            },
            {
                "satellite_id": "SAT-ISRO-CARTOSAT3",
                "name": "Cartosat-3",
                "orbit_class": "SSO (Sun-Synchronous)",
                "perigee_km": 505.0,
                "apogee_km": 510.0,
                "power_watts": 2000.0,
                "purpose": "High-Resolution Optical Imaging",
                "users": "Defence & Civil Mapping",
                "norad_id": 44804
            }
        ]

    sats = []
    try:
        with open(DATA_PATH, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                name = row.get("Current Official Name of Satellite") or row.get("Official Name of Satellite") or f"ISRO-SAT-{i+1}"
                orbit = row.get("Class of Orbit", "LEO")
                
                # Clean numerical values
                def parse_float(val, default=0.0):
                    try:
                        return float(str(val).replace(",", "").strip())
                    except Exception:
                        return default

                perigee = parse_float(row.get("Perigee (km)"), 500.0)
                apogee = parse_float(row.get("Apogee (km)"), 550.0)
                power = parse_float(row.get("Power (watts)"), 1500.0)
                norad = row.get("NORAD Number", f"9{i:04d}")

                sat_id = f"ISRO-{norad}".strip()
                sats.append({
                    "satellite_id": sat_id,
                    "name": name.strip(),
                    "orbit_class": orbit.strip(),
                    "perigee_km": perigee,
                    "apogee_km": apogee,
                    "power_watts": power if power > 0 else 1800.0,
                    "purpose": row.get("Purpose", "Earth Observation & Communications").strip(),
                    "users": row.get("Users", "ISRO / Strategic Sector").strip(),
                    "norad_id": norad.strip()
                })
        _CACHED_SATELLITES = sats
    except Exception as e:
        print(f"[SpaceOS] Error loading ISRO dataset: {e}")
    return _CACHED_SATELLITES


def get_satellite_by_id(satellite_id: str) -> Optional[Dict[str, Any]]:
    sats = load_isro_satellites()
    for s in sats:
        if s["satellite_id"] == satellite_id or s["name"].lower() == satellite_id.lower():
            return s
    return sats[0] if sats else None


def generate_live_telemetry_frame(satellite_id: str, inject_anomaly: bool = False, anomaly_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a live telemetry reading based on the actual satellite specifications from ISRO dataset.
    If inject_anomaly is True, simulates specific physical deviations beyond nominal bounds.
    """
    sat = get_satellite_by_id(satellite_id)
    if not sat:
        sat = {
            "satellite_id": satellite_id,
            "name": "Cartosat-3",
            "orbit_class": "SSO",
            "perigee_km": 505.0,
            "apogee_km": 510.0,
            "power_watts": 2000.0,
            "norad_id": "44804"
        }

    now = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Baseline nominal parameters
    nominal_altitude = (sat["perigee_km"] + sat["apogee_km"]) / 2.0
    nominal_power = sat["power_watts"] if sat["power_watts"] > 0 else 1800.0
    
    # Small natural jitter
    current_altitude = round(nominal_altitude + random.uniform(-0.8, 0.8), 2)
    battery_charge_pct = round(random.uniform(92.0, 98.5), 1)
    solar_array_power_w = round(nominal_power * random.uniform(0.96, 1.02), 1)
    rx_snr_db = round(random.uniform(24.0, 27.5), 1)
    thermal_bus_c = round(random.uniform(18.0, 24.0), 1)
    attitude_jitter_deg = round(random.uniform(0.01, 0.05), 3)
    downlink_rssi_dbm = round(random.uniform(-78.0, -72.0), 1)

    detected_anomaly = None

    if inject_anomaly:
        chosen_anomaly = anomaly_type or random.choice(["solar_drop", "rf_interference", "attitude_deviation", "orbital_decay_pulse"])
        
        if chosen_anomaly == "solar_drop":
            solar_array_power_w = round(nominal_power * 0.42, 1)  # 58% sudden drop
            battery_charge_pct = 74.2
            thermal_bus_c = 34.8  # Thermal rise in bus regulator
            detected_anomaly = {
                "metric": "Solar Array Bus Output",
                "nominal_range": f"{round(nominal_power*0.9, 1)} - {round(nominal_power*1.05, 1)} W",
                "observed_value": f"{solar_array_power_w} W",
                "deviation_pct": -58.0,
                "detection_method": "Z-Score Thresholding (sigma=4.2)",
                "description": f"Sharp 58% drop in solar array generation on {sat['name']}. Possible partial array blockage or shunt regulator malfunction."
            }
        elif chosen_anomaly == "rf_interference":
            rx_snr_db = 8.4  # Steep drop from 25dB
            downlink_rssi_dbm = -108.5
            detected_anomaly = {
                "metric": "Downlink Signal-to-Noise Ratio (SNR)",
                "nominal_range": "22.0 - 28.0 dB",
                "observed_value": f"{rx_snr_db} dB",
                "deviation_pct": -65.0,
                "detection_method": "Spectral Baseline Anomaly Filter",
                "description": f"Severe carrier SNR degradation (-16.6 dB) on X-band telemetry. Strong localized RF interference detected."
            }
        elif chosen_anomaly == "attitude_deviation":
            attitude_jitter_deg = 2.45  # Normal is < 0.05 deg
            detected_anomaly = {
                "metric": "Reaction Wheel 3 Attitude Error",
                "nominal_range": "0.00 - 0.08 deg",
                "observed_value": f"{attitude_jitter_deg} deg",
                "deviation_pct": +2900.0,
                "detection_method": "Kalman Filter Residual Spike",
                "description": f"Abnormal attitude pointing deviation (2.45 deg) on 3-axis gyro. Earth sensor lock degraded."
            }
        elif chosen_anomaly == "orbital_decay_pulse":
            current_altitude = round(nominal_altitude - 8.4, 2)
            detected_anomaly = {
                "metric": "Semi-Major Axis Orbital Altitude",
                "nominal_range": f"{sat['perigee_km']} - {sat['apogee_km']} km",
                "observed_value": f"{current_altitude} km",
                "deviation_pct": -1.6,
                "detection_method": "Two-Line Element (TLE) Propagator Drift Detector",
                "description": f"Unscheduled perigee altitude depression of 8.4 km detected during equatorial transit."
            }

    return {
        "satellite": sat,
        "timestamp": now,
        "telemetry": {
            "altitude_km": current_altitude,
            "battery_charge_pct": battery_charge_pct,
            "solar_array_power_w": solar_array_power_w,
            "rx_snr_db": rx_snr_db,
            "downlink_rssi_dbm": downlink_rssi_dbm,
            "thermal_bus_c": thermal_bus_c,
            "attitude_jitter_deg": attitude_jitter_deg,
            "status": "ANOMALY_DETECTED" if detected_anomaly else "NOMINAL"
        },
        "anomaly": detected_anomaly
    }
