# Aeromexico Virtual

The public website for **Aeromexico Virtual**, an Infinite Flight virtual airline,
and the brand contract that its Inflight Crew Center renders from.

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler — open
`index.html` and it works.

```
index.html        Home — hero, live roster, fleet, network, ranks, next event
fleet.html        The six operated types
network.html      Hubs + all 23 sectors, filterable by region
events.html       The live events + calendar embed
join.html         Requirements + the real application form (framed)
crew.html         The Crew Center, framed in our own chrome

brand.json        ← the brand contract. See "One brand, two products" below.
assets/brand.css  The design system. Every token lives here.
assets/js/data.js Fleet, routes, hubs, ranks, events, roster figures
assets/js/site.js Nav, footer, mark, icons, theme, reveal, counters
assets/js/live.js Mounts both Inflight embeds — live traffic and events
tools/            Regenerate mark.svg and plane-hero.webp from the source art
assets/img/       Supplied artwork, and what is generated from it. See below.
```

---

## The artwork

The decoration on this site is material the airline actually owns. Nothing is
drawn by hand, and that is the third answer to this question rather than the
first — the two before it are worth knowing about so they don't come back.

**First** the site leaned on a blue → plum → pink gradient: blurred behind the
hero, painted across the CTA band, clipped into the headline, and used as the
fill of every fleet card, plus a dot-grid. That is the house style of software
nobody art-directed, and it said nothing about a Mexican airline.

**Then** it was replaced with hand-drawn Mexican motifs — a step-fret greca, a
Puebla azulejo, papel picado bunting, a Quetzalcóatl watermark. Authentic
references, but invented artwork, and invented artwork standing in for a real
airline's design reads as exactly what it is. The azulejo in particular was
tiled edge to edge behind whole sections, which is the wallpaper a generated
layout reaches for.

**Now** it is the real thing:

| file | what it is | where it runs |
|---|---|---|
| `assets/img/mark.svg` | the Caballero Águila, traced from `Aeromexico-Symbol.webp` | nav, footer, favicon, fleet entries, and faded behind dark sections |
| `assets/img/plane-hero.webp` | the 787-9 special livery and its folk-art illustration | the landing-page hero |
| `assets/img/stripes.svg` | the ruled-feather device off the mark | right edge of dark sections |
| `assets/img/stripes-mirror.svg` | the same profile flipped | left edge of dark sections |
| the tricolour | real flag colours, hard stops | flagline, eyebrows, active nav item, `.rule` |

Two build steps, both reproducible and both leaving the supplied originals
untouched:

```bash
python3 tools/trace-mark.py   # Aeromexico-Symbol.webp -> mark.svg   (potrace)
python3 tools/crop-hero.py    # plane-logo.webp        -> plane-hero.webp
python3 tools/make-stripes.py # full-logo.webp         -> stripes.svg + stripes-mirror.svg
```

`trace-mark.py` composites the transparent source onto white, crops to the ink
and vectorises it. Two properties of its output are load-bearing: the mark is a
single `currentColor` group, and the white channels between the feathers are
real **holes**, not white-filled shapes. `brand.css` paints it through a CSS
mask, so one file serves every placement and recolours per theme — and a
white-filled version would paint solid navy over the page instead.

`crop-hero.py` finds the artwork band in the supplied image and crops to it,
dropping the second AeroMexico lockup underneath (the nav already carries the
mark) and the surrounding white, which was pushing the aircraft below the fold.
It detects the band rather than hard-coding it, so a re-exported source still
works.

`make-stripes.py` produces the ruled columns that run down **both** edges of the
dark sections — bars flush to the outside with the ragged edge facing in, the
way the rules sit beside the eagle in the mark. **The bar lengths are measured,
not invented:** the script finds the ruled block in `full-logo.webp` (the right
edge that *recurs* across rows — the furthest-right ink is the eagle's head,
which would give forty identical bars) and records how far left each rule
reaches. That ragged profile is the pattern, and the mirror is the same profile
flipped rather than a second guess at it.

Three things about wiring it up.

It is attached as an `::after` on `.band`, `.footer` and `.section--ink`, so no
page has to remember it, and each of those isolates so the `z-index: -1` cannot
escape its section. **One** pseudo-element spans the section and carries two
mask layers, one pinned to each edge — two elements would be the obvious build,
but the paint under the mask is a single gradient across the full width, and
splitting it would restart the ramp at each rail so the two sides stopped
agreeing. That gradient (red → rosa mexicano → red, down the section) is why
there are two mirrored files instead of one flipped with a CSS transform: a
transform on that element would turn both rails.

The mask is sized `var(--stripe-w) var(--stripe-tile)` rather than `… auto` —
`auto` ties the vertical rhythm to the column width, which collapses the bars to
hairlines on a phone. Keep `--stripe-tile` in step with what the generator
prints.

Both rails need a gutter reserved, so `.band`, `.footer` and `.section--ink`
each pad their `.wrap` on both sides. Below `--maxw` the wrap fills the viewport
and its own padding is all that keeps the outer column off the stripes.

**The mark also runs faded behind `.band` and `.section--ink`** — a `::before`
at `z-index: -2`, white at 6%, the same `mark.svg` through the same mask. Two
things keep it a watermark rather than the texture this project already threw
out once. It is sized to sit *inside* the section, because scaled past the edges
the bird crops to an unreadable blob. And that size is capped (`min(82%, 26rem)`)
rather than a bare percentage: a percentage is of the *section*, and on a tall
one — the home page's route block — 82% worked out to a bird over a thousand
pixels tall sitting behind a data table. Not on `.footer`: four columns of links
and a disclaimer over a shallow band is the one place a watermark lands squarely
behind text that has to stay legible, and the brand column already carries the
mark at full strength a few pixels away.

**If a page needs decoration it needs a photograph or the airline's own art.**
Not a hand-drawn motif, not a repeating geometric fill, not a gradient.

---

## One brand, two products

A pilot's path is: **this site → the crew center → the tracker.** Those are three
codebases in three repositories, and the whole point of the work here is that a
pilot should never be able to tell.

`brand.json` is what makes that true. It holds the design tokens — paper colour,
hairlines, text greys, accent, corner radius, typefaces, the livery gradient —
in a shape the Inflight backend accepts verbatim:

```bash
curl -X POST https://site--indgo-backend--6dmjph8ltlhv.code.run/api/crew/aeromexico-virtual/settings \
  -H 'Authorization: Bearer <owner crew token>' \
  -H 'Content-Type: application/json' \
  -d "$(jq '{theme}' brand.json)"
```

From then on `/api/va-ads/by-slug/aeromexico-virtual` returns that `theme`, and
`crewBrand.js` in the tracker repo maps each token onto the CSS custom property
the crew center already styles itself with (`bg` → `--bg`, `surface` →
`--surface`, and so on). Sign-in, the dashboard, the pilot home and the
application form all repaint in this site's design system.

**The tokens in `brand.json` and the `:root` block in `assets/brand.css` are the
same values written twice.** Change one, change the other, or the site and the
crew center drift apart. That duplication is deliberate — the site must render
with zero network calls, and the crew center must render without fetching a
third-party JSON file.

### What crosses the boundary

Only design tokens. `crewTheme` on the backend is validated on write
(`sanitizeTheme` in `crewAuth.js`) and re-validated on read in the browser:
colours must be hex, font names are a plain family with no quotes or commas, and
`gradient` holds only the *arguments* to `linear-gradient()` — colours, angles
and stops. No CSS ever travels as CSS.

---

## The live data

Two things on this site are live, and both are Inflight embeds mounted by
`assets/js/live.js`:

| Placeholder            | Widget                     | Served from |
|------------------------|----------------------------|-------------|
| `<div data-live-roster>` | Who's airborne right now | `inflight.info/embed.html` |
| `<div data-live-events>` | Events + calendar        | the InGdo backend's `/embed-events.html` |

The roster runs on the home page and the network page; the calendar is the
whole of `events.html`.

**One embed token drives both.** `live.js` holds the token Aeromexico Virtual
was issued and appends nothing else, because nothing else would be read: once
`?token=` is present, each widget resolves its own configuration from the
backend and ignores query-string overrides. Which callsign prefixes count, which
servers are scanned, roster vs map, the theme, the accent, the corner radius,
the events template — all of it is set **on the token, in the VA portal**
(Embed tab → Customize), not in this repo. Change the look there and both pages
follow without a deploy.

That is also why the site's own light/dark toggle no longer re-themes the
roster: the widget's theme is whatever the token says. If it clashes with the
page, set the token's theme in the portal.

The token is a public, origin-restricted embed credential — the portal hands it
out as a copy-paste `<iframe>`, so it belongs in the page source. It is not a
secret and there is nothing to keep out of git. If it is ever rotated or
revoked, change the one constant at the top of `live.js`.

**The site states no figure it cannot back.** `data.js` used to carry
`pilots: 640`, `hoursFlown: 48200`, `flightsFiled: 21400` and a `count` on
every fleet type, and the home page printed three of them under the hero as
big animated numerals. All of it was invented — plausible placeholders
rendered as fact, next to things that were true, which is the worst way to be
wrong because it reads as authoritative. They are gone.

What the site now states is either **counted off the arrays in this repo**
(`routes.length` destinations, `fleet.length` types, `hubs.length` hubs — so it
cannot drift from what the site actually lists) or comes live from the Inflight
embed. If the VA wants a real pilot count or hours total on the site, wire it to
the crew center's actual figure. Do not type a number into `data.js`.

`data.js` aircraft `type` strings are the **canonical Infinite Flight API
names** ("Boeing 787-9 Dreamliner", not "789"). The crew center matches live
flights to the fleet on that exact string to credit hours automatically, so a
typo silently breaks auto-PIREPs. Copy them from the crew center's fleet editor.

---

## Local development

Any static server, from the repository root:

```bash
python3 -m http.server 8080
# then http://localhost:8080
```

Clean URLs (`/fleet` rather than `/fleet.html`) come from `_redirects`, which
only applies on Netlify. Locally, use the `.html` paths — `site.js` normalises
both forms when it highlights the active nav item, so nav looks right either way.

## Deploying

Netlify, publish directory `.`, no build command. `_redirects` and `_headers`
are picked up automatically. `_headers` sets a CSP with exactly two permitted
frame targets — `inflight.info` (crew center, application form, live traffic)
and the InGdo backend origin that serves the events embed — and one connect
target, `inflight.info`. Adding an embed served from a new origin means adding
that origin to `frame-src`, or the frame is blocked with nothing in the page to
show for it.

---

## Notes for whoever picks this up next

**`crew.html` frames a cross-origin sign-in.** That works, but a browser with
strict third-party storage partitioning can refuse it. The page detects the
frame never loading and swaps in a direct link — deliberately, rather than
showing an empty box. If that fallback starts firing for everyone, make
`crew.html` a branded launcher instead of a frame.

**The mark is generated — do not hand-edit `mark.svg`.** It is potrace output
from `Aeromexico-Symbol.webp`; re-run `tools/trace-mark.py` instead. If you
replace the source bitmap and the artwork's proportions change, update
`--mark-ratio` in `brand.css` to match. There is no second copy of the geometry
anywhere: `site.js` renders `<span class="mark">` and `brand.css` masks the file
onto it, so the nav, the footer, the fleet entries and the favicon all move
together.

Aeromexico Virtual is not affiliated with Aeroméxico; the footer disclaimer
says so on every page and should stay there. Using the airline's own
Caballero Águila is a call the VA's staff have made — worth knowing that it is
a real trademark, and that the disclaimer is what carries the distinction. The
tricolour is used as a decorative device only — plain bands, never the national
coat of arms.

**One hand-typed copy of the events is left, on the home page.** `events.html`
is now the live calendar out of the crew center, but the "next event" card on
`index.html` still reads `data.js`, so the two can disagree — the home page can
advertise a departure the calendar has never heard of. Whoever picks this up
should close that: either drop the home-page card in favour of a second
`data-live-events` mount on a compact events template, or wire it to the same
feed. Until then, if you edit `data.js` events, check the home page against the
real calendar. Those entries carry ISO-8601 dates with an explicit UTC offset
and past ones age out on their own — nothing needs deleting.
