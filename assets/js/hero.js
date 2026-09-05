/* ============================================================================
   Aeromexico Virtual — hero.js
   The home page's opening screen.

   WHAT THIS REPLACED. The home page used to open on a poster: one flat
   illustration of a 787-9 ringed by folk art, over the wordmark, on navy. It
   was a title card, and a title card is a picture of an airline rather than an
   airline. The VA's reading was that the drawn eagle and the pasted aeroplane
   looked worse than the material the airline already had, and they were right —
   the fleet page has been carrying real photographs of these exact airframes
   since the community gallery went in.

   So the hero is those photographs, one at a time, with the airline's own
   flying underneath it. Three sources, all of them already true somewhere else
   on this site:

     the stage    AMV_DATA.fleet[].photo — the VA's own sim shots, flagship
                  first, cross-faded with a slow drift.
     the plate    what is on screen, and the page's display type now that the
                  headline is gone: type, registration, role, and the sector
                  that type is flown on, named in cities where we know them.
     the log      AMV_CREW.pireps() — approved flights off the crew centre,
                  sampled at random. Real pilots, real sectors, filed by the
                  people on the roster.

   THE HERO HAS NO COPY LEFT TO FALL BACK ON. The tagline and the paragraph
   that used to sit over the photograph are gone — they covered up the subject,
   and unlike everything else on this site they were written once and would
   have gone on being said. So the plate IS the headline, and it is read off
   the fleet.

   Which raises the stakes on the contract, and nothing here bends it: the
   slide list is whatever data.js holds photographs for; the flight strip
   renders only what the crew centre returns and hides itself when that is
   nothing; a photograph that fails to load drops out of the rotation rather
   than fading to a broken frame. With no photographs, a quiet backend or
   scripting off, the hero is the airline's navy, the two buttons and the four
   counted facts — smaller than it should be, and never wrong.

   ADDING AIRPORT PHOTOGRAPHY. There are no hub shots in this repo, and a stock
   photograph of Benito Juárez is not the airline's material. When the VA has
   its own, put them in `AMV_DATA.heroStills` as
   `{ src, w, h, alt, title, reg, note, route }` and they lead the rotation —
   no change needed here. `route` takes either an ICAO pair ("MMMX–EGLL") or a
   sentence; both are printed as given, the pair prettified into city names.
   ========================================================================== */

(function () {
    'use strict';

    const root = document.querySelector('[data-hero]');
    if (!root) return;

    const D = window.AMV_DATA || {};
    const A = window.AMV;

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ---- Naming an airport --------------------------------------------------
       ICAO is what the data holds and what a pilot reads; a city is what makes
       a hero legible to somebody who has not joined yet. Both, where we know
       both. The table is built off the hubs and the route list, so nothing is
       named here that the site does not already name elsewhere. */
    const CITY = {};
    (D.hubs || []).forEach(h => { if (h.icao && h.city) CITY[h.icao] = h.city; });
    (D.routes || []).forEach(r => { if (r.to && r.city) CITY[r.to] = r.city; });

    const place = icao => CITY[icao] || icao;

    // "MMMX–EGLL" → "Mexico City → London". Anything that is not a pair of
    // ICAOs is left exactly as written.
    function sector(text) {
        const m = String(text || '').match(/^\s*([A-Z]{4})\s*[–—-]\s*([A-Z]{4})\s*$/);
        return m ? `${place(m[1])} → ${place(m[2])}` : String(text || '');
    }

    /* ---- The slides ---------------------------------------------------------
       The fleet, heaviest first, with the flagship pulled to the front — the
       plan calls the 787-9 the backbone of the network, and the 777 that would
       otherwise open the page is the type reserved for events. Read off `role`
       rather than named here, so a change of flagship in data.js changes the
       hero. Only types with a photograph take a slide: a slide with no picture
       is a navy rectangle. */
    function buildSlides() {
        const stills = (Array.isArray(D.heroStills) ? D.heroStills : [])
            .filter(s => s && s.src);

        const types = (D.fleet || []).filter(a => a.photo && a.photo.src).slice().reverse();
        const flag = types.findIndex(a => /flagship/i.test(a.role || ''));
        if (flag > 0) types.unshift(types.splice(flag, 1)[0]);

        const fleet = types
            .map(a => ({
                src: a.photo.src, w: a.photo.w, h: a.photo.h,
                alt: `${a.livery || 'Aeromexico'} ${a.type}${a.photo.reg ? ' ' + a.photo.reg : ''}`,
                title: a.type,
                reg: a.photo.reg || '',
                note: a.role || '',
                route: (a.typical && a.typical[0]) || '',
            }));

        return stills.concat(fleet);
    }

    const slides = buildSlides();
    // No photographs at all: leave the navy wash, the buttons and the counted
    // facts standing. There is no copy to fall back to and none is invented.
    if (!slides.length) return;

    /* ---- The stage ----------------------------------------------------------
       One <img> per slide, stacked and cross-faded. Only the first carries a
       src on first paint: this is the largest thing on the page and there is no
       sense fetching five 1920px photographs to show one. Each slide loads as
       the one before it comes up.

       width/height are on every tag because these are hosted off-site — without
       them the stage has no intrinsic ratio while a photo is in flight. */
    const stage = root.querySelector('[data-hero-stage]');
    const frames = slides.map((s, i) => {
        const fig = document.createElement('div');
        fig.className = 'hero__slide';
        fig.innerHTML = `<img ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
            decoding="async" width="${Number(s.w) || 1920}" height="${Number(s.h) || 886}"
            alt="${esc(s.alt || s.title || '')}">`;
        const img = fig.firstElementChild;
        // A photograph we cannot fetch is dropped from the rotation entirely,
        // rather than fading to an empty frame with a caption over it.
        img.addEventListener('error', () => { fig.dataset.broken = '1'; }, { once: true });
        stage.appendChild(fig);
        return fig;
    });

    function load(i) {
        const img = frames[i] && frames[i].querySelector('img');
        if (img && !img.getAttribute('src')) img.setAttribute('src', slides[i].src);
    }

    /* ---- The plate and the dots --------------------------------------------
       The plate is what the headline used to be: the aircraft on screen naming
       itself. There is no static copy in this hero to fall back to, which is
       why every field below is guarded — a slide with nothing to say prints
       nothing and the stage carries it. */
    const caption = root.querySelector('[data-hero-caption]');
    const dots = root.querySelector('[data-hero-dots]');

    dots.innerHTML = slides.map((s, i) => `
        <button type="button" class="hero__dot" data-go="${i}"
                aria-label="Show ${esc(s.title || 'slide ' + (i + 1))}"></button>`).join('');
    const dotEls = Array.from(dots.querySelectorAll('.hero__dot'));

    let at = -1;
    let timer = 0;

    function show(i) {
        if (i === at) return;
        const n = slides.length;
        // Skip anything whose photograph failed, but never loop forever.
        let guard = 0;
        while (frames[i].dataset.broken && guard++ < n) i = (i + 1) % n;
        if (frames[i].dataset.broken) return;   // every photo is down

        load(i);
        load((i + 1) % n);                      // the next one, ready to fade in

        frames.forEach((f, j) => f.classList.toggle('is-on', j === i));
        dotEls.forEach((d, j) => {
            d.classList.toggle('is-on', j === i);
            d.setAttribute('aria-current', j === i ? 'true' : 'false');
        });

        // The plate is the page's display type — see LIVE HERO in brand.css.
        // Nothing here has a fallback string: a slide with no registration
        // prints no registration rather than an em dash.
        const s = slides[i];
        const line = [s.note, sector(s.route)].filter(Boolean).join(' · ');
        caption.innerHTML =
            `<span class="hero__plate-name">
                <b>${esc(s.title || '')}</b>
                ${s.reg ? `<span class="mono">${esc(s.reg)}</span>` : ''}
             </span>` +
            (line ? `<span class="hero__plate-sub">${esc(line)}</span>` : '');
        at = i;
    }

    function next() { show((at + 1) % slides.length); }

    /* ---- When it advances ---------------------------------------------------
       Seven seconds, and only while the hero is actually on screen and the tab
       is actually in front. A rotation running behind a scrolled page is work
       nobody asked for on a battery nobody is charging.

       With reduced motion asked for, it does not advance at all: the first
       slide stands, the dots still work, and the CSS drops the drift. */
    function stop() { clearInterval(timer); timer = 0; }
    function start() {
        stop();
        if (calm.matches || slides.length < 2) return;
        timer = setInterval(next, 7000);
    }

    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    dots.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-go]');
        if (!btn) return;
        show(Number(btn.dataset.go));
        start();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()),
                                 { threshold: 0.1 }).observe(root);
    } else {
        start();
    }

    show(0);
    if (calm.addEventListener) calm.addEventListener('change', start);

    /* =========================================================================
       WHO HAS BEEN FLYING IT
       A random handful of approved sectors off the crew centre's flight log —
       the same log the crew centre publishes, and the same one the pilots on
       this roster fill in by flying. It is the one thing on an opening screen
       that can honestly say the airline is running today.

       Hidden until real flights arrive and hidden again if they stop: there is
       no placeholder state and no invented sector. See the null contract at the
       top of crew.js.
       ====================================================================== */
    const strip = root.querySelector('[data-hero-log]');

    // "2h ago", "yesterday", "3 Sep". Anything we cannot date prints nothing
    // rather than "just now", which would be a claim.
    function when(iso) {
        const t = Date.parse(iso || '');
        if (!Number.isFinite(t)) return '';
        const mins = Math.round((Date.now() - t) / 60000);
        if (mins < 2) return 'just landed';
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        if (hrs < 48) return 'yesterday';
        const days = Math.round(hrs / 24);
        if (days < 7) return `${days} days ago`;
        return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
            .format(new Date(t));
    }

    // The aircraft as the sim names it is long ("Boeing 787-9 Dreamliner");
    // the fleet's own short code is what a crew room would say.
    const SHORT = {};
    (D.fleet || []).forEach(a => { if (a.type && a.short) SHORT[a.type] = a.short; });
    const acShort = name => SHORT[name] || String(name || '').replace(/\s*Dreamliner$/i, '');

    function card(f) {
        const id = f.flight || f.callsign;
        const dur = f.min >= 60 ? `${Math.floor(f.min / 60)}h ${String(f.min % 60).padStart(2, '0')}m`
                  : f.min > 0   ? `${f.min}m` : '';
        return `
            <li class="hero__leg">
                <span class="hero__leg-route mono">${esc(f.from)} <i>→</i> ${esc(f.to)}</span>
                <span class="hero__leg-who">${esc(f.pilot || id || 'A crew pilot')}</span>
                <span class="hero__leg-meta">
                    ${id ? `<b class="mono">${esc(id)}</b>` : ''}
                    ${f.ac ? `<span>${esc(acShort(f.ac))}</span>` : ''}
                    ${dur ? `<span>${esc(dur)}</span>` : ''}
                    ${when(f.at) ? `<span>${esc(when(f.at))}</span>` : ''}
                </span>
            </li>`;
    }

    // A sample rather than the latest three: the latest three are the same
    // three all afternoon, and one pilot on a good day would own the whole
    // strip. Shuffled off a copy — `log` is what we were handed.
    function sample(log, n) {
        const pool = log.slice();
        const out = [];
        while (pool.length && out.length < n) {
            out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return out;
    }

    function mountLog(log) {
        if (!log || !log.length || !strip) return;
        const list = strip.querySelector('[data-hero-legs]');
        const n = Math.min(3, log.length);

        function paint() {
            list.innerHTML = sample(log, n).map(card).join('');
            list.classList.remove('is-swapping');
        }

        paint();
        strip.hidden = false;

        if (calm.matches || log.length <= n) return;
        // Nine seconds, offset from the stage's seven so the two are never
        // moving together — one thing changing at a time reads as an operation
        // ticking over; two reads as a carousel.
        setInterval(() => {
            if (document.hidden) return;
            list.classList.add('is-swapping');
            setTimeout(paint, 320);
        }, 9000);
    }

    if (window.AMV_CREW) {
        window.AMV_CREW.pireps({ limit: 24 }).then(mountLog).catch(() => {});
    }

    // The stage, the caption and the strip were all injected after site.js ran.
    if (A && A.refresh) A.refresh(root);
})();
