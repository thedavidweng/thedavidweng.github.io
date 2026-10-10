# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools>=4.50"]
# ///
"""Build both editions of the user manual.

    uv run manual/build.py           subset the Chinese font, compile en + zh, check them
    uv run manual/build.py --check   verify only: no download, no subsetting, no writes

Noto Sans SC is far too large to commit whole, so manual/fonts/ holds a subset with
only the characters the Chinese copy uses. The full fonts are downloaded once into
manual/.cache/ (gitignored). Rerun this script after any change to copy/zh.typ, or
new characters print as empty boxes; --check catches that.
"""

import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
FONTS = HERE / "fonts"
CACHE = HERE / ".cache" / "noto-sans-sc"
NOTO_URL = "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-{}.otf"
WEIGHTS = ["Regular", "Medium", "Bold"]
# Typst source the Chinese edition draws its text from.
SOURCES = [HERE / "copy" / "zh.typ", HERE / "layout.typ", HERE / "data.typ"]
# Punctuation that Typst's CJK rules or a quick copy edit may introduce.
EXTRA = "，。、；：？！“”‘’（）《》〈〉【】「」『』—…·～　"
EDITIONS = {"en": "David_Weng_User_Manual.pdf", "zh": "David_Weng_User_Manual_zh.pdf"}
# Cover images for manual.html, rendered from page 1 of each edition.
PREVIEWS = {"en": "preview.svg", "zh": "preview-zh.svg"}
PAGES = 12


def needed_chars() -> set[str]:
    text = "".join(p.read_text(encoding="utf-8") for p in SOURCES) + EXTRA
    return {c for c in text if ord(c) > 0x7E} | {chr(c) for c in range(0x20, 0x7F)}


def cmap(path: Path) -> set[str]:
    return {chr(c) for c in TTFont(path).getBestCmap()}


def fetch(weight: str) -> Path:
    path = CACHE / f"NotoSansSC-{weight}.otf"
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        print(f"downloading NotoSansSC-{weight}.otf")
        urllib.request.urlretrieve(NOTO_URL.format(weight), path)
    return path


def make_subsets(chars: set[str]) -> None:
    for w in WEIGHTS:
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        font = subset.load_font(str(fetch(w)), options)
        sub = subset.Subsetter(options)
        sub.populate(text="".join(sorted(chars)))
        sub.subset(font)
        subset.save_font(font, str(FONTS / f"NotoSansSC-{w}.otf"), options)
        font.close()


def check_coverage(chars: set[str]) -> list[str]:
    covered = set.intersection(*(cmap(FONTS / f"NotoSansSC-{w}.otf") for w in WEIGHTS))
    covered |= cmap(FONTS / "MonaSans-Regular.ttf")
    return sorted(c for c in chars if c not in covered and not c.isspace())


def page_count(pdf: Path) -> int:
    out = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True, check=True).stdout
    return next(int(l.split()[-1]) for l in out.splitlines() if l.startswith("Pages:"))


def compile_edition(lang: str, out: Path) -> None:
    cmd = ["typst", "compile", "--root", str(ROOT), "--font-path", str(FONTS), "--ignore-system-fonts",
           "--input", f"lang={lang}", str(HERE / "manual.typ"), str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or "warning" in r.stderr:
        sys.exit(f"typst failed for {lang}:\n{r.stderr}")


def main() -> None:
    check_only = "--check" in sys.argv[1:]
    chars = needed_chars()
    if not check_only:
        make_subsets(chars)
    missing = check_coverage(chars)
    if missing:
        sys.exit("characters missing from manual/fonts (run uv run manual/build.py): " + "".join(missing))
    for lang, name in EDITIONS.items():
        out = Path(tempfile.gettempdir()) / name if check_only else HERE / name
        compile_edition(lang, out)
        n = page_count(out)
        if n != PAGES:
            sys.exit(f"{name} has {n} pages, expected {PAGES}")
        print(f"{'checked' if check_only else 'wrote'} {name} ({n} pages)")
        if not check_only:
            preview = HERE / PREVIEWS[lang]
            subprocess.run(["pdftocairo", "-svg", "-f", "1", "-l", "1", str(out), str(preview)], check=True)
            print(f"wrote {preview.name}")


if __name__ == "__main__":
    main()
