// Procedural High-Resolution Texture Generators for Celestial Bodies in ORBITX
import * as THREE from 'three';

/**
 * Generates procedural canvas texture for Earth with continents, oceans, and atmosphere
 */
export function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep Ocean Blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0c2340');
  oceanGrad.addColorStop(0.5, '#1e3a8a');
  oceanGrad.addColorStop(1, '#0c2340');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Procedural stylized continents
  ctx.fillStyle = '#15803d'; // Green landmasses
  const seedContinents = [
    { x: 260, y: 160, rx: 90, ry: 70 }, // North America
    { x: 330, y: 320, rx: 65, ry: 100 }, // South America
    { x: 530, y: 170, rx: 80, ry: 55 }, // Europe
    { x: 550, y: 280, rx: 95, ry: 95 }, // Africa
    { x: 720, y: 180, rx: 140, ry: 90 }, // Asia
    { x: 820, y: 350, rx: 60, ry: 50 }, // Australia
    { x: 500, y: 470, rx: 400, ry: 35 }, // Antarctica
  ];

  for (const c of seedContinents) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Continent edge details
    ctx.fillStyle = '#166534';
    for (let i = 0; i < 8; i++) {
      const offsetX = (Math.sin(i * 1.7) * c.rx * 0.7);
      const offsetY = (Math.cos(i * 2.3) * c.ry * 0.7);
      ctx.beginPath();
      ctx.arc(c.x + offsetX, c.y + offsetY, c.rx * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#15803d';
  }

  // Ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(512, 10, 200, 0, Math.PI * 2);
  ctx.arc(512, 502, 220, 0, Math.PI * 2);
  ctx.fill();

  // Swirling cloud belts
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (let i = 0; i < 16; i++) {
    const cy = 60 + i * 26;
    ctx.beginPath();
    ctx.ellipse(300 + (i * 45) % 600, cy, 140, 16, (i * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural texture for Moon
 */
export function createMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 512, 256);

  // Maria (dark basalt plains)
  ctx.fillStyle = '#334155';
  const maria = [
    { x: 140, y: 100, r: 45 },
    { x: 210, y: 80, r: 55 },
    { x: 190, y: 160, r: 60 },
    { x: 380, y: 110, r: 40 },
  ];
  for (const m of maria) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact craters
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 35; i++) {
    const cx = (i * 47) % 512;
    const cy = (i * 31) % 256;
    const cr = 4 + (i % 7) * 2.5;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural texture for Jupiter bands
 */
export function createJupiterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const bands = [
    '#78350f', '#b45309', '#fde68a', '#d97706', '#92400e',
    '#fef3c7', '#b45309', '#78350f', '#fde68a', '#d97706',
    '#92400e', '#fef3c7', '#78350f'
  ];

  const bandH = 256 / bands.length;
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    ctx.fillRect(0, i * bandH, 512, bandH + 2);
  }

  // Great Red Spot
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.ellipse(320, 160, 36, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural texture for Mars
 */
export function createMarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#c2410c';
  ctx.fillRect(0, 0, 512, 256);

  // Darker volcanic regions (Syrtis Major)
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.ellipse(230, 120, 70, 45, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice cap
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(256, 10, 50, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}
