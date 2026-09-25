import React, { useState } from 'react';
import { AlertRecord } from '../types';
import { MapPin, ShieldAlert, Navigation, Info, Eye, Layers } from 'lucide-react';

interface InteractiveGridMapProps {
  alerts: AlertRecord[];
  selectedAlertId?: string | null;
  onSelectAlert?: (id: string) => void;
  onNavigate?: (tab: string, alertId?: string) => void;
}

// Coordinate mapping for Singapore-based surveillance nodes
export const LOCATION_COORDINATES: Record<string, { x: number; y: number; label: string; sector: string }> = {
  "Orchard Road Crossing": { x: 42, y: 55, label: "ORCH-C01", sector: "Sector 02 - Central" },
  "Jurong East Bus Interchange": { x: 20, y: 50, label: "JUR-B04", sector: "Sector 03 - West" },
  "Tampines Junction": { x: 82, y: 45, label: "TAMP-J09", sector: "Sector 04 - East" },
  "City Hall Pedestrian Crossing": { x: 48, y: 58, label: "CH-P12", sector: "Sector 02 - Central" },
  "Serangoon Road Traffic Light": { x: 52, y: 42, label: "SER-T05", sector: "Sector 01 - North-East" },
  "Bugis Street Junction": { x: 55, y: 51, label: "BUG-J02", sector: "Sector 02 - Central" },
  "Yishun Avenue Bus Stop": { x: 48, y: 22, label: "YISH-B08", sector: "Sector 01 - North" },
  "Downtown Core Crossing": { x: 49, y: 68, label: "DT-C15", sector: "Sector 02 - Central" },
  "Changi Airport Terminal 1": { x: 90, y: 48, label: "AP-T01", sector: "Sector 04 - East" },
  "Woodlands Checkpoint": { x: 38, y: 12, label: "WDL-CP1", sector: "Sector 01 - North" },
  "Tuas Second Link": { x: 8, y: 62, label: "TUAS-L02", sector: "Sector 03 - West" },
  "Marina Bay Promenade": { x: 54, y: 66, label: "MBP-P03", sector: "Sector 02 - Central" },
  "Sentosa Boardwalk": { x: 40, y: 82, label: "SEN-B01", sector: "Sector 02 - Central" }
};

export default function InteractiveGridMap({
  alerts,
  selectedAlertId,
  onSelectAlert,
  onNavigate
}: InteractiveGridMapProps) {
  const [hoveredAlert, setHoveredAlert] = useState<AlertRecord | null>(null);
  const [clickedAlert, setClickedAlert] = useState<AlertRecord | null>(null);
  const [filterSector, setFilterSector] = useState<string>("All");

  // Get coordinates for an alert
  const getAlertCoords = (alert: AlertRecord) => {
    return LOCATION_COORDINATES[alert.spotted_location] || { x: 50, y: 50, label: "UNKNOWN", sector: "Sector Unknown" };
  };

  const activeAlert = alerts.find(a => a.alert_id === (selectedAlertId || clickedAlert?.alert_id));

  // Find nearby alerts in the same sector
  const getNearbyAlerts = (selectedAlert: AlertRecord) => {
    const currentLoc = getAlertCoords(selectedAlert);
    return alerts.filter(a => {
      if (a.alert_id === selectedAlert.alert_id) return false;
      const otherLoc = getAlertCoords(a);
      return otherLoc.sector === currentLoc.sector;
    }).slice(0, 3);
  };

  const sectorsList = ["All", "Sector 01 - North", "Sector 02 - Central", "Sector 03 - West", "Sector 04 - East"];

  return (
    <div className="flex flex-col h-full bg-brand-header border border-slate-800 rounded overflow-hidden" id="interactive-grid-map-panel">
      {/* Map Header */}
      <div className="p-3 bg-brand-card/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">TACTICAL OPERATIONS GRID (MAP)</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="text-[10px] font-mono bg-brand-bg border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 outline-none"
          >
            {sectorsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-[340px]">
        
        {/* The Graphic Map Area */}
        <div className="flex-1 bg-slate-950/80 relative overflow-hidden flex items-center justify-center min-h-[280px]">
          {/* Tactical Grid Overlay Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-45"></div>
          
          {/* Main Diagonal/Sector Guides */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4" />
            
            {/* Sector concentric sonar circles */}
            <circle cx="50%" cy="50%" r="20%" stroke="#1e293b" strokeWidth="0.5" fill="none" strokeDasharray="2" />
            <circle cx="50%" cy="50%" r="40%" stroke="#1e293b" strokeWidth="0.5" fill="none" strokeDasharray="2" />
            
            {/* Compass rose markings */}
            <text x="50%" y="20" fill="#475569" className="text-[9px] font-mono font-bold text-center" textAnchor="middle">NORTH SECTOR [01]</text>
            <text x="50%" y="96%" fill="#475569" className="text-[9px] font-mono font-bold text-center" textAnchor="middle">SOUTH PASSAGE [SENTOSA]</text>
            <text x="10" y="50%" fill="#475569" className="text-[9px] font-mono font-bold" dominantBaseline="middle">WEST SECTOR [03]</text>
            <text x="98%" y="50%" fill="#475569" className="text-[9px] font-mono font-bold" textAnchor="end" dominantBaseline="middle">EAST SECTOR [04]</text>
          </svg>

          {/* Active Surveillance Camera Markers (Ground Truth Nodes) */}
          {Object.entries(LOCATION_COORDINATES).map(([name, coords]) => {
            // Check if there is an alert at this location
            const alertsHere = alerts.filter(a => a.spotted_location === name);
            const hasPending = alertsHere.some(a => a.status === 'Pending Review');
            const hasAlert = alertsHere.length > 0;
            const isSelected = activeAlert && activeAlert.spotted_location === name;

            // Apply filters
            if (filterSector !== "All" && coords.sector !== filterSector) {
              return null;
            }

            return (
              <div
                key={name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all duration-200"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                onClick={() => {
                  if (alertsHere.length > 0) {
                    setClickedAlert(alertsHere[0]);
                    if (onSelectAlert) onSelectAlert(alertsHere[0].alert_id);
                  }
                }}
                onMouseEnter={() => alertsHere.length > 0 && setHoveredAlert(alertsHere[0])}
                onMouseLeave={() => setHoveredAlert(null)}
              >
                {/* Visual pulse for pending danger */}
                {hasPending && (
                  <span className="absolute inline-flex h-6 w-6 rounded-full bg-red-500/30 animate-ping -left-1.5 -top-1.5"></span>
                )}

                {/* Node Dot */}
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected 
                    ? 'bg-cyan-400 border-white scale-125 shadow-lg shadow-cyan-500/50'
                    : hasPending 
                    ? 'bg-red-500 border-red-300 scale-110 shadow-lg shadow-red-600/40' 
                    : hasAlert 
                    ? 'bg-amber-500 border-amber-300' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}>
                  <span className="w-1 h-1 rounded-full bg-white"></span>
                </div>

                {/* Micro Node Label */}
                <span className={`absolute top-4 left-1/2 transform -translate-x-1/2 font-mono text-[7px] px-1 py-0.2 rounded tracking-tight text-center leading-none ${
                  isSelected 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'bg-slate-900/80 text-slate-400'
                }`}>
                  {coords.label}
                </span>
              </div>
            );
          })}

          {/* Quick HUD Overlay */}
          <div className="absolute top-2 left-2 p-2 bg-slate-900/90 border border-slate-800 rounded font-mono text-[8px] space-y-1 text-slate-400 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>PENDING REVIEW: {alerts.filter(a => a.status === 'Pending Review').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>INVESTIGATING: {alerts.filter(a => a.status === 'Under Investigation').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700"></span>
              <span>OFFLINE CAMERAS: 0</span>
            </div>
          </div>
        </div>

        {/* Selected Alert Sidebar/Overlay Details */}
        <div className="w-full lg:w-72 bg-brand-bg border-t lg:border-t-0 lg:border-l border-slate-800 p-3 flex flex-col justify-between shrink-0" id="map-hud-sidebar">
          {activeAlert ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                {/* Active Selection Block */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-900/40 inline-block font-mono">
                      {activeAlert.alert_type}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">{activeAlert.matched_entity_name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block font-mono">NODE ID</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      {getAlertCoords(activeAlert).label}
                    </span>
                  </div>
                </div>

                {/* Camera metadata */}
                <div className="mt-3 p-2 bg-brand-card rounded border border-slate-800 space-y-1.5 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">FEED LOCATION:</span>
                    <span className="text-slate-200 font-bold">{activeAlert.spotted_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SECTOR ZONE:</span>
                    <span className="text-slate-300">{getAlertCoords(activeAlert).sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TIMESTAMP:</span>
                    <span className="text-slate-400">{new Date(activeAlert.timestamp).toLocaleTimeString()} UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MATCH INDEX:</span>
                    <span className="text-emerald-400 font-bold">{activeAlert.similarity_score_or_plate_confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">STATUS:</span>
                    <span className={`font-bold ${
                      activeAlert.status === 'Pending Review' ? 'text-red-400 animate-pulse' :
                      activeAlert.status === 'Dismissed' ? 'text-slate-400' :
                      activeAlert.status === 'Under Investigation' ? 'text-amber-400' : 'text-purple-400'
                    }`}>{activeAlert.status}</span>
                  </div>
                </div>

                {/* Review note summary if present */}
                {activeAlert.notes && (
                  <p className="text-[10px] text-slate-400 mt-2 bg-slate-900/40 p-2 rounded border border-slate-800 italic">
                    "{activeAlert.notes}"
                  </p>
                )}

                {/* NEARBY ALERTS IN SECTOR */}
                <div className="mt-3">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono mb-1">
                    NEARBY OPERATIONAL SECTOR ALERTS
                  </div>
                  <div className="space-y-1">
                    {getNearbyAlerts(activeAlert).length > 0 ? (
                      getNearbyAlerts(activeAlert).map(na => (
                        <button
                          key={na.alert_id}
                          onClick={() => {
                            setClickedAlert(na);
                            if (onSelectAlert) onSelectAlert(na.alert_id);
                          }}
                          className="w-full p-1.5 bg-brand-card/40 border border-slate-800/80 rounded flex items-center justify-between text-left hover:bg-brand-card text-[9px]"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-300 block truncate">{na.matched_entity_name}</span>
                            <span className="text-slate-500 text-[8px] font-mono">{na.spotted_location}</span>
                          </div>
                          <span className={`text-[8px] font-bold font-mono px-1 rounded ${
                            na.status === 'Pending Review' ? 'text-red-400 bg-red-950/20' : 'text-slate-400'
                          }`}>
                            {na.status === 'Pending Review' ? 'PENDING' : na.status}
                          </span>
                        </button>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-600 block italic py-1 font-mono">
                        No other alerts currently in this sector.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action routing button */}
              {onNavigate && (
                <button
                  onClick={() => onNavigate('Police Review Panel', activeAlert.alert_id)}
                  className="w-full mt-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center gap-1.5 shadow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Examine in Review Panel</span>
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                <Info className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-slate-300">No Alert Selected</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">
                Click on any pulsing alert node on the map to inspect real-time operational context.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
