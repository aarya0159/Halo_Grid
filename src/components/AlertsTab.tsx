import React, { useState } from 'react';
import { 
  Search, Shield, AlertTriangle, MapPin, Calendar, Clock, 
  ChevronRight, Filter, RefreshCw, Eye, ArrowUpDown, FileText
} from 'lucide-react';
import { AlertRecord, AlertStatus, AlertType } from '../types';
import InteractiveGridMap from './InteractiveGridMap';

interface AlertsTabProps {
  alerts: AlertRecord[];
  onNavigate: (tab: string, arg?: any) => void;
  onClearAllAlerts?: () => void;
}

export default function AlertsTab({
  alerts,
  onNavigate,
  onClearAllAlerts
}: AlertsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'timestamp' | 'confidence'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtering logic
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.alert_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.matched_entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.spotted_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.case_id && alert.case_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'All' || alert.alert_type === selectedType;
    const matchesStatus = selectedStatus === 'All' || alert.status === selectedStatus;
    const matchesRisk = selectedRisk === 'All' || alert.risk_priority === selectedRisk;

    return matchesSearch && matchesType && matchesStatus && matchesRisk;
  });

  // Sorting
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    let valueA: any = a[sortBy];
    let valueB: any = b[sortBy];

    if (sortBy === 'timestamp') {
      valueA = new Date(a.timestamp).getTime();
      valueB = new Date(b.timestamp).getTime();
    } else if (sortBy === 'confidence') {
      valueA = a.similarity_score_or_plate_confidence;
      valueB = b.similarity_score_or_plate_confidence;
    }

    if (sortOrder === 'desc') {
      return valueB - valueA;
    } else {
      return valueA - valueB;
    }
  });

  const toggleSort = (field: 'timestamp' | 'confidence') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4" id="alerts-tab-container">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            Operations Warning Alerts Log
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            Historical ledger of all automated pipeline match events triggered above the threshold.
          </p>
        </div>
        {onClearAllAlerts && (
          <button 
            onClick={() => {
              if (confirm("Reset simulator alert logs to default pre-seeded logs?")) {
                onClearAllAlerts();
              }
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono uppercase tracking-wider rounded transition"
          >
            Reset Simulator Alerts
          </button>
        )}
      </div>

      {/* Filter Options Widget */}
      <div className="p-3 bg-brand-card border border-slate-800 rounded space-y-3" id="alerts-filters-box">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, plate, name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-brand-bg border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>

          {/* Type filter */}
          <div className="space-y-1">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-2 py-1 bg-brand-bg border border-slate-800 rounded text-xs text-slate-300 font-mono"
            >
              <option value="All">All Intelligence Types</option>
              <option value="Face Alert">Face Recognition Only</option>
              <option value="Vehicle Alert">Vehicle License Only</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1 bg-brand-bg border border-slate-800 rounded text-xs text-slate-300 font-mono"
            >
              <option value="All">All Resolution Statuses</option>
              <option value="Pending Review">🔴 Pending Review</option>
              <option value="Under Investigation">🟡 Under Investigation</option>
              <option value="Escalated">💗 Escalated Alert</option>
              <option value="Dismissed">⚪ Dismissed / False Alarm</option>
            </select>
          </div>

          {/* Risk Priority filter */}
          <div className="space-y-1">
            <select
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="w-full px-2 py-1 bg-brand-bg border border-slate-800 rounded text-xs text-slate-300 font-mono"
            >
              <option value="All">All Risk Priorities</option>
              <option value="High">🔴 High Priority Case</option>
              <option value="Medium">🟡 Medium Priority Case</option>
              <option value="Low">⚪ Low Priority Case</option>
            </select>
          </div>
        </div>

        {/* Sort and summary row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2.5 border-t border-slate-800/60 gap-2 text-[10px] font-mono">
          <div className="text-slate-500">
            Showing <span className="text-cyan-400 font-bold">{sortedAlerts.length}</span> warning alerts of {alerts.length} logged records
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-slate-500">Sort by:</span>
            <button 
              onClick={() => toggleSort('timestamp')}
              className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide ${sortBy === 'timestamp' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              Timestamp
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button 
              onClick={() => toggleSort('confidence')}
              className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide ${sortBy === 'confidence' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
            >
              Confidence
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Map Dashboard */}
      <InteractiveGridMap 
        alerts={filteredAlerts} 
        onNavigate={onNavigate} 
      />

      {/* Grid of warning alerts list - Table/List View */}
      <div className="bg-brand-card border border-slate-800 rounded overflow-hidden shadow-xl" id="alerts-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-bg border-b border-slate-800 text-slate-500 font-mono font-bold uppercase tracking-wider text-[9px]">
                <th className="p-2.5 pl-3">Image</th>
                <th className="p-2.5">Alert ID</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">Identity / Plate</th>
                <th className="p-2.5 text-center">Score</th>
                <th className="p-2.5 text-center">Quality</th>
                <th className="p-2.5 text-center">Risk</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-medium">
              {sortedAlerts.map((alert) => {
                const isFace = alert.alert_type === 'Face Alert';
                return (
                  <tr 
                    key={alert.alert_id} 
                    id={`alert-row-${alert.alert_id}`}
                    className="hover:bg-brand-bg/40 transition group duration-150"
                  >
                    {/* Thumbnail */}
                    <td className="p-2.5 pl-3">
                      <div className="relative w-9 h-9 bg-brand-bg rounded-sm overflow-hidden border border-slate-800">
                        <img 
                          src={alert.thumbnail_image} 
                          alt={alert.matched_entity_name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </td>

                    {/* Alert ID */}
                    <td className="p-2.5">
                      <div>
                        <span className="font-mono text-cyan-400 font-bold">{alert.alert_id}</span>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{alert.case_id}</div>
                      </div>
                    </td>

                    {/* Alert Type badge */}
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold tracking-wide uppercase font-mono ${
                        isFace ? 'text-blue-400 bg-blue-500/10' : 'text-cyan-400 bg-cyan-500/10'
                      }`}>
                        {isFace ? 'FACIAL' : 'PLATE'}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="p-2.5 font-mono text-[10px] text-slate-400">
                      <div>{new Date(alert.timestamp).toLocaleDateString()}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Spotted Location */}
                    <td className="p-2.5">
                      <div className="flex items-center gap-1 text-slate-300 font-mono text-[10px]">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{alert.spotted_location}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{alert.source_camera}</div>
                    </td>

                    {/* Matched entity */}
                    <td className="p-2.5">
                      {isFace ? (
                        <span className="font-sans text-white font-bold block text-[11px]">{alert.matched_entity_name}</span>
                      ) : (
                        <span className="inline-block px-1 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black text-[10px] rounded border border-slate-900 uppercase tracking-wide">
                          {alert.matched_entity_name}
                        </span>
                      )}
                    </td>

                    {/* Similarity score */}
                    <td className="p-2.5 text-center font-mono">
                      <div className="text-xs font-bold text-white">
                        {alert.similarity_score_or_plate_confidence}%
                      </div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Min: {alert.threshold}%</div>
                    </td>

                    {/* Quality / Blur indicators */}
                    <td className="p-2.5 text-center font-mono text-[9px]">
                      <div className="text-slate-400">Q: <span className="font-bold text-emerald-400">{alert.quality_score}%</span></div>
                      <div className="text-slate-500 mt-0.5">B: <span className="text-indigo-400">{alert.blur_score}%</span></div>
                    </td>

                    {/* Risk priority */}
                    <td className="p-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase font-mono ${
                        alert.risk_priority === 'High' ? 'text-red-400 bg-red-500/10' :
                        alert.risk_priority === 'Medium' ? 'text-amber-400 bg-amber-500/10' :
                        'text-slate-400 bg-slate-500/10'
                      }`}>
                        {alert.risk_priority}
                      </span>
                    </td>

                    {/* Resolution Status */}
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase font-mono ${
                        alert.status === 'Pending Review' ? 'text-rose-400 bg-rose-500/15 border border-rose-500/25 animate-pulse' :
                        alert.status === 'Under Investigation' ? 'text-amber-400 bg-amber-500/15 border border-amber-500/25' :
                        alert.status === 'Escalated' ? 'text-pink-400 bg-pink-500/15 border border-pink-500/25' :
                        'text-slate-400 bg-slate-500/10 border border-slate-700/20'
                      }`}>
                        {alert.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-2.5 pr-3 text-right">
                      <button
                        onClick={() => onNavigate('Police Review Panel', alert.alert_id)}
                        className="px-2 py-1 bg-slate-850 hover:bg-cyan-600 transition text-slate-300 hover:text-white rounded flex items-center gap-1 text-[10px] uppercase font-mono float-right border border-slate-800"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedAlerts.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-mono">
                    No simulated alerts matching your search criteria were found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
