// Physical and Astronomical Constants for ORBITX Simulator

// Standard Gravitational constant in m^3 kg^-1 s^-2
export const G_REAL = 6.67430e-11;

// For visual and numerical stability in browser, we use a scaled system:
// Distance scale: 1 unit = 1,000 km (1e6 m)
// Mass scale: 1 unit = 1e22 kg (Earth = ~597.2 units)
// Time scale: 1 second simulation time can correspond to real minutes/hours via timeWarp.
// In our scaled coordinates:
// G_SCALED is chosen such that real-world orbital velocities (~7.8 km/s for LEO)
// and orbital periods (~90 min for LEO) map naturally to smooth 60fps animation.
export const G = 398.6004418; // Standard gravitational parameter mu_earth in scaled units (10^12 m^3/s^2 equivalent)

// Celestial Bodies Preset Data (Mass in 1e22 kg, Radius in 1000 km)
export const BODIES = {
  earth: {
    id: 'earth',
    name: 'Earth',
    mass: 597.2, // 5.972e24 kg
    radius: 6.371, // 6,371 km
    color: '#2563eb',
    atmosphereColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    description: 'Home planet. Perfect for demonstrating LEO, Geostationary orbits, and atmospheric reentry.',
    mu: 398.6, // G * M (km^3 / s^2) * 1e-3
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    mass: 7.342, // 7.342e22 kg
    radius: 1.737, // 1,737 km
    color: '#94a3b8',
    atmosphereColor: '#cbd5e1',
    glowColor: 'rgba(203, 213, 225, 0.2)',
    description: 'Earth\'s natural satellite. Ideal for gravity assist / slingshot demonstrations and Lagrange points.',
    mu: 4.90,
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    mass: 64.17, // 6.417e23 kg
    radius: 3.389, // 3,389 km
    color: '#e11d48',
    atmosphereColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.3)',
    description: 'The Red Planet. Lower surface gravity (~3.72 m/s²) and thinner atmosphere.',
    mu: 42.82,
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    mass: 18982.0, // 1.898e27 kg
    radius: 69.911, // 69,911 km
    color: '#d97706',
    atmosphereColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Gas giant with immense gravitational well. Ideal for hyperbolic slingshots.',
    mu: 126686.0,
  },
  custom: {
    id: 'custom',
    name: 'Custom Planet',
    mass: 500.0,
    radius: 6.0,
    color: '#8b5cf6',
    atmosphereColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    description: 'Configurable alien world with user-defined mass, density, and gravitational strength.',
    mu: 334.0,
  }
};

// Common Orbital Altitudes around Earth (in km)
export const ALTITUDES = {
  LEO_LOW: 300,        // International Space Station ~420km
  LEO_HIGH: 2000,
  GPS_MEO: 20200,      // GPS constellation
  GEO: 35786,          // Geostationary Orbit (42,164 km from Earth center)
  LUNAR_ORBIT: 384400, // Distance to Moon
};

// Simulation presets
export const PRESETS = [
  {
    id: 'circular_leo',
    name: 'Circular Orbit (LEO)',
    category: 'Fundamentals',
    bodyId: 'earth',
    craftPosition: [7.0, 0, 0], // ~630 km altitude
    craftVelocity: [0, 7.54, 0], // exact circular speed v = sqrt(GM/r)
    description: 'Uniform circular motion where gravitational force exactly balances centrifugal tendency: Fc = Fg.',
    tags: ['Circular', 'LEO', 'Kepler 1st'],
  },
  {
    id: 'kepler_ellipse',
    name: 'Elliptical Orbit & Kepler\'s Laws',
    category: 'Kepler\'s Laws',
    bodyId: 'earth',
    craftPosition: [7.2, 0, 0],
    craftVelocity: [0, 9.2, 0], // higher than circular -> eccentric ellipse
    description: 'Spacecraft traces an ellipse with Earth at one focus. Observes Kepler\'s 2nd Law (equal area in equal time).',
    tags: ['Elliptical', 'Apogee/Perigee', 'Kepler 2nd'],
  },
  {
    id: 'escape_velocity',
    name: 'Escape Velocity & Conics',
    category: 'Escape & Conics',
    bodyId: 'earth',
    craftPosition: [7.0, 0, 0],
    craftVelocity: [0, 10.66, 0], // v_esc = sqrt(2GM/r) = ~10.66 km/s
    description: 'Parabolic & hyperbolic trajectories. Total mechanical energy reaches or exceeds zero, escaping Earth permanently.',
    tags: ['Escape Velocity', 'Hyperbola', 'Energy'],
  },
  {
    id: 'hohmann_transfer',
    name: 'Hohmann Transfer to GEO',
    category: 'Orbital Transfers',
    bodyId: 'earth',
    craftPosition: [7.0, 0, 0], // LEO (300 km)
    craftVelocity: [0, 7.54, 0],
    targetRadius: 42.164, // GEO radius
    description: 'The most fuel-efficient two-impulse orbital transfer from Low Earth Orbit to Geostationary Orbit.',
    tags: ['Maneuver', 'Hohmann', 'Delta-V'],
  },
  {
    id: 'lunar_slingshot',
    name: 'Gravitational Slingshot (Flyby)',
    category: 'Gravity Assist',
    bodyId: 'earth',
    secondaryBody: {
      name: 'Moon',
      mass: 7.342 * 3.5, // slightly amplified for easy visual classroom demonstration
      radius: 2.2,
      orbitRadius: 28.0,
      orbitSpeed: 3.7,
      color: '#cbd5e1',
    },
    craftPosition: [7.2, -18.0, 0],
    craftVelocity: [3.8, 6.2, 0],
    description: 'Use the moving gravitational field of the Moon to bend your trajectory and gain orbital momentum for free!',
    tags: ['Slingshot', '3-Body', 'Voyager'],
  },
  {
    id: 'lagrange_points',
    name: 'Lagrange Equilibrium (3-Body)',
    category: 'Lagrange Points',
    bodyId: 'earth',
    secondaryBody: {
      name: 'Moon',
      mass: 70.0,
      radius: 2.5,
      orbitRadius: 32.0,
      orbitSpeed: 3.5,
      color: '#cbd5e1',
    },
    craftPosition: [26.0, 0, 0], // Near L1 point
    craftVelocity: [0, 2.85, 0],
    description: 'Explore the 5 gravitational balance points (L1, L2, L3, L4, L5) where gravitational forces and centrifugal force cancel out.',
    tags: ['Lagrange L1-L5', 'Chaos', 'Space Telescopes'],
  },
];
