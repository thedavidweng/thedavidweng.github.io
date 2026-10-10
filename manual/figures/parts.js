/**
 * Parts: the molded hardware tray from a flat-pack box, with five pockets. A
 * fluted dowel, a cam-lock disc, an L bracket, a hex key and a screw each sit
 * in their own pocket at their own angle. The pointer picks a pocket: its part
 * lifts out, and its neighbours lift less, staggered by distance on the 700ms
 * lift curve. At rest the bracket sits half out and bright. The slider is the
 * height a chosen part lifts to.
 *
 * Every part is drawn in its own group, marked data-part p1 to p5, so the rest
 * pose can be cut into icons. The tray's walls stay outside those groups.
 */
const {
  Cam, circ, facing, fillet, fit, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const N = 5, PX = 32, PW = 26, X1 = 6 + 4 * PX + PW + 12, Y1 = 70, PY0 = 8, PY1 = 56, CY = 32;
const WH = 9, PD = 4, FL = WH - PD, LMAX = 28, TALL = 18;
const YAW = [9, -14, 6, -8, 12], REST = [0, 0.1, 0.36, 0.08, 0], FALL = [1, 0.45, 0.2, 0.1, 0.05], STEP = 45;

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** Pocket i's own frame: a along its width, b along its length, c up from z, turned by the part's yaw. */
function frame(i, P) {
  const cx = 6 + i * PX + PW / 2, c = Math.cos(rad(YAW[i])), s = Math.sin(rad(YAW[i]));
  const w = (a, b) => [cx + a * c - b * s, CY + a * s + b * c];
  return {
    w,
    T: (a, b, h, z) => { const [x, y] = w(a, b); return P(x, y, z + h); },
    ring: (rg) => rg.map((q) => ({ u: cx + q.u * c - q.v * s, v: CY + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })),
  };
}

/** A circle across a lying axis: at b along it, radius r, its centre h above the base. */
const disc = (F, b, r, h, z, n = 20) =>
  Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return F.T(r * Math.cos(t), b, h + r * Math.sin(t), z); });
const hullOf = (...ds) => poly(hull([].concat(...ds)));

/** Each part, as [class, path of its base height z] in paint order. */
const BUILD = [
  // dowel: a cylinder lying along its pocket, chamfered ends, three flutes along the side that faces up
  (F) => {
    const R = 4.2, flute = (z) => [20, 60, 100].map((d) => {
      const ca = R * Math.cos(rad(d)), h = R + R * Math.sin(rad(d));
      return seg(F.T(ca, -17, h, z), F.T(ca, 17, h, z));
    }).join("");
    return [
      ["sil", (z) => hullOf(disc(F, -20, R - 1.2, R, z), disc(F, -18.8, R, R, z), disc(F, 18.8, R, R, z), disc(F, 20, R - 1.2, R, z))],
      ["nf lo", flute],
      ["nf lo", (z) => poly(disc(F, 20, R - 1.2, R, z))],
    ];
  },
  // cam lock: a round disc with a driver slot on top and the mouth that takes the bolt's head in its side
  (F, P, front) => {
    const R = 9.5, H = 6, ring = F.ring(circ(R, 28)), inner = F.ring(circ(R - 1.4, 28));
    const slot = F.ring(rrect(-6.5, -1.3, 6.5, 1.3, 1.3, 3)), [cx, cy] = F.w(0, 0);
    const arc = (z) => Array.from({ length: 7 }, (_, k) => { const t = rad(19 + k * 52 / 6); return P(cx + R * Math.cos(t), cy + R * Math.sin(t), z); });
    let pr;
    return [
      ["sil", (z) => (pr = prism(P, front, ring, inner, z, z + H)).sil],
      ["nf lo", () => pr.crease],
      ["nf", (z) => poly(ringAt(P, slot, z + H))],
      ["nf lo", (z) => poly([...arc(z + 1.6), ...arc(z + 4.2).reverse()])],
    ];
  },
  // L bracket: a plate bent up at its far end, one hole in each leg
  (F, P, front) => {
    const [lr, li] = rings(-6, -9, 6, 11, 1.6, 0.8), leg = F.ring(lr), legI = F.ring(li);
    const hole = F.ring(circ(2.1, 14).map((q) => ({ ...q, v: q.v + 4 })));
    const plate = fillet([[-6, 0], [6, 0], [6, 17], [-6, 17]], [0.5, 0.5, 3, 3]);
    const vp = (b, z) => poly(plate.map(([a, h]) => F.T(a, b, h, z)));
    let pr;
    return [
      ["lo", (z) => vp(-9, z)],
      ["sil", (z) => vp(-7.2, z)],
      ["nf", (z) => poly(circ(2.1, 14).map((q) => F.T(q.u, -7.2, 11 + q.v, z)))],
      ["sil", (z) => (pr = prism(P, front, leg, legI, z, z + 1.8)).sil],
      ["nf lo", () => pr.crease],
      ["nf", (z) => poly(ringAt(P, hole, z + 1.8))],
    ];
  },
  // hex key: a bar of hexagonal section bent into an L, lying flat, its short end showing the hexagon
  (F) => {
    const r = 2, hex = (alongB, s, o, z) => [0, 60, 120, 180, 240, 300].map((d) => {
      const x = o + r * Math.cos(rad(d)), h = r * 0.866 + r * Math.sin(rad(d));
      return alongB ? F.T(x, s, h, z) : F.T(s, x, h, z);
    });
    return [
      ["sil", (z) => hullOf(hex(true, -24, -4, z), hex(true, 12, -4, z))],
      ["nf lo", (z) => seg(F.T(-4 + r / 2, -24, r * 1.732, z), F.T(-4 + r / 2, 12, r * 1.732, z))],
      ["sil", (z) => hullOf(hex(false, -4, 12, z), hex(false, 10, 12, z))],
      ["nf lo", (z) => poly(hex(false, 10, 12, z))],
    ];
  },
  // screw: a threaded shank to a point, resting tilted on its head, the cross of the drive on the head's face
  (F) => {
    const h = (b) => 2.3 + ((b + 19) / 30.5) * 2.9, D = 13.6;
    const threads = (z) => {
      let d = "";
      for (let b = -17; b <= 8; b += 2.5) d += seg(F.T(2.3 * Math.cos(rad(-20)), b, h(b) + 2.3 * Math.sin(rad(-20)), z), F.T(2.3 * Math.cos(rad(115)), b + 1.4, h(b + 1.4) + 2.3 * Math.sin(rad(115)), z));
      return d;
    };
    return [
      ["sil", (z) => hullOf(disc(F, -24, 0.4, h(-24), z), disc(F, -19, 2.3, h(-19), z), disc(F, 10, 2.3, h(10), z))],
      ["nf lo", threads],
      ["sil", (z) => hullOf(disc(F, 10, 5.2, h(10), z), disc(F, 12, 5.2, h(12), z), disc(F, D, 4.2, h(D), z))],
      ["nf lo", (z) => poly(disc(F, D, 4.2, h(D), z))],
      ["nf", (z) => seg(F.T(-2.6, D, h(D), z), F.T(2.6, D, h(D), z)) + seg(F.T(0, D, h(D) - 2.6, z), F.T(0, D, h(D) + 2.6, z))],
    ];
  },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, act = -1;

  // Fitted to the tray with the tallest part lifted as high as the slider goes, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.95), top = FL + LMAX + TALL;
  fit(C, [[0, 0, 0], [X1, 0, 0], [0, Y1, 0], [X1, Y1, 0], [0, 0, WH], [19, PY0, top], [X1 - 25, PY0, top]], 200, 166);
  const P = proj(C), front = facing(C);

  // Pocket by pocket from the far end: its far walls, its part, then its near wall, which hides the part's foot.
  const g = mk("g", {}, svg);
  const [tr, ti] = rings(0, 0, X1, Y1, 10, 2);
  put(solid(g), prism(P, front, tr, ti, 0, WH));
  const parts = [];
  for (let i = 0; i < N; i++) {
    const x0 = 6 + i * PX, o = rrect(x0, PY0, x0 + PW, PY1, 5, 5);
    mk("path", { d: poly(ringAt(P, o, WH)), class: "nf" }, g);
    mk("path", { d: open(ringAt(P, run(o, (q) => !front(q)), FL).slice(1, -1)), class: "nf lo" }, g);
    const pg = mk("g", { "data-part": "p" + (i + 1) }, g);
    const els = BUILD[i](frame(i, P), P, front).map(([cls, fn]) => ({ el: mk("path", { class: cls }, pg), fn, sil: cls === "sil" }));
    const iF = LR(ringAt(P, run(o, front), WH)), fB = LR(ringAt(P, run(o, front), FL));
    mk("path", { d: poly([...iF, ...fB.reverse()]), class: "fo" }, g);
    mk("path", { d: open(iF), class: "nf" }, g);
    parts.push({ els, z: tween(FL + REST[i] * lift), drawn: NaN });
  }

  function draw(pt, z) {
    if (z === pt.drawn) return;
    pt.drawn = z;
    for (const e of pt.els) e.el.setAttribute("d", e.fn(z));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const pt of parts) { draw(pt, tval(pt.z, now)); if (!tdone(pt.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // Hit test on the rest pose: the pocket whose resting centre is nearest the pointer's screen x,
  // inside a band round the tray that reaches up over the lifted parts.
  const mid = parts.map((_, i) => P(6 + i * PX + PW / 2, CY, WH)[0]);
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, WH);
    if (x - y < -Y1 - 6 || x - y > X1 + 6 || x + y < -2 * (LMAX + TALL) || x + y > X1 + Y1 + 8) return -1;
    let best = 0;
    mid.forEach((m, i) => { if (Math.abs(sx - m) < Math.abs(sx - mid[best])) best = i; });
    return best;
  }

  function aim(a, from, now) {
    parts.forEach((pt, i) => {
      const to = a < 0 ? REST[i] : FALL[Math.abs(i - a)];
      tset(pt.z, FL + to * lift, now, from < 0 ? 0 : Math.abs(i - from) * STEP);
      const lit = a < 0 ? i === 2 : i === a;
      pt.els.forEach((e) => e.sil && e.el.classList.toggle("hi", lit));
    });
    read.textContent = a < 0 ? "rest" : `part ${a + 1}`;
    B.wake();
  }

  function setActive(a) {
    if (a === act) return;
    const from = a >= 0 ? a : act;
    act = a;
    aim(a, from, performance.now());
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  aim(-1, -1, performance.now());

  return {
    set: (v) => { lift = v; aim(act, -1, performance.now()); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "parts",
  means: "A hardware tray with five pockets: the part under the pointer lifts out, and its neighbours lift less.",
  rules: [1, 2, 5, 6],
  range: [12, 20, 28],
  mount,
});
