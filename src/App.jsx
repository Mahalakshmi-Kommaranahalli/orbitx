import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sliders,
  Activity,
  Zap,
  BookOpen,
  Trophy,
  HelpCircle,
  X,
  Camera,
  Flame,
  RotateCw
} from 'lucide-react';
import OrbitCanvas from './components/OrbitCanvas';
import ControlPanel from './components/ControlPanel';
import TelemetryHUD from './components/TelemetryHUD';
import EnergyGraph from './components/EnergyGraph';
import FormulaInspector from './components/FormulaInspector';
import TimeControls from './components/TimeControls';
import ChallengesModal from './components/ChallengesModal';
import QuickGuideModal from './components/QuickGuideModal';

import { BODIES, PRESETS } from './physics/constants';
import { calculateOrbitalElements } from './physics/orbitalMath';
import { stepRK4, applyImpulse } from './physics/integrator';

export default function App() {
  // Simulation Playback State
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeWarp, setTimeWarp] = useState(1);
  const [activePresetId, setActivePresetId] = useState('circular_leo');
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Celestial Configuration
  const [centralBodyConfig, setCentralBodyConfig] = useState(BODIES.earth);
  const [secondaryBodyState, setSecondaryBodyState] = useState(null);

  // Spacecraft Dynamic State
  const [craftState, setCraftState] = useState({
    pos: [7.0, 0, 0],
    vel: [0, 7.54, 0],
    mass: 1000, // kg
  });

  // Visual Overlays & Display Toggles
  const [showVectors, setShowVectors] = useState(true);
  const [showConicPath, setShowConicPath] = useState(true);
  const [showHistoricalTrail, setShowHistoricalTrail] = useState(true);
  const [showDistanceRings, setShowDistanceRings] = useState(true);
  const [showKeplerSectors, setShowKeplerSectors] = useState(false);
  const [keplerSectors, setKeplerSectors] = useState([]);
  const [cameraMode, setCameraMode] = useState('free'); // 'free' | 'top_down' | 'follow_craft'

  // Modals & Panels
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isThrusting, setIsThrusting] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(null); // null | 'controls' | 'telemetry' | 'energy' | 'formulas'
  const [lastBurnDeltaV, setLastBurnDeltaV] = useState(0);
  const [burnCount, setBurnCount] = useState(0);
  const [achievementToast, setAchievementToast] = useState(null);

  const handleAchievementUnlocked = (achievement) => {
    setAchievementToast(achievement);
    setTimeout(() => {
      setAchievementToast((curr) => (curr?.id === achievement.id ? null : curr));
    }, 4500);
  };

  // References for Animation & Physics Loop
  const simStateRef = useRef({
    craftPos: [7.0, 0, 0],
    craftVel: [0, 7.54, 0],
    craftMass: 1000,
    secBody: null,
    centralMu: 398.6,
    centralRadius: 6.371,
    time: 0,
    isPlaying: true,
    timeWarp: 1,
  });

  // Keep ref synchronized with state
  useEffect(() => {
    simStateRef.current.isPlaying = isPlaying;
    simStateRef.current.timeWarp = timeWarp;
    simStateRef.current.centralMu = centralBodyConfig.mu;
    simStateRef.current.centralRadius = centralBodyConfig.radius;
  }, [isPlaying, timeWarp, centralBodyConfig]);

  // Compute Telemetry from current craft state
  const telemetry = calculateOrbitalElements(
    craftState.pos,
    craftState.vel,
    centralBodyConfig.mu,
    centralBodyConfig.radius,
    craftState.mass
  );

  // Load Preset Configuration
  const handleSelectPreset = useCallback((presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    setCentralBodyConfig(BODIES[preset.bodyId] || BODIES.earth);

    // Initialize Craft
    const newPos = [...preset.craftPosition];
    const newVel = [...preset.craftVelocity];
    setCraftState({
      pos: newPos,
      vel: newVel,
      mass: 1000,
    });
    simStateRef.current.craftPos = [...newPos];
    simStateRef.current.craftVel = [...newVel];

    // Initialize Secondary Body (e.g. Moon/Jupiter in 3-body or slingshot presets)
    if (preset.secondaryBody) {
      const secData = {
        active: true,
        ...preset.secondaryBody,
        angle: 0,
        pos: [preset.secondaryBody.orbitRadius, 0, 0],
        vel: [0, preset.secondaryBody.orbitSpeed, 0],
        mu: (preset.secondaryBody.mass / 597.2) * 398.6,
      };
      setSecondaryBodyState(secData);
      simStateRef.current.secBody = secData;
    } else {
      setSecondaryBodyState(null);
      simStateRef.current.secBody = null;
    }

    setCollisionWarning(false);
    setKeplerSectors([]);
  }, []);

  // Initialize first preset on mount
  useEffect(() => {
    handleSelectPreset('circular_leo');
  }, [handleSelectPreset]);

  // Spacebar Play/Pause listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main High-Precision Physics Integration Loop (RK4 with sub-stepping)
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      animId = requestAnimationFrame(loop);

      const deltaTimeSeconds = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const sim = simStateRef.current;
      if (!sim.isPlaying) return;

      // Effective step scaled by time warp
      const totalDt = deltaTimeSeconds * sim.timeWarp * 0.85;

      // Sub-stepping for maximum RK4 stability (divide into smaller chunks)
      const subSteps = Math.max(1, Math.min(20, Math.ceil(sim.timeWarp * 1.5)));
      const dt = totalDt / subSteps;

      let pos = [...sim.craftPos];
      let vel = [...sim.craftVel];

      for (let s = 0; s < subSteps; s++) {
        // Build array of active gravitating bodies
        const bodies = [
          { pos: [0, 0, 0], mu: sim.centralMu }
        ];

        // Update secondary body position if active
        if (sim.secBody && sim.secBody.active) {
          const sec = sim.secBody;
          const omega = sec.orbitSpeed / sec.orbitRadius;
          sec.angle += omega * dt;
          sec.pos = [
            sec.orbitRadius * Math.cos(sec.angle),
            sec.orbitRadius * Math.sin(sec.angle),
            0
          ];
          sec.vel = [
            -sec.orbitSpeed * Math.sin(sec.angle),
            sec.orbitSpeed * Math.cos(sec.angle),
            0
          ];
          bodies.push({ pos: sec.pos, mu: sec.mu });
        }

        // Advance craft state with RK4
        const next = stepRK4(pos, vel, bodies, dt);
        pos = next.pos;
        vel = next.vel;

        // Check atmospheric / surface impact
        const rCurrent = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
        if (rCurrent <= sim.centralRadius) {
          setCollisionWarning(true);
          // Bounce or stop at planet surface
          const normal = [pos[0] / rCurrent, pos[1] / rCurrent, pos[2] / rCurrent];
          pos = [normal[0] * sim.centralRadius, normal[1] * normal[1], normal[2] * sim.centralRadius];
          vel = [0, 0, 0];
          break;
        }
      }

      sim.craftPos = pos;
      sim.craftVel = vel;
      sim.time += totalDt;

      // Sync state for React UI rendering
      setCraftState({
        pos,
        vel,
        mass: sim.craftMass,
      });

      if (sim.secBody) {
        setSecondaryBodyState({ ...sim.secBody });
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Thruster Impulse
  const handleApplyBurn = (burnType, deltaV) => {
    const sim = simStateRef.current;
    const newVel = applyImpulse(sim.craftPos, sim.craftVel, burnType, deltaV);
    sim.craftVel = newVel;
    setCraftState((prev) => ({ ...prev, vel: newVel }));
    setLastBurnDeltaV(deltaV);
    setBurnCount((prev) => prev + 1);

    // Thruster firing animation trigger
    setIsThrusting(true);
    setTimeout(() => setIsThrusting(false), 380);
  };

  // Instant Circularization Maneuver
  const handleCircularize = () => {
    const sim = simStateRef.current;
    const [x, y, z] = sim.craftPos;
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-4) return;

    const vCirc = Math.sqrt(sim.centralMu / r);
    // Find unit perpendicular vector in xy plane
    const dir = (x * sim.craftVel[1] - y * sim.craftVel[0] >= 0) ? 1 : -1;
    const newVel = [-dir * (y / r) * vCirc, dir * (x / r) * vCirc, 0];

    sim.craftVel = newVel;
    setCraftState((prev) => ({ ...prev, vel: newVel }));
    setBurnCount((prev) => prev + 1);

    setIsThrusting(true);
    setTimeout(() => setIsThrusting(false), 450);
  };

  // Capture Kepler Sector for 2nd Law Demonstration
  const handleCaptureKeplerSector = () => {
    const sim = simStateRef.current;
    const currentPos = [...sim.craftPos];

    // Predict upcoming arc segment over fixed duration
    const arcPoints = [currentPos];
    let simPos = [...currentPos];
    let simVel = [...sim.craftVel];
    const duration = 0.8; // seconds
    const steps = 15;
    const subDt = duration / steps;

    for (let i = 0; i < steps; i++) {
      const next = stepRK4(simPos, simVel, [{ pos: [0, 0, 0], mu: sim.centralMu }], subDt);
      simPos = next.pos;
      simVel = next.vel;
      arcPoints.push([...simPos]);
    }

    setKeplerSectors((prev) => [...prev.slice(-4), { arcPoints }]);
    setShowKeplerSectors(true);
  };

  // Single step forward
  const handleStepForward = () => {
    const sim = simStateRef.current;
    const bodies = [{ pos: [0, 0, 0], mu: sim.centralMu }];
    if (sim.secBody && sim.secBody.active) {
      bodies.push({ pos: sim.secBody.pos, mu: sim.secBody.mu });
    }
    const next = stepRK4(sim.craftPos, sim.craftVel, bodies, 0.1);
    sim.craftPos = next.pos;
    sim.craftVel = next.vel;
    setCraftState((prev) => ({ ...prev, pos: next.pos, vel: next.vel }));
  };

  // Reset current preset
  const handleReset = () => {
    handleSelectPreset(activePresetId);
  };

  // Clear visual trails
  const handleClearTrails = () => {
    setKeplerSectors([]);
    // Force re-render of trail
    setShowHistoricalTrail(false);
    setTimeout(() => setShowHistoricalTrail(true), 50);
  };

  // Sandbox Launch New Craft callback
  const handleLaunchNewCraft = (startPos, startVel) => {
    simStateRef.current.craftPos = startPos;
    simStateRef.current.craftVel = startVel;
    setCraftState({
      pos: startPos,
      vel: startVel,
      mass: 1000,
    });
    setCollisionWarning(false);
  };

  const warpPresets = [0.25, 0.5, 1, 2, 5, 10, 25, 50];
  const handleCycleWarp = () => {
    const currentIndex = warpPresets.indexOf(timeWarp);
    const nextIndex = (currentIndex + 1) % warpPresets.length;
    setTimeWarp(warpPresets[nextIndex]);
  };

  const cameraModes = ['free', 'top_down', 'follow_craft'];
  const handleCycleCameraMode = () => {
    const currentIndex = cameraModes.indexOf(cameraMode);
    const nextIndex = (currentIndex + 1) % cameraModes.length;
    setCameraMode(cameraModes[nextIndex]);
  };

  return (
    <div className="orbitx-app-wrapper">
      {/* 3D WebGL Three.js Canvas */}
      <OrbitCanvas
        craftState={craftState}
        secondaryBodyState={secondaryBodyState}
        centralBodyConfig={centralBodyConfig}
        telemetry={telemetry}
        showVectors={showVectors}
        showConicPath={showConicPath}
        showHistoricalTrail={showHistoricalTrail}
        showDistanceRings={showDistanceRings}
        showKeplerSectors={showKeplerSectors}
        keplerSectors={keplerSectors}
        cameraMode={cameraMode}
        isThrusting={isThrusting}
        onLaunchNewCraft={handleLaunchNewCraft}
        isSandboxMode={isSandboxMode}
      />

      {/* Collision Warning Banner */}
      {collisionWarning && (
        <div className="collision-banner">
          ⚠️ <strong>Surface Impact!</strong> Spacecraft collided with {centralBodyConfig.name}'s surface. Reset or adjust altitude.
        </div>
      )}

      {/* Desktop Docks (hidden on phone via CSS @media) */}
      <div className="desktop-docks-container">
        <ControlPanel
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          centralBodyConfig={centralBodyConfig}
          onUpdateCentralBody={setCentralBodyConfig}
          craftState={craftState}
          onApplyBurn={handleApplyBurn}
          onCircularize={handleCircularize}
          showVectors={showVectors}
          setShowVectors={setShowVectors}
          showConicPath={showConicPath}
          setShowConicPath={setShowConicPath}
          showHistoricalTrail={showHistoricalTrail}
          setShowHistoricalTrail={setShowHistoricalTrail}
          showDistanceRings={showDistanceRings}
          setShowDistanceRings={setShowDistanceRings}
          showKeplerSectors={showKeplerSectors}
          setShowKeplerSectors={setShowKeplerSectors}
          onCaptureKeplerSector={handleCaptureKeplerSector}
          onResetSimulation={handleReset}
          isSandboxMode={isSandboxMode}
          setIsSandboxMode={setIsSandboxMode}
        />
        <TelemetryHUD telemetry={telemetry} craftMass={craftState.mass} />
        <EnergyGraph telemetry={telemetry} />
        <FormulaInspector
          telemetry={telemetry}
          centralBodyConfig={centralBodyConfig}
          craftMass={craftState.mass}
        />
        <TimeControls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          timeWarp={timeWarp}
          setTimeWarp={setTimeWarp}
          onStepForward={handleStepForward}
          onReset={handleReset}
          onClearTrails={handleClearTrails}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onOpenChallenges={() => setIsChallengesOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      </div>

      {/* Mobile Top Header (Phone only) */}
      <header className="mobile-top-bar glass-panel">
        <div className="mobile-brand">
          <span className="mobile-brand-dot pulse-emerald"></span>
          <span className="mobile-brand-title">ORBITX</span>
        </div>

        {telemetry && (
          <button
            className="mobile-orbit-badge"
            style={{
              borderColor: telemetry.orbitBadgeColor,
              color: telemetry.orbitBadgeColor,
              backgroundColor: `${telemetry.orbitBadgeColor}18`
            }}
            onClick={() => setMobileSheet('telemetry')}
            title="View Telemetry"
          >
            {telemetry.orbitType}
          </button>
        )}

        <div className="mobile-top-actions">
          <button
            className="mobile-top-btn"
            onClick={handleCycleCameraMode}
            title={`Camera: ${cameraMode === 'free' ? '3D Orbit' : cameraMode === 'top_down' ? '2D Plane' : 'Follow Craft'}`}
          >
            <Camera size={15} />
            <span className="mobile-cam-text">
              {cameraMode === 'free' ? '3D' : cameraMode === 'top_down' ? '2D' : 'Chase'}
            </span>
          </button>

          <button
            className="mobile-top-btn missions-btn"
            onClick={() => setIsChallengesOpen(true)}
            title="Achievements & Missions"
          >
            <Trophy size={15} className="text-amber-400" />
          </button>

          <button
            className="mobile-top-btn"
            onClick={() => setIsGuideOpen(true)}
            title="Physics Primer Guide"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* Mobile Floating Mini Telemetry HUD (tap to expand full telemetry sheet) */}
      {telemetry && (
        <div
          className="mobile-mini-hud glass-panel"
          onClick={() => setMobileSheet('telemetry')}
          title="Tap for full Telemetry"
        >
          <div className="mini-hud-row">
            <span className="mini-hud-stat text-cyan-400 font-mono">
              {telemetry.velocity.toFixed(2)} <span className="mini-unit">km/s</span>
            </span>
            <span className="mini-hud-sep">•</span>
            <span className="mini-hud-stat text-slate-300 font-mono">
              {Math.round(telemetry.altitude).toLocaleString()} <span className="mini-unit">km alt</span>
            </span>
          </div>
          <div className="mini-speed-bar">
            <div
              className="mini-speed-fill"
              style={{
                width: `${Math.min(100, (telemetry.velocity / (telemetry.vEsc || 11.2)) * 100)}%`,
                backgroundColor: telemetry.velocity >= telemetry.vEsc ? '#f97316' : telemetry.velocity >= telemetry.vCirc ? '#10b981' : '#38bdf8'
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Quick Burn Floating Buttons (instant orbital maneuvers on phone) */}
      <div className="mobile-quick-burns">
        <button
          className="mobile-burn-btn prograde"
          onClick={() => handleApplyBurn('prograde', 0.5)}
          title="Burn Prograde (+Δv: 0.5 km/s)"
        >
          <Flame size={14} />
          <span>+Δv</span>
        </button>
        <button
          className="mobile-burn-btn retrograde"
          onClick={() => handleApplyBurn('retrograde', 0.5)}
          title="Burn Retrograde (-Δv: 0.5 km/s)"
        >
          <Flame size={14} className="rotate-180" />
          <span>-Δv</span>
        </button>
        <button
          className="mobile-burn-btn circularize"
          onClick={handleCircularize}
          title="Circularize Orbit"
        >
          <RotateCw size={13} />
          <span>Circ</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation & Playback Dock */}
      <nav className="mobile-bottom-bar glass-panel">
        <div className="mobile-playback-controls">
          <button
            className={`mobile-main-play-btn ${isPlaying ? 'playing' : 'paused'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-0.5" />}
          </button>

          <button
            className="mobile-icon-btn"
            onClick={handleStepForward}
            disabled={isPlaying}
            title="Step Forward"
          >
            <SkipForward size={15} />
          </button>

          <button
            className="mobile-icon-btn"
            onClick={handleReset}
            title="Reset Simulation"
          >
            <RotateCcw size={15} />
          </button>

          <button
            className="mobile-warp-pill font-mono"
            onClick={handleCycleWarp}
            title="Tap to cycle time speed"
          >
            {timeWarp}x
          </button>
        </div>

        <div className="mobile-dock-divider"></div>

        <div className="mobile-sheet-tabs">
          <button
            className={`mobile-sheet-tab-btn ${mobileSheet === 'controls' ? 'active' : ''}`}
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            title="Presets & Thrusters"
          >
            <Sliders size={17} />
            <span>Controls</span>
          </button>

          <button
            className={`mobile-sheet-tab-btn ${mobileSheet === 'telemetry' ? 'active' : ''}`}
            onClick={() => setMobileSheet(mobileSheet === 'telemetry' ? null : 'telemetry')}
            title="Flight Telemetry"
          >
            <Activity size={17} />
            <span>Telemetry</span>
          </button>

          <button
            className={`mobile-sheet-tab-btn ${mobileSheet === 'energy' ? 'active' : ''}`}
            onClick={() => setMobileSheet(mobileSheet === 'energy' ? null : 'energy')}
            title="Energy Graph"
          >
            <Zap size={17} />
            <span>Energy</span>
          </button>

          <button
            className={`mobile-sheet-tab-btn ${mobileSheet === 'formulas' ? 'active' : ''}`}
            onClick={() => setMobileSheet(mobileSheet === 'formulas' ? null : 'formulas')}
            title="Physics Formulas"
          >
            <BookOpen size={17} />
            <span>Formulas</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Sheet Overlay (Drawer) */}
      {mobileSheet && (
        <div className="mobile-sheet-backdrop" onClick={() => setMobileSheet(null)}>
          <div
            className="mobile-sheet-container glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-drag-handle">
              <span className="drag-bar"></span>
            </div>

            <div className="mobile-sheet-header">
              <div className="mobile-sheet-title">
                {mobileSheet === 'controls' && <><Sliders size={17} className="text-cyan-400" /><span>Controls & Presets</span></>}
                {mobileSheet === 'telemetry' && <><Activity size={17} className="text-cyan-400" /><span>Orbital Telemetry</span></>}
                {mobileSheet === 'energy' && <><Zap size={17} className="text-amber-400" /><span>Energy Conservation</span></>}
                {mobileSheet === 'formulas' && <><BookOpen size={17} className="text-cyan-400" /><span>Physics Equations Lab</span></>}
              </div>
              <button
                className="mobile-sheet-close-btn"
                onClick={() => setMobileSheet(null)}
                title="Close Sheet"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-scrollable-body">
              {mobileSheet === 'controls' && (
                <ControlPanel
                  activePresetId={activePresetId}
                  onSelectPreset={(p) => { handleSelectPreset(p); }}
                  centralBodyConfig={centralBodyConfig}
                  onUpdateCentralBody={setCentralBodyConfig}
                  craftState={craftState}
                  onApplyBurn={handleApplyBurn}
                  onCircularize={handleCircularize}
                  showVectors={showVectors}
                  setShowVectors={setShowVectors}
                  showConicPath={showConicPath}
                  setShowConicPath={setShowConicPath}
                  showHistoricalTrail={showHistoricalTrail}
                  setShowHistoricalTrail={setShowHistoricalTrail}
                  showDistanceRings={showDistanceRings}
                  setShowDistanceRings={setShowDistanceRings}
                  showKeplerSectors={showKeplerSectors}
                  setShowKeplerSectors={setShowKeplerSectors}
                  onCaptureKeplerSector={handleCaptureKeplerSector}
                  onResetSimulation={handleReset}
                  isSandboxMode={isSandboxMode}
                  setIsSandboxMode={setIsSandboxMode}
                  isMobileSheet={true}
                />
              )}

              {mobileSheet === 'telemetry' && (
                <TelemetryHUD
                  telemetry={telemetry}
                  craftMass={craftState.mass}
                  isMobileSheet={true}
                />
              )}

              {mobileSheet === 'energy' && (
                <EnergyGraph
                  telemetry={telemetry}
                  isMobileSheet={true}
                />
              )}

              {mobileSheet === 'formulas' && (
                <FormulaInspector
                  telemetry={telemetry}
                  centralBodyConfig={centralBodyConfig}
                  craftMass={craftState.mass}
                  isMobileSheet={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Achievement Toast Notification */}
      {achievementToast && (
        <div
          className="achievement-unlock-toast glass-panel"
          onClick={() => {
            setIsChallengesOpen(true);
            setAchievementToast(null);
          }}
          title="Click to view Achievements"
        >
          <div className="toast-badge-wrap">
            {achievementToast.iconUrl ? (
              <img src={achievementToast.iconUrl} alt="Badge" className="toast-badge-img" />
            ) : (
              <Trophy size={22} className="text-amber-400" />
            )}
          </div>
          <div className="toast-content">
            <span className="toast-eyebrow">🏆 ACHIEVEMENT UNLOCKED!</span>
            <span className="toast-title">{achievementToast.title}</span>
            <span className="toast-pts">+{achievementToast.points} PTS • Tap to view</span>
          </div>
        </div>
      )}

      {/* Student Challenges & Missions Modal */}
      <ChallengesModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        telemetry={telemetry}
        lastBurnDeltaV={lastBurnDeltaV}
        burnCount={burnCount}
        centralBodyId={centralBodyConfig.id}
        onAchievementUnlocked={handleAchievementUnlocked}
      />

      {/* Student Guide & Orbital Physics Primer Modal */}
      <QuickGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
