import React, { useState } from 'react';
import {
  Gauge,
  Compass,
  Zap,
  Clock,
  Maximize2,
  Minimize2,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatTime } from '../physics/orbitalMath';

export default function TelemetryHUD({ telemetry, craftMass = 1000, isMobileSheet = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!telemetry) return null;

  const {
    radius,
    altitude,
    velocity,
    vCirc,
    vEsc,
    eccentricity,
    semiMajorAxis,
    periapsis,
    apoapsis,
    period,
    totalSpecificEnergy,
    gravForce,
    orbitType,
    orbitBadgeColor,
    flightPathAngleDeg
  } = telemetry;

  // Velocity percentage relative to escape velocity (0 to 120%)
  const speedRatio = vEsc > 0 ? (velocity / vEsc) * 100 : 0;
  const circRatio = vEsc > 0 ? (vCirc / vEsc) * 100 : 70.7;

  return (
    <div className={`telemetry-hud-card ${isMobileSheet ? 'mobile-sheet-content' : 'glass-panel'} ${!isMobileSheet && !isExpanded ? 'collapsed' : 'expanded'}`}>
      {/* HUD Header */}
      <div className="telemetry-header">
        <div className="telemetry-title-group">
          <Activity size={18} className="text-cyan-400 animate-pulse" />
          <span className="telemetry-label">FLIGHT TELEMETRY</span>
          <span
            className="orbit-type-pill"
            style={{ backgroundColor: `${orbitBadgeColor}22`, borderColor: orbitBadgeColor, color: orbitBadgeColor }}
          >
            {orbitType}
          </span>
        </div>
        {!isMobileSheet && (
          <button
            className="hud-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse HUD" : "Expand HUD"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Main Velocity & Altitude readout */}
      <div className="telemetry-primary-grid">
        <div className="telemetry-stat-box primary">
          <div className="stat-label">ORBITAL VELOCITY (v)</div>
          <div className="stat-value font-mono text-cyan-400">
            {velocity.toFixed(2)} <span className="stat-unit">km/s</span>
          </div>
          {/* Dynamic Speed Gauge Bar */}
          <div className="speed-gauge-track">
            <div
              className="speed-gauge-fill"
              style={{
                width: `${Math.min(100, speedRatio)}%`,
                backgroundColor: velocity >= vEsc ? '#f97316' : velocity >= vCirc ? '#10b981' : '#38bdf8'
              }}
            />
            {/* Marker for circular speed */}
            <div
              className="speed-gauge-marker circ-marker"
              style={{ left: `${Math.min(99, circRatio)}%` }}
              title={`v_circ: ${vCirc.toFixed(2)} km/s`}
            />
            {/* Marker for escape speed (100%) */}
            <div
              className="speed-gauge-marker esc-marker"
              style={{ left: '98%' }}
              title={`v_esc: ${vEsc.toFixed(2)} km/s`}
            />
          </div>
          <div className="speed-gauge-labels">
            <span>v_circ: {vCirc.toFixed(2)}</span>
            <span>v_esc: {vEsc.toFixed(2)}</span>
          </div>
        </div>

        <div className="telemetry-stat-box primary">
          <div className="stat-label">ALTITUDE (h)</div>
          <div className="stat-value font-mono text-emerald-400">
            {(altitude * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
            <span className="stat-unit">km</span>
          </div>
          <div className="stat-subtext">
            Distance from Core (r): {(radius * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} km
          </div>
        </div>
      </div>

      {/* Expanded Orbital Elements Grid */}
      {isExpanded && (
        <div className="telemetry-details-grid">
          <div className="stat-cell">
            <span className="cell-label">Eccentricity (e)</span>
            <span className="cell-value font-mono text-amber-300">{eccentricity.toFixed(4)}</span>
            <div className="eccentricity-bar-bg">
              <div
                className="eccentricity-bar-fill"
                style={{
                  width: `${Math.min(100, eccentricity * 100)}%`,
                  backgroundColor: eccentricity >= 1 ? '#f97316' : eccentricity > 0.05 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>

          <div className="stat-cell">
            <span className="cell-label">Periapsis (Pe)</span>
            <span className="cell-value font-mono text-green-400">
              {periapsis > 0 ? (periapsis * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km' : '—'}
            </span>
          </div>

          <div className="stat-cell">
            <span className="cell-label">Apoapsis (Ap)</span>
            <span className="cell-value font-mono text-yellow-400">
              {isFinite(apoapsis) && apoapsis > 0
                ? (apoapsis * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km'
                : '∞ (Escape)'}
            </span>
          </div>

          <div className="stat-cell">
            <span className="cell-label">Orbital Period (T)</span>
            <span className="cell-value font-mono text-indigo-300">
              {isFinite(period) ? formatTime(period) : 'Hyperbolic'}
            </span>
          </div>

          <div className="stat-cell">
            <span className="cell-label">Gravity Force (Fg)</span>
            <span className="cell-value font-mono text-rose-400">
              {gravForce.toFixed(1)} <span className="stat-unit">kN</span>
            </span>
          </div>

          <div className="stat-cell">
            <span className="cell-label">Specific Energy (ε)</span>
            <span className="cell-value font-mono text-purple-300">
              {totalSpecificEnergy.toFixed(2)} <span className="stat-unit">MJ/kg</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
