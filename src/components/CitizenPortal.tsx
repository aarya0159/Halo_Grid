import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Car, AlertTriangle, Eye, CheckCircle2, ArrowRight, Star, 
  Award, Trophy, Clock, Search, Send, Plus, Trash2, Edit2, Check, User, Upload, RefreshCw,
  Mic, Volume2, Pause, Play, XCircle
} from 'lucide-react';
import { VehicleWatchlistRecord, AlertRecord, SystemSettings } from '../types';
import CameraScanTab from './CameraScanTab';

interface CitizenPortalProps {
  vehicleWatchlist: VehicleWatchlistRecord[];
  alerts: AlertRecord[];
  onAddAlert: (alert: AlertRecord) => void;
  onNavigate: (tab: string, arg?: any) => void;
  settings: SystemSettings;
}

export interface CitizenScan {
  id: string;
  timestamp: string;
  image: string;
  scanMode: 'Face' | 'Vehicle';
  plateNumber?: string;
  vehicleMake?: string;
  vehicleColor?: string;
  faceName?: string;
  matchFound: boolean;
  matchedEntityName?: string;
  status: 'Sent to Police' | 'Dismissed' | 'Draft';
  notes?: string;
  hasVoiceNote?: boolean;
  voiceNoteDuration?: number;
  pointsAwarded: number;
  qualityScore?: number;
  blurScore?: number;
  policeAlertId?: string;
}

// Preset Plate Scenarios for Citizens to use easily
const CITIZEN_PRESETS = [
  {
    label: "Suspicious Porsche in Alleyway",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
    desc: "A sleek black Porsche spotted in a rear lane. Scan to parse license plates.",
    plateText: "SLS1234A",
    ocrConf: 95,
    quality: 90,
    blur: 10,
    forcedMatchId: "WV-2026-001" // Will match the Stolen Porsche Carrera
  },
  {
    label: "Abandoned Camaro near Park",
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    desc: "A yellow muscle car parked near the local playground for 3 days.",
    plateText: "SGB8899K",
    ocrConf: 98,
    quality: 94,
    blur: 8,
    forcedMatchId: "WV-2026-002" // Will match Wanted Chevy Camaro
  },
  {
    label: "Unmarked Ford Sedan on Shoulder",
    img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop",
    desc: "Silver sedan resting on the highway hard shoulder with hazard lights off.",
    plateText: "SJR4050G",
    ocrConf: 94,
    quality: 86,
    blur: 15,
    forcedMatchId: "WV-2026-003" // Will match Missing Chloe's Ford
  },
  {
    label: "Ordinary Clean Civic",
    img: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?w=400&h=300&fit=crop",
    desc: "A grey Honda Civic parked in front of the local pharmacy.",
    plateText: "SGX7722P",
    ocrConf: 91,
    quality: 88,
    blur: 12,
    forcedMatchId: "NONE" // Safe citizen car - no match
  }
];

export default function CitizenPortal({
  vehicleWatchlist,
  alerts,
  onAddAlert,
  onNavigate,
  settings
}: CitizenPortalProps) {
  // Navigation inside Citizen portal
  const [citizenTab, setCitizenTab] = useState<'dashboard' | 'scan' | 'history'>('dashboard');

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'warning';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Gamified States
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('halogrid_citizen_points');
    return saved ? Number(saved) : 350;
  });

  const [citizenHandle, setCitizenHandle] = useState<string>(() => {
    const saved = localStorage.getItem('halogrid_citizen_handle');
    return saved || "Citizen_Hero_77";
  });

  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [handleInput, setHandleInput] = useState(citizenHandle);

  // Simulated Leaderboard of other Citizens
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, handle: "PlatePatroller", points: 1450, level: "L4: Honorary Guardian", active: false },
    { rank: 2, handle: "VigilantNeighbor", points: 1120, level: "L4: Honorary Guardian", active: false },
    { rank: 3, handle: "CamWatcher_01", points: 820, level: "L3: Active Patrol", active: false },
    { rank: 4, handle: "Citizen_Hero_77", points: 350, level: "L3: Active Patrol", active: true }, // Placed dynamically
    { rank: 5, handle: "CivicShield", points: 310, level: "L3: Active Patrol", active: false },
    { rank: 6, handle: "SafeStreets", points: 180, level: "L2: Community Lookout", active: false },
    { rank: 7, handle: "BlockCaptain", points: 90, level: "L1: Vigilant Novice", active: false },
  ]);

  // Sync Points to Leaderboard
  useEffect(() => {
    localStorage.setItem('halogrid_citizen_points', points.toString());
    
    // Dynamically update user's position in leaderboard
    setLeaderboard(prev => {
      const updated = prev.map(u => u.active ? { ...u, handle: citizenHandle, points: points, level: getLevelBadge(points).title } : u);
      // Sort descending by points
      const sorted = [...updated].sort((a, b) => b.points - a.points);
      // Re-assign ranks
      return sorted.map((user, idx) => ({ ...user, rank: idx + 1 }));
    });
  }, [points, citizenHandle]);

  useEffect(() => {
    localStorage.setItem('halogrid_citizen_handle', citizenHandle);
  }, [citizenHandle]);

  // Citizen Persisted Scans History List
  const [citizenScans, setCitizenScans] = useState<CitizenScan[]>(() => {
    const saved = localStorage.getItem('halogrid_citizen_scans');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('halogrid_citizen_scans', JSON.stringify(citizenScans));
  }, [citizenScans]);

  // Confetti/Popup reward state
  const [rewardClaimed, setRewardClaimed] = useState<{
    show: boolean;
    pointsGained: number;
    isBonus: boolean;
    plate: string;
    policeAlertId?: string;
  } | null>(null);

  // Voice playback simulator for report history
  const [playingScanId, setPlayingScanId] = useState<string | null>(null);
  const [playingSeconds, setPlayingSeconds] = useState<number>(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlayScanVoice = (scanId: string, duration: number) => {
    if (playingScanId === scanId) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setPlayingScanId(null);
      setPlayingSeconds(0);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setPlayingScanId(scanId);
      setPlayingSeconds(0);
      playTimerRef.current = setInterval(() => {
        setPlayingSeconds((prev) => {
          if (prev >= duration) {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            setPlayingScanId(null);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  // Helper calculation for Level titles
  function getLevelBadge(pts: number) {
    if (pts < 100) return { title: "Vigilant Novice", color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20", min: 0, max: 100 };
    if (pts < 300) return { title: "Community Lookout", color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20", min: 100, max: 300 };
    if (pts < 700) return { title: "Active Patrol", color: "text-amber-400 border-amber-500/30 bg-amber-950/20", min: 300, max: 700 };
    if (pts < 1500) return { title: "Honorary Guardian", color: "text-purple-400 border-purple-500/30 bg-purple-950/20", min: 700, max: 1500 };
    return { title: "Elite Citizen Shield", color: "text-yellow-400 border-yellow-500/50 bg-yellow-950/30 animate-pulse font-black", min: 1500, max: 5000 };
  }

  const currentLevel = getLevelBadge(points);
  const progressPercent = Math.min(100, Math.max(0, ((points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100));

  // Find Citizen's Alerts inside the global Alerts array
  const citizenReportsList = alerts.filter(a => a.source_camera.includes(`CITIZEN-NODE`));

  return (
    <div className="space-y-6 relative" id="citizen-portal-container">
      
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 border border-indigo-500/40 rounded-lg p-3.5 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 duration-200">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toastMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            toastMessage.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
             toastMessage.type === 'warning' ? <XCircle className="w-4 h-4" /> :
             <Clock className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-white leading-tight">
              {toastMessage.type === 'success' ? 'SYSTEM CONFIRMATION' :
               toastMessage.type === 'warning' ? 'REPORT ARCHIVED' :
               'DRAFT REGISTERED'}
            </p>
            <p className="text-[10px] text-slate-450 font-mono mt-0.5 leading-snug">
              {toastMessage.text}
            </p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-white font-mono text-[11px] font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* HEADER BANNER WITH CARD GAMIFICATION PROFILE */}
      <div className="p-4 md:p-6 rounded-lg bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-indigo-900/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6" id="citizen-header-banner">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        
        {/* Left Col: Welcome Citizen profile */}
        <div className="z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest animate-pulse">
              Active Community Network Node
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-400/40 text-indigo-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingHandle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={handleInput}
                      onChange={e => setHandleInput(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs px-2 py-1 rounded text-white font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (handleInput.trim()) {
                          setCitizenHandle(handleInput.trim());
                        }
                        setIsEditingHandle(false);
                      }}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-sans font-black text-white uppercase tracking-tight">{citizenHandle}</h2>
                    <button 
                      onClick={() => {
                        setHandleInput(citizenHandle);
                        setIsEditingHandle(true);
                      }}
                      className="text-indigo-400 hover:text-white transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Your civic reports are directly reviewed by police dispatchers to maintain residential safety.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Gamified Civic Score Card */}
        <div className="z-10 w-full lg:w-80 bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3" id="gamified-citizen-badge">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Your Civic Score</span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {points} Points
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">Rank Level Class</span>
              <span className={`text-xs uppercase font-mono font-black ${currentLevel.color.split(' ')[0]}`}>{currentLevel.title}</span>
            </div>
          </div>

          {/* Progress bar to next level */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-slate-500">
              <span>{points} pts</span>
              <span>Next badge: {currentLevel.max} pts</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* PORTAL NAV TABS */}
      <div className="flex border-b border-slate-800/80 gap-2 mb-2" id="citizen-nav-tabs">
        <button
          onClick={() => { setCitizenTab('dashboard'); }}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            citizenTab === 'dashboard'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Dashboard & Leaderboard
        </button>
        <button
          onClick={() => { setCitizenTab('scan'); }}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            citizenTab === 'scan'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          📷 Scan Plate & Report
        </button>
        <button
          onClick={() => { setCitizenTab('history'); }}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
            citizenTab === 'history'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          📜 My Reports History ({citizenScans.length})
        </button>
      </div>

      {/* REWARD POPUP / MODAL AFTER CITIZEN SUBMITS REPORT */}
      {rewardClaimed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-lg p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full mx-auto flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/30">
              <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-sans font-black text-white uppercase tracking-tight">CIVIC REPORT FILED!</h3>
              <p className="text-xs text-slate-400 font-mono">
                Report logged for license plate <span className="text-yellow-400 font-bold">{rewardClaimed.plate}</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Rewards Claimed</div>
              <div className="text-lg font-mono font-black text-emerald-400">
                +{rewardClaimed.pointsGained} POINTS
              </div>
              {rewardClaimed.isBonus && (
                <div className="text-[9px] font-mono text-amber-400 font-bold uppercase">
                  🏆 Watchlist Target Match Bonus included!
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
              Dispatch Operators have added this image file to their live reviewing tables. Your community contribution is invaluable.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setRewardClaimed(null);
                  setCitizenTab('history');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono uppercase rounded border border-slate-750 transition cursor-pointer"
              >
                Continue to History
              </button>

              {rewardClaimed.policeAlertId && (
                <button
                  onClick={() => {
                    const alertId = rewardClaimed.policeAlertId;
                    setRewardClaimed(null);
                    setCitizenTab('history');
                    onNavigate('Police Review Panel', alertId);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-550 text-white text-xs font-bold font-mono uppercase rounded shadow-lg shadow-cyan-950/40 transition cursor-pointer flex items-center justify-center gap-1 font-bold"
                >
                  👮 Inspect on Police Review Panel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB CONTENT */}
      {citizenTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="citizen-dashboard-grid">
          
          {/* LEFT: Stats & High-Value Missing Cars Checklist (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Quick Stats Bento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-card border border-slate-850 p-4 rounded-lg space-y-1">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Community Scans Run</span>
                <div className="text-xl font-mono font-bold text-white">{citizenReportsList.length + 3}</div>
                <p className="text-[9px] text-slate-500 font-mono">Completed scans from device</p>
              </div>
              <div className="bg-brand-card border border-slate-850 p-4 rounded-lg space-y-1">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Verified Matches</span>
                <div className="text-xl font-mono font-bold text-emerald-400">
                  {citizenReportsList.filter(a => a.status !== 'Dismissed' && a.watchlist_id !== 'NONE').length + 1}
                </div>
                <p className="text-[9px] text-slate-500 font-mono">Confirmed by operators</p>
              </div>
            </div>

            {/* High-Value Target Alerts (Directly pulling from vehicle watchlist!) */}
            <div className="bg-brand-card border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  High-Value Community Targets
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">Be on the lookout!</span>
              </div>

              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Finding and scanning any of the following vehicle plates will immediately earn you an extra <span className="text-amber-400 font-bold">+200 Points bonus</span> upon submission!
              </p>

              <div className="space-y-2.5">
                {vehicleWatchlist.slice(0, 3).map((target) => (
                  <div key={target.vehicle_watchlist_id} className="p-3 bg-slate-950/40 border border-slate-850 rounded flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded overflow-hidden border border-slate-800 shrink-0">
                        <img 
                          src={target.reference_vehicle_image} 
                          alt={target.vehicle_make} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black text-[10px] rounded border border-slate-900 leading-none">
                            {target.plate_number}
                          </span>
                          <span className="text-[10px] text-red-400 font-bold uppercase">{target.vehicle_status_type.replace('Vehicle', '')}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {target.vehicle_color} {target.vehicle_make} {target.vehicle_model}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-amber-400 font-bold block">+250 PTS</span>
                      <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold">Total Payout</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={() => setCitizenTab('scan')}
                  className="px-4 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 text-[10px] font-bold uppercase font-mono rounded transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <span>📷 Start Searching Nearby Lanes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: Citizen Leaderboard (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="bg-brand-card border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h3 className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Neighborhood Leaderboard
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">Weekly rankings</span>
              </div>

              <div className="space-y-1.5">
                {leaderboard.map((user) => (
                  <div 
                    key={user.handle} 
                    className={`p-2.5 rounded-lg flex justify-between items-center border transition ${
                      user.active 
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/20' 
                        : 'bg-slate-950/20 border-slate-900 hover:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-black text-xs ${
                        user.rank === 1 ? 'text-amber-400' :
                        user.rank === 2 ? 'text-slate-300' :
                        user.rank === 3 ? 'text-amber-600' :
                        'text-slate-500'
                      }`}>
                        #{user.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-mono font-bold ${user.active ? 'text-white' : 'text-slate-300'}`}>
                            {user.handle}
                          </span>
                          {user.active && (
                            <span className="px-1 py-0.2 bg-indigo-500 text-white text-[7px] font-mono uppercase font-black rounded-sm leading-none">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">{user.level}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-300 font-bold block">{user.points} pts</span>
                      <span className="text-[8px] font-mono text-slate-500 block uppercase">Score</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 font-mono text-center leading-relaxed">
                Rankings calculate real-time. Scan nearby parked plates to move past other lookouts in the sector.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* SCAN LICENSE PLATE TAB */}
      {citizenTab === 'scan' && (
        <div className="animate-in fade-in duration-350">
          <CameraScanTab
            settings={settings}
            faceWatchlist={[]}
            vehicleWatchlist={vehicleWatchlist}
            onAddAlert={(newAlert) => {
              onAddAlert(newAlert);
            }}
            onNavigate={onNavigate}
            isCitizenMode={true}
            onCitizenSubmit={(newScan) => {
              // 1. Add scan record to persistent local history
              setCitizenScans((prev) => [...prev, newScan]);

              if (newScan.status === 'Draft') {
                // Shift focus to reports history so they can escalate/dismiss with note/memo
                setCitizenTab('history');
                setToastMessage({
                  type: 'success',
                  text: `Draft report for plate ${newScan.plateNumber || 'target'} saved under History!`
                });
              } else if (newScan.status === 'Dismissed') {
                setPoints((prev) => prev + newScan.pointsAwarded);
                setToastMessage({
                  type: 'warning',
                  text: `Scan for plate ${newScan.plateNumber || 'target'} dismissed and archived locally.`
                });
              } else {
                // 2. Increment score points
                setPoints((prev) => prev + newScan.pointsAwarded);

                // 3. Trigger rewards presentation modal
                setRewardClaimed({
                  show: true,
                  pointsGained: newScan.pointsAwarded,
                  isBonus: newScan.matchFound,
                  plate: newScan.plateNumber || newScan.matchedEntityName || 'Sighted Target',
                  policeAlertId: newScan.policeAlertId
                });

                setToastMessage({
                  type: 'success',
                  text: `Escalation report for plate ${newScan.plateNumber || 'target'} sent to Police Command!`
                });
              }
            }}
            citizenHandle={citizenHandle}
          />
        </div>
      )}

      {/* MY REPORTS HISTORY TAB */}
      {citizenTab === 'history' && (
        <div className="bg-brand-card border border-slate-800 rounded-lg p-5 space-y-5 shadow-xl" id="citizen-history-panel">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="text-xs font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Your Scouting Reports Logs
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">Detailed tracking of scans, notes & audio</span>
          </div>

          <div className="space-y-4">
            {citizenScans.slice().reverse().map((scan) => (
              <CitizenHistoryCard
                key={scan.id}
                scan={scan}
                alerts={alerts}
                onAddAlert={onAddAlert}
                citizenHandle={citizenHandle}
                onTriggerReward={(rewardDetails) => {
                  setRewardClaimed(rewardDetails);
                }}
                onUpdateScan={(updatedScan) => {
                  setCitizenScans((prev) => 
                    prev.map(s => s.id === updatedScan.id ? updatedScan : s)
                  );
                  if (updatedScan.pointsAwarded > 0) {
                    setPoints((prev) => prev + updatedScan.pointsAwarded);
                  }

                  if (updatedScan.status === 'Dismissed') {
                    setToastMessage({
                      type: 'warning',
                      text: `Draft report for plate ${updatedScan.plateNumber || 'target'} dismissed.`
                    });
                  } else if (updatedScan.status === 'Sent to Police') {
                    setToastMessage({
                      type: 'success',
                      text: `Draft report for plate ${updatedScan.plateNumber || 'target'} escalated to Police Command!`
                    });
                  } else if (updatedScan.status === 'Draft') {
                    setToastMessage({
                      type: 'success',
                      text: `Draft changes for plate ${updatedScan.plateNumber || 'target'} saved successfully!`
                    });
                  }
                }}
              />
            ))}

            {citizenScans.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2 border border-slate-900 rounded-lg bg-slate-950/25">
                <p>No scouting report logs available.</p>
                <p className="text-slate-600 text-[11px]">Go to the "Scan Plate & Report" tab to run our dual-mode live scanner in your sector!</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// COMPONENT: CitizenHistoryCard (Isolated state for modularity & recorder)
// ============================================================================
interface CitizenHistoryCardProps {
  key?: string | number;
  scan: CitizenScan;
  alerts: AlertRecord[];
  onAddAlert: (alert: AlertRecord) => void;
  onUpdateScan: (updatedScan: CitizenScan) => void;
  onTriggerReward: (rewardDetails: any) => void;
  citizenHandle: string;
}

function CitizenHistoryCard({
  scan,
  alerts,
  onAddAlert,
  onUpdateScan,
  onTriggerReward,
  citizenHandle
}: CitizenHistoryCardProps) {
  const [draftNote, setDraftNote] = useState(scan.notes || '');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(scan.voiceNoteDuration || 0);
  const [recordedVoice, setRecordedVoice] = useState(scan.hasVoiceNote || false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDraftNote(scan.notes || '');
    setSeconds(scan.voiceNoteDuration || 0);
    setRecordedVoice(scan.hasVoiceNote || false);
  }, [scan]);

  const startRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    setRecordedVoice(false);
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordedVoice(true);
  };

  const deleteRecording = () => {
    setRecordedVoice(false);
    setSeconds(0);
    setIsPlaying(false);
    setPlaySeconds(0);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setIsPlaying(false);
      setPlaySeconds(0);
    } else {
      setIsPlaying(true);
      setPlaySeconds(0);
      playTimerRef.current = setInterval(() => {
        setPlaySeconds(prev => {
          if (prev >= seconds) {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    onUpdateScan({
      ...scan,
      status: 'Dismissed',
      notes: draftNote,
      hasVoiceNote: recordedVoice,
      voiceNoteDuration: recordedVoice ? seconds : undefined,
      pointsAwarded: 10
    });
  };

  const handleSaveDraftChanges = () => {
    onUpdateScan({
      ...scan,
      status: 'Draft',
      notes: draftNote,
      hasVoiceNote: recordedVoice,
      voiceNoteDuration: recordedVoice ? seconds : undefined,
      pointsAwarded: 0
    });
  };

  const handleEscalate = () => {
    const policeAlertId = `ALRT-${Math.floor(10000 + Math.random() * 9000)}`;
    const pointsAwarded = scan.matchFound ? 250 : 50;
    
    let notesText = `COMMUNITY WATCH REPORT (ESCALATED FROM DRAFT). Submitted by citizen: [${citizenHandle}]. `;
    if (scan.scanMode === 'Face' && scan.matchedEntityName) {
      notesText += `Sighted face matching wanted record: ${scan.matchedEntityName}. `;
    } else if (scan.scanMode === 'Vehicle' && scan.plateNumber) {
      notesText += `Sighted vehicle with license plate ${scan.plateNumber}. `;
    }
    notesText += `Notes: "${draftNote || 'No notes attached'}". `;
    if (recordedVoice) {
      notesText += `Voice memo attached (${seconds}s).`;
    }

    const newAlert: AlertRecord = {
      alert_id: policeAlertId,
      alert_type: scan.scanMode === 'Face' ? "Face Alert" : "Vehicle Alert",
      timestamp: new Date().toISOString(),
      spotted_location: "Community Scout Submission (Escalated Draft)",
      source_camera: `CITIZEN-NODE-(${citizenHandle})`,
      matched_entity_name: scan.scanMode === 'Face' ? (scan.matchedEntityName || 'Face') : (scan.plateNumber || 'Plate'),
      watchlist_id: scan.scanMode === 'Face' ? (scan.matchedEntityName || 'NONE') : (scan.plateNumber || 'NONE'),
      case_id: scan.scanMode === 'Face' ? 'FACE-LOG-2026' : 'CIVIC-LOG-2026',
      similarity_score_or_plate_confidence: scan.qualityScore || 85,
      quality_score: scan.qualityScore || 80,
      blur_score: scan.blurScore || 15,
      threshold: 70,
      status: "Pending Review",
      thumbnail_image: scan.image,
      notes: notesText,
      risk_priority: scan.matchFound ? 'High' : 'Medium'
    };

    onAddAlert(newAlert);

    onUpdateScan({
      ...scan,
      status: 'Sent to Police',
      notes: draftNote,
      hasVoiceNote: recordedVoice,
      voiceNoteDuration: recordedVoice ? seconds : undefined,
      pointsAwarded,
      policeAlertId
    });

    onTriggerReward({
      show: true,
      pointsGained: pointsAwarded,
      isBonus: scan.matchFound,
      plate: scan.plateNumber || scan.matchedEntityName || 'Sighted Target',
      policeAlertId
    });
  };

  const liveAlert = scan.policeAlertId ? alerts.find(a => a.alert_id === scan.policeAlertId) : null;
  const currentStatus = liveAlert ? liveAlert.status : (scan.status === 'Sent to Police' ? 'Pending Review' : scan.status === 'Dismissed' ? 'Dismissed' : 'Draft');
  const reviewerNotes = liveAlert ? liveAlert.reviewer_notes : null;

  return (
    <div className={`p-4 rounded-lg flex flex-col md:flex-row justify-between gap-5 transition duration-150 border ${
      scan.status === 'Draft' 
        ? 'bg-gradient-to-r from-slate-900/90 via-slate-900/90 to-indigo-950/45 border-indigo-500/40 shadow-indigo-950/30 shadow-lg' 
        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
    }`}>
      <div className="flex gap-4 items-start flex-1 min-w-0">
        <div className="w-24 h-18 rounded overflow-hidden border border-slate-850 shrink-0 bg-slate-900 shadow-md relative group">
          <img src={scan.image} alt={scan.plateNumber || 'Car Scan'} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black text-[11px] rounded border border-slate-950 leading-none shadow-sm">
              {scan.plateNumber || scan.matchedEntityName || 'UNKNOWN'}
            </span>

            {scan.matchFound ? (
              <span className="px-1.5 py-0.5 bg-rose-950/60 border border-rose-900/40 text-rose-400 font-mono text-[9px] font-black rounded uppercase">
                🚨 Watchlist Wanted Target
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[9px] rounded uppercase">
                Ordinary Civic Record
              </span>
            )}

            {scan.status === 'Dismissed' ? (
              <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-900 text-slate-500 font-mono text-[9px] rounded uppercase flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5 text-slate-600" /> Loc Dismissed
              </span>
            ) : scan.status === 'Draft' ? (
              <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] rounded uppercase flex items-center gap-1 font-bold animate-pulse">
                📝 Draft Report
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-indigo-950 border border-indigo-900/30 text-indigo-400 font-mono text-[9px] rounded uppercase flex items-center gap-1">
                <Send className="w-2.5 h-2.5" /> Sent to Police
              </span>
            )}

            {scan.status !== 'Draft' && (
              <span className={`px-1.5 py-0.5 font-mono text-[9px] font-bold rounded ${
                scan.pointsAwarded >= 200 ? 'bg-amber-400/10 border border-amber-500/30 text-amber-400' : 'bg-emerald-400/10 border border-emerald-500/30 text-emerald-400'
              }`}>
                +{scan.pointsAwarded} PTS
              </span>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex gap-3 flex-wrap">
            <span>Mode: <strong className="text-slate-300">{scan.scanMode}</strong></span>
            {scan.scanMode === 'Vehicle' && (
              <>
                <span>Make: <strong className="text-slate-300">{scan.vehicleMake || 'N/A'}</strong></span>
                <span>Color: <strong className="text-slate-300">{scan.vehicleColor || 'N/A'}</strong></span>
              </>
            )}
            <span>Blur: <strong className="text-slate-400">{scan.blurScore !== undefined ? `${scan.blurScore}%` : 'Low'}</strong></span>
            <span>Quality: <strong className="text-slate-400">{scan.qualityScore !== undefined ? `${scan.qualityScore}%` : 'High'}</strong></span>
          </div>

          {scan.status === 'Draft' ? (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-black text-indigo-300 uppercase tracking-wider block">
                  Write/Update Escalation Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Type notes detailing why you are escalating this to police dispatch..."
                  value={draftNote}
                  onChange={e => setDraftNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded p-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5" />
                    Attach Voice Note
                  </span>
                  {recordedVoice ? (
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-1.5 py-0.5 rounded-sm uppercase font-bold">
                      ✓ RECORDED ({seconds}s)
                    </span>
                  ) : (
                    <span className="text-[8px] text-slate-500 font-mono uppercase">
                      Optional voice note
                    </span>
                  )}
                </div>

                {!isRecording && !recordedVoice ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 text-[9px] font-mono font-black uppercase rounded flex items-center justify-center gap-1 border border-slate-850 transition cursor-pointer font-bold"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Record Escalation Voice Note
                  </button>
                ) : isRecording ? (
                  <div className="space-y-2 text-center py-1.5 bg-red-950/15 rounded border border-red-900/10">
                    <div className="flex justify-center items-center gap-1 h-4">
                      <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '75%', animationDuration: '0.4s' }} />
                      <span className="w-1 bg-red-400 rounded animate-pulse" style={{ height: '45%', animationDuration: '0.6s' }} />
                      <span className="w-1 bg-red-500 rounded animate-pulse" style={{ height: '95%', animationDuration: '0.3s' }} />
                    </div>
                    <div className="flex justify-between items-center px-2 text-[9px]">
                      <span className="text-red-400 font-mono font-bold animate-pulse">RECORDING...</span>
                      <span className="font-mono text-slate-300">00:{seconds < 10 ? `0${seconds}` : seconds}</span>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-mono uppercase rounded flex items-center gap-1 cursor-pointer font-bold"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-850">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={togglePlayback}
                        className="p-1 bg-indigo-650 hover:bg-indigo-500 text-white rounded transition cursor-pointer flex items-center justify-center"
                      >
                        {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-mono font-bold text-slate-300">ESCALATE_MEMO.WAV</span>
                        <span className="text-[7px] font-mono text-slate-500">
                          {isPlaying ? `00:${playSeconds < 10 ? `0${playSeconds}` : playSeconds}` : `00:00`} / 00:{seconds < 10 ? `0${seconds}` : seconds}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 mx-2 bg-slate-900 h-1 rounded overflow-hidden relative">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: isPlaying ? `${(playSeconds / seconds) * 100}%` : '0%' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="p-1 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {scan.notes && (
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-900 text-[11px] text-slate-400 font-mono max-w-xl">
                  <span className="font-bold text-[9px] text-indigo-400 uppercase block mb-0.5">Your brief context:</span>
                  "{scan.notes}"
                </div>
              )}

              {scan.hasVoiceNote && (
                <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-900/20 rounded p-2 text-[11px] font-mono text-indigo-300 w-fit">
                  <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Voice Memo Attached ({scan.voiceNoteDuration || 5}s)</span>
                  <button
                    onClick={togglePlayback}
                    className="ml-3 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        Pause [{playSeconds}s]
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Play memo
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="text-[9px] text-slate-600 font-mono">
            Captured timestamp: {new Date(scan.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      {scan.status === 'Draft' ? (
        <div className="md:text-right flex flex-col justify-center items-stretch md:items-end gap-2 shrink-0 md:w-56 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
          <div className="text-indigo-400 text-[10px] uppercase font-mono font-bold tracking-wider mb-1">
            ⚡ Dual-Action Center
          </div>

          <div className="flex md:flex-col gap-1.5 w-full">
            <button
              onClick={handleSaveDraftChanges}
              className="flex-1 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-200 border border-indigo-800 rounded font-mono uppercase text-[9px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3 text-indigo-400" />
              💾 Save Draft
            </button>

            <button
              onClick={handleDismiss}
              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-rose-400 hover:text-rose-300 font-mono uppercase text-[9px] font-black rounded border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              ✕ Dismiss Alert
            </button>

            <button
              onClick={handleEscalate}
              className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono uppercase text-[9px] font-black rounded shadow-md shadow-indigo-950/40 hover:shadow-indigo-950/60 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3 text-emerald-300" />
              ⚡ Escalate to Police
            </button>
          </div>

          <div className="text-[8px] text-slate-500 text-left md:text-right mt-1 font-mono leading-normal">
            Escalating will dispatch police, reward up to <span className="text-indigo-400 font-bold font-sans">+250 pts</span>, and increment leaderboard status.
          </div>
        </div>
      ) : scan.status === 'Dismissed' ? (
        <div className="md:text-right flex flex-col justify-start md:items-end gap-1.5 shrink-0 md:w-56 font-mono text-xs border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Local Archival Status</div>
          <span className="text-slate-500 font-black text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-900">
            ✕ DISMISSED
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed text-left md:text-right mt-1">
            This scan was discarded by you locally and was not logged in central police dispatcher review panels.
          </p>
        </div>
      ) : (
        <div className="md:text-right flex flex-col justify-between items-start md:items-end gap-2 shrink-0 md:w-56 font-mono text-xs border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Police Decision:</span>
            <span className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded ${
              currentStatus === 'Pending Review' ? 'bg-rose-950/60 border border-rose-900/30 text-rose-400 animate-pulse' :
              currentStatus === 'Under Investigation' ? 'bg-amber-950/60 border border-amber-900/30 text-amber-400' :
              currentStatus === 'Escalated' ? 'bg-pink-950/60 border border-pink-900/30 text-pink-400 animate-pulse' :
              'bg-slate-900 border border-slate-800 text-slate-400'
            }`}>
              {currentStatus === 'Pending Review' ? '⏳ Pending Review' :
               currentStatus === 'Under Investigation' ? '🚨 Dispatched' :
               currentStatus === 'Escalated' ? '⚡ APPREHENDING' :
               '✓ Resolved'}
            </span>
          </div>

          {reviewerNotes ? (
            <div className="p-2.5 bg-slate-950/80 rounded border border-slate-900 text-[10px] text-slate-400 italic text-left w-full shadow-inner">
              <span className="font-bold text-[9px] text-cyan-400 uppercase not-italic block mb-0.5">Dispatcher reply:</span>
              "{reviewerNotes}"
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic font-mono">
              Waiting for live command center dispatcher to review this report...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
