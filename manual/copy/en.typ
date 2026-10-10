// English copy. copy/zh.typ must have exactly the same keys and list lengths; the
// build fails if they drift (see `drift` in layout.typ).
#import "../data.typ": hub, hairline

#let t = (
  lang: "en",
  region: "us",
  doc: (
    title: "DAVID — User Manual",
    description: "An illustrated guide to David Weng's work, skills, and projects, drawn as a workstation cabinet in five modules. A portfolio supplement to his résumé.",
    keywords: ("David Weng", "portfolio", "product engineer", "creative technologist", "user manual"),
  ),
  footer: [DAVID — User Manual],
  role: [Product Engineer & Creative Technologist],
  labels: (website: "Website", source: "Source", uses: "Modules used", seen: "Seen in"),

  // D1 to D5, in order: the part, then the skill it stands for.
  modules: (
    ([Frame], [Systems thinking]),
    ([Spirit level], [Product thinking]),
    ([Hex key], [Software engineering]),
    ([Drawer], [UX and visual design]),
    ([Pegboard], [Open tooling]),
  ),

  cover: (
    subtitle: [User Manual],
    tagline: [A workstation for building software. Five modules, assembled.],
    edition: [Edition 1 \ October 2026],
  ),

  parts: (
    kicker: "Package contents",
    title: [What's in the box],
    lede: [Five modules. Each one comes back on the pages that follow, where a project uses it.],
    items: (
      ([Holds everything square. Find the source of truth and build the rest around it.], [tg-drive treats the Telegram channel as the truth and its database as a cache.]),
      ([Shows what is off before anything changes, and what the product should not do.], [ADP Shifts writes to one calendar it creates and nothing else.]),
      ([Fits the fastener in front of it: the stack that suits the platform.], [Swift for Sukiru, Rust and Tauri for OpenKara, Go and Wails for tg-drive.]),
      ([Opens the way you expect and shows what is inside.], [Sukiru uses system controls only and reports library health in plain language.]),
      ([Hangs tools where a person or an AI agent can reach them, with guards.], [canvas-cli answers in `--json` and takes `--dry-run` and `--confirm`.]),
    ),
  ),

  steps: (
    kicker: "Assembly instructions",
    title: [How I work],
    lede: [Four steps, in order. The same cabinet at each step.],
    items: (
      ([Find the friction], [Set the level down first. Measure what is off before you change anything.], [A shift schedule that lives only inside ADP.]),
      ([Make the system clear], [Square the frame. Name the parts and who owns each one before writing code.], [Sukiru works out which installer owns each skill.]),
      ([Build the right thing], [Use the key that fits the bolt: the tools that suit the platform and the person.], [Swift and AppKit for a Mac app. Go for single binaries.]),
      ([Test, learn, refine], [Pull the drawer and push it back. Check the result and plan how to reverse a change.], [A snapshot before every Sukiru batch. `--confirm` on tg-drive mutations.]),
    ),
  ),

  sukiru: (
    kicker: "Project · Sukiru",
    title: [Make complexity manageable],
    lede: [Coding agents load skills from shared folders. Two official installers, `npx skills` and `gh skill`, write there and keep separate records. Neither reads the other's.],
    before: (head: [Before], items: (
      [Lock records that point at nothing.],
      [Links that break when a folder moves.],
      [Copies of one skill that drift apart.],
      [Skills that both installers claim.],
    )),
    after: (head: [After], items: (
      [One health report, in plain language.],
      [Each fix goes to the installer that owns the skill.],
      [All fixes applied as one confirmed batch.],
      [No ledger of its own to drift.],
    )),
    check: (head: [Final check], body: [Sukiru takes a snapshot before every batch, so the batch can be rolled back. A CLI with `--dry-run` shows the same fixes before any are made.]),
    built: [A native macOS app in Swift, SwiftUI, and AppKit, using system controls only.],
  ),

  openkara: (
    kicker: "Project · OpenKara",
    title: [Own your music. \ Build your stage.],
    lede: [OpenKara turns songs you already own into karaoke, on your own computer.],
    flow: (
      ([Song], [Any track in your library.]),
      ([2 stems], [Vocals and accompaniment.]),
      ([4 stems], [Vocals, drums, bass, other.]),
      ([Mix], [Turn the vocals down and sing.]),
    ),
    alternative: [or],
    local: (
      yes: [Separation runs on the device with Demucs, an open-source AI model.],
      no: [No upload, no account, no subscription.],
    ),
    facts: (
      ([Platforms], [macOS, Windows, and Linux, built with Tauri and Rust.]),
      ([Lyrics], [Synced from online sources, embedded tags, `.lrc` files, or CD+G.]),
      ([Library], [Portable. It works from a NAS or a USB drive.]),
    ),
  ),

  tgdrive: (
    kicker: "Project · tg-drive",
    title: [One engine, two interfaces],
    lede: [A Telegram channel holds large files but reads as a timeline. tg-drive gives it a file tree you can browse from the desktop or the terminal.],
    callouts: (
      channel: [*Source of truth.* The messages in the Telegram channel.],
      engine: [*One engine* behind both front ends.],
      cache: [*Cache.* A local SQLite index. It can be lost.],
      cli: [`td` in the terminal.],
      gui: [`td-gui`, a desktop app built with Wails.],
    ),
    rebuild: (
      head: [If the cache is lost],
      steps: (
        [Everything works from the index.],
        [The database is gone. The files are not.],
        [`td scan --full` reads the channel and rebuilds it.],
      ),
    ),
    guards: [Destructive commands need `--confirm`. Operation locks stop two runs from colliding. Every command can answer in stable JSON.],
  ),

  adp: (
    kicker: "Project · ADP Shifts",
    title: [Make a routine disappear],
    lede: [Where a workplace uses ADP Workforce Now, the schedule lives inside ADP. ADP Shifts copies it into your own calendar and keeps it current.],
    howto: (
      [Add ADP Shifts from the Chrome Web Store.],
      [Open Calendar in ADP once.],
      [Connect Google.],
      [Your shifts appear in a calendar named ADP Shifts.],
    ),
    yes: (
      [Reuses the ADP session already in your browser.],
      [Writes only to the one calendar it creates, with Google's narrowest calendar scope.],
      [Checks for changes daily and whenever Workforce Now is open. Canceled shifts are removed on the next sync.],
    ),
    no: (
      [Never asks for your ADP password.],
      [Cannot read or change any other calendar.],
      [No servers and no analytics.],
    ),
    others: [No Google account? An `.ics` export and a userscript cover everyone else.],
  ),

  catalogue: (
    kicker: "Product catalogue",
    title: [Compatible products],
    lede: [Everything on my software hub as of October 2026. Fifteen products, all open source.],
    kicker2: "Product catalogue, continued",
    title2: [Desktop apps],
    lede2: [Seven apps, each built for its platform.],
    docs: "docs",
    more: [The full, current list: #link(hub)[thedavidweng.github.io/site]],
    groups: (
      cli: (head: [Command-line tools], items: (
        [Courses, assignments, submissions, and grading for Canvas LMS.],
        [Research records and file uploads for Zenodo.],
        [Accounts, transactions, budgets, and cash flow from Monarch Money.],
        [Photo backup, uploads, albums, and Piwigo import for Flickr.],
        [Surveys, response exports, and an offline survey compiler for Qualtrics.],
        [Local-first finance backend with encrypted SQLite and stable JSON.],
      )),
      plugin: (head: [Plugin], items: (
        [A Steam Deck as a Bluetooth game controller for a PC, phone, or tablet.],
      )),
      ext: (head: [Browser extension], items: (
        [Keeps an ADP Workforce Now schedule in a Google Calendar of its own.],
      )),
      app: (head: [Desktop apps], items: (
        [Karaoke from your own music, with on-device stem separation.],
        [Checks and repairs coding agents' skill libraries on macOS.],
        [Native macOS speech synthesis with timed text. Fully local.],
        [Dump, flash, and recover MT1959 Blu-ray drive firmware.],
        [A recoverable file tree on a Telegram channel, with the `td` CLI.],
        [Organizes a Steam library into playlists, with recommendations and cleanup.],
        [Generates music on a Mac with ACE-Step. Prompts, lyrics, and audio stay on the device. Alpha.],
      )),
    ),
  ),

  care: (
    kicker: "Care and handling",
    title: [Do this, not that],
    lede: [Three habits that keep the cabinet square, each one checked against a shipped project.],
    items: (
      ([Use the tool that owns the job], [Forcing a fix from outside.], [Fixing through the owner.], [Sukiru repairs each skill through the installer that owns it, and uses the Mac's own controls.]),
      ([Preview before you change], [Drilling first, measuring after.], [Marking first, then drilling on the marks.], [canvas-cli and qualtrics-cli take `--dry-run` and `--confirm`. SDF Flash GUI asks for a typed confirmation before it writes firmware.]),
      ([Design the way back], [A glued joint. Nothing comes apart.], [A bolted joint. It comes apart cleanly.], [Sukiru snapshots each batch. tg-drive rebuilds its index from the channel. Vapourfly backs up before it writes Steam files.]),
    ),
    local: (head: [Stay local when you can], body: [OpenKara separates stems on the device. Apple Say and OpenLoop run entirely on the Mac. money keeps its data in encrypted SQLite.]),
  ),

  together: (
    kicker: "Working together",
    title: [Before you call support],
    lede: [How to bring a problem, what comes back, and the mistakes that cost the most time.],
    cols: (
      (head: [Bring], items: (
        [The moment that wastes time, described plainly, and who it happens to.],
        [Where the source of truth lives today.],
        [What must not change: platform, data, budget, deadline.],
        [One real example: a file, a screenshot, a log.],
      )),
      (head: [Expect back], items: (
        [A short written plan that names the parts and who owns each, before any code.],
        [Something to try early: a prototype, a dry run, or a CLI.],
        [Changes you can preview and undo.],
        [Plain notes on trade-offs, including what I chose not to build.],
      )),
      (head: [Avoid], items: (
        [Starting from a feature list instead of the friction.],
        [Two systems that both think they own the data.],
        [Changes with no preview and no way back.],
        [Asking for everything in the first version.],
      )),
    ),
  ),

  contact: (
    kicker: "Assembly complete",
    title: [Ready for use.],
    next: (head: [Next step], body: [Send me the friction: one moment that wastes someone's time. I will reply with what I would build first, and what I would leave out.]),
    place: [Vancouver, British Columbia],
    labels: (email: "Email", website: "Website", software: "Software", github: "GitHub", linkedin: "LinkedIn", resume: "Résumé"),
    colophon: [*Colophon.* Edition 1, October 2026. Set in Mona Sans (SIL Open Font License 1.1). Illustrations drawn with #link(hairline)[Hairline] by Lucas Marques (MIT License) and exported as vector art. Typeset with Typst. Project facts were checked against each project's public repository and website in October 2026. This is an independent publication by David Weng. It is not affiliated with, sponsored by, or endorsed by IKEA.],
  ),
)
