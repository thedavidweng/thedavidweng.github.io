/** A board drilled by guesswork, or drilled on measured marks. */
const { Cam, facing, fit, poly, prism, proj, rings, rrect, ringAt, seg,
  tween, tset, tval, tdone, disposer, mk, pointer, put, register, solid } = HL;
const BAD = [[10, 8], [23, 38], [50, 13], [79, 52], [62, 39]];
const GOOD = [[18, 18], [42, 18], [66, 18], [18, 40], [66, 40]];
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 2.5);
  fit(C, [[0, 0, 0], [84, 0, 0], [0, 58, 0], [84, 58, 6]], 200, 166);
  const P = proj(C), f = facing(C);
  put(solid(svg), prism(P, f, ...rings(0, 0, 84, 58, 3, 1), 0, 6));
  const marks = mk("g", { "data-part": "marks" }, svg);
  const guides = GOOD.map(([x, y]) => mk("path", { class: "dash", d: seg(P(x - 5, y, 6), P(x + 5, y, 6)) + seg(P(x, y - 5, 6), P(x, y + 5, 6)) }, marks));
  const holes = mk("g", { "data-part": "holes" }, svg);
  const els = BAD.map(() => mk("path", { class: "nf" }, holes));
  const tw = tween(0.08);
  let active = -1, radius = value;
  const B = register(stage, (_dt, now) => {
    const v = tval(tw, now);
    guides.forEach((g, i) => { const [x, y] = GOOD[i]; g.setAttribute("d", v > 0.5 ? seg(P(x - 5, y, 6), P(x + 5, y, 6)) + seg(P(x, y - 5, 6), P(x, y + 5, 6)) : ""); });
    els.forEach((el, i) => {
      const x = BAD[i][0] + (GOOD[i][0] - BAD[i][0]) * v, y = BAD[i][1] + (GOOD[i][1] - BAD[i][1]) * v;
      el.setAttribute("d", poly(ringAt(P, rrect(x - radius, y - radius, x + radius, y + radius, radius, 5), 6)));
      el.setAttribute("class", "nf " + (active === 1 || i === 3 ? "hi" : "lo"));
    });
    return !tdone(tw, now);
  });
  bag.add(B.unregister);
  function choose(k) { active = k; tset(tw, k < 0 ? 0.08 : k, performance.now(), 0); read.textContent = k < 0 ? "rest" : k ? "right" : "wrong"; B.wake(); }
  bag.add(pointer(stage, { move: p => choose(p[0] < 200 ? 0 : 1), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);
  return { set: v => { radius = v; B.wake(); }, destroy: bag.dispose };
}
hairline({ name: "drill", means: "Guesswork leaves stray holes at the edge. Measure first and the holes land on the marks. Left is wrong, right is right.", rules: [1, 4, 8, 10], range: [2, 3, 4], mount });
