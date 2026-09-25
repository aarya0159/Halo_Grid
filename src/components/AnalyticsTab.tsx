import React from 'react';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Shield, BarChart2, CheckCircle, AlertTriangle, 
  Eye, TrendingUp, Compass, Award, Activity 
} from 'lucide-react';
import { AlertRecord, FaceWatchlistRecord, VehicleWatchlistRecord } from '../types';

interface AnalyticsTabProps {
  alerts: AlertRecord[];
  faceWatchlist: FaceWatchlistRecord[];
  vehicleWatchlist: VehicleWatchlistRecord[];
  totalScans: number;
  acceptedScans: number;
  rejectedScans: number;
}

export default function AnalyticsTab({
  alerts,
  faceWatchlist,
  vehicleWatchlist,
  totalScans,
  acceptedScans,
  rejectedScans
}: AnalyticsTabProps) {

  // Derivations
  const faceAlerts = alerts.filter(a => a.alert_type === 'Face Alert');
  const vehicleAlerts = alerts.filter(a => a.alert_type === 'Vehicle Alert');

  const pending = alerts.filter(a => a.status === 'Pending Review').length;
  const investigating = alerts.filter(a => a.status === 'Under Investigation').length;
  const escalated = alerts.filter(a => a.status === 'Escalated').length;
  const dismissed = alerts.filter(a => a.status === 'Dismissed').length;

  // Pie chart resolution distribution
  const resolutionData = [
    { name: 'Pending Review', value: pending, color: '#ef4444' }, // Red
    { name: 'Investigating', value: investigating, color: '#f59e0b' }, // Amber
    { name: 'Escalated', value: escalated, color: '#ec4899' }, // Pink
    { name: 'Dismissed', value: dismissed, color: '#6b7280' } // Gray
  ].filter(item => item.value > 0);

  // Bar chart scan accepted/rejected ratio
  // Since we have client-wide tracking, let's create a representative sample:
  const scansRatioData = [
    { 
      name: 'Facial recognition scans', 
      Accepted: Math.max(1, Math.round(acceptedScans * 0.55)), 
      Rejected: Math.max(1, Math.round(rejectedScans * 0.6)) 
    },
    { 
      name: 'Vehicle plate scans', 
      Accepted: Math.max(1, Math.round(acceptedScans * 0.45)), 
      Rejected: Math.max(1, Math.round(rejectedScans * 0.4)) 
    }
  ];

  // Curve line hourly volume (representing peak surveillance hours)
  const hourlyVolumeData = [
    { hour: '00:00', Face: 2, Vehicle: 1 },
    { hour: '04:00', Face: 1, Vehicle: 3 },
    { hour: '08:00', Face: 12, Vehicle: 22 }, // morning peak
    { hour: '12:00', Face: 18, Vehicle: 14 },
    { hour: '16:00', Face: 24, Vehicle: 19 },
    { hour: '20:00', Face: 15, Vehicle: 25 }, // evening peak
  ];

  // Top hits simulated lookup
  // We can count which candidate_name is hit most in our alert database
  const watchlistHits: { [key: string]: { name: string; count: number; risk: string; type: string } } = {};
  alerts.forEach(a => {
    watchlistHits[a.matched_entity_name] = {
      name: a.matched_entity_name,
      count: (watchlistHits[a.matched_entity_name]?.count || 0) + 1,
      risk: a.risk_priority,
      type: a.alert_type === 'Face Alert' ? 'Face' : 'Plate'
    };
  });
  const topHitsLeaderboard = Object.values(watchlistHits)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6" id="analytics-tab-container">
      {/* Analytics Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          Intelligence Analytics & Radar Audit
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical warning distributions, scan acceptance quotients, and operational resolution diagnostics.
        </p>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Chart 1: Resolution Pie chart */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-2">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
            Dispatched Alert Resolution Ratio
          </h3>
          <div className="h-56 flex items-center justify-center">
            {resolutionData.length > 0 ? (
              <div className="w-full h-full flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {resolutionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ fontSize: 11, color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legends list */}
                <div className="space-y-2 text-xs w-full md:w-36">
                  {resolutionData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span>{entry.name}:</span>
                      </div>
                      <span className="font-mono text-white font-bold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium italic">
                No active resolution metrics registered.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Scanning Pipeline Efficiency (Accepted vs Rejected) */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-2">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
            Sensor Scan Acceptance quotient
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={scansRatioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Curve hourly volume */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-2 md:col-span-2">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
            Roadside Match warnings Daily Peaks
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVehicle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Face" name="Face Matches" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFace)" />
                <Area type="monotone" dataKey="Vehicle" name="Plate Matches" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVehicle)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Leaderboard Table block */}
      <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-2" id="leaderboard-hits">
        <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          Highest Frequency Watchlist Hits (Simulated Run)
        </h3>
        
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono tracking-wider text-[9px]">
                <th className="py-2 px-3">Suspect Entity / Plate</th>
                <th className="py-2 px-3">Watchlist Registry Type</th>
                <th className="py-2 px-3">Associated Severity</th>
                <th className="py-2 px-3 text-center">Simulated Hit Counts</th>
                <th className="py-2 px-3 text-right">Operational Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {topHitsLeaderboard.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-950/20 font-medium">
                  <td className="py-2 px-3 font-bold text-slate-200">
                    {item.type === 'Face' ? (
                      item.name
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black rounded border border-slate-900 uppercase">
                        {item.name}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                    {item.type === 'Face' ? 'FACIAL_RECOGNITION' : 'ANPR_PLATE_READER'}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      item.risk === 'High' ? 'text-rose-400 bg-rose-500/10' :
                      item.risk === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {item.risk} Risk
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-cyan-400 font-bold">
                    {item.count}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-400">
                    {item.risk === 'High' ? '🔴 IMMEDIATE DISPATCH' : '⚪ SECTOR SURVEILLANCE'}
                  </td>
                </tr>
              ))}
              {topHitsLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-600 font-medium italic">
                    No matching alert captures processed yet. Start scanning to generate hit analytics.
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
