// test-crew-feed-sections.js
// The two things the crew centre now feeds this site: what the airline did,
// and what it photographed.
//
// Both are new in a way the rest of the home page is not. Every other section
// holds a fallback in data.js and is CORRECT before any fetch resolves — the
// site's standing rule. These two cannot be: there is no honest hand-written
// version of "a pilot joined on Tuesday", and no static stand-in for an
// Instagram post. So they are the site's only remove-if-empty sections, and
// the checks here are about what happens when the feed does not answer as much
// as when it does:
//
//   * a quiet backend removes both sections rather than leaving a heading over
//     an empty grid — and takes nothing else on the page with it;
//   * the noticeboard's WRITTEN rows stay off the public page; only the crew
//     centre's automatic ones (joined, promotion, event) reach it;
//   * a wall tile is a button until it is scrolled to, so the section does not
//     cost nine Instagram page loads on a page most visitors never finish;
//   * and the one that matters: an embed address the backend sent that is not
//     a shortcode never reaches an iframe `src`. crew.js rebuilds every
//     address from [A-Za-z0-9_-]; this proves it by sending a hostile one.
//
// Run:  node tools/test-crew-feed-sections.js
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

// A board with both kinds of row on it, plus a draft nobody published.
const BOARD = { announcements: [
    { _id: 'a', title: 'Winter bids close Friday', body: 'Get them in.', auto: false, kind: 'notice', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { _id: 'b', title: 'Ana joined as First Officer', auto: true, kind: 'joined', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'c', title: 'Luis was promoted to Captain', body: 'After 142 hours.', auto: true, kind: 'promotion', createdAt: new Date().toISOString() },
    { _id: 'd', title: 'Draft nobody published', auto: true, kind: 'event', status: 'draft', createdAt: new Date().toISOString() },
] };

// One good post, and two the backend should never have sent. If either of the
// last two reaches a frame, this file has caught a real bug.
const WALL = { handle: 'aeromexicovirtual', posts: [
    { kind: 'p', code: 'ABC123_-x', url: 'https://www.instagram.com/p/ABC123_-x/', embedUrl: 'https://www.instagram.com/p/ABC123_-x/embed/' },
    { kind: 'p', code: '../../evil', url: 'https://evil.test/', embedUrl: 'https://evil.test/embed/' },
    { kind: 'javascript', code: 'alert', url: 'javascript:alert(1)', embedUrl: 'javascript:alert(1)' },
] };

const json = (body) => (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium' });
    let failures = 0;
    const check = (label, ok, extra) => { if (!ok) { failures++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); } else console.log('  ✓ ' + label); };

    // Instagram itself is never loaded: the point is what we ASK for, and a
    // real embed would make this test need the network.
    const stubInstagram = (page) => page.route('https://www.instagram.com/**',
        r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>post</p>' }));

    // --- 1. The backend is quiet: both sections go, the page stays ----------
    console.log('\nA quiet backend');
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('**/api/crew/**', r => r.abort());
        await page.goto(`http://127.0.0.1:${port}/`);
        await page.waitForTimeout(1500);

        check('the activity section is removed, not left empty', await page.$('#recent') === null);
        check('the wall is removed too', await page.$('#wall') === null);
        // The rest of the page is the point of removing them quietly.
        check('the network section survives', await page.$('#mapHost') !== null);
        check('…and still lists this repo’s sectors',
            (await page.textContent('#networkLede')).includes('sector'));
        check('no page errors', errors.length === 0, errors.join(' | '));
        await page.close();
    }

    // --- 2. The board: automatic rows only ---------------------------------
    console.log('\nWhat the airline has been doing');
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await stubInstagram(page);
        await page.route('**/api/crew/**/announcements', json(BOARD));
        await page.route('**/api/crew/**/social', json({ handle: '', posts: [] }));
        await page.goto(`http://127.0.0.1:${port}/`);
        await page.waitForTimeout(1500);

        check('the section appears once the board answers', await page.isVisible('#recent'));
        const rows = await page.$$eval('#recentList .timeline__row b', els => els.map(e => e.textContent.trim()));
        check('a promotion is on the page', rows.includes('Luis was promoted to Captain'), rows.join(' | '));
        check('a join is too', rows.includes('Ana joined as First Officer'), rows.join(' | '));
        check('what a human typed for the crew is NOT',
            !rows.includes('Winter bids close Friday'), rows.join(' | '));
        check('a draft is not published by the back door',
            !rows.some(r => /Draft nobody/.test(r)), rows.join(' | '));

        const when = await page.$$eval('#recentList .timeline__when', els => els.map(e => e.textContent.trim()));
        check('rows are dated in words a reader can use', when.includes('Today') && when.includes('Yesterday'), when.join(','));

        check('a wall with no posts still removes itself', await page.$('#wall') === null);
        check('no page errors', errors.length === 0, errors.join(' | '));
        await page.close();
    }

    // --- 3. The wall: lazy, and safe ---------------------------------------
    console.log('\nThe wall');
    {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await stubInstagram(page);
        await page.route('**/api/crew/**/announcements', json({ announcements: [] }));
        await page.route('**/api/crew/**/social', json(WALL));
        await page.goto(`http://127.0.0.1:${port}/`);
        await page.waitForTimeout(1500);

        const tiles = await page.$$eval('.wall__tile', els => els.length);
        check('only the post that is a post is hung', tiles === 1, String(tiles));

        const srcs = await page.$$eval('.wall__tile', els => els.map(e => e.dataset.embed));
        check('the address is the one we rebuild',
            srcs[0] === 'https://www.instagram.com/p/ABC123_-x/embed/', srcs.join(','));
        check('nothing the backend sent survives as typed',
            !srcs.some(s => /evil|javascript:/i.test(s || '')), srcs.join(','));

        // Off-screen: still a button. This is the whole reason for the tile.
        const framesBefore = await page.$$eval('.wall__tile iframe', els => els.length);
        check('a tile below the fold has not loaded Instagram yet', framesBefore === 0, String(framesBefore));

        await page.evaluate(() => document.getElementById('wall').scrollIntoView());
        await page.waitForTimeout(600);
        const framed = await page.$$eval('.wall__tile iframe', els => els.map(e => e.getAttribute('src')));
        check('scrolling to it mounts the embed', framed.length === 1, String(framed.length));
        check('…at the address we built', framed[0] === 'https://www.instagram.com/p/ABC123_-x/embed/', String(framed[0]));

        const sandbox = await page.getAttribute('.wall__tile iframe', 'sandbox');
        check('the frame is sandboxed', /allow-scripts/.test(sandbox || '') && !/allow-top-navigation/.test(sandbox || ''), sandbox);

        const handle = (await page.textContent('#wallHandle')).trim();
        check('the follow line carries the handle', /@aeromexicovirtual/.test(handle), handle);
        check('no page errors', errors.length === 0, errors.join(' | '));
        await page.close();
    }

    await browser.close();
    server.close();
    console.log(failures ? `\n${failures} failing ❌\n` : '\nAll crew-feed section checks passed ✅\n');
    process.exit(failures ? 1 : 0);
})();
