// ExtensionBoardClear's shared physics and parts: Indian mains numbers, flexible-cord tables, a
// simple thermal model of a cord (straight, coiled, covered), the board's fuse and thermal
// breaker, the wall MCB (same model as MCBClear), the metal-oxide varistor, and 3D builders for a
// generic extension board, a three-pin plug top, cords and chart boards. Scale: 1 unit = 50 mm.
// No brand shapes or logos: every part is a generic one.
import { THREE, M, box, tube, canvasTexture, clamp } from './kit.js';

// ---------------------------------------------------------------- mains
// India: 230 V, 50 Hz single phase (IS 12360). Peak of the sine wave: 230 × √2 ≈ 325 V.
export const MAINS = 230;
export const PEAK = MAINS * Math.SQRT2;
// Wall circuit, same figures as MCBClear and KirchhoffClear: supply 0.35 Ω (assumed typical city
// value), 15 m of 2.5 mm² copper each way at 7.41 mΩ/m (IEC 60228), behind a C16 MCB.
export const Z_SUPPLY = 0.35, R_WALL = 2 * 15 * 0.00741;

// ---------------------------------------------------------------- flexible cords
// Three-core PVC flexible cord (IS 694; IEC 60227 type 53). Resistance: IEC 60228 class 5
// (flexible) plain copper, maximum at 20 °C: 0.75 mm² 26.0, 1.0 mm² 19.5, 1.5 mm² 13.3 Ω/km.
// Current rating of flexible cords (the pairing used by plug and appliance standards, e.g.
// BS 7671 Table 4F3A): 0.75 mm² 6 A, 1.0 mm² 10 A, 1.5 mm² 16 A. Outer diameters are typical
// values for three-core sheathed cord (about 6.8, 7.2 and 8.4 mm): they vary by maker.
// g: heat conductance from the two loaded conductors out through the PVC to the sheath surface,
// W/m·K, from PVC's conductivity of about 0.17 W/m·K across about 1.4 mm (illustrative).
export const CORDS = {
  0.75: { ohm: 0.026, amps: 6, od: 0.0068, g: 1.2 },
  1: { ohm: 0.0195, amps: 10, od: 0.0072, g: 1.35 },
  1.5: { ohm: 0.0133, amps: 16, od: 0.0084, g: 1.6 },
};
export const SIZES = [0.75, 1, 1.5];
export const T_AMB = 30;          // °C: a warm Indian room
export const T_PVC = 70;          // °C: the conductor limit for ordinary PVC insulation (IS 694)
const ALPHA = 0.00393;            // per K: copper's resistance rises with temperature
const H_AIR = 10;                 // W/m²K: still air, convection plus radiation (as in OhmsLawClear)
const H_CARPET = 3.5;             // W/m²K: under a rug, where most of the surface cannot shed heat (illustrative)

// Steady conductor temperature of a cord carrying I amps in two cores.
// Heat per metre P = 2 I² R(T); it leaves through the PVC (1/g) and then the surface (1/hπD).
// With R(T) = R20 (1 + α (T − 20)) the balance T = Ta + P K solves in closed form.
function settle(c, amb) {           // c = heat at 20 °C × thermal resistance, in K
  const k = c * ALPHA;
  if (k >= 0.9) return 500;         // thermal runaway: hotter copper resists more and heats more
  return Math.min(500, (amb + c * (1 - 20 * ALPHA)) / (1 - k));
}
// Reel model (illustrative): L metres wound on a drum. All the heat of the whole length must leave
// through the drum's outer surface, A = 0.04 + 0.0024 L m² (0.10 m² for a 25 m reel), and the middle
// of the winding sits about 13% hotter than its surface (PVC and trapped air conduct poorly).
const reelK = (L) => 1.13 / (H_AIR * (0.04 + 0.0024 * L));
export function cordHeat(I, size, L = 3, lay = 'open', amb = T_AMB) {
  const c = CORDS[size], P20 = 2 * I * I * c.ohm;
  const K = lay === 'coil' ? L * reelK(L) : 1 / ((lay === 'carpet' ? H_CARPET : H_AIR) * Math.PI * c.od) + 1 / c.g;
  const T = settle(P20 * K, amb);
  const ohmHot = c.ohm * (1 + ALPHA * (T - 20));
  const R = 2 * L * ohmHot;                        // out and back
  return { T, R, drop: I * R, watts: I * I * R, perM: 2 * I * I * ohmHot };
}
// The largest current that keeps the conductor at or below 70 °C.
export function safeAmps(size, L = 3, lay = 'open') {
  let lo = 0, hi = 60;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (cordHeat(m, size, L, lay).T > T_PVC) hi = m; else lo = m; }
  return lo;
}
// How long a straight cord in open air (from 30 °C) takes to get too hot: two heat stores (the two
// loaded copper cores; then the PVC and the idle earth core) joined by g, cooled by h π D.
// Copper 8,960 kg/m³ × 385 J/kg·K; PVC about 1,400 kg/m³ × 1,000 J/kg·K.
// "Too hot" follows the wiring rules: 70 °C for anything that lasts, but up to 160 °C is allowed
// for PVC in a fault cleared within 5 s (IEC 60364-4-43). So: the time to 160 °C if that is under
// 5 s, otherwise the time to 70 °C (and not less than 5 s).
export const T_FAULT = 160;
const memo = new Map();
export function cordTime(I, size) {
  const key = size + '|' + Math.round(Math.log(I) * 60);
  if (memo.has(key)) return memo.get(key);
  const c = CORDS[size], A = size * 1e-6;
  const C1 = 2 * A * 8960 * 385, C2 = (Math.PI * (c.od / 2) ** 2 - 3 * A) * 1.4e6 + A * 8960 * 385;
  const G2 = H_AIR * Math.PI * c.od;
  let T1 = T_AMB, T2 = T_AMB, t = 0, t70 = Infinity, out = Infinity;
  if (cordHeat(I, size).T > T_PVC + 0.01) {
    for (let n = 0; n < 400000 && t < 30000; n++) {
      const P = 2 * I * I * c.ohm * (1 + ALPHA * (T1 - 20));
      const dt = clamp(Math.max(0.5 * C1 / P, t * 0.004), 1e-6, 0.4);
      const q = c.g * (T1 - T2);
      T1 += (dt * (P - q)) / C1; T2 += (dt * (q - G2 * (T2 - T_AMB))) / C2; t += dt;
      if (T1 >= T_PVC && t70 === Infinity) t70 = t;
      if (t70 !== Infinity && t70 >= 5) { out = t70; break; }
      if (T1 >= T_FAULT) { out = t; break; }
      if (t70 !== Infinity && t >= 5) { out = 5; break; }
    }
  }
  memo.set(key, out);
  return out;
}

// ---------------------------------------------------------------- contacts
// A good plug-and-socket contact is a few milliohms. IEC 60884-1 (the basis of IS 1293) limits the
// temperature rise of the terminals to 45 K in its heating test. A worn, loose or burnt contact can
// be a fraction of an ohm. Heat P = I² R in a spot the size of a pea, buried in plastic: about
// 8 K of rise per watt (illustrative: a small brass clip in a closed housing).
export const K_CONTACT = 8;
export const contactHeat = (I, R) => { const P = I * I * R; return { P, T: Math.min(900, T_AMB + P * K_CONTACT) }; };

// ---------------------------------------------------------------- protection
// 5 × 20 mm quick-acting glass fuse, IEC 60127-2 standard sheet 2 (0.125–6.3 A): must carry 1.5 In
// for at least 1 h; must blow within 30 min at 2.1 In; 50 ms–2 s at 2.75 In; 10–300 ms at 4 In;
// under 20 ms at 10 In. The line here runs through the middle of those gates.
const FUSE = [[1.6, 3600], [1.7, 1200], [2.1, 20], [2.75, 0.4], [4, 0.06], [10, 0.006]];
export function fuseTime(r) {
  if (r <= 1.6) return Infinity;
  if (r >= 10) return 0.006 * (10 / r) ** 2;
  for (let i = 1; i < FUSE.length; i++) if (r <= FUSE[i][0]) {
    const [r0, t0] = FUSE[i - 1], [r1, t1] = FUSE[i], k = Math.log(r / r0) / Math.log(r1 / r0);
    return Math.exp(Math.log(t0) + k * (Math.log(t1) - Math.log(t0)));
  }
  return 0.006;
}
// Push-to-reset thermal breaker (a "circuit breaker for equipment", IEC 60934): a bimetal disc or
// strip, no magnet. Typical makers' calibration at 25 °C: holds 100%, trips within 1 h at 135%,
// in 3–50 s at 200%, in about 1–5 s at 300%. First-order heating model as in MCBClear:
// t = τ ln(r² / (r² − k²)) with k = 1.2, τ = 25 s → 200% in 11 s, 300% in 4.4 s, 135% in 39 s.
export function breakerTime(r) { const r2 = r * r; return r2 <= 1.44 ? Infinity : 25 * Math.log(r2 / (r2 - 1.44)); }
// The wall's C-curve MCB, the "this MCB" line of MCBClear (IS/IEC 60898-1): thermal k = 1.25,
// τ = 70 s; magnetic trip at √(5 × 10) ≈ 7.1 times the rating, in about 8 ms.
export function mcbTime(I, In = 16) {
  const r = I / In, r2 = r * r;
  if (r >= Math.sqrt(50)) return 0.008;
  return r2 <= 1.5625 ? Infinity : 70 * Math.log(r2 / (r2 - 1.5625));
}
export const PROT = {
  none: { label: 'Nothing', In: 0, time: () => Infinity, name: 'no protector' },
  fuse6: { label: '6 A fuse', In: 6, time: (I) => fuseTime(I / 6), name: '6 A glass fuse' },
  brk10: { label: '10 A breaker', In: 10, time: (I) => breakerTime(I / 10), name: '10 A thermal breaker' },
  brk16: { label: '16 A breaker', In: 16, time: (I) => breakerTime(I / 16), name: '16 A thermal breaker' },
};
export function fmtTime(t) {
  if (!isFinite(t)) return 'never';
  if (t < 0.1) return Math.round(t * 1000) + ' ms';
  if (t < 10) return t.toFixed(1) + ' s';
  if (t < 120) return Math.round(t) + ' s';
  if (t < 7200) return Math.round(t / 60) + ' min';
  return (t / 3600).toFixed(1) + ' h';
}
// Bolted short circuit at the board's sockets: 230 V ÷ (supply + wall wiring + the cord).
export const shortAmps = (size, L = 3) => MAINS / (Z_SUPPLY + R_WALL + 2 * L * CORDS[size].ohm);

// ---------------------------------------------------------------- the varistor
// A 20 mm disc MOV for 230 V mains, the common 275 V AC class (e.g. the S20K275 type sold by several
// makers): varistor voltage 430 V at 1 mA, clamping voltage 710 V at 100 A, 8,000 A once (8/20 µs),
// 151 J. Between those points V ∝ I^(1/α): α = ln(10⁵) ÷ ln(710/430) ≈ 23. At kiloamps the zinc
// oxide grains' own resistance adds a little (about 0.08 Ω here, illustrative).
export const MOV = { v1: 430, alpha: 23, rb: 0.08, imax: 8000, joules: 151 };
export const movV = (I) => MOV.v1 * Math.pow(Math.max(I, 1e-12) / 1e-3, 1 / MOV.alpha) + MOV.rb * I;
export function movI(V) {            // current at a given voltage (bisection in log space)
  let lo = 1e-12, hi = 1e5;
  for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (movV(m) > V) hi = m; else lo = m; }
  return lo;
}
// A surge of open-circuit voltage Voc from the standard "combination wave" generator of
// IEC 61000-4-5: 1.2/50 µs voltage, 8/20 µs current, 2 Ω source. Solve Voc = V(I) + 2 I.
// Energy in the MOV for an 8/20 µs pulse ≈ 1.4 × V × I × 20 µs (makers' application notes).
// Life: makers' pulse-rating curves allow one hit at 8,000 A but about 100 at 1,200 A and a
// million at 80 A; fitted here as N = (8,000 ÷ I)^2.9 (illustrative).
export const Z_SURGE = 2;
export function surge(Voc) {
  let lo = 0, hi = Voc / Z_SURGE;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (movV(m) + Z_SURGE * m > Voc) hi = m; else lo = m; }
  const I = lo, V = Math.min(Voc, movV(I)), E = 1.4 * V * I * 20e-6;
  return { I, V, E, hits: Math.pow(MOV.imax / Math.max(I, 1), 2.9) };
}

// ---------------------------------------------------------------- shocks (figures from MCBClear)
// Body about 1,000 Ω hand to feet (IEC 60479-1); feet to floor: dry rubber slippers about 100 kΩ,
// bare feet on a wet floor about 200 Ω (illustrative); house earth pit 10 Ω, transformer earth 2 Ω.
export const BODY = 1000, FEET = { slippers: 100000, bare: 200 }, R_PIT = 10, R_SRC_E = 2;
// 30 mA RCCB (IS 12640-1 / IEC 61008-1): trips within 300 ms at 30 mA and within 40 ms at 150 mA.
export function rccbTime(mA) { const r = mA / 30; return r < 0.7 ? Infinity : r < 1 ? 0.3 : r < 2 ? 0.3 - (r - 1) * 0.15 : r < 5 ? 0.15 - ((r - 2) / 3) * 0.11 : 0.04; }

// ---------------------------------------------------------------- colours
// Flexible cord cores: brown live, blue neutral, green-and-yellow earth (older Indian cords: red,
// black, green). Fixed house wiring in India: red, black, green.
export const COL = { live: 0x9a5a2c, neutral: 0x2f6fd6, earth: 0x3fae4f, brass: 0xd4a24a, body: 0xeceef1, cord: 0x30343c, flow: 0xffd35a, hot: 0xff7a59, ok: 0x5ce1a9, bad: 0xff5a4f, mov: 0x2d7fd0, leak: 0xff5ad1 };
export const CSS = { live: '#d08a55', neutral: '#6ea3ff', earth: '#5fd070', ok: '#5ce1a9', bad: '#ff6a5a', warn: '#ffb547', cyan: '#8ef0ff', dim: 'rgba(255,255,255,.55)' };

// ---------------------------------------------------------------- small helpers
export const num = (v, d = 1) => v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export const inReel = () => document.body.classList.contains('gb-reel');
// The tall 9:16 reel frame gets its own layout. (A phone's stage is roughly square: it keeps the
// wide layout, without the chart, seen from further back and lower in the frame.)
const tall = (w, h) => inReel() && w < h * 0.8;
export const isPort = (stage) => tall(stage.host.clientWidth, stage.host.clientHeight);
// A reel view that picks the portrait or landscape framing when the scene starts.
export const PHONE = { pos: [0, 8.4, 10.4], target: [0, 2.8, -0.6] };
export const view2 = (land, port, phone = PHONE) => {
  const pick = () => { const h = document.getElementById('stage'); return !h ? land : tall(h.clientWidth, h.clientHeight) ? port : h.clientWidth < 560 ? phone : land; };
  return { get pos() { return pick().pos; }, get target() { return pick().target; } };
};
// On a narrow (phone) stage the readout covers the top: nudge the picture down, hide minor labels.
export function fitNarrow(stage, minor = [], shift = -0.14) {
  const narrow = stage.host.clientWidth < 560 && !inReel();
  minor.forEach((l) => { l.visible = !narrow; });
  const y = narrow ? shift : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
export function pathOf(points) {
  const P = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
  const total = Math.max(1e-6, L[L.length - 1]);
  return {
    points: P, total,
    at(u, out = new THREE.Vector3()) {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= d) lo = m; else hi = m; }
      const k = (d - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
      return out.copy(P[lo]).lerp(P[hi], k);
    },
  };
}
// Glowing beads that run along a path: speed and visibility follow the current.
export function flowDots(path, count, color = COL.flow, r = 0.035) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), M.glow(color), count);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.frustumCulled = false; m.renderOrder = 6; m.material.depthTest = false; m.material.transparent = true;
  const u = Float32Array.from({ length: count }, (_, i) => i / count);
  const o = new THREE.Object3D(), p = new THREE.Vector3();
  m.step = (dt, speed) => {
    for (let i = 0; i < count; i++) {
      u[i] = (((u[i] + (dt * speed) / path.total) % 1) + 1) % 1;
      path.at(u[i], p); o.position.copy(p); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  m.step(0, 0);
  return m;
}
// A chart board. The drawing code works in a canvas `zoom` times smaller than the real one, so text
// stays readable when the board is small on screen.
export function board(root, w, h, pxW, pxH, draw, pos, zoom = 1.28) {
  const tex = canvasTexture(pxW, pxH, (g, W, H) => { g.setTransform(zoom, 0, 0, zoom, 0, 0); draw(g, W / zoom, H / zoom); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
// Seat a chart board: lying back on the floor in front of the model (wide stages), or standing
// above it (the tall reel frame).
export const LAND = { pos: [0, 10.5, 9.4], target: [0, 0.6, 1.4] };
// The tall reel frame: the whole scene is turned a quarter turn so that it runs away from the
// camera (which fills the height), and the chart stands at the far end, leaning back.
export const PORT = { pos: [0, 6.36, 4.67], target: [0, 1.6, -1.0] };
export function seat(brd, port, h, root, o = {}) {
  const m = brd.mesh; m.rotation.order = 'YXZ';
  if (port) {
    const k = o.k || 1.0, s = o.s || 1, dz = o.dz ?? 0.5, dx = o.dx || 0, f = o.flip ? -1 : 1;
    // flip turns the scene the other way round, for scenes whose far end should face the camera
    root.rotation.y = (-f * Math.PI) / 2; root.scale.setScalar(s); root.position.set(dx, 0, dz);
    // the board goes to world (0, Y, −5): root-local x = f (−5 − dz) ÷ s, z = f dx ÷ s
    m.rotation.set(-0.45, (f * Math.PI) / 2, 0); m.scale.setScalar(k / s);
    m.position.set((f * (-5.0 - dz)) / s, (2.2 + (h * k / 2) * 0.9) / s, (f * dx) / s);
  } else {
    const k = 1.2;
    root.rotation.y = 0; root.scale.setScalar(1); root.position.set(0, 0, 0);
    m.rotation.set(-1.15, 0, 0); m.scale.setScalar(k); m.position.set(0, (h * k / 2) * 0.41 + 0.06, 5.9 - (h * k / 2) * 0.913);
  }
}
export function panelBg(g, w, h) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)';
  g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fill();
}
// Log axis helpers for chart boards.
export const logX = (v, v0, v1, x0, x1) => x0 + (Math.log(v / v0) / Math.log(v1 / v0)) * (x1 - x0);
// Colour of something at T °C: its own colour up to about 45 °C, then orange, then glowing red.
const cA = new THREE.Color(), cB = new THREE.Color();
export function heatTint(mat, T, base = COL.cord) {
  const k = clamp((T - 40) / 110, 0, 1);
  cA.setHex(base); cB.setHex(k < 0.5 ? 0xff9a3c : 0xff3b1f);
  mat.color.copy(cA).lerp(cB, Math.min(1, k * 1.4));
  if (mat.emissive) { mat.emissive.setHex(0xff4a1f); mat.emissiveIntensity = k * k * 2.2; }
}
export const tempWord = (T) => (T > 160 ? ['no', 'Insulation chars: fire risk'] : T > T_PVC ? ['no', 'Over 70 °C: insulation cooking'] : T > 50 ? ['', 'Warm, within the limit'] : ['ok', 'Cool']);

// ---------------------------------------------------------------- the cord
// A cord drawn as a tube through points; returns the mesh (its material can be heat-tinted).
export function cord(points, r = 0.075, color = COL.cord) {
  return tube(points, r, new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: 0x000000 }), false, Math.max(60, points.length * 14));
}

// ---------------------------------------------------------------- the plug top
// Indian three-pin plug (IS 1293, from the BS 546 family). 6 A size: line and neutral pins 5.08 mm
// across and 14.9 mm long, earth pin 7.06 mm across and 20.6 mm long; line to neutral 19.1 mm,
// earth 22.2 mm from that line. 16 A size: 7.06 × 18.6 mm and 8.71 × 28.6 mm; 25.4 and 28.6 mm.
// (Dimensions of BS 546, in inches there: 0.200 × 0.585 and 0.278 × 0.812; 0.278 × 0.733 and
// 0.343 × 1.125.) Origin: the plug's face. Pins point down (−Y); the earth pin is towards +Z.
export const PIN = {
  6: { r: 0.0508, len: 0.297, er: 0.0706, elen: 0.412, dx: 0.19, dz: 0.444 },
  16: { r: 0.0706, len: 0.372, er: 0.0871, elen: 0.572, dx: 0.254, dz: 0.572 },
};
export function makePlug(rating = 6, { earth = true, color = 0xf3f4f6 } = {}) {
  const p = PIN[rating], g = new THREE.Group();
  const R = rating === 6 ? 0.38 : 0.5;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R, 0.3, 28), M.plastic(color)); body.position.set(0, 0.15, p.dz * 0.18); body.castShadow = true; g.add(body);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 0.86, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.plastic(color)); cap.scale.y = 0.35; cap.position.set(0, 0.3, p.dz * 0.18); g.add(cap);
  const brass = M.metal(COL.brass, { roughness: 0.35 });
  const pin = (r, len, x, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), brass); m.position.set(x, -len / 2, z); m.castShadow = true; g.add(m); const tip = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), brass); tip.position.set(x, -len, z); tip.scale.y = 0.6; g.add(tip); return m; };
  const zLN = -p.dz * 0.42, zE = p.dz * 0.58;
  g.pinL = pin(p.r, p.len, -p.dx, zLN); g.pinN = pin(p.r, p.len, p.dx, zLN);
  g.pinE = earth ? pin(p.er, p.elen, 0, zE) : null;
  return Object.assign(g, { body, spec: p, zLN, zE, R });
}

// ---------------------------------------------------------------- the extension board
// A generic strip: n sockets in a row, a master switch with an indicator lamp, a fuse, a varistor,
// and three brass bus bars running the whole length. With `switches`, each socket has its own
// rocker in the live line. The board lies on the floor, long axis along X, sockets facing up.
const PX = 120;                      // canvas pixels per unit on the top face
export function makeStrip({ n = 4, switches = true, rating = '6 A  240 V~' } = {}) {
  const g = new THREE.Group();
  const pitch = switches ? 1.35 : 1.0, HEAD = 1.5, W = 1.5, H = 0.7;
  const L = HEAD + n * pitch, x0 = -L / 2;
  const sx = (i) => x0 + HEAD + pitch * i + (switches ? 0.9 : pitch / 2);     // socket centres
  const P6 = PIN[6], zLN = -0.2, zE = zLN + P6.dz;                               // earth hole on the near side
  const Z = { earth: 0.56, live: 0.0, neutral: -0.56 };                         // the three lanes

  // lower shell and see-through cover
  const tray = box(L, 0.22, W, M.plastic(0xdfe2e7)); tray.position.y = 0.11; g.add(tray);
  const coverMat = M.plastic(COL.body, { transparent: true, opacity: 1, side: THREE.DoubleSide });
  const cover = new THREE.Group(); g.add(cover);
  const shell = box(L, H - 0.22, W, coverMat); shell.position.y = 0.22 + (H - 0.22) / 2; cover.add(shell);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: 0x9aa6b8, transparent: true, opacity: 0.7 })); shell.add(edges);
  const state = { sw: Array(n).fill(true), master: true, lamp: true };
  const top = canvasTexture(Math.round(L * PX), Math.round(W * PX), (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = '#eceef1'; c.fillRect(0, 0, w, h);
    const X = (x) => (x - x0) * PX, Zp = (z) => (z + W / 2) * PX;
    c.strokeStyle = '#c9ced6'; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12);
    for (let i = 0; i < n; i++) {
      const cx = X(sx(i)), cy = Zp(0.02);
      c.fillStyle = '#f7f8fa'; c.beginPath(); c.roundRect(cx - 52, cy - 62, 104, 124, 14); c.fill(); c.strokeStyle = '#c3c8d0'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#14161b';
      const hole = (x, z, r) => { c.beginPath(); c.arc(X(x), Zp(z), r * PX, 0, Math.PI * 2); c.fill(); };
      hole(sx(i) - P6.dx, zLN, 0.075); hole(sx(i) + P6.dx, zLN, 0.075); hole(sx(i), zE, 0.095);
      if (switches) { c.fillStyle = '#d5d9df'; c.fillRect(X(sx(i) - 0.62) - 24, Zp(0) - 36, 48, 72); }
    }
    c.fillStyle = '#d5d9df'; c.fillRect(X(x0 + 1.02) - 26, Zp(-0.1) - 38, 52, 76);
    c.fillStyle = '#6b7280'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center';
    c.fillText(rating, X(x0 + 0.5), Zp(0.62)); c.fillText('FUSE', X(x0 + 0.42), Zp(-0.52));
    c.font = '13px sans-serif'; c.fillText('MAINS', X(x0 + 1.02), Zp(0.5));
  });
  const topMat = new THREE.MeshBasicMaterial({ map: top.tex, transparent: true, toneMapped: true });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(L, W), topMat); face.rotation.x = -Math.PI / 2; face.position.y = H + 0.002; cover.add(face);

  // bus bars: plain brass in real life; each is edged here in its wire colour so you can tell them apart
  const brass = () => M.metal(COL.brass, { roughness: 0.32, emissive: 0x000000 });
  const bars = {}, inner = new THREE.Group(); g.add(inner);
  const xb0 = x0 + HEAD - 0.12, xb1 = x0 + L - 0.18, yb = 0.3;
  for (const k of ['earth', 'live', 'neutral']) {
    const b = new THREE.Group(); inner.add(b);
    const bar = box(xb1 - xb0, 0.05, 0.13, brass()); bar.position.set((xb0 + xb1) / 2, yb, Z[k]); b.add(bar);
    const edge = box(xb1 - xb0, 0.022, 0.15, M.plastic(COL[k])); edge.position.set((xb0 + xb1) / 2, yb - 0.036, Z[k]); b.add(edge);
    bars[k] = Object.assign(b, { bar });
  }
  // spring clips under every hole, with a tab back to the right bar
  const clips = new THREE.Group(); inner.add(clips);
  const clip = (x, z, r, parent) => {
    const m = brass();
    for (const s of [-1, 1]) { const leaf = box(0.03, 0.26, r * 2.2, m); leaf.position.set(x + s * (r + 0.02), 0.47, z); leaf.rotation.z = s * 0.08; parent.add(leaf); }
    const foot = box(r * 2 + 0.1, 0.03, r * 2.2, m); foot.position.set(x, 0.335, z); parent.add(foot);
  };
  const rockers = [], shutters = [], swBodies = new THREE.Group(); inner.add(swBodies);
  const shutterG = new THREE.Group(); g.add(shutterG);
  for (let i = 0; i < n; i++) {
    const x = sx(i);
    clip(x, zE, P6.er, bars.earth); const te = box(0.1, 0.03, Z.earth - zE, brass()); te.position.set(x, 0.335, (Z.earth + zE) / 2); bars.earth.add(te);
    clip(x + P6.dx, zLN, P6.r, bars.neutral); const tn = box(0.1, 0.03, zLN - Z.neutral, brass()); tn.position.set(x + P6.dx, 0.335, (Z.neutral + zLN) / 2); bars.neutral.add(tn);
    clip(x - P6.dx, zLN, P6.r, bars.live);
    if (switches) {
      const xs = x - 0.62;
      const sb = box(0.3, 0.26, 0.5, M.plastic(0x3a3f49)); sb.position.set(xs, 0.47, 0.0); swBodies.add(sb);
      const l1 = box(0.3, 0.03, 0.09, brass()); l1.position.set(xs + 0.22, 0.335, -0.12); l1.rotation.y = 0.5; bars.live.add(l1);
      const l2 = box(0.1, 0.03, 0.12, brass()); l2.position.set(x - P6.dx, 0.335, zLN + 0.02); bars.live.add(l2);
      const r = box(0.3, 0.09, 0.5, M.plastic(0xfafbfc)); r.position.set(xs, H + 0.03, 0); cover.add(r); rockers.push(r);
    } else { const tl = box(0.1, 0.03, Math.abs(zLN - Z.live), brass()); tl.position.set(x - P6.dx, 0.335, (Z.live + zLN) / 2); bars.live.add(tl); }
    // child shutter: a plate under the line and neutral holes that slides away when the earth pin lands
    const sh = box(0.62, 0.035, 0.2, M.plastic(0xff9a3c)); sh.position.set(x, 0.64, zLN); shutterG.add(sh); shutters.push(sh);
  }
  // head: cord entry, fuse, master switch, indicator lamp with its resistor, varistor
  const head = new THREE.Group(); inner.add(head);
  const grip = box(0.16, 0.3, 0.4, M.plastic(0x3a3f49)); grip.position.set(x0 + 0.1, 0.42, 0); head.add(grip);
  const core = (pts, col) => { const t = tube(pts, 0.032, M.plastic(col, { roughness: 0.6 }), false, 40); head.add(t); return t; };
  const fuseX = [x0 + 0.24, x0 + 0.62], fz = -0.42;
  core([[x0 + 0.1, 0.42, 0], [x0 + 0.16, 0.42, -0.2], [fuseX[0], 0.42, fz]], COL.live);
  core([[x0 + 0.1, 0.42, 0.02], [x0 + 0.5, 0.4, 0.3], [xb0 + 0.05, 0.34, Z.earth]], COL.earth);
  core([[x0 + 0.1, 0.42, -0.02], [x0 + 0.3, 0.3, -0.14], [x0 + 0.75, 0.26, -0.62], [x0 + 1.25, 0.3, -0.64], [xb0 + 0.05, 0.34, Z.neutral]], COL.neutral);
  const fuse = new THREE.Group(); fuse.position.set((fuseX[0] + fuseX[1]) / 2, 0.42, fz); head.add(fuse);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), M.clear(0xdff3ff, 0.35)); glass.rotation.z = Math.PI / 2; fuse.add(glass);
  for (const s of [-1, 1]) { const capm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.07, 16), M.metal(0xd0d4dc)); capm.rotation.z = Math.PI / 2; capm.position.x = s * 0.155; fuse.add(capm); }
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6), M.glow(0xcfd6e2)); wire.rotation.z = Math.PI / 2; fuse.add(wire);
  const mx = x0 + 1.02, mz = -0.1;
  core([[fuseX[1], 0.42, fz], [x0 + 0.8, 0.42, fz + 0.05], [mx - 0.05, 0.42, mz - 0.1]], COL.live);
  const mBody = box(0.32, 0.26, 0.52, M.plastic(0x3a3f49)); mBody.position.set(mx, 0.47, mz); head.add(mBody);
  core([[mx + 0.08, 0.38, mz + 0.1], [mx + 0.25, 0.34, Z.live], [xb0 + 0.05, 0.34, Z.live]], COL.live);
  const master = box(0.32, 0.1, 0.54, new THREE.MeshStandardMaterial({ color: 0xd7263d, roughness: 0.35, emissive: 0xff2a2a, emissiveIntensity: 0.9, transparent: true, opacity: 0.92 })); master.position.set(mx, H + 0.035, mz); cover.add(master);
  // indicator: a small neon lamp in series with a resistor of a few hundred kilohms, across live and neutral
  const res = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), M.plastic(0xc9a66b)); res.rotation.x = Math.PI / 2; res.position.set(mx + 0.3, 0.42, -0.36); head.add(res);
  const neon = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.07, 4, 10), M.glow(0xff7a3c)); neon.rotation.x = Math.PI / 2; neon.position.set(mx + 0.3, 0.5, -0.2); head.add(neon);
  // varistor: a blue disc between the live and neutral bars
  const mov = new THREE.Group(); mov.position.set(xb0 + 0.3, 0.5, (Z.live + Z.neutral) / 2); inner.add(mov);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 28), new THREE.MeshStandardMaterial({ color: COL.mov, roughness: 0.5, emissive: 0x000000 })); disc.rotation.z = Math.PI / 2; mov.add(disc);
  for (const s of [-1, 1]) { const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), M.metal(0xcfd3da)); lead.position.set(0, -0.12, s * 0.2); lead.rotation.x = s * -0.5; mov.add(lead); }

  g.setXray = (on, k = 0.12) => {
    coverMat.opacity = on ? k : 1; coverMat.depthWrite = !on; shell.castShadow = !on;
    topMat.opacity = on ? 0.3 : 1; edges.material.opacity = on ? 0.9 : 0.5;
  };
  g.setSwitch = (i, on) => { state.sw[i] = on; if (rockers[i]) rockers[i].rotation.z = on ? -0.14 : 0.14; };
  g.setMaster = (on, lit = on) => {
    state.master = on; master.rotation.z = on ? -0.12 : 0.12;
    master.material.emissiveIntensity = lit ? 0.9 : 0.02; neon.material.color.setHex(lit ? 0xff7a3c : 0x3a2a22);
  };
  g.setShutter = (i, k) => { shutters[i].position.z = zLN - 0.3 * clamp(k, 0, 1); };
  for (let i = 0; i < n; i++) g.setSwitch(i, true);
  g.setMaster(true);
  return Object.assign(g, {
    L, W, H, x0, n, sx, zLN, zE, Z, yb, xb0, xb1, pitch, mx, mz, fuseAt: [fuse.position.x, 0.42, fz], movAt: [mov.position.x, 0.5, mov.position.z],
    tray, cover, shell, face, bars, inner, head, fuse, fuseWire: wire, mov, disc, master, neon, res, rockers, shutters, shutterG, swBodies, clips, state, top,
  });
}

// ---------------------------------------------------------------- simple appliances (generic shapes)
function group(...kids) { const g = new THREE.Group(); kids.forEach((k) => g.add(k)); return g; }
export const APPLIANCES = {
  charger() { const b = box(0.36, 0.5, 0.3, M.plastic(0xf5f6f8)); b.position.y = 0.25; const ph = box(0.62, 0.05, 1.2, M.plastic(0x20242c)); ph.position.set(0.7, 0.03, 0.1); const sc = box(0.56, 0.01, 1.1, M.glow(0x2b6cff)); sc.position.set(0.7, 0.062, 0.1); return group(b, ph, sc); },
  laptop() { const base = box(2.2, 0.08, 1.5, M.metal(0xaab1bd, { roughness: 0.5 })); base.position.y = 0.04; const lid = box(2.2, 1.4, 0.06, M.metal(0xaab1bd, { roughness: 0.5 })); lid.position.set(0, 0.74, -0.78); lid.rotation.x = -0.18; const scr = box(2.0, 1.2, 0.01, M.glow(0x9fd0ff)); scr.position.set(0, 0.74, -0.74); scr.rotation.x = -0.18; return group(base, lid, scr); },
  tv() { const p = box(3.2, 1.9, 0.12, M.plastic(0x16181d)); p.position.y = 1.25; const s = box(3.0, 1.7, 0.01, M.glow(0x5f8fd8)); s.position.set(0, 1.25, 0.07); const st = box(1.2, 0.06, 0.6, M.plastic(0x16181d)); st.position.y = 0.03; const nk = box(0.16, 0.3, 0.1, M.plastic(0x16181d)); nk.position.y = 0.18; return group(p, s, st, nk); },
  kettle() { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1.3, 28), M.metal(0xc8ccd4, { roughness: 0.25 })); b.position.y = 0.8; b.castShadow = true; const base = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.15, 28), M.plastic(0x22252c)); base.position.y = 0.075; const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 0.14, 24), M.plastic(0x22252c)); lid.position.y = 1.52; const h = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 24, Math.PI), M.plastic(0x22252c)); h.rotation.z = -Math.PI / 2; h.position.set(0.55, 0.85, 0); const sp = box(0.3, 0.16, 0.22, M.metal(0xc8ccd4)); sp.position.set(-0.6, 1.35, 0); sp.rotation.z = 0.5; return group(b, base, lid, h, sp); },
  iron() { const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 3), M.metal(0xd4d8df, { roughness: 0.2 })); sole.scale.set(1.9, 1, 0.9); sole.rotation.y = Math.PI; sole.position.y = 0.05; const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.38, 3), M.plastic(0x2b86c5)); bd.scale.set(1.8, 1, 0.82); bd.rotation.y = Math.PI; bd.position.y = 0.3; const h = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 10, 24, Math.PI), M.plastic(0x1d2026)); h.position.set(0.1, 0.48, 0); h.scale.set(1.5, 1, 1); return group(sole, bd, h); },
  heater() { const b = box(2.0, 1.5, 0.5, M.plastic(0x2a2e36)); b.position.y = 0.85; const kids = [b]; for (let i = 0; i < 2; i++) { const r = box(1.7, 0.12, 0.05, new THREE.MeshStandardMaterial({ color: 0x5a2a1a, emissive: 0xff5a1f, emissiveIntensity: 0 })); r.position.set(0, 0.62 + i * 0.5, 0.27); kids.push(r); } for (const s of [-1, 1]) { const f = box(0.12, 0.12, 0.8, M.plastic(0x1d2026)); f.position.set(s * 0.8, 0.06, 0); kids.push(f); } const g = group(...kids); g.rods = kids.slice(1, 3); return g; },
};
