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
const CHROME = '/Applications/Helium.app/Contents/MacOS/Helium';

const COMPACT = `
<!-- compact-pdf -->
<style>
@media print {
  html { font-size: 13.5px !important; }
  body { margin: 0 !important; }
  .giMQbT { padding: 0.6rem 1.1rem !important; }
  section { margin-bottom: 0.9rem !important; }
  section h2 { margin: 0.6rem 0 0.45rem !important; }
  h3 { margin-bottom: 0.28rem !important; }
  h1 { margin: 0 0 0.3rem !important; }
  p, li, .fTincj p { line-height: 1.45 !important; }
  p { margin-bottom: 0.4rem !important; }
  ul { margin: 0.28rem 0 0.35rem !important; }
  ul li { margin-bottom: 0.33rem !important; }
  .cnHqJU, .efSfgH { margin-bottom: 0.45rem !important; }
  .bmVKTB, .dHcPVB, .fTincj { margin-bottom: 0.5rem !important; }
  .glluoo { margin-bottom: 0.65rem !important; }
  .dhDiS { margin-bottom: 0.65rem !important; }
  /* keep compact records (education / publication / award / volunteer) intact across page breaks */
  .bErXTV, .jLmiUo, .jDCLAc, .cDGVRk { break-inside: avoid !important; page-break-inside: avoid !important; }
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
