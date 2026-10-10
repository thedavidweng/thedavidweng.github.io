const {
  Cam, circ, fillet, fit, facing, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;
const N = 7, SLOT = 40, X1 = N * SLOT, Y1 = 48, CY = 23, PZ = 6, LMAX = 26, TALL = 34;
const IDS = ["openkara", "sukiru", "applesay", "sdfflash", "tgdrive", "vapourfly", "openloop"];
const REST = [0.04, 0.1, 0.32, 0.08, 0, 0.03, 0], FALL = [1, 0.42, 0.16, 0.06, 0.02, 0, 0], STEP = 40;
const move = (ring, dx, dy) => ring.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));
const ring = (x, y, R, n = 20) => move(circ(R, n), x, y);
const arc = (n, f) => Array.from({ length: n }, (_, k) => f(Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)));
/** An upright plate at y0 leaning th degrees (negative leans back), its left edge at x0: a point on its face, or t behind it. */
function plate(P, x0, y0, th) {
  const s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return (u, v, z, t = 0) => P(x0 + u, y0 + v * s - t * c, z + v * c + t * s);
}
/** A rounded solid from a to b above the object's base, as a silhouette entry and its crease. */
function blk(P, front, [r, i], a, b, cls = "sil") {
  let pr;
  return [[cls, (z) => (pr = prism(P, front, r, i, z + a, z + b)).sil], ["nf lo", () => pr.crease]];
}
/** A solid whose top ring differs from its foot: a taper, or a lean when the top is the foot shifted. */
function taper(P, front, foot, top, inner, a, b, cls = "sil") {
  let cr;
  return [
    [cls, (z) => { cr = open(ringAt(P, run(inner, front), z + b)); return poly(hull(ringAt(P, foot, z + a).concat(ringAt(P, top, z + b)))); }],
    ["nf lo", () => cr],
  ];
}
/** Each object, as [class, f(z)] in paint order, z its base: f gives a path, or for a dot, its point. */
const BUILD = [
  // microphone: a round foot, a short stem, a handle that widens, a band, and a ball head with grille lines
  (cx, P, front) => {
    const R = 5.8, zc = 26, rs = Math.abs(P(cx + R * Math.SQRT1_2, CY - R * Math.SQRT1_2, 0)[0] - P(cx, CY, 0)[0]);
    const lat = (h) => (z) => open(ringAt(P, run(ring(cx, CY, Math.sqrt(R * R - h * h), 24), front), z + zc + h));
    return [
      ...blk(P, front, [ring(cx, CY, 9.5, 24), ring(cx, CY, 8.3, 24)], 0, 2.6),
      ...blk(P, front, [ring(cx, CY, 1.3), ring(cx, CY, 0.7)], 2.6, 9),
      ...taper(P, front, ring(cx, CY, 1.8), ring(cx, CY, 3), ring(cx, CY, 2.4), 9, 20),
      ...blk(P, front, [ring(cx, CY, 3.8), ring(cx, CY, 3.2)], 19.5, 21.8),
      ["sil", (z) => { const [x, y] = P(cx, CY, z + zc); return poly(arc(40, (c, s) => [x + rs * c, y + rs * s])); }],
      ...[-0.6, 2, 4.2].map((h) => ["nf lo", lat(h)]),
    ];
  },
  // chest: a carcass with two closed drawer fronts and handles, the top drawer pulled out
  (cx, P, front) => {
    const yf = CY + 9, F = (x, h, z, y) => P(x, y, z + h);
    const face = (a, b) => (z) => poly(rrect(cx - 12, a, cx + 12, b, 1.2, 3).map((q) => F(q.u, q.v, z, yf)));
    const bar = (h, y) => (z) => seg(F(cx - 3.5, h, z, y), F(cx + 3.5, h, z, y));
    return [
      ...blk(P, front, rings(cx - 14, CY - 9, cx + 14, yf, 2.5, 1.2), 0, 30),
      ...[[2, 10], [11, 19]].flatMap(([a, b]) => [["nf", face(a, b)], ["nf", bar((a + b) / 2, yf)]]),
      ...blk(P, front, rings(cx - 12, yf - 1, cx + 12, yf + 5, 1.2, 0.8), 20, 28),
      ["nf", bar(24, yf + 5)],
    ];
  },
  // speaker: a tall box, a cone in its surround with a dust cap, and a grille of dots above it
  (cx, P, front) => {
    const yf = CY + 8, disc = (R) => (z) => poly(arc(32, (c, s) => P(cx + R * c, yf, z + 11 + R * s)));
    const dots = [];
    for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) dots.push(["dot off", (z) => P(cx - 7 + c * 3.5, yf, z + 22 + r * 3.5)]);
    return [
      ...blk(P, front, rings(cx - 12, CY - 8, cx + 12, yf, 2.5, 1.2), 0, 32),
      ["nf", disc(8.6)], ["nf lo", disc(6.6)], ["nf", disc(2.6)],
      ...dots,
    ];
  },
  // optical drive: a flat body with a slot, a button and a light, the tray out, a disc on the tray
  (cx, P, front) => {
    const yf = CY + 1, dy = yf + 10.2, face = (x0, a, x1, b) => (z) => poly(rrect(x0, a, x1, b, 0.8, 3).map((q) => P(q.u, yf, z + q.v)));
    return [
      ...blk(P, front, rings(cx - 15, CY - 15, cx + 15, yf, 2, 1), 0, 12),
      ["nf lo", face(cx - 13, 3.2, cx + 13, 6.4)],
      ["nf", face(cx + 8, 8, cx + 12, 10)],
      ["dot off", (z) => P(cx - 11, yf, z + 9)],
      ...blk(P, front, rings(cx - 12, yf, cx + 12, yf + 20.5, 1.5, 0.8), 4, 5.4),
      ...blk(P, front, [ring(cx, dy, 9.6, 32), ring(cx, dy, 9, 32)], 5.4, 6.2),
      ["nf lo", (z) => poly(ringAt(P, ring(cx, dy, 4.2, 24), z + 6.2))],
      ["nf", (z) => poly(ringAt(P, ring(cx, dy, 1.6, 16), z + 6.2))],
    ];
  },
  // filing box: an open box with a hand hole, four folders standing in it, their tabs staggered
  (cx, P, front) => {
    const H = 15, yf = CY + 9;
    const folder = (y, tu, fh) => {
      const w = plate(P, cx - 12, y, -8);
      const shape = fillet([[0, 0], [24, 0], [24, fh], [tu + 8, fh], [tu + 8, fh + 3.5], [tu, fh + 3.5], [tu, fh], [0, fh]], [0.5, 0.5, 1, 0.6, 1.4, 1.4, 0.6, 1]);
      return ["", (z) => poly(shape.map(([u, v]) => w(u, v, z + H)))];
    };
    return [
      ...blk(P, front, rings(cx - 14, CY - 9, cx + 14, yf, 2.5, 1.2), 0, H),
      ...[[CY - 6, 14, 10.5], [CY - 2.5, 2, 9.8], [CY + 1, 8, 9], [CY + 4.5, 15, 8.2]].map(([y, tu, fh]) => folder(y, tu, fh)),
      ["nf lo", (z) => poly(rrect(cx - 4, 8.6, cx + 4, 11.6, 1.5, 3).map((q) => P(q.u, yf, z + q.v)))],
    ];
  },
  // game cases: a book-end, an L of foot and upright, with four cases leaning on it, a cover inset on the last
  (cx, P, front) => {
    const th = rad(14), h = 24, t = 3.6, dx = -h * Math.sin(th), hz = h * Math.cos(th), sp = t / Math.cos(th);
    const xb = cx - 13, xw = xb + 2.4, z0 = 1.4, sh = (r) => move(r, dx, 0);
    const out = [...blk(P, front, rings(xb, CY - 9, xb + 26, CY + 9, 1.2, 0.6), 0, z0), ...blk(P, front, rings(xb, CY - 7, xw, CY + 7, 1.1, 0.5), z0, 30)];
    for (let k = 0; k < 4; k++) {
      const x0 = xw - dx + k * sp, [r, i] = rings(x0, CY - 9, x0 + t, CY + 9, 0.8, 0.5);
      out.push(...taper(P, front, r, sh(r), sh(i), z0, z0 + hz));
      out.push(["nf lo", (z) => seg(P(x0 + 0.8 * dx, CY + 9, z + z0 + 0.8 * hz), P(x0 + t + 0.8 * dx, CY + 9, z + z0 + 0.8 * hz))]);
    }
    const x1 = xw - dx + 3 * sp + t;
    out.push(["nf lo", (z) => poly(rrect(CY - 6.5, 2.5, CY + 6.5, hz - 2.5, 1.2, 3).map((q) => P(x1 + (q.v / hz) * dx, q.u, z + z0 + q.v)))]);
    return out;
  },
  // cassette: a shell on its edge, a label area, two reel hubs with the tape window between, the head opening below
  (cx, P) => {
    const W = 34, H = 22, w = plate(P, cx - W / 2, CY + 2, -6), shape = fillet([[0, 0], [W, 0], [W, H], [0, H]], [1.5, 1.5, 1.5, 1.5]);
    const onF = (u0, v0, u1, v1, r) => (z) => poly(rrect(u0, v0, u1, v1, r, 3).map((q) => w(q.u, q.v, z)));
    const hub = (u, R) => (z) => poly(arc(20, (c, s) => w(u + R * c, 12.75 + R * s, z)));
    return [
      ["lo", (z) => poly(shape.map(([u, v]) => w(u, v, z, 3.2)))],
      ["sil", (z) => poly(shape.map(([u, v]) => w(u, v, z)))],
      ["nf lo", onF(3, 7, W - 3, H - 2.5, 1.5)],
      ["nf", onF(13.2, 10.6, 20.8, 14.9, 1)],
      ...[9.5, 24.5].flatMap((u) => [["nf", hub(u, 2.8)], ["nf lo", hub(u, 1.3)]]),
      ["nf", (z) => open([[7.5, 0], [10, 4.6], [24, 4.6], [26.5, 0]].map(([u, v]) => w(u, v, z)))],
      ...[13, 21].map((u) => ["dot off", (z) => w(u, 2.2, z)]),
    ];
  },
];
function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, act = -1;
  // Fitted to the plinth with the tallest object lifted as high as the slider goes, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.4), top = PZ + LMAX + TALL;
  fit(C, [[0, 0, 0], [X1, 0, 0], [0, Y1, 0], [X1, Y1, 0], [SLOT / 2, CY, top], [X1 - SLOT / 2, CY, top]], 200, 166);
  const P = proj(C), front = facing(C);
  // The plinth, then the objects from the far end of the row to the near one.
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, X1, Y1, 8, 2);
  put(solid(g), prism(P, front, pr, pi, 0, PZ));
  const objs = BUILD.map((build, i) => {
    const og = mk("g", { "data-part": IDS[i] }, g);
    const els = build(SLOT / 2 + i * SLOT, P, front).map(([cls, fn]) => {
      const dot = cls.startsWith("dot");
      return { el: mk(dot ? "circle" : "path", dot ? { r: 1.05, class: cls } : { class: cls }, og), fn, dot, sil: cls === "sil" };
    });
    return { els, z: tween(PZ + REST[i] * lift), drawn: NaN };
  });
  function draw(o, z) {
    if (z === o.drawn) return;
    o.drawn = z;
    for (const e of o.els) e.dot ? place(e.el, e.fn(z)) : e.el.setAttribute("d", e.fn(z));
  }
  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const o of objs) { draw(o, tval(o.z, now)); if (!tdone(o.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);
  // Hit test on the rest pose: the object whose resting centre is nearest the pointer's screen x,
  // inside a band round the plinth that reaches up over the lifted objects.
  const mid = objs.map((_, i) => P(SLOT / 2 + i * SLOT, CY, PZ + 12)[0]);
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, PZ);
    if (x - y < -Y1 - 6 || x - y > X1 + 6 || x + y < -2 * (LMAX + TALL) || x + y > X1 + Y1 + 8) return -1;
    let best = 0;
    mid.forEach((m, i) => { if (Math.abs(sx - m) < Math.abs(sx - mid[best])) best = i; });
    return best;
  }
  function aim(a, from, now) {
    objs.forEach((o, i) => {
      const to = a < 0 ? REST[i] : FALL[Math.abs(i - a)];
      tset(o.z, PZ + to * lift, now, from < 0 ? 0 : Math.abs(i - from) * STEP);
      const lit = a < 0 ? i === 2 : i === a;
      o.els.forEach((e) => e.sil && e.el.classList.toggle("hi", lit));
    });
    read.textContent = a < 0 ? "rest" : IDS[a];
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
  name: "products-b",
  means: "Seven desktop apps as objects on one plinth: the one under the pointer lifts, and its neighbours lift less.",
  rules: [1, 2, 5, 10],
  range: [10, 18, 26],
  mount,
});
