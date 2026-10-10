/** One cabinet, from five separated modules to a square, tested workstation.
 * Six fixed pointer bands select assembled, exploded, measure, square, fasten,
 * and test. All printed states use this geometry and the same camera.
 */
const { Cam, clamp, facing, fillet, fit, hull, open, poly, prism, proj, ringAt, rings,
  rrect, seg, tween, tset, tval, tdone, disposer, mk, pointer, put, register, solid } = HL;
const W = 96, D = 58;
const STATES = [
  [0, 0, 0, 0, 0, 0, 1],
  [38, 28, 40, 40, 0, 0, 1],
  [0, 0, 0, 0, 12, 8, 0],
  [0, 0, 0, 0, 0, 0, 0.33],
  [0, 0, 0, 0, 0, 0, 0.67],
  [0, 0, 24, 0, 0, 0, 1],
];
const NAMES = ["assembled", "exploded", "measure", "square", "fasten", "test"];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stagger = value, active = -1;
  const C = Cam(45, 0.5, 1.05);
  fit(C, [[-2, -42, -20], [128, -42, 230], [-2, 102, 0], [128, 102, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const tw = STATES[0].map(v => tween(v));

  function draw(v) {
    svg.replaceChildren();
    const [levelUp, keyOut, drawerOut, backOut, lean, bubble, built] = v;
    const Q = (x, y, z) => P(x + lean * z / 104, y, z);
    const line = (g, a, b, cls = "nf lo") => mk("path", { d: seg(Q(...a), Q(...b)), class: cls }, g);
    const block = (g, x0, y0, x1, y1, z0, z1, cls = "sil") => {
      const el = solid(g);
      put(el, prism(Q, front, ...rings(x0, y0, x1, y1, 1.5, 0.6), z0, z1));
      el.sil.setAttribute("class", cls);
      return el;
    };
    const guides = mk("g", {}, svg);
    if (active === 1) {
      line(guides, [48, 50, 104], [48, 50, 104 + levelUp], "dash");
      line(guides, [96, 30, 76], [96 + keyOut, 30, 76], "dash");
      line(guides, [48, D, 30], [48, D + drawerOut, 30], "dash");
      line(guides, [48, 0, 135], [48, -backOut, 135 + backOut], "dash");
    }
    const back = mk("g", { "data-part": "d5" }, svg);
    if (built > 0.2) {
      const y = -backOut, z = backOut;
      const face = rrect(0, 7, W, 170, 3, 4).map(q => Q(q.u, y + 3, q.v + z));
      const far = rrect(0, 7, W, 170, 3, 4).map(q => Q(q.u, y, q.v + z));
      mk("path", { d: poly(hull(face.concat(far))), class: "sil" }, back);
      let holes = "";
      for (let x = 12; x < W; x += 12) for (let h = 116; h < 166; h += 12)
        holes += poly(rrect(x - 1, h - 1.8, x + 1, h + 1.8, 1, 3).map(q => Q(q.u, y + 3, q.v + z)));
      mk("path", { d: holes, class: "nf lo" }, back);
      for (const x of [24, 60]) {
        line(back, [x, y + 3, 144 + z], [x, y + 13, 144 + z], "nf");
        line(back, [x, y + 13, 144 + z], [x, y + 13, 148 + z], "nf");
      }
    }
    const frame = mk("g", { "data-part": "d1" }, svg);
    block(frame, 5, 5, W - 5, D - 5, 0, 6);
    block(frame, 0, 0, W, D, 6, 10);
    block(frame, 0, 0, 4, D, 10, 100);
    block(frame, W - 4, 0, W, D, 10, 100, active === 3 ? "hi" : "sil");
    block(frame, 4, 0, W - 4, D, 48, 52);
    block(frame, -2, -2, W + 2, D + 2, 100, 104);
    const drawer = mk("g", { "data-part": "d4" }, svg);
    if (built > 0.85) {
      const y = D + drawerOut;
      block(drawer, 6, y - 48, W - 6, y, 14, 18);
      block(drawer, 6, y - 48, 9, y, 18, 44);
      block(drawer, W - 9, y - 48, W - 6, y, 18, 44);
      const f = rrect(4, 14, W - 4, 46, 2, 4).map(q => Q(q.u, y + 3, q.v));
      mk("path", { d: poly(f), class: active === 5 ? "hi" : "sil" }, drawer);
      block(drawer, 34, y + 3, 62, y + 7, 31, 34);
    }
    const level = mk("g", { "data-part": "d2" }, svg), z = 104 + levelUp;
    block(level, 26, 47, 70, 56, z, z + 4, active < 0 || active === 2 ? "hi" : "sil");
    mk("path", { d: poly(ringAt(Q, rrect(37, 49, 59, 54, 2, 4), z + 4)), class: "nf" }, level);
    for (const x of [44, 52]) line(level, [x, 49, z + 4], [x, 54, z + 4]);
    mk("path", { d: poly(ringAt(Q, rrect(46 + bubble, 50, 50 + bubble, 53, 1.5, 4), z + 4)), class: "nf" }, level);
    const key = mk("g", { "data-part": "d3" }, svg);
    if (built > 0.55) {
      const x = W + 2 + keyOut;
      const shape = fillet([[14, 60], [18, 60], [18, 96], [28, 96], [28, 100], [14, 100]], [1, 1, 1, 1, 1, 1]);
      const fastening = active === 4;
      mk("path", { d: poly(shape.map(([y, z]) => Q(x, y + (fastening ? 26 : 0), z + (fastening ? 38 : 0)))), class: fastening ? "hi" : "sil" }, key);
      if (fastening) mk("path", { d: poly(rrect(36, 94, 44, 102, 4, 5).map(q => Q(x, q.u, q.v))), class: "nf" }, key);
      else {
        line(key, [x, 16, 62], [x, 16, 98]);
        if (active !== 1) for (const h of [70, 86]) line(key, [W + 2, 12, h], [W + 2, 20, h], "nf");
      }
    }
  }
  const B = register(stage, (_dt, now) => {
    draw(tw.map(t => tval(t, now)));
    return tw.some(t => !tdone(t, now));
  });
  bag.add(B.unregister);
  function choose(k, px = 200) {
    if (k === active && k >= 0) return;
    active = k;
    const pose = k < 0 ? [3, 0, 6, 0, 0, 0, 1] : STATES[k];
    tw.forEach((t, i) => tset(t, pose[i], performance.now(), Math.abs(px - (70 + i * 40)) / 40 * stagger));
    read.textContent = k < 0 ? "rest" : NAMES[k];
    B.wake();
  }
  bag.add(pointer(stage, { move: p => choose(clamp(Math.floor(p[0] * 6 / 400), 0, 5), p[0]), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);
  return { set: v => { stagger = v; }, destroy: bag.dispose };
}
hairline({ name: "david", means: "Five modules become one workstation: separate them, measure the frame, square it, fasten it, and test the drawer.", rules: [1, 2, 5, 10], range: [0, 40, 80], mount });
