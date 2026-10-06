// Chapter 3: heat. A cord is a long thin resistor: R = 2 × length × (ohms per metre), heat = I² R,
// voltage lost = I R (see OhmsLawClear). Numbers:
//  • Cord resistance: IEC 60228 class 5 copper, 26.0 / 19.5 / 13.3 mΩ per metre for 0.75 / 1.0 / 1.5 mm²,
//    rising 0.393% per kelvin as the copper warms.
//  • Cord temperature: the steady model in ext.js (room at 30 °C, still air 10 W/m²K as in
//    OhmsLawClear, PVC limit 70 °C). "Under a carpet" lowers the surface cooling to 3.5 W/m²K;
//    "coiled" makes all the heat of the whole length leave through the reel's outer surface.
//    Both are illustrative models, not test results: real reels carry two ratings on the label
//    (wound and unwound) and many have a thermal cut-out (IEC 61242; IS 15368).
//  • Contact: a good plug contact is a few milliohms; a worn or loose one can be a fraction of an
//    ohm. P = I² R in a pea-sized spot, about 8 K per watt (illustrative).
//  • Chain: every extra board adds its own cord (same length and size) and one more plug contact
//    (5 mΩ each), and the first cord carries everything plugged in further down.
import { THREE, M, box, clamp } from '../kit.js';
import { makeStrip, makePlug, cord, board, panelBg, cordHeat, contactHeat, safeAmps, heatTint, tempWord, seat, LAND as LANDV, PORT as PORTV, CORDS, SIZES, MAINS, T_PVC, T_AMB, COL, CSS, APPLIANCES, num, fitNarrow, isPort, view2 } from '../ext.js';

const LAYS = { open: 'Laid out', coil: 'Coiled on a reel', carpet: 'Under a carpet' };
const R_GOOD = 0.005;
export function analyse(s) {
  const h = cordHeat(s.amps, s.size, s.len, s.lay), free = cordHeat(s.amps, s.size, s.len, 'open');
  const n = s.chain, rest = n > 1 ? cordHeat(s.amps, s.size, s.len * (n - 1), 'open') : { R: 0, watts: 0 };
  const c = contactHeat(s.amps, s.contact);
  const drop = s.amps * (h.R + rest.R + s.contact + (n - 1) * R_GOOD);
  return { h, free, c, drop, far: MAINS - drop, R: h.R + rest.R, watts: h.watts + rest.watts, safe: safeAmps(s.size, s.len, s.lay), hot: Math.max(h.T, c.T) };
}
const LAND = LANDV, PORT = PORTV;

export default {
  id: 'heat',
  short: 'Heat in the cord',
  title: 'Why cords get hot',
  subtitle: 'A cord is a long, thin resistor. Raise the current, coil it up, or loosen a contact, and watch the temperature.',
  view: view2(LAND, PORT),
  learn: `<p>Copper is a very good conductor, but not a perfect one. One metre of 0.75 mm² cord has about <b>0.026 Ω</b> in each core. The current goes out on one core and back on another, so a 3 m cord is a 0.16 Ω resistor in series with everything you plug in.</p>
    <p>Two things follow from Ohm's law (see <a href="https://glassbox.how/ohmslawclear/">OhmsLawClear</a>). The cord steals a little <b>voltage</b>: V = I × R. And it makes <b>heat</b>: P = <b>I² × R</b>. The square is the dangerous part. Twice the current gives <b>four times</b> the heat.</p>
    <p>A cord lying in open air sheds that heat easily. <b>Coil it on its reel</b> and the turns in the middle are wrapped in other hot turns. All the heat of 25 metres has to leave through the outside of one small drum. That is why reels carry <b>two ratings</b>, a low one "wound" and a higher one "unwound", and why fire services say: <b>unwind it fully</b>. A cord under a <b>carpet</b> has the same problem.</p>
    <p>The hottest spot is often not the cord at all. A <b>loose or worn contact</b> touches at a tiny point, with a fraction of an ohm. At 10 A, just 0.2 Ω makes <b>20 W</b> in a spot the size of a pea: a small soldering iron, buried in plastic. And when boards are <b>chained</b>, the first cord carries the load of all of them.</p>
    <p class="tip"><b>Try it:</b> set 13 A on a 25 m, 1.5 mm² cord laid out, then coil it. Then go back to 6 A and slide the contact from "good" to "worn".</p>`,
  terms: [
    { t: 'Resistance (R)', d: 'How much a conductor holds current back, in ohms. Longer and thinner means more.' },
    { t: 'I²R heating', d: 'The heat made in any resistance: current squared times resistance, in watts.' },
    { t: 'Voltage drop', d: 'The volts lost along a wire, I × R, so the far end gets a little less than 230 V.' },
    { t: 'Contact resistance', d: 'The resistance where two metal parts touch. Clean, tight contacts: milliohms. Loose or burnt ones: much more.' },
    { t: 'Daisy-chaining', d: 'Plugging one extension board into another. The first board carries the total of the whole chain.' },
  ],
  defaults: { amps: 6, size: 0.75, len: 5, lay: 'open', contact: 0.005, chain: 1 },
  controls: [
    { key: 'amps', type: 'range', label: 'Current in the cord', min: 0, max: 20, step: 0.1, fmt: (v) => `${v.toFixed(1)} A · ${Math.round(v * MAINS).toLocaleString('en-IN')} W` },
    { key: 'size', type: 'seg', label: 'Cord thickness', options: SIZES.map((v) => ({ v, label: `${v} mm²` })), fmt: (v) => `rated ${CORDS[v].amps} A` },
    { key: 'len', type: 'range', label: 'Cord length', min: 2, max: 50, step: 1, fmt: (v) => v + ' m' },
    { key: 'lay', type: 'seg', label: 'The cord is', options: Object.entries(LAYS).map(([v, label]) => ({ v, label })) },
    { key: 'contact', type: 'log', label: 'Contact at the wall plug', min: 0.003, max: 1, fmt: (v) => (v < 0.02 ? 'good' : v < 0.1 ? 'tired' : 'worn or loose') + ' · ' + (v < 0.1 ? Math.round(v * 1000) + ' mΩ' : v.toFixed(2) + ' Ω') },
    { key: 'chain', type: 'seg', label: 'Boards in a chain', options: [1, 2, 3].map((v) => ({ v, label: String(v) })) },
    { key: 'go', type: 'buttons', label: 'Try these', items: [
      { label: 'Kettle on a thin cord', act: (s) => Object.assign(s, { amps: 6.5, size: 0.75, len: 3, lay: 'open', contact: 0.005, chain: 1 }) },
      { label: 'Heater on a coiled 25 m reel', act: (s) => Object.assign(s, { amps: 8.7, size: 1.5, len: 25, lay: 'coil', contact: 0.005, chain: 1 }) },
      { label: 'Worn socket', act: (s) => Object.assign(s, { amps: 10, size: 1.5, len: 3, lay: 'open', contact: 0.2, chain: 1 }) },
      { label: 'Three boards, one heater', act: (s) => Object.assign(s, { amps: 8.7, size: 0.75, len: 5, lay: 'open', contact: 0.005, chain: 3 }) },
    ] },
  ],
  quiz: [
    { q: 'You double the current in a cord. The heat made in it…', options: ['stays the same', 'doubles', 'goes up four times', 'halves'], answer: 2, why: 'Heat is I² × R. Two times the current is 2 × 2 = 4 times the heat.' },
    { q: 'Why does a cable reel have a lower rating when it is wound?', options: ['The copper gets longer', 'The heat of the whole cable has to escape through the outside of the coil', 'Coils make extra voltage', 'Wound cable is thinner'], answer: 1, why: 'The inner turns are wrapped in other warm turns, so the same heat produces a much higher temperature.' },
    { q: 'A loose contact has 0.2 Ω. How much heat does it make at 10 A?', options: ['20 W, in a spot the size of a pea', '2 W', '0.2 W', '2,000 W'], answer: 0, why: 'P = I² × R = 10 × 10 × 0.2 = 20 W. Nothing trips, because the current is normal.' },
  ],
  reel: [
    { ms: 5200, caption: 'A cord is a long thin resistor: double the current and it makes four times the heat.', set: { size: 0.75, len: 5, lay: 'open', contact: 0.005, chain: 1 }, anim: { amps: [3, 16] }, view: view2(LAND, PORT), spin: 0 },
    { ms: 5200, caption: 'Left coiled on its reel, the same cord cannot shed its heat, and the inner turns cook.', set: { size: 1.5, len: 25, lay: 'coil', contact: 0.005, chain: 1 }, anim: { amps: [4, 13] }, view: view2({ pos: [-1.6, 7.6, 7.4], target: [-1.2, 0.8, 1.2] }, PORT), spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // wall with a socket, at the left
    const wall = box(0.25, 1.9, 2.4, M.matte(0x2a3140)); wall.position.set(-5.35, 0.95, 0); root.add(wall);
    const plate = box(0.08, 0.9, 0.9, M.plastic(0xf2f3f5)); plate.position.set(-5.2, 1.0, 0); root.add(plate);
    const plug = makePlug(6); plug.position.set(-5.14, 1.0, 0); root.add(plug);
    plug.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12), new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); spot.position.set(-5.12, 1.0, 0); root.add(spot);
    // the board at the far end, with a heater on it
    const strip = makeStrip({ n: 2, switches: false, rating: '' }); strip.position.set(3.7, 0, 0); root.add(strip);
    const heater = APPLIANCES.heater(); heater.position.set(3.9, 0, -2.3); root.add(heater);
    const hp = makePlug(6); hp.position.set(3.7 + strip.sx(1), strip.H, strip.zLN - hp.zLN); root.add(hp);
    root.add(cord([[3.7 + strip.sx(1), 1.0, -0.05], [3.7 + strip.sx(1), 1.1, -0.5], [4.2, 0.12, -1.2], [3.9, 0.2, -2.0]], 0.05, 0x8a8f99));
    const xEnd = 3.7 + strip.x0;
    // three ways to lay the cord: each has a "free" part and a "trapped" part with its own material
    const mk = (pts, r = 0.085) => cord(pts, r);
    const P0 = [-4.84, 1.0, 0], P1 = [-4.5, 0.7, 0.05], Pe = [xEnd + 0.05, 0.42, 0];
    const lays = {
      open: { g: new THREE.Group(), free: [mk([P0, P1, [-4.2, 0.1, 0.3], [-3.0, 0.09, 0.9], [-1.6, 0.09, -0.5], [-0.2, 0.09, 0.6], [1.0, 0.09, -0.2], [xEnd - 0.5, 0.25, 0], Pe])], hot: [] },
      carpet: { g: new THREE.Group(), free: [mk([P0, P1, [-4.2, 0.1, 0.2], [-3.6, 0.09, 0.35]]), mk([[-0.4, 0.09, 0.2], [1.0, 0.09, -0.2], [xEnd - 0.5, 0.25, 0], Pe])], hot: [mk([[-3.6, 0.09, 0.35], [-2.6, 0.09, 0.6], [-1.4, 0.09, -0.2], [-0.4, 0.09, 0.2]])] },
      coil: { g: new THREE.Group(), free: [mk([P0, P1, [-4.2, 0.1, 0.3], [-3.3, 0.09, 0.5], [-2.55, 0.2, 0.42]]), mk([[-0.85, 0.2, 0.42], [-0.2, 0.09, 0.5], [1.0, 0.09, -0.2], [xEnd - 0.5, 0.25, 0], Pe])], hot: [] },
    };
    // the rug
    const rug = box(3.6, 0.2, 2.6, new THREE.MeshStandardMaterial({ color: 0x7a3b4a, roughness: 1, transparent: true, opacity: 0.72 })); rug.position.set(-2.0, 0.12, 0.2); lays.carpet.g.add(rug);
    // the reel: two flanges, a drum, and the winding
    const reel = new THREE.Group(); reel.position.set(-1.7, 1.2, 0.2); lays.coil.g.add(reel);
    const fl = new THREE.MeshStandardMaterial({ color: 0xf2a23a, roughness: 0.5, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 40), fl); f.rotation.x = Math.PI / 2; f.position.z = s * 0.42; reel.add(f); }
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.84, 24), M.plastic(0x30343c)); drum.rotation.x = Math.PI / 2; reel.add(drum);
    for (const s of [-1, 1]) { const leg = box(0.1, 1.2, 0.08, M.metal(0x8a909c)); leg.position.set(0, -0.6, s * 0.5); reel.add(leg); const foot = box(1.2, 0.08, 0.08, M.metal(0x8a909c)); foot.position.set(0, -1.16, s * 0.5); reel.add(foot); }
    const windMat = new THREE.MeshStandardMaterial({ color: COL.cord, roughness: 0.6, emissive: 0x000000 });
    for (let layer = 0; layer < 3; layer++) for (let k = 0; k < 5; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.5 + layer * 0.155, 0.08, 8, 40), windMat); t.position.z = -0.32 + k * 0.16; reel.add(t); }
    lays.coil.hot.push({ material: windMat });
    Object.values(lays).forEach((l) => { l.free.forEach((m) => l.g.add(m)); l.hot.forEach((m) => m.isMesh && l.g.add(m)); root.add(l.g); });
    // extra boards for a chain
    const extra = [-0.1, 1.15].map((x) => { const b = makeStrip({ n: 1, switches: false, rating: '' }); b.scale.setScalar(0.7); b.position.set(x, 0, 0.2); b.rotation.y = 0.15; root.add(b); const p = makePlug(6); p.scale.setScalar(0.7); p.position.set(x + b.sx(0) * 0.7, b.H * 0.7, 0.2); root.add(p); return [b, p]; });

    const lblCord = stage.label('', [-1.8, 2.7, 0.2], root, 'hot');
    const lblSpot = stage.label('', [-4.9, 0.2, 1.5], root);
    const lblFar = stage.label('', [3.7, 1.6, 0.6], root);

    let S = null;
    const X0 = 0, X1 = 20, Y0 = 20, Y1 = 200;
    const brd = board(root, 7.6, 3.0, 1140, 450, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      const x0 = 96, x1 = w - 30, y0 = h - 62, y1 = 64, xs = (a) => x0 + ((a - X0) / (X1 - X0)) * (x1 - x0), ys = (t) => y0 - ((clamp(t, Y0, Y1) - Y0) / (Y1 - Y0)) * (y0 - y1);
      g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left'; g.fillText(`Cord temperature: ${S.size} mm², ${S.len} m`, 28, 40);
      g.font = '21px sans-serif'; g.textAlign = 'right'; g.fillStyle = CSS.dim; g.fillText('simple model, room at 30 °C', w - 28, 38);
      g.lineWidth = 1; g.font = '21px sans-serif';
      for (const t of [30, 70, 100, 150, 200]) { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0, ys(t)); g.lineTo(x1, ys(t)); g.stroke(); g.fillStyle = CSS.dim; g.textAlign = 'right'; g.fillText(t + ' °C', x0 - 8, ys(t) + 7); }
      g.textAlign = 'center';
      for (let a = 0; a <= 20; a += 2) { g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(xs(a), y0); g.lineTo(xs(a), y1); g.stroke(); g.fillStyle = CSS.dim; g.fillText(a + ' A', xs(a), y0 + 28); }
      g.fillStyle = 'rgba(255,90,79,.14)'; g.fillRect(x0, y1, x1 - x0, ys(T_PVC) - y1);
      g.strokeStyle = CSS.bad; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(x0, ys(T_PVC)); g.lineTo(x1, ys(T_PVC)); g.stroke(); g.setLineDash([]);
      g.fillStyle = CSS.bad; g.textAlign = 'right'; g.fillText('PVC limit 70 °C', x1 - 8, ys(T_PVC) + 24);
      ['open', 'carpet', 'coil'].forEach((lay, i) => {
        const on = lay === S.lay;
        g.strokeStyle = on ? '#ffb547' : 'rgba(255,255,255,.4)'; g.lineWidth = on ? 5 : 2; g.beginPath();
        for (let a = 0; a <= 20.01; a += 0.25) { const T = cordHeat(a, S.size, S.len, lay).T; if (a === 0) g.moveTo(xs(a), ys(T)); else g.lineTo(xs(a), ys(T)); if (T > Y1) break; }
        g.stroke();
        const ly = y1 + 26 + i * 28; g.beginPath(); g.moveTo(x0 + 14, ly - 7); g.lineTo(x0 + 50, ly - 7); g.stroke();
        g.fillStyle = on ? '#ffb547' : 'rgba(255,255,255,.7)'; g.font = `${on ? 'bold ' : ''}21px sans-serif`; g.textAlign = 'left'; g.fillText(LAYS[lay].toLowerCase(), x0 + 58, ly);
      });
      const r = CORDS[S.size].amps; g.strokeStyle = CSS.cyan; g.lineWidth = 2; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(xs(r), y0); g.lineTo(xs(r), y1); g.stroke(); g.setLineDash([]);
      g.fillStyle = CSS.cyan; g.font = '21px sans-serif'; g.textAlign = 'center'; g.fillText(`rated ${r} A`, xs(r), y0 - 10);
      const T = cordHeat(S.amps, S.size, S.len, S.lay).T;
      g.fillStyle = T > T_PVC ? CSS.bad : '#fff'; g.beginPath(); g.arc(xs(S.amps), ys(T), 11, 0, Math.PI * 2); g.fill();
      g.font = 'bold 24px sans-serif'; g.textAlign = S.amps > 14 ? 'right' : 'left'; g.fillText(`${Math.round(T)} °C${T >= 499 ? '+' : ''}`, xs(S.amps) + (S.amps > 14 ? -18 : 18), Math.max(y1 + 24, ys(T) - 14));
    }, [0, 1.15, 3.0]);

    let key = '', port = null;
    const minor = [lblFar];
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor);
        const p = isPort(stage);
        if (p !== port) { port = p; seat(brd, p, 3.0, root, { dx: -1.0, dz: 0.3, s: 0.85 }); }
        brd.mesh.visible = !narrow;
        const k = `${s.amps.toFixed(2)}|${s.size}|${s.len}|${s.lay}|${s.contact.toFixed(4)}|${s.chain}`;
        if (k === key) return;
        key = k; S = { ...s }; brd.redraw();
        const a = analyse(s);
        Object.entries(lays).forEach(([id, l]) => {
          l.g.visible = id === s.lay;
          l.free.forEach((m) => heatTint(m.material, a.free.T));
          l.hot.forEach((m) => heatTint(m.material, a.h.T));
        });
        extra.forEach(([b, pl], i) => { b.visible = pl.visible = s.chain > i + 1; });
        const kq = clamp((a.c.T - 60) / 200, 0, 1);
        spot.material.opacity = 0.75 * kq; spot.scale.setScalar(0.7 + kq * 1.1);
        lblCord.element.innerHTML = `${s.lay === 'coil' ? 'Inside the coil' : s.lay === 'carpet' ? 'Under the carpet' : 'Cord'}: <b>${Math.round(a.h.T)}${a.h.T >= 499 ? '+' : ''} °C</b>`;
        lblCord.position.set(s.lay === 'open' ? -1.6 : -1.8, s.lay === 'coil' ? 0.25 : 0.9, s.lay === 'coil' ? 1.4 : 0.2);
        lblSpot.element.innerHTML = `Wall plug contact: <b>${num(a.c.P, a.c.P < 10 ? 1 : 0)} W, ${Math.round(a.c.T)} °C</b>`;
        lblSpot.element.classList.toggle('hot', a.c.T > 70);
        lblFar.element.innerHTML = `<b>${num(a.far, 1)} V</b> arrives`;
        heater.rods.forEach((r) => { r.material.emissiveIntensity = clamp(s.amps / 8.7, 0, 1.3) * 2.2; });
      },
      readout: (s) => {
        const a = analyse(s), w = tempWord(a.h.T), cw = a.c.T > 150 ? 'no' : a.c.T > 70 ? 'no' : 'ok';
        const worst = a.c.T > a.h.T && a.c.T > 70 ? ['no', 'The contact is the hot spot'] : w;
        return `<div class="big ${worst[0]}">${worst[1]}</div>
          <div class="row"><span>Cord resistance</span><b>${num(a.R, 2)} Ω</b></div>
          <div class="row"><span>Heat in the cord, I²R</span><b>${num(a.watts, a.watts < 10 ? 1 : 0)} W</b></div>
          <div class="row"><span>${s.lay === 'coil' ? 'Middle of the coil' : s.lay === 'carpet' ? 'Cord under the carpet' : 'Cord'} settles at</span><b class="${w[0]}">${Math.round(a.h.T)}${a.h.T >= 499 ? '+' : ''} °C</b></div>
          <div class="row"><span>Volts lost on the way</span><b>${num(a.drop, 1)} V → ${num(a.far, 1)} V</b></div>
          <div class="row"><span>Wall plug contact, I²R</span><b class="${cw}">${num(a.c.P, a.c.P < 10 ? 1 : 0)} W → ${Math.round(a.c.T)} °C</b></div>
          <small>${s.chain > 1 ? `${s.chain} boards: ${s.chain * s.len} m of cord in series. ` : ''}Safe up to ${num(a.safe, 1)} A laid this way (simple model).</small>`;
      },
    };
  },
};
