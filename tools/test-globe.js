// test-globe.js
// The dot globe on /network, and the four ways it was wrong before this file
// existed. Each is easy to reintroduce and none of them shows up in a diff:
//
//   * REDUCED MOTION MEANS NO MOTION. Not a slower globe, and — the version
//     this catches — not a requestAnimationFrame loop repainting an identical
//     frame sixty times a second with the rotation commented out. The loop has
//     to actually stop. It also has to come back when the reader drags it,
//     because a globe nobody can turn is a picture.
//   * THE GLOBE IS ALWAYS DRAWN. The sectors come from the crew centre and the
//     crew centre can be down. An empty network is an empty globe, not a blank
//     canvas and not a network invented from data.js to fill it — which is the
//     same rule the route table follows.
//   * IT TURNS, AND A FLICK CARRIES. The drift, the drag and the inertia are
//     the whole interaction; if the pointer handling regresses, the globe
//     still renders perfectly and simply stops responding.
//   * POINTING AT A DOT NAMES IT. The globe carries no labels of its own, so
//     the only way to find out what a dot is, is to point at it.
//   * PICKING ONE OPENS IT, FROM EITHER VIEW. A pick has to turn the globe to
//     face the destination, open the card, and tell the globe where the card
//     landed so the leader line can reach it — and the same pick has to work
//     from a table row, which is the only thing tying the two views together.
//     The page registers those callbacks BEFORE the first draw, which is the
//     order it reads in and which silently dropped them once already: the
//     state they were being written onto did not exist yet.
//
// Run:  node tools/test-globe.js
// Needs: playwright-core, and a Chromium at $PLAYWRIGHT_CHROMIUM (or the
//        pre-installed /opt/pw-browsers/chromium).
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8097;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.png':'image/png' };

const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (!path.extname(p)) p += '.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end('not here'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
});

// The crew centre, replayed. This repo's own sector table is the obvious
// stand-in for what the backend publishes — it is the same network, and using
// it keeps the fixture honest without pinning the test to a live service.
const win = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'))(win);
const FEED = {
    routes: win.AMV_DATA.routes.map((r, i) => ({
        flightNumber: 'AM' + (100 + i), origin: r.from, destination: r.to,
        aircraft: r.ac, distanceNm: r.dist, active: true, kind: 'own',
    })),
};

let failed = 0;
const ok = (cond, msg) => {
    console.log((cond ? '  ✓ ' : '  ✗ ') + msg);
    if (!cond) failed++;
};

// A context whose crew-centre calls are answered from FEED. `mode` of 'down'
// aborts them instead, which is the backend being unreachable.
async function context(browser, opts, mode) {
    const ctx = await browser.newContext(opts);
    await ctx.route('**/api/crew/**', (route) => {
        if (mode === 'down') return route.abort();
        const url = route.request().url();
        const headers = { 'Access-Control-Allow-Origin': '*' };
        const body = url.includes('/routes') ? JSON.stringify(FEED)
            : url.includes('/route-map') ? JSON.stringify({ routes: [], airports: [] })
            : '{}';
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body });
    });
    return ctx;
}

const state = (pg) => pg.evaluate(() => {
    const g = document.getElementById('globeHost')._globe;
    return { yaw: g.yaw, pitch: g.pitch, spin: g.spin, t: g.t, raf: g.raf,
             arcs: g.arcs.length, pts: g.pts.length,
             sel: g.sel, shift: g.shift, card: !!g.card, tween: !!g.tween };
});

// Is anything painted at the middle of the canvas? A blank canvas is fully
// transparent there; a globe is not, whatever colour the theme made it.
const painted = (pg) => pg.evaluate(() => {
    const c = document.getElementById('globeHost').querySelector('canvas');
    return c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3] > 0;
});

async function drag(pg, dx) {
    const box = await pg.locator('#globeHost canvas').boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await pg.mouse.move(x, y);
    await pg.mouse.down();
    await pg.mouse.move(x + dx, y, { steps: 12 });
    const mid = await state(pg);
    await pg.mouse.up();
    return mid;
}

(async () => {
    await new Promise(r => server.listen(PORT, r));
    const exe = process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium/chrome-linux/chrome';
    const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
    const errors = [];
    const url = `http://127.0.0.1:${PORT}/network`;
    const DESKTOP = { viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 2 };

    async function open(opts, mode) {
        const ctx = await context(browser, opts, mode);
        const pg = await ctx.newPage();
        pg.on('pageerror', e => errors.push(e.message));
        await pg.goto(url, { waitUntil: 'load' });
        await pg.waitForTimeout(2000);
        return { ctx, pg };
    }

    console.log('\nIt turns');
    {
        const { ctx, pg } = await open(DESKTOP);
        const a = await state(pg);
        ok(a.arcs === FEED.routes.length, `every sector is on it — ${a.arcs}`);
        ok(a.pts > 0, `and every airport — ${a.pts}`);

        await pg.waitForTimeout(900);
        const b = await state(pg);
        ok(Math.abs(b.yaw - a.yaw) > 0.5,
            `it drifts on its own (${a.yaw.toFixed(1)} → ${b.yaw.toFixed(1)})`);

        const mid = await drag(pg, 180);
        ok(mid.yaw - b.yaw > 20,
            `dragging turns it (${b.yaw.toFixed(1)} → ${mid.yaw.toFixed(1)})`);
        const after = await state(pg);
        ok(after.spin > 0, 'and the flick carries on after the finger lifts');
        await ctx.close();
    }

    console.log('\nPointing at a dot names it');
    {
        const { ctx, pg } = await open(DESKTOP);
        // The globe has no labels, so the only way in is the pointer. Sweep
        // the canvas until a marker answers rather than hard-coding a pixel:
        // the opening view is allowed to change without breaking this.
        const named = await pg.evaluate(() => new Promise((done) => {
            const host = document.getElementById('globeHost');
            const c = host.querySelector('canvas');
            requestAnimationFrame(() => {
                const b = c.getBoundingClientRect();
                for (let x = 0; x < b.width; x += 6) {
                    for (let y = 0; y < b.height; y += 6) {
                        c.dispatchEvent(new PointerEvent('pointermove',
                            { clientX: b.left + x, clientY: b.top + y, bubbles: true }));
                        const said = document.getElementById('globeHint').textContent;
                        if (/^[A-Z]{4}/.test(said)) return done(said);
                    }
                }
                done(document.getElementById('globeHint').textContent);
            });
        }));
        ok(/^[A-Z]{4}/.test(named), `a marker under the pointer is named — "${named}"`);
        await ctx.close();
    }

    console.log('\nPicking one opens it');
    {
        const { ctx, pg } = await open(DESKTOP);
        const before = await state(pg);

        // Pick the longest sector there is, so the turn is unmistakable.
        await pg.evaluate(() => window.AMV_GLOBE.select(
            document.getElementById('globeHost'), 'RJAA'));
        await pg.waitForTimeout(1400);
        const after = await state(pg);

        ok(after.sel === 'RJAA', 'the globe knows what is picked');
        ok(Math.abs(after.yaw - before.yaw) > 20,
            `it turned to face it (${before.yaw.toFixed(1)} -> ${after.yaw.toFixed(1)})`);
        ok(!after.tween, 'and the turn finished rather than running forever');
        // The destination ends up at the middle of the disc: that is what
        // "facing the viewer" means, and it is what the leader line assumes.
        const centred = await pg.evaluate(() => {
            const g = document.getElementById('globeHost')._globe;
            const p = g.at[g.sel];
            const off = Math.abs(((p.lon - 90 - g.yaw) % 360 + 540) % 360 - 180);
            return off < 1.5 && Math.abs(p.lat - g.pitch) < 1.5;
        });
        ok(centred, 'the destination is at the middle of the disc');
        ok(after.spin === 0, 'and the idle drift is held, so it stays there');
        ok(Math.abs(after.shift + 0.16) < 0.01,
            `the globe slid aside for the card (${after.shift.toFixed(3)})`);
        ok(after.card, 'and was told where the card landed, so the leader can reach it');

        const card = await pg.textContent('#globeCard');
        ok(/Tokyo/.test(card) && /RJAA/.test(card), 'the card is about that sector');
        ok(/13h 45m/.test(card), '...with the figures the old flagship strip carried');

        // Closing it puts everything back.
        await pg.click('.globe-card__close');
        await pg.waitForTimeout(600);
        const cleared = await state(pg);
        ok(cleared.sel === null, 'closing the card drops the pick');
        ok(Math.abs(cleared.shift) < 0.01, '...and the globe comes back to the middle');
        ok(await pg.isHidden('#globeCard'), '...and the card is gone, not just invisible');
        await ctx.close();
    }

    console.log('\nThe table and the globe are the same rows');
    {
        const { ctx, pg } = await open(DESKTOP);
        await pg.click('#tab-routes');
        const rows = await pg.$$eval('.rtable tbody tr', els => els.length);
        ok(rows === FEED.routes.length, `every sector is in the table \u2014 ${rows}`);

        // Picking a row is the only thing joining the two views: it has to
        // switch tabs AND open that sector on the globe.
        await pg.click('.rtable tbody tr[data-to="LEMD"] .rtable__pick');
        await pg.waitForTimeout(1400);
        ok(await pg.isVisible('#view-globe'), 'picking a row goes to the globe');
        ok((await state(pg)).sel === 'LEMD', '...pointed at that sector');
        ok(/Madrid/.test(await pg.textContent('#globeCard')), '...with its card open');

        await pg.click('#tab-bases');
        ok(await pg.isVisible('#view-bases'), 'the bases are a tab, not a section');
        ok((await pg.$$eval('#hubs .hub-card', els => els.length)) === 4, '...and all four are there');
        await ctx.close();
    }

    console.log('\nReduced motion means no motion');
    {
        const { ctx, pg } = await open(Object.assign({ reducedMotion: 'reduce' }, DESKTOP));
        const a = await state(pg);
        await pg.waitForTimeout(1200);
        const b = await state(pg);
        ok(b.yaw === a.yaw, 'it does not drift');
        ok(b.t === 0, 'nothing is travelling along the arcs');
        ok(b.raf === 0, 'and the frame loop has STOPPED, not gone quiet');
        ok(await painted(pg), 'the globe is still drawn');

        await drag(pg, 120);
        await pg.waitForTimeout(300);
        ok((await state(pg)).yaw > a.yaw, 'and the reader can still turn it by hand');

        // A pick still works; it simply arrives rather than flying there.
        await pg.evaluate(() => window.AMV_GLOBE.select(
            document.getElementById('globeHost'), 'RJAA'));
        await pg.waitForTimeout(150);
        const picked = await state(pg);
        ok(picked.sel === 'RJAA' && !picked.tween,
            'a pick arrives instantly instead of flying across the planet');
        ok(/Tokyo/.test(await pg.textContent('#globeCard')),
            '...and the card still carries every figure');
        await ctx.close();
    }

    console.log('\nWith the crew centre down');
    {
        const { ctx, pg } = await open(DESKTOP, 'down');
        const s = await state(pg);
        ok(s.arcs === 0 && s.pts === 0, 'no network is invented to fill it');
        ok(await painted(pg), 'and the globe is still there, empty');
        await ctx.close();
    }

    await browser.close();
    server.close();

    console.log('');
    ok(errors.length === 0, errors.length ? 'page errors: ' + errors.join(' | ') : 'no page errors');
    console.log(failed ? `\n${failed} check(s) failed` : '\nAll globe checks passed ✅');
    process.exit(failed ? 1 : 0);
})();
