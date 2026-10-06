// Chapter 6: choosing and using one. Four boxes that look alike and promise different things, and
// six kinds of trouble. The table is what each kind is built to do; the words on the pack are trade
// names, so the numbers on the label are what count.
//  • Ratings: 6 A = 1,380 W, 10 A = 2,300 W, 16 A = 3,680 W at 230 V.
//  • Indian Standards: IS 1293 (plugs and socket-outlets up to 250 V, 16 A), IS 694 (PVC insulated
//    cables and cords), IS 18830:2024 (cord extension sets, based on IEC 60884-2-7), IS 15368 (cable
//    reels, based on IEC 61242), IS 3854 (switches). Surge protective devices: IEC 61643-11.
//  • UPS: an offline UPS switches to its battery in about 5–15 ms (see UPSClear).
//  • Earth faults: no board of any kind replaces the earth connection and a 30 mA RCCB (CEA safety
//    regulations 2023; see MCBClear).
import { THREE, M, box, clamp } from '../kit.js';
import { makeStrip, cord, board, panelBg, MAINS, CSS, num, fitNarrow, isPort, view2, seat, LAND as LANDV, PORT as PORTV } from '../ext.js';

const DEV = [
  { id: 'ext', name: 'Plain board', what: 'sockets on a cord' },
  { id: 'spike', name: 'Spike guard', what: 'adds a fuse and a small MOV' },
  { id: 'surge', name: 'Surge protector', what: 'bigger MOVs, rated in joules' },
  { id: 'ups', name: 'UPS', what: 'a battery and an inverter' },
];
const EVENTS = {
  normal: { label: 'Normal day', v: [2, 2, 2, 2], note: 'All four pass 230 V straight through. That is most of what any of them ever does.' },
  overload: { label: 'Too many heaters', v: [1, 2, 2, 2], note: 'A fuse or thermal breaker sized for the cord cuts an overload. A bare board may have neither: check.' },
  spike: { label: 'Voltage spike', v: [0, 1, 2, 1], note: 'A spike guard has one small varistor and usually no sign when it has worn out. A surge protector states its clamping voltage and joules and shows a "protected" lamp.' },
  over: { label: '400 V for a minute', v: [0, 0, 0, 1], note: 'Varistors cannot hold back a long over-voltage: they overheat and drop out. Only a UPS or a stabiliser that disconnects or regulates can help, and not every UPS does.' },
  cut: { label: 'Power cut', v: [0, 0, 0, 2], note: 'Only a UPS stores energy. An offline UPS takes over in about 5 to 15 milliseconds and runs a computer for some minutes.' },
  shock: { label: 'Faulty appliance', v: [0, 0, 0, 0], note: 'None of them stops an electric shock. That is the job of the earth pin, the house earthing and a 30 mA RCCB.' },
};
const WORD = ['No', 'Partly', 'Yes'], COLS = [CSS.bad, CSS.warn, CSS.ok], HEX = [0xff5a4f, 0xffb547, 0x5ce1a9];
const LAND = LANDV, PORT = PORTV;

export default {
  id: 'choose',
  short: 'Choosing one',
  title: 'Spike guard, surge protector, UPS: which is which?',
  subtitle: 'Four boxes that look alike and promise different things. Pick a kind of trouble and see who helps.',
  view: view2(LAND, PORT),
  learn: `<p>The words on the pack are loose. A plain <b>extension board</b> is sockets on a cord, sometimes with a fuse. A <b>spike guard</b> adds a fuse and one small varistor. A <b>surge protector</b> has bigger varistors, a stated <b>clamping voltage</b> and <b>joule rating</b>, and a lamp that shows the protection is still alive. A <b>UPS</b> has a battery and keeps things running in a power cut (see <a href="https://glassbox.how/upsclear/">UPSClear</a>). None of them saves you from a shock: that needs the <b>earth</b> and an <b>RCCB</b>.</p>
    <p><b>Read the label, not the name.</b> Find the current rating (6 A, 10 A or 16 A) and the cord size in mm². Multiply amps by 230 for the most watts it can feed. Look for the <b>ISI mark</b> with the standard's number: <b>IS 1293</b> for the plug and sockets, <b>IS 694</b> for the cord. India also has a standard just for these products, <b>IS 18830</b> (cord extension sets), and one for cable reels, IS 15368.</p>
    <p><b>Do:</b> add up the watts. Give every heater, kettle, iron, induction hob, geyser, fridge and AC its own 16 A wall socket. Unwind a reel fully. Keep boards dry and off the floor where it is mopped. Replace a board that is scorched, cracked, warm, buzzing, or loose around the plug.</p>
    <p><b>Don't:</b> chain one board into another. Don't run cords under carpets or through doorways. Don't push a two-pin plug's wires in with matchsticks, bend an earth pin away, or defeat a shutter with a pen. Don't hide a hot board behind a curtain.</p>
    <p class="tip"><b>Try it:</b> pick "Voltage spike", then "400 V for a minute". Then set your own load in watts against a 6 A board.</p>`,
  terms: [
    { t: 'Spike guard', d: 'A trade name for an extension board with a fuse and a small varistor. It is not a rating.' },
    { t: 'Surge protector', d: 'A device built and rated to clamp voltage spikes, with its clamping voltage and energy stated.' },
    { t: 'UPS', d: 'Uninterruptible power supply: a battery, charger and inverter that take over when the mains fails.' },
    { t: 'ISI mark', d: 'The Bureau of Indian Standards mark, printed with an IS number, showing a product is certified to that standard.' },
    { t: 'Stabiliser', d: 'A transformer with switched taps that keeps the output near 230 V when the supply sags or swells.' },
  ],
  defaults: { event: 'spike', watts: 1500, rating: 6 },
  controls: [
    { key: 'event', type: 'seg', label: 'What goes wrong', options: Object.entries(EVENTS).map(([v, e]) => ({ v, label: e.label })) },
    { key: 'watts', type: 'range', label: 'Everything you want to plug in', min: 0, max: 4000, step: 50, fmt: (v) => `${v.toLocaleString('en-IN')} W = ${num(v / MAINS, 1)} A` },
    { key: 'rating', type: 'seg', label: 'The board\'s rating', options: [6, 10, 16].map((v) => ({ v, label: v + ' A' })), fmt: (v) => `up to ${(v * MAINS).toLocaleString('en-IN')} W` },
  ],
  quiz: [
    { q: 'Which of these keeps a computer running through a power cut?', options: ['A spike guard', 'A UPS', 'A surge protector', 'A longer extension cord'], answer: 1, why: 'Only a UPS stores energy, in a battery. The others just pass the mains through.' },
    { q: 'A board is marked 6 A. What is the most it should feed at 230 V?', options: ['About 60 W', 'About 6,000 W', 'About 1,380 W', 'As much as its sockets allow'], answer: 2, why: 'P = V × I = 230 × 6 = 1,380 W in total across all its sockets.' },
    { q: 'What protects a person from a shock off a faulty metal appliance?', options: ['A spike guard\'s varistor', 'A thicker cord', 'The fuse alone', 'A working earth connection and a 30 mA RCCB'], answer: 3, why: 'Varistors and fuses guard equipment and wires. Shock protection needs the earth pin, house earthing and an RCCB.' },
  ],
  reel: [
    { ms: 5600, caption: 'A spike guard stops spikes, not power cuts. Read the label: 6 amps means 1,380 watts in total.', set: { watts: 1500, rating: 6 }, anim: { event: ['spike', 'cut'] }, view: view2(LAND, PORT), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const xs = [-4.35, -1.75, 0.85, 4.1];
    const lamps = [], labels = [], strips = [];
    DEV.forEach((d, i) => {
      const g = new THREE.Group(); g.position.set(xs[i], 0, -1.0); root.add(g);
      if (d.id === 'ups') {
        const body = box(1.5, 1.9, 2.3, M.plastic(0x2a2e36, { transparent: true, opacity: 0.55, depthWrite: false })); body.position.y = 0.95; g.add(body);
        const batt = box(1.1, 0.9, 1.4, M.plastic(0x1b6fb3)); batt.position.set(0, 0.5, -0.3); g.add(batt);
        const inv = box(1.0, 0.5, 0.8, M.metal(0x9aa3b2, { roughness: 0.5 })); inv.position.set(0, 1.35, 0.5); g.add(inv);
        for (const s of [-1, 1]) { const t = box(0.14, 0.12, 0.14, M.metal(0xd4a24a)); t.position.set(s * 0.3, 1.0, -0.3); g.add(t); }
        g.userData.batt = batt;
      } else {
        const st = makeStrip({ n: 2, switches: false, rating: d.id === 'ext' ? '6 A' : d.id === 'spike' ? '6 A  SPIKE' : '10 A  SURGE' }); st.scale.setScalar(0.62); g.add(st);
        st.setXray(d.id !== 'ext' ? true : false, 0.2);
        st.mov.visible = d.id !== 'ext'; st.fuse.visible = d.id !== 'ext';
        if (d.id === 'surge') { st.mov.scale.setScalar(1.5); const m2 = st.mov.clone(); m2.position.x += 0.5; st.inner.add(m2); }
        g.add(cord([[st.x0 * 0.62, 0.26, 0], [st.x0 * 0.62 - 0.25, 0.1, 0.3], [st.x0 * 0.62 - 0.1, 0.08, 0.9]], 0.05));
        strips.push(st); g.userData.strip = st;
      }
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), M.glow(0x5ce1a9)); lamp.position.set(0, d.id === 'ups' ? 2.5 : 1.0, 0); g.add(lamp); lamps.push(lamp);
      labels.push(stage.label('', [0, d.id === 'ups' ? 3.0 : 0.1, 0.78], g));
      g.userData.dev = d;
    });
    const groups = root.children.filter((c) => c.userData.dev);

    let S = null;
    const brd = board(root, 7.8, 4.0, 1170, 600, (g, w, h) => {
      panelBg(g, w, h);
      if (!S) return;
      const c0 = 250, cw = (w - c0 - 20) / 4, r0 = 62, rh = 46;
      g.font = 'bold 23px sans-serif'; g.textAlign = 'center';
      g.font = 'bold 21px sans-serif'; DEV.forEach((d, i) => { g.fillStyle = '#e8eef8'; g.fillText(d.name, c0 + cw * (i + 0.5), 42); });
      Object.entries(EVENTS).forEach(([id, e], r) => {
        const y = r0 + r * rh, on = id === S.event;
        if (on) { g.fillStyle = 'rgba(142,240,255,.13)'; g.fillRect(14, y, w - 28, rh - 4); }
        g.textAlign = 'left'; g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.7)'; g.font = `${on ? 'bold ' : ''}24px sans-serif`; g.fillText(e.label, 30, y + 30);
        e.v.forEach((v, i) => {
          const x = c0 + cw * (i + 0.5);
          g.globalAlpha = on ? 1 : 0.55; g.fillStyle = COLS[v]; g.beginPath(); g.arc(x - 42, y + 22, 10, 0, Math.PI * 2); g.fill();
          g.textAlign = 'left'; g.font = 'bold 22px sans-serif'; g.fillText(WORD[v], x - 24, y + 30); g.globalAlpha = 1;
        });
      });
      const e = EVENTS[S.event]; g.fillStyle = '#e8eef8'; g.font = '20px sans-serif'; g.textAlign = 'left';
      const words = e.note.split(' '); let line = '', y = r0 + 6 * rh + 24;
      for (const wd of words) { if (g.measureText(line + wd).width > w - 60) { g.fillText(line, 30, y); line = ''; y += 25; } line += wd + ' '; }
      g.fillText(line, 30, y);
      const I = S.watts / MAINS, over = I > S.rating;
      g.font = 'bold 22px sans-serif'; g.fillStyle = over ? CSS.bad : CSS.ok;
      g.fillText(`Your load: ${S.watts.toLocaleString('en-IN')} W ÷ 230 V = ${num(I, 1)} A on a ${S.rating} A board: ${over ? 'too much' : 'fine'}`, 30, h - 14);
    }, [0, 1.45, 3.2]);

    let key = '', port = null;
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, labels);
        const p = isPort(stage);
        if (p !== port) {
          port = p; seat(brd, p, 4.0, root, { dx: 0, dz: 0.2, s: 1.15 });
          groups.forEach((g, i) => g.position.set(p ? [1.5, 1.5, -1.7, -1.9][i] : xs[i], 0, p ? [1.5, -1.5, 1.5, -1.6][i] : -1.0));
        }
        brd.mesh.visible = !narrow;
        const e = EVENTS[s.event] || EVENTS.normal;
        const k = `${s.event}|${s.watts}|${s.rating}`;
        if (k !== key) {
          key = k; S = { ...s, event: EVENTS[s.event] ? s.event : 'normal' }; brd.redraw();
          DEV.forEach((d, i) => { labels[i].element.innerHTML = `${d.name}: <b>${WORD[e.v[i]]}</b>`; lamps[i].material.color.setHex(HEX[e.v[i]]); });
          strips.forEach((st) => st.setMaster(true, s.event !== 'cut'));
        }
        const pulse = 0.85 + 0.15 * Math.sin(time * 4);
        lamps.forEach((l, i) => l.scale.setScalar(e.v[i] === 2 ? pulse : 0.8));
        const ups = groups[3].userData.batt; ups.material.emissive.setHex(0x2b8cff); ups.material.emissiveIntensity = s.event === 'cut' ? 0.9 * pulse : 0.05;
      },
      readout: (s) => {
        const e = EVENTS[s.event] || EVENTS.normal, I = s.watts / MAINS, over = I > s.rating;
        return `<div class="big">${e.label}</div>
          ${DEV.map((d, i) => `<div class="row"><span>${d.name}</span><b class="${['no', '', 'ok'][e.v[i]]}">${WORD[e.v[i]]}</b></div>`).join('')}
          <div class="row"><span>${s.watts.toLocaleString('en-IN')} W on ${s.rating} A</span><b class="${over ? 'no' : 'ok'}">${num(I, 1)} A: ${over ? 'too much' : 'fine'}</b></div>
          ${stage.host.clientWidth < 560 ? `<small>${e.note}</small>` : ''}`;
      },
    };
  },
};
