import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle, Circle, X, Award, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const CHALLENGES = [
  {
    id: 'stable_circular',
    title: 'Mission 1: Stable Circular Orbit',
    difficulty: 'Easy',
    points: 100,
    description: 'Use prograde/retrograde burns or the Circularize button to achieve an eccentricity e < 0.04 with periapsis > 6,600 km.',
    hint: 'If your orbit is too eccentric, fire prograde at apoapsis to raise periapsis, or retrograde at periapsis.',
    checkCondition: (telemetry) => {
      return telemetry && telemetry.eccentricity < 0.04 && telemetry.periapsis > 6.6;
    }
  },
  {
    id: 'reach_geo',
    title: 'Mission 2: Reach Geostationary Altitude',
    difficulty: 'Medium',
    points: 200,
    description: 'Boost your spacecraft so that its Apoapsis reaches approximately 42,164 km (between 40,000 km and 44,000 km).',
    hint: 'Fire a strong prograde (+Δv) burn when you are at periapsis to push apoapsis all the way out to GEO.',
    checkCondition: (telemetry) => {
      if (!telemetry || !isFinite(telemetry.apoapsis)) return false;
      const apoKm = telemetry.apoapsis * 1000;
      return apoKm >= 40000 && apoKm <= 44500;
    }
  },
  {
    id: 'break_escape',
    title: 'Mission 3: Escape Earth’s Gravity Well',
    difficulty: 'Medium',
    points: 250,
    description: 'Accelerate the spacecraft until its velocity exceeds escape velocity (v ≥ v_esc), establishing a hyperbolic trajectory (e ≥ 1.0).',
    hint: 'Continuous prograde thrust will increase total specific energy until ε > 0, breaking gravitational capture.',
    checkCondition: (telemetry) => {
      return telemetry && telemetry.velocity >= telemetry.vEsc && telemetry.eccentricity >= 1.0;
    }
  },
  {
    id: 'extreme_eccentric',
    title: 'Mission 4: Highly Eccentric Comet Orbit',
    difficulty: 'Hard',
    points: 300,
    description: 'Establish a bound closed orbit with high eccentricity (0.75 ≤ e ≤ 0.95) and periapsis safely above planet surface (> 6,500 km).',
    hint: 'Carefully throttle prograde burns just below escape velocity.',
    checkCondition: (telemetry) => {
      return telemetry && telemetry.eccentricity >= 0.75 && telemetry.eccentricity <= 0.95 && telemetry.periapsis > 6.5;
    }
  }
];

export default function ChallengesModal({ isOpen, onClose, telemetry }) {
  const [completedMissions, setCompletedMissions] = useState({});

  useEffect(() => {
    if (!telemetry) return;

    CHALLENGES.forEach((c) => {
      if (!completedMissions[c.id] && c.checkCondition(telemetry)) {
        setCompletedMissions(prev => ({ ...prev, [c.id]: true }));
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });
  }, [telemetry, completedMissions]);

  if (!isOpen) return null;

  const totalScore = Object.keys(completedMissions).reduce((acc, id) => {
    const found = CHALLENGES.find(c => c.id === id);
    return acc + (found ? found.points : 0);
  }, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={22} />
            <div>
              <h2 className="modal-title">Flight Academy Challenges</h2>
              <p className="modal-subtitle">Interactive orbital mechanics flight tests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="score-badge">
              <Award size={16} className="text-amber-400" />
              <span>Score: {totalScore} pts</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Challenge list */}
        <div className="challenges-list">
          {CHALLENGES.map((ch) => {
            const isDone = !!completedMissions[ch.id];
            return (
              <div key={ch.id} className={`challenge-item ${isDone ? 'completed' : ''}`}>
                <div className="challenge-status-icon">
                  {isDone ? (
                    <CheckCircle className="text-emerald-400" size={24} />
                  ) : (
                    <Circle className="text-slate-500" size={24} />
                  )}
                </div>
                <div className="challenge-content">
                  <div className="flex items-center justify-between mb-1">
                    <span className="challenge-title">{ch.title}</span>
                    <span className="challenge-points">+{ch.points} pts</span>
                  </div>
                  <p className="challenge-desc">{ch.description}</p>
                  <p className="challenge-hint">💡 <em>Hint:</em> {ch.hint}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="text-xs text-slate-400">
            Completed: {Object.keys(completedMissions).length} / {CHALLENGES.length} Missions
          </div>
          <button className="btn-accent-sm" onClick={onClose}>
            Back to Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
