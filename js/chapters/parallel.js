// Chapter 2: everything in parallel, and the load sum. Six appliances on one board: each gets the
// full 230 V and draws I = P ÷ V; the currents add on the bus bar and all of it comes down one cord.
// Wattages (typical nameplates; heater and iron as in KirchhoffClear): phone charger 10 W, laptop
// 65 W, LED TV 100 W, iron 1,000 W, kettle 1,500 W, room heater 2,000 W.
// Cord ratings: 0.75 mm² 6 A (1,380 W), 1.0 mm² 10 A (2,300 W), 1.5 mm² 16 A (3,680 W) at 230 V.
// Cord temperature: the steady model in ext.js for a 3 m cord lying in open air at 30 °C.
// The beads only show which conductors share the current and how much: real mains current is AC
// and reverses 100 times a second.
import { THREE, clamp } from '../kit.js';
import { makeStrip, makePlug, cord, pathOf, flowDots, board, panelBg, cordHeat, heatTint, tempWord, seat, LAND as LANDV, PORT as PORTV, CORDS, SIZES, MAINS, COL, CSS, PIN, APPLIANCES, num, fitNarrow, isPort, view2 } from '../ext.js';

export const APPS = [
  { id: 'charger', name: 'Phone charger', P: 10, at: [-3.9, -1.2], css: '#8ef0ff' },
  { id: 'laptop', name: 'Laptop', P: 65, at: [-2.7, -1.6], k: 0.75, css: '#b9a6ff' },
  { id: 'tv', name: 'LED TV', P: 100, at: [1.5, -3.9], css: '#6ea3ff' },
  { id: 'iron', name: 'Iron', P: 1000, at: [0.7, -1.5], css: '#5ce1a9' },
  { id: 'kettle', name: 'Kettle', P: 1500, at: [3.0, -1.7], css: '#ffb547' },
  { id: 'heater', name: 'Room heater', P: 2000, at: [4.7, -3.0], css: '#ff7a59' },
];
export const sum = (s) => { const P = APPS.reduce((t, a) => t + (s[a.id] ? a.P : 0), 0); return { P, I: P / MAINS }; };
const LAND = LANDV, PORT = PORTV;

export default {
  id: 'parallel',
  short: 'In parallel',
  title: 'Every socket in parallel: add up the load',
  subtitle: 'Switch appliances on one by one. Each adds its own current to the bar, and the whole total comes down one cord.',
  view: view2(LAND, PORT),
  learn: `<p>Because every socket sits on the same live and neutral bars, every appliance gets the <b>full 230 V</b>. That is a <b>parallel</b> circuit. Plugging in a kettle does not rob the laptop of voltage.</p>
    <p>But each appliance draws its own current, <b>I = P ÷ V</b>. A 10 W phone charger takes 0.04 A. A 1,500 W kettle takes 6.5 A. At the bar the currents simply <b>add</b>: that is Kirchhoff's junction rule (see <a href="https://glassbox.how/kirchhoffclear/">KirchhoffClear</a>). The part of the bar nearest the cord, and the cord itself, carry the <b>whole total</b>.</p>
    <p>The board has six sockets, but that is not a promise that six things can run. The limit is the <b>cord</b> and the <b>plug</b>. A 6 A board is good for <b>6 × 230 ≈ 1,380 W</b>, a 10 A one for 2,300 W, a 16 A one for 3,680 W. Anything that makes <b>heat</b> (kettle, iron, heater, induction hob, geyser) is a big load. Chargers, laptops, TVs and routers are small ones.</p>
    <p>Go over the limit and nothing dramatic happens at first. The cord just carries more current than it was made for, and warms up. The next chapter shows how hot.</p>
    <p class="tip"><b>Try it:</b> turn on the charger, laptop and TV and read the total. Now add the kettle. Then the iron and the heater, on the thin 0.75 mm² cord.</p>`,
  terms: [
    { t: 'Parallel', d: 'Connected side by side across the same two wires, so each gets the full voltage and the currents add.' },
    { t: 'Watt (W)', d: 'The rate at which an appliance uses energy. Power = voltage × current.' },
    { t: 'Ampere (A)', d: 'The unit of current. At 230 V, every 230 W is one more ampere.' },
    { t: 'Rated current', d: 'The current a cord, plug or board is built to carry all day: 6 A, 10 A or 16 A.' },
    { t: 'Junction rule', d: 'Current into a joint equals current out. So branch currents add up in the wire that feeds them.' },
  ],
  defaults: { charger: true, laptop: true, tv: false, iron: false, kettle: false, heater: false, size: 0.75 },
  controls: [
    ...APPS.map((a) => ({ key: a.id, type: 'toggle', label: `${a.name}, ${a.P.toLocaleString('en-IN')} W` })),
    { key: 'size', type: 'seg', label: 'The board\'s cord', options: SIZES.map((v) => ({ v, label: `${v} mm²` })), fmt: (v) => `rated ${CORDS[v].amps} A = ${(CORDS[v].amps * MAINS).toLocaleString('en-IN')} W` },
  ],
  quiz: [
    { q: 'A laptop is running on a board. You switch on a kettle in the next socket. What happens to the laptop\'s voltage?', options: ['It halves', 'It stays at about 230 V: the sockets are in parallel', 'It doubles', 'It drops to zero'], answer: 1, why: 'Every socket is across the same live and neutral bars. What changes is the total current in the cord.' },
    { q: 'How much current does a 1,500 W kettle draw at 230 V?', options: ['About 0.15 A', 'About 1.5 A', 'About 6.5 A', 'About 65 A'], answer: 2, why: 'I = P ÷ V = 1,500 ÷ 230 ≈ 6.5 A. That alone is more than a 6 A board is rated for.' },
    { q: 'A board has six sockets and a 6 A cord. What sets how much you can run from it?', options: ['The number of sockets', 'The length of the board', 'The colour of the cord', 'The cord and plug rating: about 1,380 W in total'], answer: 3, why: '6 A × 230 V ≈ 1,380 W for everything together, however many sockets there are.' },
  ],
  reel: [
    { ms: 5200, caption: 'Every socket gets the full 230 volts, and every appliance adds its own current to the bar.', set: { charger: true, laptop: true, tv: true, iron: false, heater: false, size: 0.75 }, anim: { kettle: [false, true] }, view: view2(LAND, PORT), spin: 0 },
    { ms: 5200, caption: 'A kettle, an iron and a heater together pull about 20 amps through a cord made for 6.', set: { charger: true, laptop: true, tv: true, kettle: true, size: 0.75 }, anim: { iron: [false, true], heater: [false, true] }, view: view2({ pos: [-1.5, 4.6, 8.4], target: [-0.6, 1.4, -1.2] }, PORT), spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const strip = makeStrip({ n: 6, switches: false, rating: 'MAX 6 A' }); root.add(strip);
    strip.setXray(true, 0.16);
    const { x0, H, Z, yb } = strip;
    const P6 = PIN[6];
    // wall socket end of the cord
    const wall = makePlug(6); wall.position.set(x0 - 2.6, 0.42, 1.0); root.add(wall);
    wall.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
    const mainCord = cord([[x0 + 0.05, 0.42, 0], [x0 - 0.7, 0.3, 0.05], [x0 - 1.4, 0.1, 0.4], [x0 - 1.9, 0.1, 0.95], [x0 - 2.28, 0.42, 1.0]], 0.085); root.add(mainCord);
    const lblCord = stage.label('', [x0 - 1.3, 0.75, 0.6], root, 'hot');

    // appliances, their plugs and cords
    const things = APPS.map((a, i) => {
      const m = APPLIANCES[a.id](); m.position.set(a.at[0], 0, a.at[1]); if (a.k) m.scale.setScalar(a.k); root.add(m);
      const plug = makePlug(6); plug.position.set(strip.sx(i), H, strip.zLN - plug.zLN); root.add(plug);
      const sxi = strip.sx(i);
      root.add(cord([[sxi, H + 0.3, -0.05], [sxi, H + 0.42, -0.5], [(sxi + a.at[0]) / 2, 0.12, -1.15], [a.at[0], 0.12, a.at[1] + 0.9], [a.at[0], 0.2, a.at[1] + 0.3]], 0.05, 0x8a8f99));
      const lbl = stage.label('', [sxi, H + 0.95, 0.1], root);
      const name = stage.label(a.name, [a.at[0], a.id === 'tv' ? 2.5 : a.id === 'heater' ? 1.95 : a.id === 'kettle' ? 1.95 : a.id === 'laptop' ? 1.35 : 0.95, a.at[1]], root);
      // branch beads: live bar → clip → up the live pin
      const bp = pathOf([[sxi - P6.dx, yb + 0.05, Z.live], [sxi - P6.dx, yb + 0.06, strip.zLN], [sxi - P6.dx, H + 0.05, strip.zLN]]);
      const bd = flowDots(bp, 3, COL.flow, 0.032); root.add(bd);
      return { a, m, plug, lbl, name, bd };
    });
    // trunk beads: one set per stretch of bar, live out and neutral back
    const xs = [strip.xb0, ...APPS.map((_, i) => strip.sx(i) - P6.dx)];
    const segs = APPS.map((_, i) => {
      const live = flowDots(pathOf([[xs[i], yb + 0.07, Z.live], [xs[i + 1], yb + 0.07, Z.live]]), i ? 4 : 3, COL.flow, 0.04);
      const neu = flowDots(pathOf([[xs[i + 1] + 2 * P6.dx, yb + 0.07, Z.neutral], [xs[i] + (i ? 2 * P6.dx : 0), yb + 0.07, Z.neutral]]), i ? 4 : 3, 0x9fc4ff, 0.034);
      root.add(live, neu); return { live, neu };
    });
    const minor = things.map((t) => t.name);

    let S = null;
    const brd = board(root, 7.6, 2.6, 1216, 416, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      const t = sum(S), rate = CORDS[S.size].amps, x0p = 34, x1p = w - 34, maxA = 22, X = (a) => x0p + (a / maxA) * (x1p - x0p);
      g.textAlign = 'left'; g.fillStyle = '#e8eef8'; g.font = 'bold 34px sans-serif';
      g.fillText(`${t.P.toLocaleString('en-IN')} W ÷ 230 V = ${num(t.I, t.I < 1 ? 2 : 1)} A in the cord`, x0p, 52);
      g.font = '22px sans-serif'; g.fillStyle = CSS.dim; g.textAlign = 'right'; g.fillText('currents add: I = P ÷ V', x1p, 50);
      const y = 118, bh = 78;
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x0p, y, x1p - x0p, bh);
      let a0 = 0;
      for (const a of APPS) if (S[a.id]) {
        const a1 = a0 + a.P / MAINS; g.fillStyle = a.css; g.fillRect(X(a0), y, Math.max(2, X(Math.min(a1, maxA)) - X(a0) - 2), bh);
        if (X(a1) - X(a0) > 90) { g.fillStyle = '#0b0d12'; g.font = 'bold 21px sans-serif'; g.textAlign = 'center'; g.fillText(a.name, (X(a0) + X(a1)) / 2, y + 34); g.fillText(num(a.P / MAINS, 1) + ' A', (X(a0) + X(a1)) / 2, y + 62); }
        a0 = a1;
      }
      g.font = '21px sans-serif'; g.textAlign = 'center';
      for (let a = 0; a <= maxA; a += 2) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(X(a) - 1, y + bh, 2, 8); g.fillStyle = CSS.dim; g.fillText(a + ' A', X(a), y + bh + 32); }
      for (const size of SIZES) {
        const r = CORDS[size].amps, on = size === S.size;
        g.strokeStyle = on ? (t.I > r ? CSS.bad : CSS.ok) : 'rgba(255,255,255,.28)'; g.lineWidth = on ? 5 : 2; g.setLineDash(on ? [] : [8, 8]);
        g.beginPath(); g.moveTo(X(r), y - 22); g.lineTo(X(r), y + bh + 6); g.stroke(); g.setLineDash([]);
        g.fillStyle = on ? (t.I > r ? CSS.bad : CSS.ok) : 'rgba(255,255,255,.45)'; g.font = `${on ? 'bold ' : ''}21px sans-serif`;
        g.fillText(`${r} A cord`, X(r), y - 30);
      }
      g.textAlign = 'left'; g.font = 'bold 26px sans-serif'; g.fillStyle = t.I > rate ? CSS.bad : CSS.ok;
      g.fillText(t.I > rate ? `Overloaded: ${Math.round((t.I / rate) * 100)}% of the ${rate} A rating` : `Within the ${rate} A rating (${Math.round((t.I / rate) * 100)}%)`, x0p, h - 50);
      g.font = '21px sans-serif'; g.fillStyle = CSS.dim; g.fillText(`${rate} A × 230 V = ${(rate * MAINS).toLocaleString('en-IN')} W is all this board can feed, however many sockets it has.`, x0p, h - 16);
    }, [0.6, 5.0, -5.6]);

    let key = '', port = null;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor);
        const p = isPort(stage);
        if (p !== port) { port = p; seat(brd, p, 2.6, root, { dx: -2.2, dz: 0.3, s: 0.9 }); }
        brd.mesh.visible = !narrow;
        const t = sum(s);
        const k = APPS.map((a) => +!!s[a.id]).join('') + s.size;
        if (k !== key) {
          key = k; S = { ...s }; brd.redraw();
          things.forEach(({ a, lbl, m }) => {
            lbl.element.innerHTML = s[a.id] ? `<b>${num(a.P / MAINS, a.P < 230 ? 2 : 1)} A</b>` : 'off';
            lbl.element.style.opacity = s[a.id] ? 1 : 0.5;
            if (m.rods) m.rods.forEach((r) => { r.material.emissiveIntensity = s[a.id] ? 2.4 : 0; });
          });
          lblCord.element.innerHTML = `Cord: <b>${num(t.I, t.I < 1 ? 2 : 1)} A</b>`;
        }
        // stretch i of the bar carries everything plugged in at socket i and beyond
        let rest = t.I;
        segs.forEach((sg, i) => {
          const on = rest > 0.005, sp = 0.35 + clamp(rest, 0, 25) * 0.16;
          sg.live.visible = sg.neu.visible = on; if (on) { sg.live.step(dt, sp); sg.neu.step(dt, sp); }
          const mine = s[APPS[i].id] ? APPS[i].P / MAINS : 0;
          things[i].bd.visible = mine > 0.005; if (mine > 0.005) things[i].bd.step(dt, 0.3 + mine * 0.16);
          rest -= mine;
        });
        heatTint(mainCord.material, cordHeat(t.I, s.size, 3).T);
      },
      readout: (s) => {
        const t = sum(s), c = CORDS[s.size], T = cordHeat(t.I, s.size, 3).T, over = t.I > c.amps, w = tempWord(T);
        return `<div class="big ${over ? 'no' : 'ok'}">${t.P.toLocaleString('en-IN')} W = ${num(t.I, t.I < 1 ? 2 : 1)} A</div>
          <div class="row"><span>Cord, ${s.size} mm²</span><b>rated ${c.amps} A = ${(c.amps * MAINS).toLocaleString('en-IN')} W</b></div>
          <div class="row"><span>Load against rating</span><b class="${over ? 'no' : 'ok'}">${Math.round((t.I / c.amps) * 100)}%</b></div>
          <div class="row"><span>Cord settles at about</span><b class="${w[0]}">${Math.round(T)} °C</b></div>
          <small>${over ? 'Too much for this cord. Move the heat-makers to a 16 A wall socket.' : 'Each socket still gets the full 230 V.'}</small>`;
      },
    };
  },
};
