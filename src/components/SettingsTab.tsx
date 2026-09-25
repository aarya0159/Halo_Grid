import React from 'react';
import { Settings, Shield, Sliders, ToggleLeft, Activity, Info } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsTabProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  faceCount: number;
  vehicleCount: number;
}

export default function SettingsTab({
  settings,
  onUpdateSettings,
  faceCount,
  vehicleCount
}: SettingsTabProps) {

  const handleSliderChange = (key: keyof SystemSettings, value: number) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const handleToggleChange = (key: keyof SystemSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto" id="settings-tab-container">
      {/* Settings Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          System Calibration Controls
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Calibrate optical quality gates, face-matching comparison models, and ANPR plate parsing tolerances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-grid">
        
        {/* FACE PIPELINE GATEWAYS */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-3">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            Biometric Face Gateways
          </h3>

          {/* Slider 1: Similarity Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Alert Similarity threshold:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.faceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="50" max="95" step="1"
              value={settings.faceThreshold}
              onChange={e => handleSliderChange('faceThreshold', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Minimum face matching score against database template to generate a warning dispatch alert (default 75%).
            </p>
          </div>

          {/* Slider 2: Quality threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Minimum Face Crop Quality:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.faceQualityMin}%</span>
            </div>
            <input 
              type="range" 
              min="40" max="90" step="1"
              value={settings.faceQualityMin}
              onChange={e => handleSliderChange('faceQualityMin', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Minimum crop quality index (lighting, framing, alignment) required before matching attempt (default 65%).
            </p>
          </div>

          {/* Slider 3: Blur maximum tolerance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Maximum Blur Tolerance:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.faceBlurMax}%</span>
            </div>
            <input 
              type="range" 
              min="20" max="60" step="1"
              value={settings.faceBlurMax}
              onChange={e => handleSliderChange('faceBlurMax', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Cap on image blur quotient. Crops exceeding this are rejected for recognition safety (default 40%).
            </p>
          </div>
        </div>

        {/* VEHICLE ANPR / OCR GATEWAYS */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-3">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-500" />
            Automatic Plate Recognition (ANPR)
          </h3>

          {/* Slider 4: Plate Quality threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Minimum Plate Resolution Quality:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.plateQualityMin}%</span>
            </div>
            <input 
              type="range" 
              min="40" max="90" step="1"
              value={settings.plateQualityMin}
              onChange={e => handleSliderChange('plateQualityMin', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Requires a clear enough visual crop of the physical license plate bounding box to run matches (default 65%).
            </p>
          </div>

          {/* Slider 5: Plate OCR Confidence */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Minimum OCR Confidence Gate:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.plateConfidenceMin}%</span>
            </div>
            <input 
              type="range" 
              min="50" max="90" step="1"
              value={settings.plateConfidenceMin}
              onChange={e => handleSliderChange('plateConfidenceMin', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Optical character extraction algorithm's self-reported certainty minimum (default 70%).
            </p>
          </div>

          {/* Slider 6: Vehicle blur tolerance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-white">Maximum Plate Blur Tolerance:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{settings.plateBlurMax}%</span>
            </div>
            <input 
              type="range" 
              min="20" max="60" step="1"
              value={settings.plateBlurMax}
              onChange={e => handleSliderChange('plateBlurMax', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-500">
              Maximum allowable blur on vehicle cameras for reliable ANPR scans.
            </p>
          </div>
        </div>

        {/* LOGGING & SEED DATABASE INFORMATION */}
        <div className="p-3 bg-brand-card border border-slate-850 rounded space-y-3 md:col-span-2">
          <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Simulator Logs & Seed Database
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            {/* Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-brand-bg/40 border border-slate-850 rounded">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block font-mono text-[11px]">Log Below-Threshold Matches</span>
                  <p className="text-[10px] text-slate-500 font-mono">Store scanning attempts that did not meet match limits</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('logBelowThreshold')}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 cursor-pointer ${
                    settings.logBelowThreshold ? 'bg-cyan-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-brand-bg/40 border border-slate-850 rounded">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block font-mono text-[11px]">Include Dismissed in Analytics</span>
                  <p className="text-[10px] text-slate-500 font-mono">Allow false-alarm metrics to be processed in trend charts</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChange('keepDismissedInAnalytics')}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 cursor-pointer ${
                    settings.keepDismissedInAnalytics ? 'bg-cyan-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
                </button>
              </div>
            </div>

            {/* Read-Only Stats */}
            <div className="p-3 bg-brand-bg/40 border border-slate-850 rounded space-y-2">
              <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-black">Simulator Seeding Report</h4>
              
              <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between border-b border-slate-900/60 pb-1">
                  <span>Face watchlist registers:</span>
                  <span className="text-white font-bold">{faceCount} subjects</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/60 pb-1">
                  <span>Vehicle plates registers:</span>
                  <span className="text-white font-bold">{vehicleCount} plates</span>
                </div>
                <div className="flex justify-between">
                  <span>Simulator Sandbox Scope:</span>
                  <span className="text-cyan-400 font-bold uppercase">Public Safety MVP</span>
                </div>
              </div>

              <div className="mt-2 p-2 bg-indigo-950/25 border border-indigo-900/40 rounded text-[10px] flex gap-1.5 text-slate-400">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                These parameters are persisted instantly in the local prototype sandbox. No remote databases are impacted.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
