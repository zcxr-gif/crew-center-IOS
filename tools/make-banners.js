// make-banners.js
// Renders tools/banners.html into banners/*.webp for the IFC thread, and makes
// rounded copies of the fleet photos from data.js into banners/fleet/*.webp.
// Everything is rounded with transparent corners, because the forum cannot
// round an image itself.
//
// Run:  node tools/make-banners.js            (every banner, and the fleet)
//       node tools/make-banners.js ranks      (just one)
// Needs: playwright-core (or playwright), and a Chromium at
//        $PLAYWRIGHT_CHROMIUM (or the pre-installed /opt/pw-browsers/chromium).
//        Fonts come from Google Fonts, so it needs network.
let chromium;
try { ({ chromium } = require('playwright-core')); } catch { ({ chromium } = require('playwright')); }
const http = require('http');
const { execFileSync } = require('child_process');
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

// Draws an image into a canvas, optionally scaled to `maxW` and clipped to
// rounded corners of radius `r`, and returns it as WebP bytes.
async function toWebp(page, dataUrl, maxW, r = 0) {
    const b64 = await page.evaluate(async ({ dataUrl, maxW, r }) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const k = maxW && img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        if (r) { g.beginPath(); g.roundRect(0, 0, w, h, r); g.clip(); }
        g.drawImage(img, 0, 0, w, h);
        return c.toDataURL('image/webp', .9).split(',')[1];
    }, { dataUrl, maxW, r });
    return Buffer.from(b64, 'base64');
}

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
    for (const id of (only.length ? only : all).filter((x) => x !== 'fleet-photos')) {
        await page.goto(`${base}?b=${id}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const el = await page.$('.bn-banner');
        const file = path.join(OUT, `${id}.webp`);
        const png = await el.screenshot({ omitBackground: true });
        fs.writeFileSync(file, await toWebp(page, 'data:image/png;base64,' + png.toString('base64'), 0));
        console.log('wrote', path.relative(ROOT, file));
    }

    // Fleet photos: fetched with curl (it honours the proxy; the browser's
    // canvas would refuse a cross-origin image anyway), rounded, re-encoded.
    if (!only.length || only.includes('fleet-photos')) {
        const fleet = await page.evaluate(() => window.AMV_DATA.fleet.map((f) => ({ short: f.short, src: f.photo && f.photo.src })));
        fs.mkdirSync(path.join(OUT, 'fleet'), { recursive: true });
        for (const f of fleet.filter((x) => x.src)) {
            const img = execFileSync('curl', ['-sSfL', f.src]);
            const file = path.join(OUT, 'fleet', `${f.short.toLowerCase()}.webp`);
            fs.writeFileSync(file, await toWebp(page, 'data:image/webp;base64,' + img.toString('base64'), 1600, 36));
            console.log('wrote', path.relative(ROOT, file));
        }
    }
    await browser.close();
    server.close();
})().catch((e) => { console.error(e); process.exit(1); });
