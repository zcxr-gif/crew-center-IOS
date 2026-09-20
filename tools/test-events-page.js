// test-events-page.js
// Checks the events page and its feed in a real browser.
//
// The three things worth checking, because each has a way of going wrong that
// nobody notices for weeks:
//   * NOTHING IS INVENTED. data.js used to carry four events as fallback copy
//     and this page painted them before the network was involved, so a visitor
//     with a slow connection was shown four departures that did not exist.
//     Those are gone; with the backend unreachable, or the calendar empty, the
//     page says there is nothing on and names no event at all.
//   * the crew center's calendar is what renders, and drafts, cancelled events
//     and events already flown do not reach the public page
//   * the departure reads in the visitor's own clock rather than in Z
//
// The first of these is the one that is easy to "fix" back into a bug: the
// site's general rule is that a page must be correct before the fetch runs,
// which everywhere else means keeping a data.js fallback. A calendar is the
// exception, because it is the one thing here a reader can act on — turn up,
// load the route, block out the evening — and a placeholder event is a lie
// with a date on it.
//
// Run:  node tools/test-events-page.js
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
    if (p === '/') p = '/events.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(''); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});

const LIVE = {
    events: [
        { id: 'a', title: 'Águila Transatlántica', description: 'Flagship run to Madrid.', status: 'published',
          origin: 'MMMX', destination: 'LEMD', aircraft: 'Boeing 787-9 Dreamliner', server: 'Expert',
          startsAt: new Date(Date.now() + 5 * 86400e3).toISOString(), slots: 40, going: 12, seatsLeft: 28,
          gateIcao: 'MMMX', bannerUrl: '' },
        { id: 'b', title: 'A draft nobody should see', status: 'draft', origin: 'MMMX', destination: 'KLAX',
          startsAt: new Date(Date.now() + 6 * 86400e3).toISOString(), slots: 0, going: null, gateIcao: '' },
        { id: 'c', title: 'A cancelled one', status: 'cancelled', origin: 'MMMX', destination: 'KJFK',
          startsAt: new Date(Date.now() + 7 * 86400e3).toISOString(), slots: 0, going: null, gateIcao: '' },
        { id: 'd', title: 'Already flown', status: 'published', origin: 'MMMX', destination: 'MMUN',
          startsAt: new Date(Date.now() - 3 * 86400e3).toISOString(), slots: 0, going: 4, gateIcao: '' },
    ],
};

(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
    let failures = 0;
    const check = (label, ok, extra) => { if (!ok) { failures++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); } else console.log('  ✓ ' + label); };

    // --- 1. Backend unreachable: say so, and invent nothing -----------------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        await page.route('**/api/crew/**', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/events.html`);
        await page.waitForTimeout(1200);
        const titles = await page.$$eval('#eventGrid h3', els => els.map(e => e.textContent));
        const body = await page.textContent('#eventGrid');
        check('with the backend down, no event is advertised', titles.length === 0, titles.join(','));
        check('…and the page says so rather than sitting on a skeleton',
            /Nothing on the calendar/i.test(body), body.trim().slice(0, 120));
        check('…and none of the old invented events comes back',
            !/Valle de México|Connect Regional|Pacífico Nocturno/.test(body), body.trim().slice(0, 160));
        await page.close();
    }

    // --- 2. Live feed: this is the only thing that renders, filtered --------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('**/api/crew/**/events', r => r.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify(LIVE) }));
        await page.goto(`http://127.0.0.1:${port}/events.html`);
        await page.waitForTimeout(1500);

        const titles = await page.$$eval('#eventGrid h3', els => els.map(e => e.textContent.trim()));
        check('the crew center’s calendar is what renders',
            titles.length === 1 && titles[0] === 'Águila Transatlántica', titles.join(','));
        check('a draft never reaches the public site', !titles.includes('A draft nobody should see'));
        check('a cancelled event is not advertised', !titles.includes('A cancelled one'));
        check('an event already flown drops off', !titles.includes('Already flown'));

        const facts = await page.textContent('#eventGrid .strip__facts');
        check('the route, type, server and cap are stated',
            /MMMX → LEMD/.test(facts) && /787-9/.test(facts) && /Expert Server/.test(facts) && /40 slots/.test(facts), facts);
        check('attendance is shown because the backend counted it', /12 signed up/.test(facts), facts);
        check('the gate board’s airport is named',
            /Stands at MMMX/.test(await page.textContent('#eventGrid')));

        // The time must be the visitor's, not Z.
        const stamp = await page.textContent('#eventGrid .type');
        check('the departure reads in the visitor’s own clock, not Z', !/Z\b/.test(stamp) && stamp.length > 8, stamp);

        check('no page errors', errors.filter(e => !/Failed to load/.test(e)).length === 0, errors.join(' | '));
        await page.screenshot({ path: __dirname + '/site-events.png', fullPage: false });
        await page.close();
    }

    // --- 3. Empty calendar: an empty week is a true thing to say ------------
    {
        const page = await browser.newPage();
        await page.route('**/api/crew/**/events', r => r.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify({ events: [] }) }));
        await page.goto(`http://127.0.0.1:${port}/events.html`);
        await page.waitForTimeout(1200);
        const titles = await page.$$eval('#eventGrid h3', els => els.map(e => e.textContent));
        const body = await page.textContent('#eventGrid');
        check('an empty crew center shows an empty calendar', titles.length === 0, titles.join(','));
        check('…and says so in words', /Nothing on the calendar/i.test(body), body.trim().slice(0, 120));
        await page.close();
    }

    // --- 4. The home page's next-departure band, on the same terms ----------
    // It is the other place the invented events reached, and it is the worse
    // one: a single card headed "The next departure" reads as a commitment.
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        await page.route('**/api/crew/**', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForTimeout(1400);
        const band = await page.textContent('#nextEvent');
        check('the home page advertises no departure with the backend down',
            /Nothing on the calendar/i.test(band), band.trim().slice(0, 120));
        check('…and names none of the invented ones',
            !/Valle de México|Connect Regional|Pacífico Nocturno|Águila Transatlántica/.test(band),
            band.trim().slice(0, 160));
        await page.close();
    }

    // --- 5. …and it does show a real one when there is one ------------------
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        // Playwright matches the most recently registered route first, so the
        // catch-all goes on BEFORE the one it must not swallow. Registered the
        // other way round this quietly aborts the calendar too, and the check
        // fails for a reason that has nothing to do with the page.
        await page.route('**/api/crew/**', r => r.abort());
        await page.route('**/api/crew/**/events', r => r.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify(LIVE) }));
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForTimeout(1400);
        const band = await page.textContent('#nextEvent');
        check('the home page shows the crew centre’s next departure',
            /Águila Transatlántica/.test(band), band.trim().slice(0, 120));
        await page.close();
    }

    await browser.close();
    server.close();
    console.log(failures ? `\n${failures} check(s) failed` : '\nAll site checks passed ✅');
    process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
