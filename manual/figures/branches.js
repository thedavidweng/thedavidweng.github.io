/**
 * Branches: one engine and two ways in. A drive block sits at the back, and
 * two conduits run along the ground from it to two interfaces on low stands:
 * a terminal with its prompt lines on the left, and an app window with a
 * sidebar and a grid of file tiles on the right. The pointer's side of the
 * engine, read from fixed halves of the frame, picks one: it tilts up towards
 * the viewer and lifts, and its branch takes the bright edge; the other
 * settles back. At rest both stand part way up and the engine is bright. The
 * slider is how far the chosen interface tilts, in degrees.
 */
const {
  Cam, fillet, fit, poly, prism, proj, rad, ringAt, rings, rrect, seg, facing,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const EH = 24, SH = 4, TK = 2.4, LIFT = 8, LOW = 10;
const NAMES = ["cli", "gui"];

/** The two interfaces: the front edge's middle, the lateral and backward axes, size, stand, conduit, and rest pose. */
const UI = [
  {
    o: [-38, 74, SH], l: [1, 0, 0], b: [0, -1, 0], W: 56, H: 38, stand: [-68, 61, -8, 79], rest: 34, rz: 3,
    pipe: [[-4, 10], [4, 10], [4, 72], [-12, 72], [-12, 64], [-4, 64]], pr: [1, 1, 9, 1, 1, 3],
  },
  {
    o: [82, -40, SH], l: [0, -1, 0], b: [-1, 0, 0], W: 72, H: 46, stand: [68, -78, 87, -2], rest: 20, rz: 0,
    pipe: [[10, 2], [68, 2], [68, -6], [76, -6], [76, 10], [10, 10]], pr: [1, 3, 1, 1, 9, 1],
  },
];
const PT = 2.5;

/** A point on interface k's slab, tilted th degrees and lifted: u across, v up the slab from its front edge, t off its back. */
function onSlab(P, k, th, lift) {
  const { o, l, b } = UI[k], s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return (u, v, t = 0) => P(
    o[0] + u * l[0] + v * c * b[0] - t * s * b[0],
    o[1] + u * l[1] + v * c * b[1] - t * s * b[1],
    o[2] + lift + v * s + t * c,
  );
}

/** What sits on each slab's face, as [d, class] in the slab's own (u, v). */
function faceMarks(k, w) {
  const { W, H } = UI[k], L = -W / 2, R = W / 2, out = [];
  const ring = (pts) => poly(pts.map((p) => w(p[0], p[1], TK)));
  const box = (u0, v0, u1, v1, r) => ring(fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]));
  out.push([box(L + 3, 3, R - 3, H - 3, 2.5), "nf"]);
  if (k === 0) {
    const lens = [30, 22, 36, 14];
    const rules = lens.map((n, i) => seg(w(L + 11, H - 9 - i * 6, TK), w(L + 11 + n, H - 9 - i * 6, TK))).join("");
    out.push([rules, "nf lo"]);
    out.push([box(L + 11, H - 9 - 4 * 6 - 1.4, L + 15, H - 9 - 4 * 6 + 1.4, 0.6), "nf"]);
  } else {
    out.push([seg(w(L + 3, H - 9, TK), w(R - 3, H - 9, TK)) + seg(w(L + 20, 3, TK), w(L + 20, H - 9, TK)), "nf lo"]);
    out.push([[0, 1, 2].map((i) => seg(w(L + 7, H - 15 - i * 5, TK), w(L + 16 - i * 2, H - 15 - i * 5, TK))).join(""), "nf lo"]);
    const tw = (R - 6 - (L + 24)) / 3;
    let tiles = "";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const u0 = L + 24 + c * tw, v1 = H - 13 - r * 15;
      tiles += box(u0 + 1, v1 - 12, u0 + tw - 1, v1, 1.6);
    }
    out.push([tiles, "nf lo"]);
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let up = value, act = -1;

  const C = Cam(45, 0.5, 1.6);
  const ext = [];
  for (let k = 0; k < 2; k++) {
    const w = onSlab((x, y, z) => [x, y, z], k, 80, LIFT), { W, H, stand: s } = UI[k];
    ext.push(w(-W / 2, H, TK), w(W / 2, H, TK), [s[0], s[1], 0], [s[2], s[3], 0], [s[0], s[3], 0], [s[2], s[1], 0]);
  }
  fit(C, ext.concat([[-20, -20, EH], [20, -20, 0], [-20, 20, 0]]), 200, 166);
  const P = proj(C), front = facing(C);

  // Each conduit is a flat strip on the ground, bent once: its foot, then its top a little above it.
  // They start under the engine and are painted before it, so they read as plugged into its base.
  const g = mk("g", {}, svg);
  const pipes = UI.map((ui) => {
    const f = fillet(ui.pipe, ui.pr);
    mk("path", { d: poly(f.map((p) => P(p[0], p[1], 0))), class: "lo" }, g);
    return mk("path", { d: poly(f.map((p) => P(p[0], p[1], PT))), class: "sil" }, g);
  });
  const [eR, eI] = rings(-20, -20, 20, 20, 6, 1.6);
  const eng = solid(g);
  put(eng, prism(P, front, eR, eI, 0, EH));
  mk("path", { d: [-9, -3, 3].map((y) => poly(ringAt(P, rrect(-11, y, 9, y + 2.6, 1.3, 3), EH))).join(""), class: "nf lo" }, g);
  place(mk("circle", { r: 1.3, class: "dot m" }, g), P(12, 12, EH));

  const parts = pipes.map((pipe, k) => {
    const ui = UI[k], st = solid(g), [sR, sI] = rings(...ui.stand, 5, 1.4);
    put(st, prism(P, front, sR, sI, 0, SH));
    const back = mk("path", { class: "lo" }, g), face = mk("path", { class: "sil" }, g);
    const marks = faceMarks(k, onSlab(P, k, 0, 0)).map(([, cls]) => mk("path", { class: cls }, g));
    const shape = fillet([[-ui.W / 2, 0], [ui.W / 2, 0], [ui.W / 2, ui.H], [-ui.W / 2, ui.H]], [2, 2, 5, 5]);
    return { pipe, back, face, marks, shape, th: tween(ui.rest), z: tween(ui.rz), drawn: "" };
  });

  function draw(k, th, lift) {
    const key = th + "," + lift, pt = parts[k];
    if (key === pt.drawn) return;
    pt.drawn = key;
    const w = onSlab(P, k, th, lift);
    pt.back.setAttribute("d", poly(pt.shape.map((p) => w(p[0], p[1], 0))));
    pt.face.setAttribute("d", poly(pt.shape.map((p) => w(p[0], p[1], TK))));
    faceMarks(k, w).forEach(([d], i) => pt.marks[i].setAttribute("d", d));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    parts.forEach((pt, k) => {
      draw(k, tval(pt.th, now), tval(pt.z, now));
      if (!tdone(pt.th, now) || !tdone(pt.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  /** Picks interface a (-1 is rest): the chosen one moves first, the other 60ms after it. */
  function choose(a, force) {
    if (a === act && !force) return;
    act = a;
    const now = performance.now();
    parts.forEach((pt, k) => {
      const delay = a >= 0 && k !== a ? 60 : 0;
      tset(pt.th, a < 0 ? UI[k].rest : k === a ? up : LOW, now, delay);
      tset(pt.z, a < 0 ? UI[k].rz : k === a ? LIFT : 0, now, delay);
      pt.pipe.classList.toggle("hi", k === a);
      pt.face.classList.toggle("hi", k === a);
    });
    eng.sil.classList.toggle("hi", a < 0);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }

  // The engine's screen x never moves, so the two halves it splits the frame into never move either.
  const mid = P(0, 0, 0)[0];
  bag.add(pointer(stage, { move: (p) => choose(p[0] < mid ? 0 : 1), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1, true);

  return {
    set: (v) => { up = v; choose(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "branches",
  means: "One engine, two ways in: the pointer's side lifts the terminal or the app window, and lights its line.",
  rules: [1, 4, 5, 8],
  range: [40, 58, 76],
  mount,
});
