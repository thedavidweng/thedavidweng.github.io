/**
 * Pegboard: a slotted board with five tools on its hooks, left to right a hex
 * key, a spirit level, a try square, a cup of spare screws and a wrench. The
 * pointer picks a tool: it rises off its hook and comes forward, and the others
 * lean away from it, less the farther they hang, staggered by distance. At
 * rest the level's bubble is the bright mark. The slider is the stagger, in ms.
 *
 * The hit test reads each tool's rest silhouette on screen, which never moves.
 * A tool that comes forward past the hook tips is moved to the end of the paint
 * order; until then its hooks' tips are painted over it.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const BW = 180, BZ = 30, BH = 128, BT = 3, TY = 2.5, TK = 1.4, PR = 1.6, PD = 7, LIFT = 10, FWD = 9;
const SWAY = [0, 1, 0.55, 0.3, 0.15], SW = 6;
const CUP = { x: 130, y: 3, r: 10, z0: 72, z1: 94, screws: [[-3.5, 7, 6], [3.5, 10, 4], [-0.5, 14, 2.5]] };

const ticks = Array.from({ length: 9 }, (_, k) => [[-10 + 4 * k, 4], [-10 + 4 * k, k % 2 ? 2.8 : 1.8]]);
const ring = (r, n = 10) => Array.from({ length: n }, (_, k) => [r * Math.cos((k / n) * 2 * Math.PI), r * Math.sin((k / n) * 2 * Math.PI)]);
const box = (u0, v0, u1, v1, r) => rrect(u0, v0, u1, v1, r, 3).map((q) => [q.u, q.v]);

/** The flat tools: where each pivots on its hook, its outline, its marks [points, closed, class], its hooks, its lean at rest and how far it sways. */
const FLAT = [
  { at: [30, 94.6], lean: 10, sway: 1, pegs: [[30, 93]],
    shape: fillet([[-22.7, 2], [-21.8, 4.4], [-19.5, 5.2], [-17.2, 4.4], [-16, 4], [14, 4], [14, -14], [10, -14], [10, 0], [-16, 0], [-17.2, -0.4], [-19.5, -1.2], [-21.8, -0.4]],
      [1.4, 1.4, 1.4, 1.2, 0.6, 1.2, 0.9, 0.9, 0.8, 0.6, 1.2, 1.4, 1.4]),
    marks: [[[[-15, 2], [12, 2], [12, -13]], false, "nf lo"]] },
  { at: [60, 108.6], lean: 0, sway: 0.35, pegs: [[40, 107], [80, 107]],
    shape: fillet([[-32, 0], [32, 0], [32, 12], [-32, 12]], [2.5, 2.5, 2.5, 2.5]),
    marks: [[box(-8, 3, 8, 9, 3), true, "nf"], [[[-27, 0.6], [-27, 11.4]], false, "nf lo"], [[[27, 0.6], [27, 11.4]], false, "nf lo"],
      [[[-2.6, 3.4], [-2.6, 8.6]], false, "nf lo"], [[[2.6, 3.4], [2.6, 8.6]], false, "nf lo"]], bubble: [0.9, 6] },
  { at: [80, 80.6], lean: 0, sway: 0.6, pegs: [[80, 79]],
    shape: fillet([[-24, 5.5], [-14, 5.5], [-14, 4], [24, 4], [24, 0], [-14, 0], [-14, -38], [-24, -38]], [1.2, 0.6, 0.6, 0.8, 0.8, 1, 1, 1.2]),
    marks: [...ticks.map((t) => [t, false, "nf lo"]), [[[-15.6, -36.5], [-15.6, 4]], false, "nf lo"]], rivets: [[-19.8, -6], [-19.8, -18], [-19.8, -30]] },
  null,
  { at: [160, 107], lean: -3, sway: 1, pegs: [[160, 107]],
    shape: fillet([[0, 7.5], [5.5, 5.2], [7.5, 0], [5, -6], [3, -10], [3, -48], [7.5, -52], [8.5, -58], [6, -64], [2.8, -64], [2.8, -58], [-2.8, -58], [-2.8, -64], [-6, -64], [-8.5, -58], [-7.5, -52], [-3, -48], [-3, -10], [-5, -6], [-7.5, 0], [-5.5, 5.2]],
      [3, 3, 3, 2, 2, 2, 2, 2, 1.2, 0.6, 1, 1, 0.6, 1.2, 2, 2, 2, 2, 2, 3, 3]),
    marks: [[ring(3.3), true, "nf"], [box(-1.3, -45, 1.3, -13, 1.3), true, "nf lo"]] },
];

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, act = -1;

  const C = Cam(45, 0.5, 1.7);
  fit(C, [[0, -BT, BZ], [BW, -BT, BZ], [0, -BT, BH], [BW, -BT, BH], [0, 0, BZ], [BW, 0, BZ], [0, 0, BH], [28, TY + FWD, BH], [CUP.x, CUP.y + 2 * CUP.r + FWD, CUP.z0]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const plate = fillet([[0, BZ], [BW, BZ], [BW, BH], [0, BH]], [8, 8, 8, 8]);
  mk("path", { d: poly(plate.map(([u, v]) => P(u, -BT, v))), class: "lo" }, g);
  mk("path", { d: poly(plate.map(([u, v]) => P(u, 0, v))), class: "sil" }, g);
  let slots = "";
  for (let r = 2; r < 9; r++) for (let c = 0; c < (r % 2 ? 8 : 9); c++) {
    const x = 10 + 20 * c + (r % 2 ? 10 : 0), z = 9 + 14 * r;
    slots += poly(box(x - 1.3, z - 3.6, x + 1.3, z + 3.6, 1.3).map(([u, v]) => P(u, 0, v)));
  }
  mk("path", { d: slots, class: "nf lo" }, g);

  /** A hook: its stub behind the tool's plane, and its stub in front of it. */
  function hook(px, pz, back, fore) {
    [[back, 0, TY], [fore, TY, PD]].forEach(([parent, y0, y1]) => {
      const [r, i] = rings(px - PR, y0, px + PR, y1, 1.2, 0.4);
      put(solid(parent), prism(P, front, r, i, pz - PR, pz + PR));
    });
  }

  const tools = [];
  for (const k of [0, 1, 2, 4, 3]) {
    const t = FLAT[k] || { at: [CUP.x, CUP.z1], lean: 0, sway: 1, pegs: [[CUP.x, CUP.z1 - 8]], cup: true };
    const back = mk("g", {}, g), fore = mk("g", {}, g), grp = mk("g", { "data-part": "t" + (k + 1) }, g);
    if (!t.cup) fore.before(grp);
    t.pegs.forEach(([x, z]) => hook(x, z, back, fore));
    const el = { k, t, grp, fore, a: tween(t.lean), z: tween(0), out: false, drawn: "" };
    if (t.cup) {
      el.far = mk("path", { class: "sil" }, grp); el.lip = mk("path", { class: "nf" }, grp);
      el.screws = CUP.screws.slice().sort((m, n) => m[0] + m[1] - n[0] - n[1]).map((s) => ({ s, shank: solid(grp), head: solid(grp) }));
      el.near = ["fo", "nf lo", "nf", "nf sil"].map((cls) => mk("path", { class: cls }, grp));
    } else {
      el.back = mk("path", { class: "lo" }, grp); el.face = mk("path", { class: "sil" }, grp);
      el.marks = t.marks.map(([, , cls]) => mk("path", { class: cls }, grp));
      el.dots = (t.rivets || []).map(() => mk("circle", { r: 1.1, class: "dot off" }, grp));
      if (t.bubble) el.bubble = mk("circle", { r: 1.5, class: "dot" }, grp);
    }
    tools[k] = el;
  }

  /** Tool el leaning th degrees about its hook and lifted by L: returns its world-to-screen map on plane t. */
  const frame = (el, th, L) => {
    const [hx, hz] = el.t.at, s = Math.sin(rad(th)), c = Math.cos(rad(th)), f = (FWD * L) / LIFT;
    return (u, v, t = 0) => P(hx + u * c - v * s, TY + f + t, hz + u * s + v * c + L);
  };

  function drawCup(el, th, L) {
    const f = (FWD * L) / LIFT, x = CUP.x + th * 0.5, y0 = CUP.y + f, z0 = CUP.z0 + L, z1 = CUP.z1 + L;
    const outer = rrect(x - CUP.r, y0, x + CUP.r, y0 + 2 * CUP.r, CUP.r, 6), inner = rrect(x - CUP.r + 1.4, y0 + 1.4, x + CUP.r - 1.4, y0 + 2 * CUP.r - 1.4, CUP.r - 1.4, 6);
    el.far.setAttribute("d", poly(hull(ringAt(P, outer, z0).concat(ringAt(P, outer, z1)))));
    el.lip.setAttribute("d", poly(ringAt(P, inner, z1)));
    el.screws.forEach(({ s: [dx, dy, h], shank, head }) => {
      const sx = x + dx, sy = y0 + CUP.r + dy - CUP.r * 0.7;
      const [r1, i1] = rings(sx - 0.8, sy - 0.8, sx + 0.8, sy + 0.8, 0.8, 0.3), [r2, i2] = rings(sx - 2.2, sy - 2.2, sx + 2.2, sy + 2.2, 2.2, 0.6);
      put(shank, prism(P, front, r1, i1, z1 - 8, z1 + h)); put(head, prism(P, front, r2, i2, z1 + h, z1 + h + 1.4));
    });
    const iF = LR(ringAt(P, run(inner, front), z1)), oT = LR(ringAt(P, run(outer, front), z1)), oB = LR(ringAt(P, run(outer, front), z0));
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), open(oT), open(iF), open([oT[0], ...oB, oT[oT.length - 1]])]
      .forEach((d, n) => el.near[n].setAttribute("d", d));
  }

  function draw(el, th, L) {
    const key = th + "," + L;
    if (key === el.drawn) return;
    el.drawn = key;
    const out = (FWD * L) / LIFT > PD - TY;
    if (out !== el.out) { el.out = out; if (out) g.append(el.grp); else if (el.t.cup) el.fore.after(el.grp); else el.fore.before(el.grp); }
    if (el.t.cup) return drawCup(el, th, L);
    const w = frame(el, th, L), t = el.t;
    el.back.setAttribute("d", poly(t.shape.map(([u, v]) => w(u, v, -TK))));
    el.face.setAttribute("d", poly(t.shape.map(([u, v]) => w(u, v))));
    t.marks.forEach(([pts, closed], n) => el.marks[n].setAttribute("d", (closed ? poly : open)(pts.map(([u, v]) => w(u, v)))));
    el.dots.forEach((d, n) => place(d, w(...t.rivets[n])));
    if (el.bubble) place(el.bubble, w(...t.bubble));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const el of tools) { draw(el, tval(el.a, now), tval(el.z, now)); if (!tdone(el.a, now) || !tdone(el.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // Rest silhouettes on screen, for the hit test: they never move.
  const hulls = tools.map((el) => {
    if (el.t.cup) {
      const o = rrect(CUP.x - CUP.r, CUP.y, CUP.x + CUP.r, CUP.y + 2 * CUP.r, CUP.r, 6);
      return hull(ringAt(P, o, CUP.z0).concat(ringAt(P, o, CUP.z1 + 8)));
    }
    const w = frame(el, el.t.lean, 0);
    return hull(el.t.shape.map(([u, v]) => w(u, v)));
  });
  const side = (a, b, x, y) => (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  const inside = (pts, x, y) => {
    const s = pts.map((a, k) => side(a, pts[(k + 1) % pts.length], x, y));
    return s.every((v) => v >= 0) || s.every((v) => v <= 0);
  };
  const mid = (pts) => pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
  function hit([x, y]) {
    let best = -1, bd = Infinity;
    hulls.forEach((h, k) => {
      if (!inside(h, x, y)) return;
      const m = mid(h), d = Math.hypot(x - m[0], y - m[1]);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }

  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    tools.forEach((el, i) => {
      const d = Math.abs(i - a), th = a < 0 ? el.t.lean : i === a ? 0 : el.t.lean + Math.sign(i - a) * SW * el.t.sway * SWAY[clamp(d, 0, 4)];
      tset(el.a, th, now, Math.abs(i - from) * stag); tset(el.z, i === a ? LIFT : 0, now, Math.abs(i - from) * stag);
      (el.t.cup ? [el.far, el.near[3]] : [el.face]).forEach((p) => p.classList.toggle("hi", i === a));
      if (el.bubble) el.bubble.setAttribute("class", a < 0 ? "dot" : "dot m");
    });
    read.textContent = a < 0 ? "rest" : `hook ${a + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "pegboard",
  means: "Five tools on a pegboard: the one under the pointer lifts off its hook, and the others lean away in turn.",
  rules: [1, 2, 6, 10],
  range: [0, 45, 90],
  mount,
});
