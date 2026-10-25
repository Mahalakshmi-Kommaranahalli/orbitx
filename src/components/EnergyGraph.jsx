import React, { useEffect, useRef, useState } from 'react';
import { Zap, Minimize2, Maximize2 } from 'lucide-react';

export default function EnergyGraph({ telemetry, isMobileSheet = false }) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!telemetry) return;

    // Record sample
    const sample = {
      time: Date.now(),
      kinetic: telemetry.kineticEnergy || 0,
      potential: telemetry.potentialEnergy || 0,
      total: telemetry.totalEnergy || 0
    };

    historyRef.current.push(sample);
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }

    // Render Canvas
    const canvas = canvasRef.current;
    if (!canvas || isMinimized) return;

    if (canvas.clientWidth > 0 && Math.abs(canvas.width - canvas.clientWidth) > 5) {
      canvas.width = canvas.clientWidth;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const history = historyRef.current;
    if (history.length < 2) return;

    // Find min and max for auto-scaling
    let maxVal = -Infinity;
    let minVal = Infinity;
    for (const h of history) {
      if (h.kinetic > maxVal) maxVal = h.kinetic;
      if (h.total > maxVal) maxVal = h.total;
      if (h.potential < minVal) minVal = h.potential;
      if (h.total < minVal) minVal = h.total;
    }

    // Add 15% margin
    const range = Math.max(1e-3, (maxVal - minVal) * 1.25);
    const centerZeroY = height * (maxVal / range);

    // Grid lines & Zero energy axis
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25); ctx.lineTo(width, height * 0.25);
    ctx.moveTo(0, height * 0.5); ctx.lineTo(width, height * 0.5);
    ctx.moveTo(0, height * 0.75); ctx.lineTo(width, height * 0.75);
    ctx.stroke();

    // Zero reference line
    const zeroY = Math.max(0, Math.min(height, height - ((0 - minVal) / range) * height));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Helper to draw a curve
    const drawCurve = (prop, color, lineWidth = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * width;
        const val = history[i][prop];
        const y = height - ((val - minVal) / range) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Draw curves
    drawCurve('potential', '#ef4444', 1.5); // Potential (Red)
    drawCurve('kinetic', '#10b981', 1.5);   // Kinetic (Green)
    drawCurve('total', '#38bdf8', 2.5);     // Total Mechanical Energy (Cyan)

  }, [telemetry, isMinimized]);

  return (
    <div className={`energy-graph-card ${isMobileSheet ? 'mobile-sheet-content' : 'glass-panel'} ${!isMobileSheet && isMinimized ? 'minimized' : ''}`}>
      <div className="energy-header">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">
            Orbital Energy Conservation
          </span>
        </div>
        {!isMobileSheet && (
          <button
            className="icon-subtle-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Show Graph" : "Hide Graph"}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
        )}
      </div>

      {(!isMinimized || isMobileSheet) && (
        <>
          <div className="energy-legend">
            <span className="legend-item"><span className="legend-dot bg-cyan-400"></span>Total (E) = Const</span>
            <span className="legend-item"><span className="legend-dot bg-emerald-400"></span>Kinetic (Ek)</span>
            <span className="legend-item"><span className="legend-dot bg-rose-500"></span>Potential (Ep)</span>
          </div>

          <div className="canvas-wrapper">
            <canvas ref={canvasRef} width={280} height={90} className="energy-canvas" />
          </div>

          <div className="energy-summary-row font-mono text-[11px]">
            <span className="text-cyan-400">E: {telemetry ? telemetry.totalSpecificEnergy.toFixed(2) : '0'} MJ/kg</span>
            <span className="text-slate-400">
              {telemetry?.totalSpecificEnergy < 0 ? 'Bound Orbit (E < 0)' : 'Unbound Escape (E ≥ 0)'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
