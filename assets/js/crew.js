/* ============================================================================
   Aeromexico Virtual — crew.js
   The website's read-only client for the crew center's public endpoints.

   The crew center is where the airline is actually run: routes are added there,
   pilots join there, hours accrue there. Anything this site states that the
   crew center also knows should come FROM the crew center, or the two will
   disagree and the website will be the one that is wrong.

   Everything here is public and CORS-open (the backend sends
   Access-Control-Allow-Origin: * — see EMBEDBACKEND.md), so there is no key in
   this file and nothing to keep out of git. Writes are gated; reads are not.

   THE RULE FOR EVERY FEED: the page must already be correct before this file
   runs. Each helper resolves to null on any failure — offline, slow, backend
   down, endpoint changed — and every caller treats null as "leave what is
   already on the page". data.js stays the fallback rather than becoming dead
   weight, so a visitor never gets an empty network page because a fetch timed
   out. Never make a section that only exists once a fetch resolves.
   ========================================================================== */

(function () {
    'use strict';

    const BACKEND = 'https://site--indgo-backend--6dmjph8ltlhv.code.run';
    const SLUG = 'aeromexico-virtual';
    const TIMEOUT = 8000;

    // One GET, JSON, never throws. Callers get null and keep their fallback.
    async function get(path) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), TIMEOUT);
        try {
            const res = await fetch(BACKEND + path, {
                headers: { Accept: 'application/json' },
                signal: ctrl.signal,
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (_) {
            return null;
        } finally {
            clearTimeout(t);
        }
    }

    /* ---- Routes -------------------------------------------------------------
       GET /api/crew/<slug>/routes → { routes: [{ flightNumber, origin,
       destination, aircraft, distanceNm, notes, active, kind, partnerName,
       partnerLogo }] }

       Drafts come back too — the endpoint returns everything so managers see
       their unpublished work in the crew center. A public website is not the
       place for a draft sector, so anything not explicitly active is dropped.
       `active` is only filtered when the field is actually present, so a route
       saved before that field existed is published rather than silently lost. */
    async function routes() {
        const data = await get(`/api/crew/${encodeURIComponent(SLUG)}/routes`);
        if (!data || !Array.isArray(data.routes)) return null;
        const live = data.routes
            .filter(r => r && r.origin && r.destination)
            .filter(r => r.active !== false)
            .map(r => ({
                from:   String(r.origin).trim().toUpperCase(),
                to:     String(r.destination).trim().toUpperCase(),
                ac:     (r.aircraft || '').trim(),
                dist:   Number(r.distanceNm) || 0,
                flight: (r.flightNumber || '').trim(),
                notes:  (r.notes || '').trim(),
                // A codeshare sector is flown under a partner airline's name,
                // and the crew center records whose. Passed through so the
                // network page can say so instead of presenting somebody else's
                // route as one of ours. `partner` is the airline; `partnerLogo`
                // is their mark, which the crew center only has if they pasted
                // one in — so it is optional and the name is not.
                codeshare: r.kind === 'codeshare',
                partner:   (r.partnerName || '').trim(),
                partnerLogo: /^https:\/\//i.test(String(r.partnerLogo || '')) ? r.partnerLogo : '',
            }));
        // An empty list is a real answer, but it is not one worth showing: a VA
        // that has not filled in its crew center yet would get a blank network
        // page instead of the sectors this repo already knows about.
        return live.length ? live : null;
    }

    /* ---- Events -------------------------------------------------------------
       GET /api/crew/<slug>/events → { events: [{ title, description, origin,
       destination, aircraft, server, startsAt, slots, going, seatsLeft,
       bannerUrl, gateIcao, status }] }

       The calendar the crew center publishes, which is the one the events page
       has always said it was showing. Until now that page carried the VA-ads
       events widget in an iframe — a different feed, filled in somewhere else —
       so staff scheduling a group flight in the crew center changed nothing
       here, and the page's own copy ("the live one out of the crew center")
       was not true.

       Unauthenticated, so drafts never arrive; cancelled ones do, and are
       dropped here — a public calendar is a list of things you can turn up to.
       Anything already flown goes too, with the same six-hour grace the crew
       center uses so an event under way is still listed.

       Attendance rides along only when the backend counted it. `going` is null
       for a caller it did not count for, and null is passed through as
       undefined rather than 0, because "0 going" printed under an event nobody
       has counted is the kind of wrong that puts people off coming. */
    async function events({ limit = 12 } = {}) {
        const data = await get(`/api/crew/${encodeURIComponent(SLUG)}/events`);
        if (!data || !Array.isArray(data.events)) return null;

        const grace = Date.now() - 6 * 60 * 60 * 1000;
        const live = data.events
            .filter(e => e && e.status === 'published' && e.startsAt)
            .filter(e => new Date(e.startsAt).getTime() > grace)
            .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
            .slice(0, limit)
            .map(e => ({
                title:  (e.title || '').trim(),
                blurb:  (e.description || '').trim(),
                date:   e.startsAt,
                from:   (e.origin || '').trim().toUpperCase(),
                to:     (e.destination || '').trim().toUpperCase(),
                ac:     (e.aircraft || '').trim(),
                server: (e.server || '').trim(),
                slots:  Number(e.slots) || 0,
                going:  Number.isFinite(Number(e.going)) ? Number(e.going) : undefined,
                seatsLeft: Number.isFinite(Number(e.seatsLeft)) ? Number(e.seatsLeft) : undefined,
                banner: /^https:\/\//i.test(e.bannerUrl || '') ? e.bannerUrl : '',
                gate:   (e.gateIcao || '').trim().toUpperCase(),
            }))
            .filter(e => e.title);

        // An empty calendar is a real answer and still not the one to show: the
        // page would go from four events to nothing because the crew center has
        // not been filled in yet. data.js stays the fallback, as everywhere
        // else in this file.
        return live.length ? live : null;
    }

    /* ---- Operating figures --------------------------------------------------
       GET /api/crew/<slug>/stats → { connected, stats: { pilots, hours,
       pireps, flightHours, … } }

       The airline's real numbers, aggregated inside the airline's own database
       and returned as one small object. This used to pull the entire roster
       down and count it client-side; it does not any more, for three reasons.
       The roster is people — a marketing page has no business downloading a
       list of them to arrive at a number. It grew linearly with the airline.
       And the aggregate it produced could not see anything the roster does not
       hold, so flights filed and hours actually flown were out of reach.

       Returns null unless there is something real to show:
         - the request failed, or
         - the VA has not connected a data store, or
         - the roster is empty.
       "Zero pilots" is a true statement and still not one to print in 48px
       numerals next to genuinely impressive facts. Callers treat null as
       "leave the page as it is". */
    async function stats() {
        const data = await get(`/api/crew/${encodeURIComponent(SLUG)}/stats`);
        if (!data || !data.stats || data.connected === false) return null;
        const s = data.stats;

        // ABSENT IS NOT ZERO. A field the backend did not send is a field we
        // did not learn, and coercing it to 0 would print a fabricated figure —
        // exactly the thing this site removed from data.js. `pick` yields
        // undefined for anything non-numeric, and paint() deletes the figure
        // rather than rendering it. A real 0 that the backend did send is a
        // true answer and is shown.
        const pick = (...vals) => {
            for (const v of vals) if (v != null && Number.isFinite(Number(v))) return Number(v);
            return undefined;
        };
        const round = (v) => (v === undefined ? undefined : Math.round(v));

        if (!pick(s.pilots)) return null;
        return {
            pilots:       pick(s.pilots),
            pilotsActive: pick(s.pilotsActive),
            // Credited roster hours — the figure the rank ladder is read
            // against, and the one the crew center shows a pilot.
            hours:        round(pick(s.hours)),
            // Hours on approved flight reports. Tracks `hours` closely; the two
            // part company when staff hand-adjust a pilot's total.
            flightHours:  round(pick(s.flightHours)),
            pireps:       pick(s.pirepsApproved, s.pireps),
            flights30d:   pick(s.flights30d),
            landings:     pick(s.landings),
            destinations: pick(s.destinations),
            routesActive: pick(s.routesActive),
            lastFlightAt: s.lastFlightAt || null,
            topPilots:    Array.isArray(s.topPilots) ? s.topPilots : [],
        };
    }

    /* ---- Declarative rendering ----------------------------------------------
       Mark up the figure with the truth already in the page, then name the
       field that should replace it:

           <dt><b data-va-stat="pilots" data-count="0">—</b></dt>
           <span data-va-stat="hours" data-va-suffix="+"></span>

       An element inside a [data-va-figure] is treated as the whole figure: if
       the number never arrives, that ancestor is removed rather than left
       showing a dash. Nothing is ever filled with 0 as a stand-in for "we did
       not find out" — that is the failure mode this whole file is arranged to
       avoid.

       Numbers are handed to site.js's count-up when the element opts in with
       [data-count]; otherwise they are written straight in. */
    function paint(figures, root) {
        const scope = root || document;
        const slots = scope.querySelectorAll('[data-va-stat]');
        if (!slots.length) return;

        slots.forEach((el) => {
            const key = el.dataset.vaStat;
            const value = figures ? figures[key] : undefined;
            const missing = !Number.isFinite(Number(value));
            const holder = el.closest('[data-va-figure]');

            if (missing) {
                // Drop the whole figure, not just the number, so the page never
                // carries a label with nothing under it.
                if (holder) holder.remove(); else el.remove();
                return;
            }
            const n = Number(value);
            const suffix = el.dataset.vaSuffix || '';
            if (el.hasAttribute('data-count')) {
                el.dataset.count = String(n);
                if (suffix) el.dataset.suffix = suffix;
                el.textContent = '0';
                // site.js stamps [data-count-wired] on its first pass, which
                // happened while this element still read 0 and its section was
                // still hidden (so the observer never fired). Clear the stamp so
                // the refresh below picks it up with the real target.
                delete el.dataset.countWired;
            } else {
                el.textContent = n.toLocaleString() + suffix;
            }
            if (holder) holder.removeAttribute('hidden');
        });

        // Blocks that only make sense once there are figures at all.
        scope.querySelectorAll('[data-va-when]').forEach((el) => {
            const key = el.dataset.vaWhen;
            const ok = !!(figures && Number(figures[key]) > 0);
            if (!ok) el.remove(); else el.removeAttribute('hidden');
        });

        // Re-run site.js's passes so injected counters actually count.
        if (window.AMV && typeof window.AMV.refresh === 'function') window.AMV.refresh(scope);
    }

    /* Fetch once, paint every slot on the page. Pages call this and nothing
       else. Safe to call before or after DOMContentLoaded. */
    function mountStats(root) {
        return stats().then((figures) => { paint(figures, root); return figures; });
    }

    window.AMV_CREW = { get, routes, events, stats, paint, mountStats, BACKEND, SLUG };
})();
