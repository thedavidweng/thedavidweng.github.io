// The overlay grammar. Figures hold only objects (Hairline's rule 10: no words,
// digits or arrows in a drawing), so everything that instructs is set here, on top
// of them: part badges, leaders, step numerals, arrows, ✓/✗ marks and panels,
// quantities and zoom circles.
//
// figures/export.mjs writes svg/<name>.svg and svg/<name>.json. The json gives the
// width in inches the svg was exported for (its stroke widths are in points at that
// width), its viewBox, and the box of each data-part group, in viewBox units.

#let ink = rgb("#111114")
#let muted = rgb("#5c5c64")
#let rule-c = rgb("#c9c9cf")
#let heavy = 1.3pt

#let meta(name) = json("figures/svg/" + name + ".json")

// A figure at the width it was exported for, so its strokes print at their weights.
#let fig(name) = image("figures/svg/" + name + ".svg", width: meta(name).w * 1in, fit: "contain")

// A point of a data-part's box, in the placed figure's coordinates. `at` is a pair
// of fractions of the box, (0, 0) its top left and (1, 1) its bottom right.
#let anchor(m, part, at: (0.5, 0.5)) = {
  let (vx, vy, vw, _) = m.vb
  let (x, y, w, h) = m.parts.at(part)
  let s = m.w * 1in / vw
  ((x + at.at(0) * w - vx) * s, (y + at.at(1) * h - vy) * s)
}

#let leader(a, b, dot: true) = {
  place(top + left, line(start: a, end: b, stroke: 0.6pt + ink))
  if dot { place(top + left, dx: a.at(0) - 1.6pt, dy: a.at(1) - 1.6pt, circle(radius: 1.6pt, fill: ink, stroke: none)) }
}

// A part number: white on a black tag, the way a parts list marks its hardware.
#let badge(id, size: 8.5pt) = box(
  fill: ink, radius: 2.5pt, inset: (x: 0.38em, y: 0.3em), baseline: 0.3em,
  text(size: size, weight: 700, fill: white, tracking: 0.02em, id),
)

// A figure with labels on leaders. Each callout is a dictionary:
//   part: the data-part to point at; at: where on its box (fractions)
//   to: where the label sits, (dx, dy) from that point; side: left or right of `to`
//   body: the label
#let annotated(name, callouts) = {
  let m = meta(name)
  let w = m.w * 1in
  box(width: w, height: w * m.vb.at(3) / m.vb.at(2), {
    place(top + left, fig(name))
    for c in callouts {
      let a = anchor(m, c.part, at: c.at("at", default: (0.5, 0.5)))
      let (dx, dy) = c.to
      let b = (a.at(0) + dx, a.at(1) + dy)
      leader(a, b)
      let side = c.at("side", default: if dx < 0pt { left } else { right })
      let lw = c.at("width", default: 1.6in)
      let label = box(width: lw, align(if side == left { right } else { left }, text(size: 9pt, c.body)))
      place(top + left, dx: if side == left { b.at(0) - lw - 4pt } else { b.at(0) + 4pt }, dy: b.at(1) - 0.55em, label)
    }
  })
}

#let numeral(n, size: 30pt) = text(size: size, weight: 700, tracking: -0.02em, str(n))

// ✓ and ✗ are drawn, not set: neither typeface has them, and a drawn mark keeps
// one weight with the figures.
#let check-glyph(s) = curve(
  stroke: (paint: ink, thickness: s * 0.13, cap: "round", join: "round"),
  curve.move((s * 0.18, s * 0.52)), curve.line((s * 0.42, s * 0.76)), curve.line((s * 0.84, s * 0.26)),
)
#let cross-glyph(s) = {
  let st = (paint: ink, thickness: s * 0.13, cap: "round")
  place(line(start: (s * 0.24, s * 0.24), end: (s * 0.76, s * 0.76), stroke: st))
  line(start: (s * 0.76, s * 0.24), end: (s * 0.24, s * 0.76), stroke: st)
}
#let mark(ok, size: 16pt) = box(width: size, height: size, baseline: 0.22 * size, {
  place(circle(radius: size / 2, stroke: heavy + ink, fill: white))
  if ok { check-glyph(size) } else { cross-glyph(size) }
})

// A wrong/right panel: a rounded frame with its mark on the top left corner.
#let panel(ok, body, inset: 10pt) = block(width: 100%, breakable: false, {
  block(width: 100%, stroke: (if ok { heavy } else { 0.8pt }) + ink, radius: 6pt, inset: inset, body)
  place(top + left, dx: -7pt, dy: -7pt, mark(ok, size: 20pt))
})

// A plain arrow pointing right (or down with `down: true`), drawn to `len`.
#let arrow(len: 0.32in, down: false) = {
  let s = 4.5pt
  let shape = curve(
    stroke: (paint: ink, thickness: heavy, cap: "round", join: "round"),
    curve.move((0pt, 0pt)), curve.line((len - 1pt, 0pt)),
    curve.move((len - s, -s * 0.8)), curve.line((len - 1pt, 0pt)), curve.line((len - s, s * 0.8)),
  )
  if down { box(width: 2 * s, height: len, place(dx: s, rotate(90deg, origin: top + left, shape))) }
  else { box(width: len, height: 2 * s, place(dy: s, shape)) }
}

// A quantity, the way a parts list counts hardware.
#let qty(n) = text(size: 11pt, weight: 600, str(n) + "×")

// A circular detail: a large crop clipped to a circle. `dy` shifts the crop so the
// detail that matters sits in the middle.
#let zoom(name, d: 1.2in, dx: 0pt, dy: 0pt) = {
  let m = meta(name)
  let w = m.w * 1in
  let h = w * m.vb.at(3) / m.vb.at(2)
  box(width: d, height: d, {
    place(box(width: d, height: d, radius: d / 2, clip: true,
      place(dx: (d - w) / 2 + dx, dy: (d - h) / 2 + dy, fig(name))))
    place(circle(radius: d / 2, stroke: heavy + ink))
  })
}

// A part icon with its badge, for "modules used" rows.
#let module(id, label: none) = box(baseline: 30%, stack(dir: ltr, spacing: 4pt,
  box(height: 0.32in, align(horizon, fig("icon-" + lower(id)))),
  align(horizon, badge(id)),
  ..if label != none { (align(horizon, text(size: 9pt, label)),) },
))
