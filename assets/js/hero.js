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

   NOR ARE THE SWITCHES. `[data-still]` and `[data-away]` — skip the arrival on
   a page opened already scrolled, park the loops when the picture is off
   screen — moved to `wireSky()` in site.js when every other page got a sky of
   its own. They were never about the hero; they are about any picture.

   Two things are left, and neither is the picture:

     1. THE CABIN FILM, if the VA ever shoots one. AMV_DATA.video is still an
        escape hatch: fill it in and the clip becomes what you see through the
        glass, in place of the generated sky. The flight deck, the glareshield
        and the lockup are unchanged — the film is the view, not the hero.
     2. WHO HAS BEEN FLYING IT. Approved sectors off the crew centre, under the
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

    /* ---- 1. The cabin film --------------------------------------------------
       AMV_DATA.video, when it is filled in, is THE VIEW: the clip goes where
       the generated sky is, behind the same flight deck, under the same
       lockup. It replaces the weather and nothing else.

       Muted, looped, inline and autoplaying, which is the only combination a
       browser will start without a click. `playsinline` is what stops iOS
       taking the clip fullscreen the moment it plays.

       ASKED FOR LESS MOTION, IT DOES NOT PLAY, and the poster stands in —
       which is why the note in data.js says the poster is not optional. A hero
       that ignores that setting is worse than a hero with no film in it. */
    const sky = root && root.querySelector('.sky__air');
    const film = D.video;
    if (sky && film && film.src) {
        sky.classList.add('sky__air--film');
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
       2. WHO HAS BEEN FLYING IT
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
