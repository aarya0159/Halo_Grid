import React, { useState } from 'react';
import { 
  ShieldAlert, Clock, CheckCircle, MapPin, Calendar, 
  Trash2, Send, AlertTriangle, UserCheck, Car, Eye, X, MessageSquare, AlertCircle
} from 'lucide-react';
import { AlertRecord, FaceWatchlistRecord, VehicleWatchlistRecord, AlertStatus } from '../types';
import InteractiveGridMap from './InteractiveGridMap';

interface PoliceReviewTabProps {
  alerts: AlertRecord[];
  faceWatchlist: FaceWatchlistRecord[];
  vehicleWatchlist: VehicleWatchlistRecord[];
  selectedAlertId: string | null;
  onSelectAlert: (id: string | null) => void;
  onUpdateAlertStatus: (id: string, status: AlertStatus, reviewerNotes?: string) => void;
}

export default function PoliceReviewTab({
  alerts,
  faceWatchlist,
  vehicleWatchlist,
  selectedAlertId,
  onSelectAlert,
  onUpdateAlertStatus
}: PoliceReviewTabProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('Pending Review');
  const [noteInput, setNoteInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'dossier' | 'map'>('dossier');

  // Filtering list for left panel
  const activeReviewQueue = alerts.filter(alert => {
    const matchesType = filterType === 'All' || alert.alert_type === filterType;
    const matchesStatus = filterStatus === 'All' || alert.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Automatically select the first alert if none is selected or if the current one isn't in the filtered list
  const activeSelectedId = selectedAlertId || (activeReviewQueue.length > 0 ? activeReviewQueue[0].alert_id : null);
  const currentAlert = alerts.find(a => a.alert_id === activeSelectedId);

  // Look up matching watchlist profile
  let matchingFaceProfile: FaceWatchlistRecord | undefined = undefined;
  let matchingVehicleProfile: VehicleWatchlistRecord | undefined = undefined;

  if (currentAlert) {
    if (currentAlert.alert_type === 'Face Alert') {
      matchingFaceProfile = faceWatchlist.find(f => f.watchlist_id === currentAlert.watchlist_id);
    } else {
      matchingVehicleProfile = vehicleWatchlist.find(v => v.vehicle_watchlist_id === currentAlert.watchlist_id || v.plate_number === currentAlert.matched_entity_name);
    }
  }

  const handleAction = (status: AlertStatus) => {
    if (!currentAlert) return;
    onUpdateAlertStatus(currentAlert.alert_id, status, noteInput);
    setNoteInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)] min-h-[500px]" id="police-review-container">
      
      {/* LEFT PANEL: Queue List - 4 Cols */}
      <div className="lg:col-span-4 bg-brand-card border border-slate-800 rounded flex flex-col overflow-hidden" id="review-left-panel">
        
        {/* Filters bar */}
        <div className="p-3 border-b border-slate-850 bg-brand-bg/40 space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Live Dispatch Queue
            </h3>
            <span className="text-[9px] font-mono bg-red-950/60 border border-red-900/30 text-rose-400 px-1.5 py-0.5 rounded">
              {alerts.filter(a => a.status === 'Pending Review').length} PENDING
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2 py-1 bg-brand-bg border border-slate-800 rounded text-[10px] text-slate-300 font-mono"
            >
              <option value="All">All Types</option>
              <option value="Face Alert">Facial Matches</option>
              <option value="Vehicle Alert">Plate ANPR</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-brand-bg border border-slate-800 rounded text-[10px] text-slate-300 font-mono"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Investigation">Investigating</option>
              <option value="Escalated">Escalated</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Scrollable list of alerts */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 space-y-1.5" id="review-queue-list">
          {activeReviewQueue.map(alert => {
            const isSelected = alert.alert_id === activeSelectedId;
            const isFace = alert.alert_type === 'Face Alert';
            
            return (
              <div
                key={alert.alert_id}
                id={`review-item-${alert.alert_id}`}
                onClick={() => {
                  onSelectAlert(alert.alert_id);
                  setNoteInput('');
                }}
                className={`p-2 rounded border text-left cursor-pointer transition ${
                  isSelected 
                    ? 'bg-brand-bg border-cyan-500/50 shadow-md shadow-cyan-950/10' 
                    : 'bg-brand-bg/20 border-slate-850 hover:bg-brand-bg/30'
                }`}
              >
                <div className="flex gap-2">
                  <img
                    src={alert.thumbnail_image}
                    alt={alert.matched_entity_name}
                    className={`w-9 h-9 rounded-sm object-cover border ${isFace ? 'border-blue-500/30' : 'border-cyan-500/30'}`}
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-white truncate block">
                        {alert.matched_entity_name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      {alert.spotted_location.split(' ')[0]}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[8px] font-mono uppercase px-1 rounded-sm font-black text-white ${isFace ? 'bg-blue-600/80' : 'bg-cyan-600/80'}`}>
                        {isFace ? 'Facial' : 'ANPR'}
                      </span>
                      <span className={`text-[9px] font-mono ${
                        alert.status === 'Pending Review' ? 'text-rose-400' :
                        alert.status === 'Under Investigation' ? 'text-amber-400' :
                        alert.status === 'Escalated' ? 'text-pink-400' :
                        'text-slate-400'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeReviewQueue.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-xs font-medium">
              No alert files match selected dispatch filters.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Evidence Review Dashboard - 8 Cols */}
      <div className="lg:col-span-8 bg-brand-card border border-slate-800 rounded overflow-y-auto p-4 space-y-4 flex flex-col justify-between" id="review-right-panel">
        {currentAlert ? (
          <div className="space-y-4" id="review-right-content">
            
            {/* Header Alert summary banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold text-white uppercase font-mono tracking-wide ${
                    currentAlert.alert_type === 'Face Alert' ? 'bg-blue-600' : 'bg-cyan-600'
                  }`}>
                    {currentAlert.alert_type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Alert Ref: {currentAlert.alert_id}</span>
                </div>
                <h2 className="text-sm font-sans font-black uppercase text-white mt-1 flex items-center gap-1.5">
                  Matched Subject: 
                  {currentAlert.alert_type === 'Face Alert' ? (
                    <span className="text-cyan-300 font-black">{currentAlert.matched_entity_name}</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black text-xs rounded border border-slate-950 tracking-wider">
                      {currentAlert.matched_entity_name}
                    </span>
                  )}
                </h2>
              </div>

              {/* Status Badge */}
              <div className="p-1.5 bg-brand-bg border border-slate-800 rounded flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold uppercase ${
                  currentAlert.status === 'Pending Review' ? 'text-rose-400 animate-pulse' :
                  currentAlert.status === 'Under Investigation' ? 'text-amber-400' :
                  currentAlert.status === 'Escalated' ? 'text-pink-400' :
                  'text-slate-400'
                }`}>
                  {currentAlert.status}
                </span>
              </div>
            </div>

            {/* SUB-TAB TOGGLE: EVIDENCE vs GEOLOCATION MAP */}
            <div className="flex border-b border-slate-800/80 mb-2">
              <button
                onClick={() => setActiveSubTab('dossier')}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition ${
                  activeSubTab === 'dossier'
                    ? 'border-cyan-400 text-cyan-400 bg-brand-card/40'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                📁 Evidence Dossier
              </button>
              <button
                onClick={() => setActiveSubTab('map')}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition ${
                  activeSubTab === 'map'
                    ? 'border-cyan-400 text-cyan-400 bg-brand-card/40'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                🗺️ Geolocation Tactical Grid
              </button>
            </div>

            {activeSubTab === 'map' ? (
              <div className="rounded border border-slate-800 overflow-hidden flex-1 min-h-[360px]" id="review-map-wrapper">
                <InteractiveGridMap
                  alerts={alerts}
                  selectedAlertId={currentAlert.alert_id}
                  onSelectAlert={onSelectAlert}
                />
              </div>
            ) : (
              <>
                {/* PIPELINE EVIDENCE PHOTO SPLIT CARD */}
                <div className="bg-brand-bg/40 border border-slate-850 rounded p-3.5 space-y-2.5">
                  <h4 className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">
                    Sensor Evidence Match Assessment
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Captured crop frame */}
                    <div className="space-y-1 text-center">
                      <div className="aspect-square bg-brand-bg rounded overflow-hidden border-2 border-dashed border-red-500/40 relative flex items-center justify-center">
                        <img 
                          src={currentAlert.thumbnail_image} 
                          alt="Captured evidence crop" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Retro UI Overlay */}
                        <div className="absolute inset-0 bg-red-500/5 pointer-events-none border border-red-500/20"></div>
                        <div className="absolute top-1.5 left-1.5 text-[8px] font-mono text-red-400 bg-brand-bg/90 px-1 py-0.5 rounded-sm border border-red-500/20 uppercase tracking-wider font-bold">
                          LIVE RADAR FRAME
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Spotted Crop Asset</span>
                    </div>

                    {/* Watchlist reference template */}
                    <div className="space-y-1 text-center">
                      <div className="aspect-square bg-brand-bg rounded overflow-hidden border border-slate-800 relative flex items-center justify-center">
                        {matchingFaceProfile ? (
                          <img 
                            src={matchingFaceProfile.reference_face_image} 
                            alt="Watchlist reference template" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : matchingVehicleProfile ? (
                          <img 
                            src={matchingVehicleProfile.reference_vehicle_image} 
                            alt="Watchlist reference template" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 font-mono p-4">Reference image unavailable</div>
                        )}
                        <div className="absolute top-1.5 left-1.5 text-[8px] font-mono text-cyan-400 bg-brand-bg/90 px-1 py-0.5 rounded-sm border border-cyan-500/20 uppercase tracking-wider font-bold">
                          DOSSIER TEMPLATE
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Watchlist Dossier Template</span>
                    </div>

                  </div>

                  {/* Side-by-side similarity readout */}
                  <div className="p-2.5 bg-brand-bg/80 border border-slate-850 rounded text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-mono text-[10px] uppercase text-slate-500">Match Confidence Index:</span>
                      <span className="font-mono text-cyan-300 font-black text-xs">
                        {currentAlert.similarity_score_or_plate_confidence}%
                      </span>
                    </div>
                    {/* Score Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          currentAlert.similarity_score_or_plate_confidence >= currentAlert.threshold ? 'bg-cyan-400' : 'bg-slate-500'
                        }`}
                        style={{ width: `${currentAlert.similarity_score_or_plate_confidence}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Below Limit Threshold</span>
                      <span>Configured Match Trigger: {currentAlert.threshold}%</span>
                    </div>
                  </div>
                </div>

                {/* METADATA SUMMARY & DOSSIER EXTRACTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  
                  {/* Left Column: Logged capture parameters */}
                  <div className="p-3 bg-brand-bg/20 border border-slate-850 rounded space-y-2">
                    <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">
                      Radar Capture Telemetry
                    </h4>

                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span className="text-slate-500">Captured camera:</span>
                        <span className="font-mono font-semibold text-white">{currentAlert.source_camera}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span className="text-slate-500">Spotted timestamp:</span>
                        <span className="font-mono text-white">{new Date(currentAlert.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span className="text-slate-500">Traffic location:</span>
                        <span className="font-bold text-slate-200 font-sans">{currentAlert.spotted_location}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900/60 pb-1">
                        <span className="text-slate-500">Optical quality:</span>
                        <span className="font-mono text-emerald-400 font-bold">{currentAlert.quality_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Turbulence index:</span>
                        <span className="font-mono text-indigo-400">{currentAlert.blur_score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Database Profile parameters */}
                  <div className="p-3 bg-brand-bg/20 border border-slate-850 rounded space-y-2">
                    <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">
                      Watchlist Dossier Records
                    </h4>

                    {matchingFaceProfile ? (
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Warrant subject:</span>
                          <span className="font-bold text-white font-sans">{matchingFaceProfile.candidate_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Watchlist ref code:</span>
                          <span className="font-mono text-cyan-400">{matchingFaceProfile.watchlist_id}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Case file ID:</span>
                          <span className="font-mono text-white">{matchingFaceProfile.case_id}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Case status:</span>
                          <span className="text-red-400 font-semibold">{matchingFaceProfile.status_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Risk rating:</span>
                          <span className="font-bold text-rose-400">{matchingFaceProfile.risk_priority} Risk</span>
                        </div>
                      </div>
                    ) : matchingVehicleProfile ? (
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Wanted Plate:</span>
                          <span className="font-black font-mono text-yellow-400">{matchingVehicleProfile.plate_number}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Vehicle make/model:</span>
                          <span className="font-bold text-white font-sans">{matchingVehicleProfile.vehicle_make} {matchingVehicleProfile.vehicle_model}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Color / Year:</span>
                          <span className="text-white">{matchingVehicleProfile.vehicle_color} • {matchingVehicleProfile.vehicle_year}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span className="text-slate-500">Case Category:</span>
                          <span className="text-red-400 font-semibold">{matchingVehicleProfile.vehicle_status_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Risk rating:</span>
                          <span className="font-bold text-rose-400">{matchingVehicleProfile.risk_priority} Risk</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic py-6 text-center">
                        No active dossier profiles match this simulated detection event.
                      </div>
                    )}
                  </div>
                </div>

                {/* Dossier notes / notes field */}
                <div className="p-3 bg-brand-bg/20 border border-slate-850 rounded space-y-1 text-xs">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">Case incident brief / description</span>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {currentAlert.notes}
                  </p>
                </div>
              </>
            )}

            {/* If alert already reviewed, display notes */}
            {currentAlert.reviewer_notes && (
              <div className="p-3 bg-brand-bg/60 border border-slate-800 rounded space-y-1 text-xs">
                <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Reviewer decision notes log
                </span>
                <p className="text-slate-300 italic font-mono text-[11px]">
                  "{currentAlert.reviewer_notes}"
                </p>
              </div>
            )}

            {/* INTERACTIVE POLICE RESOLUTION ACTION PANEL */}
            <div className="p-3 bg-brand-bg border border-slate-850 rounded space-y-3">
              <div className="flex gap-2 items-center text-xs font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-black text-slate-500 uppercase tracking-wider font-mono">Resolution notes input</span>
              </div>

              <textarea
                rows={2}
                placeholder="Log operations dispatch parameters, police sectors dispatched, or details surrounding false match verification before dismissing..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                className="w-full bg-brand-card border border-slate-800 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
              />

              <div className="flex flex-wrap gap-2 justify-end">
                {/* Dismiss action */}
                <button
                  id="review-dismiss-btn"
                  onClick={() => handleAction('Dismissed')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase font-mono rounded text-[10px] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  Dismiss Warning
                </button>

                {/* Under Investigation action */}
                <button
                  id="review-investigate-btn"
                  onClick={() => handleAction('Under Investigation')}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold uppercase font-mono rounded text-[10px] transition flex items-center gap-1.5 shadow-lg shadow-amber-950/10 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-slate-100" />
                  Dispatch Officers
                </button>

                {/* Escalated action */}
                <button
                  id="review-escalate-btn"
                  onClick={() => handleAction('Escalated')}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase font-mono rounded text-[10px] transition flex items-center gap-1.5 shadow-lg shadow-red-950/10 cursor-pointer animate-pulse"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-100" />
                  Escalate (APPREHEND)
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-center p-8 text-slate-500" id="review-right-empty">
            <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
            <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-wider">No Warning Selected</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-1 max-w-sm">
              Please choose an active alert file from the left-hand live dispatch queue to run matching analysis and biometric checks.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
