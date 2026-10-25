# ORBITX — Interactive Orbital Mechanics Simulator 🚀🪐

> **ORBITX** is a browser-based, interactive 3D physics simulator designed to help students, educators, and space enthusiasts intuitively explore gravitational forces, orbital motion, escape velocity, and spacecraft trajectory mechanics in real time.

---

## 🌟 Why ORBITX?

Traditional physics education often teaches orbital mechanics through static diagrams and abstract equations ($F = G \frac{Mm}{r^2}$, $v_{esc} = \sqrt{\frac{2GM}{r}}$), making it difficult for students to build an intuitive mental model of how velocity, altitude, and gravitational pull interact.

**ORBITX bridges this gap** by offering a real-time, interactive laboratory where changing velocity, executing burns, and modifying planetary mass directly and visually transforms the trajectory of a spacecraft in 3D space.

---

## ✨ Core Features

### 1. 🪐 High-Precision 3D Physics Engine
- **Symplectic RK4 Integrator:** Employs 4th-Order Runge-Kutta numerical integration with adaptive sub-stepping, preserving energy and preventing numerical drift over long simulation spans.
- **Universal Gravitation & N-Body Support:** Simulates single-attractor systems as well as restricted 3-body systems (Earth-Moon-Spacecraft) for gravitational slingshots and Lagrange points.
- **Dynamic Conic Trajectory Solver:** Live analytical projection of orbital ellipses, parabolas, and hyperbolas based on state vectors ($\vec{r}, \vec{v}$).

### 2. 🎯 Mission Presets & Scenarios
1. **Circular Orbit (LEO):** Uniform circular motion demonstrating balance between gravitational acceleration and centrifugal tendency ($F_c = F_g$).
2. **Elliptical Orbit & Kepler's Laws:** Eccentric orbit with interactive **Equal-Area Sector Sweeping** visually proving Kepler's 2nd Law ($dA/dt = \text{const}$).
3. **Escape Velocity & Ballistics:** Comparison of suborbital ballistic arcs, circular orbits, parabolic trajectories ($e = 1$), and hyperbolic escape routes ($e > 1$).
4. **Hohmann Transfer to GEO:** Two-impulse transfer planner taking a craft from 300 km Low Earth Orbit to 35,786 km Geostationary Orbit with automated $\Delta v_1$ and $\Delta v_2$ calculators.
5. **Gravitational Slingshot (Flyby):** Steal orbital momentum from a moving Moon or Jupiter to fling the spacecraft into deep space without using extra fuel.
6. **Lagrange Equilibrium Points (3-Body):** Demonstrating the five gravitational balance points (L1, L2, L3, L4, L5).
7. **Custom Sandbox Mode:** Freeform laboratory allowing students to hold `Shift` and drag in space to launch custom satellites with customizable initial velocity vectors.

### 3. 📊 Flight Telemetry & Energy HUD
- **Live Telemetry:** Speed ($v$), Altitude ($h$), Distance from barycenter ($r$), Semi-major axis ($a$), Eccentricity ($e$), Periapsis ($r_p$), Apoapsis ($r_a$), and Orbital Period ($T$).
- **Dynamic Speed Gauge:** Color-coded velocity meter comparing current speed against local circular speed ($v_{circ}$) and escape speed ($v_{esc}$).
- **Energy Conservation Chart:** Rolling graph displaying Kinetic Energy ($E_k$), Potential Energy ($E_p$), and Total Mechanical Energy ($E = \text{const}$), verifying the law of conservation of mechanical energy.

### 4. 🔬 Live Equation Lab (Formula Inspector)
- **Real-Time Number Substitution:** As the craft moves, live numerical values are substituted directly into:
  - Newton's Law of Universal Gravitation: $F_g = G \frac{M m}{r^2}$
  - Vis-Viva Equation: $v^2 = \mu \left(\frac{2}{r} - \frac{1}{a}\right)$
  - Escape Velocity Formula: $v_{esc} = \sqrt{\frac{2GM}{r}}$
  - Kepler's Third Law: $\frac{T^2}{a^3} = \frac{4\pi^2}{GM}$

### 5. 🎮 Flight Academy Challenges & Quizzes
- Gamified missions including **Stable Circular Orbit**, **Target GEO Altitude**, **Break Free of Earth**, and **Eccentric Comet Orbits**.
- Automated objective verification with confetti celebrations upon mission completion.

---

## 🛠️ Technology Stack

- **Frontend & Rendering:** React 19, Three.js (WebGL 3D), Canvas 2D
- **Icons & Effects:** Lucide React, Canvas Confetti
- **Build Tool:** Vite
- **Styling:** Vanilla CSS design system with glassmorphism and dark mode aesthetics

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd "ORBITX – Interactive Orbital Mechanics Simulator"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser:
# http://localhost:5173
```

---

## 🌐 Free Deployment Guide

ORBITX is optimized to deploy free of cost to any modern static hosting platform:

### Option 1: GitHub Pages (Automated CI/CD Workflow)
A pre-configured GitHub Actions workflow is included at `.github/workflows/deploy.yml`:
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/orbitx.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository settings, go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build and publish the simulator to your free GitHub Pages URL!

*Manual deployment via `gh-pages`:*
```bash
npm run deploy
```

### Option 2: Vercel (1-Click Free Hosting)
A pre-configured `vercel.json` is included.
1. Install Vercel CLI (`npm i -g vercel`) or visit [vercel.com](https://vercel.com).
2. Connect your GitHub repository or run `vercel` in the project root.
3. Build command: `npm run build`, Output directory: `dist`.

### Option 3: Netlify (1-Click Free Hosting)
A pre-configured `netlify.toml` is included.
1. Connect repository at [netlify.com](https://netlify.com).
2. Build command: `npm run build`, Publish directory: `dist`.

---

## 🕹️ Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Play / Pause Simulation** | `Spacebar` or Bottom Play button |
| **Rotate 3D Camera** | Left Mouse Click + Drag |
| **Zoom In / Zoom Out** | Mouse Wheel / Touch Pinch |
| **Pan Camera** | Right Mouse Click + Drag |
| **Launch Custom Satellite** | Hold `Shift` + Left Click & Drag in space (Sandbox Mode) |
| **Adjust Simulation Speed** | Time Warp buttons (0.25x to 50x) |
| **Instant Circularization** | Thrusters Tab > Instant Circularization Burn |

---

## 📜 License

MIT License — Free to use for education, research, and open-source learning.
