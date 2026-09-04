// test-network-sync.js
// The network, the crew centre, and the gap between them.
//
// The airline's sectors are added in the crew centre. This site used to state
// its own copy of them — twenty-three, typed into data.js and again into a
// headline — so every route staff opened made the website a little more wrong,
// and it was always the website that was wrong.
//
// What is worth checking is the whole loop, because each half fails silently:
//
//   * with the backend unreachable the page still carries a full network
//     (this site's rule: correct before the fetch, never a section that only
//     exists once one resolves);
//   * the crew centre's routes replace it — the list, the tier filters, the
//     per-base sector counts and the "N destinations" band all move together,
//     rather than the list changing under a heading that still says 23;
//   * a destination the crew centre has and this repo has never heard of still
//     lands on the map, because the coordinates come from the crew centre too.
//     Without that feed it is quietly left off, which is the failure this
//     checks by taking the feed away;
//   * a codeshare is labelled as the partner's rather than printed as ours;
//   * the home page moves with it, instead of quoting a different size of the
//     same airline one click away.
//
// Run:  node tools/test-network-sync.js
// Needs: playwright-core, and a Chromium at $PLAYWRIGHT_CHROMIUM (or the
//        pre-installed /opt/pw-browsers/chromium).
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (!path.extname(p)) p += '.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(''); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});

// A network deliberately unlike the one in data.js: four sectors, one of them
// switched off, one a codeshare, and one to Barcelona — an airport this repo
// has never heard of and cannot place without the crew centre's help.
const LIVE_ROUTES = {
    routes: [
        { id: '1', flightNumber: 'AM11', origin: 'MMMX', destination: 'EGLL', aircraft: 'B789', distanceNm: 4770, active: true, kind: 'own' },
        { id: '2', flightNumber: 'AM404', origin: 'MMMX', destination: 'MMGL', aircraft: 'E90', distanceNm: 245, active: true, kind: 'own' },
        { id: '3', flightNumber: 'AM7002', origin: 'MMMX', destination: 'LEBL', aircraft: 'B788', distanceNm: 5010, active: true, kind: 'codeshare', partnerName: 'Delta Virtual' },
        { id: '4', flightNumber: 'AM999', origin: 'MMMX', destination: 'MMTJ', aircraft: 'B738', distanceNm: 1290, active: false, kind: 'own' },
    ],
};

const LIVE_MAP = {
    routes: [],
    airports: [
        { icao: 'MMMX', lat: 19.436, lon: -99.072, dep: 3, arr: 0, routes: 3 },
        { icao: 'EGLL', lat: 51.470, lon: -0.454, dep: 0, arr: 1, routes: 1 },
        { icao: 'MMGL', lat: 20.522, lon: -103.311, dep: 0, arr: 1, routes: 1 },
        { icao: 'LEBL', lat: 41.297, lon: 2.078, dep: 0, arr: 1, routes: 1 },
    ],
    stats: { unmapped: 0 },
};

const json = (body) => (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
    let failures = 0;
    const check = (label, ok, extra) => { if (!ok) { failures++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); } else console.log('  ✓ ' + label); };

    // --- 1. Backend unreachable: the network page is still a network page ----
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
        await page.route('**/api/crew/**', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/network.html`);
        await page.waitForTimeout(1200);
        const cards = await page.$$eval('.route-card', els => els.length);
        check('with the backend down the sectors are still listed', cards > 10, String(cards));
        const band = (await page.textContent('#destLine')).trim();
        check('…and the band counts what is on the page', /^23 destinations\./.test(band), band);
        await page.close();
    }

    // --- 2. The crew centre's network replaces it, whole ---------------------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('**/api/crew/**/routes', json(LIVE_ROUTES));
        await page.route('**/api/crew/**/route-map', json(LIVE_MAP));
        await page.goto(`http://127.0.0.1:${port}/network.html`);
        await page.waitForTimeout(1500);

        const codes = await page.$$eval('.route-end__code', els => els.map(e => e.textContent.trim()));
        check('the crew centre’s sectors replace this repo’s', codes.includes('LEBL'), codes.join(','));
        check('a sector staff switched off does not reach the public', !codes.includes('MMTJ'), codes.join(','));

        const band = (await page.textContent('#destLine')).trim();
        check('the band moves with the list rather than staying at 23',
            /^3 destinations\./.test(band), band);

        const cards = await page.$$eval('.route-card', els => els.length);
        check('three sectors, not four', cards === 3, String(cards));

        const body = await page.textContent('#routes');
        check('a codeshare names the partner rather than passing as ours',
            /Delta Virtual/.test(body), body.slice(0, 200));

        const tiers = await page.$$eval('#filters .filter', els => els.map(e => e.textContent.trim()));
        check('the codeshare lands in the plan’s Codeshare tier', tiers.includes('Codeshare'), tiers.join(','));

        // The whole point of the coordinates feed: Barcelona is not in
        // data.js, and without it the sector would be listed and not drawn.
        const note = (await page.textContent('#mapNote')).trim();
        check('every sector is drawn, including the airport this repo has never heard of',
            note === '', note);
        const drawn = await page.$$eval('#mapHost .map__pt', els => els.length);
        check('…and its dot is on the map', drawn >= 4, String(drawn));

        check('no page errors', errors.filter(e => !/Failed to load/.test(e)).length === 0, errors.join(' | '));
        await page.screenshot({ path: __dirname + '/site-network.png', fullPage: false });
        await page.close();
    }

    // --- 3. Take the coordinates away: the page must SAY it, not hide it -----
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
        await page.route('**/api/crew/**/routes', json(LIVE_ROUTES));
        await page.route('**/api/crew/**/route-map', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/network.html`);
        await page.waitForTimeout(1500);
        const note = (await page.textContent('#mapNote')).trim();
        check('without the coordinates feed the unplaceable sector is declared, not dropped',
            /^1 sector not mapped/.test(note), note);
        const codes = await page.$$eval('.route-end__code', els => els.map(e => e.textContent.trim()));
        check('…and it is still listed', codes.includes('LEBL'), codes.join(','));
        await page.close();
    }

    // --- 4. An empty crew centre leaves this repo's network in place ---------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
        await page.route('**/api/crew/**/routes', json({ routes: [] }));
        await page.route('**/api/crew/**/route-map', json({ routes: [], airports: [] }));
        await page.goto(`http://127.0.0.1:${port}/network.html`);
        await page.waitForTimeout(1400);
        const cards = await page.$$eval('.route-card', els => els.length);
        check('an empty crew centre leaves this repo’s network in place', cards > 10, String(cards));
        await page.close();
    }

    // --- 5. The home page quotes the same airline ---------------------------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('**/api/crew/**/routes', json(LIVE_ROUTES));
        await page.route('**/api/crew/**/route-map', json(LIVE_MAP));
        await page.route('**/api/crew/**/events', json({ events: [] }));
        await page.route('**/api/crew/**/stats', json({ connected: false }));
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForTimeout(1600);

        const lede = (await page.textContent('#networkLede')).trim();
        check('the home page counts the crew centre’s sectors, not this repo’s',
            /^3 published sectors from Mexico City/.test(lede), lede);
        check('the shortest and longest are read off the list, not written down',
            /245 nm to Guadalajara/.test(lede) && /5,010 nm to LEBL/.test(lede), lede);
        check('no page errors', errors.filter(e => !/Failed to load/.test(e)).length === 0, errors.join(' | '));
        await page.close();
    }

    // --- 6. Home page with the backend down keeps this repo's figures --------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        await page.route('**/api/crew/**', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForTimeout(1400);
        const lede = (await page.textContent('#networkLede')).trim();
        check('with the backend down the home page states this repo’s network',
            /^23 published sectors from Mexico City/.test(lede), lede);
        await page.close();
    }

    // --- 7. The about page's network row is a count, not a claim ------------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('**/api/crew/**/routes', json(LIVE_ROUTES));
        await page.goto(`http://127.0.0.1:${port}/about.html`);
        await page.waitForTimeout(1500);
        const facts = await page.textContent('#identity');
        check('the about page states the crew centre’s network size',
            /3 published sectors across/.test(facts), (facts.match(/[\d]+ published sectors across \d+ tiers?/) || [''])[0]);
        check('no page errors', errors.filter(e => !/Failed to load/.test(e)).length === 0, errors.join(' | '));
        await page.close();
    }

    await browser.close();
    server.close();
    console.log(failures ? `\n${failures} check(s) failed` : '\nAll network-sync checks passed ✅');
    process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
