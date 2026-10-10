/**
 * OpenKara: a song taken apart and mixed for karaoke, in four states. A song
 * is one thick slab with one dense waveform ridge along its front; split, it
 * is two plates (vocals over accompaniment), then four (vocals, drums, bass,
 * other), each with its own ridge as in Stems; mixed, the four stand on edge
 * in a row on a mixer base, a fader knob in a slot under each, the vocals'
 * fader pulled down and its plate sunk low. The pointer's x picks the state
 * from four fixed bands; every plate tweens to it, staggered by its distance
 * from the pointer. Splitting swaps the whole for its parts at once; merging
 * swaps them back once the parts have landed. At rest the song is in four
 * stems and the vocals plate is bright. The slider is the stagger.
 */
const {
  Cam, clamp, fit, hull, open, poly, prism, proj, rad, rings, rrect, run, unproj, fillet, reducedMotion,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 150, D = 40, T = 3, HR = 9, RT = 1.3, BI = 1.6;
const HB = 24, YF = 102, XS = [21, 57, 93, 129], UP = 15, DOWN = 3, KH = 6;
const NAMES = ["song", "2 stems", "4 stems", "mix"], REST = 2;

const WAVES = [
  (t) => 0.42 + 0.22 * Math.sin(2 * Math.PI * 11 * t) + 0.16 * Math.sin(2 * Math.PI * 23 * t + 1.3) + 0.08 * Math.sin(2 * Math.PI * 41 * t),
  (t) => 0.1 + 0.85 * Math.sin(Math.PI * 2.4 * t + 0.3) ** 2,
  (t) => { const b = t * 15, f = b - Math.floor(b); return 0.08 + (Math.floor(b) % 2 ? 0.55 : 0.95) * Math.exp(-f * 7); },
  (t) => {
    const env = [0.19, 0.5, 0.81].reduce((s, c) => s + Math.exp(-(((t - c) / 0.11) ** 4)), 0);
    return 0.06 + env * (0.7 + 0.2 * Math.sin(2 * Math.PI * 5 * t + 0.8));
  },
];
const ACC = (t) => 0.3 * WAVES[0](t) + 0.25 * WAVES[1](t) + 0.5 * WAVES[2](t);
const MIX = (t) => 0.22 * (WAVES[0](t) + WAVES[1](t) + WAVES[2](t) + WAVES[3](t)) + 0.14 * Math.sin(2 * Math.PI * 67 * t) + 0.08;

// Elements in paint order: song, other, bass, drums, accompaniment, vocals. [part, thickness, wave, samples]
const ELS = [["song", 12, MIX, 220], ["other", T, WAVES[0], 150], ["bass", T, WAVES[1], 150], ["drums", T, WAVES[2], 150], ["acc", T, ACC, 160], ["vocals", T, WAVES[3], 150]];
// Each element's pose in each state: [x, y, lowest z, yaw, tilt about its length, width across], and whether it shows.
const flat = (z) => [W / 2, D / 2, z, 0, 0, D];
const stand = (i, wd) => [XS[i], D / 2, HB, 90, 90, wd];
const STATES = [
  [[flat(22), 1], [flat(22), 0], [flat(25), 0], [flat(28), 0], [flat(25), 0], [flat(31), 0]],
  [[flat(22), 0], [flat(25), 0], [flat(25), 0], [flat(25), 0], [flat(25), 1], [flat(51), 1]],
  [[flat(22), 0], [flat(0), 1], [flat(17), 1], [flat(34), 1], [flat(25), 0], [flat(51), 1]],
  [[flat(22), 0], [stand(0, D), 1], [stand(1, D), 1], [stand(2, D), 1], [flat(25), 0], [stand(3, 14), 1]],
];
const BRIGHT = [0, 5, 5, -1];

function frame(p, Tk) {
  const Wd = p[5], cp = Math.cos(rad(p[3])), sp = Math.sin(rad(p[3])), cf = Math.cos(rad(p[4])), sf = Math.sin(rad(p[4]));
  const a = [cp, sp, 0], b = [-sp * cf, cp * cf, sf], c = [sp * sf, -cp * sf, cf];
  const z = p[2] + (Wd / 2) * Math.abs(sf) + (Tk / 2) * Math.abs(cf);
  const w = (u, v, t) => [p[0] + u * a[0] + v * b[0] + t * c[0], p[1] + u * a[1] + v * b[1] + t * c[1], z + v * b[2] + t * c[2]];
  return { a, b, c, sf, w };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, cur = null, px = 200, swapAt = 0;

  const C = Cam(45, 0.5, 1.42), box = [];
  STATES.forEach((st) => st.forEach(([p, on], i) => {
    if (!on) return;
    const f = frame(p, ELS[i][1]);
    for (const u of [-W / 2, W / 2]) for (const v of [-p[5] / 2, p[5] / 2]) for (const t of [-ELS[i][1] / 2, ELS[i][1] / 2]) {
      const q = f.w(u, v, t);
      box.push(q, [q[0], q[1], q[2] + HR + 1]);
    }
  }));
  for (const x of [0, W]) for (const y of [-62, YF + 5]) box.push([x, y, 0], [x, y, HB]);
  fit(C, box, 200, 166);
  const P = proj(C), Pw = (q) => P(q[0], q[1], q[2]);
  const [x0, y0] = unproj(C, 200, 166, 0), [x1, y1] = unproj(C, 200, 166, 1), V = [x1 - x0, y1 - y0, 1];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

  /** The plate's silhouette and its one crease, on the face toward the camera. */
  function plate(p, Tk) {
    const f = frame(p, Tk), Wd = p[5], r = Math.min(7, Wd / 2 - 0.5), h = Tk / 2, out = [];
    const ring = rrect(-W / 2, -Wd / 2, W / 2, Wd / 2, r, 4), inner = rrect(-W / 2 + BI, -Wd / 2 + BI, W / 2 - BI, Wd / 2 - BI, r - BI, 4);
    for (const q of ring) out.push(Pw(f.w(q.u, q.v, h)), Pw(f.w(q.u, q.v, -h)));
    const face = dot(f.c, V) >= 0 ? h : -h;
    const near = (q) => dot([q.nu * f.a[0] + q.nv * f.b[0], q.nu * f.a[1] + q.nv * f.b[1], q.nv * f.b[2]], V) > 1e-6;
    const cr = run(inner, near);
    return { f, sil: poly(hull(out)), crease: cr.length > 1 ? open(cr.map((q) => Pw(f.w(q.u, q.v, face)))) : "" };
  }

  /** The ridge standing on the plate: along its front when it lies flat, along its top edge when it stands. */
  function ridge(f, p, Tk, el, back) {
    const s = clamp(f.sf, 0, 1), base = [], top = [];
    let v = p[5] / 2 - 6 * (1 - s), t = (Tk / 2) * (1 - s) + (RT / 2) * s;
    if (back) { v -= RT * (1 - s); t -= RT * s; }
    for (let k = 0; k <= el[3]; k++) {
      const q = k / el[3], u = -W / 2 + 10 + q * (W - 20), b = f.w(u, v, t);
      const taper = Math.min(1, q / 0.07, (1 - q) / 0.07);
      const hgt = 0.4 + taper * (0.4 + HR * Math.max(0.04, Math.min(1, el[2](q))));
      base.push(Pw(b)); top.push(P(b[0], b[1], b[2] + hgt));
    }
    return poly(top.concat(base.reverse()));
  }

  // The mixer: a low base, a slot on its front face under each channel, and a knob in each slot.
  const mg = mk("g", { "data-part": "mixer" }, svg);
  const base = solid(mg), slots = XS.map(() => mk("path", { class: "lo" }, mg));
  const knobs = XS.map((_, i) => ({ el: solid(i === 3 ? mk("g", { "data-part": "fader" }, mg) : mg), z: tween(UP), drawn: "" }));
  const mixer = { on: false, pend: null, drawn: false };
  const [bR, bI] = rings(0, -62, W, YF, 6, 1.6);
  const slot = (x) => poly(fillet([[x - 2, DOWN - 1.5], [x + 2, DOWN - 1.5], [x + 2, UP + KH + 1.5], [x - 2, UP + KH + 1.5]].map(([u, z]) => P(u, YF, z)), [2, 2, 2, 2], 3));

  const els = ELS.map((e, i) => {
    const g = mk("g", { "data-part": e[0] }, svg), el = solid(g);
    const back = mk("path", { class: "lo" }, g), fin = mk("path", {}, g);
    return { e, el, back, fin, tw: STATES[REST][i][0].map((v) => tween(v)), on: false, pend: null, drawn: "" };
  });
  const front = (() => { const C2 = C; return HL.facing(C2); })();

  function show(o, on) {
    o.on = on;
    o.drawn = "";
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const o of [...els, mixer]) {
      if (o.pend) { if (now >= swapAt) { show(o, o.pend.on); o.pend = null; } else moving = true; }
    }
    els.forEach((o) => {
      const p = o.tw.map((t) => tval(t, now));
      if (o.tw.some((t) => !tdone(t, now))) moving = true;
      const key = o.on ? p.join() : "off";
      if (key === o.drawn) return;
      o.drawn = key;
      if (!o.on) { put(o.el, { sil: "", crease: "" }); o.back.setAttribute("d", ""); o.fin.setAttribute("d", ""); return; }
      const r = plate(p, o.e[1]);
      put(o.el, r);
      o.back.setAttribute("d", ridge(r.f, p, o.e[1], o.e, true));
      o.fin.setAttribute("d", ridge(r.f, p, o.e[1], o.e, false));
    });
    if (mixer.drawn !== mixer.on) {
      mixer.drawn = mixer.on;
      put(base, mixer.on ? prism(P, front, bR, bI, 0, HB) : { sil: "", crease: "" });
      slots.forEach((sl, i) => sl.setAttribute("d", mixer.on ? slot(XS[i]) : ""));
      knobs.forEach((k) => { k.drawn = ""; });
    }
    knobs.forEach((k, i) => {
      const z = tval(k.z, now), key = mixer.on ? String(z) : "off";
      if (!tdone(k.z, now)) moving = true;
      if (key === k.drawn) return;
      k.drawn = key;
      const [r, ri] = rings(XS[i] - 6, YF, XS[i] + 6, YF + 5, 1.6, 0.7);
      put(k.el, mixer.on ? prism(P, front, r, ri, z, z + KH) : { sil: "", crease: "" });
    });
    return moving;
  });
  bag.add(B.unregister);

  /** Sends every element to state s (-1 is rest), each after a delay set by its distance from the pointer. */
  function choose(s) {
    if (s === cur) return;
    const now = performance.now(), k = s < 0 ? REST : s, prev = cur === null ? null : cur < 0 ? REST : cur, st = STATES[k];
    cur = s;
    let last = 0;
    els.forEach((o, i) => {
      const [p, on] = st[i], delay = prev === null ? 0 : (Math.abs(P(p[0], p[1], p[2])[0] - px) / 40) * stag;
      last = Math.max(last, delay);
      o.tw.forEach((t, j) => tset(t, p[j], now, delay));
      o.el.sil.classList.toggle("hi", i === BRIGHT[k]); o.fin.classList.toggle("hi", i === BRIGHT[k]);
      o.pend = { on: !!on };
    });
    knobs.forEach((kn, i) => tset(kn.z, k === 3 && i === 3 ? DOWN : UP, now, (Math.abs(P(XS[i], YF, 0)[0] - px) / 40) * stag));
    knobs[3].el.sil.classList.toggle("hi", k === 3);
    mixer.pend = { on: k === 3 };
    // Splitting swaps the whole for its parts at once; merging waits until the parts have landed on the whole.
    swapAt = prev === null || k >= prev || reducedMotion() ? now : now + 700 + last;
    read.textContent = s < 0 ? "rest" : NAMES[s];
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { px = p[0]; choose(clamp(Math.floor(p[0] / 100), 0, 3)); },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "openkara",
  means: "A song as one slab, split into two stems, then four, then stood on a mixer with the vocals pulled down. The pointer picks the state.",
  rules: [1, 2, 4, 5],
  range: [0, 40, 80],
  mount,
});
