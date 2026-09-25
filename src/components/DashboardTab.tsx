import React from 'react';
import { 
  Shield, Users, Car, AlertTriangle, Eye, Settings, 
  CheckCircle, XCircle, Clock, ArrowRight, ShieldAlert, Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { FaceWatchlistRecord, VehicleWatchlistRecord, AlertRecord } from '../types';

interface DashboardTabProps {
  faceWatchlist: FaceWatchlistRecord[];
  vehicleWatchlist: VehicleWatchlistRecord[];
  alerts: AlertRecord[];
  totalScans: number;
  acceptedScans: number;
  rejectedScans: number;
  onNavigate: (tab: string, arg?: any) => void;
}

export default function DashboardTab({
  faceWatchlist,
  vehicleWatchlist,
  alerts,
  totalScans,
  acceptedScans,
  rejectedScans,
  onNavigate
}: DashboardTabProps) {

  // Metrics derivation
  const pendingAlerts = alerts.filter(a => a.status === 'Pending Review');
  const activeInvestigations = alerts.filter(a => a.status === 'Under Investigation');
  const dismissedAlerts = alerts.filter(a => a.status === 'Dismissed');
  const escalatedAlerts = alerts.filter(a => a.status === 'Escalated');

  const faceAlertsCount = alerts.filter(a => a.alert_type === 'Face Alert').length;
  const vehicleAlertsCount = alerts.filter(a => a.alert_type === 'Vehicle Alert').length;

  // Simple Recharts Data
  const alertsByTypeData = [
    { name: 'Face Alerts', value: faceAlertsCount, color: '#3b82f6' }, // Blue
    { name: 'Vehicle Alerts', value: vehicleAlertsCount, color: '#06b6d4' } // Cyan
  ];

  const statusBreakdownData = [
    { name: 'Pending', count: pendingAlerts.length, color: '#ef4444' }, // Red
    { name: 'Investigating', count: activeInvestigations.length, color: '#f59e0b' }, // Amber
    { name: 'Escalated', count: escalatedAlerts.length, color: '#ec4899' }, // Pink
    { name: 'Dismissed', count: dismissedAlerts.length, color: '#6b7280' } // Gray
  ];

  // Map of location volumes
  const locationCounts: { [key: string]: number } = {};
  alerts.forEach(a => {
    locationCounts[a.spotted_location] = (locationCounts[a.spotted_location] || 0) + 1;
  });
  const locationData = Object.keys(locationCounts).map(loc => ({
    name: loc.replace(' Pedestrian Crossing', '').replace(' Bus Interchange', '').replace(' Junction', '').replace(' Traffic Light', ''),
    alerts: locationCounts[loc]
  })).slice(0, 5);

  const stats = [
    { 
      label: "Watchlist Targets", 
      value: faceWatchlist.length, 
      icon: Users, 
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20" 
    },
    { 
      label: "Watchlist Vehicles", 
      value: vehicleWatchlist.length, 
      icon: Car, 
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" 
    },
    { 
      label: "Total Scans Run", 
      value: totalScans, 
      icon: Activity, 
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" 
    },
    { 
      label: "Scan Acceptances", 
      value: `${acceptedScans} / ${totalScans}`, 
      icon: CheckCircle, 
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      label: "Total Alerts Triggered", 
      value: alerts.length, 
      icon: AlertTriangle, 
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20" 
    },
    { 
      label: "Pending Reviews", 
      value: pendingAlerts.length, 
      icon: Clock, 
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20" 
    },
    { 
      label: "Active Enquiries", 
      value: activeInvestigations.length, 
      icon: Shield, 
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      label: "Dismissed Scans", 
      value: dismissedAlerts.length, 
      icon: CheckCircle, 
      color: "text-gray-400 bg-gray-500/10 border-gray-500/20" 
    },
  ];

  return (
    <div className="space-y-4" id="dashboard-tab-container">
      {/* Top Welcome Banner */}
      <div className="p-4 bg-brand-card border border-slate-800 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shadow-black/20">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Ops Center Terminal Active
          </div>
          <h1 className="text-lg font-sans font-black text-white mt-0.5 tracking-tight uppercase">Halo Grid System Overview</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time public-safety AI intelligence hub. Synthesizing roadside multi-sensor inputs for watchlist matching and automated anomaly dispatch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="quick-scan-btn"
            onClick={() => onNavigate('Camera Scan')}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/20"
          >
            <Activity className="w-3.5 h-3.5" />
            Launch Scanner
          </button>
          <button 
            id="quick-review-btn"
            onClick={() => onNavigate('Police Review Panel')}
            className="px-3 py-1.5 bg-brand-bg hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs rounded transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Review Queue ({pendingAlerts.length})
          </button>
        </div>
      </div>

      {/* Grid of 8 Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" id="dashboard-metrics-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              id={`metric-card-${i}`}
              className={`p-3 rounded border bg-brand-card flex flex-col justify-between transition duration-200 ${stat.color} hover:border-slate-700`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</span>
                <Icon className="w-3.5 h-3.5 opacity-85" />
              </div>
              <div className="mt-1">
                <span className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="dashboard-visuals-grid">
        
        {/* Charts block - 2 columns on desktop */}
        <div className="lg:col-span-2 bg-brand-card border border-slate-800 rounded p-4 space-y-4" id="dashboard-charts-panel">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-sans font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Intelligence Distribution & Hotspots
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Live Sync: 1s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown Bar chart */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alert Status Resolution</span>
              <div className="h-44 bg-brand-bg/60 rounded p-2 border border-slate-800/60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBreakdownData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161B22', borderColor: '#1e293b', borderRadius: '4px' }}
                      labelStyle={{ color: '#f1f5f9', fontSize: 10, fontWeight: 'bold' }}
                      itemStyle={{ color: '#38bdf8', fontSize: 10 }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {statusBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Spotting Bar chart */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Alert Hotspots</span>
              <div className="h-44 bg-brand-bg/60 rounded p-2 border border-slate-800/60">
                {locationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} layout="vertical" margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={8} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={8} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161B22', borderColor: '#1e293b', borderRadius: '4px' }}
                        itemStyle={{ color: '#22d3ee', fontSize: 10 }}
                      />
                      <Bar dataKey="alerts" fill="#06b6d4" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-slate-500 font-mono">
                    No location alerts to chart
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Summary Row */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800 text-center">
            <div className="p-1.5 bg-brand-bg/40 rounded border border-slate-800/40">
              <span className="text-[9px] text-slate-500 uppercase block font-mono">Accuracy index</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">98.4%</span>
            </div>
            <div className="p-1.5 bg-brand-bg/40 rounded border border-slate-800/40">
              <span className="text-[9px] text-slate-500 uppercase block font-mono">ANPR Read Rate</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">92.1%</span>
            </div>
            <div className="p-1.5 bg-brand-bg/40 rounded border border-slate-800/40">
              <span className="text-[9px] text-slate-500 uppercase block font-mono">Mean Match Time</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">240 ms</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts Feed - 1 column on desktop */}
        <div className="bg-brand-card border border-slate-800 rounded p-4 flex flex-col justify-between" id="dashboard-recent-alerts-panel">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-sans font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Recent Warnings
              </h3>
              <button 
                onClick={() => onNavigate('Alerts Dashboard')}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition flex items-center gap-0.5"
                id="view-all-alerts-link"
              >
                All
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Alert List feed */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin" id="recent-alerts-feed-container">
              {alerts.slice(0, 4).map((alert) => {
                const isFace = alert.alert_type === 'Face Alert';
                return (
                  <div 
                    key={alert.alert_id} 
                    id={`recent-alert-item-${alert.alert_id}`}
                    className="p-2 bg-brand-bg/45 rounded border border-slate-800 hover:border-slate-700 transition flex gap-2.5 cursor-pointer"
                    onClick={() => onNavigate('Police Review Panel', alert.alert_id)}
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={alert.thumbnail_image} 
                        alt={alert.matched_entity_name} 
                        className={`w-10 h-10 object-cover rounded border ${isFace ? 'border-blue-500/50' : 'border-cyan-500/50'}`}
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded-[2px] text-[7px] font-bold text-white uppercase ${isFace ? 'bg-blue-600' : 'bg-cyan-600'}`}>
                        {isFace ? 'Face' : 'Plate'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate block">
                          {alert.matched_entity_name}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {alert.spotted_location}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-mono text-slate-400 bg-brand-bg border border-slate-850 px-1 py-0.5 rounded">
                          Conf: {alert.similarity_score_or_plate_confidence}%
                        </span>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                          alert.status === 'Pending Review' ? 'text-rose-400 bg-rose-500/10' :
                          alert.status === 'Under Investigation' ? 'text-amber-400 bg-amber-500/10' :
                          alert.status === 'Escalated' ? 'text-pink-400 bg-pink-500/10' :
                          'text-slate-400 bg-slate-500/10'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {alerts.length === 0 && (
                <div className="text-center py-6 text-[10px] text-slate-500 font-mono">
                  No alerts logged in workspace.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 mt-2">
            <div className="p-2 bg-red-950/20 border border-red-900/20 rounded text-[9px] text-slate-400 font-mono leading-relaxed">
              <span className="text-red-400 font-bold block mb-0.5">⚠️ SIMULATOR PROFILE MODE</span>
              Processes strictly synthetic demo profiles and plates. Representing safe, isolated prototype operations.
            </div>
          </div>
        </div>

      </div>

      {/* Grid of quick actions / resources */}
      <div className="bg-brand-card border border-slate-800 rounded p-4" id="dashboard-quick-actions-panel">
        <h3 className="text-xs font-sans font-black uppercase tracking-widest text-slate-200 border-b border-slate-800 pb-2 mb-3">
          Operative Guided Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 bg-brand-bg/50 border border-slate-800 hover:border-slate-700 rounded transition flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-white block">1. Face Matching Pipeline</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Upload portrait imagery. Pipeline calculates crop fidelity alignment, quality checks, and runs watchlist matches.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('Camera Scan')}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1 self-start"
            >
              Start Face Scan <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 bg-brand-bg/50 border border-slate-800 hover:border-slate-700 rounded transition flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-white block">2. Stolen Plate Tracker</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Parse dashcam or roadside streams. Simulates real-time ANPR OCR checks on synthetic wanted registries.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('Camera Scan')}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 self-start"
            >
              Scan Wanted Plate <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 bg-brand-bg/50 border border-slate-800 hover:border-slate-700 rounded transition flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-white block">3. Watchlist Registries</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Manage synthetic suspects, active warrant databases, and stolen vehicle indexes. View biometric matrices.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('Watchlist Database')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 self-start"
            >
              Inspect Database <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 bg-brand-bg/50 border border-slate-800 hover:border-slate-700 rounded transition flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-white block">4. Sensitivity Adjustments</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Calibrate alignment metrics, match thresholds, plate confidence, and response logs.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('System Settings')}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-300 uppercase tracking-wider flex items-center gap-1 self-start"
            >
              Configure Parameters <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
