import React, { useState } from 'react';
import { BookOpen, HelpCircle, Sparkles, ChevronRight, Calculator, CheckCircle2 } from 'lucide-react';

export default function FormulaInspector({ telemetry, centralBodyConfig, craftMass = 1000 }) {
  const [selectedFormula, setSelectedFormula] = useState('gravitation');

  if (!telemetry) return null;

  const {
    radius,
    velocity,
    vCirc,
    vEsc,
    semiMajorAxis,
    period,
    gravForce
  } = telemetry;

  const G_constant = 6.674e-11;
  const planetMassKg = centralBodyConfig.mass * 1e22;
  const radiusMeters = radius * 1e6;

  return (
    <div className="formula-inspector-card glass-panel">
      <div className="inspector-header">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
            Interactive Physics Equations Lab
          </span>
        </div>
        <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
          Live Substituted
        </span>
      </div>

      {/* Formula Tab Selector */}
      <div className="formula-tabs">
        <button
          className={`formula-tab-btn ${selectedFormula === 'gravitation' ? 'active' : ''}`}
          onClick={() => setSelectedFormula('gravitation')}
        >
          Newton's Gravity
        </button>
        <button
          className={`formula-tab-btn ${selectedFormula === 'visviva' ? 'active' : ''}`}
          onClick={() => setSelectedFormula('visviva')}
        >
          Vis-Viva Speed
        </button>
        <button
          className={`formula-tab-btn ${selectedFormula === 'escape' ? 'active' : ''}`}
          onClick={() => setSelectedFormula('escape')}
        >
          Escape Velocity
        </button>
        <button
          className={`formula-tab-btn ${selectedFormula === 'kepler3' ? 'active' : ''}`}
          onClick={() => setSelectedFormula('kepler3')}
        >
          Kepler's 3rd Law
        </button>
      </div>

      {/* Active Formula Card */}
      <div className="formula-body">
        {selectedFormula === 'gravitation' && (
          <div className="formula-detail-card">
            <div className="formula-math-display">
              <span className="formula-sym">F_g</span> = G · <span className="formula-frac"><span className="num">M · m</span><span className="den">r²</span></span>
            </div>
            <div className="formula-live-substitution font-mono">
              <span className="text-rose-400">{gravForce.toFixed(1)} kN</span> =
              <span className="text-slate-400"> (G · {centralBodyConfig.name} Mass · {craftMass} kg)</span> /
              <span className="text-amber-300"> ({(radius * 1000).toFixed(0)} km)²</span>
            </div>
            <p className="formula-explanation">
              <strong>Inverse Square Law:</strong> If the spacecraft doubles its distance from Earth's center, the gravitational pull drops by a factor of <strong>4</strong> (2²).
            </p>
          </div>
        )}

        {selectedFormula === 'visviva' && (
          <div className="formula-detail-card">
            <div className="formula-math-display">
              <span className="formula-sym">v²</span> = μ · <span className="formula-bracket">(</span><span className="formula-frac"><span className="num">2</span><span className="den">r</span></span> - <span className="formula-frac"><span className="num">1</span><span className="den">a</span></span><span className="formula-bracket">)</span>
            </div>
            <div className="formula-live-substitution font-mono">
              <span className="text-emerald-400">{velocity.toFixed(2)} km/s</span> =
              <span className="text-slate-400"> √[ μ · (2 / {(radius * 1000).toFixed(0)} - 1 / {(semiMajorAxis * 1000).toFixed(0)}) ]</span>
            </div>
            <p className="formula-explanation">
              <strong>Vis-Viva (Living Force):</strong> Connects orbital velocity directly to distance (r) and semi-major axis (a). At periapsis, r is smallest, so velocity v peaks!
            </p>
          </div>
        )}

        {selectedFormula === 'escape' && (
          <div className="formula-detail-card">
            <div className="formula-math-display">
              <span className="formula-sym">v_esc</span> = <span className="formula-sqrt">√</span><span className="formula-frac"><span className="num">2 · G · M</span><span className="den">r</span></span> = <span className="formula-sqrt">√2</span> · v_circ
            </div>
            <div className="formula-live-substitution font-mono">
              <span className="text-orange-400">{vEsc.toFixed(2)} km/s</span> =
              <span className="text-slate-400"> √2 × </span>
              <span className="text-cyan-400">{vCirc.toFixed(2)} km/s</span>
            </div>
            <p className="formula-explanation">
              <strong>Parabolic Boundary:</strong> Escape velocity is exactly <strong>√2 (≈ 1.414)</strong> times the circular velocity at any given radius. Exceeding v_esc creates an open hyperbolic trajectory.
            </p>
          </div>
        )}

        {selectedFormula === 'kepler3' && (
          <div className="formula-detail-card">
            <div className="formula-math-display">
              <span className="formula-frac"><span className="num">T²</span><span className="den">a³</span></span> = <span className="formula-frac"><span className="num">4 · π²</span><span className="den">G · M</span></span> = <span className="text-cyan-400">Constant</span>
            </div>
            <div className="formula-live-substitution font-mono">
              <span className="text-purple-300">T: {period > 0 ? (period / 60).toFixed(1) + ' min' : '—'}</span> |
              <span className="text-amber-300"> a: {(semiMajorAxis * 1000).toFixed(0)} km</span>
            </div>
            <p className="formula-explanation">
              <strong>Harmonic Law:</strong> The square of the orbital period is strictly proportional to the cube of the semi-major axis. Spacecraft in higher orbits take much longer to complete a revolution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
