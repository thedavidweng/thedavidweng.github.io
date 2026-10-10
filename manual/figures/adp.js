/**
 * ADP: a browser extension set up in four steps, one camera for all four so
 * they line up. A browser window stands with an extension piece hovering
 * over the cradle on its top edge; the piece docks and the page fills with a
 * week of shift bars; a calendar tray rises beside the browser and a cable's
 * plug hangs over the tray's socket; the plug seats and the shift tiles drop
 * into the tray's wells. The pointer's x picks the step from four fixed
 * bands; each part tweens to it, staggered by its distance from the pointer,
 * and the part that matters in that step takes the bright edge. At rest the
 * plug hangs over the socket and is bright. The slider is the stagger.
 */
const {
  Cam, circ, facing, fillet, fit, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 56, H = 38, TK = 2.6, LEAN = -3, HOV = 16;
const TX0 = W + 14, MAR = 12, CELL = 11, DAYS = 5, WEEKS = 3, TY0 = -8, TH = 5, DEP = 1.5;
const TX1 = TX0 + MAR + DAYS * CELL + 3, TY1 = TY0 + 6 + WEEKS * CELL, WELL = 4, TILE = 3.2, TT = 2.4, DROP = 18;
const SX = TX0 + 6, SY = (TY0 + TY1) / 2, PH = 6, PHOV = 9;
// [v, u0, length] of each shift bar on the page, one row a day
const BARS = [[24, 10, 22], [19, 18, 24], [14, 8, 18], [9, 22, 24], [4, 14, 26]];
const WORK = [[0, 1, 3, 4], [0, 2, 3], [1, 2, 3, 4]];
// Each part's target in each step: piece lift, bars drawn, tray risen, plug (0 gone, 1 hanging, 2 seated), tiles seated.
const STEPS = [[HOV, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 2, 1]];
const NAMES = ["add", "open", "connect", "synced"], REST = 2;

const move = (ring, dx, dy) => ring.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));
const wellAt = (d, w) => [TX0 + MAR + (d + 0.5) * CELL, TY0 + 3 + (w + 0.5) * CELL];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, cur = null, px = 200;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[0, 0, 0], [0, 0, H + 6], [W, 0, H + HOV + 8], [TX1, TY0, 0], [TX1, TY1, 0], [TX0, TY1, 0],
    [TX1, TY0, TH + DROP + TT], [SX, SY, TH + PHOV + PH + 12]], 200, 166);
  const P = proj(C), front = facing(C), Pw = (q) => P(q[0], q[1], q[2]);

  // The browser is a plate leaning back a little: a point on its face at (u, v), or t behind it, in the world.
  const s = Math.sin(rad(LEAN)), c = Math.cos(rad(LEAN));
  const wp = (u, v, t = 0) => [u, v * s - t * c, v * c + t * s], w = (u, v, t = 0) => Pw(wp(u, v, t));
  const onFace = (u0, v0, u1, v1, r) => poly(rrect(u0, v0, u1, v1, r, 3).map((q) => w(q.u, q.v)));
  const ye = H * s - TK / 2, ze = H * c, cz = ze + 1.2;

  const g = mk("g", {}, svg);
  const bg = mk("g", { "data-part": "browser" }, g);
  const shape = fillet([[0, 0], [W, 0], [W, H], [34, H], [34, H + 4], [20.5, H + 4], [20.5, H], [19, H], [19, H + 5.5], [3, H + 5.5], [3, H], [0, H]],
    [1, 1, 3, 1.2, 1.6, 1.6, 0.5, 0.5, 2, 2, 1.2, 3]);
  mk("path", { d: poly(shape.map(([u, v]) => w(u, v, TK))), class: "lo" }, bg);
  mk("path", { d: poly(shape.map(([u, v]) => w(u, v))), class: "sil" }, bg);
  mk("path", { d: onFace(4, H - 7.5, W - 4, H - 3.5, 2), class: "nf lo" }, bg);
  const [kR, kI] = rings(W - 15, ye - 4, W - 5, ye + 4, 1.8, 0.8), cr = prism(P, front, kR, kI, ze, cz);
  mk("path", { d: cr.sil }, bg);
  mk("path", { d: cr.crease, class: "nf lo" }, bg);

  const sg = mk("g", { "data-part": "schedule" }, g);
  const bars = BARS.map(([v, u0, L]) => ({ el: mk("path", {}, sg), v, u0, L, at: P(u0 + L / 2, 0, v)[0] }));

  const eGuide = mk("path", { class: "dash" }, g);
  const eg = mk("g", { "data-part": "ext" }, g), piece = solid(eg), nub = solid(eg);
  const [eR, eI] = rings(W - 14, ye - 3, W - 6, ye + 3, 1.6, 0.8);
  const nR = [move(circ(1.7, 12), W - 10, ye), move(circ(1, 12), W - 10, ye)];

  // The calendar: the tray, the socket's collar in its margin, then each well far to near, with its tile under its near lip.
  const cg = mk("g", { "data-part": "calendar" }, g), tray = solid(cg), collar = solid(cg);
  const [tR, tI] = rings(TX0, TY0, TX1, TY1, 6, 1.8);
  const [sR, sI] = rings(SX - 3.6, SY - 3.6, SX + 3.6, SY + 3.6, 1.8, 0.8);
  const wells = [];
  for (let wk = 0; wk < WEEKS; wk++) for (let d = 0; d < DAYS; d++) {
    const [x, y] = wellAt(d, wk);
    wells.push({ x, y, ring: rrect(x - WELL, y - WELL, x + WELL, y + WELL, 1.8, 4), tile: WORK[wk].includes(d) });
  }
  wells.sort((a, b) => a.x + a.y - (b.x + b.y));
  const tiles = [];
  for (const wl of wells) {
    wl.top = mk("path", { class: "nf" }, cg);
    wl.floor = mk("path", { class: "nf lo" }, cg);
    if (wl.tile) { const t = { wl, el: solid(cg), at: P(wl.x, wl.y, TH)[0] }; tiles.push(t); }
    wl.lip = mk("g", {}, cg);
    wl.lipFill = mk("path", { class: "fo" }, wl.lip);
    wl.lipLine = mk("path", { class: "nf" }, wl.lip);
  }

  const pGuide = mk("path", { class: "dash" }, g);
  const pg = mk("g", { "data-part": "plug" }, g), cable = mk("path", { class: "nf" }, pg), plug = solid(pg);
  const [gR, gI] = rings(SX - 2.5, SY - 2.5, SX + 2.5, SY + 2.5, 1.4, 0.7);
  const exit = wp(W, 12, TK / 2);

  const parts = [
    { tw: tween(0), at: P(W - 10, ye, cz)[0], draw: drawExt },
    ...bars.map((b) => ({ tw: tween(0), at: b.at, draw: (p) => drawBar(b, p) })),
    { tw: tween(0), at: P((TX0 + TX1) / 2, SY, 0)[0], draw: drawTray },
    { tw: tween(0), at: P(SX, SY, TH)[0], draw: drawPlug },
    ...tiles.map((t) => ({ tw: tween(0), at: t.at, draw: (p) => drawTile(t, p) })),
  ];
  const slot = (i) => (i === 0 ? 0 : i <= bars.length ? 1 : i === bars.length + 1 ? 2 : i === bars.length + 2 ? 3 : 4);

  function drawExt(h) {
    const z = cz + h;
    put(piece, prism(P, front, eR, eI, z, z + 5));
    put(nub, prism(P, front, nR[0], nR[1], z + 5, z + 6.4));
    eGuide.setAttribute("d", h > 1.5 ? [W - 14, W - 6].map((x) => seg(P(x, ye, z), P(x, ye, cz))).join("") : "");
  }
  function drawBar(b, p) {
    b.el.setAttribute("d", p < 0.04 ? "" : onFace(b.u0, b.v - 1.5, b.u0 + Math.max(3, b.L * p), b.v + 1.5, 1.4));
  }
  let trayA = 0;
  function drawTray(a) {
    trayA = a;
    const top = TH * a, show = a >= 0.02, hide = (el) => el.setAttribute("d", "");
    if (!show) {
      for (const el of [tray.sil, tray.cr, collar.sil, collar.cr]) hide(el);
      for (const wl of wells) [wl.top, wl.floor, wl.lipFill, wl.lipLine].forEach(hide);
      return;
    }
    put(tray, prism(P, front, tR, tI, 0, top));
    put(collar, prism(P, front, sR, sI, top, top + 1));
    const dep = DEP * a;
    for (const wl of wells) {
      const nr = run(wl.ring, front);
      wl.top.setAttribute("d", poly(ringAt(P, wl.ring, top)));
      wl.floor.setAttribute("d", open(ringAt(P, run(wl.ring, (q) => !front(q)), top - dep)));
      wl.lipFill.setAttribute("d", poly(ringAt(P, nr, top).concat(ringAt(P, nr, top - dep).reverse())));
      wl.lipLine.setAttribute("d", open(ringAt(P, nr, top)));
    }
  }
  /** The plug at q: gone (0), hanging over the socket (1), seated on its collar (2); the cable follows it. */
  function drawPlug(q) {
    if (q < 0.02) { [plug.sil, plug.cr, cable, pGuide].forEach((el) => el.setAttribute("d", "")); return; }
    const seat = TH + 1, z = q <= 1 ? seat + PHOV + (1 - q) * 24 : lerp(seat + PHOV, seat, q - 1), top = z + PH;
    put(plug, prism(P, front, gR, gI, z, top));
    const b = [exit, [exit[0] + 9, exit[1] + 3, exit[2] - 8], [SX, SY, top + 13], [SX, SY, top]], pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, m = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
      pts.push(Pw([0, 1, 2].map((k) => b.reduce((sum, p, j) => sum + p[k] * m[j], 0))));
    }
    cable.setAttribute("d", open(pts));
    pGuide.setAttribute("d", z > seat + 1.5 ? [SX - 2.5, SX + 2.5].map((x) => seg(P(x, SY + 2.5, z), P(x, SY + 2.5, seat))).join("") : "");
  }
  function drawTile(t, p) {
    if (p < 0.02) { t.el.sil.setAttribute("d", ""); t.el.cr.setAttribute("d", ""); return; }
    const { x, y } = t.wl, z = lerp(TH + DROP, TH * trayA - DEP, p);
    const [r, i] = rings(x - TILE, y - TILE, x + TILE, y + TILE, 1.4, 0.7);
    put(t.el, prism(P, front, r, i, z, z + TT));
  }

  const drawn = parts.map(() => NaN);
  const B = register(stage, (_dt, now) => {
    let moving = false;
    parts.forEach((pt, i) => {
      const v = tval(pt.tw, now);
      if (!tdone(pt.tw, now)) moving = true;
      if (v === drawn[i]) return;
      drawn[i] = v;
      pt.draw(v);
    });
    return moving;
  });
  bag.add(B.unregister);

  const lit = [[piece.sil, nub.sil], bars.map((b) => b.el), [plug.sil], tiles.map(t => t.el.sil)];
  /** Sends every part to step s (-1 is rest), each after a delay set by its distance from the pointer. */
  function choose(s) {
    if (s === cur) return;
    const now = performance.now(), k = s < 0 ? REST : s;
    cur = s;
    parts.forEach((pt, i) => tset(pt.tw, STEPS[k][slot(i)], now, (Math.abs(pt.at - px) / 40) * stag));
    lit.forEach((els, j) => els.forEach((el) => el.classList.toggle("hi", j === k)));
    read.textContent = s < 0 ? "rest" : NAMES[s];
    B.wake();
  }

  // Four fixed bands across the stage; nothing that moves is tested.
  bag.add(pointer(stage, {
    move: (p) => { px = p[0]; choose(Math.max(0, Math.min(3, Math.floor(p[0] / 100)))); },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "adp",
  means: "A browser extension set up in four steps: add it, open the schedule, plug in the calendar, the shifts land. The pointer picks the step.",
  rules: [1, 2, 4, 5],
  range: [0, 40, 80],
  mount,
});
