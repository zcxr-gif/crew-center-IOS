# Aeromexico Virtual

The public website for **Aeromexico Virtual**, an Infinite Flight virtual airline,
and the brand contract that its Inflight Crew Center renders from.

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler — open
`index.html` and it works.

```
index.html         Home — the flight deck hero, the counted figures, a glimpse of
                   each page, the next event, what the airline has been doing
fleet.html         The six operated types, what each one flies, and what is planned
network.html       The route map, the flagship destinations, then every published sector
ranks.html         The ladder: insignia, hours, aircraft released, sector limits, privileges
events.html        The calendar, the programme, and what has been flown
about.html         Mission, the CEO's message, standards, the first twelve months
staff.html         Who runs the airline, and what each of them owns
apply.html         Requirements, the real application form (framed), and life after joining
                   (served at /apply; /join is kept as a permanent alias)
crew.html          The Crew Center, framed in our own chrome

brand.json         ← the brand contract. See "One brand, two products" below.
assets/brand.css   The design system. Every token lives here.
assets/js/data.js  Identity, staff, fleet, hubs, network, ranks, events — from the Operations Plan
assets/js/site.js  Nav, footer, mark, icons, theme, reveal, counters, rank arithmetic
assets/js/globe.js The route map: the network on a turning globe, and its card
assets/js/globe-land.js GENERATED land grid — see tools/make-globe.py
assets/js/live.js  Mounts the live-traffic embed
assets/js/crew.js  Read-only client for the crew center's public feeds
tools/             Regenerate mark.svg, the ruled device, every page's sky
                   geometry and globe-land.js
assets/img/        Supplied artwork, and what is generated from it. See below.
```

---

## The Operations Plan is the source

Everything the site states about how the airline works comes from Aeromexico
Virtual's **Operations Plan** — the rank ladder and its sector limits (§4), the
fleet and what each type is for (§5), the route tiers and their flight-number
series (§6), joining and activity (§3), the event programme (§9), the staff
structure (§2). `assets/js/data.js` is a transcription of it, not a second
opinion. **Where the two disagree, the plan is right and `data.js` is a bug.**

Two things follow from that and are worth not undoing:

**Minimum ranks are derived, never typed.** The plan says a route is offered to
a pilot whose rank permits both the aircraft and the block time. So
`AMV.minRankFor()` in `site.js` computes it — the higher of the rank that
releases the aircraft and the rank whose sector limit covers the filed block.
Change a threshold in `data.js` and every sector re-ranks itself, the ranks page
re-counts, and the two cannot drift. Typing a rank onto a route would undo all
of that within a month.

**A type is in the fleet only when it exists in the sim.** The plan names an
A320, an A321 and a heritage 757; its own closing checklist has those liveries
down as still to be confirmed against Infinite Flight. They are in
`fleetPlanned`, shown on the fleet page as development, and they move into
`fleet` on the day someone confirms the livery — not before. This site does not
publish a paper fleet.

---

## The artwork

Most of the decoration on this site is material the airline actually owns, and
the rest is geometry generated from parameters. Nothing is drawn by eye. That
is the third answer to this question rather than the first — the two before it
are worth knowing about so they don't come back in their original form.

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

**The greca and the serpent have since come back, generated.** The VA asked for Mexican
patterns knowing what the paragraph above says; that is their call about their
own airline. What makes the fret defensible where the azulejo and the papel
picado were not is that it is the one motif here that is *architectural rather
than pictorial* — stepped right angles on a grid — so `tools/make-greca.py`
generates it from parameters instead of anyone illustrating it, and it is used
as texture and as a rule, never as a subject. The standing rule in `brand.css`
is now **no pictorial invention**: if the next idea cannot be expressed as a
script that emits it, it is the wrong idea. The Quetzalcóatl frieze
(`make-serpent.py`) came in on the same terms — chevrons and rhombs on a grid,
and the feathered serpent is already what the accent palette is taken from.

**The eagle-and-serpent of the national coat of arms is still not here, and
should not be.** The *escudo nacional* is a state emblem whose reproduction is
regulated under the Ley sobre el Escudo, la Bandera y el Himno Nacionales, and
a virtual airline has no claim on it — which is the same reason the tricolour
on this site has only ever been plain bands. What the site pairs instead is
Aeroméxico's **own** eagle (the Caballero Águila, `mark.svg`, watermarked
behind `.band`) with the serpent frieze along that section's top edge: two
motifs sharing a section, not that device.

**Now** it is the airline's own material, plus one generated ornament:

| file | what it is | where it runs |
|---|---|---|
| `assets/img/lockup.png` | **the airline's own logo**, crest and wordmark in one piece, supplied by the VA | nav bar, footer |
| `assets/img/mark.svg` | the Caballero Águila, traced from `Aeromexico-Symbol.webp` | favicon, fleet entries, staff plates, rank insignia, hub plates, `.band` crest |
| `assets/img/stripes.svg` | the ruled-feather device off the mark | right edge of dark sections |
| `assets/img/stripes-mirror.svg` | the same profile flipped | left edge of dark sections |
| `assets/img/greca.svg` | the stepped fret, generated from a grid | a band across the top of the footer |
| `assets/img/greca-tile.svg` | the same fret over its mirror | a faint field across `.section--alt` |
| `assets/img/serpent.svg` | a Quetzalcóatl frieze, generated from a grid | a band along the top of every `.band` |
| `assets/img/cabin-window.svg` | a cabin wall with one window cut out of it, from coordinates | act one of the home page hero |
| `assets/img/cabin-bezel.svg` | the lit reveal inside that aperture | act one of the home page hero |
| `assets/img/flightdeck.svg` | the forward structure, with four panes cut out of it | act three of the home page hero |
| `assets/img/flightdeck-glare.svg` | the glareshield, as its own darker mass | act three of the home page hero |
| `assets/img/flightdeck-glow.svg` | the lip of the glareshield, blurred into the instrument underglow | act three of the home page hero |
| `assets/img/cloudbank.svg` | a seamless cumulus deck, unioned out of seeded circles | the weather, at both ends of the hero |
| `assets/img/cloudbank-far.svg` | the same, flatter, for the layer behind | the weather, wherever a view is at cruise |
| `assets/img/view-wing.svg` | a swept wing, a nacelle and a winglet | `/fleet` |
| `assets/img/view-city.svg` | a field of lights whose size follows depth | `/network` |
| `assets/img/view-contrails.svg` | four tapered ribbons on bowed chords | `/ranks` |
| `assets/img/view-runway.svg` | an airfield's edges, centreline and threshold | `/events` |
| `assets/img/view-cabin-row.svg` | five apertures receding down a wall | `/about` |
| `assets/img/view-tail.svg` | a fin, and the fuselage it stands on | `/staff` |
| `assets/img/view-door.svg` | a door-shaped hole in a wall | `/apply` |
| the community-aircraft gallery | the VA's own airframes, shot in the sim | the fleet cards (`data.js` → `fleet[].photo`) |
| the tricolour | real flag colours, hard stops | flagline, eyebrows, active nav item, `.rule` |

**The fleet photographs are hotlinked, deliberately.** They live in the
tracker's `community-aircraft` bucket — the same objects the live map serves —
so re-uploading a shot there updates this site with no deploy, and there is one
copy of each rather than one here that quietly goes stale. The trade is a
runtime dependency on that bucket: if it moves, the fleet cards fall back to
nothing rather than to the mark, because the `<img>` is already in the DOM by
then. `img-src` in `_headers` is `'self' data: https:`, so no CSP change was
needed and none is needed for a future bucket either.

Each entry carries the airframe's registration and the file's real pixel
dimensions. The dimensions go on the tag: these are off-site images, so without
them a card has no height until the image lands, and the grid jumps when it
does. A type with no `photo` falls back to the mark — `AMV.fleetMedia` in
`site.js` owns that choice, because both the home-page preview and the fleet
page render entries and the fallback has to behave the same in each.

All reproducible, and all leaving the supplied originals untouched:

```bash
python3 tools/trace-mark.py      # Aeromexico-Symbol.webp -> mark.svg   (potrace)
python3 tools/make-stripes.py    # full-logo.webp         -> stripes.svg + stripes-mirror.svg
python3 tools/make-greca.py      # (parameters only)      -> greca.svg + greca-tile.svg
python3 tools/make-serpent.py    # (parameters only)      -> serpent.svg
python3 tools/make-flightdeck.py # (parameters only)      -> the hero's cabin window and flight deck
python3 tools/make-cloudbank.py  # (seeded, reproducible) -> the cloud decks
python3 tools/make-views.py      # (parameters + seed)    -> the seven page views
```

`trace-mark.py` composites the transparent source onto white, crops to the ink
and vectorises it. Two properties of its output are load-bearing: the mark is a
single `currentColor` group, and the white channels between the feathers are
real **holes**, not white-filled shapes. `brand.css` paints it through a CSS
mask, so one file serves every placement and recolours per theme — and a
white-filled version would paint solid navy over the page instead.

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

## Fed by the crew center

The crew center is where the airline is actually run — sectors are added there,
pilots join there, hours accrue there. Anything this site states that the crew
center also knows should come **from** the crew center, or the two will
disagree and the website will be the one that is wrong.

`assets/js/crew.js` is the read-only client. Everything it reads is public and
CORS-open (`Access-Control-Allow-Origin: *`), so there is no key in it and
nothing to keep out of git — writes are gated, reads are not.

| helper | endpoint | used for |
|---|---|---|
| `AMV_CREW.routes()` | `GET /api/crew/<slug>/routes` | the sector list on `/network` and the network band on `/` |
| `AMV_CREW.airports()` | `GET /api/crew/<slug>/route-map` | where those sectors go — coordinates for the map |
| `AMV_CREW.stats()` | `GET /api/crew/<slug>/stats` | the operating figures |
| `AMV_CREW.events()` | `GET /api/crew/<slug>/events` | the calendar on `/events` and the next-event card |
| `AMV_CREW.pastEvents()` | the same feed, read backwards | what the airline has actually flown |
| `AMV_CREW.mountStats()` | — | fetches once, fills every figure slot on the page |
| `AMV_CREW.get(path)` | anything else public | adding a feed |

**The rule for every feed: the page must already be correct before the fetch
runs.** Each helper resolves to `null` on any failure — offline, slow, backend
down, endpoint changed — and every caller treats `null` as "leave what is
already on the page". `data.js` stays the fallback rather than becoming dead
weight. Never build a section that only exists once a fetch resolves; a visitor
on hotel wifi gets an empty page instead of a slow one.

**Two feeds are exempt, and the exemption is the point.** The route network and
the events calendar are read from the crew center or not shown at all. They
hold a waiting state while the request is in flight and say plainly that there
is nothing when it answers with nothing.

The reason is that both are things a reader can *act* on — book the sector,
turn up for the departure — so a plausible placeholder is not a graceful
degradation, it is a false statement with a date on it. `data.js` carried four
invented events for exactly this purpose and the home page advertised them
under the heading "The next departure". They are gone, `events: []` is
deliberate, and `tools/test-events-page.js` fails if anything like them comes
back. Everything else in `data.js` — the fleet, the ranks, the hubs — is a
description of the airline that is true whether or not a server answers, which
is why those still make good fallbacks.

For every other feed an **empty** answer is treated the same as no answer,
deliberately. A crew center whose roster figures have not been filled in yet
would otherwise blank a section this repo can already describe.

The two record shapes do not match, and that is the interesting part. The crew
center knows the sector and the aircraft; `data.js` knows the things a reader
wants and an ops tool has no reason to store — the destination's city, which
region it belongs to, the scheduled block time. A live sector is matched to its
`data.js` twin on the airport pair and takes those labels from it. **A sector
with no twin is still shown, with only the fields we genuinely have** — no city
invented for it, no block time guessed at, and its region falls into a plain
`Network` bucket rather than being assigned one. The one exception is a sector
the crew centre has marked a **codeshare**: the plan already publishes those as
their own tier, so that is the tier it goes in, and the partner's name is on the
card rather than the sector passing as our own metal.

Everything counted off the list — the sector count, the per-hub sector counts,
the "N destinations" band on `/network`, the network sentence and the map on the
home page — is counted off whichever list is current, so the page cannot say 23
above a list of 3.

**Where a sector goes** comes from the crew centre too. `AMV_CREW.airports()`
reads `/route-map`, which is the same sectors already joined to aerodrome
reference points, and those positions are merged *under* `data.js`'s own table
(the repo's coordinates are checked, so they win a clash). Without it, a
destination staff opened that this repo has never heard of would be listed and
then silently left off the map — the map draws only what it can place, which is
right, and until this feed existed there was no way for it to learn. When a
sector still cannot be placed the map says how many, rather than quietly drawing
a smaller network than the one listed under it.

Adding a feed is `AMV_CREW.get('/api/…')`, a `null` check, and a re-render.
The backend is in `connect-src` in `_headers`; a feed from a *new* origin needs
that origin added there or the fetch is blocked.

Roster data is read as an **aggregate only**. The endpoint is public and returns
members individually, but a public marketing page has no reason to list who
flies for the airline — the count and the hours are the airline's figures, the
names are its people. `/stats` exists precisely so the aggregate can be had
without downloading the people: it is computed inside the airline's own
database and comes back as one small object.

### The operating figures

The band under the hero (`#ops` on the home page) is the one place on this site
that states pilots, hours logged, flight reports filed and landings. Every one
of those is live; none of them is in this repo. See the note at the foot of
`data.js` for why that is a hard rule here.

Mark up a figure with the truth already on the page and name the field:

```html
<div class="stat" data-va-figure>
  <span class="stat__num" data-va-stat="pilots" data-count="0">0</span>
  <span class="stat__label">Pilots on the roster</span>
</div>
```

Then call `AMV_CREW.mountStats()` once. What the contract guarantees:

- **Absent is not zero.** A field the backend did not send is deleted, along
  with its whole `[data-va-figure]` ancestor, so the page never carries a label
  with nothing under it — and never prints a `0` it made up. A `0` the backend
  *did* send is a true answer and is shown.
- **The section is gated.** `[data-va-when="pilots"]` on the band means a VA
  with no connected data store, an empty roster, or an unreachable backend
  simply does not get the section. It ships `hidden` and is only ever revealed
  by real figures — there is no skeleton and no zero state.
- `[data-count]` opts a figure into `site.js`'s count-up; without it the number
  is written straight in.

Adding a figure to another page is: include `crew.js`, add the markup, call
`mountStats()`. Nothing else.

---

## The live data

Two things on this site are live, and they arrive by different routes.

**Who's airborne** is an Inflight embed, mounted by `assets/js/live.js`:

| Placeholder            | Widget                     | Served from |
|------------------------|----------------------------|-------------|
| `<div data-live-roster>` | Who's airborne right now | `inflight.info/embed.html` |

It runs on the home page and the network page.

**The events calendar** is not an embed. It is `AMV_CREW.events()` in `crew.js`
reading `GET /api/crew/<slug>/events` — the crew center's own calendar — drawn
as cards in this site's design on `events.html`, and as the "next event" card on
the home page.

It used to be an iframe pointed at the VA-ads events widget, which is a
different feed filled in on the partnership listing rather than where the
airline is run. So staff scheduling a group flight in the crew center changed
nothing here, while the events page said in so many words that the calendar
below was "the live one out of the crew center". Both pages read the real one
now, and `live.js` no longer carries the old mount, so they cannot quietly
diverge again.

An event's stand board lives in the crew center: the page names the airport and
sends people there to pick a gate off the map.

**One embed token drives the roster.** `live.js` holds the token Aeromexico
Virtual was issued and appends nothing else, because nothing else would be read:
once `?token=` is present, the widget resolves its own configuration from the
backend and ignores query-string overrides. Which callsign prefixes count, which
servers are scanned, roster vs map, the theme, the accent, the corner radius —
all of it is set **on the token, in the VA portal** (Embed tab → Customize), not
in this repo. Change the look there and both pages follow without a deploy.

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

### The checks

Browser tests, run against a throwaway server on a spare port with the crew
centre faked. They need `playwright-core` and a Chromium (`npm i playwright-core`;
the path is `$PLAYWRIGHT_CHROMIUM`, or `/opt/pw-browsers/chromium`).

```bash
node tools/test-events-page.js     # the calendar, and what must not reach it
node tools/test-network-sync.js    # the network, counted off the crew centre
node tools/test-motion.js          # nothing stranded invisible; the seams
node tools/test-globe.js           # the globe turns, and stops when asked to
```

## Deploying

Netlify, publish directory `.`, no build command. `_redirects` and `_headers`
are picked up automatically. `_headers` sets a CSP with two permitted frame
targets — `inflight.info` (crew center, application form, live traffic) and the
InGdo backend origin — and the same two as connect targets, which is what lets
`crew.js` read the roster figures, the route network and the events calendar.
Adding an embed served from a new origin means adding that origin to
`frame-src`, or the frame is blocked with nothing in the page to show for it.

**Assets revalidate, and must keep revalidating.** `/assets/*` was served
`max-age=31536000, immutable`. Nothing under it is content-hashed — there is no
build step, so `site.js` keeps that name while its contents change — which made
that header a false promise, and `immutable` means the browser does not even
ask. HTML is not under `/assets/*` and so caches by different rules, and the
two drift apart: a returning visitor gets today's `fleet.html` calling a
function that only exists in a `site.js` they will not re-fetch for a year.
That is not hypothetical, it is what shipped — `window.AMV.fleetMedia is not a
function`, thrown only at people who had visited before.

Assets now carry `max-age=0, must-revalidate`. That is a conditional request
per asset, answered with a 304 and a few hundred bytes when nothing changed —
the right trade for a hand-maintained site whose alternative is silently
serving mismatched code. **If long-lived caching is ever wanted back, the
filenames have to carry a content hash first, and something has to generate
them.** Do not restore `immutable` over stable names.

The `?v=2` on the CSS and JS tags is a **one-time escape, not a convention to
maintain.** Fixing the header does nothing for caches already poisoned under
the old one — those copies are pinned for a year and will not be re-requested
to discover the new policy. A changed query string is a different cache key, so
it forces the one fetch that gets those browsers onto the revalidating policy.
Once a visitor has been through it, revalidation carries every change after,
and the number never needs bumping again.

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

**The home page opens on a window, goes forward into the flight deck, and puts
the lockup on the glass.** Nothing is written over it. Every shape in it is
generated — `tools/make-flightdeck.py` and `tools/make-cloudbank.py` — and the
whole move is CSS, so it runs with scripting off; see the hero section under
*Design decisions* for how it is put together. Under it, a handful of approved
sectors sampled at random off the crew centre's public flight log
(`AMV_CREW.pireps()`): real pilots, real routes, filed by flying them. Then the
airline in four counted figures.

**The apply tab** is the one piece of furniture that follows you between
pages, so it carries the single action the whole site asks for and nothing
else. A tab down the right edge opens a drawer along the foot of the screen —
the coronausa.com pattern the VA pointed at.

It is a **disclosure, not a dialogue**: no overlay, no focus trap, nothing
underneath goes inert. You can ignore it and keep reading, which is the whole
difference between this and a pop-up. Escape closes it, focus moves into the
drawer on open and back to the tab on close.

What it is *not* is the thing that shape is usually used for. Corona's drawer
is an email capture — address, date of birth, postcode, for a discount. There
is no list to add anyone to here, so a form pretending otherwise would collect
real addresses into nothing, which is worse than not asking. It is a sentence
and the button that was already on the page.

`APPLY_SKIP` in `site.js` keeps it off `/apply`, which *is* the thing it points
at, and `/crew`, which is one viewport tall by design.

**The lockup is the airline's own logo**, not an assembly. The nav used to
build the name out of `mark.svg` plus two lines of type — Fraunces for
"Aeromexico", letter-spaced sans for "Virtual" — which was always an
approximation of the lockup the VA actually owns. That lockup is now a file,
and `.brandmark` paints it.

It is painted through a **mask**, exactly as `.mark` is: the supplied PNG is
white on transparent, so its alpha channel is the shape and `currentColor` is
the ink. One file serves both themes, and `.nav__brand` states `color:
var(--ink)` so it is near-black on paper and near-white on navy with no second
rule. It is **sized by height** — the ratio is the file's own, so a bar that
fixes a height gets the width for free.

The file is the supplied PNG cropped to its ink and flattened to white, since
everything but the alpha is discarded by the mask anyway.

**Why this ships when the Connect lockup does not.** The Connect note in
`brand.css` refuses to ship the real AEROMÉXICO CONNECT artwork, because that
is Aeroméxico's own registered sub-brand wordmark and this repo draws its mark
from a traced SVG and sets everything else in type. This is not that: it is
Aeromexico Virtual's lockup, for Aeromexico Virtual's own name, handed over by
the VA that owns it. The Connect sub-brand is still typeset.

A **stacked** lockup was supplied too and is not shipped: both placements are
horizontal, the footer is already fighting to stay short on a phone, and a
favicon has to read at 16px where a wordmark is a smudge and the crest alone is
right. Crop it the same way and add a variant if a placement turns up.

**The header is an island.** A rounded bar floating with air on all four sides
rather than a full-width strip ruled off from the page, and on the home page it
floats *over* the hero.

Three things about it are load-bearing:

- **The host is what is pinned, not `.nav`.** A sticky element can only travel
  inside its own parent's border box, and the host is exactly as tall as the
  bar plus its gap — sticky on `.nav` has nowhere to go and the header scrolls
  away with the page. The host also supplies the gap, as *padding*, so the
  bar's own box is exactly the island and `overflow: hidden` clips the
  tricolour and the open mobile menu to its corner radius. The menu expanding
  the island into a rounded panel is that clip, not a separate treatment.
- **`--header-h` is the bar plus the gap twice**, because the tricolour lives
  inside the bar now and no longer adds height. `scroll-padding-top`, the
  mobile menu's `max-height` and the hero's `min-height` all read it.
- **The hero floats under it** via `main > .hero--live:first-child`, which pulls
  the hero up by `--header-h` and gives it back as padding — nothing inside the
  hero moves, only the scenery grows upward. Scoped to a `.hero--live` that is
  the *first* thing in `main`, so every other page keeps the island on its own
  ground with a white edge to float against.

What went when the island came in: the scrim under the bar (an island has
nothing to dissolve into), the full-width navy-to-red edge beneath it (a ruled
line across the page is the opposite of floating), and the flagline as a
separate strip above it. The tricolour is drawn along the *inside* of the
island's top edge, and it carries a hairline underneath: the flag's middle
third is white, and without that line it disappears into a light island and the
flag reads as two disconnected bars.

**The window, then the flight deck, then the eagle — and no words on it at
all.** Seven heroes have been thrown out of this repo; the list and the
reasoning are in `brand.css`, because the instinct that produced each one comes
back. Every one of them was a fight between **type** and a **picture**, and
every fix traded one for the other. The VA's call was to stop having the fight:
the home page opens at a passenger window, goes forward through it into the
flight deck, and settles the airline's lockup on the glass. Nothing is written
on it.

Taking the words off settles the two objections the old hero kept answering:

- **It is dark in both themes, and now for a reason.** #5 was dark because
  white type needs a ground it stays legible on whatever the theme is doing.
  There is no type here. It is dark because it is a sunrise seen from the
  flight deck, which is dark. The rest of the page still follows the theme.
- **Nothing is cropped, because nothing here is a photograph.** Every shape is
  generated to a common 1600×1000 frame and mounted at `mask-size: cover`, so a
  narrow viewport cuts in from the sides — and what it takes is the outboard
  sliding windows, geometry that exists to be lost. The two forward panes, the
  centre post, the roof and the glareshield survive every ratio. The airframe
  photographs are not gone from the site: they are on `/fleet`, uncropped,
  which is where a reader who wants to look at an aeroplane goes.

**Nothing on screen is drawn.** The standing rule at the head of `brand.css` is
that no pictorial artwork may be invented, and that geometry emitted from
parameters is the one exception. All of it is emitted:

| file | from |
| --- | --- |
| `cabin-window.svg`, `cabin-bezel.svg` | `tools/make-flightdeck.py` |
| `flightdeck.svg`, `-glare.svg`, `-glow.svg` | `tools/make-flightdeck.py` |
| `cloudbank.svg`, `cloudbank-far.svg` | `tools/make-cloudbank.py` |
| `view-*.svg` (the seven page headers) | `tools/make-views.py` |

Every one is a monochrome **mask**, like `mark.svg` and `greca.svg`, so the
colour of the cabin, the deck and the instrument glow is decided in `brand.css`
and not in the files. A passenger window is a rounded rectangle and a flight
deck's forward glass is four flat panes between structural posts — both are
sets of coordinates, and both are in those scripts. Retune there and re-run;
do not edit the SVGs, and do not add a hand-drawn layer beside them.

**Every layer lives in one frame, and that is the whole trick.** A gradient's
horizon is a percentage of its own element; a mask mounted at `cover` is
cropped to the box's ratio. Those two agree only when the box happens to be
1.6:1 — measured on the first build of this hero, at 2560×864 the glareshield
sat **4.3% below its own sunrise**, and a page header is a wide shallow band
nowhere near 1.6:1.

So nothing is mounted on the box. Everything is mounted inside `.sky__frame`,
which is 1600×1000 scaled to cover the box and centred, exactly as
`object-fit: cover` would size a photograph, with the clipping done by
`overflow: hidden`. Every layer inside it is a plain `inset: 0` child at
`mask-size: 100% 100%`: one coordinate system, no cropping maths, and the
generators can put a runway's vanishing point on the horizon by writing
`y = 550` and trusting it. It is also why the cloud tiles are sized in **percent**
and not in `svh` as a first pass had them — inside the frame a tile's aspect is
a fixed fraction of a fixed box, so it is right at every viewport by
construction rather than by a number tuned per component.

**The move, in three acts, and all of it CSS.** The sky comes up out of black
and you are at the window; at 2.1s the camera goes through it — the wall rushes
out past you while the sky settles back, which is the field of view opening up
rather than a zoom; at 2.6s the flight deck arrives around the sky you were
already looking at; at 3.6s the lockup settles. By 4.6s it is done and the only
thing still moving is the weather. It runs **once on load and never again** — a
hero that re-animates every time you scroll back to the top is one you learn to
scroll past. `hero.js` does not start it, time it or step it, so the whole
sequence still runs with scripting off.

**Two custom properties switch it off, and there is no second copy of the end
state.** `--deck-t` multiplies every duration and delay in the move: at `1` it
runs, at `0` every animation is `0s` long and `fill-mode: both` lands it on its
last frame instantly — the finished flight deck, nothing to skip.
`--deck-loop` parks the two things that never stop (the cloud drift, the
instrument breathe) at their first keyframe, which is written to be their
resting state. `prefers-reduced-motion` sets both, and `hero.js` sets them
through `[data-still]` when the page opens already scrolled, because a `#hash`
or a restored position should not start a four-second film nobody can see.

**Scrolled past, nothing moves.** `hero.js` sets `[data-away]` from an
`IntersectionObserver` and a `visibilitychange` listener, and CSS pauses the
four ambient loops — the cloud drift, the instrument glow, the view's float and
the chevron. It pauses rather than cancels, so coming back picks the drift up
where it left off instead of replaying anything. Nothing in the script knows
what is animating: add a fifth loop and it is covered. One consequence lands in
`tools/test-motion.js` — `stillFrame()` waits on `getAnimations()`, and an
infinite animation's `finished` never resolves, so it filters them out rather
than hanging forever.

**The horizon is at 55%, and that number is set twice over.** In the flight
deck it has to sit clear above the glareshield lip (74% of the emitted frame)
or the sunrise is behind the coaming. At the window it is scaled 1.26 about
47%, which lifts it to 57% — the lower half of the aperture, which is where you
would see it from a seat. Move it and check both acts, or one of them ends up
looking at nothing. For the same reason the cloud tiles are **trimmed to their
own cloud tops** by the generator: the top edge of the file is the top of the
weather, so one `bottom`/`height` pair in CSS puts the deck on the horizon and
a retune of the geometry cannot silently open a gap.

**The blur is on the element and the mask is on its `::before`**, on every
`.sky__glow`, and that order is load-bearing. A filter is applied *before* the
mask clips, so blurring a masked element clips the glow straight back to the
shape it came from and there is no glow left. This was got wrong once while
building the page headers — the city's lamps came out as hard dots — which is
why `.sky__geo` (a view that blocks light) and `.sky__glow` (one that emits it)
are two different rules rather than one with a modifier.

**A feature has to be about as wide as the blur that softens it.** The same
mistake in both directions cost three passes: the city's lamps at r≈1 under a
3px blur vanished, and the contrails thin enough to look like threads vanished
under 14px. Both numbers are now set against each other, and both scripts say
so where the constant is.

**The bar goes to glass while it is on the hero.** `site.js` adds
`.is-over-hero` to the nav host while the hero is still behind it, measured
against the hero's own height so a short phone and a tall desktop hand over at
the same point. Every colour in that state is **stated**: the bar normally
takes theme tokens, and over a dark hero in light mode those are near-black
text on a dark ground. The open mobile menu keeps the page's paper rather than
going glass with the bar, because a translucent panel of links is not readable.

Three more things are deliberate:

- **Every layer is optional.** A mask that will not load, an SVG that 404s or a
  browser without `mask` leaves the lockup on the airline's navy — quieter than
  intended, never broken. Nothing renders a skeleton or a placeholder, and the
  flight strip under the hero stays `[hidden]` until real sectors arrive.
- **The only words in the hero are the `<h1>`, and it is `.sr-only`.** The VA
  asked for no type on the opening screen; a page with no heading at all is a
  different thing, and it is broken for a screen reader and invisible to a
  crawler however good the picture is.
- **A cabin film can replace the view.** `AMV_DATA.video` ships empty. Fill it
  in and `hero.js` drops the clip in where the generated sky is, behind the
  same flight deck and under the same lockup — it changes the **view**, not the
  hero. The note in `data.js` says what the clip should be and why the poster is
  not optional.

## Every other page opens on the same aeroplane

Seven page headers, one per page, all of them the same sky system with a
different generated mask and a different time of day. They are not seven
designs: adding an eighth page is a class, a mask and four declarations.

| page | view | time |
| --- | --- | --- |
| `/fleet` | over the wing at cruise | day |
| `/network` | a city under the wing | night |
| `/ranks` | trails climbing out of the deck | dawn |
| `/events` | an airfield in lights, lined up | dusk |
| `/about` | a row of cabin windows, receding | day |
| `/staff` | a fin on stand | dusk |
| `/apply` | the door, open on the morning | dawn |

**The lede stays on the paper.** The header carries the eyebrow, the `h1` and
the rule, and nothing else; the lede and everything under it sit on the page's
own ground below. That one rule is what keeps this from being hero #5 seven more
times — the fight this site kept losing was always type laid over a picture, and
a heading is the most a picture can carry.

**Cloud only where you are at cruise.** A deck sits *below* the horizon, which
is what you see from thirty thousand feet and nowhere else. Four of the views
are of the ground — a city at night, an airfield on final, a fin on stand, a
door standing open — so they have no deck at all. Leaving it under them put an
aeroplane on a stand on top of a cloud, which is the sort of thing nobody can
name and everybody can see.

**A runway has no surface.** From short final a runway is a trapezoid between a
vanishing point on the horizon and a near edge; fit that into a band half a
screen tall and you get a wedge with its apex on the horizon, which reads as a
hill. Two passes went that way. What is left is the lights — edges, centreline
and threshold — because a converging constellation needs no height to read.

**Four times of day, colour only.** `.sky--dawn` is the home page's, to the
value; the others are read off it. A pack never touches a layout number: the
horizon does not move and the sun does not change size, because a time of day
that also re-framed the picture would mean checking every generated view
against four geometries instead of one.

**The bar goes to glass over all of them.** `main > :is(.hero--live,
.skyhead):first-child` is what pulls the picture up under the floating header,
and both have to be in it: `.is-over-hero` puts white type in the bar the
moment either exists, so a picture that was not pulled up leaves that white
type on the white page above it — a bar with no links in it. Anything that
becomes a third opening picture goes in that selector on the day it is written.

**The one box on this site is `.panel`.** The rule in `brand.css` is that prose
is opened by a hairline, never wrapped in a card, and that still holds. But that
rule always allowed a box around "something that is genuinely a surface (a
table, a framed embed)", and the sector list floated onto the greca field read
as loose rows on a pattern. Each tier is a panel now, and so is every
`.table-scroll`. Do not put a paragraph in one.

**Motion is one system, and it lives in two places.** `[data-reveal]` in
`brand.css` says what the movement is; `wireReveal` in `site.js` says when it
starts. Three rules hold it together:

- *Stagger with a group, not with numbers.* Put `data-reveal-group` on a grid
  and every child gets its place in the run worked out from its position —
  `data-reveal-step` changes the gap, `data-reveal-delay` on the container
  offsets the whole run. The home page's six cards used to carry hand-typed
  delays of 0/80/160 on each row, so the cascade visibly restarted halfway
  down; a group cannot do that, and a card added later needs nothing typed in.
  A delay written onto a child still wins, for the cases that mean something
  specific.
- *A delay is CSS, never a timer.* It is set as `--reveal-delay` and consumed by
  `transition-delay`, so the browser schedules the whole run at once. The
  `setTimeout` this replaced ran on the main thread while the transition ran on
  the compositor, and under load the two came apart — a stagger meant to be 80ms
  behind arrived 300ms behind, or out of order.
- *Variants, not new rules.* `data-reveal="fade"` for anything wide (the map, a
  banner) — a full-width figure sliding up reads as a slide deck.
  `data-reveal="lift"` for a longer arrival.

Nothing may be left at opacity 0. An observer only fires on the way in, so
anything injected after the first pass needs `AMV.refresh()`, and anything the
observer will never reach has to be shown outright — landing on a `#hash` and
scrolling back up is the case that catches this. `tools/test-motion.js` walks
every page with the crew centre both down and answering and fails if a single
element is stranded.

**Every section arrives; none of them cut.** The page alternates white and the
tint three or four times, and those changeovers used to be knife edges — one row
of pixels where `#FFFFFF` became `#F7F8FA` and the greca field started
mid-pattern. Four percent of tint is not what you saw; the seam was. The tint
and its texture ramp in and out over `--seam`, inside the section's own padding
so no copy sits in the ramp.

The navy sections did not, and that was the bug the VA reported next: half the
backgrounds moved and half of them snapped. A `.section--ink` now ramps out of
whatever is above it and into whatever is below it over `--ink-seam`, which is
shorter than `--seam` — the two colours are forty percent apart rather than
four, and a straight white-to-navy interpolation spends its middle in mid-grey
and reads as a blur. So the ramp is **eased**: almost nothing over the first
third, the colour arriving over the last. `.hero--live` hands over the same way
when the section under it is pale.

Three things hold it together. The far colour is the **neighbour's** — `:has()`
sets `--ink-near-top` / `--ink-near-bot` to `--bg` or `--bg-alt` so the ramp
ends on exactly the colour the next section starts on. Dark neighbours still
meet on a hard edge, because there is no edge: navy meets navy, and the band and
footer meet theirs with a marigold greca crown that a ramp would leave floating
in a pale sliver — add any new dark block to the `--ink-bot: 0px` and
`--seam-bot: 0px` lists in `brand.css`. And the **decoration ramps with the
ground**: the ruled-feather rails and the eagle watermark run the section's full
height, so both carry the same fade in their own `background`, the greca's trick
and for the greca's reason — one mask layer, no `mask-composite`.

**The route map is a globe, and it is generated, not drawn.**
`assets/js/globe-land.js` is Natural Earth's public-domain 1:110m land,
sampled onto a 1.7-degree lat/lon grid by `tools/make-globe.py` and shipped as
one bit per cell — 7,466 land points in about 4 kB, which as explicit
coordinate pairs would be nearer 30 kB. `assets/js/globe.js` expands that to
unit vectors once and rotates them on a canvas; the arcs are real great circles
between the aerodrome reference points in `AMV_DATA.airports`. Nothing about it
is illustrated, which is what lets it past the rule at the top of `brand.css`.
To regenerate it:

```sh
curl -O https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
python3 tools/make-globe.py ne_110m_land.geojson
```

**There used to be a flat Robinson map here, and it is gone.** `map.js`,
`world.js` and `tools/make-worldmap.py` went with it, along with `.map*` in
`brand.css`. Robinson answered *where* the airline flies and could not answer
*how far*, because no flat map can; the globe answers both, once the detail the
flat map carried — the labels, the block times, the rank gate — has somewhere
else to live. It does:

  * pick a destination and the globe turns to face it, everything else on the
    sphere steps back, and that sector's card opens beside it with every figure
    the old flagship strip carried;
  * the full list is a tab away as a table, and picking a row there comes back
    to the globe pointed at that sector;
  * the bases are the third tab.

They are the same rows drawn three ways, not three features. If you are
restoring any of the flat map, restore the view it belonged to rather than the
rule — and note that `.sr-only` and `.skip` were filed under the route cards
and the header, were nearly lost with them, and now live in their own
`ASSISTIVE` block because nine pages depend on them.

Four things in `globe.js` are load-bearing. The dots crowd towards the poles
because the grid is angular in both axes; that is the graticule, not a texture,
and evening it out would make the sphere read as a flat circle of confetti. The
arcs are lifted off the surface in proportion to the distance flown, so a
sector stays legible when it crosses the limb instead of disappearing over the
horizon halfway through. An arc is hidden exactly where it is behind the sphere
*and* inside the disc — which is the whole of the occlusion test an orthographic
projection needs, and the reason a sector to Tokyo dives behind the planet and
comes out the other side. And the turn towards a pick overshoots by a few per
cent before settling: a plain ease-out is correct and feels like a slide
transition, and the overshoot is what makes it feel like something with mass.

The page registers `onselect` and `onpick` before the first `draw()`, which is
the order the page reads in. `globe.js` therefore keeps handlers on the HOST
element as well as on its state, because the state does not exist until the
first draw — registering them up front silently produced a globe that picked up
nothing at all, once.

Under `prefers-reduced-motion` the globe is still drawn, can still be turned by
hand, and a pick still opens its card with every figure in it — but the drift,
the travelling arc heads, the turn and the frame loop itself all stop.
`tools/test-globe.js` fails if the loop merely goes quiet and keeps repainting
an identical frame.

A sector whose airports are not in `AMV_DATA.airports` is listed in the table
and left off the globe, and the hint under it says how many. Do not add
coordinates you have not looked up.

**The home page and the calendar read the same feed, and only that feed.** Both
call `AMV_CREW.events()` and render what it returns: a waiting state while the
request is in flight, the soonest published event if there is one, and an empty
note if there is not.

`data.js` used to carry four events as a fallback so neither page was ever
empty, and every one of them was invented — Valle de México Fly-In, Connect
Regional Rush, Águila Transatlántica, Pacífico Nocturno, each with a date, a
route and a slot count. A visitor on a slow connection was shown four
departures that did not exist, under a heading promising the next one. That is
worse than a blank card: an invented statistic is something nobody can turn up
for, and an invented event is not.

So `events: []` in `data.js` is deliberate and should stay that way. Publish
events in the crew center, which is where sign-ups are counted anyway. Do not
put a specimen event in `data.js` to see what the card looks like —
`tools/test-events-page.js` checks for those four titles by name and fails if
they reappear.
