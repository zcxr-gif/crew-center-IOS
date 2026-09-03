/* ============================================================================
   Aeromexico Virtual — map.js
   The route map on /network.

   Every reviewer who looked at the network page asked for one of these, and
   they were right: twenty-three sectors listed one under another is a table of
   airports, not a network. This draws the network — every published sector as
   a great circle from its origin, on the world.

   Nothing here is illustrated. The coastlines are Natural Earth's public-domain
   1:110m land, reprojected and simplified by tools/make-worldmap.py into
   assets/js/world.js. The airports are their real aerodrome reference points,
   from AMV_DATA.airports. The arcs are actual great circles, interpolated and
   projected point by point — a sector to Tokyo bends over the Pacific because
   that is where the aeroplane goes, not because a curve looked nicer.

   It renders from whatever route list it is handed, so when the crew centre
   answers with the airline's real network, the map redraws to match. A sector
   whose airports we have no coordinates for is left off rather than guessed at,
   and the caller is told how many that was.
   ========================================================================== */

(function () {
    'use strict';

    // Robinson, identical to tools/make-worldmap.py. Keep the two in step or
    // the dots stop landing on the coastlines.
    const ROBINSON = [
        [1.0000, 0.0000], [0.9986, 0.0620], [0.9954, 0.1240], [0.9900, 0.1860],
        [0.9822, 0.2480], [0.9730, 0.3100], [0.9600, 0.3720], [0.9427, 0.4340],
        [0.9216, 0.4958], [0.8962, 0.5571], [0.8679, 0.6176], [0.8350, 0.6769],
        [0.7986, 0.7346], [0.7597, 0.7903], [0.7186, 0.8435], [0.6732, 0.8936],
        [0.6213, 0.9394], [0.5722, 0.9761], [0.5322, 1.0000],
    ];

    function project(lat, lon) {
        const a = Math.min(Math.abs(lat), 89.999);
        const i = Math.min(Math.floor(a / 5), 17);
        const t = (a - i * 5) / 5;
        const xr = ROBINSON[i][0] + (ROBINSON[i + 1][0] - ROBINSON[i][0]) * t;
        let  yr = ROBINSON[i][1] + (ROBINSON[i + 1][1] - ROBINSON[i][1]) * t;
        if (lat < 0) yr = -yr;
        return [0.5 + (lon / 180) * xr * 0.5, 0.5 - yr * 0.5];
    }

    // Great circle between two points, as a list of [lat, lon] samples.
    // Spherical linear interpolation on the unit vectors — the shortest path
    // over the sphere, which is the one the aeroplane flies.
    function greatCircle(a, b, steps) {
        const rad = Math.PI / 180;
        const v = (p) => {
            const la = p[0] * rad, lo = p[1] * rad;
            return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
        };
        const p = v(a), q = v(b);
        const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
        const d = Math.acos(dot);
        const out = [];
        if (d < 1e-9) return [a, b];
        for (let i = 0; i <= steps; i++) {
            const f = i / steps;
            const s1 = Math.sin((1 - f) * d) / Math.sin(d);
            const s2 = Math.sin(f * d) / Math.sin(d);
            const x = s1 * p[0] + s2 * q[0], y = s1 * p[1] + s2 * q[1], z = s1 * p[2] + s2 * q[2];
            out.push([Math.atan2(z, Math.hypot(x, y)) / rad, Math.atan2(y, x) / rad]);
        }
        return out;
    }

    // Project a sampled great circle into one or more SVG paths. Mexico City to
    // Tokyo crosses the antimeridian: drawn as a single polyline it would run
    // back across the entire map as a horizontal scar, so the line is cut where
    // the longitude wraps and continues on the far edge.
    function arcPaths(pts, W, H) {
        const runs = [[]];
        let prev = null;
        for (const [lat, lon] of pts) {
            if (prev !== null && Math.abs(lon - prev) > 180) runs.push([]);
            prev = lon;
            const [x, y] = project(lat, lon);
            runs[runs.length - 1].push((x * W).toFixed(1) + ',' + (y * H).toFixed(1));
        }
        return runs.filter(r => r.length > 1).map(r => 'M' + r.join(' '));
    }

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* Draw. `host` is the element to fill; `routes` is the sector list to plot;
       `opts.hubs` are drawn larger and always labelled. Returns how many
       sectors it could actually place, so the caller can say so. */
    function draw(host, routes, opts) {
        const world = window.AMV_WORLD;
        const D = window.AMV_DATA || {};
        const pos = (opts && opts.airports) || D.airports || {};
        const hubs = (opts && opts.hubs) || D.hubs || [];
        if (!host || !world) return 0;

        const W = world.w, H = world.h;
        const plotted = routes.filter(r => pos[r.from] && pos[r.to]);

        // The scroller and an empty SVG go in FIRST so the map's height can be
        // measured rather than assumed: the stylesheet sizes it by height and
        // lets the width fall out of the aspect ratio, and the label type size
        // is computed from that. Reusing the shell on a redraw also keeps the
        // pan position and the listeners wired to it.
        let shell = host.querySelector('.map-scroll');
        if (!shell) {
            host.innerHTML = '<div class="map-scroll" tabindex="0" role="region"'
                + ' aria-label="Route map — drag or scroll sideways to pan">'
                + '<svg class="map"></svg></div>';
            shell = host.querySelector('.map-scroll');
        }
        const svgEl  = shell.querySelector('.map');
        const mapPx  = Math.max(160, svgEl.clientHeight || shell.clientHeight || 320);

        // Crop to the network rather than to the world. A full world map is
        // 2000x1014 with Antarctica across the bottom and empty ocean down both
        // sides; on a phone that leaves the airline about 130px tall. The box
        // below is the bounding box of everything actually drawn, padded — so
        // the map is as large as it can be while still showing the whole
        // network, and it re-crops when the tier filter changes.
        const pts = [];
        plotted.forEach(r => {
            // Sample the arcs, not just the endpoints: the great circle to
            // Tokyo climbs to 48°N, well above either end of it.
            greatCircle(pos[r.from], pos[r.to], 24).forEach(q => pts.push(project(q[0], q[1])));
        });
        let box;
        if (pts.length) {
            const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
            // Horizontal padding is generous: labels sit beside their dots and
            // the widest of them is most of an inch at this scale.
            const padX = 0.055, padY = 0.05;
            const x0 = Math.max(0, Math.min(...xs) - padX), x1 = Math.min(1, Math.max(...xs) + padX);
            const y0 = Math.max(0, Math.min(...ys) - padY), y1 = Math.min(1, Math.max(...ys) + padY);
            box = [x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H];
        } else {
            box = [0, project(78, 0)[1] * H, W, (project(-56, 0)[1] - project(78, 0)[1]) * H];
        }
        // (the crop is finalised below, once the labels have been placed)
        const hubSet = new Set(hubs.map(h => h.icao));

        // Flagship destinations: the farthest sector in each region. Labelling
        // all twenty-three turns the map into a wall of type, and picking
        // favourites by hand is an opinion this file has no business holding —
        // the longest sector in a region is a fact about the network.
        const far = {};
        plotted.forEach(r => {
            const k = r.region || r.tier || 'Network';
            if (!far[k] || (r.dist || 0) > (far[k].dist || 0)) far[k] = r;
        });
        const flagship = new Set(Object.values(far).map(r => r.to));

        const arcs = plotted.map(r => {
            const gc = greatCircle(pos[r.from], pos[r.to], 64);
            const cls = 'map__arc' + (flagship.has(r.to) ? ' is-flagship' : '');
            return arcPaths(gc, W, H)
                .map(d => `<path class="${cls}" d="${d}" data-to="${esc(r.to)}"/>`).join('');
        }).join('');

        // One dot per airport, not one per sector — two sectors into the same
        // field are one place on a map.
        const seen = new Map();
        plotted.forEach(r => { seen.set(r.to, r); if (!seen.has(r.from)) seen.set(r.from, null); });

        // Mexico City, Monterrey, Guadalajara and Cancún sit within a few
        // degrees of one another, so their labels land on top of each other and
        // on the arcs leaving them. Each label is tried in eight positions
        // around its dot and takes the first that collides with nothing already
        // placed; if it ends up somewhere that is not obviously beside its own
        // dot, a leader line joins the two. This is what a cartographer does by
        // hand, and it is the difference between four bases and one smudge.
        // Named points are laid out first, so an unlabelled dot never takes the
        // spot a base's label needed.
        const order = [...seen.entries()].sort((a, b) => {
            const rank = ([icao]) => hubSet.has(icao) ? 0 : flagship.has(icao) ? 1 : 2;
            return rank(a) - rank(b);
        });

        // Type is sized in SCREEN pixels, not in map units. An SVG scales its
        // text with the viewBox, so a label that reads well on a desktop map is
        // about nine pixels tall on a phone — which is what the first version of
        // this did. The crop varies with the filter too, so there is no fixed
        // font size that works: it is computed from how many map units the host
        // is actually painting per pixel, and the map redraws on resize.
        // Map units per screen pixel, taken from the height — the one dimension
        // the stylesheet actually fixes.
        const perPx    = box[3] / mapPx;
        // Whether to name anything beyond the bases is about how much SCREEN
        // there is, which is the host's width, not the map's.
        const smallMap = (host.clientWidth || 900) < 560;
        const FONT     = (smallMap ? 12.5 : 13.5) * perPx;
        const FONT_HUB = (smallMap ? 13.5 : 15) * perPx;
        const CH = FONT * 0.56, LH = FONT * 1.5;
        const OFF = 9 * perPx;                        // dot-to-label gap, in pixels
        const boxes = [];
        const hits = (r) => boxes.some(b =>
            r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y);

        // Right first, then left, then progressively further up and down. The
        // first two keep the label on the same line as its dot, which needs no
        // leader at all.
        const SPOTS = [[1, 0.3], [-1, 0.3], [1, -1], [-1, -1], [1, 1.6], [-1, 1.6],
                       [1, -2.3], [-1, -2.3], [1, 2.9], [-1, 2.9], [1, -3.6], [-1, -3.6]]
            .map(([sx, sy]) => [sx * (OFF + FONT * 0.35), sy * LH]);

        function place(px, py, text, forceFlip, hub) {
            const w = text.length * (hub ? CH * (FONT_HUB / FONT) : CH);
            for (const [dx, dy] of SPOTS) {
                if (forceFlip && dx > 0) continue;     // no room on the right edge
                const x = px + dx;
                const box = { x: dx > 0 ? x : x - w, y: py + dy - LH * 0.72, w, h: LH };
                if (hits(box)) continue;
                boxes.push(box);
                return { x, y: py + dy, anchor: dx > 0 ? 'start' : 'end',
                         leader: Math.abs(dy - SPOTS[0][1]) > 1 };
            }
            return null;                                // give up rather than overprint
        }

        // Every dot is an obstacle, named or not, so a label never lands on one.
        const R_HUB = 6.5 * perPx, R_DOT = 4 * perPx;
        order.forEach(([icao]) => {
            const [x, y] = project(pos[icao][0], pos[icao][1]);
            const r = (hubSet.has(icao) ? R_HUB : R_DOT) + 2 * perPx;
            boxes.push({ x: x * W - r, y: y * H - r, w: r * 2, h: r * 2 });
        });

        const dots = order.map(([icao, r]) => {
            const [x, y] = project(pos[icao][0], pos[icao][1]);
            const px = x * W, py = y * H;
            const cx = px.toFixed(1), cy = py.toFixed(1);
            const isHub = hubSet.has(icao);
            const hub = hubs.find(h => h.icao === icao);
            const label = (isHub ? (hub ? hub.city : icao) : (r ? r.city : icao)) || icao;
            const title = isHub
                ? `${label} (${icao}) — ${hub ? hub.role.toLowerCase() : 'base'}`
                : `${label} (${icao})${r && r.block ? ' · ' + r.block : ''}`;
            const show = isHub || (!smallMap && flagship.has(icao));
            const spot = show ? place(px, py, label, (px - box[0]) / box[2] > 0.78, isHub) : null;
            return `<g class="map__pt${isHub ? ' is-hub' : ''}${show ? ' is-named' : ''}"
                       tabindex="0" role="listitem" aria-label="${esc(title)}"
                       data-icao="${esc(icao)}" data-place="${esc(title)}">
                <title>${esc(title)}</title>
                ${spot && spot.leader ? `<line class="map__leader" x1="${cx}" y1="${cy}"
                          x2="${spot.x.toFixed(1)}" y2="${(spot.y - FONT * 0.3).toFixed(1)}"/>` : ''}
                <circle class="map__halo" cx="${cx}" cy="${cy}" r="${(R_HUB * (isHub ? 1.9 : 1.5)).toFixed(1)}"/>
                <circle class="map__dot"  cx="${cx}" cy="${cy}" r="${(isHub ? R_HUB : R_DOT).toFixed(1)}"/>
                ${spot ? `<text class="map__label" x="${spot.x.toFixed(1)}"
                          y="${spot.y.toFixed(1)}" text-anchor="${spot.anchor}"
                          font-size="${(isHub ? FONT_HUB : FONT).toFixed(1)}"
                          stroke-width="${(FONT * 0.22).toFixed(1)}">${esc(label)}</text>` : ''}
            </g>`;
        }).join('');

        // The labels were placed after the crop was chosen, and a name set beside
        // a dot near the edge lands outside it. Grow the crop to contain what
        // was actually drawn rather than clipping the airline's own bases.
        if (boxes.length) {
            let x0 = box[0], y0 = box[1], x1 = box[0] + box[2], y1 = box[1] + box[3];
            boxes.forEach(b => {
                x0 = Math.min(x0, b.x - OFF); y0 = Math.min(y0, b.y - OFF);
                x1 = Math.max(x1, b.x + b.w + OFF); y1 = Math.max(y1, b.y + b.h + OFF);
            });
            box = [x0, y0, x1 - x0, y1 - y0];
        }
        const finalBox = box.map(v => v.toFixed(0)).join(' ');

        svgEl.setAttribute('viewBox', finalBox);
        svgEl.setAttribute('role', 'list');
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgEl.setAttribute('aria-label',
            `Route map: ${plotted.length} sectors from our bases`);
        svgEl.innerHTML = `<path class="map__land" d="${world.land}"/>
                <g class="map__arcs">${arcs}</g>
                <g class="map__pts">${dots}</g>`;

        const home = hubs.find(h => h.role === 'Primary hub') || hubs[0];
        wireScroll(shell, home && pos[home.icao], box, W, H);
        return plotted.length;
    }

    /* The map is wider than the page, so it opens somewhere sensible rather than
       at longitude zero: the primary hub is brought to the middle of the view.
       Dragging pans it as well as the scrollbar and a swipe, because on a
       desktop there is no obvious way to move a map that has no grab handle. */
    function wireScroll(scroller, homeLL, box, W, H) {
        if (!scroller) return;

        const settle = () => {
            const slack = scroller.scrollWidth - scroller.clientWidth;
            scroller.classList.toggle('is-whole', slack < 4);
            // Only advertise panning when there is enough of it to be worth
            // saying. A wide desktop usually fits the network within a few dozen
            // pixels, and "drag the map sideways" under a map that moves 30px is
            // an instruction to do nothing.
            scroller.classList.toggle('has-pan', slack > 64);
            if (slack < 4 || !homeLL) return;
            // Where the hub sits along the map, as a fraction of its width.
            const [hx] = project(homeLL[0], homeLL[1]);
            const frac = (hx * W - box[0]) / box[2];
            scroller.scrollLeft = Math.max(0, Math.min(slack,
                frac * scroller.scrollWidth - scroller.clientWidth / 2));
        };
        // The SVG has no width until it has laid out, so measure on the next frame.
        requestAnimationFrame(settle);

        // The listeners belong to the scroller, which survives a redraw. Adding
        // them again on every filter press would stack them up.
        if (scroller.__amvPan) return;
        scroller.__amvPan = true;

        let down = false, startX = 0, startLeft = 0, moved = 0;
        scroller.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;      // native scrolling is better
            down = true; moved = 0;
            startX = e.clientX; startLeft = scroller.scrollLeft;
            scroller.classList.add('is-dragging');
        });
        scroller.addEventListener('pointermove', (e) => {
            if (!down) return;
            const dx = e.clientX - startX;
            moved = Math.max(moved, Math.abs(dx));
            scroller.scrollLeft = startLeft - dx;
        });
        const release = () => { down = false; scroller.classList.remove('is-dragging'); };
        scroller.addEventListener('pointerup', release);
        scroller.addEventListener('pointercancel', release);
        scroller.addEventListener('pointerleave', release);
        // A drag that ended on a dot must not also count as a click on it.
        scroller.addEventListener('click', (e) => { if (moved > 5) e.stopPropagation(); }, true);
    }

    /* Label sizing is computed from how wide the host actually is, so a map
       drawn at one width and then resized to another is drawn at the wrong type
       size — a phone rotated to landscape, or a desktop window dragged narrow.
       Every mounted map remembers what it was drawn from and redraws once the
       resize settles. */
    const mounted = new Set();
    let resizeTimer = null;

    function mount(host, routes, opts) {
        if (!host) return 0;
        mounted.add(host);
        host.__amvMap = { routes, opts };
        return draw(host, routes, opts);
    }

    addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            mounted.forEach(host => {
                if (!host.isConnected) { mounted.delete(host); return; }
                const m = host.__amvMap;
                if (m) draw(host, m.routes, m.opts);
            });
        }, 180);
    }, { passive: true });

    window.AMV_MAP = { draw: mount, redraw: draw, project, greatCircle };
})();
