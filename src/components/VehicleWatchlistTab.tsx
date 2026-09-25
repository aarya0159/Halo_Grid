import React, { useState } from 'react';
import { 
  Search, Car, Plus, AlertTriangle, MapPin, Calendar, 
  ChevronRight, X, ShieldAlert, CheckCircle, Trash2
} from 'lucide-react';
import { VehicleWatchlistRecord, VehicleStatusType } from '../types';

interface VehicleWatchlistTabProps {
  vehicleWatchlist: VehicleWatchlistRecord[];
  onAddRecord: (record: VehicleWatchlistRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigate: (tab: string, arg?: any) => void;
  alerts: any[];
  sessionRole?: string;
}

export default function VehicleWatchlistTab({
  vehicleWatchlist,
  onAddRecord,
  onDeleteRecord,
  onNavigate,
  alerts,
  sessionRole = 'Operator'
}: VehicleWatchlistTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWatchlistRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for adding custom vehicle
  const [formPlate, setFormPlate] = useState('');
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formYear, setFormYear] = useState(2022);
  const [formStatus, setFormStatus] = useState<VehicleStatusType>('Stolen Vehicle');
  const [formRisk, setFormRisk] = useState<'Low' | 'Medium' | 'High'>('High');
  const [formLocation, setFormLocation] = useState('Orchard Road Crossing');
  const [formDate, setFormDate] = useState('2026-06-24');
  const [formNotes, setFormNotes] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Preset demo vehicle templates
  const PRESET_VEHICLES = [
    { label: "Black Sedan", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop", make: "Porsche", model: "911 Carrera", color: "Black" },
    { label: "Red Sports Car", url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop", make: "Ferrari", model: "488 GTB", color: "Red" },
    { label: "White Sedan", url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop", make: "Honda", model: "Civic Sedan", color: "White" },
    { label: "Silver SUV", url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop", make: "Hyundai", model: "Santa Fe", color: "Silver" }
  ];

  // Filtering
  const filteredList = vehicleWatchlist.filter(veh => {
    const matchesSearch = veh.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          veh.vehicle_make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          veh.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          veh.vehicle_watchlist_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          veh.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          veh.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || veh.vehicle_status_type === selectedStatus;
    const matchesRisk = selectedRisk === 'All' || veh.risk_priority === selectedRisk;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate || !formMake) return;

    // Normalize plate
    const formattedPlate = formPlate.trim().toUpperCase();

    const newRecord: VehicleWatchlistRecord = {
      vehicle_watchlist_id: `WV-2026-0${vehicleWatchlist.length + 1}`,
      plate_number: formattedPlate,
      vehicle_make: formMake,
      vehicle_model: formModel || "Custom Model",
      vehicle_color: formColor || "Unknown Color",
      vehicle_year: Number(formYear),
      case_id: `CASE-VEH-${Math.floor(100 + Math.random() * 900)}`,
      vehicle_status_type: formStatus,
      reference_vehicle_image: formImageUrl || "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=400&h=300&fit=crop",
      reported_last_seen_location: formLocation,
      reported_last_seen_date: formDate,
      risk_priority: formRisk,
      notes: formNotes || "Custom synthetic vehicle registered for ANPR scenario simulation."
    };

    onAddRecord(newRecord);
    setIsAdding(false);
    // Reset Form
    setFormPlate('');
    setFormMake('');
    setFormModel('');
    setFormColor('');
    setFormNotes('');
    setFormImageUrl('');
  };

  // Get alerts associated with the selected vehicle
  const relatedAlerts = selectedVehicle 
    ? alerts.filter(a => a.matched_entity_name === selectedVehicle.plate_number)
    : [];

  return (
    <div className="space-y-4" id="vehicle-watchlist-container">
      {/* Tab Header with Counter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            Automatic Number Plate (ANPR) Watchlist
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            Active suspect license plates. Scans compute matches against stolen, missing, or getaway registers.
          </p>
        </div>
        {sessionRole === 'Admin' ? (
          <button
            id="add-vehicle-target-btn"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 shadow-md shadow-cyan-900/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Vehicle / Plate
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded flex items-center gap-1.5 text-[9px] font-mono text-slate-500 font-bold uppercase">
            🔒 ANPR Watchlist Locked (Read-Only)
          </div>
        )}
      </div>

      {/* Add Custom Record Panel */}
      {isAdding && (
        <div className="p-4 bg-brand-card border border-cyan-500/20 rounded space-y-3 shadow-xl" id="add-vehicle-form-panel">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <h3 className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">
              Inject Custom Vehicle watchlist Record
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">License Plate String (e.g. SLS1234A)</label>
              <input 
                type="text" 
                placeholder="Plate string (caps preferred)" 
                value={formPlate} 
                onChange={e => setFormPlate(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white font-mono uppercase tracking-wider font-bold text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Watchlist Category</label>
              <select 
                value={formStatus} 
                onChange={e => setFormStatus(e.target.value as VehicleStatusType)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              >
                <option value="Stolen Vehicle">Stolen Vehicle</option>
                <option value="Missing Vehicle">Missing Vehicle</option>
                <option value="Wanted Vehicle">Wanted Vehicle</option>
                <option value="Vehicle of Interest">Vehicle of Interest</option>
                <option value="Suspected Getaway Vehicle">Suspected Getaway Vehicle</option>
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
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Vehicle Make / Model</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Porsche" 
                  value={formMake} 
                  onChange={e => setFormMake(e.target.value)}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                  required
                />
                <input 
                  type="text" 
                  placeholder="e.g. 911 Carrera" 
                  value={formModel} 
                  onChange={e => setFormModel(e.target.value)}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Color / Year</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Black" 
                  value={formColor} 
                  onChange={e => setFormColor(e.target.value)}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
                />
                <input 
                  type="number" 
                  value={formYear} 
                  onChange={e => setFormYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Last Reported Location</label>
              <input 
                type="text" 
                placeholder="e.g. Orchard Road Crossing" 
                value={formLocation} 
                onChange={e => setFormLocation(e.target.value)}
                className="w-full px-2.5 py-1 bg-brand-bg border border-slate-800 rounded text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Vehicle Photo Image URL</label>
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
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Or Select Photo Preset:</label>
              <div className="flex gap-1.5">
                {PRESET_VEHICLES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormImageUrl(preset.url);
                      setFormMake(preset.make);
                      setFormModel(preset.model);
                      setFormColor(preset.color);
                    }}
                    className="p-1 bg-brand-bg hover:bg-slate-800 border border-slate-800 rounded text-[9px] truncate max-w-[80px]"
                    title={preset.label}
                  >
                    {preset.color}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-bold font-mono text-[9px] uppercase block text-slate-500">Case Incident Dossier</label>
              <textarea 
                rows={2}
                placeholder="Factual incident detail logs surrounding this wanted vehicle case..." 
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
                className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-bold text-xs uppercase tracking-wider"
              >
                Save Vehicle
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
            placeholder="Search plates, vehicle make, models, case codes..." 
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
            <option value="All">All Categories</option>
            <option value="Stolen Vehicle">Stolen Vehicles</option>
            <option value="Wanted Vehicle">Wanted Vehicles</option>
            <option value="Suspected Getaway Vehicle">Getaway Vehicles</option>
            <option value="Vehicle of Interest">Vehicles of Interest</option>
            <option value="Missing Vehicle">Missing Vehicles</option>
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

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5" id="vehicle-watchlist-grid-records">
        {filteredList.map((veh) => {
          const isHigh = veh.risk_priority === 'High';
          const isMed = veh.risk_priority === 'Medium';

          return (
            <div 
              key={veh.vehicle_watchlist_id}
              id={`vehicle-card-${veh.vehicle_watchlist_id}`}
              onClick={() => setSelectedVehicle(veh)}
              className="bg-brand-card border border-slate-800 hover:border-slate-750 rounded overflow-hidden cursor-pointer group flex flex-col justify-between transition shadow-md hover:-translate-y-0.5"
            >
              <div>
                <div className="relative aspect-video overflow-hidden bg-brand-bg">
                  <img 
                    src={veh.reference_vehicle_image} 
                    alt={veh.plate_number} 
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
                    <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase text-white shadow-md ${
                      veh.vehicle_status_type === 'Stolen Vehicle' ? 'bg-red-600' :
                      veh.vehicle_status_type === 'Wanted Vehicle' ? 'bg-orange-600' :
                      veh.vehicle_status_type === 'Suspected Getaway Vehicle' ? 'bg-rose-700' :
                      veh.vehicle_status_type === 'Vehicle of Interest' ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>
                      {veh.vehicle_status_type}
                    </span>
                    <span className={`px-1 py-0.5 rounded-sm text-[7px] font-mono font-bold uppercase text-white ${
                      isHigh ? 'bg-rose-500/80' : 
                      isMed ? 'bg-amber-500/80' : 'bg-slate-500/80'
                    }`}>
                      {veh.risk_priority} Risk
                    </span>
                  </div>

                  {/* Plate label overlay bottom */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent p-3 pt-5">
                    <span className="inline-block px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-mono font-black rounded border border-slate-900 shadow-sm tracking-wider">
                      {veh.plate_number}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-1 text-[11px] text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Make & Model:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[130px]">{veh.vehicle_make} {veh.vehicle_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Color / Year:</span>
                    <span className="text-slate-200 font-medium">{veh.vehicle_color} • {veh.vehicle_year}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-slate-500">Last Spotted:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[130px]">{veh.reported_last_seen_location}</span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 border-t border-slate-800/60 bg-brand-bg/25 flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-500">{veh.vehicle_watchlist_id}</span>
                <span className="text-[9px] font-mono uppercase text-cyan-400 group-hover:underline flex items-center gap-0.5">
                  Inspect
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="col-span-full text-center py-12 bg-brand-card border border-slate-800 rounded text-slate-500 text-xs font-mono">
            No matching synthetic vehicle targets found.
          </div>
        )}
      </div>

      {/* Detail Drawer for Selected Vehicle */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end transition-opacity" id="vehicle-drawer-overlay">
          <div className="w-full max-w-lg bg-brand-card border-l border-slate-800 h-full overflow-y-auto flex flex-col justify-between shadow-2xl p-5" id="vehicle-drawer-content">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">{selectedVehicle.vehicle_watchlist_id}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-sm font-sans font-black uppercase text-white">{selectedVehicle.vehicle_make} {selectedVehicle.vehicle_model}</h3>
                    <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-mono font-black rounded border border-slate-950 shadow-xs uppercase tracking-wider">
                      {selectedVehicle.plate_number}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid with Image & Quick Properties */}
              <div className="grid grid-cols-5 gap-3.5">
                <div className="col-span-2">
                  <img 
                    src={selectedVehicle.reference_vehicle_image} 
                    alt={selectedVehicle.plate_number} 
                    className="w-full h-auto aspect-video object-cover rounded border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-slate-500 text-center block mt-1 font-mono">Reference Vehicle profile</span>
                </div>
                <div className="col-span-3 space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-500 block font-mono">Incident Flag Category</span>
                    <span className={`text-xs font-bold ${
                      selectedVehicle.vehicle_status_type === 'Stolen Vehicle' ? 'text-red-400' :
                      selectedVehicle.vehicle_status_type === 'Wanted Vehicle' ? 'text-orange-400' :
                      selectedVehicle.vehicle_status_type === 'Suspected Getaway Vehicle' ? 'text-rose-400' : 'text-cyan-400'
                    }`}>
                      {selectedVehicle.vehicle_status_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-900/40 rounded-lg">
                      <span className="text-[10px] text-slate-500 block font-mono">Color Space</span>
                      <span className="text-xs text-white font-medium">{selectedVehicle.vehicle_color}</span>
                    </div>
                    <div className="p-2 bg-slate-900/40 rounded-lg">
                      <span className="text-[10px] text-slate-500 block font-mono">Model Year</span>
                      <span className="text-xs text-white font-medium">{selectedVehicle.vehicle_year}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/40 rounded-lg">
                    <span className="text-[10px] text-slate-500 block font-mono">Assigned File Case ID</span>
                    <span className="text-xs text-slate-300 font-semibold font-mono">{selectedVehicle.case_id}</span>
                  </div>
                </div>
              </div>

              {/* Last Spotted */}
              <div className="space-y-2 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">ANPR Intercept Points</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/40 rounded-lg flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-500 block">Reported Last Seen</span>
                      <span className="text-xs text-slate-200 font-semibold truncate block">{selectedVehicle.reported_last_seen_location}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-lg flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-500 block">Reported Date</span>
                      <span className="text-xs text-slate-200 font-semibold">{selectedVehicle.reported_last_seen_date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">Case Briefing Notes</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                  {selectedVehicle.notes}
                </p>
              </div>

              {/* Related Alerts */}
              <div className="space-y-2 border-t border-slate-900 pt-4 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider font-bold">
                  Simulated Plate Captures ({relatedAlerts.length})
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {relatedAlerts.map(alert => (
                    <div 
                      key={alert.alert_id}
                      onClick={() => {
                        setSelectedVehicle(null);
                        onNavigate('Police Review Panel', alert.alert_id);
                      }}
                      className="p-2 bg-slate-900/70 hover:bg-slate-900 rounded border border-slate-800 flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                        <div className="text-[11px]">
                          <span className="font-semibold text-white block">{alert.alert_id} • {alert.spotted_location}</span>
                          <span className="text-[10px] text-slate-500">OCR Confidence: {alert.similarity_score_or_plate_confidence}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                  {relatedAlerts.length === 0 && (
                    <div className="text-center py-4 bg-slate-900/20 text-slate-600 text-[11px] rounded">
                      No matching road radar captures recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-6">
              {sessionRole === 'Admin' ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this synthetic vehicle record?")) {
                      onDeleteRecord(selectedVehicle.vehicle_watchlist_id);
                      setSelectedVehicle(null);
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
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
