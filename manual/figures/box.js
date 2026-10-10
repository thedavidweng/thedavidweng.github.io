/**
 * Box: a flat-pack carton with a hand hole in its side and a lid hinged along
 * its back edge. Inside, four panels lie stacked in order, each smaller than
 * the one below and pushed to the back corner, so their edges step down
 * towards the viewer, with a pouch of dowels on the third. The pointer's x
 * opens the lid on a spring, clamped between nearly shut and the slider's
 * angle. At rest the lid stands just ajar and its edge is bright; once it is
 * open past half way the bright goes to the top panel. The slider is the
 * widest the lid opens, in degrees.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run,
  spring, stepS, disposer, mk, place, pointer, put, register, solid,
} = HL;

const L = 150, D = 72, WH = 22, WT = 2.4, WR = 6, LT = 3, REST = 14, SHUT = 4;
const PANELS = [[5, 5, 145, 66, 2], [5, 5, 128, 54, 6.5], [5, 5, 104, 48, 11], [5, 5, 72, 38, 15.5]], PK = 4.5;
const BAG = [80, 9, 98, 30];
const HOLES = [[12, 10], [60, 10], [12, 29], [60, 29]];

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** The carton, which never moves: `far` is painted before what it holds, `near` after; each entry is [d, class]. */
function carton(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  const hx = L / 2, onFront = (ring) => ring.map((q) => P(q.u, D, q.v));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    [poly(onFront(rrect(hx - 14, 10, hx + 14, 16, 3, 5))), "nf"],
    [poly(onFront(rrect(hx - 12.4, 11.5, hx + 12.4, 14.5, 1.5, 5))), "nf lo"],
  ];
  return { far, near };
}

/** A point on the lid opened ph degrees: u along the hinge, v from the hinge to the free edge, t off its underside. */
function onLid(P, ph) {
  const s = Math.sin(rad(ph)), c = Math.cos(rad(ph));
  return (u, v, t) => P(u, v * c - t * s, WH + v * s + t * c);
}

/** Twice the signed screen area of a polygon: its sign says which side of a flat plate faces the camera. */
const area = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pmax = value, over = null, drawn = NaN, upTop = null;

  const C = Cam(45, 0.5, 1.78);
  const ext = [[0, 0, 0], [L, 0, 0], [0, D, 0], [L, D, 0]];
  const wl = onLid((x, y, z) => [x, y, z], 100);
  for (const [u, v] of [[0, D], [L, D], [0, 0], [L, 0]]) ext.push(wl(u, v, LT), wl(u, v, 0));
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);
  const outer = rrect(0, 0, L, D, WR, 6), inner = rrect(WT, WT, L - WT, D - WT, WR - WT, 6);
  const paths = carton(P, front, outer, inner);

  const g = mk("g", {}, svg), boxG = mk("g", {}, g), lidG = mk("g", {}, g);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, boxG);
  const panels = PANELS.map(([x0, y0, x1, y1, z]) => {
    const el = solid(boxG), [r, i] = rings(x0, y0, x1, y1, 3, 1.2);
    put(el, prism(P, front, r, i, z, z + PK));
    return el;
  });
  const ztop = PANELS[3][4] + PK;
  HOLES.forEach(([x, y]) => place(mk("circle", { r: 1.2, class: "dot off" }, boxG), P(x, y, ztop)));
  const [bR, bI] = rings(...BAG, 4, 1.2), zb = PANELS[2][4] + PK;
  put(solid(boxG), prism(P, front, bR, bI, zb, zb + 3.5));
  [0, 1, 2].forEach((k) => place(mk("circle", { r: 1, class: "dot off" }, boxG), P(85 + k * 4, 19.5, zb + 3.5)));
  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, boxG);

  const shape = fillet([[0, 0], [L, 0], [L, D], [0, D]], [WR, WR, WR, WR]);
  const lidFar = mk("path", { class: "lo" }, lidG), lidNear = mk("path", { class: "sil" }, lidG);
  const fold = mk("path", { class: "nf lo" }, lidG);
  const s0 = Math.sign(area(shape.map((p) => onLid(P, 0)(p[0], p[1], LT))));

  const A = spring(REST, { eps: 0.05 });

  function draw(ph) {
    if (ph === drawn) return;
    drawn = ph;
    const w = onLid(P, ph), outside = shape.map((p) => w(p[0], p[1], LT)), under = shape.map((p) => w(p[0], p[1], 0));
    // Past the angle where the lid turns edge-on, its underside faces the viewer and the carton stands in front of it.
    const top = Math.sign(area(outside)) === s0;
    if (top !== upTop) { upTop = top; if (top) boxG.after(lidG); else lidG.after(boxG); }
    lidFar.setAttribute("d", poly(top ? under : outside));
    lidNear.setAttribute("d", poly(top ? outside : under));
    fold.setAttribute("d", open([w(WR, D - 9, top ? LT : 0), w(L - WR, D - 9, top ? LT : 0)]));
  }

  const B = register(stage, (dt) => {
    const m = stepS(A, dt);
    draw(A.x);
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    A.t = over ? lerp(SHUT, pmax, clamp((over[0] - 90) / 220, 0, 1)) : REST;
    const lit = A.t > pmax / 2;
    lidNear.classList.toggle("hi", !lit);
    panels[3].sil.classList.toggle("hi", lit);
    read.textContent = over ? `lid ${Math.round(A.t / 5) * 5}` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = p; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  retarget();

  return {
    set: (v) => { pmax = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "box",
  means: "A flat-pack carton: the pointer lifts its lid and shows the panels stacked inside, in order.",
  rules: [3, 5, 6, 8],
  range: [60, 80, 100],
  mount,
});
