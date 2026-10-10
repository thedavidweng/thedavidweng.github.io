/**
 * tg-drive: the channel is the truth, the database a cache. At the back
 * stands the channel, a heavy column of message slabs on a plinth. A conduit
 * runs from it to the engine block in the middle; a small database drum sits
 * in front of the engine on a stub; two more conduits run on to a terminal
 * and an app window on low stands. The pointer's x picks one of three states
 * from fixed bands: normal (the channel bright), cache lost (the drum gone,
 * a dashed ring where it stood, the channel still bright), and rebuilt (the
 * drum back, small slabs travelling along the conduits into it, the drum
 * bright). At rest the figure is normal. The slider is the packet stagger,
 * in ms per packet.
 */
const {
  Cam, circ, clamp, fillet, fit, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg, facing,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const EH = 24, SH = 4, TK = 2.4, PT = 2.5, TH = 56;
const NAMES = ["normal", "lost", "rebuilt"];
const CH = [-104, -15, -74, 15], NS = 7, SLH = 9.5, SLG = 1.6, PL = 3;
const LINES = [18, 12, 20, 9, 15, 19, 11];
const DR = { x: -16, y: 62, R: 10, H: 16 };
const PIPES = [
  [[[-84, -4], [-6, -4], [-6, 4], [-84, 4]], [1, 1, 1, 1]],
  [[[-20, 0], [-12, 0], [-12, 56], [-20, 56]], [1, 1, 1, 1]],
  [[[10, -6], [40, -6], [40, -40], [64, -40], [64, -48], [32, -48], [32, -14], [10, -14]], [1, 9, 1, 1, 1, 9, 1, 1]],
  [[[10, 6], [44, 6], [44, 28], [92, 28], [92, 36], [36, 36], [36, 14], [10, 14]], [1, 9, 1, 1, 1, 9, 1, 1]],
];
// Packets: on the channel conduit they run along +x, on the stub along +y; [axis, along, across].
const PK = [["x", -66, 0], ["x", -55, 0], ["x", -44, 0], ["x", -33, 0], ["y", 30, -16], ["y", 41, -16]];

/** The two interfaces, both facing +x: front edge middle, lateral and backward axes, size, stand. */
const UI = [
  { o: [72, -44, SH], l: [0, -1, 0], b: [-1, 0, 0], W: 44, H: 34, stand: [58, -68, 78, -20] },
  { o: [100, 32, SH], l: [0, -1, 0], b: [-1, 0, 0], W: 56, H: 40, stand: [86, 2, 106, 62] },
];

function onSlab(P, k, th) {
  const { o, l, b } = UI[k], s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return (u, v, t = 0) => P(
    o[0] + u * l[0] + v * c * b[0] - t * s * b[0],
    o[1] + u * l[1] + v * c * b[1] - t * s * b[1],
    o[2] + v * s + t * c,
  );
}

/** What sits on each slab's face: prompt lines and a cursor, or a sidebar and file tiles. */
function faceMarks(k, w, g) {
  const { W, H } = UI[k], L = -W / 2, R = W / 2;
  const ring = (pts) => poly(pts.map((p) => w(p[0], p[1], TK)));
  const box = (u0, v0, u1, v1, r) => ring(fillet([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [r, r, r, r]));
  mk("path", { d: box(L + 3, 3, R - 3, H - 3, 2.5), class: "nf" }, g);
  if (k === 0) {
    const rules = [26, 18, 30, 12].map((n, i) => seg(w(L + 9, H - 9 - i * 6, TK), w(L + 9 + n, H - 9 - i * 6, TK))).join("");
    mk("path", { d: rules, class: "nf lo" }, g);
    mk("path", { d: box(L + 9, H - 33.4, L + 13, H - 30.6, 0.6), class: "nf" }, g);
  } else {
    mk("path", { d: seg(w(L + 3, H - 9, TK), w(R - 3, H - 9, TK)) + seg(w(L + 17, 3, TK), w(L + 17, H - 9, TK)), class: "nf lo" }, g);
    mk("path", { d: [0, 1, 2].map((i) => seg(w(L + 6, H - 15 - i * 5, TK), w(L + 13 - i * 2, H - 15 - i * 5, TK))).join(""), class: "nf lo" }, g);
    const tw = (R - 6 - (L + 21)) / 3;
    let tiles = "";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const u0 = L + 21 + c * tw, v1 = H - 13 - r * 12;
      tiles += box(u0 + 1, v1 - 9.5, u0 + tw - 1, v1, 1.6);
    }
    mk("path", { d: tiles, class: "nf lo" }, g);
  }
}

const shift = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value, cur = null;

  const C = Cam(45, 0.5, 1.42);
  const ext = [[CH[0] - 3, CH[1] - 3, 0], [CH[2] + 3, CH[3] + 3, 0], [CH[0], CH[1], PL + NS * (SLH + SLG)], [DR.x, DR.y + DR.R + 2, 0]];
  UI.forEach((ui, k) => {
    const w = onSlab((x, y, z) => [x, y, z], k, TH), s = ui.stand;
    ext.push(w(-ui.W / 2, ui.H, TK), w(ui.W / 2, ui.H, TK), [s[0], s[1], 0], [s[2], s[3], 0], [s[0], s[3], 0], [s[2], s[1], 0]);
  });
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // The conduits are flat strips on the ground, painted first so every solid covers its own ends.
  const pg = mk("g", {}, g);
  PIPES.forEach(([pts, r]) => {
    const f = fillet(pts, r);
    mk("path", { d: poly(f.map((p) => P(p[0], p[1], 0))), class: "lo" }, pg);
    mk("path", { d: poly(f.map((p) => P(p[0], p[1], PT))), class: "sil" }, pg);
  });

  // The channel: a plinth, then the slabs from the bottom up, each with one message line on its +x face.
  const cg = mk("g", { "data-part": "channel" }, g), slabs = [];
  const plinth = solid(cg);
  put(plinth, prism(P, front, ...rings(CH[0] - 3, CH[1] - 3, CH[2] + 3, CH[3] + 3, 4, 1.4), 0, PL));
  slabs.push(plinth);
  for (let i = 0; i < NS; i++) {
    const z0 = PL + SLG + i * (SLH + SLG), z1 = z0 + SLH, s = solid(cg);
    put(s, prism(P, front, ...rings(...CH, 3, 1.4), z0, z1));
    mk("path", { d: seg(P(CH[2], 9, z0 + SLH / 2), P(CH[2], 9 - LINES[i], z0 + SLH / 2)), class: "nf lo" }, cg);
    slabs.push(s);
  }

  const back = mk("g", {}, g);
  const eg = mk("g", { "data-part": "engine" }, g);
  put(solid(eg), prism(P, front, ...rings(-20, -20, 20, 20, 6, 1.6), 0, EH));
  mk("path", { d: [-9, -3, 3].map((y) => poly(ringAt(P, rrect(-11, y, 9, y + 2.6, 1.3, 3), EH))).join(""), class: "nf lo" }, eg);
  place(mk("circle", { r: 1.3, class: "dot m" }, eg), P(12, 12, EH));
  const fore = mk("g", {}, g);

  // Packets behind the engine are painted before it, those on the stub after it.
  const packets = PK.map(([ax], i) => ({ el: solid(ax === "x" ? back : fore), tw: tween(0), i, drawn: "" }));

  const kg = mk("g", { "data-part": "cache" }, g);
  const ring = shift(circ(DR.R, 48), DR.x, DR.y), inner = shift(circ(DR.R - 1.3, 48), DR.x, DR.y);
  const foot = mk("path", { class: "nf dash" }, kg);
  const drum = mk("path", {}, kg), rim = mk("path", { class: "nf lo" }, kg), bands = mk("path", { class: "nf lo" }, kg);
  const dh = tween(DR.H);
  let drumDrawn = -1;

  UI.forEach((ui, k) => {
    const ug = mk("g", { "data-part": k ? "gui" : "cli" }, g);
    put(solid(ug), prism(P, front, ...rings(...ui.stand, 5, 1.4), 0, SH));
    const w = onSlab(P, k, TH);
    const shape = fillet([[-ui.W / 2, 0], [ui.W / 2, 0], [ui.W / 2, ui.H], [-ui.W / 2, ui.H]], [2, 2, 5, 5]);
    mk("path", { d: poly(shape.map((p) => w(p[0], p[1], 0))), class: "lo" }, ug);
    mk("path", { d: poly(shape.map((p) => w(p[0], p[1], TK))), class: "sil" }, ug);
    faceMarks(k, w, ug);
  });

  function drawDrum(h) {
    if (h === drumDrawn) return;
    drumDrawn = h;
    foot.setAttribute("d", h < DR.H - 0.1 ? poly(ringAt(P, shift(circ(DR.R + 1.6, 48), DR.x, DR.y), 0)) : "");
    if (h < 0.3) { for (const el of [drum, rim, bands]) el.setAttribute("d", ""); return; }
    const pr = prism(P, front, ring, inner, 0, h), near = run(ring, front);
    drum.setAttribute("d", pr.sil);
    rim.setAttribute("d", pr.crease);
    bands.setAttribute("d", [0.36, 0.68].map((f) => open(ringAt(P, near, h * f))).join(""));
  }

  function drawPacket(pk, p) {
    const key = p.toFixed(3);
    if (key === pk.drawn) return;
    pk.drawn = key;
    if (p < 0.02) { put(pk.el, { sil: "", crease: "" }); return; }
    const [ax, at, across] = PK[pk.i], a = at - (1 - p) * 10, z1 = PT + 3 * p;
    const fp = ax === "x" ? [a - 3, across - 2.5, a + 3, across + 2.5] : [across - 2.5, a - 3, across + 2.5, a + 3];
    put(pk.el, prism(P, front, ...rings(...fp, 1.2, 0.6), PT, z1));
  }

  const B = register(stage, (_dt, now) => {
    drawDrum(tval(dh, now));
    let moving = !tdone(dh, now);
    packets.forEach((pk) => {
      drawPacket(pk, tval(pk.tw, now));
      if (!tdone(pk.tw, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  /** Sends the figure to state s (-1 is rest, drawn as normal). */
  function choose(s) {
    if (s === cur) return;
    cur = s;
    const k = s < 0 ? 0 : s, now = performance.now();
    tset(dh, k === 1 ? 0 : DR.H, now, 0);
    // Packets enter one after another from the channel's end, the nearest first.
    packets.forEach((pk) => tset(pk.tw, k === 2 ? 1 : 0, now, k === 2 ? pk.i * stag : 0));
    for (const sl of slabs) sl.sil.classList.toggle("hi", k !== 2);
    drum.classList.toggle("hi", k === 2);
    read.textContent = s < 0 ? "rest" : NAMES[s];
    B.wake();
  }

  // Three fixed bands across the stage; nothing that moves is tested.
  bag.add(pointer(stage, { move: (p) => choose(clamp(Math.floor((p[0] * 3) / 400), 0, 2)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  choose(-1);

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tgdrive",
  means: "The channel holds the files and the database only caches them: lose the drum and the channel fills it again.",
  rules: [1, 2, 4, 5],
  range: [0, 50, 100],
  mount,
});
