/* ============================================================================
   Aeromexico Virtual — globe.js
   The network on a sphere, above the flat map on /network.

   The flat map answers "where does the airline fly"; it cannot answer "how far
   is that", because no flat map can. Robinson puts Tokyo and Madrid at roughly
   honest distances from Mexico City and lies about everything near the poles,
   which is the best a rectangle does. A globe does not have to choose: the
   great circle to Narita climbs over the Aleutians on screen because that is
   what the aeroplane does, and you can see it leave the disc and come back.

   So this is an addition, not a replacement. The flat map below still carries
   the tier filter, the placed labels and the pannable detail — everything you
   read. This one is the thing you turn.

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
            };
            wire(host, state);
        }
        const st = state;
        st.canvas.setAttribute('aria-label',
            `The network as a globe: ${plotted.length} sector${plotted.length === 1 ? '' : 's'}`
            + ' drawn as great circles. Drag to turn it.');

        // Everything that does not change between frames, computed once here.
        st.pal = palette(host);
        st.arcs = plotted.map(r => ({
            pts: arc(pos[r.from], pos[r.to], 96),
            flagship: false,
            to: r.to,
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
            hub: hubSet.has(icao),
        }));

        resize(st);
        start(st);
        return plotted.length;
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
            host.classList.add('is-turning');
        });
        el.addEventListener('pointermove', e => {
            if (!st.drag) return;
            const dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
            st.drag.x = e.clientX; st.drag.y = e.clientY;
            st.drag.vx = dx * 0.22;
            st.drag.moved += Math.abs(dx) + Math.abs(dy);
            st.yaw += dx * 0.22;
            st.pitch = Math.max(-72, Math.min(72, st.pitch + dy * 0.18));
            start(st);
        });
        const release = () => {
            if (!st.drag) return;
            st.spin = Math.max(-2.4, Math.min(2.4, st.drag.vx));
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
            else return;
            e.preventDefault();
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
        el.addEventListener('pointerup', e => {
            if (st.onpick && st.drag === null) {
                const hit = pick(st, e);
                if (hit) { st.named = hit; st.onpick(hit); start(st); }
            }
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
            render(st);
            const still = calm();
            if (!still) {
                if (!st.drag) {
                    st.yaw += st.spin;
                    // Decay a flick back to the idle drift rather than to a
                    // stop, so the globe never sits dead still mid-gesture.
                    st.spin += (-0.055 - st.spin) * 0.012;
                }
                st.t += 1;
            }
            if (st.live && !document.hidden && (!still || st.drag)) {
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
        for (let b = 0; b < BUCKETS; b++) {
            ctx.fillStyle = `rgba(${dot},${(0.3 + 0.68 * (b + 0.5) / BUCKETS).toFixed(3)})`;
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
            ctx.strokeStyle = a.flagship
                ? `rgba(${hubCol},${pal.onDark ? 0.66 : 0.62})`
                : `rgba(${arcCol},${pal.onDark ? 0.44 : 0.46})`;
            ctx.lineWidth = a.flagship ? 1.7 : 1.15;
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
                ctx.lineWidth = a.flagship ? 2.3 : 1.7;
                for (const run of visible(a.pts, cam, st, tail, head)) {
                    const n = run.length;
                    const g = ctx.createLinearGradient(run[0], run[1], run[n - 2], run[n - 1]);
                    g.addColorStop(0, `rgba(${col},0)`);
                    g.addColorStop(0.7, `rgba(${col},${a.flagship ? 0.6 : 0.5})`);
                    g.addColorStop(1, `rgba(${col},${a.flagship ? 0.98 : 0.92})`);
                    ctx.strokeStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(run[0], run[1]);
                    for (let i = 2; i < n; i += 2) ctx.lineTo(run[i], run[i + 1]);
                    ctx.stroke();
                }
            }
        }

        // The airports. Bases in red and larger, the same distinction the flat
        // map's legend already explains.
        for (const p of st.pts) {
            const s = project(cam, p.v[0], p.v[1], p.v[2], st);
            if (s.z <= 0.02) continue;
            const fade = Math.min(1, 0.25 + s.z * 1.5);
            const col = p.hub ? hubCol : arcCol;
            const r = p.hub ? 3.2 : 2;
            ctx.fillStyle = `rgba(${col},${(0.13 * fade).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r * 2.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(${col},${fade.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fill();
            if (p.icao === st.named) {
                ctx.strokeStyle = `rgba(${dot},0.9)`;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.arc(s.x, s.y, r * 3.4, 0, Math.PI * 2);
                ctx.stroke();
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
        onpick(host, fn) { if (host && host._globe) host._globe.onpick = fn; },
    };
})();
