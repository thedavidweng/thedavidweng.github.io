/** A permanent glued corner, or a reversible cam-lock joint. */
const { Cam, facing, fit, open, poly, prism, proj, ringAt, rings, rrect, seg,
  tween, tset, tval, tdone, disposer, mk, pointer, put, register, solid } = HL;
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 2.2);
  fit(C, [[0, 0, 0], [70, 0, 48], [0, 54, 0], [70, 54, 48]], 200, 166);
  const P = proj(C), front = facing(C), tw = tween(0.08);
  let gap = value, active = -1;
  function draw(v) {
    svg.replaceChildren();
    const boards = mk("g", { "data-part": "boards" }, svg);
    put(solid(boards), prism(P, front, ...rings(0, 0, 70, 6, 2, 0.8), 0, 48));
    put(solid(boards), prism(P, front, ...rings(0, 6 + v * gap, 70, 54 + v * gap, 2, 0.8), 0, 6));
    const fixture = mk("g", { "data-part": active === 1 ? "cam" : "glue" }, svg);
    if (v < 0.5) {
      const pts = [[6, 6], [12, 10], [18, 7], [24, 13], [30, 8], [39, 15], [49, 8], [58, 11], [64, 6]];
      mk("path", { d: open(pts.map(([x, y]) => P(x, y, 7))), class: "nf hi" }, fixture);
      for (const x of [12, 35, 58]) mk("path", { d: seg(P(x, 6, 15), P(x, 6, 7)), class: "nf lo" }, fixture);
    } else {
      const y = 18 + v * gap;
      const lock = solid(fixture);
      put(lock, prism(P, front, ...rings(26, y - 7, 40, y + 7, 7, 1), 6, 8));
      lock.sil.setAttribute("class", "hi");
      mk("path", { d: seg(P(30, y, 8), P(36, y, 8)), class: "nf" }, fixture);
      mk("path", { d: poly(ringAt(P, rrect(30, 6, 36, y, 1, 3), 6)), class: "nf lo" }, fixture);
    }
  }
  const B = register(stage, (_dt, now) => { draw(tval(tw, now)); return !tdone(tw, now); });
  bag.add(B.unregister);
  function choose(k) { active = k; tset(tw, k < 0 ? 0.08 : k, performance.now(), 0); read.textContent = k < 0 ? "rest" : k ? "right" : "wrong"; B.wake(); }
  bag.add(pointer(stage, { move: p => choose(p[0] < 200 ? 0 : 1), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);
  return { set: v => { gap = v; B.wake(); }, destroy: bag.dispose };
}
hairline({ name: "joint", means: "Glue locks the boards together. A cam and bolt leave a joint you can undo. Left is wrong, right is right.", rules: [1, 4, 8, 10], range: [3, 6, 9], mount });
