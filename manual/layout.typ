// Page structure for every language edition. Wording comes from copy/<lang>.typ and
// facts from data.typ, so a change to the layout reaches both editions at once.
#import "data.typ"
#import "kit.typ": *
#import "copy/en.typ" as reference

// Paths where a copy's shape differs from the English reference: a missing or extra
// key, or a list of a different length. Leaf values (strings, content) may differ.
#let drift(a, b, path: "t") = {
  if type(b) == dictionary {
    if type(a) != dictionary { return (path + " is not a dictionary",) }
    let out = ()
    for k in b.keys() {
      if k not in a { out.push(path + "." + k + " is missing") } else { out += drift(a.at(k), b.at(k), path: path + "." + k) }
    }
    for k in a.keys() { if k not in b { out.push(path + "." + k + " is not in copy/en.typ") } }
    out
  } else if type(b) == array {
    if type(a) != array or a.len() != b.len() { return (path + " has a different length",) }
    let out = ()
    for (i, pair) in a.zip(b).enumerate() { out += drift(pair.at(0), pair.at(1), path: path + "." + str(i)) }
    out
  } else if type(a) in (dictionary, array) {
    (path + " should be a single value",)
  } else { () }
}

#let manual(t) = {
  let gaps = drift(t, reference.t)
  assert(gaps.len() == 0, message: "copy/" + t.lang + ".typ is out of sync with copy/en.typ: " + gaps.join("; "))

  let zh = t.lang == "zh"
  // Latin text stays in Mona Sans in every edition; Han text and full-width
  // punctuation fall through to Noto Sans SC.
  let fonts = if zh { ((name: "Mona Sans", covers: "latin-in-cjk"), "Noto Sans SC") } else { "Mona Sans" }

  set document(
    title: t.doc.title,
    author: data.name,
    description: t.doc.description,
    keywords: t.doc.keywords,
    date: datetime(year: 2026, month: 10, day: 7),
  )

  set page(
    paper: "us-letter",
    margin: (x: 0.75in, top: 0.7in, bottom: 0.9in),
    footer: context {
      let n = counter(page).get().first()
      if n > 1 {
        set text(size: 8.5pt, fill: muted)
        grid(
          columns: (1fr, auto),
          align: (left + bottom, right + bottom),
          text(size: 15pt, weight: 600, fill: ink, if n < 10 { "0" + str(n) } else { str(n) }),
          t.footer,
        )
      }
    },
  )

  set text(font: fonts, size: 10.5pt, fill: ink, lang: t.lang, region: t.region, hyphenate: false)
  set par(leading: if zh { 0.9em } else { 0.62em }, spacing: if zh { 1.3em } else { 1.1em }, justify: false)
  // One typeface throughout, so commands and flags are set in Mona Sans too.
  show raw: set text(font: fonts, weight: 500, size: 1.25em, ligatures: false, features: (calt: 0))
  show link: it => underline(stroke: 0.5pt + rule-c, offset: 2.2pt, it)

  let kicker(n, label) = text(size: 9pt, weight: 500, fill: muted, tracking: if zh { 0.02em } else { 0.06em }, upper(n + "  ·  " + label))
  let title(body) = block(above: 10pt, below: 12pt, {
    set text(size: if zh { 30pt } else { 34pt }, weight: 600, tracking: if zh { 0em } else { -0.01em })
    set par(leading: if zh { 0.32em } else { 0.2em })
    body
  })
  let lede(body) = block(below: 14pt, text(size: 13pt, weight: 400, fill: muted, body))
  let hair = line(length: 100%, stroke: 0.5pt + rule-c)
  let small(body) = text(size: 9pt, fill: muted, body)
  let head(n, p) = { kicker(n, p.kicker); title(p.title); lede(p.lede) }
  let module-name(id) = t.modules.at(data.modules.position(m => m == id))
  // The row under a project's heading that names the modules it uses, with their icons.
  let uses(key) = block(below: 16pt, {
    text(size: 9pt, weight: 600, fill: muted, upper(t.labels.uses))
    h(10pt)
    data.uses.at(key).map(id => module(id, label: module-name(id).at(1))).join(h(14pt))
  })
  let links(p) = block(above: 1em, text(size: 9.5pt, grid(
    columns: (1.15in, 1fr),
    row-gutter: 0.55em,
    column-gutter: 0.2in,
    text(fill: muted, t.labels.website), link(p.web, p.web.trim("https://", at: start).trim("/", at: end)),
    text(fill: muted, t.labels.source), link(p.src, p.src.trim("https://", at: start)),
  )))
  let centered(body) = align(center, body)
  // A labelled list with a drawn mark at every item.
  let marked(ok, items, size: 10pt) = stack(spacing: 0.7em, ..items.map(it => grid(
    columns: (18pt, 1fr), column-gutter: 4pt, mark(ok, size: 13pt), text(size: size, it),
  )))

  // ───────────────────────────── 01 Cover
  page(margin: (x: 0.75in, top: 0.8in, bottom: 0.7in))[
    // The cover is measured to fill one page exactly, so it keeps Latin spacing in
    // every edition.
    #set par(leading: 0.62em, spacing: 1.1em)
    #text(size: 104pt, weight: 700, tracking: -0.02em)[DAVID]
    #v(-3.2em)
    #text(size: 26pt, weight: 500, t.cover.subtitle)
    #v(0.2em)
    #text(size: 13pt, fill: muted, t.cover.tagline)
    #v(1fr)
    #let tag(i) = [#badge(data.modules.at(i)) #h(3pt) #text(weight: 600, t.modules.at(i).at(0)) \ #text(size: 8.5pt, fill: muted, t.modules.at(i).at(1))]
    #centered(annotated("cover", data.cover-callouts.enumerate().map(((i, c)) => (..c, body: tag(i)))))
    #v(1fr)
    #grid(
      columns: (1fr, auto),
      align: (left + bottom, right + bottom),
      text(size: 9pt, fill: muted)[#data.name \ #t.role],
      text(size: 9pt, fill: muted, t.cover.edition),
    )
  ]

  // ───────────────────────────── 02 Package contents
  head("02", t.parts)
  let cell(i) = {
    let (part, skill) = t.modules.at(i)
    let (what, seen) = t.parts.items.at(i)
    block(breakable: false, {
      grid(columns: (auto, 1fr, auto), column-gutter: 6pt, align: horizon,
        fig("icon-d" + str(i + 1)), badge(data.modules.at(i), size: 10pt), qty(1))
      v(2pt)
      text(size: 12pt, weight: 600, part)
      linebreak()
      text(size: 9pt, weight: 500, fill: muted, skill)
      v(2pt)
      text(size: 10pt, what)
    })
  }
  v(1fr)
  grid(columns: (3.65in, 1fr), column-gutter: 0.25in, align: horizon,
    annotated("parts", data.parts-callouts.enumerate().map(((i, c)) => (..c, body: badge(data.modules.at(i), size: 10pt)))),
    stack(spacing: 14pt, ..range(5).map(cell)))
  v(1fr)
  pagebreak()

  // ───────────────────────────── 03 Assembly instructions
  head("03", t.steps)
  let step(i) = {
    let (h1, body, proof) = t.steps.items.at(i)
    let id = data.step-modules.at(i)
    block(breakable: false, {
      grid(columns: (1fr, auto), align: (left + top, right + top),
        numeral(i + 1, size: 34pt),
        box(stroke: 0.8pt + ink, radius: 5pt, inset: 5pt, stack(dir: ltr, spacing: 5pt,
          align(horizon, qty(1)), box(height: 0.32in, align(horizon, fig("icon-" + lower(id)))), align(horizon, badge(id))))
      )
      box(width: 100%, height: 2.25in, align(center + horizon, fig("step-" + str(i + 1))))
      v(4pt)
      text(size: 12pt, weight: 600, h1)
      linebreak()
      body
      v(1pt)
      small(proof)
    })
  }
  grid(
    columns: (1fr, 0.4in, 1fr),
    row-gutter: 0.08in,
    align: (left, center + horizon, left),
    step(0), arrow(), step(1),
    [], [], centered(arrow(len: 0.2in, down: true)),
    step(3), rotate(180deg, arrow()), step(2),
  )
  pagebreak()

  // ───────────────────────────── 04 Sukiru
  head("04", t.sukiru)
  uses("sukiru")
  let side(ok, name, s) = panel(ok, {
    align(right, text(size: 11pt, weight: 600, s.head))
    box(width: 100%, height: 2.6in, align(center + horizon, fig(name)))
    v(4pt)
    marked(ok, s.items, size: 9.5pt)
  })
  grid(columns: (1fr, 1fr), column-gutter: 0.3in,
    side(false, "sukiru-before", t.sukiru.before),
    side(true, "sukiru-after", t.sukiru.after),
  )
  v(1fr)
  grid(columns: (auto, 1fr), column-gutter: 0.25in, align: (center + horizon, left + horizon),
    zoom("sukiru-level", d: 1.15in),
    [#mark(true, size: 15pt) #h(4pt) #text(size: 12pt, weight: 600, t.sukiru.check.head) \ #t.sukiru.check.body \ #small(t.sukiru.built)],
  )
  v(1fr)
  links(data.projects.sukiru)
  pagebreak()

  // ───────────────────────────── 05 OpenKara
  head("05", t.openkara)
  uses("openkara")
  let stage(name, (h1, body)) = block(breakable: false, {
    centered(fig(name))
    v(3pt)
    centered[#text(weight: 600, h1) \ #text(size: 9pt, fill: muted, body)]
  })
  let f = t.openkara.flow
  v(1fr)
  grid(
    columns: (1fr, auto, 1fr, auto, 1fr),
    column-gutter: 6pt,
    align: center + horizon,
    stage("kara-song", f.at(0)),
    arrow(len: 0.28in),
    stack(spacing: 8pt, stage("kara-two", f.at(1)), text(size: 9pt, weight: 600, fill: muted, upper(t.openkara.alternative)), stage("kara-four", f.at(2))),
    arrow(len: 0.28in),
    stage("kara-mix", f.at(3)),
  )
  v(1fr)
  grid(columns: (1fr, 1fr), column-gutter: 0.3in,
    marked(true, (t.openkara.local.yes,)),
    marked(false, (t.openkara.local.no,)),
  )
  v(14pt)
  hair
  grid(columns: (1.15in, 1fr), row-gutter: 0.8em, column-gutter: 0.2in, inset: (y: 2pt),
    ..t.openkara.facts.map(((l, b)) => (text(size: 9pt, weight: 600, upper(l)), b)).flatten())
  hair
  links(data.projects.openkara)
  pagebreak()

  // ───────────────────────────── 06 tg-drive
  head("06", t.tgdrive)
  uses("tgdrive")
  v(0.3in)
  centered(annotated("tg-hero", data.tg-callouts.map(c => (..c, body: t.tgdrive.callouts.at(c.part)))))
  v(0.3in)
  v(1fr)
  text(size: 12pt, weight: 600, t.tgdrive.rebuild.head)
  v(4pt)
  let r = t.tgdrive.rebuild.steps
  let frame(name, ok, body) = block(breakable: false, {
    box(width: 100%, {
      centered(fig(name))
      if ok != none { place(top + left, mark(ok, size: 18pt)) }
    })
    v(3pt)
    text(size: 9pt, body)
  })
  grid(columns: (1fr, auto, 1fr, auto, 1fr), column-gutter: 6pt, align: (left + top, center + horizon, left + top, center + horizon, left + top),
    frame("tg-normal", none, r.at(0)), arrow(len: 0.26in),
    frame("tg-lost", false, r.at(1)), arrow(len: 0.26in),
    frame("tg-rebuilt", true, r.at(2)),
  )
  v(10pt)
  small(t.tgdrive.guards)
  links(data.projects.tgdrive)
  pagebreak()

  // ───────────────────────────── 07 ADP Shifts
  head("07", t.adp)
  uses("adp")
  v(1fr)
  let adp-step(i) = block(breakable: false, {
      numeral(i + 1, size: 26pt)
      v(-6pt)
      box(width: 100%, height: 1.75in, align(center + horizon, fig("adp-" + str(i + 1))))
      v(3pt)
      text(size: 9.5pt, t.adp.howto.at(i))
    })
  grid(columns: (1fr, auto, 1fr, auto, 1fr, auto, 1fr), column-gutter: 4pt, align: horizon,
    adp-step(0), arrow(len: 0.12in), adp-step(1), arrow(len: 0.12in), adp-step(2), arrow(len: 0.12in), adp-step(3),
  )
  v(1fr)
  grid(columns: (1fr, 1fr), column-gutter: 0.3in,
    marked(true, t.adp.yes, size: 9.5pt),
    marked(false, t.adp.no, size: 9.5pt),
  )
  v(12pt)
  small(t.adp.others)
  links(data.projects.adp)
  pagebreak()

  // ───────────────────────────── 08–09 Product catalogue
  let card(key, i, (name, url, shown, thumb), what) = block(breakable: false, width: 100%, grid(
    columns: (1.05in, 1fr), column-gutter: 0.15in, align: (center + horizon, left + horizon),
    box(width: 1.05in, height: 0.85in, align(center + horizon, fig("prod-" + thumb))),
    [
      #text(size: 8pt, weight: 600, fill: muted, tracking: 0.06em, data.prefix.at(key) + " " + (if i < 9 { "0" } else { "" }) + str(i + 1)) \
      #text(size: 12pt, weight: 600, name) \
      #v(-2pt)
      #text(size: 10.5pt, what) \
      #text(size: 9pt, link(url, if shown == none { t.catalogue.docs } else { shown }))
    ],
  ))
  let group(key) = {
    let g = t.catalogue.groups.at(key)
    let entries = data.catalogue.at(key)
    block(breakable: false, below: 16pt, {
      text(size: 13pt, weight: 600, g.head)
      h(0.4em)
      text(fill: muted, str(entries.len()))
      v(2pt)
      hair
      v(6pt)
      let cards = entries.zip(g.items).enumerate().map(((i, (e, what))) => card(key, i, e, what))
      if entries.len() == 1 { cards.first() }
      else { grid(columns: (1fr, 1fr), column-gutter: 0.3in, row-gutter: 14pt, ..cards) }
    })
  }
  head("08", t.catalogue)
  group("cli")
  grid(columns: (1fr, 1fr), column-gutter: 0.3in, group("plugin"), group("ext"))
  pagebreak()

  kicker("09", t.catalogue.kicker2)
  title(t.catalogue.title2)
  lede(t.catalogue.lede2)
  {
    let g = t.catalogue.groups.app
    let entries = data.catalogue.app
    hair
    v(6pt)
    grid(columns: (1fr, 1fr), column-gutter: 0.3in, row-gutter: 18pt,
      ..entries.zip(g.items).enumerate().map(((i, (e, what))) => card("app", i, e, what)))
  }
  v(1fr)
  small(t.catalogue.more)
  pagebreak()

  // ───────────────────────────── 10 Care and handling
  head("10", t.care)
  let habit(i, name) = {
    let (h1, wrong, right, proof) = t.care.items.at(i)
    let half(ok, body) = panel(ok, inset: 8pt, {
      box(width: 100%, height: 1.3in, align(center + horizon, fig(name + "-" + if ok { "right" } else { "wrong" })))
      v(2pt)
      text(size: 9pt, body)
    })
    block(breakable: false, {
      text(size: 13pt, weight: 600, h1)
      v(6pt)
      grid(columns: (1.75in, 1.75in, 1fr), column-gutter: 0.22in, align: (left + top, left + top, left + horizon),
        half(false, wrong), half(true, right), small(proof))
    })
  }
  stack(spacing: 1fr, habit(0, "tool"), habit(1, "drill"), habit(2, "joint"),
    block(breakable: false, grid(columns: (22pt, 1fr), mark(true, size: 16pt),
      [#text(size: 12pt, weight: 600, t.care.local.head) \ #text(size: 9.5pt, t.care.local.body)])))
  pagebreak()

  // ───────────────────────────── 11 Working together
  head("11", t.together)
  centered(fig("pegboard"))
  v(1fr)
  let col(i, c) = block(breakable: false, {
    text(size: 13pt, weight: 600, c.head)
    v(2pt)
    hair
    v(6pt)
    if i == 2 { marked(false, c.items, size: 9.5pt) }
    else if i == 1 { marked(true, c.items, size: 9.5pt) }
    else {
      stack(spacing: 0.7em, ..c.items.enumerate().map(((j, it)) => grid(columns: (18pt, 1fr), column-gutter: 4pt,
        text(size: 11pt, weight: 700, str(j + 1)), text(size: 9.5pt, it))))
    }
  })
  grid(columns: (1fr,) * 3, column-gutter: 0.28in, ..t.together.cols.enumerate().map(((i, c)) => col(i, c)))
  pagebreak()

  // ───────────────────────────── 12 Assembly complete
  kicker("12", t.contact.kicker)
  title(t.contact.title)
  v(1fr)
  centered(box({
    fig("end")
    place(top + right, mark(true, size: 34pt))
  }))
  v(1fr)
  block(width: 100%, stroke: heavy + ink, radius: 6pt, inset: 14pt, grid(
    columns: (1fr, 2.9in), column-gutter: 0.35in,
    [
      #text(size: 9pt, weight: 600, fill: muted, upper(t.contact.next.head)) \
      #v(2pt)
      #text(size: 13pt, weight: 500, t.contact.next.body) \
      #v(4pt)
      #text(size: 13pt, weight: 600, link(data.contact.at(0).at(1), data.contact.at(0).at(2)))
    ],
    {
      set text(size: 9.5pt)
      [#text(weight: 600, data.name) \ #text(fill: muted)[#t.role \ #t.contact.place]]
      v(4pt)
      grid(
        columns: (0.8in, 1fr),
        row-gutter: 0.55em,
        ..data.contact.slice(1).map(((key, url, shown)) => (text(fill: muted, t.contact.labels.at(key)), link(url, shown))).flatten(),
      )
    },
  ))
  v(12pt)
  text(size: 8pt, fill: muted, t.contact.colophon)
}
