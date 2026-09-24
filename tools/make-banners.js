// make-banners.js
// Renders tools/banners.html into banners/*.png for the IFC thread.
//
// Run:  node tools/make-banners.js            (every banner)
//       node tools/make-banners.js ranks      (just one)
// Needs: playwright-core (or playwright), and a Chromium at
//        $PLAYWRIGHT_CHROMIUM (or the pre-installed /opt/pw-browsers/chromium).
//        Fonts come from Google Fonts, so it needs network.
let chromium;
try { ({ chromium } = require('playwright-core')); } catch { ({ chromium } = require('playwright')); }
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'banners');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});

(async () => {
    await new Promise((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}/tools/banners.html`;
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
    // 2x so the banners stay sharp on retina screens; Discourse scales them down.
    const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1600, height: 560 } });
    fs.mkdirSync(OUT, { recursive: true });

    await page.goto(base);
    const all = await page.evaluate(() => window.AMV_BANNERS);
    const only = process.argv.slice(2);
    for (const id of only.length ? only : all) {
        await page.goto(`${base}?b=${id}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const el = await page.$('.bn-banner');
        const file = path.join(OUT, `${id}.png`);
        await el.screenshot({ path: file });
        console.log('wrote', path.relative(ROOT, file));
    }
    await browser.close();
    server.close();
})().catch((e) => { console.error(e); process.exit(1); });
