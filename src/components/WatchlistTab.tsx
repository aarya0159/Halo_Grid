import React, { useState } from 'react';
import { 
  Search, Users, Plus, AlertTriangle, MapPin, Calendar, 
  ChevronRight, X, ShieldAlert, CheckCircle, Trash2, Heart
} from 'lucide-react';
import { FaceWatchlistRecord, StatusType } from '../types';

interface WatchlistTabProps {
  watchlist: FaceWatchlistRecord[];
  onAddRecord: (record: FaceWatchlistRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigate: (tab: string, arg?: any) => void;
  alerts: any[];
  sessionRole?: string;
}

export default function WatchlistTab({
  watchlist,
  onAddRecord,
  onDeleteRecord,
  onNavigate,
  alerts,
  sessionRole = 'Operator'
}: WatchlistTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedPerson, setSelectedPerson] = useState<FaceWatchlistRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for adding custom record
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState<StatusType>('Fugitive');
  const [formAge, setFormAge] = useState('25-30');
  const [formGender, setFormGender] = useState('Male');
  const [formRisk, setFormRisk] = useState<'Low' | 'Medium' | 'High'>('High');
  const [formLocation, setFormLocation] = useState('Orchard Road Crossing');
  const [formDate, setFormDate] = useState('2026-06-24');
  const [formNotes, setFormNotes] = useState('');
  const [formThreshold, setFormThreshold] = useState(75);
  const [formImageUrl, setFormImageUrl] = useState('');

  // Preset demo face templates for easy adding
  const PRESET_DEMO_FACES = [
    { name: "John Doe (Test)", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop" },
    { name: "Jane Smith (Test)", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop" },
    { name: "Agent Parker (Self)", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop" },
    { name: "Subject Omega", url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop" }
  ];

  // Filtering
  const filteredList = watchlist.filter(person => {
    const matchesSearch = person.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          person.watchlist_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          person.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          person.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || person.status_type === selectedStatus;
    const matchesRisk = selectedRisk === 'All' || person.risk_priority === selectedRisk;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newRecord: FaceWatchlistRecord = {
      watchlist_id: `WF-2026-0${watchlist.length + 1}`,
      candidate_name: formName,
      case_id: `CASE-${Math.floor(1000 + Math.random() * 9000)}-${formName.slice(0,1).toUpperCase()}`,
      status_type: formStatus,
      reference_face_image: formImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop",
      age_range: formAge,
      gender: formGender,
      last_seen_location: formLocation,
      last_seen_date: formDate,
      risk_priority: formRisk,
      alert_threshold: formThreshold,
      notes: formNotes || "Synthetically added target for custom simulator scanning scenarios."
    };

    onAddRecord(newRecord);
    setIsAdding(false);
    // Reset Form
    setFormName('');
    setFormNotes('');
    setFormImageUrl('');
  };

  // Get alerts associated with the selected person
  const relatedAlerts = selectedPerson 
    ? alerts.filter(a => a.watchlist_id === selectedPerson.watchlist_id)
    : [];

  return (
    <div className="space-y-4" id="watchlist-tab-container">
      {/* Tab Header with Counter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Biometric Face Watchlist Database
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            Active synthetic surveillance targets. Simulated facial landmark matrices are matched during camera analysis.
          </p>
        </div>
        {sessionRole === 'Admin' ? (
          <button
            id="add-face-target-btn"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 shadow-md shadow-blue-900/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Face Target
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded flex items-center gap-1.5 text-[9px] font-mono text-slate-500 font-bold uppercase">
            🔒 Watchlist Locked (Read-Only)
          </div>
        )}
      </div>

      {/* Add Custom Record Form Collapse Panel */}
      {isAdding && (
        <div className="p-4 bg-brand-card border border-blue-500/20 rounded space-y-3 shadow-xl" id="add-face-form-panel">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <h3 className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">
              Inject Custom Biometric Face Record
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-300">
            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Subject Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Inspector Lestrade" 
                value={formName} 
                onChange={e => setFormName(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Status Categorization</label>
              <select 
                value={formStatus} 
                onChange={e => setFormStatus(e.target.value as StatusType)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              >
                <option value="Fugitive">Fugitive</option>
                <option value="Missing Person">Missing Person</option>
                <option value="Active Arrest Warrant">Active Arrest Warrant</option>
                <option value="Urgent Locate">Urgent Locate</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Risk Severity Rating</label>
              <select 
                value={formRisk} 
                onChange={e => setFormRisk(e.target.value as 'Low' | 'Medium' | 'High')}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">⚪ Low Priority</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Demographic Details (Age / Gender)</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. 25-30" 
                  value={formAge} 
                  onChange={e => setFormAge(e.target.value)}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                />
                <select 
                  value={formGender} 
                  onChange={e => setFormGender(e.target.value)}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Last Spotted Location</label>
              <input 
                type="text" 
                placeholder="e.g. Orchard Road Crossing" 
                value={formLocation} 
                onChange={e => setFormLocation(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Match Alert Threshold (%)</label>
              <input 
                type="number" 
                min="50" max="99"
                value={formThreshold} 
                onChange={e => setFormThreshold(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Reference Photo Image URL</label>
              <input 
                type="text" 
                placeholder="Unsplash URL or leave empty for default placeholder" 
                value={formImageUrl} 
                onChange={e => setFormImageUrl(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white font-mono text-[10px]"
              />
            </div>

            {/* Quick Presets row */}
            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Or Select Preset Photo:</label>
              <div className="flex gap-1.5">
                {PRESET_DEMO_FACES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormImageUrl(preset.url);
                      if (!formName) setFormName(preset.name);
                    }}
                    className="p-1 bg-brand-bg hover:bg-slate-800 border border-slate-800 rounded text-[9px] truncate max-w-[80px]"
                    title={preset.name}
                  >
                    {preset.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Case Dossier Notes</label>
              <textarea 
                rows={2}
                placeholder="Factual context surrounding this suspect or missing search target..." 
                value={formNotes} 
                onChange={e => setFormNotes(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-1.5">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-bold text-xs uppercase tracking-wider"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="p-3 bg-brand-card border border-slate-800 rounded flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search targets by name, case ID, or notes..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-brand-bg border border-slate-850 rounded text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select 
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="flex-1 md:flex-initial px-2.5 py-1.5 bg-brand-bg border border-slate-850 rounded text-xs text-slate-300 font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="Fugitive">Fugitives Only</option>
            <option value="Missing Person">Missing Persons</option>
            <option value="Active Arrest Warrant">Active Arrest Warrants</option>
            <option value="Urgent Locate">Urgent Locates</option>
          </select>

          {/* Risk Priority filter */}
          <select 
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="flex-1 md:flex-initial px-2.5 py-1.5 bg-brand-bg border border-slate-850 rounded text-xs text-slate-300 font-mono"
          >
            <option value="All">All Priorities</option>
            <option value="High">🔴 High Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="Low">⚪ Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5" id="watchlist-grid">
        {filteredList.map((person) => {
          const isHigh = person.risk_priority === 'High';
          const isMed = person.risk_priority === 'Medium';

          return (
            <div 
              key={person.watchlist_id}
              id={`face-card-${person.watchlist_id}`}
              onClick={() => setSelectedPerson(person)}
              className="bg-brand-card border border-slate-800 hover:border-slate-750 rounded overflow-hidden cursor-pointer group flex flex-col justify-between transition shadow-md hover:-translate-y-0.5"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-brand-bg">
                  <img 
                    src={person.reference_face_image} 
                    alt={person.candidate_name} 
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase text-white shadow-md ${
                      person.status_type === 'Fugitive' ? 'bg-red-600' :
                      person.status_type === 'Active Arrest Warrant' ? 'bg-amber-600' :
                      person.status_type === 'Missing Person' ? 'bg-sky-600' : 'bg-emerald-600'
                    }`}>
                      {person.status_type}
                    </span>
                    <span className={`px-1 py-0.5 rounded-sm text-[7px] font-mono font-bold uppercase text-white ${
                      isHigh ? 'bg-rose-500/80' : 
                      isMed ? 'bg-amber-500/80' : 'bg-slate-500/80'
                    }`}>
                      {person.risk_priority} Risk
                    </span>
                  </div>

                  {/* ID overlay bottom */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent p-3 pt-5">
                    <div className="text-[9px] font-mono text-cyan-400 font-bold">{person.watchlist_id}</div>
                    <h4 className="text-xs font-sans font-black uppercase text-white leading-tight group-hover:text-cyan-300 transition">
                      {person.candidate_name}
                    </h4>
                  </div>
                </div>

                <div className="p-3 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age / Gender:</span>
                    <span className="text-slate-200 font-medium">{person.age_range} • {person.gender}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-slate-500">Last Spotted:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[120px]">{person.last_seen_location}</span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 border-t border-slate-800/60 bg-brand-bg/25 flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-500">Match Ref: {person.alert_threshold}%</span>
                <span className="text-[9px] font-mono uppercase text-cyan-400 group-hover:underline flex items-center gap-0.5">
                  Dossier
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="col-span-full text-center py-12 bg-brand-card border border-slate-800 rounded text-slate-500 text-xs font-mono">
            No matching synthetic target records found in current query filters.
          </div>
        )}
      </div>

      {/* Side Over Detail Drawer / Modal Overlay */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end transition-opacity" id="watchlist-drawer-overlay">
          <div className="w-full max-w-lg bg-brand-card border-l border-slate-800 h-full overflow-y-auto flex flex-col justify-between shadow-2xl p-5" id="watchlist-drawer-content">
            
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">{selectedPerson.watchlist_id}</span>
                  <h3 className="text-sm font-sans font-black uppercase text-white mt-0.5">{selectedPerson.candidate_name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid with Image & Quick Properties */}
              <div className="grid grid-cols-5 gap-3.5">
                <div className="col-span-2">
                  <img 
                    src={selectedPerson.reference_face_image} 
                    alt={selectedPerson.candidate_name} 
                    className="w-full h-auto aspect-square object-cover rounded border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[9px] text-slate-500 text-center block mt-1 font-mono uppercase font-bold">Biometric Template</span>
                </div>
                <div className="col-span-3 space-y-2 text-xs">
                  <div className="p-2 bg-brand-bg/70 border border-slate-800 rounded">
                    <span className="text-[9px] text-slate-500 block font-mono uppercase font-bold">Case Status</span>
                    <span className={`text-xs font-black uppercase ${
                      selectedPerson.status_type === 'Fugitive' ? 'text-red-400' :
                      selectedPerson.status_type === 'Active Arrest Warrant' ? 'text-amber-400' :
                      selectedPerson.status_type === 'Missing Person' ? 'text-sky-400' : 'text-emerald-400'
                    }`}>
                      {selectedPerson.status_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-brand-bg/40 border border-slate-850 rounded">
                      <span className="text-[9px] text-slate-500 block font-mono uppercase font-bold">Age Range</span>
                      <span className="text-xs text-white font-medium">{selectedPerson.age_range}</span>
                    </div>
                    <div className="p-2 bg-brand-bg/40 border border-slate-850 rounded">
                      <span className="text-[9px] text-slate-500 block font-mono uppercase font-bold">Gender</span>
                      <span className="text-xs text-white font-medium uppercase">{selectedPerson.gender}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-brand-bg/40 border border-slate-850 rounded flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-slate-500 block font-mono uppercase font-bold">Alert Threshold</span>
                      <span className="text-xs text-white font-medium font-mono">{selectedPerson.alert_threshold}% match</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-2 py-1 rounded">Active</span>
                  </div>
                </div>
              </div>

              {/* Location Spotting Parameters */}
              <div className="space-y-2 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">Spotted Coordinates (Last Registered)</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/40 rounded-lg flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-500 block">Location spotted</span>
                      <span className="text-xs text-slate-200 font-semibold truncate block">{selectedPerson.last_seen_location}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-lg flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-500 block">Date flagged</span>
                      <span className="text-xs text-slate-200 font-semibold">{selectedPerson.last_seen_date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">Case Dossier Notes</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                  {selectedPerson.notes}
                </p>
              </div>

              {/* Related Alerts list */}
              <div className="space-y-2 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">
                  Simulated Capture Incidents ({relatedAlerts.length})
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {relatedAlerts.map(alert => (
                    <div 
                      key={alert.alert_id}
                      onClick={() => {
                        setSelectedPerson(null);
                        onNavigate('Police Review Panel', alert.alert_id);
                      }}
                      className="p-2 bg-slate-900/70 hover:bg-slate-900 rounded border border-slate-800 flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <div className="text-[11px]">
                          <span className="font-semibold text-white block">{alert.alert_id} • {alert.spotted_location}</span>
                          <span className="text-[10px] text-slate-500">Match score: {alert.similarity_score_or_plate_confidence}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                  {relatedAlerts.length === 0 && (
                    <div className="text-center py-4 bg-slate-900/20 text-slate-600 text-[11px] rounded">
                      No matching radar captures recorded in current simulated run.
                    </div>
                  )}
                </div>
              </div>
            {/* Footer actions inside drawer */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-6">
              {sessionRole === 'Admin' ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this synthetic watchlist record? This cannot be undone.")) {
                      onDeleteRecord(selectedPerson.watchlist_id);
                      setSelectedPerson(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white rounded text-xs flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge Record
                </button>
              ) : (
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 bg-slate-900/40 px-2 py-1 rounded border border-slate-850">
                  🔒 Operations Restricted (Admin clearance required)
                </div>
              )}

              <button
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Close Dossier
              </button>
            </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
