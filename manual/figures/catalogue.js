/**
 * Catalogue: four compatible parts standing on one shallow plinth. A terminal
 * block with its prompt lines, a desktop app window with a sidebar and tiles,
 * a handheld console with its screen and two sticks, and a browser window
 * with a tab and an extension piece docked on its top edge. The pointer picks
 * one: it lifts, and its neighbours lift less, staggered by distance on the
 * 700ms lift curve. At rest the app window stands a little raised and bright.
 * The slider is the height a chosen part lifts to.
 *
 * Every object is drawn in its own group, marked data-part, so the rest pose
 * can be cut into icons. The plinth stays outside those groups.
 */
const {
  Cam, circ, facing, fillet, fit, poly, prism, proj, rad, ringAt, rings, rrect, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 4, SLOT = 52, X1 = 208, Y1 = 52, CY = 26, PZ = 6, LMAX = 26, TALL = 40, TK = 2.6;
const IDS = ["cli", "app", "plugin", "ext"], REST = [0, 0.3, 0.06, 0], FALL = [1, 0.4, 0.15, 0.06], STEP = 45;

/** An upright plate leaning th degrees (negative leans back), its left edge at x0: a point on its face, or t behind it. */
function plate(P, x0, th) {
  const s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return (u, v, z, t = 0) => P(x0 + u, CY + v * s - t * c, z + v * c + t * s);
}
/** A rounded rectangle laid on a plate's face. */
const onFace = (w, u0, v0, u1, v1, r, z) => poly(rrect(u0, v0, u1, v1, r, 3).map((q) => w(q.u, q.v, z)));
const move = (ring, dx, dy) => ring.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));

/** Each object, as [class, f(z)] in paint order, z its base: f gives a path, or for a dot, its point. */
const BUILD = [
  // terminal: a block whose front face carries prompt lines, each a short prompt and a rule, and a cursor
  (cx, P, front) => {
    const [r, i] = rings(cx - 19, CY - 7, cx + 19, CY + 7, 3, 1.2), H = 26, F = (x, h, z) => P(x, CY + 7, z + h);
    const lines = [[19, 18], [14.5, 10], [10, 22]];
    let pr;
    return [
      ["sil", (z) => (pr = prism(P, front, r, i, z, z + H)).sil],
      ["nf lo", () => pr.crease],
      ["nf lo", (z) => poly(rrect(cx - 16.5, 2.5, cx + 16.5, 23.5, 2, 3).map((q) => F(q.u, q.v, z)))],
      ["nf", (z) => [...lines.map(([h]) => h), 5.5].map((h) => seg(F(cx - 14, h, z), F(cx - 11.5, h, z))).join("")],
      ["nf lo", (z) => lines.map(([h, L]) => seg(F(cx - 9, h, z), F(cx - 9 + L, h, z))).join("")],
      ["nf", (z) => poly([F(cx - 9, 4.2, z), F(cx - 6, 4.2, z), F(cx - 6, 6.8, z), F(cx - 9, 6.8, z)])],
    ];
  },
  // app: a window with a title bar and its three controls, a sidebar of rows, and four tiles
  (cx, P) => {
    const W = 44, H = 32, w = plate(P, cx - W / 2, -4), shape = fillet([[0, 0], [W, 0], [W, H], [0, H]], [1, 1, 3.5, 3.5]);
    const tw = (W - 22) / 2, th = (H - 15) / 2;
    return [
      ["lo", (z) => poly(shape.map(([u, v]) => w(u, v, z, TK)))],
      ["sil", (z) => poly(shape.map(([u, v]) => w(u, v, z)))],
      ["nf", (z) => seg(w(0.4, H - 6, z), w(W - 0.4, H - 6, z))],
      ["nf lo", (z) => seg(w(13, 1, z), w(13, H - 6, z)) + [11, 15, 19].map((d) => seg(w(3, H - d, z), w(10, H - d, z))).join("")],
      ["nf lo", (z) => [0, 1].map((a) => [0, 1].map((b) => onFace(w, 16 + a * (tw + 3), 3 + b * (th + 3), 16 + a * (tw + 3) + tw, 3 + b * (th + 3) + th, 1.2, z)).join("")).join("")],
      ...[4, 7.5, 11].map((u) => ["dot off", (z) => w(u, H - 3, z)]),
    ];
  },
  // handheld: a wide body with round grips, a screen set in the middle, two thumbsticks, two button crosses
  (cx, P, front) => {
    const [r, i] = rings(cx - 24, CY - 10, cx + 24, CY + 10, 9.5, 1.2), H = 5;
    const screen = rrect(cx - 12, CY - 7, cx + 12, CY + 7, 1.5, 3);
    const sticks = [-18, 18].map((dx) => [move(circ(3, 16), cx + dx, CY + 3.5), move(circ(1.9, 16), cx + dx, CY + 3.5)]);
    const pads = [-18, 18].flatMap((dx) => [[0, -1.8], [1.8, 0], [0, 1.8], [-1.8, 0]].map(([a, b]) => [cx + dx + a, CY - 4.5 + b]));
    const pr = [];
    return [
      ["sil", (z) => (pr[0] = prism(P, front, r, i, z, z + H)).sil],
      ["nf lo", () => pr[0].crease],
      ["nf", (z) => poly(ringAt(P, screen, z + H))],
      ...pads.map(([x, y]) => ["dot off", (z) => P(x, y, z + H)]),
      ...sticks.flatMap(([o, n], k) => [
        ["sil", (z) => (pr[k + 1] = prism(P, front, o, n, z + H, z + H + 2.5)).sil],
        ["nf lo", () => pr[k + 1].crease],
      ]),
    ];
  },
  // browser: a window with a tab on its top edge and an address bar, an extension piece docked on its top
  (cx, P, front) => {
    const W = 44, H = 28, TH = -3, x0 = cx - W / 2, w = plate(P, x0, TH);
    const shape = fillet([[0, 0], [W, 0], [W, H], [32, H], [32, H + 4], [19.5, H + 4], [19.5, H], [18, H], [18, H + 5.5], [3, H + 5.5], [3, H], [0, H]],
      [1, 1, 3, 1.2, 1.6, 1.6, 0.5, 0.5, 2, 2, 1.2, 3]);
    const ye = CY + H * Math.sin(rad(TH)), ze = H * Math.cos(rad(TH));
    const [br, bi] = rings(x0 + W - 13, ye - 3.5, x0 + W - 5, ye + 3.5, 1.6, 0.8);
    const nub = [move(circ(1.7, 12), x0 + W - 9, ye), move(circ(1, 12), x0 + W - 9, ye)];
    const pr = [];
    return [
      ["lo", (z) => poly(shape.map(([u, v]) => w(u, v, z, TK)))],
      ["sil", (z) => poly(shape.map(([u, v]) => w(u, v, z)))],
      ["nf lo", (z) => onFace(w, 4, H - 7.5, W - 4, H - 3.5, 2, z)],
      ["nf lo", (z) => [13, 9, 5].map((v, k) => seg(w(5, v, z), w(W - 6 - k * 9, v, z))).join("")],
      ["sil", (z) => (pr[0] = prism(P, front, br, bi, z + ze, z + ze + 5)).sil],
      ["nf lo", () => pr[0].crease],
      ["sil", (z) => (pr[1] = prism(P, front, nub[0], nub[1], z + ze + 5, z + ze + 6.4)).sil],
      ["nf lo", () => pr[1].crease],
    ];
  },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, act = -1;

  // Fitted to the plinth with the tallest object lifted as high as the slider goes, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.68), top = PZ + LMAX + TALL;
  fit(C, [[0, 0, 0], [X1, 0, 0], [0, Y1, 0], [X1, Y1, 0], [26, CY, top], [X1 - 26, CY, top]], 200, 166);
  const P = proj(C), front = facing(C);

  // The plinth, then the objects from the far end of the row to the near one.
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, X1, Y1, 8, 2);
  put(solid(g), prism(P, front, pr, pi, 0, PZ));
  const objs = BUILD.map((build, i) => {
    const og = mk("g", { "data-part": IDS[i] }, g);
    const els = build(26 + i * SLOT, P, front).map(([cls, fn]) => {
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
  const mid = objs.map((_, i) => P(26 + i * SLOT, CY, PZ + 12)[0]);
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
      const lit = a < 0 ? i === 1 : i === a;
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
  name: "catalogue",
  means: "Four compatible parts on one plinth: the one under the pointer lifts, and its neighbours lift less.",
  rules: [1, 2, 5, 10],
  range: [10, 18, 26],
  mount,
});
