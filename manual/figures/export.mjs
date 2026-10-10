#!/usr/bin/env node
/**
 * Exports the Hairline figures in this folder to static SVG for the printed manual.
 *
 *   node manual/figures/export.mjs [figure ...]
 *
 * Each entry in JOBS loads a built page, hairline-<name>.html (build it with the
 * hairline-create skill's build.mjs), in a headless Chromium, optionally holds the
 * pointer at a viewBox point, waits for the drawing to settle, and serializes the
 * svg: every computed stroke and fill becomes a plain attribute, and the viewBox is
 * tightened to the drawing. A crop keeps only one `data-part` group. The output has
 * no classes, scripts, masks or CSS, so Typst embeds it as plain vector art.
 *
 * Screen strokes are all 0.9 units wide and differ only in colour. On paper that
 * hierarchy is too faint, so each stroke's role (read from its screen colour) gets a
 * print ink and a print width in points. Widths are in points on the page, so every
 * job states the width in inches it is printed at, and the layout places it at that
 * width: svg/<name>.json carries it, with the viewBox and the box of every data-part
 * group, which the layout uses to place labels and leaders over the drawing.
 *
 * Needs playwright-core and a Chromium. The hairline-create skill's look.mjs
 * installs both; set PLAYWRIGHT_CORE to another playwright-core folder if needed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "svg");
const require = createRequire(import.meta.url);
const pw = process.env.PLAYWRIGHT_CORE || join(homedir(), "Library/Caches/hairline-look/node_modules/playwright-core");
const { chromium } = require(pw);

// Screen colour (light theme) → role. Plates are filled white.
const ROLE = {
  "rgb(35, 35, 39)": "hi",
  "rgb(164, 164, 172)": "sil",
  "rgb(195, 195, 201)": "mid",
  "rgb(224, 224, 228)": "lo",
  "rgb(255, 255, 255)": "plate",
};
// Role → [ink, width in pt]. Silhouettes carry the drawing; the highlight is the
// heaviest pure black; inner detail steps down to thin grey.
const INK = { hi: ["#000000", 1.7], sil: ["#16161a", 1.15], mid: ["#4a4a52", 0.6], lo: ["#7c7c84", 0.45], plate: ["#ffffff", 0] };
// Icons stand side by side, so their highlight must not single one out.
const ICON = { ...INK, hi: INK.sil };

// [output name, page, { w: printed width in inches, at: [x, y], intensity, part, frame }]
// Jobs with the same frame share one viewBox, so their states line up on the page.
const JOBS = [];
const job = (name, fig, opt) => JOBS.push([name, fig, opt]);
const states = (prefix, fig, w, list) => list.forEach(([s, at, extra]) => job(`${prefix}-${s}`, fig, { w, at, frame: prefix, ...extra }));
const crops = (prefix, fig, w, ids, extra) => ids.forEach((id) => job(`${prefix}-${id}`, fig, { w, part: id, ...extra }));

job("cover", "david", { w: 3.1, at: [30, 160] });
job("end", "david", { w: 3.2, at: [30, 160] });
job("parts", "david", { w: 3.45, at: [100, 160] });
crops("icon", "david", 0.32, ["d1", "d2", "d3", "d4", "d5"], { at: [100, 160], h: 0.32 });
states("step", "david", 1.55, [["1", [166, 160]], ["2", [233, 160]], ["3", [300, 160]], ["4", [366, 160]]]);
states("sukiru", "sukiru", 2.2, [["before", [70, 160]], ["after", [330, 160]]]);
job("sukiru-level", "sukiru", { w: 1.05, at: [330, 160], part: "level" });
states("kara", "openkara", 1.65, [["song", [50, 160]], ["two", [150, 160]], ["four", [250, 160]], ["mix", [350, 160]]]);
job("tg-hero", "tgdrive", { w: 3.6, at: [60, 160] });
states("tg", "tgdrive", 1.85, [["normal", [60, 160]], ["lost", [200, 160]], ["rebuilt", [340, 160]]]);
states("adp", "adp", 1.4, [["1", [50, 160]], ["2", [150, 160]], ["3", [250, 160]], ["4", [350, 160]]]);
crops("prod", "products-a", 0.9, ["canvas", "zenodo", "monarch", "flickr", "qualtrics", "money", "deckpad", "adp"], { h: 0.85 });
crops("prod", "products-b", 0.9, ["openkara", "sukiru", "applesay", "sdfflash", "tgdrive", "vapourfly", "openloop"], { h: 0.85 });
for (const fig of ["tool", "drill", "joint"]) states(fig, fig, 1.5, [["wrong", [100, 160], { h: 1.25 }], ["right", [300, 160], { h: 1.25 }]]);
job("pegboard", "pegboard", { w: 4.6 });

function serialize({ part }) {
  const svg = document.querySelector("#stage svg");
  const root = part ? svg.querySelector(`[data-part="${part}"]`) : svg;
  if (!root) throw new Error(`no data-part ${part}`);
  const SHAPES = { path: ["d"], polygon: ["points"], polyline: ["points"], line: ["x1", "y1", "x2", "y2"], circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"] };
  const num = (v) => String(Math.round(Number(v) * 100) / 100);
  const items = [];
  const walk = (el) => {
    if (el.hasAttribute("mask") || el.tagName === "defs" || el.tagName === "mask") return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return;
    const keys = SHAPES[el.tagName];
    if (keys) {
      const geo = keys.map((k) => el.getAttribute(k)).filter((v) => v != null);
      if (geo.length !== keys.length || (keys[0] === "d" && !geo[0].trim())) return;
      const a = keys.map((k, i) => (k === "d" || k === "points" ? `${k}="${geo[i]}"` : `${k}="${num(geo[i])}"`)).join(" ");
      const dash = cs.strokeDasharray && cs.strokeDasharray !== "none" ? cs.strokeDasharray.split(/[ ,]+/).map(parseFloat) : null;
      items.push({ tag: el.tagName, a, stroke: cs.stroke, fill: cs.fill, dash });
    }
    for (const c of el.children) walk(c);
  };
  walk(root);
  const b = root.getBBox();
  const parts = {};
  if (!part) for (const g of svg.querySelectorAll("[data-part]")) {
    const r = g.getBBox();
    parts[g.dataset.part] = [r.x, r.y, r.width, r.height].map(num).map(Number);
  }
  return { items, box: [b.x, b.y, b.width, b.height], parts };
}

/** The svg body, with each stroke's role turned into print ink and a width in viewBox units. */
function body(items, ink, unitsPerPt) {
  const color = (c, fallback) => (c === "none" || !c ? "none" : ROLE[c] ? ink[ROLE[c]][0] : fallback ?? c);
  const r2 = (v) => Math.round(v * 100) / 100;
  return items.map(({ tag, a, stroke, fill, dash }) => {
    const s = color(stroke), at = [a, `fill="${color(fill)}"`, `stroke="${s}"`];
    if (s !== "none") {
      const role = ROLE[stroke] || "mid";
      // A dashed guide is a guide whatever its colour: always the thin stroke.
      const pt = dash ? INK.lo[1] : ink[role][1], w = pt * unitsPerPt;
      at.push(`stroke-width="${r2(w)}"`, `stroke-linejoin="round"`, `stroke-linecap="round"`);
      if (dash) at.push(`stroke-dasharray="${dash.map((v) => r2((v * w) / 0.9 * 1.6)).join(" ")}"`);
    }
    return `<${tag} ${at.join(" ")}/>`;
  }).join("\n");
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
mkdirSync(out, { recursive: true });
const frames = {};
// Optional arguments name the figures to export, e.g. `export.mjs david sukiru`.
const only = process.argv.slice(2);
for (const [name, fig, opt] of JOBS) {
  if (only.length && !only.includes(fig)) continue;
  const q = new URLSearchParams({ theme: "light" });
  if (opt.at) q.set("at", opt.at.join(","));
  if (opt.intensity != null) q.set("intensity", String(opt.intensity));
  await page.goto(pathToFileURL(join(here, `hairline-${fig}.html`)).href + "?" + q);
  await page.waitForTimeout(2500);
  const r = await page.evaluate(serialize, { part: opt.part });
  const f = { name, opt, ...r };
  if (opt.frame) (frames[opt.frame] ||= []).push(f);
  else write(f, f.box);
}
for (const list of Object.values(frames)) {
  const x0 = Math.min(...list.map((f) => f.box[0])), y0 = Math.min(...list.map((f) => f.box[1]));
  const x1 = Math.max(...list.map((f) => f.box[0] + f.box[2])), y1 = Math.max(...list.map((f) => f.box[1] + f.box[3]));
  for (const f of list) write(f, [x0, y0, x1 - x0, y1 - y0]);
}
await browser.close();

function write({ name, opt, items, parts }, box) {
  const p = 4, vb = [box[0] - p, box[1] - p, box[2] + 2 * p, box[3] + 2 * p].map((v) => Math.round(v * 100) / 100);
  const w = opt.h ? Math.min(opt.w, opt.h * vb[2] / vb[3]) : opt.w;
  const unitsPerPt = vb[2] / (w * 72);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}">\n${body(items, opt.part ? ICON : INK, unitsPerPt)}\n</svg>\n`;
  writeFileSync(join(out, `${name}.svg`), svg);
  writeFileSync(join(out, `${name}.json`), JSON.stringify({ w, vb, parts }) + "\n");
  console.log("wrote", name);
}
