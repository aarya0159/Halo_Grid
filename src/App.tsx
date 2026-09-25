import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Users, Car, AlertTriangle, Eye, 
  BarChart2, Settings, ShieldAlert, CheckCircle2, RefreshCw, LogOut, Lock,
  ArrowRight, Home, Globe, HelpCircle
} from 'lucide-react';
import { 
  FaceWatchlistRecord, VehicleWatchlistRecord, AlertRecord, SystemSettings, AlertStatus, UserSession 
} from './types';
import { 
  INITIAL_SYSTEM_SETTINGS, SEEDED_FACE_WATCHLIST, SEEDED_VEHICLE_WATCHLIST, PRESEEDED_ALERTS 
} from './data/seededData';

// Component Imports
import DashboardTab from './components/DashboardTab';
import CameraScanTab from './components/CameraScanTab';
import WatchlistTab from './components/WatchlistTab';
import VehicleWatchlistTab from './components/VehicleWatchlistTab';
import AlertsTab from './components/AlertsTab';
import PoliceReviewTab from './components/PoliceReviewTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import CitizenPortal from './components/CitizenPortal';

export default function App() {
  // Portal Navigation State ('hub' | 'police' | 'citizen')
  const [portalMode, setPortalMode] = useState<'hub' | 'police' | 'citizen'>(() => {
    const saved = localStorage.getItem('halogrid_portal_mode');
    return (saved as any) || 'hub';
  });

  // Navigation inside Police Portal
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('halogrid_portal_mode', portalMode);
  }, [portalMode]);

  // Simulated User Session
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('halogrid_session');
    if (saved) return JSON.parse(saved);
    return {
      username: 'ops.parker',
      fullName: 'Officer Alex Parker',
      role: 'Operator'
    };
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('halogrid_session', JSON.stringify(session));
  }, [session]);

  const isTabLocked = (tabName: string): boolean => {
    if (session.role === 'Admin') return false;
    if (tabName === 'System Settings') return true;
    if (tabName === 'Analytics' && session.role === 'Operator') return true;
    return false;
  };

  // Core Persisted States
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('halogrid_settings');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const [faceWatchlist, setFaceWatchlist] = useState<FaceWatchlistRecord[]>(() => {
    const saved = localStorage.getItem('halogrid_facewatchlist');
    return saved ? JSON.parse(saved) : SEEDED_FACE_WATCHLIST;
  });

  const [vehicleWatchlist, setVehicleWatchlist] = useState<VehicleWatchlistRecord[]>(() => {
    const saved = localStorage.getItem('halogrid_vehiclewatchlist');
    if (saved) {
      try {
        const parsed: VehicleWatchlistRecord[] = JSON.parse(saved);
        const merged = [...parsed];
        SEEDED_VEHICLE_WATCHLIST.forEach(seeded => {
          if (!merged.some(v => v.vehicle_watchlist_id === seeded.vehicle_watchlist_id)) {
            merged.push(seeded);
          }
        });
        return merged;
      } catch (e) {
        return SEEDED_VEHICLE_WATCHLIST;
      }
    }
    return SEEDED_VEHICLE_WATCHLIST;
  });

  const [alerts, setAlerts] = useState<AlertRecord[]>(() => {
    const saved = localStorage.getItem('halogrid_alerts');
    return saved ? JSON.parse(saved) : PRESEEDED_ALERTS;
  });

  // Simple scan stats
  const [totalScans, setTotalScans] = useState<number>(() => {
    const saved = localStorage.getItem('halogrid_totalscans');
    return saved ? Number(saved) : 481;
  });

  const [acceptedScans, setAcceptedScans] = useState<number>(() => {
    const saved = localStorage.getItem('halogrid_acceptedscans');
    return saved ? Number(saved) : 412;
  });

  const [rejectedScans, setRejectedScans] = useState<number>(() => {
    const saved = localStorage.getItem('halogrid_rejectedscans');
    return saved ? Number(saved) : 69;
  });

  // Synchronizers
  useEffect(() => {
    localStorage.setItem('halogrid_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('halogrid_facewatchlist', JSON.stringify(faceWatchlist));
  }, [faceWatchlist]);

  useEffect(() => {
    localStorage.setItem('halogrid_vehiclewatchlist', JSON.stringify(vehicleWatchlist));
  }, [vehicleWatchlist]);

  useEffect(() => {
    localStorage.setItem('halogrid_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('halogrid_totalscans', totalScans.toString());
  }, [totalScans]);

  useEffect(() => {
    localStorage.setItem('halogrid_acceptedscans', acceptedScans.toString());
  }, [acceptedScans]);

  useEffect(() => {
    localStorage.setItem('halogrid_rejectedscans', rejectedScans.toString());
  }, [rejectedScans]);

  // Handler functions
  const handleNavigate = (tab: string, arg?: any) => {
    setActiveTab(tab);
    const policeTabs = ['Dashboard', 'Camera Scan', 'Watchlist Database', 'Vehicle Watchlist', 'Alerts Dashboard', 'Police Review Panel', 'Analytics', 'System Settings'];
    if (policeTabs.includes(tab)) {
      setPortalMode('police');
    }
    if (arg) {
      setSelectedAlertId(arg);
    } else {
      setSelectedAlertId(null);
    }
  };

  const handleAddFaceRecord = (record: FaceWatchlistRecord) => {
    setFaceWatchlist(prev => [record, ...prev]);
  };

  const handleDeleteFaceRecord = (id: string) => {
    setFaceWatchlist(prev => prev.filter(f => f.watchlist_id !== id));
  };

  const handleAddVehicleRecord = (record: VehicleWatchlistRecord) => {
    setVehicleWatchlist(prev => [record, ...prev]);
  };

  const handleDeleteVehicleRecord = (id: string) => {
    setVehicleWatchlist(prev => prev.filter(v => v.vehicle_watchlist_id !== id));
  };

  const handleAddAlert = (newAlert: AlertRecord) => {
    setAlerts(prev => {
      const exists = prev.some(a => a.alert_id === newAlert.alert_id);
      if (exists) {
        return prev.map(a => a.alert_id === newAlert.alert_id ? { ...a, ...newAlert } : a);
      }
      return [newAlert, ...prev];
    });
  };

  const handleUpdateAlertStatus = (id: string, status: AlertStatus, reviewerNotes?: string) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.alert_id === id) {
        return {
          ...alert,
          status,
          reviewer_notes: reviewerNotes || alert.reviewer_notes
        };
      }
      return alert;
    }));
  };

  const handleClearAllAlerts = () => {
    setAlerts(PRESEEDED_ALERTS);
  };

  const handleIncrementScans = (accepted: boolean) => {
    setTotalScans(prev => prev + 1);
    if (accepted) {
      setAcceptedScans(prev => prev + 1);
    } else {
      setRejectedScans(prev => prev + 1);
    }
  };

  // Nav configuration - Sidelined Facial Watchlist to focus purely on plate scan
  const menuItems = [
    { name: 'Dashboard', icon: Activity },
    { name: 'Camera Scan', icon: CameraIcon },
    { name: 'Vehicle Watchlist', icon: Car },
    { name: 'Alerts Dashboard', icon: AlertTriangle },
    { name: 'Police Review Panel', icon: Shield },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'System Settings', icon: Settings },
  ];

  function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
    return <Activity {...props} />;
  }

  // Render sub-tabs
  const renderContent = () => {
    if (isTabLocked(activeTab)) {
      const required = activeTab === 'System Settings' ? 'Admin' : 'Reviewer';
      return (
        <AccessDeniedPanel 
          requiredRole={required} 
          currentRole={session.role} 
          onSwitchToAdmin={() => setSession({ username: 'supt.diaz', fullName: 'Chief Superintendent Sofia Diaz', role: 'Admin' })} 
        />
      );
    }

    switch (activeTab) {
      case 'Dashboard':
        return (
          <DashboardTab
            faceWatchlist={faceWatchlist}
            vehicleWatchlist={vehicleWatchlist}
            alerts={alerts}
            totalScans={totalScans}
            acceptedScans={acceptedScans}
            rejectedScans={rejectedScans}
            onNavigate={handleNavigate}
          />
        );
      case 'Camera Scan':
        return (
          <CameraScanTab
            settings={settings}
            faceWatchlist={faceWatchlist}
            vehicleWatchlist={vehicleWatchlist}
            onAddAlert={handleAddAlert}
            onNavigate={handleNavigate}
            incrementScansCount={handleIncrementScans}
          />
        );
      case 'Watchlist Database':
        return (
          <WatchlistTab
            watchlist={faceWatchlist}
            onAddRecord={handleAddFaceRecord}
            onDeleteRecord={handleDeleteFaceRecord}
            onNavigate={handleNavigate}
            alerts={alerts}
            sessionRole={session.role}
          />
        );
      case 'Vehicle Watchlist':
        return (
          <VehicleWatchlistTab
            vehicleWatchlist={vehicleWatchlist}
            onAddRecord={handleAddVehicleRecord}
            onDeleteRecord={handleDeleteVehicleRecord}
            onNavigate={handleNavigate}
            alerts={alerts}
            sessionRole={session.role}
          />
        );
      case 'Alerts Dashboard':
        return (
          <AlertsTab
            alerts={alerts}
            onNavigate={handleNavigate}
            onClearAllAlerts={handleClearAllAlerts}
          />
        );
      case 'Police Review Panel':
        return (
          <PoliceReviewTab
            alerts={alerts}
            faceWatchlist={faceWatchlist}
            vehicleWatchlist={vehicleWatchlist}
            selectedAlertId={selectedAlertId}
            onSelectAlert={setSelectedAlertId}
            onUpdateAlertStatus={handleUpdateAlertStatus}
          />
        );
      case 'Analytics':
        return (
          <AnalyticsTab
            alerts={alerts}
            faceWatchlist={faceWatchlist}
            vehicleWatchlist={vehicleWatchlist}
            totalScans={totalScans}
            acceptedScans={acceptedScans}
            rejectedScans={rejectedScans}
          />
        );
      case 'System Settings':
        return (
          <SettingsTab
            settings={settings}
            onUpdateSettings={setSettings}
            faceCount={faceWatchlist.length}
            vehicleCount={vehicleWatchlist.length}
          />
        );
      default:
        return null;
    }
  };

  const pendingReviewCount = alerts.filter(a => a.status === 'Pending Review').length;

  // 1. HUB LANDING GATE SCREEN
  if (portalMode === 'hub') {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-100 font-sans flex flex-col justify-between" id="hub-landing-page">
        {/* Hub Header */}
        <header className="h-16 bg-brand-header border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-650 to-indigo-600 flex items-center justify-center border border-indigo-500/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-white block">HALO GRID SURVEILLANCE</span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">Unified Operations Hub</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase font-black bg-brand-bg px-2.5 py-1 rounded border border-slate-850">
            Node #01-SG Operational
          </span>
        </header>

        {/* Hub Cinematic Grid */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center space-y-10">
          <div className="text-center space-y-3">
            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono uppercase tracking-widest rounded-full">
              Simulated Multi-tier Public Safety System
            </span>
            <h1 className="text-3xl md:text-4xl font-sans font-black uppercase text-white tracking-tight leading-none">
              Welcome to Halo Grid
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-mono">
              Select an entry portal below. Experience the active license plate recognition network as a law-enforcement operator or as a neighborhood watch citizen scout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* POLICE CARD */}
            <div 
              className="bg-brand-card hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 rounded-xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-950/5 cursor-pointer"
              onClick={() => setPortalMode('police')}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-sans font-black uppercase text-white group-hover:text-cyan-400 transition">
                    👮 Police Division HQ
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Internal Security Agency Terminal
                  </span>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1.5">
                    Monitor live ANPR plate alarms, review pending dispatch alerts, coordinate geolocation grids, manage watchlists, and review analytics.
                  </p>
                </div>
              </div>
              <button className="w-full py-2.5 bg-brand-bg hover:bg-slate-850 text-cyan-400 border border-slate-800 hover:border-cyan-500/30 text-xs font-bold font-mono uppercase rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Enter Operations Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CITIZEN CARD */}
            <div 
              className="bg-brand-card hover:bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 rounded-xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-950/5 cursor-pointer"
              onClick={() => setPortalMode('citizen')}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-sans font-black uppercase text-white group-hover:text-indigo-400 transition">
                    👥 Citizen Watch Portal
                  </h3>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Active Community Lookout Application
                  </span>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1.5">
                    Scan license plates in your neighborhood, review detected target drafts, write dispatcher notes, submit safety reports, and earn points on leaderboards.
                  </p>
                </div>
              </div>
              <button className="w-full py-2.5 bg-brand-bg hover:bg-slate-850 text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-xs font-bold font-mono uppercase rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Launch Citizen Watch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </main>

        {/* Hub Footer */}
        <footer className="h-14 border-t border-slate-800 bg-brand-header flex items-center justify-between px-6 text-[9px] font-mono text-slate-500">
          <span>SECURE SYSTEM PROTOCOL v1.0.0</span>
          <span>SANDBOX SIMULATION • ALL DATA SYNTHETIC</span>
        </footer>
      </div>
    );
  }

  // 2. CITIZEN PORTAL APP VIEW
  if (portalMode === 'citizen') {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-100 font-sans flex flex-col justify-between" id="citizen-app-root">
        {/* Citizen Top Bar Header */}
        <header className="h-16 bg-brand-header border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center border border-indigo-400/30">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-white block">HALO GRID</span>
              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">Citizen Patrol App</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Return to Hub */}
            <button
              onClick={() => setPortalMode('hub')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono font-bold uppercase rounded text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Portal Hub
            </button>
            
            {/* Quick Switch to Police */}
            <button
              onClick={() => setPortalMode('police')}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-650 to-blue-605 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] font-mono font-bold uppercase rounded shadow-lg shadow-cyan-950/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              👮 Enter Police Command
            </button>
          </div>
        </header>

        {/* Citizen Main Workspace */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 overflow-y-auto">
          <CitizenPortal
            vehicleWatchlist={vehicleWatchlist}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onNavigate={handleNavigate}
            settings={settings}
          />
        </main>

        {/* Citizen Footer */}
        <footer className="h-8 border-t border-slate-800 bg-brand-header flex items-center justify-between px-4 md:px-6 shrink-0 text-[9px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>Neighborhood Lookout Scout Node</span>
          </div>
          <span>SIMULATED REWARDS CORE</span>
        </footer>
      </div>
    );
  }

  // 3. POLICE HQ AGENCY VIEW (with switcher)
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-bg text-slate-100 font-sans" id="halo-grid-app-root">
      
      {/* SIDEBAR NAVIGATION - Hidden on very small viewports, scrolling menu */}
      <aside className="w-full md:w-64 bg-brand-header border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0" id="sidebar-panel">
        <div>
          {/* Brand header block */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-brand-bg/40">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-sans font-black tracking-widest text-white leading-none">HALO GRID</h1>
              <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mt-1">SIMULATOR MVP</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="p-3 space-y-1" id="sidebar-navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              const locked = isTabLocked(item.name);
              return (
                <button
                  key={item.name}
                  id={`nav-link-${item.name.replace(' ', '-')}`}
                  onClick={() => handleNavigate(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition duration-150 ${
                    isActive 
                      ? 'bg-brand-card text-cyan-400 border-l-2 border-cyan-400 font-bold shadow-inner' 
                      : 'text-slate-400 hover:bg-brand-card/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className={locked ? 'opacity-60' : ''}>{item.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {locked && <Lock className="w-3 h-3 text-red-500/80 shrink-0" />}
                    {item.name === 'Police Review Panel' && pendingReviewCount > 0 && (
                      <span className="bg-red-500 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded">
                        {pendingReviewCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer context disclaimer */}
        <div className="p-4 border-t border-slate-800 bg-brand-bg/20 space-y-2.5">
          <button
            onClick={() => setPortalMode('hub')}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono font-bold uppercase rounded text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Exit Command Hub
          </button>

          <div className="p-2 bg-brand-bg/60 border border-slate-800 rounded text-[9px] text-slate-400 font-mono tracking-tight leading-relaxed">
            <span className="text-cyan-400 font-bold block mb-0.5">⚠️ SANDBOX MODE</span>
            This operations terminal parses strictly **synthetic mock data**. Real biometrics or police files are completely isolated.
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER PANELS SECTION */}
      <div className="flex-1 flex flex-col min-w-0" id="main-frame">
        
        {/* TOP STATUS BAR BAR WITH SAFETY DISCLAIMERS */}
        <header className="h-14 bg-brand-header border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0" id="top-bar-header">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-bold font-mono bg-brand-bg px-2 py-1 rounded border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SURVEILLANCE NODE #01-SG
            </div>

            {/* Seamless switcher button for operators to showcase both views easily */}
            <button
              onClick={() => setPortalMode('citizen')}
              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900/40 text-[9px] font-mono font-bold uppercase rounded text-indigo-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              👥 Switch to Citizen App
            </button>
          </div>

          {/* CRITICAL PRODUCT SAFETY SYSTEM NOTICE */}
          <div className="px-3 py-1.5 bg-red-950/40 border border-red-900/30 rounded flex items-center gap-2 text-[9px] font-mono font-bold tracking-tight text-rose-400 shadow-md">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
            <span className="hidden md:inline">SYSTEM STATE:</span>
            <span>SIMULATION ONLY • SYNTHETIC DATA • NO REAL LAW-ENFORCEMENT SYSTEM</span>
          </div>

          {/* User profile identifier block with dropdown selector */}
          <div className="relative" id="user-role-dropdown-trigger">
            <button 
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-brand-card hover:bg-slate-800 border border-slate-800 transition text-left cursor-pointer shadow"
            >
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">{session.role}</span>
                <span className="text-xs text-slate-300 font-bold font-mono">{session.username}@halogrid</span>
              </div>
              <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 border border-slate-800">
                {session.role.slice(0, 2).toUpperCase()}
              </div>
            </button>

            {showRoleDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-brand-card border border-slate-800 rounded-lg shadow-2xl z-20 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-100" id="user-role-dropdown-menu">
                  <div className="px-2 py-1.5 border-b border-slate-850 pb-2">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Logged in as</span>
                    <span className="text-xs font-bold text-white block truncate">{session.fullName}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest px-2 block font-bold">Simulate switching accounts</span>
                    
                    {/* Operator Account Button */}
                    <button
                      onClick={() => {
                        setSession({ username: 'ops.parker', fullName: 'Officer Alex Parker', role: 'Operator' });
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                        session.role === 'Operator' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-[11px]">Officer Alex Parker</span>
                        <span className="text-[9px] font-mono text-slate-500">Role: Operator</span>
                      </div>
                      {session.role === 'Operator' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                    </button>

                    {/* Reviewer Account Button */}
                    <button
                      onClick={() => {
                        setSession({ username: 'rev.chen', fullName: 'Inspector Sarah Chen', role: 'Reviewer' });
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                        session.role === 'Reviewer' ? 'bg-slate-900 text-yellow-400 border border-slate-800' : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-[11px]">Inspector Sarah Chen</span>
                        <span className="text-[9px] font-mono text-slate-500">Role: Reviewer</span>
                      </div>
                      {session.role === 'Reviewer' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>}
                    </button>

                    {/* Admin Account Button */}
                    <button
                      onClick={() => {
                        setSession({ username: 'supt.diaz', fullName: 'Chief Superintendent Sofia Diaz', role: 'Admin' });
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                        session.role === 'Admin' ? 'bg-slate-900 text-red-400 border border-slate-800' : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-[11px]">Chief Supt. Sofia Diaz</span>
                        <span className="text-[9px] font-mono text-slate-500">Role: Admin</span>
                      </div>
                      {session.role === 'Admin' && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* CONTAINER VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-brand-bg" id="viewport-workspace">
          {renderContent()}
        </main>

        {/* HIGH-DENSITY OPERATIONS FOOTER */}
        <footer className="h-8 border-t border-slate-800 bg-brand-header flex items-center justify-between px-4 md:px-6 shrink-0" id="terminal-footer">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-semibold">Engine: v1.0.0-Sim</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-6">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">FEEDS CONNECTED:</span>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">4 ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500">
            <span>SECURE PROTOCOL SHA-256</span>
            <span className="text-slate-400">SYS TIME: {new Date().toLocaleTimeString()} UTC</span>
          </div>
        </footer>
      </div>

    </div>
  );
}

function AccessDeniedPanel({ requiredRole, currentRole, onSwitchToAdmin }: { requiredRole: string; currentRole: string; onSwitchToAdmin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto space-y-6" id="access-denied-container">
      <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg animate-pulse">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-sans font-black text-red-400 uppercase tracking-widest">
          SECURITY LEVEL RESTRICTION
        </h3>
        <p className="text-xs text-slate-400 font-mono leading-relaxed">
          Access level <span className="text-red-400 font-bold">[{currentRole}]</span> is insufficient for this division. Required cryptographic clearance level: <span className="text-emerald-400 font-bold">[{requiredRole}]</span>.
        </p>
      </div>
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-[10px] font-mono text-slate-500 text-left leading-relaxed">
        <strong>Security protocol notice:</strong> All unauthorized traversal attempts are automatically logged and flagged in system diagnostics.
      </div>
      <button
        onClick={onSwitchToAdmin}
        className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold uppercase rounded shadow-lg transition cursor-pointer"
      >
        🔑 Simulate L3 Admin Login
      </button>
    </div>
  );
}
