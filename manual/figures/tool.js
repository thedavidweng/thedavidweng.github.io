/**
 * Tool: a board with one hex-socket bolt, a spirit level and a hex key. Wrong:
 * the level is swung like a hammer over the bolt, its bubble run to the high
 * end, and the bolt's head is bent over on its shank; the key lies unused at
 * the near edge. Right: the key's short leg sits in the socket and the bolt
 * stands straight, while the level lies flat on the board, bubble centred.
 * The pointer's left half picks wrong, the right half right, on the 700ms
 * tween; at rest the scene is wrong with the key just stirring. The tool in
 * use is bright. The slider is how far the bolt is bent, in degrees.
 */
const {
  Cam, fit, hull, lerp, open, poly, prism, proj, rad, rings, rrect, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const BW = 84, BD = 56, BT = 6, BX = 54, BY = 26, HR = 6, HH = 5, SR = 3, SL = 7;
const KR = 2.2, KL = 40, KS = 12, LL = 22, LW = 4.5, LT = 3.5, REST = 0.18;
// [x, y, z, yaw, pitch, roll] in the wrong pose and the right pose.
const LEVEL = [[36, 26, 38, 0, 35, 0], [32, 48, BT + LT, 0, 0, 0]];
const KEY = [[8, 38, BT + KR * 0.87, 0, 0, 90], [BX, BY, BT + HH + KS, -90, 0, 0]];
const LEAN = [-0.29, 0.96];

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A pose's map from the object's own frame into the world: pitch about v, then roll about u, then yaw. */
function frame(p) {
  const [cy, sy, cp, sp, cr, sr] = [p[3], p[3], p[4], p[4], p[5], p[5]].map((d, i) => (i % 2 ? Math.sin : Math.cos)(rad(d)));
  const R = (u, v, t) => {
    const x = u * cp + t * sp, z = -u * sp + t * cp, y = v * cr - z * sr, z2 = v * sr + z * cr;
    return [x * cy - y * sy, x * sy + y * cy, z2];
  };
  return { R, w: (u, v, t) => add([p[0], p[1], p[2]], R(u, v, t)) };
}
const pose = (A, s) => A[0].map((v, i) => lerp(v, A[1][i], s));

/** n points round the axis through c along d, at radius r. */
function ringAround(c, d, r, n, a0 = 0) {
  const e1 = norm(cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), e2 = cross(d, e1);
  return Array.from({ length: n }, (_, k) => {
    const t = a0 + (k / n) * 2 * Math.PI;
    return add(add(c, e1, r * Math.cos(t)), e2, r * Math.sin(t));
  });
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let bend = value, drawn = "", state = null;

  const C = Cam(45, 0.5, 2.05), box = [];
  for (const x of [0, BW]) for (const y of [0, BD]) box.push([x, y, 0], [x, y, BT]);
  for (const p of LEVEL) { const f = frame(p); for (const u of [-LL, LL]) for (const t of [-LT, LT]) box.push(f.w(u, LW, t), f.w(u, -LW, t)); }
  for (const p of KEY) { const f = frame(p); box.push(f.w(KL, 0, KR), f.w(0, 0, -KS), f.w(-KR, 0, KR)); }
  fit(C, box, 200, 166);
  const P = proj(C), Pw = (q) => P(q[0], q[1], q[2]);
  const [x0, y0] = unproj(C, 200, 166, 0), [x1, y1] = unproj(C, 200, 166, 1), V = [x1 - x0, y1 - y0, 1];

  const g = mk("g", {}, svg);
  const [br, bi] = rings(0, 0, BW, BD, 4, 1.5);
  put(solid(g), prism(P, () => true, br, bi, 0, BT));
  mk("path", { class: "nf lo", d: poly(ringAround([BX, BY, BT], [0, 0, 1], SR + 1, 20).map(Pw)) }, g);

  const boltG = mk("g", { "data-part": "bolt" }, g);
  const shank = mk("path", { class: "sil" }, boltG), head = mk("path", { class: "sil" }, boltG);
  const cap = mk("path", { class: "nf lo" }, boltG), sock = mk("path", { class: "nf" }, boltG);
  const keyG = mk("g", { "data-part": "key" }, g);
  const legs = [0, 1].map(() => ({ sil: mk("path", { class: "sil" }, keyG), cr: mk("path", { class: "nf lo" }, keyG) }));
  const levelG = mk("g", { "data-part": "level" }, g);
  const lvl = solid(levelG), vial = mk("path", { class: "nf" }, levelG), bubble = mk("path", { class: "nf" }, levelG);
  const [lr, li] = rings(-LL, -LW, LL, LW, 3, 1);
  const vialR = rrect(-8, -2.6, 8, 2.6, 2.6, 3);

  /** A bar from a to b of n-sided section, its silhouette and the ridge that faces the eye. */
  function bar(el, a, b, r, n) {
    const d = norm(add(b, a, -1)), ra = ringAround(a, d, r, n), rb = ringAround(b, d, r, n);
    el.sil.setAttribute("d", poly(hull(ra.concat(rb).map(Pw))));
    if (!el.cr) return rb;
    let k = 0;
    ra.forEach((q, i) => { if (dot(add(q, a, -1), V) > dot(add(ra[k], a, -1), V)) k = i; });
    el.cr.setAttribute("d", seg(Pw(ra[k]), Pw(rb[k])));
    return rb;
  }

  function draw(s) {
    const key = s + "," + bend;
    if (key === drawn) return;
    drawn = key;
    const th = rad(bend * (1 - s)), d = [Math.sin(th) * LEAN[0], Math.sin(th) * LEAN[1], Math.cos(th)];
    const b0 = [BX, BY, BT], b1 = add(b0, d, SL * (1 - s)), b2 = add(b1, d, HH);
    bar({ sil: shank }, b0, b1, SR, 16);
    const top = bar({ sil: head }, b1, b2, HR, 20);
    cap.setAttribute("d", poly(top.map(Pw)));
    sock.setAttribute("d", poly(ringAround(b2, d, 2.6, 6, 0.3).map(Pw)));

    const kf = frame(pose(KEY, s));
    bar(legs[0], kf.w(-KR, 0, 0), kf.w(KL, 0, 0), KR, 6);
    bar(legs[1], kf.w(0, 0, KR * 0.5), kf.w(0, 0, -KS), KR, 6);

    const lf = frame(pose(LEVEL, s)), out = [];
    for (const q of lr) out.push(Pw(lf.w(q.u, q.v, LT)), Pw(lf.w(q.u, q.v, -LT)));
    const face = dot(lf.R(0, 0, 1), V) >= 0 ? LT : -LT;
    const near = (q) => dot(lf.R(q.nu, q.nv, 0), V) > 1e-6, rn = run(li, near);
    put(lvl, { sil: poly(hull(out)), crease: rn.length > 1 ? open(rn.map((q) => Pw(lf.w(q.u, q.v, face)))) : "" });
    vial.setAttribute("d", poly(vialR.map((q) => Pw(lf.w(q.u, q.v, LT)))));
    const bx = -5 * (1 - s);
    bubble.setAttribute("d", poly(rrect(bx - 2.3, -1.6, bx + 2.3, 1.6, 1.6, 3).map((q) => Pw(lf.w(q.u, q.v, LT)))));
  }

  const tw = tween(REST);
  const B = register(stage, (_dt, now) => { draw(tval(tw, now)); return !tdone(tw, now); });
  bag.add(B.unregister);

  /** -1 is rest, 0 wrong, 1 right. */
  function choose(k) {
    if (k === state) return;
    state = k;
    tset(tw, k < 0 ? REST : k, performance.now(), 0);
    lvl.sil.classList.toggle("hi", k !== 1);
    for (const l of legs) l.sil.classList.toggle("hi", k === 1);
    read.textContent = k < 0 ? "rest" : k ? "right" : "wrong";
    B.wake();
  }

  // Two fixed halves of the stage; nothing that moves is tested.
  bag.add(pointer(stage, { move: (p) => choose(p[0] < 200 ? 0 : 1), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return {
    set: (v) => { bend = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tool",
  means: "A level swung like a hammer bends the bolt; the hex key seated in its socket turns it. Left is wrong, right is right.",
  rules: [1, 4, 5, 8],
  range: [30, 45, 60],
  mount,
});
