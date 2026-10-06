// Chapter 5: surges and earth. Two safety jobs that have nothing to do with overload.
// Surge side: a 20 mm, 275 V AC metal-oxide varistor across live and neutral (model in ext.js:
// 430 V at 1 mA, 710 V at 100 A, 8,000 A once, 151 J). The surge is the standard test wave of
// IEC 61000-4-5 (1.2/50 µs, 8/20 µs, 2 Ω source), so 6 kV open-circuit can drive about 2.5 kA.
// Sustained over-voltage: a lost neutral on a three-phase supply can put up to the line voltage,
// 400 V rms (566 V peak), on a 230 V socket. That is above the varistor's 430 V knee on every
// half-cycle, so it conducts continuously and overheats within seconds; a thermal fuse beside the
// disc (required by surge-protector safety standards such as UL 1449 and IEC 61643-11) disconnects it.
// Earth side, with MCBClear's figures: house earth pit 10 Ω, transformer earth 2 Ω, body 1,000 Ω,
// feet to floor 100 kΩ (dry rubber slippers) or 200 Ω (bare, wet floor), 30 mA RCCB tripping within
// 40 ms at five times its rating. Shock effects: IEC 60479-1 zones.
import { THREE, M, box, tube, clamp } from '../kit.js';
import { makeStrip, makePlug, cord, pathOf, flowDots, board, panelBg, logX, surge, movI, movV, MOV, fuseTime, mcbTime, rccbTime, fmtTime, MAINS, PEAK, Z_SUPPLY, CORDS, BODY, FEET, R_PIT, R_SRC_E, COL, CSS, APPLIANCES, num, fitNarrow, isPort, inReel, view2, seat, LAND as LANDV, PORT as PORTV } from '../ext.js';
import { sfx } from '../ui.js';

const V_FLOAT = 400;
// Earth-fault sums. Loop: supply + 15 m of live wall wire + 3 m of cord (live core out, earth core back).
const R_EF = Z_SUPPLY + 15 * 0.00741 + 2 * 3 * CORDS[0.75].ohm;
export function earth(s) {
  const o = { IE: 0, Ib: 0, caseV: 0 };
  const body = BODY + FEET[s.feet];
  if (s.pin === 'ok') { o.IE = MAINS / (R_EF + R_PIT + R_SRC_E); o.caseV = o.IE * R_PIT; if (s.touch) o.Ib = o.caseV / body; }
  else { o.caseV = MAINS; if (s.touch) o.Ib = MAINS / (body + R_SRC_E); }
  const leak = (o.IE + o.Ib) * 1000;
  o.tR = s.rccb ? rccbTime(leak) : Infinity;
  o.tF = fuseTime((o.IE + o.Ib) / 6);
  o.tM = mcbTime(o.IE + o.Ib, 16);
  o.t = Math.min(o.tR, o.tF, o.tM);
  o.who = !isFinite(o.t) ? 'none' : o.t === o.tR ? 'RCCB' : o.t === o.tF ? 'the board\'s 6 A fuse' : 'the wall MCB';
  const mA = o.Ib * 1000;
  o.feel = mA < 0.5 ? ['ok', 'not felt'] : mA < 10 ? ['', 'a tingle or a jolt'] : mA < 40 ? ['no', 'muscles lock'] : ['no', 'can stop the heart'];
  return o;
}
const VIEWS = {
  surge: LANDV,
  earth: LANDV,
};
const PORT = PORTV;

function person() {      // stylised, as in MCBClear: see-through grey so a current path can glow
  const g = new THREE.Group(), mat = M.matte(0xa7adb8, { transparent: true, opacity: 0.6, depthWrite: false });
  const cap = (r, len, pos, rz = 0) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat); m.position.set(...pos); m.rotation.z = rz; g.add(m); return m; };
  cap(0.24, 0.55, [0, 1.3, 0]);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), mat); head.position.set(0, 1.95, 0); g.add(head);
  cap(0.09, 0.7, [-0.12, 0.5, 0]); cap(0.09, 0.7, [0.12, 0.5, 0]); cap(0.07, 0.55, [0.33, 1.3, 0], 0.12);
  const arm = cap(0.07, 0.62, [-0.5, 1.45, 0], 1.9);
  g.pathPts = [[-0.83, 1.58, 0], [-0.5, 1.47, 0], [-0.2, 1.55, 0], [-0.05, 1.25, 0], [-0.12, 0.9, 0], [-0.12, 0.45, 0], [-0.12, 0.03, 0]];
  return Object.assign(g, { arm });
}

export default {
  id: 'surge',
  short: 'Surges and earth',
  title: 'Spikes, and the third pin',
  subtitle: 'A blue disc that soaks up voltage spikes until it wears out, and an earth pin that gives a fault somewhere safe to go.',
  view: view2(VIEWS.surge, PORTV),
  learn: `<p>Mains voltage is not perfectly smooth. Lightning kilometres away, or a big motor switching off, can put a <b>spike</b> of thousands of volts on the line for a few millionths of a second. That is enough to punch through the tiny parts in a charger or a TV.</p>
    <p>A <b>spike guard</b> answers with one part: a <b>metal-oxide varistor</b>, or MOV, wired across live and neutral. It is a disc of zinc oxide grains. At 230 V (325 V at the peaks) it is almost an insulator, leaking a few millionths of an amp. Above about <b>430 V</b> it suddenly conducts, hundreds or thousands of amps, and <b>clamps</b> the spike to around 700 to 1,000 V. The spike's energy turns into heat in the disc.</p>
    <p>Each hit damages a few grains. The MOV <b>wears out</b>, and on many boards nothing tells you. It also cannot stop a <b>direct lightning strike</b>, and it cannot survive a <b>long over-voltage</b>, such as a broken neutral putting 400 V on your sockets: it overheats and a thermal fuse cuts it out.</p>
    <p>The <b>earth pin</b> does a different job. If a live wire touches a metal case, the earth wire carries that current away, and a <b>30 mA RCCB</b>, a fuse or an MCB cuts the power (see <a href="https://glassbox.how/mcbclear/">MCBClear</a>). With a <b>two-pin plug</b>, or a board whose earth is not connected, the case just sits at 230 V and waits for a hand.</p>
    <p class="tip"><b>Try it:</b> raise the surge until the MOV dies in one hit. Then switch to "Earth fault", choose the two-pin plug and let the person touch the case.</p>`,
  terms: [
    { t: 'Surge (spike)', d: 'A very short burst of high voltage on the mains, lasting millionths of a second.' },
    { t: 'Varistor (MOV)', d: 'A resistor whose resistance collapses above a set voltage, so it shorts out spikes but ignores normal mains.' },
    { t: 'Clamping voltage', d: 'The voltage a surge protector lets through while it is conducting. Lower is better.' },
    { t: 'Joule rating', d: 'How much surge energy a protector can absorb. A bigger number means a longer life.' },
    { t: 'RCCB', d: 'A switch that trips when even 30 mA leaks to earth instead of returning on the neutral.' },
  ],
  defaults: { show: 'surge', kv: 2, float: false, pin: 'ok', rccb: true, feet: 'bare', touch: false },
  controls: [
    { key: 'show', type: 'seg', label: 'Look at', options: [{ v: 'surge', label: 'A voltage spike' }, { v: 'earth', label: 'An earth fault' }] },
    { key: 'kv', type: 'log', label: 'Spike: size of the surge', min: 0.4, max: 20, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' kV' },
    { key: 'hit', type: 'buttons', label: 'Spike: wear the MOV', items: [
      { label: 'Hit it 10 times', act: (s, inst) => inst.hit(10) },
      { label: 'Hit it 1,000 times', act: (s, inst) => inst.hit(1000) },
      { label: 'Fit a new MOV', act: (s, inst) => inst.fresh() },
    ] },
    { key: 'float', type: 'toggle', label: 'Spike: neutral breaks, 400 V stays on', hint: 'A long over-voltage, not a spike.' },
    { key: 'pin', type: 'seg', label: 'Earth: the appliance\'s plug', options: [{ v: 'ok', label: 'Three-pin, earth connected' }, { v: 'none', label: 'Two-pin, or earth missing' }] },
    { key: 'touch', type: 'toggle', label: 'Earth: a person touches the metal case' },
    { key: 'feet', type: 'seg', label: 'Earth: the person is standing', options: [{ v: 'slippers', label: 'In dry rubber slippers' }, { v: 'bare', label: 'Barefoot on a wet floor' }] },
    { key: 'rccb', type: 'toggle', label: 'Earth: RCCB fitted in the house (30 mA)' },
  ],
  quiz: [
    { q: 'What does a varistor do at the normal mains voltage?', options: ['Conducts thousands of amps', 'Lights the indicator', 'Almost nothing: it leaks a few microamps', 'Raises the voltage'], answer: 2, why: 'Its knee is around 430 V, above the 325 V peaks of 230 V mains, so it only wakes up for a spike.' },
    { q: 'A spike guard has taken many surges over the years. What is true?', options: ['Its varistor may be worn out, and the board may still power things normally', 'It gets stronger with use', 'It will now trip the MCB', 'Nothing changes, ever'], answer: 0, why: 'Every surge damages the disc a little. When it fails or its thermal fuse opens, the sockets usually still work, unprotected.' },
    { q: 'A metal-bodied appliance on a two-pin plug develops a fault: live touches the case. What happens?', options: ['The MCB trips at once', 'The fuse blows', 'The earth wire carries the current away', 'Nothing, until someone touches the case and becomes the path to earth'], answer: 3, why: 'With no earth wire there is no fault current, so nothing can trip. The case sits at 230 V.' },
  ],
  reel: [
    { ms: 5200, caption: 'A spike of thousands of volts arrives, and a blue disc called a varistor clamps it to under a thousand.', set: { show: 'surge', float: false }, act: (s, inst) => inst.fresh(), anim: { kv: [0.6, 6, true] }, view: view2(VIEWS.surge, PORT), spin: 0 },
    { ms: 5600, caption: 'With no earth pin a faulty metal case sits at 230 volts, and a wet hand becomes the path.', set: { show: 'earth', pin: 'none', feet: 'bare', rccb: false }, anim: { touch: [false, true] }, view: view2(VIEWS.earth, PORT), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const SC = 1.5;
    // ---------------- surge scene
    const gS = new THREE.Group(); root.add(gS);
    const strip = makeStrip({ n: 2, switches: false, rating: '' }); strip.scale.setScalar(SC); strip.position.set(1.3, 0, -0.7); gS.add(strip); strip.setXray(true, 0.14);
    const W = (p) => [1.3 + p[0] * SC, p[1] * SC, -0.7 + p[2] * SC];
    const xe = strip.x0;
    gS.add(cord([W([xe + 0.05, 0.42, 0]), [-2.4, 0.3, -0.7], [-3.6, 0.12, -0.2], [-5.4, 0.12, 0.6]], 0.12));
    const lap = APPLIANCES.laptop(); lap.scale.setScalar(0.9); lap.position.set(3.6, 0, -3.0); gS.add(lap);
    const lp = makePlug(6); lp.scale.setScalar(SC); lp.position.set(...W([strip.sx(1), strip.H, strip.zLN - lp.zLN])); gS.add(lp);
    gS.add(cord([W([strip.sx(1), strip.H + 0.3, -0.05]), W([strip.sx(1), strip.H + 0.45, -0.5]), [3.6, 0.12, -1.9], [3.6, 0.15, -2.4]], 0.06, 0x8a8f99));
    const yb = strip.yb + 0.07, Zl = strip.Z.live, Zn = strip.Z.neutral, mx = strip.movAt[0], sxl = strip.sx(1) - 0.19;
    const pIn = pathOf([[-5.4, 0.2, 0.6], [-3.6, 0.2, -0.2], [-2.4, 0.4, -0.7], W([xe + 0.1, 0.42, 0]), W([strip.xb0, yb, Zl]), W([mx, yb, Zl])]);
    const pDiv = pathOf([W([mx, yb, Zl]), W([mx, 0.5, (Zl + Zn) / 2]), W([mx, yb, Zn]), W([strip.xb0, yb, Zn]), W([xe + 0.1, 0.42, -0.05]), [-2.4, 0.4, -0.8], [-3.6, 0.2, -0.3], [-5.4, 0.2, 0.5]]);
    const pOn = pathOf([W([mx, yb, Zl]), W([sxl, yb, Zl]), W([sxl, yb, strip.zLN]), W([sxl, strip.H, strip.zLN])]);
    const ball = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, depthTest: false })); m.renderOrder = 8; gS.add(m); return m; };
    const bIn = ball(0xffffff, 0.2), bDiv = ball(0x9fd8ff, 0.2), bOn = ball(0xff7a59, 0.2);
    const lblMov = stage.label('', [-3.2, 0.7, 0.5], gS, 'hot');
    const lblOut = stage.label('', W([strip.sx(1) + 0.3, strip.H + 0.75, 0]), gS);

    // ---------------- earth scene
    const gE = new THREE.Group(); gE.position.set(0.5, 0, -0.4); root.add(gE);
    const wall = box(0.25, 1.7, 2.6, M.matte(0x2a3140)); wall.position.set(-5.0, 0.85, -0.4); gE.add(wall);
    const eStrip = makeStrip({ n: 2, switches: false, rating: '' }); eStrip.position.set(-1.9, 0, 0.3); gE.add(eStrip); eStrip.setXray(true, 0.16);
    const ex0 = -1.9 + eStrip.x0;
    gE.add(cord([[ex0 + 0.05, 0.42, 0.3], [ex0 - 0.5, 0.2, 0.3], [-4.4, 0.12, 0.0], [-4.86, 0.7, -0.2]], 0.085));
    const ePlate = box(0.08, 0.8, 0.8, M.plastic(0xf2f3f5)); ePlate.position.set(-4.85, 0.75, -0.2); gE.add(ePlate);
    // a metal-bodied appliance: a steel cabinet
    const caseMat = M.metal(0xb9c0cc, { roughness: 0.45, emissive: 0x000000 });
    const cab = box(1.5, 2.3, 1.3, caseMat); cab.position.set(1.6, 1.2, -1.0); gE.add(cab);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), M.glow(0xfff2a8)); spark.position.set(1.2, 1.0, -0.33); gE.add(spark);
    const aPlug = makePlug(6); aPlug.position.set(-1.9 + eStrip.sx(1), eStrip.H, 0.3 + eStrip.zLN - aPlug.zLN); gE.add(aPlug);
    const aPlug2 = makePlug(6, { earth: false }); aPlug2.position.copy(aPlug.position); gE.add(aPlug2);
    const px = -1.9 + eStrip.sx(1);
    gE.add(cord([[px, 1.0, 0.25], [px, 1.15, -0.2], [0.4, 0.12, -0.6], [0.95, 0.4, -0.9]], 0.06, 0x8a8f99));
    const man = person(); man.scale.setScalar(1.55); man.position.set(3.9, 0, -0.9); gE.add(man);
    // earth pit: a rod in the ground behind the wall, and a green wire to it
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12), M.metal(0xb87333)); pit.position.set(-5.2, 0.2, 1.7); gE.add(pit);
    const eWire = tube([[-4.86, 0.75, -0.2], [-5.2, 0.6, 0.2], [-5.25, 0.9, 1.0], [-5.2, 1.0, 1.7]], 0.04, M.plastic(COL.earth)); gE.add(eWire);
    const yE = eStrip.yb + 0.07;
    const pE = pathOf([[1.25, 1.0, -0.4], [0.95, 0.45, -0.9], [0.4, 0.2, -0.6], [px, 1.1, -0.2], [px, eStrip.H, 0.3 + eStrip.zE], [px, yE, 0.3 + eStrip.Z.earth], [-1.9 + eStrip.xb0, yE, 0.3 + eStrip.Z.earth], [ex0, 0.42, 0.3], [-4.4, 0.2, 0.0], [-4.86, 0.75, -0.2], [-5.25, 0.9, 1.0], [-5.2, 1.0, 1.7], [-5.2, -0.3, 1.7]]);
    const dE = flowDots(pE, 26, COL.earth, 0.07); gE.add(dE);
    const hand = man.pathPts.map((p) => [3.9 + p[0] * 1.55, p[1] * 1.55, -0.9 + p[2]]);
    const pB = pathOf([[2.35, 2.0, -0.9], ...hand]);
    const dB = flowDots(pB, 12, COL.leak, 0.075); gE.add(dB);
    const lblCase = stage.label('', [1.6, 2.75, -1.0], gE, 'hot');
    const lblE = stage.label('', [-3.2, 1.2, 0.2], gE);
    const lblB = stage.label('', [3.9, 3.45, -0.9], gE);
    const lblPit = stage.label('Earth pit', [-5.2, 1.35, 1.7], gE);

    // ---------------- state
    let life = 0, dead = false, fuseOpen = false, cook = 0, ph = 0, S = null, tripT = 0, tripped = false, lastShow = '';
    const X0 = 1e-6, X1 = 2e4, VMAX = 1400;
    const brd = board(root, 7.6, 3.6, 1140, 540, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      if (S.show === 'surge') {
        const x0 = 100, x1 = w - 30, y0 = h - 66, y1 = 70, xs = (i) => logX(clamp(i, X0, X1), X0, X1, x0, x1), ys = (v) => y0 - (clamp(v, 0, VMAX) / VMAX) * (y0 - y1);
        g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left'; g.fillText('The varistor\'s voltage against current', 28, 42);
        g.font = '21px sans-serif'; g.textAlign = 'right'; g.fillStyle = CSS.dim; g.fillText('20 mm disc, 275 V AC class', w - 28, 40);
        g.lineWidth = 1; g.font = '21px sans-serif';
        for (const v of [0, 325, 430, 710, 1000, 1400]) { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0, ys(v)); g.lineTo(x1, ys(v)); g.stroke(); g.fillStyle = CSS.dim; g.textAlign = 'right'; g.fillText(v + ' V', x0 - 8, ys(v) + 7); }
        g.textAlign = 'center';
        for (const [i, lab] of [[1e-6, '1 µA'], [1e-4, '0.1 mA'], [1e-3, '1 mA'], [0.1, '0.1 A'], [1, '1 A'], [100, '100 A'], [1e3, '1 kA'], [1e4, '10 kA']]) { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(xs(i), y0); g.lineTo(xs(i), y1); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(lab, xs(i), y0 + 28); }
        g.fillStyle = 'rgba(92,225,169,.12)'; g.fillRect(x0, ys(PEAK), x1 - x0, y0 - ys(PEAK));
        g.fillStyle = CSS.ok; g.textAlign = 'left'; g.fillText('normal mains: peaks of 325 V, a few microamps leak', x0 + 12, ys(PEAK) + 30);
        g.fillStyle = 'rgba(255,90,79,.14)'; g.fillRect(xs(MOV.imax), y1, x1 - xs(MOV.imax), y0 - y1);
        g.fillStyle = CSS.bad; g.textAlign = 'right'; g.fillText('past 8 kA: destroyed', x1 - 6, y0 - 12);
        g.strokeStyle = dead ? 'rgba(255,255,255,.3)' : CSS.cyan; g.lineWidth = 5; g.beginPath();
        for (let i = X0; i <= X1; i *= 1.15) { const X = xs(i), Y = ys(movV(i)); if (i === X0) g.moveTo(X, Y); else g.lineTo(X, Y); }
        g.stroke();
        g.fillStyle = CSS.dim; g.textAlign = 'right'; g.fillText('the knee: 430 V at 1 mA', xs(1e-3) + 40, ys(430) - 22);
        if (S.float) {
          const i = movI(V_FLOAT * Math.SQRT2); g.fillStyle = CSS.bad; g.beginPath(); g.arc(xs(i), ys(movV(i)), 12, 0, Math.PI * 2); g.fill();
          g.font = 'bold 24px sans-serif'; g.textAlign = 'left'; g.fillText(`400 V supply: ${Math.round(V_FLOAT * Math.SQRT2)} V peaks, ${num(i, 2)} A on every half-cycle`, x0 + 12, y1 + 60);
        } else if (!dead) {
          const r = surge(S.kv * 1000), X = xs(r.I), Y = ys(r.V);
          g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(X, y0); g.lineTo(X, Y); g.lineTo(x0, Y); g.stroke(); g.setLineDash([]);
          g.fillStyle = r.I > MOV.imax ? CSS.bad : '#fff'; g.beginPath(); g.arc(X, Y, 12, 0, Math.PI * 2); g.fill();
          g.font = 'bold 24px sans-serif'; g.textAlign = 'right'; g.fillText(`${num(S.kv, 1)} kV spike → ${num(r.I, 0)} A, clamped to ${num(r.V, 0)} V`, X - 18, Y - 16);
        } else { g.fillStyle = CSS.bad; g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; g.fillText('This varistor is finished: the spike goes straight through', w / 2, y1 + 70); }
      } else {
        const e = earth(S);
        g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left'; g.fillText('Live touches the metal case. Who notices?', 28, 44);
        const rows = [['30 mA RCCB', S.rccb ? e.tR : NaN, 'sees current that does not come back on the neutral'], ['Board\'s 6 A fuse', e.tF, 'sees total current in the live wire'], ['Wall MCB C16', e.tM, 'sees total current in the wall wire']];
        rows.forEach(([nm, t, what], i) => {
          const y = 96 + i * 76, ok = isFinite(t);
          g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(28, y - 32, w - 56, 68);
          g.fillStyle = ok ? CSS.ok : Number.isNaN(t) ? 'rgba(255,255,255,.4)' : CSS.bad; g.font = 'bold 26px sans-serif'; g.textAlign = 'left'; g.fillText(nm, 46, y);
          g.textAlign = 'right'; g.fillText(Number.isNaN(t) ? 'not fitted' : ok ? 'trips in ' + fmtTime(t) : 'never trips', w - 46, y);
          g.fillStyle = CSS.dim; g.font = '21px sans-serif'; g.textAlign = 'left'; g.fillText(what, 46, y + 27);
        });
        g.font = 'bold 23px sans-serif'; g.fillStyle = CSS.cyan; g.textAlign = 'left';
        g.fillText(`To earth ${num(e.IE, 1)} A  ·  case at ${Math.round(e.caseV)} V  ·  through the body: ${e.Ib ? num(e.Ib * 1000, e.Ib < 0.01 ? 1 : 0) + ' mA' : 'nobody touching'}`, 28, 326);
        g.font = '22px sans-serif'; g.fillStyle = e.Ib ? (e.feel[0] === 'no' ? CSS.bad : CSS.warn) : CSS.dim;
        g.fillText(e.Ib ? `That current: ${e.feel[1]} (IEC 60479-1).` : S.pin === 'ok' ? 'The earth wire carries the fault current, so a protector has something to see.' : 'No earth wire: no current flows, so nothing can trip. The case waits at 230 V.', 28, 358);
        g.fillStyle = CSS.dim; g.font = '20px sans-serif'; g.fillText('Earth pit 10 Ω, transformer earth 2 Ω, body about 1,000 Ω: as in MCBClear.', 28, 392);
      }
    }, [0, 1.35, 3.3]);

    let key = '', port = null, last = 0;
    const api = {
      hit(n) { if (dead) return; const r = surge(inst_s.kv * 1000); life += n / r.hits; if (life >= 1) { life = 1; dead = true; sfx('wrong'); } key = ''; },
      fresh() { life = 0; dead = false; fuseOpen = false; cook = 0; key = ''; },
    };
    let inst_s = { kv: 2 };
    return Object.assign(api, {
      update(dt, s, time) {
        dt = Math.max(0, dt); inst_s = s;
        const narrow = fitNarrow(stage, [lblPit, lblE]);
        const p = isPort(stage);
        if (p !== port || s.show !== lastShow) { port = p; seat(brd, p, 3.6, root, s.show === 'surge' ? { dx: -1.4, dz: 0.4, s: 1.0 } : { dx: 1.2, dz: 1.6, s: 0.8, flip: true }); wall.visible = ePlate.visible = !(p && s.show === 'earth'); }
        brd.mesh.visible = !narrow;
        if (s.show !== lastShow) { lastShow = s.show; gS.visible = s.show === 'surge'; gE.visible = s.show === 'earth'; tripped = false; tripT = 0; }
        if (!s.float && fuseOpen && !dead) { /* the thermal fuse does not reset */ }
        if (s.show === 'surge') {
          if (s.float && !(dead || fuseOpen)) { cook += dt; if (cook > 2.2) { fuseOpen = true; dead = true; life = 1; sfx('wrong'); key = ''; } } else if (!s.float) cook = 0;
          const r = surge(s.kv * 1000), gone = dead || fuseOpen;
          // one spike every 2.4 s: in along the live, most of it through the MOV and back, a little onward
          ph = (ph + dt / 2.4) % 1;
          const a = clamp(ph / 0.4, 0, 1), b = clamp((ph - 0.4) / 0.45, 0, 1), on = !s.float;
          bIn.visible = on && ph < 0.4; pIn.at(a, bIn.position);
          bDiv.visible = on && !gone && ph >= 0.4 && ph < 0.85; pDiv.at(b, bDiv.position);
          bOn.visible = on && ph >= 0.4 && ph < 0.7; pOn.at(clamp((ph - 0.4) / 0.3, 0, 1), bOn.position);
          const big = clamp(0.5 + Math.log10(s.kv) * 0.5, 0.35, 1.3);
          bIn.scale.setScalar(big); bDiv.scale.setScalar(big * 0.95); bOn.scale.setScalar(gone ? big : clamp(big * (r.V / (s.kv * 1000)) * 1.6, 0.22, big * 0.7));
          bOn.material.color.setHex(gone ? 0xff3b1f : 0xffd35a);
          const flash = on && !gone && ph >= 0.4 && ph < 0.6 ? 1 - (ph - 0.4) / 0.2 : 0;
          strip.disc.material.emissive.setHex(s.float && !gone ? 0xff3b1f : 0x6fd0ff); strip.disc.material.emissiveIntensity = s.float && !gone ? cook * 1.4 : flash * 2.5;
          strip.disc.material.color.setHex(dead ? 0x3a3d44 : COL.mov);
          const k = `${s.kv.toFixed(2)}|${s.float}|${life.toFixed(4)}|${dead}`;
          if (k !== key) {
            key = k; S = { ...s }; brd.redraw();
            lblMov.element.innerHTML = gone ? (fuseOpen ? 'Thermal fuse open: MOV cut out' : 'MOV worn out') : s.float ? 'MOV conducting non-stop: overheating' : `MOV takes <b>${num(r.I, 0)} A</b> · life used ${Math.round(life * 100)}%`;
            lblOut.element.innerHTML = s.float ? '<b>400 V</b> at the sockets' : gone ? `<b>${num(s.kv, 1)} kV</b> reaches the laptop` : `Lets through <b>${num(r.V, 0)} V</b>`;
            lblOut.element.classList.toggle('hot', gone || s.float);
          }
        } else {
          const e = earth(s);
          const k = `${s.pin}|${s.rccb}|${s.feet}|${s.touch}`;
          if (k !== key) { key = k; S = { ...s }; brd.redraw(); tripped = false; tripT = 0; aPlug.visible = s.pin === 'ok'; aPlug2.visible = s.pin !== 'ok'; }
          // show the fault for a moment, then whatever trips cuts it off; then it repeats
          tripT += dt;
          const canTrip = isFinite(e.t);
          if (!tripped && canTrip && tripT > 1.6) { tripped = true; tripT = 0; sfx('click'); }
          if (tripped && tripT > 2.2) { tripped = false; tripT = 0; }
          const liveNow = !tripped;
          dE.visible = liveNow && e.IE > 0.001; if (dE.visible) dE.step(dt, 3.2);
          dB.visible = liveNow && e.Ib > 0.0002; if (dB.visible) dB.step(dt, 0.6 + clamp(e.Ib * 1000 / 60, 0, 2.4));
          man.arm.rotation.z = s.touch ? 1.9 : 0.5; man.arm.position.set(s.touch ? -0.5 : -0.36, s.touch ? 1.45 : 1.25, 0);
          spark.visible = liveNow; spark.scale.setScalar(0.8 + 0.4 * Math.sin(time * 30));
          caseMat.emissive.setHex(0xff5ad1); caseMat.emissiveIntensity = liveNow ? (e.caseV / 230) * 0.55 : 0;
          eStrip.setMaster(true, liveNow);
          eWire.visible = lblPit.visible = true;
          lblCase.element.innerHTML = tripped ? `Power cut by ${e.who}` : `Metal case at <b>${Math.round(e.caseV)} V</b>`;
          lblCase.element.classList.toggle('hot', !tripped);
          lblE.element.innerHTML = s.pin === 'ok' ? (liveNow ? `Earth wire carries <b>${num(e.IE, 1)} A</b>` : 'Earth wire did its job') : 'No earth connection';
          lblB.element.innerHTML = !s.touch ? 'Not touching' : tripped ? 'Safe: power is off' : `<b>${num(e.Ib * 1000, e.Ib < 0.01 ? 1 : 0)} mA</b> through the body`;
          lblB.element.classList.toggle('hot', s.touch && liveNow && e.Ib > 0.01);
        }
        if (time - last > 0.5) { last = time; }
      },
      readout: (s) => {
        if (s.show === 'surge') {
          const r = surge(s.kv * 1000), gone = dead || fuseOpen;
          if (s.float) return `<div class="big no">${gone ? 'Protection gone, 400 V stays' : 'MOV is overheating'}</div>
            <div class="row"><span>Supply, neutral lost</span><b>up to 400 V (566 V peaks)</b></div>
            <div class="row"><span>MOV knee</span><b>430 V</b></div>
            <div class="row"><span>MOV current on each peak</span><b>${num(movI(V_FLOAT * Math.SQRT2), 2)} A</b></div>
            <small>A varistor is for microseconds, not for minutes. ${gone ? 'Its thermal fuse has opened. The sockets are still live.' : 'A thermal fuse beside it opens before it burns.'}</small>`;
          return `<div class="big ${gone ? 'no' : r.I > MOV.imax ? 'no' : 'ok'}">${gone ? 'No surge protection left' : r.I > MOV.imax ? 'Too big: this one kills it' : `Clamped to ${num(r.V, 0)} V`}</div>
            <div class="row"><span>MOV swallows</span><b>${gone ? '0 A' : num(r.I, 0) + ' A'}</b></div>
            <div class="row"><span>Energy turned to heat</span><b>${gone ? '0 J' : num(r.E, r.E < 10 ? 1 : 0) + ' J of ' + MOV.joules + ' J'}</b></div>
            <div class="row"><span>Hits like this it can take</span><b>${gone ? '0' : r.hits >= 1e6 ? 'over a million' : r.hits < 1 ? 'not even one' : 'about ' + Math.round(r.hits).toLocaleString('en-IN')}</b></div>
            <div class="row"><span>Life used</span><b class="${life > 0.8 ? 'no' : ''}">${Math.round(life * 100)}%</b></div>
            <small>A ${num(s.kv, 1)} kV spike lasting millionths of a second. At 230 V the MOV leaks about ${num(movI(PEAK) * 1e6, 1)} µA. Wear is illustrative.</small>`;
        }
        const e = earth(s);
        const danger = s.touch && e.Ib > 0.01 && !(e.t <= 0.04);
        const head = s.pin === 'ok' ? [isFinite(e.t) ? 'ok' : 'no', isFinite(e.t) ? `Cut off by ${e.who} in ${fmtTime(e.t)}` : 'Nothing trips'] : !s.touch ? ['no', 'Case live at 230 V, nothing trips'] : isFinite(e.t) ? ['ok', `RCCB trips in ${fmtTime(e.t)}`] : ['no', e.Ib > 0.01 ? 'Nothing trips: a deadly shock' : 'Nothing trips'];
        return `<div class="big ${head[0]}">${head[1]}</div>
          <div class="row"><span>Metal case sits at</span><b>${Math.round(e.caseV)} V</b></div>
          <div class="row"><span>Current in the earth wire</span><b>${s.pin === 'ok' ? num(e.IE, 1) + ' A' : 'no earth wire'}</b></div>
          <div class="row"><span>Through the person</span><b class="${e.feel[0]}">${s.touch ? num(e.Ib * 1000, e.Ib < 0.01 ? 1 : 0) + ' mA: ' + e.feel[1] : 'not touching'}</b></div>
          <small>${danger && s.pin === 'ok' ? `The case stays live for ${fmtTime(e.t)}: too long for a heart. An RCCB would cut it in 40 ms.` : danger ? 'A fuse or MCB cannot see a few hundred milliamps. Only an RCCB can.' : s.pin === 'ok' ? 'I = 230 V ÷ (10 Ω earth pit + 2 Ω at the transformer + wires).' : 'I = 230 V ÷ (1,000 Ω body + feet to floor).'}</small>`;
      },
    });
  },
};
