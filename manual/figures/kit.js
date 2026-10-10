/**
 * Kit: a laptop taken apart for assembly. The case with its battery, the
 * logic board with its chips, and the keyboard deck with its keys and
 * trackpad stack up; the board slides out to the side as the stack opens, and
 * the screen stands off its hinge at the back. Dashed guides show where each
 * part goes back. The pointer's x scrubs the gap, on a spring; the part under
 * the pointer, tested in the target pose, takes the bright edge. At rest the
 * kit is half open and the screen is bright. The slider is the widest gap.
 */
const {
  Cam, clamp, extremes, facing, fillet, fit, lerp, poly, prism, proj, rad, ringAt, rings, rrect, seg,
  spring, stepS, unproj, disposer, mk, place, pointer, put, register, solid,
} = HL;

const W = 128, D = 84, HS = 76, LEAN = 16, TC = 6, TB = 2, TCH = 2.5, TD = 3, TS = 2.4, GFIT = 24;
const WTS = [0.8, 1, 1.2], GMIN = 1.5, REST = 0.6;
const NAMES = ["case", "board", "keys", "screen"];
const SN = Math.sin(rad(LEAN)), CS = Math.cos(rad(LEAN));

/** For a base gap G, each gap G times its weight: the bottoms of the three flat layers, and where the screen's lower edge stands. */
function stack(G) {
  const g = WTS.map((w) => w * G);
  const b0 = TC + g[0], d0 = b0 + TB + TCH + g[1], dt = d0 + TD;
  return { z: [0, b0, d0], bx: 3.6 * g[1], ys: -0.45 * g[2], zs: dt + 0.6 * g[2] };
}

/** A point on the screen, which leans back from its lower edge; t lifts it off the back towards the face. */
const onScreen = (P, s, u, v, t) => P(u, s.ys - v * SN + t * CS, s.zs + v * CS + t * SN);

/** The middle of each part, where the pointer's height is compared. */
const middles = (P, s) => [
  P(W / 2, D / 2, TC / 2), P(W / 2 + s.bx, 28, s.z[1] + TB / 2), P(W / 2, D / 2, s.z[2] + TD / 2), onScreen(P, s, W / 2, HS / 2, 0),
];

/** Four rows of twelve keys, and a bottom row with a spacebar, in units of one key. */
function keyRings() {
  const X0 = 10, Y0 = 9, KP = (W - 20) / 12, KG = 1.7, out = [];
  const key = (c0, c1, r) => rrect(X0 + c0 * KP + KG / 2, Y0 + r * KP + KG / 2, X0 + c1 * KP - KG / 2, Y0 + (r + 1) * KP - KG / 2, 1.4, 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) out.push(key(c, c + 1, r));
  let u = 0;
  for (const w of [1, 1, 1.5, 5, 1.5, 1, 1]) { out.push(key(u, u + w, 4)); u += w; }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value, over = null, act = 3, drawn = NaN;

  const C = Cam(45, 0.5, 1.2);
  const sf = stack(GFIT), yt = sf.ys - HS * SN, zt = sf.zs + HS * CS;
  const bxr = W - 16 + sf.bx;
  fit(C, [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [0, yt, zt], [W, yt, zt], [bxr, 8, sf.z[1]], [bxr, 48, sf.z[1]]], 200, 166);
  const P = proj(C), front = facing(C);

  const [cR, cI] = rings(0, 0, W, D, 9, 2);
  const chips = [
    [24, 12, 30, 40, 1.5], [33, 12, 39, 40, 1.5], [W / 2 - 12, 14, W / 2 + 8, 34, TCH], [W - 48, 16, W - 26, 27, 1.5],
  ].map(([x0, y0, x1, y1, h]) => ({ x0, y0, x1, y1, h }));
  const batR = rrect(20, 52, W - 20, D - 10, 4, 4);
  const SCREWS = [[7, 7], [W - 7, 7], [7, D - 7], [W - 7, D - 7]];
  const keys = keyRings(), padR = rrect(W / 2 - 22, 59, W / 2 + 22, 78, 3, 4);
  const lid = fillet([[0, 0], [W, 0], [W, HS], [0, HS]], [4, 4, 8, 8]);
  const panel = fillet([[7, 10], [W - 7, 10], [W - 7, HS - 6], [7, HS - 6]], [2.5, 2.5, 2.5, 2.5]);
  const ex = extremes(P, cR), HINGE = [14, W - 14];

  // Paint order runs from the far side: the screen, which stands behind the
  // deck, then the flat layers bottom up, each covering what lies below it.
  // A guide is painted after the part it leaves and before the one it meets.
  const g = mk("g", {}, svg);
  const lidBack = mk("path", { class: "lo" }, g), lidFace = mk("path", { class: "sil" }, g);
  const disp = mk("path", { class: "nf" }, g), cam = mk("circle", { r: 1.1, class: "dot off" }, g);
  const guide2 = mk("path", { class: "dash" }, g);
  const caseS = solid(g), bat = mk("path", { class: "nf lo" }, g);
  const screws = SCREWS.map(() => mk("circle", { r: 1.1, class: "dot off" }, g));
  const slide = mk("path", { class: "dash" }, g), boardS = solid(g);
  chips.forEach((ch) => { ch.el = solid(g); });
  const guide1 = mk("path", { class: "dash" }, g);
  const deckS = solid(g), keysP = mk("path", { class: "nf lo" }, g), pad = mk("path", { class: "nf" }, g);
  const layers = [caseS.sil, boardS.sil, deckS.sil, lidFace];

  const G = spring(REST * gmax, { eps: 0.02 });

  function draw(gv) {
    if (gv === drawn) return;
    drawn = gv;
    const s = stack(gv), z = s.z, bt = z[1] + TB, dt = z[2] + TD;
    lidBack.setAttribute("d", poly(lid.map((p) => onScreen(P, s, p[0], p[1], 0))));
    lidFace.setAttribute("d", poly(lid.map((p) => onScreen(P, s, p[0], p[1], TS))));
    disp.setAttribute("d", poly(panel.map((p) => onScreen(P, s, p[0], p[1], TS))));
    place(cam, onScreen(P, s, W / 2, HS - 3, TS));
    guide2.setAttribute("d", HINGE.map((u) => seg(P(u, 0, dt), onScreen(P, s, u, 0, TS / 2))).join(""));
    put(caseS, prism(P, front, cR, cI, 0, TC));
    bat.setAttribute("d", poly(ringAt(P, batR, TC)));
    screws.forEach((el, k) => place(el, P(SCREWS[k][0], SCREWS[k][1], TC)));
    const bx = s.bx, [bR, bI] = rings(16 + bx, 8, W - 16 + bx, 48, 3, 1);
    slide.setAttribute("d", [11, 45].map((y) => seg(P(16, y, z[1]), P(16 + bx, y, z[1]))).join(""));
    put(boardS, prism(P, front, bR, bI, z[1], bt));
    chips.forEach((ch) => {
      const [r, i] = rings(ch.x0 + bx, ch.y0, ch.x1 + bx, ch.y1, 1.6, 0.8);
      put(ch.el, prism(P, front, r, i, bt, bt + ch.h));
    });
    guide1.setAttribute("d", ex.map((q) => seg(P(q.u, q.v, TC), P(q.u, q.v, z[2]))).join(""));
    put(deckS, prism(P, front, cR, cI, z[2], dt));
    keysP.setAttribute("d", keys.map((k) => poly(ringAt(P, k, dt))).join(""));
    pad.setAttribute("d", poly(ringAt(P, padR, dt)));
  }

  const side = (a, b, x, y) => (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  /** Whether a screen point lies inside a convex screen polygon, wound either way. */
  const inside = (pts, x, y) => {
    const s = pts.map((a, k) => side(a, pts[(k + 1) % pts.length], x, y));
    return s.every((v) => v >= 0) || s.every((v) => v <= 0);
  };

  /** The part under the pointer in the target pose, tested in reverse paint order; else the part whose middle is nearest. */
  function pick([sx, sy], gv) {
    const s = stack(gv), z = s.z;
    const on = (zt, x0, y0, x1, y1) => { const [x, y] = unproj(C, sx, sy, zt); return x >= x0 && x <= x1 && y >= y0 && y <= y1; };
    if (on(z[2] + TD, 0, 0, W, D)) return 2;
    if (on(z[1] + TB, 16 + s.bx, 8, W - 16 + s.bx, 48)) return 1;
    if (on(TC, 0, 0, W, D)) return 0;
    if (inside(lid.map((p) => onScreen(P, s, p[0], p[1], TS)), sx, sy)) return 3;
    let best = 0, bd = Infinity;
    middles(P, s).forEach((m, i) => {
      const d = Math.hypot(sx - m[0], sy - m[1]);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  const B = register(stage, (dt) => {
    const m = stepS(G, dt);
    draw(G.x);
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    if (over) {
      G.t = lerp(GMIN, gmax, clamp((over[0] - 80) / 240, 0, 1));
      act = pick(over, G.t);
      read.textContent = `part ${act + 1} · ${NAMES[act]}`;
    } else {
      G.t = REST * gmax;
      act = 3;
      read.textContent = "rest";
    }
    layers.forEach((el, i) => el.classList.toggle("hi", i === act));
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = p; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  retarget();

  return {
    set: (v) => { gmax = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "kit",
  means: "A laptop laid out as a kit: the pointer opens or closes the gaps between its layers and picks one.",
  rules: [1, 3, 5, 6],
  range: [12, 18, 24],
  mount,
});
