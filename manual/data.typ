// Facts shared by every language: names, links, and counts. Only wording lives in copy/.

#let name = "David (Jiachen) Weng"
#let hub = "https://thedavidweng.github.io/site/"
#let hairline = "https://github.com/lucasmarkes/hairline"

#let projects = (
  sukiru: (web: "https://sukiru.blahaj.uk/", src: "https://github.com/thedavidweng/sukiru"),
  openkara: (web: "https://openkara.blahaj.uk/", src: "https://github.com/thedavidweng/OpenKara"),
  tgdrive: (web: "https://tg-drive.blahaj.uk/", src: "https://github.com/thedavidweng/tg-drive"),
  adp: (web: "https://adp-shifts.blahaj.uk/", src: "https://github.com/thedavidweng/adp-calendar"),
)

// The five modules, D1 to D5. Their names are in each copy's `modules`.
#let modules = ("D1", "D2", "D3", "D4", "D5")
// The module each assembly step adds, and the modules each project page uses.
#let step-modules = ("D2", "D1", "D3", "D4")
#let uses = (
  sukiru: ("D1", "D2", "D4"),
  openkara: ("D3", "D4"),
  tgdrive: ("D1", "D5"),
  adp: ("D2", "D5"),
)

#let cover-callouts = (
  (part: "d1", at: (0, 0.75), to: (-0.2in, 0.1in), side: left, width: 1.4in),
  (part: "d2", at: (1, 0.3), to: (1in, -0.4in), width: 1.6in),
  (part: "d3", at: (1, 0.6), to: (0.2in, 0.25in), width: 1.5in),
  (part: "d4", at: (0.5, 1), to: (0.7in, 0.5in), width: 1.5in),
  (part: "d5", at: (0, 0.1), to: (-0.2in, 0pt), side: left, width: 1.5in),
)
#let parts-callouts = modules.enumerate().map(((i, id)) => (
  part: lower(id), at: (0, 0.5), to: (-0.1in, 0pt), side: left, width: 0.5in,
))
#let tg-callouts = (
  (part: "channel", at: (0, 0.4), to: (-0.12in, -0.15in), side: left, width: 1.1in),
  (part: "engine", at: (0.5, 0), to: (0.1in, -0.8in), width: 1.5in),
  (part: "cache", at: (0.5, 1), to: (-0.1in, 0.35in), side: left, width: 1.6in),
  (part: "cli", at: (1, 0.2), to: (0.15in, -0.15in), width: 1.1in),
  (part: "gui", at: (1, 0.75), to: (0.15in, 0.2in), width: 1.1in),
)

// Catalogue entries in print order: (name, url, shown, thumbnail). A shown of none
// prints the copy's word for "docs". Article numbers are the group's prefix and the
// entry's place in it.
#let prefix = (cli: "CLI", plugin: "PLG", ext: "EXT", app: "APP")
#let catalogue = (
  cli: (
    ("canvas-cli", hub + "canvas-cli/", none, "canvas"),
    ("zenodo-cli", hub + "zenodo-cli/", none, "zenodo"),
    ("monarchmoney-cli", hub + "monarchmoney-cli/", none, "monarch"),
    ("flickr-cli", hub + "flickr-cli/", none, "flickr"),
    ("qualtrics-cli", hub + "qualtrics-cli/", none, "qualtrics"),
    ("money", hub + "money/", none, "money"),
  ),
  plugin: (
    ("DeckPad", "https://deckpad.blahaj.uk/", "deckpad.blahaj.uk", "deckpad"),
  ),
  ext: (
    ("ADP Shifts", "https://adp-shifts.blahaj.uk/", "adp-shifts.blahaj.uk", "adp"),
  ),
  app: (
    ("OpenKara", "https://openkara.blahaj.uk/", "openkara.blahaj.uk", "openkara"),
    ("Sukiru", "https://sukiru.blahaj.uk/", "sukiru.blahaj.uk", "sukiru"),
    ("Apple Say", "https://apple-say.blahaj.uk/", "apple-say.blahaj.uk", "applesay"),
    ("SDF Flash GUI", "https://sdf-flash-gui.blahaj.uk/", "sdf-flash-gui.blahaj.uk", "sdfflash"),
    ("tg-drive", "https://tg-drive.blahaj.uk/", "tg-drive.blahaj.uk", "tgdrive"),
    ("Vapourfly", "https://vapourfly.blahaj.uk/", "vapourfly.blahaj.uk", "vapourfly"),
    ("OpenLoop", "https://openloop.blahaj.uk/", "openloop.blahaj.uk", "openloop"),
  ),
)

// Contact rows in print order: (key in copy's contact.labels, url, shown).
#let contact = (
  ("email", "mailto:thedavidweng@gmail.com", "thedavidweng@gmail.com"),
  ("website", "https://thedavidweng.github.io/", "thedavidweng.github.io"),
  ("software", hub, "thedavidweng.github.io/site"),
  ("github", "https://github.com/thedavidweng", "github.com/thedavidweng"),
  ("linkedin", "https://linkedin.com/in/thedavidweng", "linkedin.com/in/thedavidweng"),
  ("resume", "https://thedavidweng.github.io/resume.html", "thedavidweng.github.io/resume.html"),
)
