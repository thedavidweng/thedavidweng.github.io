// Compact + export a rendered resume HTML to PDF.
// Usage: node render-pdf.mjs <input.html> <output.pdf>
// Example: node render-pdf.mjs out.html David_Weng_Resume.pdf
// Injects compact print CSS so the resume holds within 2 pages.
import { readFileSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const [HTML_ARG, OUT_ARG] = process.argv.slice(2);
if (!HTML_ARG || !OUT_ARG) {
  console.error('Usage: node render-pdf.mjs <input.html> <output.pdf>');
  process.exit(1);
}

const HTML = new URL('./' + HTML_ARG, import.meta.url).pathname;
const OUT = new URL('../' + OUT_ARG, import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH || '/Applications/Helium.app/Contents/MacOS/Helium';

const COMPACT = `
<!-- compact-pdf -->
<style>
/*
 * Compact print CSS, re-tuned for @jsonresume/jsonresume-theme-consultant-polished 1.0.3.
 * Uses only structural selectors (no styled-components hashed classes), so it survives
 * future theme upgrades. Goal: a trimmed tailored resume holds within 2 Letter pages.
 */
@media print {
  html { font-size: 13px !important; }
  body { margin: 0 !important; }
  /* outer page container: first div under body */
  body > div { padding: 0.5rem 1rem !important; }
  header { margin-bottom: 0.4rem !important; }
  h1 { font-size: 1.55rem !important; margin: 0 0 0.25rem !important; }
  header p { margin: 0 0 0.25rem !important; }
  header > div { margin-bottom: 0.4rem !important; }
  section { margin-bottom: 0.65rem !important; }
  section > h2 { font-size: 1.02rem !important; margin: 0.45rem 0 0.3rem !important; padding-bottom: 0.12rem !important; }
  /* each record block: work / volunteer / education / project entries, skill groups */
  section > div { margin-bottom: 0.5rem !important; break-inside: avoid !important; page-break-inside: avoid !important; }
  h3 { font-size: 0.92rem !important; margin: 0 0 0.18rem !important; }
  p, li { font-size: 0.82rem !important; line-height: 1.38 !important; }
  p { margin: 0 0 0.28rem !important; }
  ul { margin: 0.18rem 0 0.28rem !important; padding-left: 1.05rem !important; }
  ul li { margin-bottom: 0.2rem !important; }
}
</style>`;

let html = readFileSync(HTML, 'utf-8');
if (!html.includes('<!-- compact-pdf -->')) {
  html = html.replace('</head>', COMPACT + '</head>');
}
writeFileSync(HTML, html, 'utf-8');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.goto('file://' + HTML, { waitUntil: 'networkidle0' });
await page.pdf({
  path: OUT,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
});
await browser.close();
console.log('PDF_DONE');
