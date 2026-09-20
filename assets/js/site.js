/* ============================================================================
   Aeromexico Virtual — site.js
   Shared chrome for every page: the mark, the icon set, nav, footer, theme,
   scroll reveal and count-ups.

   Pages stay static HTML for their own content; only the repeated chrome is
   injected, so a nav change lands everywhere at once. A <noscript> nav in each
   page covers the no-JS case.
   ========================================================================== */

(function () {
    'use strict';

    // ---- The mark -----------------------------------------------------------
    // The Caballero Águila. There is no geometry in this file: brand.css paints
    // assets/img/mark.svg through a CSS mask (.mark), so one file serves the
    // nav, the footer and the favicon, recolours per theme, and there is no
    // second copy here to drift out of step. See tools/trace-mark.py to
    // regenerate it from the source bitmap.
    const MARK = '<span class="mark" role="img" aria-label="Aeromexico Virtual"></span>';

    // ---- Icons (inline; no icon-font CDN to wait on) ------------------------
    const P = {
        menu: 'M4 12h16M4 6h16M4 18h16',
        x: 'M18 6 6 18M6 6l12 12',
        sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4',
        moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
        arrow: 'M5 12h14M12 5l7 7-7 7',
        plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
        users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
        route: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15M6 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6M18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
        calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
        shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
        award: 'M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12M15.5 12.9 17 22l-5-3-5 3 1.5-9.1',
        pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
        external: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
        check: 'M20 6 9 17l-5-5',
        clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 6v6l4 2',
        gauge: 'm12 14 4-4M3.34 19a10 10 0 1 1 17.32 0',
        trend: 'M16 7h6v6m0-6-8.5 8.5-5-5L2 17',
        book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
        radio: 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14',
        login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
    };

    function icon(name, cls) {
        const d = P[name];
        if (!d) return '';
        return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    }

    // ---- Site map -----------------------------------------------------------
    // Home is listed first and named, rather than being the brand lockup only:
    // the review's finding was that there was no Home entry and no obvious way
    // back to it, and a wordmark is a way back only to somebody who already
    // knows that. /about and /staff are both here now too — the About us page
    // was buried under "Airline" and the Staff page was reachable from the
    // footer alone, which is the second half of the same finding.
    //
    // "Join" is "Apply", which is what the page actually is and what the review
    // asked it be called. /join still resolves (see _redirects) so nothing
    // already linked to it breaks.
    const LINKS = [
        { href: '/',          label: 'Home' },
        { href: '/fleet',     label: 'Fleet' },
        { href: '/network',   label: 'Network' },
        { href: '/ranks',     label: 'Ranks' },
        { href: '/events',    label: 'Events' },
        { href: '/about',     label: 'About us' },
        { href: '/staff',     label: 'Staff' },
        { href: '/apply',     label: 'Apply' },
    ];
    // /crew is our own page, which frames the Inflight crew center in this
    // site's chrome. CREW_DIRECT is the same crew center without the frame —
    // used where an embedded sign-in would be the wrong offer.
    const CREW_URL = '/crew';
    const CREW_DIRECT = 'https://inflight.info/crew/aeromexico-virtual';

    // Match "/fleet", "/fleet.html" and "/fleet/" to the same nav entry. The
    // aliases in _redirects serve one page from several paths, so they collapse
    // here too or the nav marks nothing as current when a visitor arrives on
    // one of them.
    // "/index" is the home page served by its own filename, which is how it is
    // reached from a plain file server and from any link written to
    // /index.html — without this the new Home entry is the one nav item that
    // never marks itself current.
    const ALIAS = { '/index': '/', '/join': '/apply', '/routes': '/network',
                    '/airline': '/about', '/team': '/staff' };
    function normalize(path) {
        let p = (path || '/').replace(/\.html$/, '').replace(/\/+$/, '');
        p = p === '' ? '/' : p.toLowerCase();
        return ALIAS[p] || p;
    }
    const HERE = normalize(location.pathname);

    // ---- Nav ----------------------------------------------------------------
    function renderNav(host) {
        const links = LINKS.map(l =>
            `<a href="${l.href}"${normalize(l.href) === HERE ? ' aria-current="page"' : ''}>${l.label}</a>`
        ).join('');

        // The flagline is INSIDE the bar now. The nav is a floating island with
        // rounded corners, and the tricolour is drawn along its top edge where
        // the island's own radius clips it — a flag that belongs to the header
        // rather than a separate strip pinned above it. See NAV in brand.css.
        host.innerHTML = `
        <nav class="nav" id="siteNav">
            <div class="flagline" aria-hidden="true"></div>
            <div class="wrap nav__inner">
                <a class="nav__brand" href="/" data-nav-brand aria-label="Aeromexico Virtual — home">
                    ${MARK}
                    <span class="wordmark"><b>Aeromexico</b><span>Virtual</span></span>
                </a>
                <div class="nav__links">${links}</div>
                <div class="nav__actions">
                    <button class="icon-btn" id="themeBtn" type="button"
                        aria-label="Switch colour theme" title="Switch colour theme"></button>
                    <a class="btn btn--primary btn--sm" href="${CREW_URL}">
                        ${icon('login')} Crew Center
                    </a>
                    <button class="icon-btn nav__toggle" id="navToggle" type="button"
                        aria-label="Open menu" aria-expanded="false" aria-controls="navMenu">${icon('menu')}</button>
                </div>
            </div>
            <div class="nav__menu" id="navMenu">
                ${LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
                <a class="btn btn--primary" href="${CREW_URL}">${icon('login')} Crew Center</a>
            </div>
        </nav>`;

        const nav = host.querySelector('#siteNav');
        const toggle = host.querySelector('#navToggle');
        const menu = host.querySelector('#navMenu');

        toggle.addEventListener('click', () => {
            const open = menu.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            toggle.innerHTML = icon(open ? 'x' : 'menu');
        });
        // A resize past the desktop breakpoint leaves the panel hidden by CSS but
        // still flagged open; reset so the button state stays honest.
        addEventListener('resize', () => {
            if (innerWidth >= 992 && menu.classList.contains('is-open')) {
                menu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.innerHTML = icon('menu');
            }
        }, { passive: true });

        // The bar carries its own stuck treatment (opacity, the navy→red edge);
        // the HOST carries the scrim that fades the content into it, because a
        // fade drawn inside the bar would sit above the blur instead of below
        // the bar. Both get the flag so neither needs `:has()` to find the
        // other. See the NAV block in brand.css.
        const onScroll = () => {
            const stuck = scrollY > 8;
            nav.classList.toggle('is-stuck', stuck);
            host.classList.toggle('is-stuck', stuck);
        };
        addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        wireTheme(host.querySelector('#themeBtn'));
    }

    // ---- Footer -------------------------------------------------------------
    // Four columns on a desktop; the three link columns pair up on a phone
    // rather than stacking into a fifth screen of scrolling. The reviewer note
    // was that this footer is too long on mobile, and it was: four stacked
    // columns, a four-line blurb and a five-line disclaimer ran to most of a
    // viewport on its own.
    function renderFooter(host) {
        host.innerHTML = `
        <footer class="footer">
            <div class="wrap">
                <div class="footer__grid">
                    <div class="footer__brand">
                        ${MARK}
                        <p>An Infinite Flight virtual airline flying the Aeroméxico network from
                           Mexico City.</p>
                        <p class="footer__origin"><span class="flag" aria-hidden="true"></span> Hecho en México</p>
                    </div>
                    <div class="footer__cols">
                        <div>
                            <h4>Airline</h4>
                            <ul>
                                <li><a href="/about">About us</a></li>
                                <li><a href="/staff">Staff</a></li>
                                <li><a href="/fleet">Fleet</a></li>
                                <li><a href="/network">Route network</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Pilots</h4>
                            <ul>
                                <li><a href="/ranks">Ranks &amp; progression</a></li>
                                <li><a href="/events">Events</a></li>
                                <li><a href="/apply">Apply to fly</a></li>
                                <li><a href="${CREW_DIRECT}/status">Application status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Crew</h4>
                            <ul>
                                <li><a href="${CREW_URL}">Crew Center</a></li>
                                <li><a href="https://inflight.info" rel="noopener">Live map</a></li>
                                <li><a href="https://community.infiniteflight.com/" rel="noopener">Infinite Flight Community</a></li>
                                <li><a href="mailto:crew@aeromexicova.org">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="footer__base">
                    <p class="disclaimer">
                        Aeromexico Virtual is a non-commercial virtual airline operating inside the
                        flight simulator Infinite Flight, in compliance with the IFVARB. It is not
                        affiliated with, endorsed by, or connected to Aerovías de México, S.A. de
                        C.V. (Aeroméxico). No real tickets, flights or services are sold.
                    </p>
                    <p>&copy; <span data-year></span> Aeromexico Virtual · Powered by
                       <a href="https://inflight.info" rel="noopener">Inflight</a></p>
                </div>
            </div>
        </footer>`;
    }

    // ---- Theme --------------------------------------------------------------
    // Stored under the same key the Crew Center reads, so a pilot who picks dark
    // here lands in a dark crew center too (see crewBrand.js in the tracker).
    const THEME_KEY = 'amv:theme';

    function currentTheme() {
        const set = document.documentElement.getAttribute('data-theme');
        if (set === 'dark' || set === 'light') return set;
        return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function wireTheme(btn) {
        if (!btn) return;
        const paint = () => {
            const dark = currentTheme() === 'dark';
            btn.innerHTML = icon(dark ? 'sun' : 'moon');
            btn.title = dark ? 'Switch to light' : 'Switch to dark';
        };
        btn.addEventListener('click', () => {
            const next = currentTheme() === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
            paint();
        });
        // The theme is not only ever set from this button. /crew adopts the one
        // the visitor picks inside the framed crew center, and repainting only
        // on click left this icon offering "switch to dark" on an already-dark
        // page. Watching the attribute covers every route in, present or later.
        new MutationObserver(paint).observe(document.documentElement, {
            attributes: true, attributeFilter: ['data-theme'],
        });
        paint();
    }

    // ---- Scroll reveal ------------------------------------------------------
    //
    //   <div data-reveal>                     rises into place
    //   <div data-reveal="fade">              fades on the spot (maps, imagery)
    //   <div data-reveal="lift">              a longer arrival (a section head)
    //   <div data-reveal data-reveal-delay="80">        …80ms behind
    //   <div class="grid" data-reveal-group>  each CHILD in turn
    //
    // The last one is the point. A grid used to be a single [data-reveal], so
    // six cards appeared as one slab; where a page did stagger them by hand it
    // typed the delays in, and on the home page that meant 0/80/160 on the
    // first row and 0/80/160 AGAIN on the second — the cascade restarting
    // halfway down, which is the thing that read as broken. A group works the
    // count out from the child's position, so a grid of any size cascades once
    // and a row added later needs nothing typed in.
    //
    // A group is observed as a whole and shows its children together, rather
    // than each child waiting to cross the line on its own: a card that is
    // third in the run should arrive third, not whenever the scroll happens to
    // reach it.
    //
    // Delays are CSS variables, never setTimeout — see the REVEAL block in
    // brand.css for why.
    //
    // Elements are marked once wired, so refresh() can safely re-scan after a
    // page script injects more markup without double-observing what's already in.
    let revealIO = null;

    const REVEAL_STEP = 70;   // ms between one child and the next
    const REVEAL_CAP  = 8;    // …stops counting here, so a long list never
                              //    takes two seconds to finish arriving

    function show(el) {
        el.classList.add('is-in');
        if (el.hasAttribute('data-reveal-group')) {
            el.querySelectorAll('[data-reveal]').forEach(c => c.classList.add('is-in'));
        }
    }

    function wireReveal() {
        // 1. Groups: give every child its place in the run and wire it to the
        //    group, not to the observer.
        document.querySelectorAll('[data-reveal-group]:not([data-reveal-staged])').forEach(g => {
            // AN EMPTY GROUP IS NOT A STAGED GROUP. Marking it anyway is a bug
            // with a long fuse: every group on the home page is filled by the
            // page's own script, and hero.js calls refresh() — which runs this
            // pass over the whole document — BEFORE that script runs. The
            // group got stamped while it had no children, the :not() above
            // skipped it ever after, and its cards ended up with no stagger at
            // all. They were visible, so nothing looked broken; they simply
            // never animated while everything around them did.
            //
            // Leaving it unstamped costs one more querySelectorAll on the next
            // refresh and is the whole fix.
            if (!g.children.length) return;
            g.dataset.revealStaged = '1';
            const step = +(g.dataset.revealStep || REVEAL_STEP);
            const base = +(g.dataset.revealDelay || 0);
            const kind = g.getAttribute('data-reveal-group') || '';
            Array.from(g.children).forEach((child, i) => {
                child.setAttribute('data-reveal', kind);
                // A delay typed onto the child wins: a group is a default, not
                // a rule, and a page that meant something by a specific number
                // should keep it.
                if (!child.hasAttribute('data-reveal-delay')) {
                    child.style.setProperty('--reveal-delay', (base + Math.min(i, REVEAL_CAP) * step) + 'ms');
                }
                child.dataset.revealWired = '1';     // the group shows it
            });
        });

        // 2. A hand-set delay becomes the same variable, so both routes end up
        //    scheduled by the browser rather than by a timer.
        document.querySelectorAll('[data-reveal][data-reveal-delay]:not([data-reveal-timed])').forEach(el => {
            el.dataset.revealTimed = '1';
            el.style.setProperty('--reveal-delay', (+el.dataset.revealDelay || 0) + 'ms');
        });

        const items = document.querySelectorAll(
            '[data-reveal]:not([data-reveal-wired]), [data-reveal-group]:not([data-reveal-wired])');
        if (!items.length) return;

        if (!('IntersectionObserver' in window)) {
            items.forEach(el => { el.dataset.revealWired = '1'; show(el); });
            return;
        }
        if (!revealIO) {
            // threshold 0 with the viewport's foot pulled up: an element starts
            // arriving as its top crosses 88% of the way down the screen,
            // whatever its height. The old rule wanted 12% of the element
            // visible, so a tall block had to be a couple of hundred pixels in
            // before it began — you were already reading it when it appeared.
            revealIO = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (!e.isIntersecting) return;
                    show(e.target);
                    revealIO.unobserve(e.target);
                });
            }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
        }

        items.forEach(el => {
            el.dataset.revealWired = '1';
            // Anything already scrolled PAST is shown outright. An observer
            // only ever fires on the way in, so landing on a #hash and
            // scrolling back up used to leave everything above it at opacity 0.
            if (el.getBoundingClientRect().bottom < 0) show(el);
            else revealIO.observe(el);
        });
    }

    // ---- Count-up -----------------------------------------------------------
    // <b data-count="1240" data-suffix="+">0</b>
    function wireCounters() {
        const nums = document.querySelectorAll('[data-count]:not([data-count-wired])');
        if (!nums.length) return;
        nums.forEach(el => { el.dataset.countWired = '1'; });
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

        const run = (el) => {
            const target = +el.dataset.count || 0;
            const suffix = el.dataset.suffix || '';
            if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
            const dur = 1100;
            const t0 = performance.now();
            const tick = (now) => {
                const p = Math.min(1, (now - t0) / dur);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased).toLocaleString() + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
        }, { threshold: .4 });
        nums.forEach(el => io.observe(el));
    }

    // ---- Fleet media --------------------------------------------------------
    // A type's own airframe when the airline has a photograph of it, the mark
    // when it doesn't. Both the home page preview and the fleet page render
    // fleet entries, and the fallback has to behave the same in each, so this
    // lives here rather than being written out twice and drifting.
    //
    // The dimensions come off the file (see data.js) and go on the tag: the
    // photos are hosted off-site, so without them the card has no height until
    // the image lands and the whole grid jumps when it does.
    function attr(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    // The mark rides along with the photo as a small tail badge in the type's
    // own livery colour — the per-type colour cycle predates the photographs
    // and was carrying each card on its own; a photograph is no reason to lose
    // it. aria-hidden because the photo's alt already names the aircraft, and
    // a second "Aeromexico Virtual" on every card is noise in a screen reader.
    function fleetMedia(a) {
        const p = a && a.photo;
        if (!p || !p.src) return MARK;
        const reg = p.reg ? ` ${p.reg}` : '';
        return `<img class="fleet-photo" src="${attr(p.src)}"
                     width="${Number(p.w) || 1920}" height="${Number(p.h) || 886}"
                     loading="lazy" decoding="async"
                     alt="${attr((a.livery || 'Aeromexico') + ' ' + a.type + reg)}">` +
               `<span class="fleet-badge" aria-hidden="true"><span class="mark"></span></span>`;
    }

    // ---- Rank ladder arithmetic ---------------------------------------------
    // The Operations Plan says a route is offered to a pilot whose rank permits
    // BOTH the aircraft and the block time, and that the crew centre enforces
    // that at booking. So the minimum rank for a sector is not a fact anyone
    // types in — it is the higher of those two, computed off the ladder. Change
    // a threshold in data.js and every route re-ranks itself; nothing goes
    // stale, and the network page cannot contradict the ranks page.

    // "10h 05m" -> 10.083. Also copes with "45m" and "3h".
    function blockHours(block) {
        if (typeof block === 'number') return block;
        const m = String(block || '').match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/);
        if (!m) return 0;
        return (+m[1] || 0) + (+m[2] || 0) / 60;
    }

    // Ranks reached by flying, in ladder order. Aeroméxico Airman is awarded
    // rather than earned, so it can never be the ANSWER to "what do I need".
    function earnedRanks(ranks) {
        return (ranks || []).filter(r => !r.appointed);
    }

    function minRankFor(route, ranks, fleet) {
        const ladder = earnedRanks(ranks);
        if (!ladder.length) return null;

        const ac = (fleet || []).find(a => a.short === route.ac || a.type === route.ac);
        const byAircraft = ac ? ladder.findIndex(r => r.name === ac.releasedAt) : -1;

        const hours = blockHours(route.block);
        // An uncapped rank (sectorHours null) clears any sector; a rank with a
        // cap clears a sector only if the filed block fits inside it.
        let byBlock = ladder.findIndex(r => r.sectorHours == null || hours <= r.sectorHours + 1e-9);
        if (byBlock < 0) byBlock = ladder.length - 1;

        // A route with no block time only has the aircraft to go on, and a
        // route flown by a type we do not list only has the block time. Either
        // is a partial answer and is better than none; neither is invented.
        const i = Math.max(byAircraft, hours ? byBlock : -1);
        return i < 0 ? null : ladder[i];
    }

    /* Initials for a portrait plate. "_ServerNoob" is SN, not SE: an IFC handle
       is usually camel-cased or underscore-separated, so its word starts and
       its internal capitals are the initials a person would actually write.
       Digits are not initials, so they are only ever picked up by the
       first-two-characters fallback ("Randomaviator2" → RA). */
    function monogram(name) {
        const parts = String(name || '').split(/[^A-Za-z0-9]+/).filter(Boolean);
        const caps = parts.length > 1
            ? parts.slice(0, 2).map(w => w[0])
            : (parts[0] || '').match(/[A-Z]/g) || [];
        const from = caps.length >= 2 ? caps : (parts[0] || '').split('');
        return from.slice(0, 2).join('').toUpperCase() || '—';
    }

    /* ---- Naming and timing a sector ---------------------------------------
       The review found LIRF and KSFO on the map carrying nothing but their own
       ICAO code, and no duration against either. Both are the same bug: the
       network page takes a destination's city and its scheduled block time from
       its record in data.js, and a sector opened in the crew centre has no
       record in data.js to take them from.

       These three fill the gap without inventing anything.

       placeOf   — the airport's real city, from AMV_DATA.places. A code with no
                   entry stays a code: a guessed place name is a wrong one.
       distanceNm— the great-circle distance, from the two aerodrome reference
                   points. This is arithmetic on published coordinates, not an
                   estimate, so it is returned plain.
       estBlock  — a block time worked out from that distance. This one IS an
                   estimate and is never returned as though it were scheduled:
                   it comes back flagged, and every caller prints it with a "≈"
                   and says so in the tooltip. A route with a real block time in
                   data.js keeps it; this only ever fills an empty field.

       The estimate is 50 minutes plus distance ÷ 490 kt. It is not a guess at
       what those numbers ought to be: it is the least-squares fit of the
       twenty-three scheduled block times already in data.js against their own
       distances, so it reproduces this airline's published schedule rather than
       a generic one. It is within 10 minutes on every sector to 4,000 nm and
       within 40 on the two 6,000-nm Pacific runs. Re-fit it if the schedule
       changes shape. */
    function placeOf(icao) {
        const P = (window.AMV_DATA || {}).places || {};
        return P[String(icao || '').toUpperCase()] || '';
    }

    function distanceNm(a, b) {
        if (!a || !b) return 0;
        const rad = Math.PI / 180, R = 3440.065;
        const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
        const h = Math.sin(dLat / 2) ** 2
                + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
        return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
    }

    function estBlock(nm) {
        const d = Number(nm) || 0;
        if (d <= 0) return '';
        const mins = Math.round(50 + (d / 490) * 60);
        const h = Math.floor(mins / 60), m = mins % 60;
        return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
    }

    /* Fill in what a sector is missing, and SAY which fields were filled.
       Returns a new object — the caller's row is never mutated, because the
       same row is handed to the map and to the list and a silent mutation in
       one would surface in the other. `estimated` is true when the block time
       on the way out is this file's arithmetic rather than a published
       schedule; nothing prints it without that qualifier. */
    function enrichRoute(r, coords) {
        const pos = coords || (window.AMV_DATA || {}).airports || {};
        const out = Object.assign({}, r);
        if (!out.city) out.city = placeOf(out.to);
        if (!out.fromCity) out.fromCity = placeOf(out.from);
        if (!out.dist) out.dist = distanceNm(pos[out.from], pos[out.to]);
        if (!out.block && out.dist) { out.block = estBlock(out.dist); out.estimated = true; }
        return out;
    }

    // ---- Boot ---------------------------------------------------------------
    // refresh() is the same pass boot() runs, minus the chrome. Page scripts that
    // inject markup call AMV.refresh() afterwards so their [data-reveal] /
    // [data-count] / [data-icon] nodes get picked up too — without it, injected
    // reveal elements would sit at opacity 0 forever.
    function refresh(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-icon]:empty').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
        scope.querySelectorAll('[data-mark]:empty').forEach(el => { el.innerHTML = MARK; });
        // The year used to be written by renderFooter alone, so it was blank on
        // any page carrying a [data-year] outside the footer — /crew, which
        // states its own copyright line rather than the whole footer, was the
        // first. It belongs in the pass that fills every other placeholder.
        scope.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
        wireReveal();
        wireCounters();
    }

    /* ---- The apply tab ------------------------------------------------------
       A tab down the right edge that opens a drawer along the foot of the
       screen — the pattern the VA pointed at on coronausa.com. It is the one
       thing on this site that follows you between pages, so it has to earn
       that: it carries the single action the whole site is asking for, and
       nothing else.

       WHAT IT IS NOT is the thing that pattern is usually used for. Corona's
       drawer is an email capture — address, date of birth, postcode, in
       exchange for a discount. There is no list to add anyone to here, so a
       form that pretended otherwise would be collecting real addresses into
       nothing, which is worse than not asking. This is a sentence and the
       button that was already on the page.

       It is a disclosure, not a dialogue: no overlay, no focus trap, nothing
       underneath it goes inert. You can ignore it and keep reading, which is
       the whole difference between this and a pop-up.

       NOT SHOWN where it would be noise: on /apply, which IS the thing it
       points at, and on /crew, which is one viewport tall by design and has
       no room for furniture over it. */
    const APPLY_SKIP = ['/apply', '/crew'];

    function renderApplyTab() {
        if (APPLY_SKIP.includes(HERE)) return;

        const host = document.createElement('div');
        host.className = 'applytab';
        host.innerHTML = `
            <button class="applytab__tab" type="button" aria-expanded="false"
                    aria-controls="applyDrawer">
                <span>Apply to fly</span>
                ${icon('arrow')}
            </button>
            <div class="applytab__drawer" id="applyDrawer" hidden>
                <div class="wrap applytab__inner">
                    <div class="applytab__say">
                        <p class="applytab__head">The eagle flies at 0600.</p>
                        <p class="applytab__sub">
                            Grade&nbsp;2 and an Infinite Flight Pro subscription is the whole bar.
                            The application takes about three minutes and a person answers it
                            inside 72&nbsp;hours.
                        </p>
                    </div>
                    <div class="applytab__do">
                        <a class="btn btn--primary" href="/apply">Apply to fly ${icon('arrow')}</a>
                        <a class="btn btn--ghost btn--sm" href="/ranks">What you would fly</a>
                    </div>
                    <button class="icon-btn applytab__close" type="button"
                            aria-label="Close">${icon('x')}</button>
                </div>
            </div>`;
        document.body.appendChild(host);

        const tab = host.querySelector('.applytab__tab');
        const drawer = host.querySelector('.applytab__drawer');
        const close = host.querySelector('.applytab__close');

        function set(open) {
            tab.setAttribute('aria-expanded', String(open));
            host.classList.toggle('is-open', open);
            if (open) {
                drawer.hidden = false;
                // Focus moves into the drawer so a keyboard lands on the
                // action rather than being left back on the tab.
                const first = drawer.querySelector('a, button');
                if (first) first.focus();
            } else {
                drawer.hidden = true;
                tab.focus();
            }
        }

        tab.addEventListener('click', () => set(true));
        close.addEventListener('click', () => set(false));
        addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && host.classList.contains('is-open')) set(false);
        });
    }

    function boot() {
        document.querySelectorAll('[data-site-nav]').forEach(renderNav);
        document.querySelectorAll('[data-site-footer]').forEach(renderFooter);
        renderApplyTab();
        refresh();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    // Exported for live.js and page-level scripts.
    window.AMV = { MARK, icon, refresh, fleetMedia, blockHours, earnedRanks, minRankFor,
                   monogram, placeOf, distanceNm, estBlock, enrichRoute,
                   CREW_URL, CREW_DIRECT, THEME_KEY, currentTheme };
})();
