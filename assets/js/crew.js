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
       destination, aircraft, distanceNm, notes, active }] }

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
            }));
        // An empty list is a real answer, but it is not one worth showing: a VA
        // that has not filled in its crew center yet would get a blank network
        // page instead of the sectors this repo already knows about.
        return live.length ? live : null;
    }

    /* ---- Roster -------------------------------------------------------------
       GET /api/crew/<slug>/roster → { roster: [{ name, callsign, hours, ... }] }

       Only the aggregate is used here. The endpoint is public and returns
       members individually, but a public marketing page has no reason to list
       who flies for the airline — the count and the hours are the airline's
       figures, the names are its people. */
    async function stats() {
        const data = await get(`/api/crew/${encodeURIComponent(SLUG)}/roster`);
        if (!data || !Array.isArray(data.roster)) return null;
        const pilots = data.roster.length;
        if (!pilots) return null;
        const hours = data.roster.reduce((n, m) => n + (Number(m.hours) || 0), 0);
        return { pilots, hours: Math.round(hours) };
    }

    window.AMV_CREW = { get, routes, stats, BACKEND, SLUG };
})();
