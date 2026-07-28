/* ============================================================================
   Aeromexico Virtual — live.js
   Mounts the two Inflight embeds this site carries, both driven by the one
   embed token issued to Aeromexico Virtual:

     <div data-live-roster></div>   pilots airborne right now
     <div data-live-events></div>   events + calendar

   The token is what configures each widget — which VA, which callsign
   prefixes, which servers, the theme, the accent, the radius, the events
   template. All of that lives on the token in the VA portal, not here, so a
   look-and-feel change is made once over there and lands on every page. That
   is also why nothing below appends appearance parameters: once ?token= is
   present, both widgets resolve their config from the backend and ignore
   query-string overrides.

   The token is a public, origin-restricted embed credential — it is meant to
   ship in the page source, exactly like the iframes the VA portal hands out.
   ========================================================================== */

(function () {
    'use strict';

    const TOKEN = 'tok_d9689dd5ee39acb3fd09c3bbffad6dcd';

    // The live-traffic widget is fronted by the tracker site; the events widget
    // is served straight off the InGdo backend so its own /api and /assets
    // calls resolve without a forwarding rule. Two origins, one token — both
    // are in frame-src in _headers.
    const WIDGETS = {
        roster: {
            src:    'https://inflight.info/embed.html',
            height: 520,
            title:  'Aeromexico Virtual pilots airborne now',
        },
        events: {
            src:    'https://site--indgo-backend--6dmjph8ltlhv.code.run/embed-events.html',
            height: 720,
            title:  'Aeromexico Virtual events and calendar',
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
        document.querySelectorAll('[data-live-events]')
            .forEach(el => mount(el, WIDGETS.events));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
