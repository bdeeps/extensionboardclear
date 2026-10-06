// Chapter 4: protection. Three clocks start when the current rises: the board's own fuse or thermal
// breaker, the MCB at the distribution board, and the cord itself heating towards 70 °C.
//  • 6 A glass fuse: IEC 60127-2 sheet 2 gates (holds 1.5 In for an hour; blows within 30 min at
//    2.1 In, 50 ms–2 s at 2.75 In, 10–300 ms at 4 In, under 20 ms at 10 In).
//  • Thermal breaker (IEC 60934 type): holds 100%, trips within an hour at 135%, 3–50 s at 200%.
//  • Wall MCB: the C-curve model of MCBClear (IS/IEC 60898-1): holds 1.13 In, instant at about 7 In.
//  • Cord: two-store heating model in ext.js, a straight cord in open air at 30 °C. "Too hot" is
//    70 °C for anything lasting, or 160 °C within 5 s for a fault (IEC 60364-4-43, PVC).
// Loads at 230 V: kettle 1,500 W = 6.5 A; + iron 1,000 W = 10.9 A; + heater 2,000 W = 19.6 A.
// Short circuit at the board: 230 V ÷ (0.35 Ω supply + 0.22 Ω wall wiring + 3 m of cord, out and back).
import { THREE, M, box, clamp } from '../kit.js';
import { makeStrip, makePlug, cord, board, panelBg, logX, cordTime, cordHeat, mcbTime, shortAmps, fmtTime, heatTint, seat, LAND as LANDV, PORT as PORTV, PROT, CORDS, SIZES, MAINS, CSS, num, fitNarrow, isPort, view2 } from '../ext.js';
import { sfx } from '../ui.js';

const X0 = 1, X1 = 1000, Y0 = 0.001, Y1 = 10000;
export function race(s) {
  const tP = PROT[s.prot].time(s.amps), tM = mcbTime(s.amps, s.wall), tC = cordTime(s.amps, s.size);
  const first = Math.min(tP, tM, tC);
  const who = !isFinite(first) ? 'none' : tP === first ? 'prot' : tM === first ? 'mcb' : 'cord';
  return { tP, tM, tC, first, who, later: Math.min(tP, tM) };
}
// The band of currents where the cord overheats before anything trips.
export function gap(s) {
  let lo = 0, hi = 0;
  for (let a = 1; a < 1000; a *= 1.01) { const r = race({ ...s, amps: a }); if (r.who === 'cord') { if (!lo) lo = a; hi = a; } }
  return lo ? [lo, hi] : null;
}
const LAND = LANDV, PORT = PORTV;

export default {
  id: 'protect',
  short: 'Fuse and breaker',
  title: 'Who trips first: the fuse, the wall MCB, or nobody?',
  subtitle: 'Three clocks race: the board\'s own protector, the breaker in the wall, and the cord heating up.',
  view: view2(LAND, PORT),
  learn: `<p>A good board carries its own guard, sized for its own cord. It is either a <b>fuse</b>, a thin wire that melts, or a <b>thermal breaker</b>, a little button with a <b>bimetal</b> strip behind it. Current warms the strip, it bends, and the contacts snap open. Press the button to reset it once it has cooled.</p>
    <p>Neither acts at once. Like every such device they follow a <b>time-current curve</b>: a small overload takes minutes, a big one takes a blink. A 6 A fuse must carry 9 A for a full hour. That is not a flaw. It is what lets a motor start without blowing the fuse.</p>
    <p>Now the important part. The breaker in your wall, the <b>MCB</b>, is sized for the <b>wall wiring</b>: usually 16 A on a power-socket circuit (see <a href="https://glassbox.how/mcbclear/">MCBClear</a>). A 16 A MCB happily carries 18 A for an hour. The thin 6 A cord of a cheap board would be far past 70 °C by then. <b>The wall MCB does not protect the board's cord.</b> Only the board's own fuse or breaker does that.</p>
    <p>On a dead <b>short circuit</b> the current jumps to hundreds of amps, and the MCB's magnet trips it in a few milliseconds. That part works for any cord.</p>
    <p class="tip"><b>Try it:</b> choose "Nothing" in the board and press "Kettle + iron + heater". Then fit the 6 A fuse and press it again.</p>`,
  terms: [
    { t: 'Fuse', d: 'A thin wire in a glass tube that melts when too much current flows for too long. It is used once.' },
    { t: 'Thermal breaker', d: 'A resettable switch opened by a bimetal strip that bends as the current heats it.' },
    { t: 'Bimetal', d: 'Two metals bonded together that expand by different amounts, so the strip curls when warm.' },
    { t: 'Time-current curve', d: 'A graph of how long a protector waits at each current: minutes for small overloads, milliseconds for huge ones.' },
    { t: 'MCB', d: 'Miniature circuit breaker: the resettable switch in the distribution board that guards the wires in the wall.' },
  ],
  defaults: { prot: 'fuse6', size: 0.75, wall: 16, amps: 6.5 },
  controls: [
    { key: 'prot', type: 'seg', label: 'Inside the board', options: Object.entries(PROT).map(([v, p]) => ({ v, label: p.label })) },
    { key: 'size', type: 'seg', label: 'The board\'s cord', options: SIZES.map((v) => ({ v, label: `${v} mm²` })), fmt: (v) => `rated ${CORDS[v].amps} A` },
    { key: 'wall', type: 'seg', label: 'MCB on the wall circuit', options: [6, 16].map((v) => ({ v, label: `C${v}` })), fmt: (v) => (v === 6 ? 'a lighting circuit' : 'a power-socket circuit') },
    { key: 'amps', type: 'log', label: 'Current drawn through the board', min: 1, max: 600, fmt: (v) => (v < 100 ? v.toFixed(1) : Math.round(v)) + ' A' },
    { key: 'go', type: 'buttons', label: 'Real loads at 230 V', items: [
      { label: 'Kettle', act: (s) => { s.amps = 6.5; } },
      { label: 'Kettle + iron', act: (s) => { s.amps = 10.9; } },
      { label: 'Kettle + iron + heater', act: (s) => { s.amps = 19.6; } },
      { label: 'Short circuit', act: (s) => { s.amps = Math.round(shortAmps(s.size)); } },
    ] },
  ],
  quiz: [
    { q: 'A board with a 0.75 mm² (6 A) cord and no fuse is plugged into a socket on a 16 A MCB. It carries 15 A. What happens?', options: ['The MCB trips at once', 'Nothing trips: 15 A is below 16 A, so the cord just overheats', 'The cord is fine, it is copper', 'The earth pin melts'], answer: 1, why: 'The MCB guards the 2.5 mm² wire in the wall. It cannot know a thinner cord is plugged in.' },
    { q: 'What opens a push-to-reset thermal breaker?', options: ['A bimetal strip that bends as the current warms it', 'A magnet', 'A timer chip', 'The neon lamp'], answer: 0, why: 'More current, more heat, more bend, until the latch lets go. It must cool before it will reset.' },
    { q: 'A 6 A glass fuse carries 9 A. How long before it blows?', options: ['A millisecond', 'A second', 'A minute', 'It may never blow: the standard makes it hold 1.5 times its rating for an hour'], answer: 3, why: 'IEC 60127-2 quick-acting fuses must carry 1.5 times the rated current for at least an hour and blow within 30 minutes at 2.1 times.' },
  ],
  reel: [
    { ms: 6000, caption: 'The 16 amp breaker in the wall guards the wall wiring. It does not protect a 6 amp cord.', set: { prot: 'none', size: 0.75, wall: 16 }, anim: { amps: [4, 19.6] }, view: view2(LAND, PORT), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // the wall MCB (on the right), the cord and a two-socket board
    const wall = box(0.25, 2.2, 2.4, M.matte(0x2a3140)); wall.position.set(4.6, 1.1, -1.4); root.add(wall);
    const mcb = new THREE.Group(); mcb.position.set(4.4, 1.5, -2.0); root.add(mcb);
    const mb = box(0.36, 1.2, 0.5, M.plastic(0xf2f3f5)); mcb.add(mb);
    const lever = box(0.2, 0.14, 0.22, M.plastic(0x1f232b)); lever.position.set(-0.26, 0.1, 0); mcb.add(lever);
    const plate = box(0.08, 0.8, 0.8, M.plastic(0xf2f3f5)); plate.position.set(4.44, 0.6, -0.8); root.add(plate);
    const plug = makePlug(6); plug.position.set(4.38, 0.6, -0.8); root.add(plug);
    plug.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
    const SX = -0.9, SZ = -1.6;
    const strip = makeStrip({ n: 2, switches: false, rating: '' }); strip.rotation.y = Math.PI; strip.position.set(SX, 0, SZ); root.add(strip); strip.setXray(true, 0.16);
    const xe = SX - strip.x0;
    const theCord = cord([[4.08, 0.6, -0.8], [3.7, 0.3, -0.8], [3.0, 0.09, -0.5], [2.4, 0.09, -1.9], [1.6, 0.09, -1.2], [xe + 0.4, 0.3, SZ], [xe - 0.05, 0.42, SZ]], 0.085); root.add(theCord);
    // the breaker's reset button, on top of the board near the fuse
    const bx = SX - strip.fuseAt[0], bz = SZ - strip.fuseAt[2];
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 20), M.plastic(0xd7263d)); btn.position.set(bx, strip.H + 0.02, bz); root.add(btn);
    const lblM = stage.label('', [4.4, 2.65, -2.0], root);
    const lblC = stage.label('', [2.2, 0.7, -1.6], root);

    let S = null, clock = Y0, done = false, R = null, G = null;
    const brd = board(root, 7.6, 4.3, 1140, 645, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      const x0 = 110, x1 = w - 30, y0 = h - 66, y1 = 74, xs = (a) => logX(clamp(a, X0, X1), X0, X1, x0, x1), ys = (t) => y0 - (Math.log(clamp(t, Y0, Y1) / Y0) / Math.log(Y1 / Y0)) * (y0 - y1);
      g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left'; g.fillText('Time to act, against current', 28, 42);
      g.font = '21px sans-serif'; g.textAlign = 'right'; g.fillStyle = CSS.dim; g.fillText('log scales', w - 28, 40);
      g.lineWidth = 1; g.font = '21px sans-serif';
      for (const [t, lab] of [[0.001, '1 ms'], [0.01, '10 ms'], [0.1, '0.1 s'], [1, '1 s'], [10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h']]) { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0, ys(t)); g.lineTo(x1, ys(t)); g.stroke(); g.fillStyle = CSS.dim; g.textAlign = 'right'; g.fillText(lab, x0 - 8, ys(t) + 7); }
      g.textAlign = 'center';
      for (const a of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(xs(a), y0); g.lineTo(xs(a), y1); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(a + ' A', xs(a), y0 + 28); }
      if (G) { g.fillStyle = 'rgba(255,90,79,.16)'; g.fillRect(xs(G[0]), y1, xs(G[1]) - xs(G[0]), y0 - y1); g.fillStyle = CSS.bad; g.font = 'bold 21px sans-serif'; g.textAlign = 'center'; g.fillText('cord cooks first', (xs(G[0]) + xs(G[1])) / 2, y1 + 24); g.fillText(`${num(G[0], 0)}–${num(G[1], 0)} A`, (xs(G[0]) + xs(G[1])) / 2, y1 + 50); }
      const curve = (fn, col, lw, dash = []) => {
        g.strokeStyle = col; g.lineWidth = lw; g.setLineDash(dash); g.beginPath(); let pen = false;
        for (let a = X0; a <= X1; a *= 1.012) { const t = fn(a); if (!isFinite(t)) continue; if (!pen) { g.moveTo(xs(a), ys(Y1)); pen = true; } g.lineTo(xs(a), ys(Math.max(t, Y0))); }
        g.stroke(); g.setLineDash([]);
      };
      curve((a) => cordTime(a, S.size), CSS.bad, 4, [10, 6]);
      curve((a) => mcbTime(a, S.wall), '#e8eef8', 3);
      if (S.prot !== 'none') curve((a) => PROT[S.prot].time(a), CSS.cyan, 5);
      // legend
      g.font = 'bold 22px sans-serif'; g.textAlign = 'left';
      const leg = [[CSS.bad, `${S.size} mm² cord too hot`], ['#e8eef8', `wall MCB C${S.wall}`]]; if (S.prot !== 'none') leg.push([CSS.cyan, `board's ${PROT[S.prot].label}`]);
      leg.forEach(([c, tx], i) => { g.fillStyle = c; g.fillRect(x1 - 262, y1 + 22 + i * 30, 30, 5); g.fillText(tx, x1 - 224, y1 + 30 + i * 30); });
      // the chosen current and the climbing clock
      const x = xs(S.amps), tc = Math.min(clock, R.first);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, ys(tc)); g.stroke();
      const col = !done ? '#fff' : R.who === 'cord' ? CSS.bad : CSS.ok;
      g.fillStyle = col; g.beginPath(); g.arc(x, ys(tc), done ? 13 : 9, 0, Math.PI * 2); g.fill();
      g.font = 'bold 25px sans-serif'; g.textAlign = x > w * 0.62 ? 'right' : 'left';
      const msg = !done ? `${num(S.amps, S.amps < 100 ? 1 : 0)} A · ${fmtTime(tc)}` : R.who === 'cord' ? `cord too hot at ${fmtTime(R.tC)}` : R.who === 'prot' ? `${PROT[S.prot].label} acts at ${fmtTime(R.tP)}` : `MCB trips at ${fmtTime(R.tM)}`;
      g.fillText(msg, x + (x > w * 0.62 ? -18 : 18), ys(tc) - 14);
    }, [0, 1.5, 3.3]);

    let key = '', port = null, pause = 0, last = 0;
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lblC]);
        const p = isPort(stage);
        if (p !== port) { port = p; seat(brd, p, 4.3, root, { dx: 1.2, dz: 0.6, s: 1.05, flip: true }); }
        brd.mesh.visible = !narrow;
        const k = `${s.prot}|${s.size}|${s.wall}|${s.amps.toFixed(2)}`;
        if (k !== key) {
          key = k; S = { ...s }; R = race(s); G = gap(s); clock = Y0; done = false; pause = 0;
          lblM.element.innerHTML = `Wall MCB <b>C${s.wall}</b>`;
          btn.visible = s.prot.startsWith('brk'); strip.fuse.visible = s.prot === 'fuse6';
        }
        // The clock climbs one decade of time every 0.55 s, until the first of the three events.
        if (!done) {
          clock *= Math.pow(10, dt / 0.55);
          if (clock >= R.first) { clock = R.first; done = true; pause = 0; if (R.who !== 'none') sfx('click'); }
          if (clock > Y1) { clock = Y1; done = true; pause = 1.0; }
        } else { pause += dt; if (pause > 2.4) { clock = Y0; done = false; } }
        const hit = done && isFinite(R.first);
        const tripP = hit && R.who === 'prot', tripM = hit && R.who === 'mcb', cooked = hit && R.who === 'cord';
        strip.fuseWire.visible = !(tripP && s.prot === 'fuse6');
        btn.position.y = strip.H + 0.02 + (tripP ? 0.12 : 0);
        lever.position.y = tripM ? -0.25 : 0.1;
        strip.setMaster(true, !(tripP || tripM));
        // the cord warms towards its final temperature as the clock runs
        const Tend = Math.min(cordHeat(s.amps, s.size).T, 220), Tnow = cooked ? Math.max(Tend, 110) : tripP || tripM ? 30 + 40 * clamp(R.first / R.tC, 0, 1) : isFinite(R.tC) ? 30 + 40 * clamp(clock / R.tC, 0, 1) : 30 + (Tend - 30) * clamp(Math.log10(clock / Y0) / 6, 0, 1);
        heatTint(theCord.material, Tnow);
        lblC.element.innerHTML = cooked ? '<b>Cord too hot</b>' : `Cord ${Math.round(Tnow)} °C`;
        lblC.element.classList.toggle('hot', cooked);
        if (time - last > 1 / 20) { last = time; brd.redraw(); }
      },
      readout: (s) => {
        const r = race(s), g = gap(s), P = PROT[s.prot];
        const head = r.who === 'none' ? ['ok', 'Runs all day'] : r.who === 'cord' ? ['no', `Cord cooks in ${fmtTime(r.tC)}`] : r.who === 'prot' ? ['ok', `${P.label} acts in ${fmtTime(r.tP)}`] : ['ok', `Wall MCB trips in ${fmtTime(r.tM)}`];
        return `<div class="big ${head[0]}">${head[1]}</div>
          <div class="row"><span>Board's ${s.prot === 'none' ? 'protector' : P.name}</span><b>${s.prot === 'none' ? 'none fitted' : fmtTime(r.tP)}</b></div>
          <div class="row"><span>Wall MCB C${s.wall}</span><b>${fmtTime(r.tM)}</b></div>
          <div class="row"><span>${s.size} mm² cord gets too hot</span><b class="${isFinite(r.tC) ? 'no' : 'ok'}">${fmtTime(r.tC)}</b></div>
          <div class="row"><span>Currents nothing guards against</span><b class="${g ? 'no' : 'ok'}">${g ? `${num(g[0], 0)}–${num(g[1], 0)} A` : 'none'}</b></div>
          <small>${r.who === 'cord' ? (isFinite(r.later) ? `Help arrives only after ${fmtTime(r.later)}.` : 'Nothing will ever trip: the current is normal for the wall circuit.') : 'Cord limit: 70 °C, or 160 °C within 5 s in a fault. Models for learning: real parts vary.'}</small>`;
      },
    };
  },
};
