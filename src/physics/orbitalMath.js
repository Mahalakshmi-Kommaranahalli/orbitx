// Orbital Mathematics & Conic Sections Engine for ORBITX

/**
 * Calculates full 2-body Keplerian orbital elements from state vectors
 * @param {Array<number>} pos - [x, y, z] position vector
 * @param {Array<number>} vel - [vx, vy, vz] velocity vector
 * @param {number} mu - Standard gravitational parameter (G * M)
 * @param {number} centralRadius - Radius of central planet
 * @param {number} craftMass - Mass of spacecraft (kg)
 * @returns {Object} Complete orbital telemetry and conic parameters
 */
export function calculateOrbitalElements(pos, vel, mu, centralRadius = 6.371, craftMass = 1000) {
  const [x, y, z] = pos;
  const [vx, vy, vz] = vel;

  const r = Math.sqrt(x * x + y * y + z * z);
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);

  if (r < 1e-5) {
    return null;
  }

  // Radial distance from center & altitude from surface (in 1000 km)
  const altitude = Math.max(0, r - centralRadius);

  // Specific kinetic and potential energy (MJ/kg or scaled units)
  const kineticSpecific = 0.5 * v * v;
  const potentialSpecific = -mu / r;
  const totalSpecificEnergy = kineticSpecific + potentialSpecific;

  // Real energy in Joules (assuming craft mass)
  const kineticEnergy = kineticSpecific * craftMass;
  const potentialEnergy = potentialSpecific * craftMass;
  const totalEnergy = kineticEnergy + potentialEnergy;

  // Angular momentum vector h = r x v
  const hx = y * vz - z * vy;
  const hy = z * vx - x * vz;
  const hz = x * vy - y * vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  // Eccentricity vector: e = (v x h)/mu - r/|r|
  // v x h:
  const v_cross_hx = vy * hz - vz * hy;
  const v_cross_hy = vz * hx - vx * hz;
  const v_cross_hz = vx * hy - vy * hx;

  const ex = (v_cross_hx / mu) - (x / r);
  const ey = (v_cross_hy / mu) - (y / r);
  const ez = (v_cross_hz / mu) - (z / r);
  const eccentricity = Math.sqrt(ex * ex + ey * ey + ez * ez);

  // Circular and Escape velocities at current radius
  const vCirc = Math.sqrt(mu / r);
  const vEsc = Math.sqrt((2 * mu) / r);

  // Semi-major axis: a = -mu / (2 * epsilon)
  let semiMajorAxis = 0;
  let periapsis = 0;
  let apoapsis = Infinity;
  let period = Infinity;

  // Conic classification
  let orbitType = 'Elliptical Orbit';
  let orbitBadgeColor = '#3b82f6'; // Blue

  if (Math.abs(totalSpecificEnergy) < 1e-4) {
    // Parabolic orbit (e ~ 1)
    orbitType = 'Parabolic Escape';
    orbitBadgeColor = '#eab308'; // Amber
    semiMajorAxis = Infinity;
    periapsis = (h * h) / (2 * mu);
  } else if (totalSpecificEnergy < 0) {
    // Elliptical or Circular (e < 1)
    semiMajorAxis = -mu / (2 * totalSpecificEnergy);
    periapsis = semiMajorAxis * (1 - eccentricity);
    apoapsis = semiMajorAxis * (1 + eccentricity);

    // Period T = 2 * pi * sqrt(a^3 / mu)
    if (semiMajorAxis > 0) {
      period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
    }

    if (eccentricity < 0.015) {
      orbitType = 'Circular Orbit';
      orbitBadgeColor = '#10b981'; // Green
    } else if (periapsis < centralRadius) {
      orbitType = 'Sub-orbital (Re-entry)';
      orbitBadgeColor = '#ef4444'; // Red
    } else {
      orbitType = 'Elliptical Orbit';
      orbitBadgeColor = '#6366f1'; // Indigo
    }
  } else {
    // Hyperbolic orbit (e > 1, E > 0)
    orbitType = 'Hyperbolic Escape';
    orbitBadgeColor = '#f97316'; // Orange
    semiMajorAxis = -mu / (2 * totalSpecificEnergy); // negative for hyperbola
    periapsis = Math.abs(semiMajorAxis) * (eccentricity - 1);
    apoapsis = Infinity;
  }

  // Argument of periapsis direction in 2D (xy-plane)
  const periapsisAngle = Math.atan2(ey, ex);

  // Gravitational force magnitude: F = G * M * m / r^2 = mu * m / r^2
  const gravForce = (mu * craftMass) / (r * r);

  // Flight path angle (angle between velocity vector and local horizontal)
  const r_dot_v = x * vx + y * vy + z * vz;
  const flightPathAngleRad = Math.asin(Math.max(-1, Math.min(1, r_dot_v / (r * v))));
  const flightPathAngleDeg = (flightPathAngleRad * 180) / Math.PI;

  return {
    radius: r,
    altitude,
    velocity: v,
    vCirc,
    vEsc,
    eccentricity,
    semiMajorAxis,
    periapsis,
    apoapsis,
    period,
    totalSpecificEnergy,
    kineticEnergy,
    potentialEnergy,
    totalEnergy,
    angularMomentum: h,
    gravForce,
    flightPathAngleDeg,
    orbitType,
    orbitBadgeColor,
    periapsisAngle,
    eccentricityVector: [ex, ey, ez],
    unitPosition: [x / r, y / r, z / r],
    unitVelocity: [vx / v, vy / v, vz / v],
  };
}

/**
 * Calculates analytical trajectory points (conic curve) for rendering
 */
export function generateConicTrajectoryPoints(telemetry, mu, numPoints = 120) {
  if (!telemetry) return [];

  const { eccentricity: e, semiMajorAxis: a, periapsisAngle: omega, orbitType } = telemetry;
  const points = [];

  if (e < 1.0) {
    // Ellipse: r(theta) = a * (1 - e^2) / (1 + e * cos(theta))
    const p = a * (1 - e * e);
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const r_theta = p / (1 + e * Math.cos(theta));
      // Rotate by periapsis angle omega
      const angle = theta + omega;
      const x = r_theta * Math.cos(angle);
      const y = r_theta * Math.sin(angle);
      points.push({ x, y, z: 0 });
    }
  } else {
    // Hyperbola or Parabola: sample within true anomaly bounds
    const maxTheta = Math.acos(-1 / e) * 0.85; // Stay well away from asymptotes
    const p = Math.abs(a) * (e * e - 1);
    for (let i = -numPoints / 2; i <= numPoints / 2; i++) {
      const theta = (i / (numPoints / 2)) * maxTheta;
      const r_theta = p / (1 + e * Math.cos(theta));
      if (r_theta > 0 && r_theta < 100) {
        const angle = theta + omega;
        const x = r_theta * Math.cos(angle);
        const y = r_theta * Math.sin(angle);
        points.push({ x, y, z: 0 });
      }
    }
  }

  return points;
}

/**
 * Calculate Hohmann transfer parameters between circular orbits r1 and r2
 */
export function calculateHohmannTransfer(r1, r2, mu) {
  const v1 = Math.sqrt(mu / r1);
  const v2 = Math.sqrt(mu / r2);

  const a_transfer = (r1 + r2) / 2;
  const v_transfer_periapsis = Math.sqrt(mu * (2 / r1 - 1 / a_transfer));
  const v_transfer_apoapsis = Math.sqrt(mu * (2 / r2 - 1 / a_transfer));

  const deltaV1 = v_transfer_periapsis - v1;
  const deltaV2 = v2 - v_transfer_apoapsis;
  const totalDeltaV = Math.abs(deltaV1) + Math.abs(deltaV2);

  const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / mu);

  return {
    r1,
    r2,
    a_transfer,
    deltaV1,
    deltaV2,
    totalDeltaV,
    transferTimeSeconds,
    transferTimeMinutes: transferTimeSeconds / 60,
  };
}

/**
 * Formats time duration nicely
 */
export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '∞';
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours}h ${remMins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}
