import React, { useEffect, useState } from 'react';
import {
  Trophy,
  CheckCircle,
  Circle,
  X,
  Award,
  Sparkles,
  ExternalLink,
  Flame,
  Radio,
  RotateCw,
  Compass,
  Globe,
  Rocket,
  ShieldCheck,
  Lock,
  Layers,
  Star,
  MapPin,
  Mail,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ACHIEVEMENTS, GITHUB_PROFILE } from '../physics/achievementsData';

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
    description: 'Boost your spacecraft so that its Apoapsis reaches approximately 42,164 km (between 40,000 km and 44,500 km).',
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

export default function ChallengesModal({
  isOpen,
  onClose,
  telemetry,
  lastBurnDeltaV = 0,
  burnCount = 0,
  centralBodyId = 'earth',
  onAchievementUnlocked
}) {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' | 'missions'
  const [completedMissions, setCompletedMissions] = useState(() => {
    try {
      const saved = localStorage.getItem('orbitx_completed_missions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('orbitx_unlocked_achievements');
      const parsed = saved ? JSON.parse(saved) : {};
      // GitHub YOLO is pre-earned and verified from the author's profile!
      return { github_yolo: true, ...parsed };
    } catch {
      return { github_yolo: true };
    }
  });

  // Check and unlock achievement helper
  const unlockAchievement = (id) => {
    setUnlockedAchievements((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem('orbitx_unlocked_achievements', JSON.stringify(next));
      } catch (e) {
        // ignore
      }

      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (achievement && onAchievementUnlocked) {
        onAchievementUnlocked(achievement);
      }

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });

      return next;
    });
  };

  // Evaluate Missions completion
  useEffect(() => {
    if (!telemetry) return;

    CHALLENGES.forEach((c) => {
      if (!completedMissions[c.id] && c.checkCondition(telemetry)) {
        setCompletedMissions((prev) => {
          const next = { ...prev, [c.id]: true };
          try {
            localStorage.setItem('orbitx_completed_missions', JSON.stringify(next));
          } catch (e) {
            // ignore
          }
          return next;
        });

        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });
  }, [telemetry, completedMissions]);

  // Evaluate Simulator Achievements in real-time
  useEffect(() => {
    if (!telemetry) return;

    // First Orbit
    if (telemetry.eccentricity < 0.05 && telemetry.periapsis > 6.6) {
      unlockAchievement('first_orbit');
    }

    // GEO
    if (isFinite(telemetry.apoapsis) && telemetry.apoapsis * 1000 >= 40000 && telemetry.apoapsis * 1000 <= 44500) {
      unlockAchievement('reach_geo');
    }

    // Escape Velocity
    if (telemetry.velocity >= telemetry.vEsc && telemetry.eccentricity >= 1.0) {
      unlockAchievement('escape_velocity');
    }

    // Comet Whisperer
    if (telemetry.eccentricity >= 0.75 && telemetry.eccentricity <= 0.95 && telemetry.periapsis > 6.5) {
      unlockAchievement('comet_whisperer');
    }
  }, [telemetry]);

  // Evaluate Burn & Exploration Achievements
  useEffect(() => {
    if (lastBurnDeltaV >= 2.0) {
      unlockAchievement('orbital_yolo');
    }
    if (burnCount >= 5) {
      unlockAchievement('precision_pilot');
    }
    if (centralBodyId && centralBodyId !== 'earth') {
      unlockAchievement('planetary_hopper');
    }
  }, [lastBurnDeltaV, burnCount, centralBodyId]);

  if (!isOpen) return null;

  const totalMissionScore = Object.keys(completedMissions).reduce((acc, id) => {
    const found = CHALLENGES.find((c) => c.id === id);
    return acc + (found ? found.points : 0);
  }, 0);

  const totalAchievementScore = Object.keys(unlockedAchievements).reduce((acc, id) => {
    const found = ACHIEVEMENTS.find((a) => a.id === id);
    return acc + (found ? found.points : 0);
  }, 0);

  const renderIcon = (ach) => {
    if (ach.iconUrl) {
      return <img src={ach.iconUrl} alt={ach.title} className="achievement-badge-img" />;
    }
    switch (ach.icon) {
      case 'Flame': return <Flame size={20} style={{ color: ach.color }} />;
      case 'RotateCw': return <RotateCw size={20} style={{ color: ach.color }} />;
      case 'Radio': return <Radio size={20} style={{ color: ach.color }} />;
      case 'Compass': return <Compass size={20} style={{ color: ach.color }} />;
      case 'Sparkles': return <Sparkles size={20} style={{ color: ach.color }} />;
      case 'Globe': return <Globe size={20} style={{ color: ach.color }} />;
      case 'Rocket': return <Rocket size={20} style={{ color: ach.color }} />;
      default: return <Award size={20} style={{ color: ach.color || '#38bdf8' }} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card challenges-achievements-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <div>
              <h2 className="modal-title">Achievements & Missions</h2>
              <p className="modal-subtitle">GitHub verified badges & orbital flight mastery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="score-badge">
              <Award size={15} className="text-amber-400" />
              <span>{totalAchievementScore + totalMissionScore} pts</span>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Close Modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="achievements-nav-tabs">
          <button
            className={`ach-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <Award size={15} />
            <span>Achievements</span>
            <span className="ach-count-pill">
              {Object.keys(unlockedAchievements).length} / {ACHIEVEMENTS.length}
            </span>
          </button>
          <button
            className={`ach-tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
            onClick={() => setActiveTab('missions')}
          >
            <Trophy size={15} />
            <span>Flight Missions</span>
            <span className="ach-count-pill">
              {Object.keys(completedMissions).length} / {CHALLENGES.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Achievements */}
        {activeTab === 'achievements' && (
          <div className="achievements-content-scroll">
            {/* Authentic GitHub Profile & YOLO Achievement Showcase */}
            <div className="github-profile-showcase-card">
              <div className="showcase-top-header">
                <div className="profile-user-left">
                  <div className="profile-avatar-container">
                    <img
                      src={GITHUB_PROFILE.avatarUrl}
                      alt={GITHUB_PROFILE.username}
                      className="github-user-avatar"
                    />
                    <div className="github-status-chip" title="Focusing">
                      <span>{GITHUB_PROFILE.statusEmoji}</span>
                      <span className="status-chip-text">{GITHUB_PROFILE.status}</span>
                    </div>
                  </div>
                  <div className="profile-titles">
                    <div className="flex items-center gap-2">
                      <h3 className="profile-handle">{GITHUB_PROFILE.username}</h3>
                      <span className="profile-pronouns">· {GITHUB_PROFILE.pronouns}</span>
                    </div>
                    <div className="profile-full-name">{GITHUB_PROFILE.name}</div>
                  </div>
                </div>

                <a
                  href={GITHUB_PROFILE.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-github-pill"
                >
                  <span>GitHub Profile</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Bio */}
              <p className="github-profile-bio">
                {GITHUB_PROFILE.bio}
              </p>

              {/* Stats & Metadata Row */}
              <div className="github-meta-row">
                <div className="meta-item">
                  <Users size={14} className="text-slate-400" />
                  <span><strong>{GITHUB_PROFILE.followers}</strong> followers · <strong>{GITHUB_PROFILE.following}</strong> following</span>
                </div>
                <div className="meta-item">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{GITHUB_PROFILE.location}</span>
                </div>
                <a href={`mailto:${GITHUB_PROFILE.email}`} className="meta-item meta-link">
                  <Mail size={14} className="text-slate-400" />
                  <span>{GITHUB_PROFILE.email}</span>
                </a>
              </div>

              {/* Social Links Chips */}
              <div className="github-socials-chips">
                <a href={GITHUB_PROFILE.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-chip-link">
                  <span>📸 its_me_mahaaaa__</span>
                </a>
                <a href={GITHUB_PROFILE.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-chip-link">
                  <span>💼 in/mahalakshmi-kommaranahalli-06aba0341</span>
                </a>
                <a href={GITHUB_PROFILE.socials.x} target="_blank" rel="noopener noreferrer" className="social-chip-link">
                  <span>𝕏 @mahalakshmik225</span>
                </a>
              </div>

              {/* Achievements Showcase Section */}
              <div className="profile-achievements-divider">
                <span className="achievements-section-title">Achievements</span>
                <div className="github-achievement-badge-box">
                  <a
                    href="https://github.com/Mahalakshmi-Kommaranahalli?achievement=yolo&tab=achievements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge-link-interactive"
                  >
                    <div className="badge-glow-ring">
                      <img
                        src="https://github.githubassets.com/assets/yolo-default-be0bbff04951.png"
                        alt="Achievement: YOLO"
                        className="github-yolo-badge-img"
                      />
                    </div>
                    <div className="badge-desc-col">
                      <div className="flex items-center gap-2">
                        <span className="badge-name-highlight">YOLO</span>
                        <span className="badge-earned-pill">✓ Verified on GitHub</span>
                      </div>
                      <p className="badge-meaning">Merged a pull request without code review.</p>
                      <span className="badge-action-hint">Click to view achievement detail on GitHub ↗</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* List of All Achievements */}
            <div className="achievements-grid">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = !!unlockedAchievements[ach.id];
                return (
                  <div
                    key={ach.id}
                    className={`achievement-card-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="ach-card-icon-wrap">
                      {renderIcon(ach)}
                    </div>
                    <div className="ach-card-info">
                      <div className="flex items-center justify-between mb-1">
                        <span className="ach-card-title">{ach.title}</span>
                        <span className={`ach-card-status ${isUnlocked ? 'earned' : 'pending'}`}>
                          {isUnlocked ? '✓ Earned' : 'Locked'}
                        </span>
                      </div>
                      <span className="ach-card-category">{ach.category}</span>
                      <p className="ach-card-desc">{ach.description}</p>
                      <div className="ach-card-footer">
                        <span className="ach-requirement">
                          🎯 {ach.requirement}
                        </span>
                        <span className="ach-pts">+{ach.points} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Missions */}
        {activeTab === 'missions' && (
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
        )}

        {/* Footer */}
        <div className="modal-footer">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Progress:</span>
            <strong className="text-cyan-400">
              {Object.keys(unlockedAchievements).length} Achievements
            </strong>
            <span>•</span>
            <strong className="text-amber-400">
              {Object.keys(completedMissions).length} Missions
            </strong>
          </div>
          <button className="btn-accent-sm" onClick={onClose}>
            Back to Flight Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

