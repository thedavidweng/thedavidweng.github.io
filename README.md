# thedavidweng.github.io

Personal homepage: [thedavidweng.github.io](https://thedavidweng.github.io/)

Portfolio: [davidweng.eu.org](https://davidweng.eu.org/). Blog: [blog.blahaj.uk](https://blog.blahaj.uk/).

## Stack

Static HTML, CSS, and one JavaScript module, with no dependencies and no build step.

- One typeface, [Mona Sans](https://github.com/github/mona-sans), self hosted (Latin subset, variable weight)
- Light and dark themes through `light-dark()`, following the OS until you pick one with the toggle
- Reveals and the header border are scroll driven animations in CSS
- `assets/main.js` runs the theme toggle, the command palette (Cmd K, Ctrl K, or /), the stem separation canvas, the card spotlight, and live numbers from the public GitHub API
- The HTML holds static fallbacks, so the page works without JavaScript

## Structure

```
.
├── index.html          # homepage content
├── assets/
│   ├── style.css       # all styles
│   ├── main.js         # interactions and live GitHub data
│   ├── icons.svg       # icon sprite
│   └── fonts/          # Mona Sans (SIL Open Font License, see OFL.txt)
├── resume.html         # rendered resume (built from resume/resume.json)
├── resume/             # JSON Resume source and render tooling
├── DESIGN.md           # design system reference
└── .nojekyll           # skip Jekyll processing on GitHub Pages
```

## License

MIT for the code. Mona Sans is licensed under the SIL Open Font License 1.1.
