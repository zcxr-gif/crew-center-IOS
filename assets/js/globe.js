/* ============================================================================
   Aeromexico Virtual — globe.js
   The network on a sphere. This is the route map on /network; there is no
   longer a flat one under it.

   Robinson answered "where does the airline fly" and could not answer "how
   far is that", because no flat map can. A globe does not have to choose: the
   great circle to Narita climbs over the Aleutians on screen because that is
   what the aeroplane does, and you can see it leave the disc and come back.

   What the flat map carried and this has to carry instead is the DETAIL — the
   labels, the block times, the rank gate. A turning sphere cannot hold
   twenty-three labels at the size that fits a phone, so it does not try: you
   pick a destination and the globe turns to face it while its sector opens
   beside it. The full table is a tab away, and picking a row there brings you
   back here pointed at that sector. Neither view is a second copy of the
   other — they are the same rows, drawn two ways.

   Nothing here is illustrated, per the rule at the top of brand.css:

     the land    Natural Earth public-domain 1:110m, sampled onto a lat/lon
                 grid by tools/make-globe.py into assets/js/globe-land.js
     the dots    that grid, projected — the crowding towards the poles is the
                 graticule, not a texture someone painted
     the arcs    real great circles between real aerodrome reference points
                 from AMV_DATA.airports
     the colour  brand tokens, read off the live stylesheet so the globe
                 follows the light/dark theme like everything else

   Drawn on a canvas rather than in SVG because the front hemisphere is about
   3,700 dots and they all move every frame; that is a fill loop, not 3,700
   elements the browser has to keep in a tree and restyle.
   ========================================================================== */

(function () {
    'use strict';

    const RAD = Math.PI / 180;

    /* ---- The land ---------------------------------------------------------
       globe-land.js ships one bit per grid cell. Expand it once into unit
       vectors, because the per-frame cost has to be a rotate and a multiply —
       not a trig call per dot per frame. */
    let LAND = null;

    function land() {
        if (LAND) return LAND;
        const src = window.AMV_GLOBE_LAND;
        if (!src) return null;

        const bin = atob(src.bits);
        const xs = [];
        for (let r = 0; r < src.rows; r++) {
            const lat = (src.lat0 - r * src.step) * RAD;
            const cl = Math.cos(lat), sl = Math.sin(lat);
            for (let c = 0; c < src.cols; c++) {
                const k = r * src.cols + c;
                if (!((bin.charCodeAt(k >> 3) >> (7 - (k & 7))) & 1)) continue;
                const lon = (src.lon0 + c * src.step) * RAD;
                // y is up (the polar axis); x towards 0°E on the equator.
                xs.push(cl * Math.cos(lon), sl, cl * Math.sin(lon));
            }
        }
        LAND = new Float32Array(xs);
        return LAND;
    }

    function vec(lat, lon) {
        const a = lat * RAD, o = lon * RAD, c = Math.cos(a);
        return [c * Math.cos(o), Math.sin(a), c * Math.sin(o)];
    }

    /* The turn towards a picked destination. Ease-out with a small overshoot:
       the globe arrives, goes a degree or two past, and settles. A linear or
       plain ease-out turn is correct and feels like a slide transition; the
       overshoot is what makes it feel like something with mass was spun and
       caught. Kept small — at more than about 8% it reads as a wobble. */
    function settle(t) {
        const k = t - 1;
        return 1 + k * k * (2.2 * k + 1.2);
    }

    /* Great circle between two points as unit vectors, lifted off the surface.
       Slerp, so the samples are evenly spaced along the path the aeroplane
       actually flies. The lift is what makes a sector legible on a sphere: a
       line drawn flat on the surface disappears over the horizon halfway
       through, and an arc that rises clear of the limb reads as one sector
       from end to end. It is proportional to the distance flown, so Mexico
       City to Tokyo bows further than Mexico City to Monterrey — the height is
       carrying information, not decorating. */
    function arc(a, b, steps) {
        const p = vec(a[0], a[1]), q = vec(b[0], b[1]);
        const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
        const d = Math.acos(dot);
        const out = new Float32Array((steps + 1) * 3);
        const lift = 0.06 + 0.28 * (d / Math.PI);
        for (let i = 0; i <= steps; i++) {
            const f = i / steps;
            let x, y, z;
            if (d < 1e-6) { x = p[0]; y = p[1]; z = p[2]; }
            else {
                const s1 = Math.sin((1 - f) * d) / Math.sin(d);
                const s2 = Math.sin(f * d) / Math.sin(d);
                x = s1 * p[0] + s2 * q[0];
                y = s1 * p[1] + s2 * q[1];
                z = s1 * p[2] + s2 * q[2];
                const m = Math.hypot(x, y, z);
                x /= m; y /= m; z /= m;
            }
            const r = 1 + lift * Math.sin(Math.PI * f);
            out[i * 3] = x * r; out[i * 3 + 1] = y * r; out[i * 3 + 2] = z * r;
        }
        return out;
    }

    /* Colour comes off the live stylesheet so the globe follows the theme.
       Re-read on every draw setup rather than cached at load: site.js can flip
       data-theme after this file has run. */
    function palette(host) {
        const cs = getComputedStyle(host);
        const tok = (n, fallback) => (cs.getPropertyValue(n) || '').trim() || fallback;
        const dark = matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = document.documentElement.getAttribute('data-theme');
        const onDark = theme === 'dark' || (theme !== 'light' && dark);
        return {
            core:  tok('--am-blue', '#0C2C64'),
            edge:  tok('--am-navy', '#0A1D3B'),
            halo:  tok('--am-blue-300', '#7FA6E8'),
            // An arc crosses two backgrounds: the navy sphere, and — where it
            // bows past the limb — whatever the page is. On dark that is one
            // problem; on the white page a pale blue arc reads on the sphere
            // and vanishes the moment it leaves it. Cobalt is the mid-tone
            // that survives both, and it is already in the palette.
            arc:   onDark ? tok('--am-blue-300', '#7FA6E8') : tok('--am-cobalt', '#1B5FC1'),
            hub:   tok('--am-red', '#D8102F'),
            dot:   onDark ? '#DCE6F7' : '#F4F8FF',
            // The moving head has to clear the arc under it on both grounds.
            head:  onDark ? '#EAF1FF' : tok('--am-blue-300', '#7FA6E8'),
            onDark,
        };
    }

    // '#RRGGBB' -> 'r,g,b', so alpha can vary per dot without re-parsing.
    function rgb(hex) {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    }

    /* ---- Draw -------------------------------------------------------------
       `host` is the element to fill; `routes` is the sector list to plot.
       Returns how many sectors it could place, so the caller can say so —
       same contract as AMV_MAP.draw. Calling it again on the same host reuses
       the canvas and keeps the globe where the reader left it turning. */
    function draw(host, routes, opts) {
        if (!host || !land()) return 0;
        opts = opts || {};

        const D = window.AMV_DATA || {};
        const pos = opts.airports || D.airports || {};
        const hubs = opts.hubs || D.hubs || [];
        const hubSet = new Set(hubs.map(h => h.icao));
        const plotted = (routes || []).filter(r => pos[r.from] && pos[r.to]);

        let state = host._globe;
        if (!state) {
            host.innerHTML = '<canvas class="globe__canvas" role="img"></canvas>';
            state = host._globe = {
                canvas: host.querySelector('.globe__canvas'),
                // The longitude facing the viewer is yaw + 90, so this opens
                // on 75°W: the Americas square on, Mexico City a little left
                // of centre, Europe coming over the right limb and the Pacific
                // going out over the left. Opening on the hub itself would
                // show the network leaving in every direction at once and
                // half of it edge-on; this way the long sectors both start
                // in view and have somewhere to go.
                yaw: -165,
                pitch: 16,
                spin: -0.055,     // degrees per frame, eastward like the Earth
                drag: null,
                t: 0,
                raf: 0,
                live: true,
                sel: null,        // the picked airport, by ICAO
                tween: null,      // the turn towards it, while it is running
                card: null,       // where the page put the detail panel
                // How far off centre the sphere is sitting, as a fraction of
                // the canvas. The card needs room, and a globe that slides
                // over to make it is doing something a reader can follow; a
                // card that lands on top of the planet is just in the way.
                shift: 0, shiftTo: 0, shiftY: 0, shiftYTo: 0,
            };
            wire(host, state);
        }
        // Handlers are kept on the HOST, not only on the state, so a page can
        // register them before the first draw. The state does not exist until
        // draw() has run, and a page that wires its callbacks up front — which
        // is the obvious order to write it in — otherwise silently gets none.
        state.onselect = host._onselect || state.onselect;
        state.onpick = host._onpick || state.onpick;
        const st = state;
        st.canvas.setAttribute('aria-label',
            `The network as a globe: ${plotted.length} sector${plotted.length === 1 ? '' : 's'}`
            + ' drawn as great circles. Drag to turn it, and pick a destination'
            + ' to open its sector.');

        // Everything that does not change between frames, computed once here.
        st.pal = palette(host);
        st.arcs = plotted.map(r => ({
            pts: arc(pos[r.from], pos[r.to], 96),
            flagship: false,
            from: r.from,
            to: r.to,
            row: r,
        }));

        // The longest sector in each region, the same rule map.js uses to pick
        // what to label — so the two views agree about which sectors lead.
        const far = {};
        plotted.forEach((r, i) => {
            const k = r.region || r.tier || 'Network';
            if (!far[k] || (r.dist || 0) > (far[k].dist || 0)) far[k] = i;
        });
        Object.values(far).forEach(i => { st.arcs[i].flagship = true; });

        // One marker per airport, not one per sector.
        const seen = new Map();
        plotted.forEach(r => { seen.set(r.to, r.to); seen.set(r.from, r.from); });
        st.pts = [...seen.keys()].map(icao => ({
            icao,
            v: vec(pos[icao][0], pos[icao][1]),
            lat: pos[icao][0],
            lon: pos[icao][1],
            hub: hubSet.has(icao),
        }));
        st.at = Object.fromEntries(st.pts.map(p => [p.icao, p]));

        // A redraw is a filter change, not a new page. Keep the selection if
        // the destination survived the filter and drop it if it did not —
        // otherwise pressing "Domestic" leaves a card open describing a sector
        // that is no longer on the globe.
        if (st.sel && !st.at[st.sel]) clear(host, st);

        resize(st);
        start(st);
        return plotted.length;
    }

    /* ---- Picking a destination --------------------------------------------
       Turn the globe so the airport faces the viewer, and tell the page which
       one it is so it can open the card. The longitude facing the viewer is
       yaw + 90 and the latitude at the centre is the pitch, so the target
       falls straight out of the projection rather than being searched for.

       The yaw is unwrapped to the nearest equivalent angle first. Without that
       a pick at 170°E from a globe sitting at 170°W turns the long way round —
       350 degrees of spin to travel ten. */
    function select(host, icao) {
        const st = host && host._globe;
        if (!st || !st.at || !st.at[icao]) return false;
        const p = st.at[icao];
        st.sel = icao;

        let toYaw = p.lon - 90;
        toYaw += 360 * Math.round((st.yaw - toYaw) / 360);
        const toPitch = Math.max(-72, Math.min(72, p.lat));

        if (calm()) {
            // No motion means no flight across the planet: it is simply
            // already facing the destination when the card opens.
            st.yaw = toYaw; st.pitch = toPitch; st.tween = null;
        } else {
            st.tween = {
                fromYaw: st.yaw, toYaw, fromPitch: st.pitch, toPitch,
                t0: performance.now(),
                // Long turns take longer, but not proportionally — half a
                // world should not take four times as long as a quarter of it.
                ms: 520 + 380 * Math.min(1, Math.abs(toYaw - st.yaw) / 180),
            };
        }
        st.spin = 0;
        host.classList.add('has-pick');
        if (st.onselect) st.onselect(icao);
        start(st);
        return true;
    }

    function clear(host, st) {
        st = st || (host && host._globe);
        if (!st || !st.sel) return;
        st.sel = null;
        st.tween = null;
        st.card = null;
        if (!calm()) st.spin = -0.055;
        host.classList.remove('has-pick');
        if (st.onselect) st.onselect(null);
        start(st);
    }

    /* ---- Interaction ------------------------------------------------------
       Pointer drag turns it, with the flick carried on afterwards and decaying
       back into the idle spin. touch-action is pan-y (set in brand.css): a
       horizontal drag turns the globe, a vertical one scrolls the page past
       it. Trapping a vertical swipe inside a full-width square on a phone
       would strand the reader, and the tilt is not worth that. Keyboard gets
       both axes, which is also how it stays operable without a pointer. */
    function wire(host, st) {
        const el = st.canvas;

        el.tabIndex = 0;
        el.addEventListener('pointerdown', e => {
            el.setPointerCapture(e.pointerId);
            st.drag = { x: e.clientX, y: e.clientY, vx: 0, moved: 0 };
            // A hand on the globe outranks the turn it was making towards a
            // destination. Without this the tween keeps pulling against the
            // drag and the globe fights the reader for half a second.
            st.tween = null;
            host.classList.add('is-turning');
        });
        el.addEventListener('pointermove', e => {
            if (!st.drag) return;
            const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
            st.drag.x = e.clientX; st.drag.y = e.clientY;
            st.drag.vx = dx * 0.22;
            st.drag.moved += Math.abs(dx) + Math.abs(dy);
            st.lastMoved = st.drag.moved;
            st.yaw += dx * 0.22;
            st.pitch = Math.max(-72, Math.min(72, st.pitch + dy * 0.18));
            start(st);
        });
        const release = () => {
            if (!st.drag) return;
            // A flick carries on; a globe with a destination open stays put,
            // because drifting away from what the card describes is the one
            // thing the idle spin must not do.
            st.spin = st.sel ? 0 : Math.max(-2.4, Math.min(2.4, st.drag.vx));
            st.drag = null;
            host.classList.remove('is-turning');
        };
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);

        el.addEventListener('keydown', e => {
            const k = e.key;
            if (k === 'ArrowLeft') st.yaw -= 6;
            else if (k === 'ArrowRight') st.yaw += 6;
            else if (k === 'ArrowUp') st.pitch = Math.min(72, st.pitch + 5);
            else if (k === 'ArrowDown') st.pitch = Math.max(-72, st.pitch - 5);
            else if (k === 'Escape') { clear(host, st); e.preventDefault(); return; }
            else if (k === 'Enter' || k === ' ') {
                // Keyboard pick: whatever is nearest the middle of the disc,
                // which is what the reader has just turned towards.
                const near = nearest(st);
                if (near) { select(host, near); e.preventDefault(); }
                return;
            }
            else return;
            e.preventDefault();
            st.tween = null;
            st.spin = 0;
            start(st);
        });

        // Naming a point: the nearest marker on the front hemisphere within a
        // finger's width. Reported through a callback so the page owns the
        // wording and the live region, exactly as the flat map does.
        el.addEventListener('pointermove', e => {
            if (st.drag || !st.onpick) return;
            const hit = pick(st, e);
            if (hit !== st.named) { st.named = hit; st.onpick(hit); start(st); }
        });
        el.addEventListener('pointerleave', () => {
            if (st.onpick && st.named) { st.named = null; st.onpick(null); start(st); }
        });
        /* A tap is a pick; a drag is not. `moved` is measured in pointer
           travel rather than by a timer, because a slow deliberate spin and a
           quick tap take about the same time and feel nothing alike. */
        el.addEventListener('pointerup', e => {
            const moved = st.drag ? st.drag.moved : (st.lastMoved || 0);
            st.lastMoved = 0;
            if (moved > 6) return;
            const hit = pick(st, e);
            if (hit) select(host, hit);
            else clear(host, st);
        });

        /* The theme can change under it: site.js flips data-theme on the html
           element, and the OS can flip the scheme with nothing clicked at all.
           Re-read the tokens then rather than on every frame — getComputedStyle
           is not something to call sixty times a second for a colour that
           changes twice a year. */
        const retheme = () => { st.pal = palette(host); start(st); };
        new MutationObserver(retheme).observe(document.documentElement,
            { attributes: true, attributeFilter: ['data-theme'] });
        const scheme = matchMedia('(prefers-color-scheme: dark)');
        if (scheme.addEventListener) scheme.addEventListener('change', retheme);
        const still = matchMedia('(prefers-reduced-motion: reduce)');
        if (still.addEventListener) still.addEventListener('change', () => start(st));

        // Off screen or in a background tab, stop burning frames.
        if (window.IntersectionObserver) {
            new IntersectionObserver(es => {
                st.live = es[0].isIntersecting;
                if (st.live) start(st);
            }, { threshold: 0.01 }).observe(host);
        }
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) start(st);
        });
        const remeasure = () => { resize(st); start(st); };
        if (window.ResizeObserver) new ResizeObserver(remeasure).observe(host);
        else window.addEventListener('resize', remeasure);
    }

    /* What is under the pointer: a marker if one is close enough, otherwise
       an arc. Arcs are pickable because at this scale the domestic sectors
       leave their destination dots inside the hub's halo — the line is the
       only part of a short sector you can reliably hit, and clicking the line
       you can see and getting nothing is the kind of dead spot that makes a
       map feel broken. An arc resolves to its destination, which is what the
       card is about. */
    function pick(st, e) {
        const b = st.canvas.getBoundingClientRect();
        const x = e.clientX - b.left, y = e.clientY - b.top;
        const cam = camera(st);

        let best = null, bestD = 22 * 22;
        for (const p of st.pts) {
            const s = project(cam, p.v[0], p.v[1], p.v[2], st);
            if (s.z <= 0.04) continue;
            const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
            if (d < bestD) { bestD = d; best = p.icao; }
        }
        if (best) return best;

        bestD = 12 * 12;
        for (const a of st.arcs) {
            const pts = a.pts, n = pts.length / 3;
            for (let i = 0; i < n; i += 2) {
                const s = project(cam, pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], st);
                if (s.z < 0 && (s.ox * s.ox + s.oy * s.oy) < 1) continue;
                const d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
                if (d < bestD) { bestD = d; best = a.to; }
            }
        }
        return best;
    }

    // The marker closest to the middle of the disc, for a keyboard pick.
    function nearest(st) {
        const cam = camera(st);
        let best = null, bestD = Infinity;
        for (const p of st.pts) {
            const s = project(cam, p.v[0], p.v[1], p.v[2], st);
            if (s.z <= 0.1) continue;
            const d = s.ox * s.ox + s.oy * s.oy;
            if (d < bestD) { bestD = d; best = p.icao; }
        }
        return best;
    }

    /* ---- Projection -------------------------------------------------------
       Yaw about the polar axis, then pitch towards the viewer, then straight
       orthographic — which is what a planet looks like from far enough away,
       and keeps the outline an honest circle. */
    function camera(st) {
        const y = st.yaw * RAD, p = st.pitch * RAD;
        return { cy: Math.cos(y), sy: Math.sin(y), cp: Math.cos(p), sp: Math.sin(p) };
    }

    function project(cam, x, y, z, st) {
        const rx = cam.cy * x + cam.sy * z;
        const rz = -cam.sy * x + cam.cy * z;
        const ry2 = cam.cp * y - cam.sp * rz;
        const rz2 = cam.sp * y + cam.cp * rz;
        return { x: st.cx + rx * st.R, y: st.cy0 - ry2 * st.R, z: rz2, ox: rx, oy: ry2 };
    }

    function resize(st) {
        const el = st.canvas;
        const w = el.clientWidth || 320, h = el.clientHeight || 320;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
            el.width = Math.round(w * dpr);
            el.height = Math.round(h * dpr);
        }
        st.dpr = dpr;
        st.w = w; st.h = h;
        st.cx = w / 2; st.cy0 = h / 2;
        st.wpx = w; st.hpx = h;
        // Room left for the arcs to bow outside the limb without clipping.
        st.R = Math.min(w, h) / 2 * 0.76;
        st.ctx = el.getContext('2d');
    }

    const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Reduced motion means no motion — not a slower globe, and not a loop
       repainting an identical frame sixty times a second. It draws once and
       stops; a drag, a resize or naming a point wakes it for exactly as long
       as something is actually changing. Everything that calls for a repaint
       calls start(), so there is one way back in rather than several. */
    function start(st) {
        if (st.raf || !st.live || document.hidden) return;
        const step = () => {
            st.raf = 0;

            // The turn towards a picked destination, if one is running. It
            // drives yaw and pitch directly, so it overrides the drift for as
            // long as it lasts and then hands back cleanly.
            if (st.tween) {
                const w = st.tween;
                const k = Math.min(1, (performance.now() - w.t0) / w.ms);
                const e = settle(k);
                st.yaw = w.fromYaw + (w.toYaw - w.fromYaw) * e;
                st.pitch = w.fromPitch + (w.toPitch - w.fromPitch) * e;
                if (k >= 1) st.tween = null;
            }

            // Easing the slide rather than jumping it. Same reason as the
            // turn: the globe is a thing with mass, and it should move like
            // one even when what moved it was a card opening.
            const k = calm() ? 1 : 0.14;
            st.shift  += (st.shiftTo  - st.shift)  * k;
            st.shiftY += (st.shiftYTo - st.shiftY) * k;
            if (Math.abs(st.shiftTo - st.shift) < 0.0004) st.shift = st.shiftTo;
            if (Math.abs(st.shiftYTo - st.shiftY) < 0.0004) st.shiftY = st.shiftYTo;
            st.cx = st.wpx / 2 + st.shift * st.wpx;
            st.cy0 = st.hpx / 2 + st.shiftY * st.hpx;

            render(st);
            const still = calm();
            if (!still) {
                // A destination is open: the globe holds still on it. Drifting
                // off what the card describes is the one thing it must not do.
                if (!st.drag && !st.tween && !st.sel) {
                    st.yaw += st.spin;
                    // Decay a flick back to the idle drift rather than to a
                    // stop, so the globe never sits dead still mid-gesture.
                    st.spin += (-0.055 - st.spin) * 0.012;
                }
                st.t += 1;
            }
            // Keep painting while anything is actually moving: the drift, a
            // drag, a turn in flight, or the pulse under an open card.
            const sliding = st.shift !== st.shiftTo || st.shiftY !== st.shiftYTo;
            if (st.live && !document.hidden && (!still || st.drag || st.tween || sliding)) {
                st.raf = requestAnimationFrame(step);
            }
        };
        st.raf = requestAnimationFrame(step);
    }

    /* ---- One frame -------------------------------------------------------- */
    function render(st) {
        const ctx = st.ctx, pal = st.pal;
        if (!ctx) return;
        const R = st.R, cx = st.cx, cy = st.cy0;

        /* With a destination open, everything that is not part of its sector
           steps back. Not hidden — the rest of the network is still the
           context that makes one sector mean anything — but far enough down
           that the eye goes to the one thing the card is describing. */
        const sel = st.sel;
        const lit = a => !sel || a.to === sel || a.from === sel;
        const DIM = 0.16;

        ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
        ctx.clearRect(0, 0, st.w, st.h);

        // The atmosphere: a ring of light just outside the limb. Drawn first
        // and underneath, so the sphere's own edge stays a clean circle.
        const air = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.28);
        const halo = rgb(pal.halo);
        air.addColorStop(0, `rgba(${halo},${pal.onDark ? 0.24 : 0.2})`);
        air.addColorStop(0.45, `rgba(${halo},0.07)`);
        air.addColorStop(1, `rgba(${halo},0)`);
        ctx.fillStyle = air;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
        ctx.fill();

        // The ocean. Lit from the upper left, which is where the shading on
        // every photograph of the Earth comes from and the only reason the
        // disc reads as a ball rather than a circle.
        const body = ctx.createRadialGradient(
            cx - R * 0.3, cy - R * 0.34, R * 0.04, cx, cy, R * 1.02);
        body.addColorStop(0, pal.core);
        body.addColorStop(0.38, pal.edge);
        body.addColorStop(1, pal.onDark ? '#061225' : '#071429');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        const cam = camera(st);

        /* The land. One square per grid point on the front hemisphere, faded
           towards the limb so the sphere keeps its roundness where the dots
           are most foreshortened. Batched into a handful of alpha buckets:
           setting fillStyle 3,700 times a frame costs more than the fills. */
        const L = LAND, n = L.length / 3;
        const BUCKETS = 5;
        const paths = [];
        for (let i = 0; i < BUCKETS; i++) paths.push(new Path2D());
        const size = Math.max(1, Math.round(R / 168 * 10) / 10) * (st.dpr > 1 ? 1 : 1.1);
        const half = size / 2;

        for (let i = 0; i < n; i++) {
            const x = L[i * 3], y = L[i * 3 + 1], z = L[i * 3 + 2];
            const rx = cam.cy * x + cam.sy * z;
            const rz = -cam.sy * x + cam.cy * z;
            const ry2 = cam.cp * y - cam.sp * rz;
            const rz2 = cam.sp * y + cam.cp * rz;
            if (rz2 <= 0.02) continue;                 // back of the world
            const b = Math.min(BUCKETS - 1, (rz2 * BUCKETS) | 0);
            paths[b].rect(cx + rx * R - half, cy - ry2 * R - half, size, size);
        }
        const dot = rgb(pal.dot);
        const landFade = sel ? 0.62 : 1;
        for (let b = 0; b < BUCKETS; b++) {
            ctx.fillStyle = `rgba(${dot},${(landFade * (0.3 + 0.68 * (b + 0.5) / BUCKETS)).toFixed(3)})`;
            ctx.fill(paths[b]);
        }

        /* The sectors. Each arc is drawn as the runs of it that are actually
           visible: a point is hidden when it is behind the sphere AND inside
           the disc, which is the whole of the occlusion test an orthographic
           projection needs. Break the polyline there and the arc dives behind
           the planet and comes out the other side, instead of being painted
           flat across it. */
        const arcCol = rgb(pal.arc), hubCol = rgb(pal.hub);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const a of st.arcs) {
            const runs = visible(a.pts, cam, st);
            const on = lit(a);
            // Brighter AND heavier when it is the one picked: on a phone,
            // alpha alone does not pull a hairline forward, and weight alone
            // just makes a pale line fat.
            const fade = !sel ? 1 : on ? 1.9 : DIM;
            const A = (v) => Math.min(1, fade * v).toFixed(3);
            ctx.strokeStyle = a.flagship
                ? `rgba(${hubCol},${A(pal.onDark ? 0.66 : 0.62)})`
                : `rgba(${arcCol},${A(pal.onDark ? 0.44 : 0.46)})`;
            ctx.lineWidth = (a.flagship ? 1.7 : 1.15) * (sel && on ? 2.1 : 1);
            for (const run of runs) {
                ctx.beginPath();
                ctx.moveTo(run[0], run[1]);
                for (let i = 2; i < run.length; i += 2) ctx.lineTo(run[i], run[i + 1]);
                ctx.stroke();
            }
        }

        // The traffic. A short bright head running each arc end to end, which
        // is the one thing on the globe that is a flourish rather than a fact
        // — so it goes when the reader has asked for no motion.
        //
        // Tapered from nothing at the tail to full at the nose, along a
        // gradient laid down the run. A constant-width, constant-alpha dash
        // was the first version of this and it read as a scratch on the
        // planet rather than as something travelling along the arc.
        if (!calm()) {
            const headCol = a => a.flagship ? hubCol : rgb(pal.head);
            for (let k = 0; k < st.arcs.length; k++) {
                const a = st.arcs[k];
                const seg = a.pts.length / 3 - 1;
                // Offset per sector so they do not depart in lockstep.
                const phase = ((st.t / 210) + (k * 0.37)) % 1;
                const head = phase * seg;
                const tail = Math.max(0, head - seg * 0.18);
                const col = headCol(a);
                const on = lit(a);
                const fade = on ? 1 : DIM;
                ctx.lineWidth = (a.flagship ? 2.3 : 1.7) * (sel && on ? 1.25 : 1);
                for (const run of visible(a.pts, cam, st, tail, head)) {
                    const n = run.length;
                    const g = ctx.createLinearGradient(run[0], run[1], run[n - 2], run[n - 1]);
                    g.addColorStop(0, `rgba(${col},0)`);
                    g.addColorStop(0.7, `rgba(${col},${(fade * (a.flagship ? 0.6 : 0.5)).toFixed(3)})`);
                    g.addColorStop(1, `rgba(${col},${(fade * (a.flagship ? 0.98 : 0.92)).toFixed(3)})`);
                    ctx.strokeStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(run[0], run[1]);
                    for (let i = 2; i < n; i += 2) ctx.lineTo(run[i], run[i + 1]);
                    ctx.stroke();
                }
            }
        }

        // The airports. Bases in red and larger, which is the one distinction
        // the legend makes.
        const ends = sel ? new Set(st.arcs.filter(lit).flatMap(a => [a.from, a.to])) : null;
        let anchor = null;
        for (const p of st.pts) {
            const s = project(cam, p.v[0], p.v[1], p.v[2], st);
            if (s.z <= 0.02) continue;
            const on = !sel || ends.has(p.icao);
            const fade = Math.min(1, 0.25 + s.z * 1.5) * (on ? 1 : DIM);
            const col = p.hub ? hubCol : arcCol;
            const r = (p.hub ? 3.2 : 2) * (p.icao === sel ? 1.5 : 1);
            if (p.icao === sel) anchor = s;

            ctx.fillStyle = `rgba(${col},${(0.13 * fade).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r * 2.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(${col},${fade.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fill();
            if (p.icao === st.named && p.icao !== sel) {
                ctx.strokeStyle = `rgba(${dot},0.9)`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(s.x, s.y, r * 3.4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        /* The pick itself: two rings going out of it, half a cycle apart, so
           there is always one leaving. This is the only thing on the globe
           that says "here, this one" once the card is open, and a single ring
           reads as a still target rather than as a signal. Under reduced
           motion it is one plain ring — a target, which is the honest static
           version of a pulse. */
        if (anchor) {
            const base = (st.at[sel] && st.at[sel].hub) ? hubCol : arcCol;
            if (calm()) {
                ctx.strokeStyle = `rgba(${base},0.8)`;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.arc(anchor.x, anchor.y, 13, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                for (let i = 0; i < 2; i++) {
                    const f = ((st.t / 78) + i * 0.5) % 1;
                    ctx.strokeStyle = `rgba(${base},${(0.75 * (1 - f) * (1 - f)).toFixed(3)})`;
                    ctx.lineWidth = 1.8 * (1 - f) + 0.5;
                    ctx.beginPath();
                    ctx.arc(anchor.x, anchor.y, 6 + f * 22, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            /* And the leader out to the card, so the panel reads as something
               the globe put there rather than as a box that appeared next to
               it. Drawn to the nearest point on the card's edge — clamping the
               marker into the rect gives exactly that, since the marker is
               always outside it. The page hands us the rect; if it has not,
               there is simply no leader. */
            const c = st.card;
            if (c) {
                const ex = Math.max(c.x, Math.min(anchor.x, c.x + c.w));
                const ey = Math.max(c.y, Math.min(anchor.y, c.y + c.h));
                const g = ctx.createLinearGradient(anchor.x, anchor.y, ex, ey);
                g.addColorStop(0, `rgba(${base},0.75)`);
                g.addColorStop(1, `rgba(${base},0.12)`);
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(anchor.x, anchor.y);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    /* The visible runs of a polyline, as flat [x,y,x,y,…] screen arrays.
       `from`/`to` clip it to a span of samples, which is how the moving head
       is drawn without building a second geometry for it. */
    function visible(pts, cam, st, from, to) {
        const n = pts.length / 3 - 1;
        const a = from == null ? 0 : Math.max(0, Math.floor(from));
        const b = to == null ? n : Math.min(n, Math.ceil(to));
        const runs = [];
        let run = null;
        for (let i = a; i <= b; i++) {
            const s = project(cam, pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], st);
            // Behind the sphere and within its silhouette: the planet is in
            // the way. Outside the silhouette it is over the limb and visible.
            const hidden = s.z < 0 && (s.ox * s.ox + s.oy * s.oy) < 1;
            if (hidden) { run = null; continue; }
            if (!run) { run = []; runs.push(run); }
            run.push(s.x, s.y);
        }
        return runs.filter(r => r.length >= 4);
    }

    window.AMV_GLOBE = {
        draw,
        /* Called with an ICAO when the reader points at one, and with null
           when they leave. The page writes the sentence, not this file. */
        onpick(host, fn) {
            if (!host) return;
            host._onpick = fn;
            if (host._globe) host._globe.onpick = fn;
        },
        /* Called with an ICAO when one is PICKED, and with null when the pick
           is dropped. The page opens and closes the card; this file only ever
           says which destination, never what to say about it. */
        onselect(host, fn) {
            if (!host) return;
            host._onselect = fn;
            if (host._globe) host._globe.onselect = fn;
        },
        select,
        clear(host) { clear(host); },
        selected(host) { return (host && host._globe && host._globe.sel) || null; },
        /* Where the page put the card, in canvas pixels, so the leader can
           reach it. Passing null drops the leader. */
        anchor(host, rect) {
            const st = host && host._globe;
            if (!st) return;
            st.card = rect;
            start(st);
        },
        /* Slide the sphere off centre to clear room for the card. `x` and `y`
           are fractions of the canvas; (0, 0) puts it back. */
        offset(host, x, y) {
            const st = host && host._globe;
            if (!st) return;
            st.shiftTo = x || 0;
            st.shiftYTo = y || 0;
            start(st);
        },
    };
})();
