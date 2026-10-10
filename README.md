# thedavidweng.github.io

Personal homepage: [thedavidweng.github.io](https://thedavidweng.github.io/)

Portfolio: [davidweng.eu.org](https://davidweng.eu.org/). Blog: [blog.blahaj.uk](https://blog.blahaj.uk/).

## Stack

Static HTML and CSS with no build step.

- One typeface, [Mona Sans](https://github.com/github/mona-sans), self hosted (Latin subset, variable weight)
- Light and dark themes follow the OS through `light-dark()`
- `assets/main.js` updates star counts and the merged pull request count from the public GitHub API; the HTML holds static fallbacks, so the page works without JavaScript

## Structure

```
.
├── index.html          # homepage content
├── assets/
│   ├── style.css       # all styles
│   ├── main.js         # live GitHub numbers
│   └── fonts/          # Mona Sans (SIL Open Font License, see OFL.txt)
├── resume.html         # rendered resume (built from resume/resume.json)
├── resume/             # JSON Resume source and render tooling
├── manual.html         # landing page for the user manual PDF
├── manual/             # user manual: Typst source, fonts, figures, built PDF
├── DESIGN.md           # design system reference
└── .nojekyll           # skip Jekyll processing on GitHub Pages
```

## User manual

A 12 page US Letter booklet in two editions, English (`manual/David_Weng_User_Manual.pdf`) and Simplified Chinese (`manual/David_Weng_User_Manual_zh.pdf`). DAVID is a workstation cabinet built from five recurring modules: the cover, parts list, assembly steps, project diagrams, and completed cabinet form one story. The product catalogue spans two pages. Both PDFs are served directly by GitHub Pages.

The two editions share one layout and differ only in wording:

```
manual/
├── layout.typ      # page structure for every edition
├── kit.typ         # part labels, arrows, step numbers, wrong/right panels
├── data.typ        # names, links, counts (never translated)
├── copy/en.typ     # English wording
├── copy/zh.typ     # Chinese wording, same keys as en.typ
├── manual.typ      # entry point; picks an edition with --input lang=en|zh
├── build.py        # builds both editions
└── figures/        # Hairline figures and their SVG exports
```

To keep them in sync, change wording in both `copy/en.typ` and `copy/zh.typ` together. Change layout or facts once, in `layout.typ` or `data.typ`. If the two copy files ever differ in shape (a missing key, an extra key, or a list of a different length), the build stops and names the path.

To rebuild:

1. Figures live in `manual/figures/*.js` as [Hairline](https://github.com/lucasmarkes/hairline) figures. After editing a figure, rebuild its self-contained HTML with the hairline-create skill's `build.mjs` or `look.mjs`. Run `node manual/figures/export.mjs` to render the built pages to static SVG in `manual/figures/svg/` (needs `playwright-core` with Chromium; set `PLAYWRIGHT_CORE` to its path). Pass figure names to export only some. The JSON files beside the SVGs hold placement sizes and part bounds for labels. Print strokes are set by role at the placed size; icons are limited by both width and height.
2. Run `uv run manual/build.py` (needs `typst` and poppler). It subsets Noto Sans SC to the characters the Chinese copy uses, compiles both editions, checks that each has 12 pages, and redraws the cover previews for `manual.html`. The first run downloads the full Noto fonts into `manual/.cache/` (gitignored).
3. `uv run manual/build.py --check` verifies without writing anything. It fails if the Chinese copy uses a character the committed font subset lacks.

## License

MIT for the code. Mona Sans and Noto Sans SC are licensed under the SIL Open Font License 1.1 (see `manual/fonts/OFL.txt` and `manual/fonts/OFL-NotoSansSC.txt`). Hairline is MIT licensed by Lucas Marques (see `manual/figures/LICENSE-hairline.txt`).
