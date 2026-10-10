/**
 * Steps: a small two-shelf bookcase in four states of assembly. Its six
 * panels lie in an untidy pile, then flat in a sorted grid, then half built
 * (sides up, bottom in, the shelf sliding in, the top held above, the back
 * waiting behind), then standing square. The pointer's x picks the state from
 * four fixed bands; every panel tweens to it, staggered by its distance from
 * the pointer, and the panel that matters in that step takes the bright edge.
 * At rest the case is half built and the shelf is bright. The slider is the
 * stagger, in ms per 40 viewBox units.
 *
 * Panels are boards that turn and stand up, so each is drawn from its own
 * frame: the hull of its two faces is the silhouette, and the near run of
 * its inset face outline, on the face toward the camera, is the one crease.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, rad, rrect, run, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 44, D = 20, H = 64, T = 3, TB = 1.5, IN = W - 2 * T, R = 2.4, BI = 1.1;
// sideL, back, bottom, shelf, top, sideR, as [length, width, thickness]
const DIMS = [[D, H, T], [W, H, TB], [IN, D, T], [IN, D, T], [IN, D, T], [D, H, T]];
// Each panel's pose in each step: [x, y, lowest z, yaw, tilt about its length].
// Yaws are chosen modulo 180 so no board turns further than it must.
const STEPS = [
  [[8, -6, 1.5, -18, 0], [22, 0, 0, 10, 0], [30, 12, 4.5, 70, 0], [20, 4, 7.5, 24, 0], [10, 18, 10.5, 130, 0], [30, -2, 0, 45, 18]],
  [[-34, -31, 0, 0, 0], [2, -31, 0, 0, 0], [-34, 24, 0, 90, 0], [2, 24, 0, 90, 0], [38, 24, 0, 90, 0], [38, -31, 0, 0, 0]],
  [[1.5, 10, 0, 90, 90], [22, -12.75, 0, 0, 90], [22, 10, 5, 0, 0], [22, 24, 33, 0, 0], [22, 10, 76, 0, 0], [42.5, 10, 0, 90, 90]],
  [[1.5, 10, 0, 90, 90], [22, -0.75, 0, 0, 90], [22, 10, 5, 0, 0], [22, 10, 33, 0, 0], [22, 10, 61, 0, 0], [42.5, 10, 0, 90, 90]],
];
const BRIGHT = [5, 1, 3, 4], REST = 2;
// Paint order per step, back to front; 6 and 7 are the guides of the back and the top.
// A pile paints bottom up; a flat layout by depth; the case from the back, the right side last.
const ORDER = [[1, 0, 2, 3, 4, 5, 6, 7], [0, 1, 2, 5, 3, 4, 6, 7], [1, 6, 0, 2, 3, 7, 4, 5], [1, 6, 0, 2, 3, 7, 4, 5]];
// Where each guide is drawn from: two points of the panel, in its own frame.
const GUIDE = { 1: [[-W / 2, H / 2, 0], [W / 2, H / 2, 0]], 4: [[-IN / 2, D / 2, -T / 2], [IN / 2, D / 2, -T / 2]] };

/** Panel i at pose p: its axes, and w(u, v, t), which maps a point of its own frame into the world. */
function frame(i, p) {
  const Tk = DIMS[i][2], Wd = DIMS[i][1];
  const cp = Math.cos(rad(p[3])), sp = Math.sin(rad(p[3])), cf = Math.cos(rad(p[4])), sf = Math.sin(rad(p[4]));
  const a = [cp, sp, 0], b = [-sp * cf, cp * cf, sf], c = [sp * sf, -cp * sf, cf];
  const z = p[2] + (Wd / 2) * Math.abs(sf) + (Tk / 2) * Math.abs(cf);
  const w = (u, v, t) => [p[0] + u * a[0] + v * b[0] + t * c[0], p[1] + u * a[1] + v * b[1] + t * c[1], z + v * b[2] + t * c[2]];
  return { a, b, c, Tk, w };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, cur = null, px = 200, order = null, orderAt = 0;

  // One camera for all four steps, fitted to every panel's corners in every pose, so the steps line up.
  const C = Cam(45, 0.5, 2.3), box = [];
  STEPS.forEach((st) => st.forEach((p, i) => {
    const f = frame(i, p), [L, Wd, Tk] = DIMS[i];
    for (const u of [-L / 2, L / 2]) for (const v of [-Wd / 2, Wd / 2]) for (const t of [-Tk / 2, Tk / 2]) box.push(f.w(u, v, t));
  }));
  fit(C, box, 200, 166);
  const P = proj(C), Pw = (q) => P(q[0], q[1], q[2]);
  const [x0, y0] = unproj(C, 200, 166, 0), [x1, y1] = unproj(C, 200, 166, 1), V = [x1 - x0, y1 - y0, 1];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const shapes = DIMS.map(([L, Wd]) => [
    rrect(-L / 2, -Wd / 2, L / 2, Wd / 2, R, 4), rrect(-L / 2 + BI, -Wd / 2 + BI, L / 2 - BI, Wd / 2 - BI, R - BI, 4),
  ]);

  function paths(i, p) {
    const f = frame(i, p), [ring, inner] = shapes[i], h = f.Tk / 2, out = [];
    for (const q of ring) out.push(Pw(f.w(q.u, q.v, h)), Pw(f.w(q.u, q.v, -h)));
    const face = dot(f.c, V) >= 0 ? h : -h;
    const near = (q) => dot([q.nu * f.a[0] + q.nv * f.b[0], q.nu * f.a[1] + q.nv * f.b[1], q.nv * f.b[2]], V) > 1e-6;
    const r = run(inner, near);
    return { sil: poly(hull(out)), crease: r.length > 1 ? open(r.map((q) => Pw(f.w(q.u, q.v, face)))) : "" };
  }

  /** A dashed drop from where a panel is to where it goes, once it is turned the right way and still apart. */
  function guide(i, p) {
    const fin = STEPS[3][i];
    if (Math.abs(p[3] - fin[3]) > 0.5 || Math.abs(p[4] - fin[4]) > 0.5) return "";
    if (Math.hypot(p[0] - fin[0], p[1] - fin[1], p[2] - fin[2]) < 1.5) return "";
    const f = frame(i, p), F = frame(i, fin);
    return GUIDE[i].map(([u, v, t]) => seg(Pw(f.w(u, v, t)), Pw(F.w(u, v, t)))).join("");
  }

  const g = mk("g", {}, svg);
  const panels = DIMS.map((_, i) => ({ el: solid(g), tw: STEPS[REST][i].map((v) => tween(v)), drawn: "" }));
  const guides = { 1: mk("path", { class: "dash" }, g), 4: mk("path", { class: "dash" }, g) };
  const nodes = [...panels.map((pn) => pn.el.g), guides[1], guides[4]];

  const B = register(stage, (_dt, now) => {
    if (order && now >= orderAt) { for (const k of order) g.appendChild(nodes[k]); order = null; }
    let moving = false;
    panels.forEach((pn, i) => {
      const p = pn.tw.map((t) => tval(t, now));
      if (pn.tw.some((t) => !tdone(t, now))) moving = true;
      const key = p.join();
      if (key === pn.drawn) return;
      pn.drawn = key;
      put(pn.el, paths(i, p));
      if (guides[i]) guides[i].setAttribute("d", guide(i, p));
    });
    return moving || !!order;
  });
  bag.add(B.unregister);

  /** Sends every panel to step s (-1 is rest), each after a delay set by its distance from the pointer. */
  function choose(s) {
    if (s === cur) return;
    const now = performance.now(), k = s < 0 ? REST : s, st = STEPS[k];
    orderAt = cur === null ? 0 : now + 350;
    cur = s;
    panels.forEach((pn, i) => {
      const delay = (Math.abs(Pw(frame(i, st[i]).w(0, 0, 0))[0] - px) / 40) * stag;
      pn.tw.forEach((t, j) => tset(t, st[i][j], now, delay));
      pn.el.sil.classList.toggle("hi", i === BRIGHT[k]);
    });
    order = ORDER[k];
    read.textContent = s < 0 ? "rest" : `step ${s + 1}`;
    B.wake();
  }

  // Four fixed bands across the stage; nothing that moves is tested.
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
  name: "steps",
  means: "A small bookcase in four steps: a pile, a plan laid flat, half built, standing square. The pointer picks the step.",
  rules: [1, 2, 4, 5],
  range: [0, 40, 80],
  mount,
});
