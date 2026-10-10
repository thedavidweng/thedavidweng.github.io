/**
 * Stems: a song taken apart into four thin plates, stacked like a layered
 * part and fanned a little on a pin at the left end. Each plate carries its
 * own waveform as a raised ridge along its front: drums short sharp spikes,
 * bass slow wide swells, other a medium texture, vocals smooth phrases. The
 * pointer picks a plate, tested on the plates' rest tops: the gaps on either
 * side of it open and the others close up, staggered outwards from it on the
 * 700ms lift curve. At rest the vocals plate stands highest and is bright.
 * The slider is the gap opened round the chosen plate.
 */
const {
  Cam, extremes, facing, fit, poly, prism, proj, rad, ringAt, rings, seg,
  tdone, tset, tval, tween, unproj, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 150, D = 40, T = 3, HR = 9, RV = D - 6, RT = 1.3, NS = 150;
const NAMES = ["other", "bass", "drums", "vocals"];
const FAN = [5.5, 2.6, -0.4, -3.4], REST = [14, 17, 26], SHUT = 11, SL = 16, STEP = 45;

/** The four waveforms, bottom plate first: t runs 0 to 1 along the plate, the value 0 to 1 is the ridge's share of HR. */
const WAVES = [
  (t) => 0.42 + 0.22 * Math.sin(2 * Math.PI * 11 * t) + 0.16 * Math.sin(2 * Math.PI * 23 * t + 1.3) + 0.08 * Math.sin(2 * Math.PI * 41 * t),
  (t) => 0.1 + 0.85 * Math.sin(Math.PI * 2.4 * t + 0.3) ** 2,
  (t) => { const b = t * 15, f = b - Math.floor(b); return 0.08 + (Math.floor(b) % 2 ? 0.55 : 0.95) * Math.exp(-f * 7); },
  (t) => {
    const env = [0.19, 0.5, 0.81].reduce((s, c) => s + Math.exp(-(((t - c) / 0.11) ** 4)), 0);
    return 0.06 + env * (0.7 + 0.2 * Math.sin(2 * Math.PI * 5 * t + 0.8));
  },
];

/** Plate-local (u along the length, v across) to world, turned th degrees about the pin at (0, D/2). */
const toW = (u, v, th) => {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th)), w = v - D / 2;
  return [u * c - w * s, D / 2 + u * s + w * c];
};
const toL = (x, y, th) => {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th)), w = y - D / 2;
  return [x * c + w * s, D / 2 - x * s + w * c];
};
const turn = (ring, th) => ring.map((q) => {
  const [u, v] = toW(q.u, q.v, th), c = Math.cos(rad(th)), s = Math.sin(rad(th));
  return { u, v, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c };
});

/** The bottom of each plate: the rest gaps, or with plate a chosen, G on either side of it and SHUT elsewhere. */
function bases(a, G) {
  const z = [0];
  for (let i = 1; i < 4; i++) z.push(z[i - 1] + T + (a < 0 ? REST[i - 1] : i === a || i - 1 === a ? G : SHUT));
  return z;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let G = value, act = -1;

  const [r0, i0] = rings(0, 0, W, D, 7, 1.6);
  const plates = FAN.map((th, i) => ({ th, ring: turn(r0, th), inner: turn(i0, th), wave: WAVES[i] }));
  const tallest = Math.max(...[0, 1, 2, 3].map((a) => bases(a, 32)[3]), bases(-1, 0)[3]);

  const C = Cam(45, 0.5, 1.6);
  const pts = [];
  plates.forEach((p) => [[0, 0], [W + SL / 2, 0], [0, D], [W + SL / 2, D]].forEach(([u, v]) => {
    const [x, y] = toW(u, v, p.th);
    pts.push([x, y, 0], [x, y, tallest + T + HR]);
  }));
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);

  // Paint order runs bottom up: each plate is above, and so in front of, the one below it.
  // The pin's guide is painted after the plate it leaves and before the one it meets.
  const g = mk("g", {}, svg);
  const pinAt = extremes(P, plates[0].ring)[0];
  plates.forEach((p, i) => {
    if (i > 0) p.guide = mk("path", { class: "dash" }, g);
    p.el = solid(g);
    p.back = mk("path", { class: "lo" }, g);
    p.fin = mk("path", {}, g);
    p.z = tween(bases(-1, G)[i]);
    p.s = tween(0);
    p.drawn = "";
  });

  /** The ridge along the plate's front, at local depth v: a profile standing on the plate's top. */
  function ridge(p, z, v, s) {
    const base = [], top = [];
    for (let k = 0; k <= NS; k++) {
      const t = k / NS, u = 10 + t * (W - 20), [x, y] = toW(u + s, v, p.th);
      const taper = Math.min(1, t / 0.07, (1 - t) / 0.07);
      const h = 0.4 + taper * (0.4 + HR * Math.max(0.04, Math.min(1, p.wave(t))));
      base.push(P(x, y, z)); top.push(P(x, y, z + h));
    }
    return poly(top.concat(base.reverse()));
  }

  /** A ring slid s along the plate's own length. */
  const slid = (ring, th, s) => ring.map((q) => ({ ...q, u: q.u + s * Math.cos(rad(th)), v: q.v + s * Math.sin(rad(th)) }));

  function draw(i, z, s) {
    const p = plates[i], below = i > 0 ? plates[i - 1].z0 + T : 0, key = z + "," + s + "," + below;
    if (key === p.drawn) return;
    p.drawn = key; p.z0 = z;
    if (i > 0) p.guide.setAttribute("d", seg(P(pinAt.u, pinAt.v, below), P(pinAt.u, pinAt.v, z)));
    put(p.el, prism(P, front, slid(p.ring, p.th, s), slid(p.inner, p.th, s), z, z + T));
    p.back.setAttribute("d", ridge(p, z + T, RV - RT, s));
    p.fin.setAttribute("d", ridge(p, z + T, RV, s));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    plates.forEach((p, i) => { draw(i, tval(p.z, now), tval(p.s, now)); if (!tdone(p.z, now) || !tdone(p.s, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // The hit test runs on the rest tops, which never move: top plate first, as it covers the ones under it.
  const restZ = bases(-1, 0);
  function hit([sx, sy]) {
    for (let i = 3; i >= 0; i--) {
      const [x, y] = unproj(C, sx, sy, restZ[i] + T), [u, v] = toL(x, y, plates[i].th);
      if (u >= -2 && u <= W + 2 && v >= -2 && v <= D + 5) return i;
    }
    return -1;
  }

  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : 3, z = bases(a, G);
    act = a;
    plates.forEach((p, i) => {
      tset(p.z, z[i], now, Math.abs(i - from) * STEP); tset(p.s, i === a ? SL : 0, now, 0);
      const on = a < 0 ? i === 3 : i === a;
      p.el.sil.classList.toggle("hi", on); p.fin.classList.toggle("hi", on);
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1, true);

  return {
    set: (v) => { G = v; setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "stems",
  means: "A song as four stacked plates, each with its own waveform: the one under the pointer separates from the stack.",
  rules: [1, 2, 5, 10],
  range: [18, 25, 32],
  mount,
});
