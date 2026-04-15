# thedavidweng.github.io

Personal homepage. Single HTML file, no build tools.

[davidweng.eu](https://davidweng.eu/) · [thedavidweng.github.io](https://thedavidweng.github.io/)

## Quick Start

```bash
# edit
open index.html

# preview locally
python3 -m http.server 8080

# deploy (push to main, GitHub Pages handles the rest)
git push
```

## Stack

Zero dependencies. Pure HTML + CSS + JavaScript (~17KB).

- GitHub API for live star counts
- IntersectionObserver for scroll animations
- System fonts only (no external requests)

## Structure

```
.
├── index.html    # site — all markup, styles, and scripts in one file
├── .nojekyll     # skip Jekyll processing on GitHub Pages
└── README.md     # you are here
```

## License

MIT
