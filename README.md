# thedavidweng.github.io

Personal homepage — [thedavidweng.github.io](https://thedavidweng.github.io/)

Portfolio: [davidweng.eu.org](https://davidweng.eu.org/) · Blog: [blog.blahaj.uk](https://blog.blahaj.uk/)

## Stack

One HTML file. No framework, no build step, no dependencies, no trackers.

- Modern CSS: `light-dark()` tokens with a persisted light/dark toggle, `:has()`, `text-wrap`, `color-mix()`
- System fonts only; the only network calls are GitHub avatars and the public GitHub API
- Live GitHub data (stars, last push, repo / star / merged-PR totals), cached in `sessionStorage`, with static fallbacks baked into the markup
- Canvas "stem separation" hero visual (pauses off-screen, respects `prefers-reduced-motion`)
- `⌘K` / `Ctrl K` / `/` command palette built on the native `<dialog>`
- View Transitions API for the theme switch, IntersectionObserver for reveals
- Works without JavaScript; everything above is progressive enhancement

## Structure

```
.
├── index.html    # homepage — all markup, styles, and scripts in one file
├── resume.html   # rendered resume (built from resume/resume.json)
├── resume/       # JSON Resume source + render tooling
├── DESIGN.md     # design system reference
└── .nojekyll     # skip Jekyll processing on GitHub Pages
```

## License

MIT
