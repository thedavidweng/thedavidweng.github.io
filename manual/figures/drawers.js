/**
 * Drawers: a cabinet of six drawers left in disorder. At rest they stand out
 * by uneven amounts, and the third sticks out far and sits askew, its pull
 * bright. The pointer is a repair: the drawers near it slide shut and square
 * up, each on its own spring, the farther the less, down to a floor, so the
 * far ones stay a little out. The slider is the reach, in drawers.
 *
 * The hit test solves the pointer onto the cabinet's front plane, which never
 * moves, and picks the drawer by height on it.
 */
const {
  Cam, clamp, facing, fit, lerp, poly, prism, proj, rad, rings, rrect, spring, stepS, unproj,
  disposer, mk, pointer, put, register, solid,
} = HL;

const N = 6, W = 96, D = 58, PITCH = 18, ZB = 8, ZT = ZB + N * PITCH, HT = ZT + 2, CL = 2;
const X0 = 4, DW = W - 8, PH = 3.2, PD = 3;
const OUT = [5, 12, 27, 3, 15, 7], ANG = [0, -1.2, 5, 0, 1.4, 0], MARK = 2;

/** Share of a full repair at u reaches from the pointer: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

/** A drawer's frame: u along its front from the left edge, w out from the cabinet's face, turned `ang` degrees about its back left corner. */
function frame(ang) {
  const s = Math.sin(rad(ang)), c = Math.cos(rad(ang));
  const at = (u, w) => [X0 + u * c - w * s, D + u * s + w * c];
  const ring = (u0, w0, u1, w1, r) => rrect(u0, w0, u1, w1, r).map((q) => {
    const [x, y] = at(q.u, q.v);
    return { u: x, v: y, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c };
  });
  return { at, ring };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value * PITCH, over = null;

  const C = Cam(45, 0.5, 1.5);
  const far = Math.max(...OUT) + PD + 6;
  fit(C, [[-2, -2, 0], [W + 2, -2, 0], [-2, D + 3, 0], [W + 2, D + far, 0], [-2, -2, HT + 4], [W + 2, -2, HT + 4], [-2, D + far, ZT]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(5, 4, W - 5, D - 4, 3, 1);
  put(solid(g), prism(P, front, pr, pi, 0, 6));
  const [cr, ci] = rings(0, 0, W, D, 3.5, 1.2);
  put(solid(g), prism(P, front, cr, ci, 6, HT));

  // Bottom drawer first: a higher drawer is nearer the eye wherever the two overlap.
  const drawers = [];
  for (let i = N - 1; i >= 0; i--) {
    const z1 = ZT - i * PITCH - 1, z0 = z1 - PITCH + 2;
    const grp = mk("g", { "data-part": "d" + (i + 1) }, g);
    const body = solid(grp), plate = mk("path", { class: "nf" }, grp), slot = mk("path", { class: "nf lo" }, grp), pull = solid(grp);
    drawers[i] = { i, z0, z1, body, plate, slot, pull, sp: spring(0, { eps: 0.002 }), drawn: NaN };
  }
  const [sr, si] = rings(-2, -2, W + 2, D + 3, 4, 1.4);
  put(solid(g), prism(P, front, sr, si, HT, HT + 4));

  function draw(dr) {
    const w = clamp(dr.sp.x, 0, 1);
    if (w === dr.drawn) return;
    dr.drawn = w;
    const out = lerp(OUT[dr.i], CL, w), { at, ring } = frame(ANG[dr.i] * (1 - w));
    put(dr.body, prism(P, front, ring(0, 0, DW, out, 2.5), ring(0.8, 0.8, DW - 0.8, out - 0.8, 1.7), dr.z0, dr.z1));
    const face = (u0, v0, u1, v1, r) => poly(rrect(u0, v0, u1, v1, r, 3).map((q) => { const p = at(q.u, out); return P(p[0], p[1], q.v); }));
    const m = DW / 2, zt = dr.z1;
    dr.plate.setAttribute("d", face(m - 9, zt - 6.4, m + 9, zt - 2.4, 0.6));
    dr.slot.setAttribute("d", face(m - 7.6, zt - 5.2, m + 7.6, zt - 3.6, 0.4));
    put(dr.pull, prism(P, front, ring(m - 13, out, m + 13, out + PD, 1.4), ring(m - 12.4, out + 0.6, m + 12.4, out + PD - 0.6, 0.8), dr.z0 + 3, dr.z0 + 3 + PH));
  }

  const B = register(stage, (dt) => {
    let moving = false;
    for (const dr of drawers) { if (stepS(dr.sp, dt)) moving = true; draw(dr); }
    return moving;
  });
  bag.add(B.unregister);

  // Planes upright at y = Y: x and z under a screen point, solved from the camera.
  const o0 = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
  const a = [ex[0] - o0[0], ex[1] - o0[1]], b = [ez[0] - o0[0], ez[1] - o0[1]], det = a[0] * b[1] - a[1] * b[0];
  function onY(Y, [sx, sy]) {
    const qx = sx - o0[0] - Y * (ey[0] - o0[0]), qy = sy - o0[1] - Y * (ey[1] - o0[1]);
    return [(qx * b[1] - qy * b[0]) / det, (a[0] * qy - a[1] * qx) / det];
  }
  /** Tested on the rest pose, top drawer first: its front, then its lid; else the cabinet's face. [drawer, height] or null. */
  function hit(p) {
    for (const dr of drawers.slice().sort((m, n) => m.i - n.i)) {
      const [x, z] = onY(D + OUT[dr.i], p);
      if (x > X0 - 2 && x < X0 + DW + 2 && z > dr.z0 - 1 && z < dr.z1 + 1) return [dr.i, z];
      const [tx, ty] = unproj(C, p[0], p[1], dr.z1);
      if (tx > X0 && tx < X0 + DW && ty > D && ty < D + OUT[dr.i]) return [dr.i, dr.z1];
    }
    const [x, z] = onY(D, p);
    if (x < -14 || x > W + 14 || z < ZB - 12 || z > HT + 8) return null;
    return [clamp(Math.floor((ZT - z) / PITCH), 0, N - 1), z];
  }

  function retarget() {
    let act = -1;
    if (over) {
      act = over[0];
      for (const dr of drawers) dr.sp.t = falloff((Math.abs(dr.i - act) * PITCH) / R);
    } else for (const dr of drawers) dr.sp.t = 0;
    const lit = act < 0 ? MARK : act;
    drawers.forEach((dr, i) => dr.pull.sil.classList.toggle("hi", i === lit));
    read.textContent = act < 0 ? "rest" : `drawer ${act + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = hit(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  retarget();

  return {
    set: (v) => { R = v * PITCH; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "drawers",
  means: "A cabinet left in disorder: the drawers near the pointer slide shut and line up, the farther ones less.",
  rules: [1, 3, 5, 6],
  range: [0.8, 1.6, 3],
  mount,
});
