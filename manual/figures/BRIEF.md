# Figure brief for the redesigned manual

This file is the shared brief for every figure worker. It is scratch: delete it
once the figures are done.

## The book

"DAVID — User Manual" is a 12-page US Letter booklet about David Weng's work,
printed in black and white. It follows IKEA's information design: the person is
presented as an assembled product, a workstation cabinet called DAVID with five
modules, and every page shows objects in states, so the pictures instruct
instead of decorate. Numbers, arrows, ✓/✗ marks, quantities and labels are set
by Typst on top of the figures, never inside them (rule 10).

## The DAVID cabinet (shared geometry)

Every figure that shows the cabinet uses these world units, so the cabinet is
the same object on every page. Camera `Cam(45, 0.5, S)`: +x runs down-right,
+y down-left, so the front face is the y = D side and the right side panel is
the x = W side; both face the viewer, and so does the top.

| Module | Part | Geometry |
| --- | --- | --- |
| D1 Frame | the carcass | plinth z 0–6 inset 5 from the footprint; carcass footprint x 0–96, y 0–58, z 6–100; top board z 100–104 overhanging by 2 |
| D2 Spirit level | set into the top board | a long rounded bar about 44 × 9, lying in a shallow recess near the front of the top, with a vial window in its middle and a bubble (a small flat ellipse or dot) inside the vial. Bubble centred = level |
| D3 Hex key | clipped to the right side panel | an L-shaped bar of hexagon-ish section (a long leg about 40, a short leg about 10), held by two small clips on the x = W face |
| D4 Drawer | front and handle | one wide drawer in the lower part of the front face, z about 14–46, its front proud of the carcass by 2–3, with a bar handle |
| D5 Pegboard | the back panel | a thin board at y 0–3, as wide as the carcass, rising from the top to z about 170, with a grid of hole dots and two or three hooks sticking out toward +y; one hook may hold a small tool |

Above the drawer the front face has an open shelf bay or a second plain drawer
front; that is up to the figure, but the five modules above must always be
recognisable, in the same places.

## Print rules (all figures)

- The figures are exported to static SVG and printed in black and white at
  2–6 inches wide. The exporter maps classes to print weights: `sil` becomes a
  heavy near-black stroke, `hi` the heaviest pure black, the default stroke a
  medium grey, `lo` and `dash` thin light grey. So the silhouette carries the
  drawing; put real structure on `sil`, detail on the default or `lo` stroke,
  and use `hi` on the one thing that matters in each state.
- Every state you are asked for must read alone, as a still, with no
  pointer, no read-out and no caption. Exaggerate the difference between
  states: a reader compares them side by side on paper.
- Put each object you are asked to name in its own `<g data-part="id">`
  group, holding all of that object's paths and nothing else. The exporter
  cuts those groups into icons and uses their bounding boxes to place
  labels, so a part that moves between states must keep its group.
- No text, digits, arrows or logos in the drawing (rule 10). Typst adds them.
- Pass `look.mjs` (exit 0) and answer `look.md` honestly.

## How to work

- Skill folder: `/Users/david/.agents/skills/hairline-create/`. Read
  `SKILL.md`, `rules.md`, the index at the top of `kernel.js` (down to
  `var HL`), `concepts.md`, `look.md`, and the nearer example in `examples/`.
- Work in `/Users/david/Development/thedavidweng.github.io/manual/figures/`.
  `steps.js` (discrete states picked by pointer x bands) and `drawers.js`
  (a cabinet with drawers) are finished figures in this folder in the same
  style; read them for how this project does states and cabinets.
- Run `node /Users/david/.agents/skills/hairline-create/look.mjs <name>.js
  --answer x,y,z --edge x,y,z` from the figures folder until it exits 0, and
  read the sheet it writes.
- For each state the book needs, find a `?at=x,y` viewBox point that holds
  it, open `hairline-<name>.html?theme=light&at=x,y` the way look.mjs does
  (or check with its sheet), and make sure that still reads alone.
- Only create or edit the files named in your task. Do not edit
  `export.mjs`, the Typst files, or other figures. Delete any scratch PNGs
  you make, except the `-look.png` sheet.

## Report back

1. The file(s) you wrote and that look.mjs exits 0.
2. For each state: its name and the `?at=` point (and `?intensity=` if not
   the default) that holds it.
3. Every `data-part` id and what it is.
4. Anything you could not get right.
