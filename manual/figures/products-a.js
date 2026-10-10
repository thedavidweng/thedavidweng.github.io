const {
  Cam, circ, fillet, fit, facing, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 8, SLOT = 36, X1 = N * SLOT, Y1 = 48, CY = 23, PZ = 6, LMAX = 26, TALL = 34;
const IDS = ["canvas", "zenodo", "monarch", "flickr", "qualtrics", "money", "deckpad", "adp"];
const REST = [0.04, 0.1, 0.32, 0.08, 0, 0.03, 0, 0.04], FALL = [1, 0.42, 0.16, 0.06, 0.02, 0, 0, 0], STEP = 40;

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
  // Gradebook, with binding and a divider tab.
  (x, P, f) => [
    ...blk(P, f, rings(x - 13, 10, x + 13, 36, 2, 1), 0, 5),
    ...blk(P, f, rings(x - 10, 34, x - 3, 40, 1, 0.5), 3, 4),
    ["nf", z => seg(P(x - 9, 12, z + 5), P(x - 9, 34, z + 5))],
    ...[17, 23, 29].map(y => ["nf lo", z => seg(P(x - 5, y, z + 5), P(x + 9, y, z + 5))]),
  ],
  // Archive carton: lid seam and hand hole.
  (x, P, f) => [
    ...blk(P, f, rings(x - 13, 12, x + 13, 34, 2, 1), 0, 24),
    ...blk(P, f, rings(x - 14, 11, x + 14, 35, 2, 1), 24, 27),
    ["nf", z => poly(rrect(x - 5, 13, x + 5, 17, 2, 3).map(q => P(q.u, 34, z + q.v)))],
  ],
  // Ledger and a stack of coins.
  (x, P, f) => [
    ...blk(P, f, rings(x - 14, 12, x + 3, 35, 2, 1), 0, 5),
    ...[0, 3, 6, 9].flatMap(h => blk(P, f, [ring(x + 8, 26, 6), ring(x + 8, 26, 5)], h, h + 2.5)),
    ["nf lo", z => seg(P(x - 10, 15, z + 5), P(x - 10, 32, z + 5))],
  ],
  // Photographic prints: staggered edges, border and a landscape on top.
  (x, P, f) => [
    ...[0, 1, 2].flatMap(k => blk(P, f, rings(x - 14 + k * 2, 10 + k * 3, x + 10 + k * 2, 31 + k * 3, 1, 0.5), k, k + 0.8)),
    ["nf lo", z => poly(ringAt(P, rrect(x - 8, 19, x + 12, 34, 0.8, 3), z + 2.8))],
    ["nf", z => open([[x - 6, 31], [x, 23], [x + 5, 29], [x + 10, 25]].map(q => P(...q, z + 2.8)))],
  ],
  // Survey clipboard.
  (x, P, f) => [
    ...blk(P, f, rings(x - 12, 10, x + 12, 38, 2, 1), 0, 2),
    ...blk(P, f, rings(x - 5, 9, x + 5, 14, 1, 0.5), 2, 4),
    ...[20, 26, 32].flatMap(y => [
      ["nf", z => poly(ringAt(P, rrect(x - 8, y - 2, x - 4, y + 2, 0.5, 3), z + 2))],
      ["nf lo", z => seg(P(x, y, z + 2), P(x + 8, y, z + 2))],
    ]),
  ],
  // Safe: inset door, combination dial and handle.
  (x, P, f) => [
    ...blk(P, f, rings(x - 13, 12, x + 13, 34, 2, 1), 0, 27),
    ["nf", z => poly(rrect(x - 10, 3, x + 10, 24, 1.5, 3).map(q => P(q.u, 34, z + q.v)))],
    ["nf", z => poly(arc(24, (c, s) => P(x - 3 + 4 * c, 34, z + 14 + 4 * s)))],
    ["nf", z => seg(P(x + 6, 36, z + 9), P(x + 6, 36, z + 19))],
  ],
  // Handheld console: screen, two sticks, directional pad.
  (x, P, f) => [
    ...blk(P, f, rings(x - 16, 15, x + 16, 32, 5, 1.2), 0, 5),
    ["nf", z => poly(ringAt(P, rrect(x - 7, 18, x + 7, 29, 1.5, 3), z + 5))],
    ...[-12, 12].flatMap(dx => blk(P, f, [ring(x + dx, 23, 2.2), ring(x + dx, 23, 1.6)], 5, 6)),
  ],
  // Standing desk calendar: binding rings, rows of day wells.
  (x, P, f) => [
    ...blk(P, f, rings(x - 13, 15, x + 13, 31, 2, 1), 0, 3),
    ["sil", z => poly(rrect(x - 13, 0, x + 13, 28, 2, 3).map(q => P(q.u, 22, z + q.v)))],
    ...[-8, 0, 8].map(dx => ["nf", z => poly(arc(16, (c, s) => P(x + dx + 1.2 * c, 22 + 3 * s, z + 28 + 3 * c)))]),
    ...[7, 13, 19].flatMap(h => [-7, 0, 7].map(dx => ["nf lo", z => poly(rrect(x + dx - 2, h - 2, x + dx + 2, h + 2, 0.6, 3).map(q => P(q.u, 22, z + q.v)))])),
  ],
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, act = -1;

  // Fitted to the plinth with the tallest object lifted as high as the slider goes, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.2), top = PZ + LMAX + TALL;
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
  name: "products-a",
  means: "Eight tools as objects on one plinth: the one under the pointer lifts, and its neighbours lift less.",
  rules: [1, 2, 5, 10],
  range: [10, 18, 26],
  mount,
});
