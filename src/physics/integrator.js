// High Precision 4th-Order Runge-Kutta (RK4) Numerical Integrator for Multi-Body Gravitation

/**
 * Computes gravitational acceleration on a craft from all massive bodies
 * @param {Array<number>} pos - [x, y, z]
 * @param {Array<Object>} bodies - Array of celestial bodies [{ pos: [x,y,z], mass, mu }]
 * @returns {Array<number>} acceleration vector [ax, ay, az]
 */
export function getGravitationalAcceleration(pos, bodies) {
  let ax = 0;
  let ay = 0;
  let az = 0;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    const dx = b.pos[0] - pos[0];
    const dy = b.pos[1] - pos[1];
    const dz = b.pos[2] - pos[2];

    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);

    // Softening parameter to prevent division by zero near center
    const softenedDist = Math.max(0.1, dist);
    const forceFactor = b.mu / (softenedDist * softenedDist * softenedDist);

    ax += dx * forceFactor;
    ay += dy * forceFactor;
    az += dz * forceFactor;
  }

  return [ax, ay, az];
}

/**
 * 4th-order Runge-Kutta (RK4) step for orbital motion
 * @param {Array<number>} pos - current position [x, y, z]
 * @param {Array<number>} vel - current velocity [vx, vy, vz]
 * @param {Array<Object>} bodies - list of celestial bodies
 * @param {number} dt - time step in seconds
 * @returns {Object} { pos: [x, y, z], vel: [vx, vy, vz] }
 */
export function stepRK4(pos, vel, bodies, dt) {
  // k1
  const k1_v = vel;
  const k1_a = getGravitationalAcceleration(pos, bodies);

  // k2
  const p2 = [
    pos[0] + 0.5 * dt * k1_v[0],
    pos[1] + 0.5 * dt * k1_v[1],
    pos[2] + 0.5 * dt * k1_v[2]
  ];
  const v2 = [
    vel[0] + 0.5 * dt * k1_a[0],
    vel[1] + 0.5 * dt * k1_a[1],
    vel[2] + 0.5 * dt * k1_a[2]
  ];
  const k2_v = v2;
  const k2_a = getGravitationalAcceleration(p2, bodies);

  // k3
  const p3 = [
    pos[0] + 0.5 * dt * k2_v[0],
    pos[1] + 0.5 * dt * k2_v[1],
    pos[2] + 0.5 * dt * k2_v[2]
  ];
  const v3 = [
    vel[0] + 0.5 * dt * k2_a[0],
    vel[1] + 0.5 * dt * k2_a[1],
    vel[2] + 0.5 * dt * k2_a[2]
  ];
  const k3_v = v3;
  const k3_a = getGravitationalAcceleration(p3, bodies);

  // k4
  const p4 = [
    pos[0] + dt * k3_v[0],
    pos[1] + dt * k3_v[1],
    pos[2] + dt * k3_v[2]
  ];
  const v4 = [
    vel[0] + dt * k3_a[0],
    vel[1] + dt * k3_a[1],
    vel[2] + dt * k3_a[2]
  ];
  const k4_v = v4;
  const k4_a = getGravitationalAcceleration(p4, bodies);

  // Combine weighted slopes
  const newPos = [
    pos[0] + (dt / 6) * (k1_v[0] + 2 * k2_v[0] + 2 * k3_v[0] + k4_v[0]),
    pos[1] + (dt / 6) * (k1_v[1] + 2 * k2_v[1] + 2 * k3_v[1] + k4_v[1]),
    pos[2] + (dt / 6) * (k1_v[2] + 2 * k2_v[2] + 2 * k3_v[2] + k4_v[2]),
  ];

  const newVel = [
    vel[0] + (dt / 6) * (k1_a[0] + 2 * k2_a[0] + 2 * k3_a[0] + k4_a[0]),
    vel[1] + (dt / 6) * (k1_a[1] + 2 * k2_a[1] + 2 * k3_a[1] + k4_a[1]),
    vel[2] + (dt / 6) * (k1_a[2] + 2 * k2_a[2] + 2 * k3_a[2] + k4_a[2]),
  ];

  return { pos: newPos, vel: newVel };
}

/**
 * Apply orbital thruster impulse (Delta-V)
 * @param {Array<number>} pos - [x, y, z]
 * @param {Array<number>} vel - [vx, vy, vz]
 * @param {string} burnType - 'prograde' | 'retrograde' | 'radial_in' | 'radial_out'
 * @param {number} deltaVMagnitude - km/s
 * @returns {Array<number>} new velocity vector
 */
export function applyImpulse(pos, vel, burnType, deltaVMagnitude) {
  const [vx, vy, vz] = vel;
  const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (vMag < 1e-6) return vel;

  // Tangential unit vector (prograde direction)
  const proX = vx / vMag;
  const proY = vy / vMag;
  const proZ = vz / vMag;

  // Radial unit vector (from center outward)
  const [x, y, z] = pos;
  const rMag = Math.sqrt(x * x + y * y + z * z);
  const radX = x / rMag;
  const radY = y / rMag;
  const radZ = z / rMag;

  let dvX = 0, dvY = 0, dvZ = 0;

  switch (burnType) {
    case 'prograde':
      dvX = proX * deltaVMagnitude;
      dvY = proY * deltaVMagnitude;
      dvZ = proZ * deltaVMagnitude;
      break;
    case 'retrograde':
      dvX = -proX * deltaVMagnitude;
      dvY = -proY * deltaVMagnitude;
      dvZ = -proZ * deltaVMagnitude;
      break;
    case 'radial_out':
      dvX = radX * deltaVMagnitude;
      dvY = radY * deltaVMagnitude;
      dvZ = radZ * deltaVMagnitude;
      break;
    case 'radial_in':
      dvX = -radX * deltaVMagnitude;
      dvY = -radY * deltaVMagnitude;
      dvZ = -radZ * deltaVMagnitude;
      break;
    default:
      break;
  }

  return [vx + dvX, vy + dvY, vz + dvZ];
}
