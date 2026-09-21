/* ============================================================================
   Aeromexico Virtual — hero.js
   The home page's opening screen, and the strip of real flying under it.

   THE HERO ITSELF IS NOT IN THIS FILE ANY MORE, and that is the headline
   change. It used to be: a stage of fleet photographs, a cross-fade timer, a
   caption reading the airframe off data.js, a row of dots to steer it. All of
   that went with hero #7.

   What replaced it is a window, a move forward into the flight deck, and the
   airline's lockup — no words on it at all. Every shape in it is a generated
   mask (tools/make-flightdeck.py, tools/make-cloudbank.py) and every frame of
   the move is CSS (FLIGHT DECK HERO in brand.css). Nothing here starts it,
   times it or steps it, which means the whole sequence still runs with
   scripting off. That is the point, and it is why this file got small.

   Four things are left, in the order they appear below:

     1. THE STILL SWITCH. A page that opens already scrolled — a #hash, a
        restored position, a back button — should not start a four-second film
        nobody can see. One attribute, read by CSS, and the hero is simply
        already finished. Reduced motion is handled in the stylesheet and needs
        nothing here.
     2. THE PAUSE. The move ends; the weather does not. Scrolled past or in a
        background tab, another attribute stops the four loops that never do.
     3. THE CABIN FILM, if the VA ever shoots one. AMV_DATA.video is still an
        escape hatch: fill it in and the clip becomes what you see through the
        glass, in place of the generated sky. The flight deck, the glareshield
        and the lockup are unchanged — the film is the view, not the hero.
     4. WHO HAS BEEN FLYING IT. Approved sectors off the crew centre, under the
        hero on the page's own paper. This is the only part of the home page
        that can honestly say the airline is running today, and it is the one
        piece of this file that was never about the picture.

   THE NULL CONTRACT IS UNCHANGED. The flight strip renders only what the crew
   centre returns and hides itself when that is nothing; the film plays only if
   a file is named; nothing here invents a pilot, a sector or a frame. See the
   top of crew.js.
   ========================================================================== */

(function () {
    'use strict';

    const root = document.querySelector('[data-hero]');
    const A = window.AMV;
    const D = window.AMV_DATA || {};

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ---- 1. The still switch ------------------------------------------------
       Set as the first thing this file does, because every frame spent
       deciding is a frame of a sequence that should not be playing. CSS does
       the rest: `[data-still]` zeroes every duration and delay in the move, so
       the hero is on its last frame rather than skipping to it. */
    if (root && (window.scrollY || window.pageYOffset || 0) > 40) {
        root.setAttribute('data-still', '');
    }

    /* ---- 2. Nothing moves behind a scrolled page ---------------------------
       The move is over in under five seconds and holds on its last frame; this
       is for the four that never stop — the cloud drift, the instrument glow,
       the view's float and the chevron. Off screen or in a background tab they
       are work nobody asked for on a battery nobody is charging, which is the
       same reason the rotation this hero replaced was observed.

       It sets an attribute and CSS does the pausing, so nothing here knows
       what is animating: add a fifth loop to the hero and it is covered. And
       it pauses rather than cancelling, so coming back picks the drift up
       where it left off rather than replaying the sequence. */
    if (root && 'IntersectionObserver' in window) {
        let onScreen = true;
        const sync = () => root.toggleAttribute(
            'data-away', document.hidden || !onScreen);
        new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); },
                                 { threshold: 0.02 }).observe(root);
        document.addEventListener('visibilitychange', sync);
    }

    /* ---- 3. The cabin film --------------------------------------------------
       AMV_DATA.video, when it is filled in, is THE VIEW: the clip goes where
       the generated sky is, behind the same flight deck, under the same
       lockup. It replaces the weather and nothing else.

       Muted, looped, inline and autoplaying, which is the only combination a
       browser will start without a click. `playsinline` is what stops iOS
       taking the clip fullscreen the moment it plays.

       ASKED FOR LESS MOTION, IT DOES NOT PLAY, and the poster stands in —
       which is why the note in data.js says the poster is not optional. A hero
       that ignores that setting is worse than a hero with no film in it. */
    const sky = root && root.querySelector('.deck__sky');
    const film = D.video;
    if (sky && film && film.src) {
        sky.classList.add('deck__sky--film');
        const v = document.createElement('video');
        v.className = 'deck__film';
        v.muted = true;            // property, not attribute: Safari reads this
        v.defaultMuted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('aria-hidden', 'true');
        v.setAttribute('preload', calm.matches ? 'none' : 'metadata');
        if (film.poster) v.setAttribute('poster', film.poster);
        if (film.w) v.setAttribute('width', film.w);
        if (film.h) v.setAttribute('height', film.h);
        v.src = film.src;
        if (!calm.matches) {
            v.autoplay = true;
            // A rejected play() is not an error worth surfacing: some browsers
            // refuse it on a metered connection or a data-saver setting, and
            // the poster is a perfectly good view.
            const go = v.play();
            if (go && go.catch) go.catch(() => {});
        }
        sky.appendChild(v);
    }

    /* =========================================================================
       4. WHO HAS BEEN FLYING IT
       A random handful of approved sectors off the crew centre's flight log —
       the same log the crew centre publishes, and the same one the pilots on
       this roster fill in by flying.

       Hidden until real flights arrive and hidden again if they stop: there is
       no placeholder state and no invented sector.

       It lives UNDER the hero, not in it. A list of facts reads as facts on
       the page's own paper; over a picture it reads as furniture. Looked up
       inside the hero first so a page that still carries it there keeps
       working.
       ====================================================================== */
    const strip = (root && root.querySelector('[data-hero-log]'))
                || document.querySelector('[data-hero-log]');
    if (!strip) return;

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

    /* THE SHORT FORM. This used to print the flight number, the type, the
       block time and how long ago it landed, in four columns of 11px grey,
       beside an aircraft plate doing the same job. The review's note was that
       it should "simply say Flown by _ServerNoob below the flight information",
       and the VA's own reading was sharper: a reader skipping between a flight
       number, a type code and a duration cannot see what they came for.

       So it is the sector, and who flew it. The one piece of context kept is
       when — "3h ago" is what makes this the airline running TODAY rather than
       a list of routes, which is the only reason the strip exists. Everything
       else is a click away in the crew centre, where it belongs. */
    function card(f) {
        const who = f.pilot || f.flight || f.callsign || 'a crew pilot';
        const ago = when(f.at);
        return `
            <li class="hero__leg">
                <span class="hero__leg-route mono">${esc(f.from)} <i>→</i> ${esc(f.to)}</span>
                <span class="hero__leg-who">Flown by <b>${esc(who)}</b></span>
                ${ago ? `<span class="hero__leg-meta">${esc(ago)}</span>` : ''}
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
        if (!log || !log.length) return;
        const list = strip.querySelector('[data-hero-legs]');
        if (!list) return;
        const n = Math.min(3, log.length);

        function paint() {
            list.innerHTML = sample(log, n).map(card).join('');
            list.classList.remove('is-swapping');
        }

        paint();
        strip.hidden = false;
        // The rows were injected after site.js ran.
        if (A && A.refresh) A.refresh(strip);

        if (calm.matches || log.length <= n) return;
        // Nine seconds. Slow enough that it reads as an operation ticking over
        // rather than as a carousel, and it is the only thing on the page that
        // changes once the hero has settled.
        setInterval(() => {
            if (document.hidden) return;
            list.classList.add('is-swapping');
            setTimeout(paint, 320);
        }, 9000);
    }

    if (window.AMV_CREW) {
        window.AMV_CREW.pireps({ limit: 24 }).then(mountLog).catch(() => {});
    }

    // ---- The crest flying into the nav ----------------------------------------
    // GONE WITH HERO #4, and recorded here so it is not rebuilt by reflex.
    //
    // The home page used to open on the airline's name set large and centred,
    // which then shrank and flew into the nav bar as you scrolled: one custom
    // property, --morph, driven from a single measured distance, with the
    // nav's own brand fading up underneath at the moment the two were the same
    // size in the same place. It was the nicest thing in this file.
    //
    // It is still the wrong thing for the hero that exists now, and for a new
    // reason. The lockup no longer opens the page — it ARRIVES on the glass,
    // four seconds in, as the last beat of a sequence. Flying that same lockup
    // back out again the moment you scroll undoes the one thing the whole hero
    // was built to do.
    //
    // If a hero that opens on the lockup ever comes back, this is in the
    // history against `mountCrest`.
})();
