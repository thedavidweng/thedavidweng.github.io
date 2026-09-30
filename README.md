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
├── DESIGN.md           # design system reference
└── .nojekyll           # skip Jekyll processing on GitHub Pages
```

## License

MIT for the code. Mona Sans is licensed under the SIL Open Font License 1.1.
