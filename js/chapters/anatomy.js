// Chapter 1: what is inside an extension board. A generic four-socket board with its cover lifted:
// three bus bars, spring clips, child shutters, a switch for each socket in the live line, a master
// switch with a neon lamp and its resistor, a glass fuse and a varistor.
// Plug: Indian three-pin, IS 1293 (the BS 546 family). 6 A size: live and neutral pins 5.08 mm
// across and 14.9 mm long; earth pin 7.06 mm across and 20.6 mm long (BS 546: 0.200 × 0.585 in and
// 0.278 × 0.812 in). So the earth pin makes contact about 5.7 mm of travel before the other two,
// and on the usual shuttered sockets it is the earth pin that pushes the shutter aside.
import { THREE, clamp, smooth, exploder } from '../kit.js';
import { makeStrip, makePlug, cord, COL, PIN, fitNarrow, view2 } from '../ext.js';

const LIFT = 0.9;
export default {
  id: 'anatomy',
  short: 'Inside the board',
  title: 'What is inside an extension board?',
  subtitle: 'Lift the cover: three strips of brass, a few springs and switches, a fuse and one blue disc.',
  view: { pos: [0.6, 5.0, 7.4], target: [-0.6, 1.5, 0.1] },
  learn: `<p>An <b>extension board</b> looks clever, but it is one of the simplest machines in the room. Inside are three long strips of brass called <b>bus bars</b>: one <b>live</b>, one <b>neutral</b>, one <b>earth</b>. Every socket is just three <b>spring clips</b> sitting on those same three strips. (Real bars are plain brass. We've edged each one in its wire colour so you can tell them apart.)</p>
    <p>The <b>cord</b> has three cores of fine stranded copper: <b>brown</b> (or red) for live, <b>blue</b> (or black) for neutral, and <b>green-and-yellow</b> for earth. The live core goes through a <b>fuse</b> and the <b>master switch</b> before it reaches its bar. Each socket's own switch also sits in the <b>live</b> line, so that "off" really means no 230 V at the socket.</p>
    <p>The plug is the Indian three-pin kind (<b>IS 1293</b>). Its <b>earth pin is longer and fatter</b>: 20.6 mm against 14.9 mm. So earth connects first and disconnects last, and on most shuttered sockets it is the earth pin that slides the <b>child shutter</b> off the other two holes.</p>
    <p>The small glowing lamp is a <b>neon</b> with a big resistor in series, sipping about a thousandth of an amp. The blue disc is a <b>varistor</b>, the part that makes a board a "spike guard". It gets its own chapter.</p>
    <p class="tip"><b>Try it:</b> slide "Push the plug in" slowly and watch which pin arrives first. Then pull the board apart.</p>`,
  terms: [
    { t: 'Bus bar', d: 'A strip of metal that many things connect to. Here: three brass strips, one each for live, neutral and earth.' },
    { t: 'Live, neutral, earth', d: 'Live is at 230 V, neutral carries the current back, earth is the safety wire that normally carries nothing.' },
    { t: 'Shutter', d: 'A spring-loaded plate that covers the live and neutral holes until an earth pin pushes it aside.' },
    { t: 'IS 1293', d: 'The Indian Standard for plugs and sockets up to 250 V and 16 A: the round three-pin 6 A and 16 A kinds.' },
    { t: 'Flexible cord', d: 'A cable made of many hair-thin copper strands so that it bends without breaking.' },
  ],
  defaults: { explode: 0, xray: true, plug: 0 },
  controls: [
    { key: 'plug', type: 'range', label: 'Push the plug in', min: 0, max: 1, step: 0.005, fmt: (v) => (v < 0.54 ? 'in the air' : v < 0.67 ? 'earth pin in first' : v < 0.98 ? 'all three in' : 'fully home') },
    { key: 'explode', type: 'range', label: 'Pull the board apart', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'See-through cover' },
  ],
  quiz: [
    { q: 'How are the sockets of an extension board connected to each other?', options: ['Every socket sits on the same three bars: they are in parallel', 'One after another in a chain, so the last gets less voltage', 'Each socket has its own wire to the wall', 'They are not connected at all'], answer: 0, why: 'Three bus bars run the length of the board and every socket clips onto all three, so each socket gets the full 230 V.' },
    { q: 'Why is the earth pin of an Indian plug longer than the other two?', options: ['To make the plug look balanced', 'So that it carries more current', 'So that it is easier to pull out', 'So that earth connects first, and so that it can open the shutters'], answer: 3, why: 'The 20.6 mm earth pin lands about 5.7 mm before the 14.9 mm live and neutral pins, and it pushes the shutter aside.' },
    { q: 'Which wire should a switch break?', options: ['The earth', 'The neutral', 'The live', 'It does not matter'], answer: 2, why: 'If the switch broke only the neutral, the appliance would stop but its insides would still sit at 230 V.' },
  ],
  reel: [
    { ms: 5200, caption: 'Inside an extension board there are just three strips of brass: live, neutral and earth.', set: { xray: true, plug: 0 }, anim: { explode: [0, 0.85] }, view: view2({ pos: [1.0, 5.2, 7.2], target: [-0.3, 1.3, 0] }, { pos: [-3.5, 4.9, 3.0], target: [-0.2, 1.4, 0] }), spin: 0.25 },
    { ms: 5000, caption: 'The earth pin is longer, so it connects first and opens the child shutters.', set: { xray: true, explode: 0 }, anim: { plug: [0, 1] }, view: view2({ pos: [0.5, 2.4, 3.6], target: [0.3, 0.9, 0] }, { pos: [-0.5, 2.1, 1.9], target: [0.3, 1.0, 0] }), spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const strip = makeStrip({ n: 4, switches: true }); root.add(strip);
    const { x0, H } = strip;
    // the cord and the wall plug at its end, pins towards the wall
    const wallPlug = makePlug(6); wallPlug.position.set(x0 - 1.75, 0.42, 1.0); root.add(wallPlug);
    wallPlug.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
    root.add(cord([[x0 + 0.05, 0.42, 0], [x0 - 0.5, 0.3, 0.05], [x0 - 0.95, 0.1, 0.35], [x0 - 1.2, 0.12, 0.85], [x0 - 1.42, 0.42, 1.0]], 0.075));
    // the demo plug over socket 2
    const SI = 1, plug = makePlug(6); root.add(plug);
    const plugCord = cord([[0, 0.3, 0], [0, 0.7, -0.15], [0.1, 0.95, -0.9], [0.5, 0.6, -1.8]], 0.06, 0x8a8f99); plug.add(plugCord);
    const px = strip.sx(SI), pz = strip.zLN - plug.zLN;

    const ex = exploder([
      { obj: strip.cover, off: [0, 1.9, 0] },
      { obj: strip.shutterG, off: [0, 1.55, 0] },
      { obj: strip.swBodies, off: [0, 0.95, 0] },
      { obj: strip.bars.earth, off: [0, 0.3, 0.75] },
      { obj: strip.bars.live, off: [0, 0.62, 0] },
      { obj: strip.bars.neutral, off: [0, 0.3, -0.75] },
      { obj: strip.mov, off: [0, 1.1, -0.5] },
    ]);
    const L = (html, pos, parent = root, cls = '') => stage.label(html, pos, parent, cls);
    const major = [
      L('<b>Live bar</b>', [strip.xb1 - 0.3, strip.yb + 0.12, strip.Z.live], strip.bars.live, 'hot'),
      L('<b>Neutral bar</b>', [strip.xb1 - 1.2, strip.yb + 0.12, strip.Z.neutral], strip.bars.neutral),
      L('<b>Earth bar</b>', [strip.xb1 - 0.9, strip.yb + 0.12, strip.Z.earth], strip.bars.earth),
      L('Varistor (MOV)', [0, 0.3, 0], strip.mov),
      L('Earth pin: longer and fatter', [0, -0.55, plug.zE + 0.25], plug, 'hot'),
    ];
    const minor = [
      L('Fuse', [strip.fuseAt[0], 0.75, strip.fuseAt[2] - 0.25], strip.inner),
      L('Master switch and lamp', [strip.mx, H + 0.35, strip.mz - 0.3], strip.cover),
      L('Child shutter', [strip.sx(3), 0.72, strip.zLN - 0.25], strip.shutterG),
      L('Switch in the live line', [strip.sx(2) - 0.62, 0.72, 0.2], strip.swBodies),
      L('Three-core cord', [x0 - 0.8, 0.6, 0.4]),
      L('Cover', [strip.x0 + strip.L - 0.4, H + 0.25, -0.6], strip.cover),
    ];

    let lastX = null;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, minor);
        ex(s.explode);
        if (lastX !== s.xray) { lastX = s.xray; strip.setXray(s.xray, 0.14); }
        const y = H + LIFT * (1 - s.plug) + 1.9 * smooth(s.explode);
        plug.position.set(px, y, pz);
        const earthTip = H + LIFT * (1 - s.plug) - PIN[6].elen;
        const open = clamp((H + 0.02 - earthTip) / 0.1, 0, 1);
        for (let i = 0; i < strip.n; i++) strip.setShutter(i, i === SI ? open : 0);
        major[4].visible = s.plug < 0.5;
        if (!narrow) minor.forEach((l, i) => { l.visible = i === 4 || s.explode > 0.3; });
      },
      readout: (s) => {
        const y = LIFT * (1 - s.plug), eIn = y < PIN[6].elen, lIn = y < PIN[6].len;
        return `<div class="big ${lIn ? 'ok' : ''}">${lIn ? 'All three pins in' : eIn ? 'Earth is connected first' : 'Plug in the air'}</div>
          <div class="row"><span>Earth pin</span><b>7.06 mm × 20.6 mm</b></div>
          <div class="row"><span>Live and neutral pins</span><b>5.08 mm × 14.9 mm</b></div>
          <div class="row"><span>Shutter over the live holes</span><b>${eIn ? 'pushed open by the earth pin' : 'closed'}</b></div>
          <small>6 A plug, IS 1293. The earth pin leads by about 5.7 mm.</small>`;
      },
    };
  },
};
