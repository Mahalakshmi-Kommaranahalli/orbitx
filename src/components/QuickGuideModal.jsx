import React, { useState } from 'react';
import { BookOpen, X, Orbit, Zap, ArrowRight, Compass, ShieldCheck, Key } from 'lucide-react';

export default function QuickGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('newton');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card guide-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen className="text-cyan-400" size={22} />
            <div>
              <h2 className="modal-title">ORBITX Physics Academy</h2>
              <p className="modal-subtitle">Comprehensive guide to orbital mechanics & gravitational physics</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Topic Selector Tabs */}
        <div className="guide-tabs">
          <button
            className={`guide-tab-btn ${activeTab === 'newton' ? 'active' : ''}`}
            onClick={() => setActiveTab('newton')}
          >
            Newton's Cannon
          </button>
          <button
            className={`guide-tab-btn ${activeTab === 'kepler' ? 'active' : ''}`}
            onClick={() => setActiveTab('kepler')}
          >
            Kepler's Laws
          </button>
          <button
            className={`guide-tab-btn ${activeTab === 'energy' ? 'active' : ''}`}
            onClick={() => setActiveTab('energy')}
          >
            Energy & Conics
          </button>
          <button
            className={`guide-tab-btn ${activeTab === 'hohmann' ? 'active' : ''}`}
            onClick={() => setActiveTab('hohmann')}
          >
            Hohmann Transfer
          </button>
          <button
            className={`guide-tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Hotkeys & Help
          </button>
        </div>

        {/* Content Body */}
        <div className="guide-body">
          {activeTab === 'newton' && (
            <div className="guide-section">
              <h3 className="guide-heading">Newton's Cannonball Thought Experiment</h3>
              <p>
                In 1687, Sir Isaac Newton imagined placing a massive cannon atop a very high mountain above the Earth's atmosphere:
              </p>
              <div className="guide-diagram-box">
                <div className="guide-bullet-point">
                  <span className="bullet-num">1</span>
                  <div>
                    <strong>Low Speed (v &lt; 7.8 km/s):</strong> The cannonball falls under gravity and crashes onto the Earth's surface in a ballistic parabola.
                  </div>
                </div>
                <div className="guide-bullet-point">
                  <span className="bullet-num">2</span>
                  <div>
                    <strong>Orbital Speed (v = 7.8 km/s):</strong> The forward speed is so fast that as the ball falls towards Earth, the surface curves away underneath it at the exact same rate! It falls forever around the Earth in a stable circular orbit.
                  </div>
                </div>
                <div className="guide-bullet-point">
                  <span className="bullet-num">3</span>
                  <div>
                    <strong>Escape Speed (v ≥ 11.2 km/s):</strong> The kinetic energy overcomes Earth's entire gravitational pull, sending the projectile into open interplanetary space along a parabola or hyperbola.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kepler' && (
            <div className="guide-section">
              <h3 className="guide-heading">Kepler’s Three Laws of Planetary Motion</h3>
              <div className="guide-diagram-box">
                <div className="mb-3">
                  <h4 className="text-cyan-400 font-bold mb-1">1. Law of Ellipses</h4>
                  <p className="text-slate-300 text-sm">
                    All orbits are conic sections (ellipses), with the massive central body located at one of the two focal points (F₁).
                  </p>
                </div>
                <div className="mb-3">
                  <h4 className="text-amber-400 font-bold mb-1">2. Law of Equal Areas</h4>
                  <p className="text-slate-300 text-sm">
                    A line segment connecting the satellite and the planet sweeps out equal surface areas in equal intervals of time (dA/dt = constant). This means a craft travels fastest at <em>periapsis</em> (closest approach) and slowest at <em>apoapsis</em> (farthest distance).
                  </p>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">3. Harmonic Law of Periods</h4>
                  <p className="text-slate-300 text-sm">
                    The square of orbital period (T²) is directly proportional to the cube of the semi-major axis (a³):
                    <code className="text-cyan-300 ml-2">T² / a³ = 4π² / (G·M)</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'energy' && (
            <div className="guide-section">
              <h3 className="guide-heading">Orbital Energy & Conic Classification</h3>
              <p>
                Specific orbital energy (ε) is the sum of specific kinetic energy and specific gravitational potential energy:
              </p>
              <div className="font-mono bg-slate-900/90 p-3 rounded border border-slate-800 text-cyan-300 my-2 text-center text-sm">
                ε = (v² / 2) - (μ / r)
              </div>
              <div className="conic-table-wrapper">
                <table className="conic-table">
                  <thead>
                    <tr>
                      <th>Energy (ε)</th>
                      <th>Eccentricity (e)</th>
                      <th>Trajectory Conic</th>
                      <th>Behavior</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>ε &lt; 0</td>
                      <td>e = 0</td>
                      <td className="text-emerald-400 font-bold">Circular</td>
                      <td>Closed, constant altitude</td>
                    </tr>
                    <tr>
                      <td>ε &lt; 0</td>
                      <td>0 &lt; e &lt; 1</td>
                      <td className="text-indigo-400 font-bold">Elliptical</td>
                      <td>Closed, periodic orbit</td>
                    </tr>
                    <tr>
                      <td>ε = 0</td>
                      <td>e = 1</td>
                      <td className="text-amber-400 font-bold">Parabolic</td>
                      <td>Just reaches escape velocity</td>
                    </tr>
                    <tr>
                      <td>ε &gt; 0</td>
                      <td>e &gt; 1</td>
                      <td className="text-rose-400 font-bold">Hyperbolic</td>
                      <td>Permanent escape to deep space</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hohmann' && (
            <div className="guide-section">
              <h3 className="guide-heading">Hohmann Transfer Trajectory</h3>
              <p>
                Named after Walter Hohmann in 1925, this is the most fuel-optimal method to move between two circular coplanar orbits:
              </p>
              <div className="guide-diagram-box">
                <p className="text-sm text-slate-300 mb-2">
                  <strong>1st Impulse ($\Delta v_1$):</strong> Fired prograde at low orbit. This creates an elliptical transfer orbit whose periapsis is the departure radius and apoapsis is the destination radius.
                </p>
                <p className="text-sm text-slate-300">
                  <strong>2nd Impulse ($\Delta v_2$):</strong> Fired prograde upon reaching apoapsis half an orbit later. This circularizes the craft at the target high altitude (e.g. Geostationary Orbit).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="guide-section">
              <h3 className="guide-heading">Controls & Simulator Shortcuts</h3>
              <div className="shortcuts-grid">
                <div className="shortcut-card">
                  <kbd>Spacebar</kbd>
                  <span>Play / Pause physics simulation</span>
                </div>
                <div className="shortcut-card">
                  <kbd>Left Mouse Drag</kbd>
                  <span>Rotate 3D camera around focus</span>
                </div>
                <div className="shortcut-card">
                  <kbd>Mouse Scroll</kbd>
                  <span>Smooth Zoom in / Zoom out</span>
                </div>
                <div className="shortcut-card">
                  <kbd>Right Mouse Drag</kbd>
                  <span>Pan camera center</span>
                </div>
                <div className="shortcut-card">
                  <kbd>Shift + Drag</kbd>
                  <span>Launch custom satellite in Sandbox</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-accent-sm ml-auto" onClick={onClose}>
            Got it, Let's Fly!
          </button>
        </div>
      </div>
    </div>
  );
}
