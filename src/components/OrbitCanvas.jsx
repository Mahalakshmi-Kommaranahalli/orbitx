import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createEarthTexture,
  createMoonTexture,
  createJupiterTexture,
  createMarsTexture
} from './planetTextures';
import { generateConicTrajectoryPoints } from '../physics/orbitalMath';

export default function OrbitCanvas({
  craftState,
  secondaryBodyState,
  centralBodyConfig,
  telemetry,
  showVectors,
  showConicPath,
  showHistoricalTrail,
  showDistanceRings,
  showKeplerSectors,
  cameraMode, // 'free' | 'top_down' | 'follow_craft' | 'planet'
  isThrusting,
  keplerSectors,
  onLaunchNewCraft, // callback for sandbox click & drag
  isSandboxMode,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Mesh & Object refs
  const centralBodyMeshRef = useRef(null);
  const atmosphereMeshRef = useRef(null);
  const secondaryBodyMeshRef = useRef(null);
  const secondaryTrailLineRef = useRef(null);
  const craftGroupRef = useRef(null);
  const thrusterFlameRef = useRef(null);

  // Trajectory Lines
  const conicLineRef = useRef(null);
  const trailLineRef = useRef(null);
  const trailPositionsRef = useRef([]);

  // Vectors
  const velocityArrowRef = useRef(null);
  const gravityArrowRef = useRef(null);

  // Markers
  const periapsisMarkerRef = useRef(null);
  const apoapsisMarkerRef = useRef(null);

  // Kepler sectors group
  const keplerGroupRef = useRef(null);

  // Distance rings group
  const ringsGroupRef = useRef(null);

  // Mouse interaction for custom camera orbit & sandbox click-to-launch
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0.6, phi: 0.8, radius: 28 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Sandbox drag-to-launch state
  const isAimingLaunchRef = useRef(false);
  const launchStartPointRef = useRef(null);
  const launchVectorArrowRef = useRef(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712'); // Deep space dark slate

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 24, 24);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 250 + Math.random() * 250;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);

      // Varied star colors (blue-white to warm amber)
      const colorType = Math.random();
      if (colorType > 0.8) {
        starColors[i] = 0.7; starColors[i + 1] = 0.85; starColors[i + 2] = 1.0;
      } else if (colorType > 0.6) {
        starColors[i] = 1.0; starColors[i + 1] = 0.9; starColors[i + 2] = 0.7;
      } else {
        starColors[i] = 0.9; starColors[i + 1] = 0.95; starColors[i + 2] = 1.0;
      }
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(50, 30, 40);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-50, -20, -30);
    scene.add(rimLight);

    // 6. Central Body
    const planetRadius = centralBodyConfig.radius || 6.371;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 48, 48);
    const planetTex = createEarthTexture();
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.65,
      metalness: 0.1,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planetMesh);
    centralBodyMeshRef.current = planetMesh;

    // Atmospheric Glow Halo
    const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.045, 40, 40);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(centralBodyConfig.atmosphereColor || '#38bdf8'),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);
    atmosphereMeshRef.current = atmoMesh;

    // 7. Spacecraft 3D Mesh
    const craftGroup = new THREE.Group();

    // Probe body (Hexagonal gold bus)
    const busGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.45, 6);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold foil
      roughness: 0.3,
      metalness: 0.85,
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.rotation.x = Math.PI / 2;
    craftGroup.add(busMesh);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(1.4, 0.04, 0.38);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep blue photovoltaic
      roughness: 0.2,
      metalness: 0.5,
    });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    craftGroup.add(panelMesh);

    // Parabolic High-Gain Antenna
    const dishGeo = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.set(0, 0, 0.28);
    dishMesh.rotation.x = Math.PI;
    craftGroup.add(dishMesh);

    // Thruster Engine Nozzle
    const nozzleGeo = new THREE.ConeGeometry(0.12, 0.2, 12, 1, true);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.set(0, 0, -0.28);
    nozzleMesh.rotation.x = -Math.PI / 2;
    craftGroup.add(nozzleMesh);

    // Thruster Flame Plume (visible during burns)
    const flameGeo = new THREE.ConeGeometry(0.15, 0.65, 12);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0, -0.65);
    flameMesh.rotation.x = Math.PI / 2;
    craftGroup.add(flameMesh);
    thrusterFlameRef.current = flameMesh;

    scene.add(craftGroup);
    craftGroupRef.current = craftGroup;

    // 8. Trajectory Lines
    // Conic Section Predicted Orbit Line
    const conicGeo = new THREE.BufferGeometry();
    const conicMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const conicLine = new THREE.Line(conicGeo, conicMat);
    scene.add(conicLine);
    conicLineRef.current = conicLine;

    // Historical Trail Line
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xa855f7, // Violet glow
      linewidth: 1.5,
      transparent: true,
      opacity: 0.55
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);
    trailLineRef.current = trailLine;

    // 9. Vectors (Velocity & Gravity)
    const velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      3,
      0x10b981, // Emerald green
      0.6,
      0.35
    );
    scene.add(velArrow);
    velocityArrowRef.current = velArrow;

    const gravArrow = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      3,
      0xf43f5e, // Crimson red
      0.6,
      0.35
    );
    scene.add(gravArrow);
    gravityArrowRef.current = gravArrow;

    // 10. Apoapsis and Periapsis Markers
    const markerGeo = new THREE.OctahedronGeometry(0.35);
    const peMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Periapsis Green
    const apMat = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // Apoapsis Amber

    const peMesh = new THREE.Mesh(markerGeo, peMat);
    scene.add(peMesh);
    periapsisMarkerRef.current = peMesh;

    const apMesh = new THREE.Mesh(markerGeo, apMat);
    scene.add(apMesh);
    apoapsisMarkerRef.current = apMesh;

    // 11. Distance Reference Rings Group
    const ringsGroup = new THREE.Group();
    const ringRadii = [
      { r: planetRadius + 0.3, label: 'LEO 300km', color: 0x38bdf8 },
      { r: planetRadius + 2.0, label: 'LEO 2000km', color: 0x64748b },
      { r: planetRadius + 20.2, label: 'GPS MEO', color: 0x64748b },
      { r: planetRadius + 35.786, label: 'GEO 35,786km', color: 0xec4899 },
    ];
    ringRadii.forEach(({ r, color }) => {
      const ringGeo = new THREE.RingGeometry(r - 0.06, r + 0.06, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsGroup.add(ringMesh);
    });
    // Add equatorial grid disc
    const gridHelper = new THREE.PolarGridHelper(50, 10, 8, 64, 0x1e293b, 0x0f172a);
    gridHelper.rotation.x = Math.PI / 2;
    ringsGroup.add(gridHelper);
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    // 12. Kepler Sectors Group
    const keplerGroup = new THREE.Group();
    scene.add(keplerGroup);
    keplerGroupRef.current = keplerGroup;

    // 13. Secondary Body (Moon/Jupiter)
    const secBodyGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const secBodyTex = createMoonTexture();
    const secBodyMat = new THREE.MeshStandardMaterial({
      map: secBodyTex,
      roughness: 0.8
    });
    const secBodyMesh = new THREE.Mesh(secBodyGeo, secBodyMat);
    secBodyMesh.visible = false;
    scene.add(secBodyMesh);
    secondaryBodyMeshRef.current = secBodyMesh;

    // Secondary body orbit ring
    const secTrailGeo = new THREE.BufferGeometry();
    const secTrailMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
      dashSize: 1,
      gapSize: 0.5
    });
    const secTrailLine = new THREE.Line(secTrailGeo, secTrailMat);
    scene.add(secTrailLine);
    secondaryTrailLineRef.current = secTrailLine;

    // 14. Interactive drag-to-launch arrow for Sandbox mode
    const launchArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0x38bdf8,
      0.6,
      0.3
    );
    launchArrow.visible = false;
    scene.add(launchArrow);
    launchVectorArrowRef.current = launchArrow;

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate planet slowly on its axis
      if (centralBodyMeshRef.current) {
        centralBodyMeshRef.current.rotation.y += 0.001;
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Planet Texture & Atmosphere when Central Body changes
  useEffect(() => {
    if (!centralBodyMeshRef.current || !atmosphereMeshRef.current) return;

    let newTexture;
    if (centralBodyConfig.id === 'earth') newTexture = createEarthTexture();
    else if (centralBodyConfig.id === 'moon') newTexture = createMoonTexture();
    else if (centralBodyConfig.id === 'mars') newTexture = createMarsTexture();
    else if (centralBodyConfig.id === 'jupiter') newTexture = createJupiterTexture();
    else newTexture = createEarthTexture();

    centralBodyMeshRef.current.material.map = newTexture;
    centralBodyMeshRef.current.material.needsUpdate = true;

    // Update geometry radius
    const r = centralBodyConfig.radius || 6.371;
    centralBodyMeshRef.current.geometry.dispose();
    centralBodyMeshRef.current.geometry = new THREE.SphereGeometry(r, 48, 48);

    atmosphereMeshRef.current.geometry.dispose();
    atmosphereMeshRef.current.geometry = new THREE.SphereGeometry(r * 1.045, 40, 40);
    atmosphereMeshRef.current.material.color = new THREE.Color(centralBodyConfig.atmosphereColor || '#38bdf8');
  }, [centralBodyConfig.id, centralBodyConfig.radius]);

  // Update Secondary Body (Moon/Jupiter)
  useEffect(() => {
    if (!secondaryBodyMeshRef.current) return;

    if (secondaryBodyState && secondaryBodyState.active) {
      secondaryBodyMeshRef.current.visible = true;
      secondaryBodyMeshRef.current.position.set(
        secondaryBodyState.pos[0],
        secondaryBodyState.pos[1],
        secondaryBodyState.pos[2]
      );
      const r = secondaryBodyState.radius || 1.8;
      secondaryBodyMeshRef.current.scale.set(r, r, r);

      // Update secondary orbit trail circle
      if (secondaryTrailLineRef.current && secondaryBodyState.orbitRadius) {
        const orbitR = secondaryBodyState.orbitRadius;
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          pts.push(new THREE.Vector3(orbitR * Math.cos(a), orbitR * Math.sin(a), 0));
        }
        secondaryTrailLineRef.current.geometry.setFromPoints(pts);
        secondaryTrailLineRef.current.visible = true;
      }
    } else {
      secondaryBodyMeshRef.current.visible = false;
      if (secondaryTrailLineRef.current) {
        secondaryTrailLineRef.current.visible = false;
      }
    }
  }, [secondaryBodyState]);

  // Synchronize Spacecraft Position, Orientation, Vectors, and Trails
  useEffect(() => {
    if (!craftGroupRef.current || !craftState) return;

    const [x, y, z] = craftState.pos;
    const [vx, vy, vz] = craftState.vel;

    // 1. Position craft
    craftGroupRef.current.position.set(x, y, z);

    // Align spacecraft forward axis with velocity vector
    const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (vMag > 1e-4) {
      const vDir = new THREE.Vector3(vx / vMag, vy / vMag, vz / vMag);
      const targetLook = new THREE.Vector3(x, y, z).add(vDir);
      craftGroupRef.current.lookAt(targetLook);
    }

    // 2. Thruster Flame
    if (thrusterFlameRef.current) {
      thrusterFlameRef.current.material.opacity = isThrusting ? 0.95 : 0.0;
      if (isThrusting) {
        // slight flicker
        const flicker = 0.8 + Math.random() * 0.4;
        thrusterFlameRef.current.scale.set(flicker, flicker, flicker);
      }
    }

    // 3. Historical Trail
    if (showHistoricalTrail && trailLineRef.current) {
      const history = trailPositionsRef.current;
      history.push(new THREE.Vector3(x, y, z));
      if (history.length > 500) history.shift();

      trailLineRef.current.geometry.dispose();
      trailLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(history);
      trailLineRef.current.visible = true;
    } else if (trailLineRef.current) {
      trailLineRef.current.visible = false;
    }

    // 4. Conic Section Trajectory Preview
    if (showConicPath && conicLineRef.current && telemetry) {
      const pts = generateConicTrajectoryPoints(telemetry, centralBodyConfig.mu);
      if (pts.length > 1) {
        const v3Points = pts.map(p => new THREE.Vector3(p.x, p.y, p.z));
        conicLineRef.current.geometry.dispose();
        conicLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(v3Points);

        // Adjust color based on orbit type
        conicLineRef.current.material.color.set(telemetry.orbitBadgeColor || '#00f0ff');
        conicLineRef.current.visible = true;
      }
    } else if (conicLineRef.current) {
      conicLineRef.current.visible = false;
    }

    // 5. Vectors (Velocity & Gravity)
    if (showVectors && velocityArrowRef.current && gravityArrowRef.current) {
      velocityArrowRef.current.visible = true;
      gravityArrowRef.current.visible = true;

      // Velocity Arrow
      if (vMag > 1e-4) {
        velocityArrowRef.current.position.set(x, y, z);
        velocityArrowRef.current.setDirection(new THREE.Vector3(vx / vMag, vy / vMag, vz / vMag));
        velocityArrowRef.current.setLength(Math.min(6, Math.max(1.5, vMag * 0.4)));
      }

      // Gravitational Force Arrow (points straight towards central body at [0,0,0])
      const rMag = Math.sqrt(x * x + y * y + z * z);
      if (rMag > 1e-4) {
        gravityArrowRef.current.position.set(x, y, z);
        gravityArrowRef.current.setDirection(new THREE.Vector3(-x / rMag, -y / rMag, -z / rMag));
        const forceVisualScale = Math.min(6, Math.max(1.2, (centralBodyConfig.mu / (rMag * rMag)) * 0.3));
        gravityArrowRef.current.setLength(forceVisualScale);
      }
    } else if (velocityArrowRef.current && gravityArrowRef.current) {
      velocityArrowRef.current.visible = false;
      gravityArrowRef.current.visible = false;
    }

    // 6. Apoapsis and Periapsis Markers
    if (telemetry && telemetry.eccentricity < 1.0 && telemetry.periapsis > 0 && periapsisMarkerRef.current && apoapsisMarkerRef.current) {
      const omega = telemetry.periapsisAngle || 0;
      // Periapsis location
      const peX = telemetry.periapsis * Math.cos(omega);
      const peY = telemetry.periapsis * Math.sin(omega);
      periapsisMarkerRef.current.position.set(peX, peY, 0);
      periapsisMarkerRef.current.visible = true;

      // Apoapsis location
      const apX = telemetry.apoapsis * Math.cos(omega + Math.PI);
      const apY = telemetry.apoapsis * Math.sin(omega + Math.PI);
      apoapsisMarkerRef.current.position.set(apX, apY, 0);
      apoapsisMarkerRef.current.visible = true;
    } else {
      if (periapsisMarkerRef.current) periapsisMarkerRef.current.visible = false;
      if (apoapsisMarkerRef.current) apoapsisMarkerRef.current.visible = false;
    }
  }, [craftState, isThrusting, showVectors, showConicPath, showHistoricalTrail, telemetry, centralBodyConfig.mu]);

  // Update Kepler's 2nd Law Sector Sweeps
  useEffect(() => {
    if (!keplerGroupRef.current) return;
    const group = keplerGroupRef.current;

    // Clear previous sectors
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }

    if (!showKeplerSectors || !keplerSectors || keplerSectors.length === 0) return;

    // Render each equal-time sector as a transparent colored fan
    keplerSectors.forEach((sector, idx) => {
      const points = [new THREE.Vector3(0, 0, 0)]; // Focus (central body)
      sector.arcPoints.forEach(p => {
        points.push(new THREE.Vector3(p[0], p[1], p[2] || 0));
      });

      // Construct triangle fan geometry
      const vertices = [];
      for (let i = 1; i < points.length - 1; i++) {
        vertices.push(
          points[0].x, points[0].y, points[0].z,
          points[i].x, points[i].y, points[i].z,
          points[i + 1].x, points[i + 1].y, points[i + 1].z
        );
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const colors = [0x00f0ff, 0xf59e0b, 0x10b981, 0xec4899, 0x8b5cf6];
      const mat = new THREE.MeshBasicMaterial({
        color: colors[idx % colors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.38,
      });
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
    });
  }, [showKeplerSectors, keplerSectors]);

  // Visibility of Distance Rings
  useEffect(() => {
    if (ringsGroupRef.current) {
      ringsGroupRef.current.visible = showDistanceRings;
    }
  }, [showDistanceRings]);

  // Camera Management & Modes
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (cameraMode === 'top_down') {
      camera.position.set(0, 0, 48);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    } else if (cameraMode === 'planet') {
      camera.position.set(0, 18, 18);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
    } else if (cameraMode === 'follow_craft' && craftState) {
      const [x, y, z] = craftState.pos;
      camera.position.set(x + 5, y + 5, z + 6);
      camera.up.set(0, 0, 1);
      camera.lookAt(x, y, z);
    } else {
      // Free orbit mode
      const { theta, phi, radius } = cameraAngleRef.current;
      const cx = radius * Math.sin(phi) * Math.sin(theta);
      const cy = radius * Math.cos(phi);
      const cz = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(cx, cy, cz);
      camera.up.set(0, 0, 1);
      camera.lookAt(cameraTargetRef.current);
    }
  }, [cameraMode, craftState]);

  // Mouse & Touch Orbit Controls / Sandbox Aim-and-Launch
  const handleMouseDown = (e) => {
    if (e.button === 2) {
      isRightDraggingRef.current = true;
    } else if (e.button === 0) {
      if (isSandboxMode && e.shiftKey) {
        // Shift + Click in Sandbox initiates custom satellite launch vector
        isAimingLaunchRef.current = true;
        const rect = mountRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Project ray to z=0 orbital plane
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        launchStartPointRef.current = intersection;
        if (launchVectorArrowRef.current) {
          launchVectorArrowRef.current.position.copy(intersection);
          launchVectorArrowRef.current.visible = true;
        }
        return;
      }
      isDraggingRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    if (isAimingLaunchRef.current && launchStartPointRef.current && cameraRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const currentPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, currentPoint);

      const dragVector = new THREE.Vector3().subVectors(currentPoint, launchStartPointRef.current);
      const length = dragVector.length();
      if (launchVectorArrowRef.current && length > 0.1) {
        launchVectorArrowRef.current.setDirection(dragVector.clone().normalize());
        launchVectorArrowRef.current.setLength(Math.min(12, length));
      }
      return;
    }

    if (isDraggingRef.current && cameraMode === 'free') {
      cameraAngleRef.current.theta += deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraAngleRef.current.phi + deltaY * 0.008));

      const { theta, phi, radius } = cameraAngleRef.current;
      const cx = radius * Math.sin(phi) * Math.sin(theta);
      const cy = radius * Math.cos(phi);
      const cz = radius * Math.sin(phi) * Math.cos(theta);

      if (cameraRef.current) {
        cameraRef.current.position.set(cx, cy, cz);
        cameraRef.current.lookAt(cameraTargetRef.current);
      }
    } else if (isRightDraggingRef.current) {
      // Pan target
      cameraTargetRef.current.x -= deltaX * 0.04;
      cameraTargetRef.current.y += deltaY * 0.04;
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e) => {
    if (isAimingLaunchRef.current && launchStartPointRef.current && onLaunchNewCraft) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const currentPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, currentPoint);

      const velVector = new THREE.Vector3().subVectors(currentPoint, launchStartPointRef.current).multiplyScalar(1.2);
      onLaunchNewCraft(
        [launchStartPointRef.current.x, launchStartPointRef.current.y, 0],
        [velVector.x, velVector.y, 0]
      );

      if (launchVectorArrowRef.current) {
        launchVectorArrowRef.current.visible = false;
      }
      isAimingLaunchRef.current = false;
      launchStartPointRef.current = null;
    }

    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    cameraAngleRef.current.radius = Math.max(8, Math.min(180, cameraAngleRef.current.radius * zoomFactor));

    if (cameraMode === 'top_down') {
      cameraRef.current.position.z = cameraAngleRef.current.radius;
    } else if (cameraMode === 'free') {
      const { theta, phi, radius } = cameraAngleRef.current;
      cameraRef.current.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      cameraRef.current.lookAt(cameraTargetRef.current);
    }
  };

  return (
    <div
      ref={mountRef}
      id="orbit-canvas-container"
      className="orbit-canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Floating Canvas Badges */}
      <div className="canvas-overlay-badges">
        <div className="badge-pill">
          <span className="dot pulse-emerald"></span>
          <span>RK4 Symplectic Integration</span>
        </div>
        {telemetry && (
          <div className="badge-pill" style={{ borderColor: telemetry.orbitBadgeColor }}>
            <span className="dot" style={{ background: telemetry.orbitBadgeColor }}></span>
            <span>{telemetry.orbitType}</span>
          </div>
        )}
      </div>

      {isSandboxMode && (
        <div className="sandbox-hint-badge">
          💡 <strong>Tip:</strong> Hold <kbd>Shift</kbd> + click & drag anywhere in space to launch a custom satellite!
        </div>
      )}
    </div>
  );
}
