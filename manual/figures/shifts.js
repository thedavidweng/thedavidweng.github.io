/**
 * Shifts: a narrow schedule card on the left, one shift bar per working day,
 * and a calendar tray on the right, seven day lanes by four weeks of wells.
 * Each shift is a tile copied off its day's bar: it lifts, flies along its
 * lane, and seats in the well for its week. The pointer picks a day, tested
 * on the tray's top plane, which never moves: that day's tiles land in their
 * wells, the next days' hang part way, and the far days wait on the card,
 * staggered outwards from the day on the 700ms lift curve. At rest the month
 * is copied but for one tile, still in the air above its well and bright. The
 * slider is the stagger, in ms.
 */
const {
  Cam, clamp, facing, fit, lerp, open, poly, prism, proj, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, unproj, disposer, mk, pointer, put, register, solid,
} = HL;

const DAYS = 7, WEEKS = 4, CELL = 16, WELL = 6, TILE = 4.8, TT = 4.4, TH = 6, DEP = 1.5;
const X0 = -4, X1 = WEEKS * CELL + 4, Y0 = -4, Y1 = DAYS * CELL + 4;
const CX0 = -42, CX1 = -16, CH = 4, BH = 1.4, BX = -39, BW = 6;
const LEN = [16, 12, 19, 14, 10, 18, 0], ARC = 24;
const WORK = [[0, 1, 2, 3], [0, 2, 3, 4], [1, 2, 4, 5], [0, 1, 3, 4]];
const FALL = [1, 0.5, 0.12, 0], WSTEP = 20, REST_FLY = 0.76;

const wellAt = (d, w) => [(w + 0.5) * CELL, (d + 0.5) * CELL];
const dayY = (d) => (d + 0.5) * CELL;
/** Depth towards the viewer at the 2:1 view: larger is nearer, so it is painted later. */
const depth = (x, y, z) => x + y + 0.82 * z;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, act = -1;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[CX0, Y0, 0], [CX0, Y1, 0], [X1, Y0, 0], [X1, Y1, 0], [CX0, Y0, CH + ARC + 8], [X1 * 0.6, Y0, TH + ARC]], 200, 166);
  const P = proj(C), front = facing(C);

  // Far to near: the card, the tray with its wells, then the tiles and each
  // well's near lip, sorted by depth every frame so a seated tile sinks below
  // its lip and a flying one passes over everything under it.
  const g = mk("g", {}, svg);
  const [cR, cI] = rings(CX0, Y0, CX1, Y1, 5, 1.4);
  put(solid(g), prism(P, front, cR, cI, 0, CH));
  LEN.forEach((L, d) => {
    if (!L) return;
    const [r, i] = rings(BX, dayY(d) - BW / 2, BX + L, dayY(d) + BW / 2, 2, 0.7);
    const el = solid(g);
    put(el, prism(P, front, r, i, CH, CH + BH));
  });
  const [tR, tI] = rings(X0, Y0, X1, Y1, 7, 2);
  put(solid(g), prism(P, front, tR, tI, 0, TH));

  const items = [];
  for (let d = 0; d < DAYS; d++) for (let w = 0; w < WEEKS; w++) {
    const [cx, cy] = wellAt(d, w), ring = rrect(cx - WELL, cy - WELL, cx + WELL, cy + WELL, 2.6, 4);
    mk("path", { d: poly(ringAt(P, ring, TH)), class: "nf" }, g);
    mk("path", { d: open(ringAt(P, run(ring, (q) => !front(q)), TH - DEP)), class: "nf lo" }, g);
    const nr = run(ring, front), lip = mk("g", {}, g);
    mk("path", { d: poly(ringAt(P, nr, TH).concat(ringAt(P, nr, TH - DEP).reverse())), class: "fo" }, lip);
    mk("path", { d: open(ringAt(P, nr, TH)), class: "nf" }, lip);
    items.push({ g: lip, z: depth(cx + WELL, cy + WELL, TH) });
  }

  const tiles = [];
  WORK.forEach((days, w) => days.forEach((d) => {
    // the guide drops to the well's floor, so it sorts at the floor's depth and nearer solids cover it
    const [wx, wy] = wellAt(d, w), guide = mk("path", { class: "dash" }, g);
    const grp = mk("g", {}, g), el = solid(grp), rest = d === 3 && w === 0 ? REST_FLY : 1;
    const t = { d, w, g: grp, guide, el, p: tween(rest), rest, drawn: NaN, z: 0 };
    tiles.push(t); items.push(t, { g: guide, z: depth(wx, wy, TH - DEP) - 0.5 });
  }));

  /** Tile t at progress p: lifted off its day's bar (0), along an arc down its lane, seated in its well (1). */
  function drawTile(t, p) {
    const [wx, wy] = wellAt(t.d, t.w), y = dayY(t.d), L = LEN[t.d];
    // across in the first 70% and down in the last 30%, so a tile late in its flight hangs over its own well
    const h = 1 - (1 - clamp(p / 0.7, 0, 1)) ** 2, lift = Math.min(1, p / 0.25, (1 - p) / 0.3);
    const x = lerp(BX + L / 2, wx, h), hx = lerp(L / 2, TILE, h), hy = lerp(BW / 2, TILE, h);
    const z = lerp(CH + BH, TH - DEP, p) + lift * (ARC + t.w * 3);
    t.z = depth(x, y, z + TT / 2);
    if (p < 0.02) { t.el.sil.setAttribute("d", ""); t.el.cr.setAttribute("d", ""); t.guide.setAttribute("d", ""); return; }
    const [r, i] = rings(x - hx, y - hy, x + hx, y + hy, 2.4, 0.9);
    put(t.el, prism(P, front, r, i, z, z + TT));
    const fly = p >= 0.7 && z > TH + 2;
    t.guide.setAttribute("d", fly ? seg(P(wx, wy, TH - DEP), P(x, y, z)) : "");
  }

  let order = "";
  function sort() {
    const s = items.slice().sort((a, b) => a.z - b.z), key = s.map((it) => items.indexOf(it)).join(",");
    if (key === order) return;
    order = key;
    s.forEach((it) => g.appendChild(it.g));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const t of tiles) {
      const p = tval(t.p, now);
      if (p !== t.drawn) { t.drawn = p; drawTile(t, p); }
      if (!tdone(t.p, now)) moving = true;
    }
    sort();
    return moving;
  });
  bag.add(B.unregister);

  /** The day lane under the pointer, on the tray's top plane, over the card or the tray; -1 elsewhere. */
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, TH);
    if (x < CX0 - 4 || x > X1 + 2 || y < Y0 || y > Y1) return -1;
    return clamp(Math.floor(y / CELL), 0, DAYS - 1);
  }

  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    for (const t of tiles) {
      const k = Math.abs(t.d - (from < 0 ? 3 : from));
      const to = a < 0 ? t.rest : FALL[Math.min(Math.abs(t.d - a), 3)];
      tset(t.p, to, now, k * stag + t.w * WSTEP);
      t.el.sil.classList.toggle("hi", a < 0 ? t.rest < 1 : t.d === a);
    }
    read.textContent = a < 0 ? "rest" : `day ${a + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1, true);

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "shifts",
  means: "A schedule card and a calendar tray: the day under the pointer copies its shifts into their wells.",
  rules: [1, 2, 5, 6],
  range: [25, 45, 65],
  mount,
});
