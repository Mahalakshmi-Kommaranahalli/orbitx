import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Camera,
  Trash2,
  Trophy,
  HelpCircle,
  Compass
} from 'lucide-react';

export default function TimeControls({
  isPlaying,
  setIsPlaying,
  timeWarp,
  setTimeWarp,
  onStepForward,
  onReset,
  onClearTrails,
  cameraMode,
  setCameraMode,
  onOpenChallenges,
  onOpenGuide
}) {
  const warpPresets = [0.25, 0.5, 1, 2, 5, 10, 25, 50];

  return (
    <div className="time-controls-bar glass-panel">
      {/* Left: Playback controls */}
      <div className="time-playback-group">
        <button
          className={`playback-main-btn ${isPlaying ? 'playing' : 'paused'}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause Simulation (Spacebar)" : "Play Simulation (Spacebar)"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
        </button>

        <button
          className="playback-btn"
          onClick={onStepForward}
          disabled={isPlaying}
          title="Single Physics Step Forward"
        >
          <SkipForward size={16} />
        </button>

        <button
          className="playback-btn"
          onClick={onReset}
          title="Reset Simulation State"
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="playback-btn"
          onClick={onClearTrails}
          title="Clear Trajectory Ribbon"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Center: Time Warp Speed Multiplier */}
      <div className="time-warp-group">
        <span className="warp-label flex items-center gap-1">
          <FastForward size={14} className="text-cyan-400" />
          <span>TIME WARP</span>
        </span>
        <div className="warp-buttons">
          {warpPresets.map((w) => (
            <button
              key={w}
              className={`warp-btn ${timeWarp === w ? 'active' : ''}`}
              onClick={() => setTimeWarp(w)}
            >
              {w}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Camera Perspectives & Student Learning Tools */}
      <div className="time-extras-group">
        <div className="camera-modes-segmented">
          <button
            className={`cam-mode-btn ${cameraMode === 'free' ? 'active' : ''}`}
            onClick={() => setCameraMode('free')}
            title="Free Orbit Camera (Drag to rotate, Scroll to zoom)"
          >
            3D Orbit
          </button>
          <button
            className={`cam-mode-btn ${cameraMode === 'top_down' ? 'active' : ''}`}
            onClick={() => setCameraMode('top_down')}
            title="2D Top-Down View on Orbital Plane"
          >
            2D Plane
          </button>
          <button
            className={`cam-mode-btn ${cameraMode === 'follow_craft' ? 'active' : ''}`}
            onClick={() => setCameraMode('follow_craft')}
            title="Chase Camera (Follow Spacecraft)"
          >
            Follow Craft
          </button>
        </div>

        <button
          className="action-pill-btn challenges-btn"
          onClick={onOpenChallenges}
          title="Student Interactive Missions & Quizzes"
        >
          <Trophy size={16} className="text-amber-400" />
          <span>Missions</span>
        </button>

        <button
          className="action-pill-btn guide-btn"
          onClick={onOpenGuide}
          title="Orbital Mechanics Theory Primer"
        >
          <HelpCircle size={16} className="text-cyan-400" />
          <span>Guide</span>
        </button>
      </div>
    </div>
  );
}
