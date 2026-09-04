// test-motion.js
// How the page moves, and how one section becomes the next.
//
// Both were bad in ways that are easy to reintroduce and hard to see in a
// diff, so they are pinned here rather than left to the eye:
//
//   * NOTHING MAY BE STRANDED INVISIBLE. Every [data-reveal] starts at
//     opacity 0 and is shown by an observer. Anything the observer never
//     reaches — a grid child wired to its group, a card injected after the
//     first pass, a section above where a #hash dropped you — stays invisible
//     forever, and the page looks broken rather than slow.
//   * A CASCADE MAY NOT RESTART. The home page's six cards carried hand-typed
//     delays of 0/80/160 on the first row and 0/80/160 again on the second, so
//     the run appeared to stutter halfway down. Delays now come from the
//     child's position in its group, and this checks they keep increasing.
//   * A SEAM IS EITHER A RAMP OR DELIBERATE. Pale sections fade in and out of
//     the white around them; the edge against a dark block stays a knife edge,
//     because navy against white is the airline's own device and the band
//     meets it with a greca crown. Both are asserted by reading pixels.
//   * REDUCED MOTION MEANS NO MOTION. Not a shorter animation — none, and
//     nothing depending on one having run.
//
// Run:  node tools/test-motion.js
// Needs: playwright-core, and a Chromium at $PLAYWRIGHT_CHROMIUM (or the
//        pre-installed /opt/pw-browsers/chromium).
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.png':'image/png' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (!path.extname(p)) p += '.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(''); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});

const PAGES = ['index', 'network', 'fleet', 'ranks', 'events', 'staff', 'join', 'about'];

// Every page is checked with the crew centre unreachable AND answering, because
// the two produce different markup — a live answer injects cards that have to
// be wired for reveal by AMV.refresh(), and that is exactly the path that
// strands things at opacity 0 when it regresses.
const LIVE = {
    '/routes': { routes: [
        { id: '1', flightNumber: 'AM11', origin: 'MMMX', destination: 'EGLL', aircraft: 'B789', distanceNm: 4770, active: true, kind: 'own' },
        { id: '2', flightNumber: 'AM404', origin: 'MMMX', destination: 'MMGL', aircraft: 'E90', distanceNm: 245, active: true, kind: 'own' },
    ] },
    '/stats': { connected: true, stats: { pilots: 412, pilotsActive: 180, hours: 3984, pirepsApproved: 2104, landings: 5120, flights30d: 212, flightHours30d: 640 } },
    '/events': { events: [{ id: 'e', title: 'Águila Transatlántica', status: 'published', origin: 'MMMX', destination: 'LEMD',
        aircraft: 'Boeing 787-9 Dreamliner', server: 'Expert', startsAt: new Date(Date.now() + 5 * 86400e3).toISOString(),
        slots: 40, going: 12, seatsLeft: 28, gateIcao: 'MMMX', bannerUrl: '', description: 'Flagship run to Madrid.' }] },
};

async function settle(page) {
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(90); }
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
}

const stranded = (page) => page.evaluate(() => [...document.querySelectorAll('[data-reveal]')]
    .filter(el => !el.classList.contains('is-in') && el.getClientRects().length)
    .map(el => (el.tagName + '.' + String(el.className || '')).slice(0, 60)));

(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
    let failures = 0;
    const check = (label, ok, extra) => { if (!ok) { failures++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); } else console.log('  ✓ ' + label); };

    const open = async (name, { live = false, reduce = false } = {}) => {
        const page = await browser.newPage({
            viewport: { width: 1280, height: 820 },
            reducedMotion: reduce ? 'reduce' : 'no-preference',
        });
        await page.route('**/api/crew/**', (r) => {
            if (!live) return r.abort();
            const key = Object.keys(LIVE).find(k => new URL(r.request().url()).pathname.endsWith(k));
            if (!key) return r.abort();
            return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LIVE[key]) });
        });
        await page.goto(`http://127.0.0.1:${port}/${name}.html`);
        await page.waitForTimeout(900);
        return page;
    };

    // --- 1. Nothing stranded, on any page, either way round ------------------
    console.log('\nNothing is left invisible');
    for (const name of PAGES) {
        for (const live of [false, true]) {
            const page = await open(name, { live });
            await settle(page);
            const left = await stranded(page);
            check(`/${name}${live ? ' (crew centre answering)' : ' (crew centre down)'}`,
                left.length === 0, left.join(', '));
            await page.close();
        }
    }

    // --- 2. The cascade counts up and does not restart -----------------------
    console.log('\nThe cascade');
    {
        const page = await open('index');
        await settle(page);
        const delays = await page.evaluate(() => {
            const g = document.querySelector('.grid.grid-3[data-reveal-group]');
            return [...g.children].map(c => parseInt(getComputedStyle(c).getPropertyValue('--reveal-delay'), 10));
        });
        check('every card in the grid is a reveal with its own delay',
            delays.length === 6 && delays.every(Number.isFinite), JSON.stringify(delays));
        check('the run counts up and never restarts halfway down',
            delays.every((d, i) => i === 0 || d > delays[i - 1]), JSON.stringify(delays));

        // The bug this replaced: a timer per element. A delay that is not on
        // the element's own transition cannot be scheduled with it, and drifts
        // apart from it the moment the main thread is busy.
        const scheduled = await page.evaluate(() => {
            const c = document.querySelector('.grid.grid-3[data-reveal-group] > :nth-child(3)');
            const cs = getComputedStyle(c);
            return { delay: cs.transitionDelay, want: cs.getPropertyValue('--reveal-delay').trim() };
        });
        check('the delay is the element’s transition-delay, not a setTimeout',
            scheduled.delay.split(',').every(d => Math.abs(parseFloat(d) * 1000 - parseInt(scheduled.want, 10)) < 1),
            JSON.stringify(scheduled));

        const groups = await page.evaluate(() =>
            [...document.querySelectorAll('[data-reveal-group]')].map(g => g.children.length));
        check('every group on the home page actually has children to stagger',
            groups.length >= 3 && groups.every(n => n > 1), JSON.stringify(groups));
        await page.close();
    }

    // --- 3. Landing deep in the page, then scrolling back up -----------------
    console.log('\nArriving mid-page');
    {
        const page = await open('index');
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(700);
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(700);
        const left = await stranded(page);
        check('nothing above where you landed is left at opacity 0', left.length === 0, left.join(', '));
        await page.close();
    }

    // --- 4. Reduced motion means none ---------------------------------------
    console.log('\nReduced motion');
    {
        const page = await open('index', { reduce: true });
        await page.waitForTimeout(600);
        const state = await page.evaluate(() => {
            const els = [...document.querySelectorAll('[data-reveal]')].filter(e => e.getClientRects().length);
            const cs = els.map(e => getComputedStyle(e));
            return {
                n: els.length,
                hidden: cs.filter(s => +s.opacity < 1).length,
                moved: cs.filter(s => s.transform !== 'none').length,
            };
        });
        check('every revealed element is visible without scrolling', state.n > 0 && state.hidden === 0,
            JSON.stringify(state));
        check('…and none of them is offset waiting to slide', state.moved === 0, JSON.stringify(state));
        await page.close();
    }

    // --- 5. The seams -------------------------------------------------------
    console.log('\nSection seams');
    {
        const page = await open('index');
        await settle(page);
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(400);
        const bounds = await page.evaluate(() => [...document.querySelectorAll('main > section, main > .band')]
            .map(e => ({ cls: e.className, top: Math.round(e.getBoundingClientRect().top + scrollY) })));
        const shot = await page.screenshot({ fullPage: true });

        const probe = await browser.newPage();
        await probe.setContent('<canvas id="c"></canvas>');
        const read = await probe.evaluate(async ({ b64, bounds }) => {
            const img = new Image();
            await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
            const c = document.getElementById('c'); c.width = img.width; c.height = img.height;
            const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
            // The left gutter: section background and nothing else.
            const at = (y) => { const d = ctx.getImageData(8, y, 1, 1).data; return [d[0], d[1], d[2]]; };
            return bounds.map((s, i) => i === 0 ? null : ({
                cls: s.cls,
                above: at(s.top - 6),
                below: at(s.top + 6),
                // Well inside the block, past the greca crown a dark section
                // wears on its top edge — that crown is marigold, and reading
                // it as "the section's colour" would call the band pale.
                inside: at(s.top + 40),
                run: [-40, -25, -10, 5, 20, 35].map(dy => at(s.top + dy)),
            })).filter(Boolean);
        }, { b64: shot.toString('base64'), bounds });
        await probe.close();

        const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
        const dark = (p) => lum(p) < 90;

        // Every pale/white changeover must be gradual: no single 6px step may
        // account for most of the difference across the seam.
        const soft = read.filter(r => !dark(r.above) && !dark(r.inside));
        check('there is at least one pale/white changeover to judge', soft.length >= 2, String(soft.length));
        soft.forEach(r => {
            const step = Math.abs(lum(r.above) - lum(r.below));
            check(`the seam into "${r.cls}" is a ramp, not an edge (Δ${step.toFixed(1)} across 12px)`,
                step < 4, JSON.stringify(r.run));
        });

        // …and the edge into a dark block stays a hard one.
        const hard = read.filter(r => dark(r.inside));
        check('there is a dark block to judge', hard.length >= 1, String(hard.length));
        hard.forEach(r => {
            check(`the edge into "${r.cls}" is kept crisp`,
                Math.abs(lum(r.above) - lum(r.inside)) > 100, JSON.stringify([r.above, r.inside]));
        });
        await page.close();
    }

    await browser.close();
    server.close();
    console.log(failures ? `\n${failures} check(s) failed` : '\nAll motion checks passed ✅');
    process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
