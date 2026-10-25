import React, { useState } from 'react';
import {
  Rocket,
  Globe,
  Sliders,
  Flame,
  RotateCw,
  TrendingUp,
  Compass,
  Eye,
  RefreshCw,
  Zap,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BODIES, PRESETS } from '../physics/constants';
import { calculateHohmannTransfer } from '../physics/orbitalMath';

export default function ControlPanel({
  activePresetId,
  onSelectPreset,
  centralBodyConfig,
  onUpdateCentralBody,
  craftState,
  onApplyBurn,
  onCircularize,
  showVectors,
  setShowVectors,
  showConicPath,
  setShowConicPath,
  showHistoricalTrail,
  setShowHistoricalTrail,
  showDistanceRings,
  setShowDistanceRings,
  showKeplerSectors,
  setShowKeplerSectors,
  onCaptureKeplerSector,
  onResetSimulation,
  isSandboxMode,
  setIsSandboxMode
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'thrusters' | 'body' | 'display'
  const [deltaVMagnitude, setDeltaVMagnitude] = useState(0.5); // km/s
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If on Hohmann Transfer preset, compute required burns
  const hohmannData = activePresetId === 'hohmann_transfer' && craftState
    ? calculateHohmannTransfer(7.0, 42.164, centralBodyConfig.mu)
    : null;

  return (
    <div className={`control-panel-container glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Handle */}
      <button
        className="collapse-handle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Control Panel" : "Collapse Control Panel"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {!isCollapsed && (
        <div className="panel-inner-content">
          {/* Logo / Header */}
          <div className="panel-brand">
            <div className="brand-logo-glow">
              <Rocket size={22} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="brand-title">ORBITX</h1>
              <p className="brand-tagline">Orbital Mechanics Physics Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="panel-tabs">
            <button
              className={`panel-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              <Target size={15} />
              <span>Presets</span>
            </button>
            <button
              className={`panel-tab-btn ${activeTab === 'thrusters' ? 'active' : ''}`}
              onClick={() => setActiveTab('thrusters')}
            >
              <Flame size={15} />
              <span>Thrusters</span>
            </button>
            <button
              className={`panel-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              <Globe size={15} />
              <span>Planet</span>
            </button>
            <button
              className={`panel-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
              onClick={() => setActiveTab('display')}
            >
              <Eye size={15} />
              <span>Layers</span>
            </button>
          </div>

          {/* Tab 1: Presets & Learning Scenarios */}
          {activeTab === 'presets' && (
            <div className="panel-tab-body">
              <div className="tab-section-title">
                <span>Mission Scenarios</span>
                <span className="text-xs text-slate-400">{PRESETS.length} available</span>
              </div>

              <div className="presets-list">
                {PRESETS.map((p) => (
                  <div
                    key={p.id}
                    className={`preset-card ${activePresetId === p.id && !isSandboxMode ? 'active' : ''}`}
                    onClick={() => {
                      setIsSandboxMode(false);
                      onSelectPreset(p.id);
                    }}
                  >
                    <div className="preset-card-header">
                      <span className="preset-name">{p.name}</span>
                      <span className="preset-category-tag">{p.category}</span>
                    </div>
                    <p className="preset-description">{p.description}</p>
                    <div className="preset-tags">
                      {p.tags.map((t, i) => (
                        <span key={i} className="mini-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Custom Sandbox Card */}
                <div
                  className={`preset-card sandbox-card ${isSandboxMode ? 'active' : ''}`}
                  onClick={() => setIsSandboxMode(true)}
                >
                  <div className="preset-card-header">
                    <span className="preset-name flex items-center gap-1.5 text-cyan-400">
                      <Sparkles size={14} /> Custom Sandbox
                    </span>
                    <span className="preset-category-tag bg-cyan-950 text-cyan-300">Freeform</span>
                  </div>
                  <p className="preset-description">
                    Free orbital laboratory. Click & drag anywhere in space or adjust values freely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Spacecraft Thruster Maneuver Deck */}
          {activeTab === 'thrusters' && (
            <div className="panel-tab-body">
              <div className="tab-section-title">
                <span>Orbital Maneuver Console</span>
              </div>

              {/* Impulse Magnitude Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Burn Impulse (Δv)</span>
                  <span className="font-mono text-cyan-400 font-bold">{deltaVMagnitude.toFixed(2)} km/s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={deltaVMagnitude}
                  onChange={(e) => setDeltaVMagnitude(parseFloat(e.target.value))}
                  className="orbit-range-slider"
                />
              </div>

              {/* Primary Directional Thruster D-Pad */}
              <div className="thruster-dpad-grid">
                <button
                  className="thruster-action-btn prograde"
                  onClick={() => onApplyBurn('prograde', deltaVMagnitude)}
                  title="Accelerate along orbital direction (raises opposite side of orbit)"
                >
                  <TrendingUp size={16} />
                  <span>Prograde (+Δv)</span>
                </button>

                <button
                  className="thruster-action-btn retrograde"
                  onClick={() => onApplyBurn('retrograde', deltaVMagnitude)}
                  title="Decelerate opposite to orbital motion (lowers opposite side of orbit)"
                >
                  <TrendingUp size={16} className="rotate-180" />
                  <span>Retrograde (-Δv)</span>
                </button>

                <button
                  className="thruster-action-btn radial-out"
                  onClick={() => onApplyBurn('radial_out', deltaVMagnitude)}
                  title="Thrust outward away from the planet center"
                >
                  <Compass size={16} />
                  <span>Radial Out</span>
                </button>

                <button
                  className="thruster-action-btn radial-in"
                  onClick={() => onApplyBurn('radial_in', deltaVMagnitude)}
                  title="Thrust inward towards the planet center"
                >
                  <Compass size={16} className="rotate-180" />
                  <span>Radial In</span>
                </button>
              </div>

              {/* Smart Automated Maneuvers */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Guidance Computer
                </div>
                <button
                  className="automated-maneuver-btn"
                  onClick={onCircularize}
                >
                  <RotateCw size={15} />
                  <span>Instant Circularization Burn</span>
                </button>
              </div>

              {/* Special Hohmann Transfer Burn Assistance */}
              {hohmannData && (
                <div className="hohmann-assistant-box">
                  <div className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Sparkles size={14} /> Hohmann Transfer Planner
                  </div>
                  <div className="text-[11px] text-slate-300 mb-2">
                    LEO (300 km) ➔ GEO (35,786 km)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-400">Burn 1 (LEO)</div>
                      <div className="text-emerald-400 font-bold">+{hohmannData.deltaV1.toFixed(2)} km/s</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-400">Burn 2 (GEO)</div>
                      <div className="text-cyan-400 font-bold">+{hohmannData.deltaV2.toFixed(2)} km/s</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-accent-sm flex-1"
                      onClick={() => onApplyBurn('prograde', hohmannData.deltaV1)}
                    >
                      Execute Burn 1
                    </button>
                    <button
                      className="btn-accent-sm flex-1 bg-cyan-700 hover:bg-cyan-600"
                      onClick={() => onApplyBurn('prograde', hohmannData.deltaV2)}
                    >
                      Execute Burn 2
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Central Planet Parameters */}
          {activeTab === 'body' && (
            <div className="panel-tab-body">
              <div className="tab-section-title">
                <span>Central Attractor Configuration</span>
              </div>

              {/* Celestial Body Switcher */}
              <div className="body-select-grid">
                {Object.values(BODIES).map((b) => (
                  <button
                    key={b.id}
                    className={`body-select-btn ${centralBodyConfig.id === b.id ? 'active' : ''}`}
                    onClick={() => onUpdateCentralBody(b)}
                  >
                    <span className="body-color-dot" style={{ backgroundColor: b.color }} />
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>

              {/* Mass Slider */}
              <div className="control-slider-group mt-3">
                <div className="slider-label-row">
                  <span>Mass (M)</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {centralBodyConfig.mass.toFixed(1)} × 10²² kg
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={centralBodyConfig.mass}
                  onChange={(e) =>
                    onUpdateCentralBody({
                      ...centralBodyConfig,
                      mass: parseFloat(e.target.value),
                      mu: (parseFloat(e.target.value) / 597.2) * 398.6
                    })
                  }
                  className="orbit-range-slider"
                />
              </div>

              {/* Radius Slider */}
              <div className="control-slider-group">
                <div className="slider-label-row">
                  <span>Physical Radius (R)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(centralBodyConfig.radius * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} km
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step="0.2"
                  value={centralBodyConfig.radius}
                  onChange={(e) =>
                    onUpdateCentralBody({
                      ...centralBodyConfig,
                      radius: parseFloat(e.target.value)
                    })
                  }
                  className="orbit-range-slider"
                />
              </div>

              <div className="body-info-note">
                <strong>Physics Insight:</strong> Increasing planetary mass deepens the gravitational potential well, requiring higher orbital and escape speeds.
              </div>
            </div>
          )}

          {/* Tab 4: Display & Visual Layers */}
          {activeTab === 'display' && (
            <div className="panel-tab-body">
              <div className="tab-section-title">
                <span>Visual Layers & Overlays</span>
              </div>

              <div className="toggle-list">
                <label className="toggle-item">
                  <span>Velocity & Gravity Vectors</span>
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="orbit-checkbox"
                  />
                </label>

                <label className="toggle-item">
                  <span>Conic Orbit Trajectory Preview</span>
                  <input
                    type="checkbox"
                    checked={showConicPath}
                    onChange={(e) => setShowConicPath(e.target.checked)}
                    className="orbit-checkbox"
                  />
                </label>

                <label className="toggle-item">
                  <span>Historical Ribbon Trail</span>
                  <input
                    type="checkbox"
                    checked={showHistoricalTrail}
                    onChange={(e) => setShowHistoricalTrail(e.target.checked)}
                    className="orbit-checkbox"
                  />
                </label>

                <label className="toggle-item">
                  <span>Altitude & GEO Distance Rings</span>
                  <input
                    type="checkbox"
                    checked={showDistanceRings}
                    onChange={(e) => setShowDistanceRings(e.target.checked)}
                    className="orbit-checkbox"
                  />
                </label>

                <label className="toggle-item">
                  <span>Kepler's 2nd Law Area Sweeps</span>
                  <input
                    type="checkbox"
                    checked={showKeplerSectors}
                    onChange={(e) => setShowKeplerSectors(e.target.checked)}
                    className="orbit-checkbox"
                  />
                </label>
              </div>

              {showKeplerSectors && (
                <div className="mt-3 p-3 bg-slate-900/80 rounded border border-cyan-800/40">
                  <div className="text-xs text-cyan-300 font-semibold mb-2">Kepler's 2nd Law Experiment</div>
                  <button
                    className="btn-accent-sm w-full"
                    onClick={onCaptureKeplerSector}
                  >
                    Capture Equal-Time Sweep Sector
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Click periodically around the orbit to capture wedges. Notice that the spacecraft moves faster at periapsis, creating wider, shorter wedges of equal area!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
