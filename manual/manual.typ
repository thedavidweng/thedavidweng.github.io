// DAVID — User Manual, in English and Simplified Chinese.
// Build both editions with `uv run manual/build.py`. One edition by hand, from the repo root:
//   typst compile --root . --font-path manual/fonts --ignore-system-fonts manual/manual.typ manual/David_Weng_User_Manual.pdf
//   typst compile --root . --font-path manual/fonts --ignore-system-fonts --input lang=zh manual/manual.typ manual/David_Weng_User_Manual_zh.pdf
#import "layout.typ": manual
#import "copy/en.typ" as en
#import "copy/zh.typ" as zh

#let editions = (en: en.t, zh: zh.t)
#let lang = sys.inputs.at("lang", default: "en")
#assert(lang in editions, message: "unknown lang " + lang + "; expected one of " + editions.keys().join(", "))
#manual(editions.at(lang))
