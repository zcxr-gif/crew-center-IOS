/* ============================================================================
   Aeromexico Virtual — live.js
   Mounts the Inflight "Active VA Pilots" widget wherever a page puts
   <div data-live-roster></div>.

   Roster mode is deliberate: it renders no map, so it costs nobody a Mapbox
   load and needs no token (see EMBED.md in the tracker repo). The widget is the
   only genuinely live thing on this site — every other number is airline data
   the staff maintain in data.js.
   ========================================================================== */

(function () {
    'use strict';

    const EMBED_ORIGIN = 'https://inflight.info';

    const CONFIG = {
        va: 'AEROMEXICO',                 // leading callsign word we fly under
        name: 'Aeromexico Virtual',
        prefixes: 'Aeromexico,AMX',       // full callsign prefixes to match
        servers: 'Expert',                // Expert Server only
        color: '#0C2C64',                 // header brand colour (matches --am-blue)
        radius: 14,                       // matches --radius
    };

    function themeNow() {
        const set = document.documentElement.getAttribute('data-theme');
        if (set === 'dark' || set === 'light') return set;
        return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function buildSrc() {
        const q = new URLSearchParams({
            va: CONFIG.va,
            name: CONFIG.name,
            prefixes: CONFIG.prefixes,
            servers: CONFIG.servers,
            mode: 'roster',
            header: 'off',
            theme: themeNow(),
            color: CONFIG.color,
            radius: String(CONFIG.radius),
        });
        return `${EMBED_ORIGIN}/embed.html?${q}`;
    }

    function mount(host) {
        const height = host.dataset.height || '460';

        const frame = document.createElement('iframe');
        frame.src = buildSrc();
        frame.title = 'Aeromexico Virtual pilots airborne now';
        frame.loading = 'lazy';
        frame.style.height = height + 'px';
        frame.setAttribute('scrolling', 'no');

        const shell = document.createElement('div');
        shell.className = 'frame-host';
        shell.appendChild(frame);

        host.innerHTML = '';
        host.appendChild(shell);

        // Re-point the widget when the visitor flips the site theme, so the
        // roster never sits light-on-dark against the page around it.
        let last = themeNow();
        const sync = () => {
            const now = themeNow();
            if (now === last) return;
            last = now;
            frame.src = buildSrc();
        };
        new MutationObserver(sync).observe(document.documentElement, {
            attributes: true, attributeFilter: ['data-theme'],
        });
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);
    }

    function boot() {
        document.querySelectorAll('[data-live-roster]').forEach(mount);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
