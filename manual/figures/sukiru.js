/**
 * Sukiru: the DAVID cabinet with four drawers, one per skill, and a spirit
 * level set into its top. Before the repair the drawers stand out by uneven
 * amounts, the third sits askew, the second wears a second front floating
 * askew in front of its own, and the level's bubble lies at the end of its
 * vial. After it every drawer is shut flush and square, the duplicate front
 * has slid back onto its drawer so only one front shows, and the bubble sits
 * between its marks. The pointer's x is the repair's progress, each part on
 * its own spring, retargeted after a delay set by its distance from the
 * pointer's height. At rest the bottom drawer is already fixed and the
 * duplicate front is bright; past halfway the level takes the bright edge.
 * The slider is the stagger, in ms per drawer.
 *
 * The hit test solves the pointer onto the cabinet's front plane, which never
 * moves: its x on screen is the progress, its height picks the anchor.
 */
const {
  Cam, clamp, facing, fit, lerp, poly, prism, proj, rad, rings, rrect, seg, spring, stepS,
  disposer, mk, pointer, put, register, solid,
} = HL;

const N = 4, W = 96, D = 58, PITCH = 22, ZT = 98, HT = 100, CL = 2;
const X0 = 4, DW = W - 8, PH = 3.2, PD = 3;
const OUT = [5, 8, 17, 10], ANG = [0, -1.5, 5, 0], FIXED = 3;
// The duplicate front of drawer 2 in the before pose: out, across, up, and turned.
const DUP = 1, DOUT = 6, DU = 9, DZ = 6, DANG = -9;
// The level: a bar along x near the front of the top, its vial between x 37 and 59.
const LV = [26, 47, 70, 56], LZ = 107, VIAL = [37, 49, 59, 54], BW = 2.2, BOFF = 7.3, MID = 48;
const X_BEFORE = 70, X_AFTER = 330;

/** A front's frame: u across from the drawer's left edge, w out from the cabinet's face, turned `ang` about the drawer's back left corner, then turned `e` about (DW/2 + du, wc) and moved by (du, dw). */
function frame(ang, e = 0, du = 0, dw = 0, wc = 0) {
  const s = Math.sin(rad(ang)), c = Math.cos(rad(ang)), se = Math.sin(rad(e)), ce = Math.cos(rad(e));
  const ts = Math.sin(rad(ang + e)), tc = Math.cos(rad(ang + e));
  const at = (u, w) => {
    const a = u - DW / 2, b = w - wc, u2 = DW / 2 + du + a * ce - b * se, w2 = wc + dw + a * se + b * ce;
    return [X0 + u2 * c - w2 * s, D + u2 * s + w2 * c];
  };
  const ring = (u0, w0, u1, w1, r) => rrect(u0, w0, u1, w1, r).map((q) => {
    const [x, y] = at(q.u, q.v);
    return { u: x, v: y, nu: q.nu * tc - q.nv * ts, nv: q.nu * ts + q.nv * tc };
  });
  return { at, ring };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value, G = null;

  const C = Cam(45, 0.5, 1.62);
  const far = OUT[2] + DW * Math.sin(rad(ANG[2])) + PD + 2;
  fit(C, [[-2, -2, 0], [W + 2, -2, 0], [-2, D + 3, 0], [W + 2, D + far, 0], [-2, -2, LZ], [W + 2, -2, LZ], [-2, D + far, ZT]], 200, 166);
  const P = proj(C), front = facing(C);

  const cab = mk("g", { "data-part": "cab" }, svg);
  const [pr, pi] = rings(5, 5, W - 5, D - 5, 3, 1);
  put(solid(cab), prism(P, front, pr, pi, 0, 6));
  const [cr, ci] = rings(0, 0, W, D, 3.5, 1.2);
  put(solid(cab), prism(P, front, cr, ci, 6, HT));

  /** The parts of one drawer front: body, label card, its slot, and the bar pull. */
  const parts = (grp) => ({ body: solid(grp), plate: mk("path", { class: "nf" }, grp), slot: mk("path", { class: "nf lo" }, grp), pull: solid(grp) });
  const springs = [];
  const mover = (pos, x) => { const m = { pos, sp: spring(x, { eps: 0.002 }), pend: null, drawn: NaN }; springs.push(m); return m; };

  // Bottom drawer first: a higher drawer is nearer the eye wherever the two overlap.
  const drawers = [];
  for (let i = N - 1; i >= 0; i--) {
    const z1 = ZT - i * PITCH - 1, z0 = z1 - PITCH + 2;
    drawers[i] = { i, z0, z1, ...parts(mk("g", { "data-part": "d" + (i + 1) }, cab)), m: mover(i, i === FIXED ? 1 : 0) };
  }
  const [sr, si] = rings(-2, -2, W + 2, D + 2, 4, 1.4);
  put(solid(cab), prism(P, front, sr, si, HT, HT + 4));
  mk("path", { class: "nf lo", d: poly(rrect(LV[0] - 1.2, LV[1] - 1.2, LV[2] + 1.2, LV[3] + 1.2, 4.2, 4).map((q) => P(q.u, q.v, HT + 4))) }, cab);

  const dup = { ...parts(mk("g", { "data-part": "dup" }, svg)), m: mover(DUP + 0.5, 0) };

  const lg = mk("g", { "data-part": "level" }, svg);
  const [lr, li] = rings(LV[0], LV[1], LV[2], LV[3], 3.5, 1);
  const bar = solid(lg);
  put(bar, prism(P, front, lr, li, HT + 4, LZ));
  const top = (u0, v0, u1, v1, r) => poly(rrect(u0, v0, u1, v1, r, 4).map((q) => P(q.u, q.v, LZ)));
  const [vx0, vy0, vx1, vy1] = VIAL, ty0 = vy0 + 0.8, ty1 = vy1 - 0.8, tk = BW + 0.4;
  mk("path", { class: "nf lo", d: seg(P(31, LV[1] + 1, LZ), P(31, LV[3] - 1, LZ)) + seg(P(65, LV[1] + 1, LZ), P(65, LV[3] - 1, LZ)) }, lg);
  mk("path", { class: "nf", d: top(vx0, vy0, vx1, vy1, 2.5) }, lg);
  mk("path", { class: "nf lo", d: top(vx0 + 1, ty0, vx1 - 1, ty1, 1.7) + seg(P(MID - tk, ty0, LZ), P(MID - tk, ty1, LZ)) + seg(P(MID + tk, ty0, LZ), P(MID + tk, ty1, LZ)) }, lg);
  const bubble = { el: mk("path", { class: "nf sil" }, lg), m: mover(-1, 0) };

  /** Writes a front: its body from w0 to out in frame f, between heights z0 and z1, with its card and pull on the face at out. */
  function front3(el, f, w0, out, z0, z1) {
    const { at, ring } = f, m = DW / 2;
    put(el.body, prism(P, front, ring(0, w0, DW, out, 2.5), ring(0.8, w0 + 0.8, DW - 0.8, out - 0.8, 1.7), z0, z1));
    const face = (u0, v0, u1, v1, r) => poly(rrect(u0, v0, u1, v1, r, 3).map((q) => { const p = at(q.u, out); return P(p[0], p[1], q.v); }));
    el.plate.setAttribute("d", face(m - 9, z1 - 6.4, m + 9, z1 - 2.4, 0.6));
    el.slot.setAttribute("d", face(m - 7.6, z1 - 5.2, m + 7.6, z1 - 3.6, 0.4));
    put(el.pull, prism(P, front, ring(m - 13, out, m + 13, out + PD, 1.4), ring(m - 12.4, out + 0.6, m + 12.4, out + PD - 0.6, 0.8), z0 + 3.5, z0 + 3.5 + PH));
  }
  const pose = (dr, w) => [lerp(OUT[dr.i], CL, w), ANG[dr.i] * (1 - w)];

  function draw(force) {
    for (const dr of drawers) {
      const w = clamp(dr.m.sp.x, 0, 1);
      if (w === dr.m.drawn && !force) continue;
      dr.m.drawn = w;
      const [out, ang] = pose(dr, w);
      front3(dr, frame(ang), 0, out, dr.z0, dr.z1);
      if (dr.i === DUP) dup.m.drawn = NaN;
    }
    const wd = clamp(dup.m.sp.x, 0, 1);
    if (wd !== dup.m.drawn) {
      dup.m.drawn = wd;
      const dr = drawers[DUP], [out, ang] = pose(dr, clamp(dr.m.sp.x, 0, 1)), k = 1 - wd, dz = DZ * k;
      front3(dup, frame(ang, DANG * k, DU * k, DOUT * k, out - 1), out - CL, out, dr.z0 + dz, dr.z1 + dz);
    }
    const wb = clamp(bubble.m.sp.x, 0, 1);
    if (wb !== bubble.m.drawn) {
      bubble.m.drawn = wb;
      const cx = MID + BOFF * (1 - wb);
      bubble.el.setAttribute("d", top(cx - BW, 50.3, cx + BW, 52.7, 1.2));
    }
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const m of springs) {
      if (m.pend && now >= m.pend.at) { m.sp.t = m.pend.t; m.pend = null; }
      if (m.pend || stepS(m.sp, dt)) moving = true;
    }
    draw(false);
    return moving;
  });
  bag.add(B.unregister);

  // The front plane y = D: x and z under a screen point, solved from the camera.
  const o0 = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
  const a = [ex[0] - o0[0], ex[1] - o0[1]], b = [ez[0] - o0[0], ez[1] - o0[1]], det = a[0] * b[1] - a[1] * b[0];
  function onFront([sx, sy]) {
    const qx = sx - o0[0] - D * (ey[0] - o0[0]), qy = sy - o0[1] - D * (ey[1] - o0[1]);
    return (a[0] * qy - a[1] * qx) / det;
  }

  /** Retargets every part to progress g (null is rest), each after a delay set by its distance from anchor height `at`, in drawers. */
  function retarget(g, at) {
    const now = performance.now();
    G = g;
    for (const m of springs) {
      const t = g === null ? (m === drawers[FIXED].m ? 1 : 0) : g;
      if (m.pend) { m.pend.t = t; continue; }
      if (m.sp.t !== t) m.pend = { t, at: now + Math.abs(m.pos - at) * step };
    }
    const after = g !== null && g >= 0.5;
    for (const p of [dup.body.sil, dup.pull.sil]) p.classList.toggle("hi", !after);
    for (const p of [bar.sil, bubble.el]) p.classList.toggle("hi", after);
    read.textContent = g === null ? "rest" : g <= 0 ? "before" : g >= 1 ? "after" : `fix ${Math.round(g * 100)}%`;
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => retarget(clamp((p[0] - X_BEFORE) / (X_AFTER - X_BEFORE), 0, 1), clamp((ZT - onFront(p)) / PITCH - 0.5, -1, N)),
    leave: () => retarget(null, 1.5),
  }));
  bag.add(() => svg.replaceChildren());
  draw(true);
  retarget(null, 1.5);

  return {
    set: (v) => { step = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "sukiru",
  means: "A cabinet of skills set right: drawers shut square, the duplicate front merges into its drawer, the level's bubble centres.",
  rules: [1, 2, 4, 5],
  range: [20, 45, 70],
  mount,
});
