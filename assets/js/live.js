/* ============================================================================
   Aeromexico Virtual — live.js
   Mounts the Inflight embed this site carries, driven by the embed token
   issued to Aeromexico Virtual:

     <div data-live-roster></div>   pilots airborne right now

   The token is what configures the widget — which VA, which callsign prefixes,
   which servers, the theme, the accent, the radius. All of that lives on the
   token in the VA portal, not here, so a look-and-feel change is made once over
   there and lands on every page. That is also why nothing below appends
   appearance parameters: once ?token= is present, the widget resolves its
   config from the backend and ignores query-string overrides.

   The token is a public, origin-restricted embed credential — it is meant to
   ship in the page source, exactly like the iframes the VA portal hands out.

   THE EVENTS WIDGET HAS GONE, deliberately. It rendered the VA-ads events feed,
   which is filled in on the partnership listing — a different place from where
   the airline is actually run. The events page said it was showing "the live
   one out of the crew center" and was not; it reads the crew center's own
   calendar directly now (AMV_CREW.events in crew.js), as cards in this site's
   own design rather than a themed iframe. Nothing here is left pointed at the
   old feed, so the two cannot quietly diverge again.
   ========================================================================== */

(function () {
    'use strict';

    const TOKEN = 'tok_d9689dd5ee39acb3fd09c3bbffad6dcd';

    // The live-traffic widget is fronted by the tracker site.
    const WIDGETS = {
        roster: {
            src:    'https://inflight.info/embed.html',
            height: 520,
            title:  'Aeromexico Virtual pilots airborne now',
        },
    };

    function mount(host, widget) {
        const height = host.dataset.height || widget.height;

        const frame = document.createElement('iframe');
        frame.src = `${widget.src}?token=${encodeURIComponent(TOKEN)}`;
        frame.title = widget.title;
        frame.loading = 'lazy';
        frame.style.height = height + 'px';
        frame.setAttribute('scrolling', 'no');

        const shell = document.createElement('div');
        shell.className = 'frame-host';
        shell.appendChild(frame);

        host.innerHTML = '';
        host.appendChild(shell);
    }

    function boot() {
        document.querySelectorAll('[data-live-roster]')
            .forEach(el => mount(el, WIDGETS.roster));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
