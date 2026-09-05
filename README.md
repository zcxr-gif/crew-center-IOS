# Aeromexico Virtual

The public website for **Aeromexico Virtual**, an Infinite Flight virtual airline,
and the brand contract that its Inflight Crew Center renders from.

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler — open
`index.html` and it works.

```
index.html         Home — hero, live figures, why, the route map, next event
fleet.html         The six operated types, what each one flies, and what is planned
network.html       The route map, then every published sector grouped by tier
ranks.html         The ladder: hours, aircraft released, sector limits
events.html        The calendar, the programme, and what has been flown
about.html         Mission, the CEO's message, standards, the first twelve months
staff.html         Who runs the airline, and what each of them owns
join.html          Requirements, the real application form (framed), and life after joining
crew.html          The Crew Center, framed in our own chrome

brand.json         ← the brand contract. See "One brand, two products" below.
assets/brand.css   The design system. Every token lives here.
assets/js/data.js  Identity, staff, fleet, hubs, network, ranks, events — from the Operations Plan
assets/js/site.js  Nav, footer, mark, icons, theme, reveal, counters, rank arithmetic
assets/js/map.js   Draws the route map: great circles, dots, label placement
assets/js/world.js GENERATED coastlines — see tools/make-worldmap.py
assets/js/live.js  Mounts the live-traffic embed
assets/js/crew.js  Read-only client for the crew center's public feeds
tools/             Regenerate mark.svg, the ruled device and world.js from source
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
| `assets/img/mark.svg` | the Caballero Águila, traced from `Aeromexico-Symbol.webp` | nav, footer, favicon, fleet entries, and faded behind dark sections |
| `assets/img/stripes.svg` | the ruled-feather device off the mark | right edge of dark sections |
| `assets/img/stripes-mirror.svg` | the same profile flipped | left edge of dark sections |
| `assets/img/greca.svg` | the stepped fret, generated from a grid | a band across the top of the footer |
| `assets/img/greca-tile.svg` | the same fret over its mirror | a faint field across `.section--alt` |
| `assets/img/serpent.svg` | a Quetzalcóatl frieze, generated from a grid | a band along the top of every `.band` |
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

Two build steps, both reproducible and both leaving the supplied originals
untouched:

```bash
python3 tools/trace-mark.py   # Aeromexico-Symbol.webp -> mark.svg   (potrace)
python3 tools/make-stripes.py # full-logo.webp         -> stripes.svg + stripes-mirror.svg
python3 tools/make-greca.py   # (parameters only)      -> greca.svg + greca-tile.svg
python3 tools/make-serpent.py # (parameters only)      -> serpent.svg
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

An **empty** answer is treated the same as no answer, deliberately. A crew
center whose route list has not been filled in yet would otherwise blank a
network page that this repo already knows 23 sectors for.

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

**The home page opens on the aeroplane, and says nothing over it.**
`assets/js/hero.js` builds the stage out of `AMV_DATA.fleet[].photo` — the VA's
own sim shots of these exact airframes, the same ones the fleet page carries —
flagship first, cross-faded with a slow drift, full bleed. Under it, a handful
of approved sectors sampled at random off the crew centre's public flight log
(`AMV_CREW.pireps()`): real pilots, real routes, filed by flying them. Then the
airline in four counted figures.

**There is no headline and no lede, and that is the point.** Three heroes have
now been thrown out of this repo. A two-column white header, which was fine and
in the VA's words not memorable. A poster — the 787-9 drawn in its special
livery, ringed by folk art, over the wordmark — which was memorable and was a
drawing, sitting one click from photographs of the same airframe. And then the
photographs with the usual furniture on top: eyebrow, 70px tagline, a paragraph
of positioning copy. That furniture came off because it covered up the subject,
and because unlike the rest of this site it was written once and would have gone
on being said.

What replaced it is `.hero__plate`: the aircraft on screen **naming itself** —
type, registration, what the type is for, and a sector it flies, in cities where
the site already names them. It is set in the display face because it is the
headline now. Every word of it is read off `data.js` and changes when the stage
does. The page is still named for a screen reader and a crawler by an `.sr-only`
`<h1>`; it is simply not set in 70px over the aeroplane. `plane-hero.webp`,
`plane-logo.webp` and `tools/crop-hero.py` went with the poster, and the share
card on every page is a real photograph now.

Four things about the stage are deliberate:

- **Every layer is optional.** No photographs in `data.js`, a quiet backend, a
  failed image fetch or scripting off, and the hero is the airline's navy wash,
  the two buttons and the counted facts. A photo that 404s drops out of the
  rotation; the flight strip stays `[hidden]` until real sectors arrive. There
  is no skeleton and no placeholder leg anywhere in it — and now no copy to fall
  back on either, which is the whole reason that contract is strict.
- **It only runs when it is being looked at.** Seven second dwell, paused by an
  `IntersectionObserver` when the hero scrolls away, by `visibilitychange` when
  the tab goes to the back, and by hover or focus. Asked for reduced motion it
  does not advance at all — the dots still work, and the drift and cross-fade
  come off in CSS.
- **Photographs load as they are needed.** Only the first slide carries a `src`
  on first paint; each one loads as the slide before it comes up. Five 1920px
  photographs fetched to show one is the whole of an opening screen's budget.
- **Nothing is cropped, on either screen.** `object-fit` is `contain`, not the
  `cover` a full-bleed hero normally reaches for: these are 1920x886 photographs
  of whole aeroplanes, and under `cover` a tall frame ate the tail off one side
  and the nose off the other. Two geometries carry it. Wide (>= 48rem) the hero
  is at least 50vw tall — taller than a 2.167 ratio needs at that width — so
  `contain` fits by width and the slack lands as navy inside the veil, where it
  is invisible. Narrow (< 48rem) the stage leaves the absolute layer, takes the
  photograph's own `aspect-ratio`, and the plate stacks underneath it on navy;
  that is the only arrangement in which this ratio fits a 390px screen whole
  and still leaves the type somewhere legible. The one case `contain` gets
  wrong is a viewport *wider* than the photograph, where fitting by width would
  pillarbox it — an `(min-aspect-ratio: 19/10)` query falls back to `cover`
  there, because a few percent off the sides beats two navy columns.
- **The drift is `object-position`, not `transform: scale()`.** A Ken Burns
  scale grows the image past its box and the box clips it, which is a crop —
  the one thing this stage does not do. Percentage `object-position` on a
  *contained* image is defined against the letterbox slack, so a 28% -> 72%
  pan moves only through navy and cannot reach the picture's edges at any
  viewport. On the phone band there is no slack, so the drift comes off there
  and the cross-fade carries it.
- **Hub photography slots in through `AMV_DATA.heroStills`.** Entries there
  lead the rotation, ahead of the fleet, and the plate renders an ICAO in the
  marigold slot where an airframe puts its tail number — so a hub still reads
  "Benito Juárez Intl · MMMX · Primary hub · Mexico City" with no special
  casing. The array ships **empty**, and the comment in `data.js` says why: a
  stock picture of Terminal 2 is the "invented artwork standing in for a real
  airline" that the header of `brand.css` exists to keep out, with a licensing
  problem on top. The fleet shots clear that bar because they are the VA's own,
  taken in the sim. Hub shots should clear the same one.

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

**The route map is generated, not drawn.** `assets/js/world.js` is Natural
Earth's public-domain 1:110m land, reprojected Robinson and simplified by
`tools/make-worldmap.py`; the arcs are real great circles interpolated in
`assets/js/map.js`; the airports are their real aerodrome reference points in
`AMV_DATA.airports`. Nothing about it is illustrated, which is what lets it
past the rule at the top of `brand.css`. To regenerate it:

```sh
curl -O https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
python3 tools/make-worldmap.py ne_110m_land.geojson
```

Two details in `map.js` are load-bearing and look like fussiness until you
remove them. Label type is sized from how many map units the host paints per
pixel, because an SVG scales its text with the viewBox and a label that reads on
a desktop map is nine pixels tall on a phone; the map redraws on resize for the
same reason. And the crop is computed twice — once from the arcs, then again to
contain the labels that were placed inside it — because Mexico City, Monterrey,
Guadalajara and Cancún sit within a few degrees of each other and their names
end up outside the first box.

The map is sized by HEIGHT and allowed to be wider than the page, inside a
scroller you can drag, swipe or scroll. Fitted to the container's width instead,
a network running from Los Angeles to Tokyo is 258 degrees of longitude squeezed
into one column — about 130px tall on a phone, which is a diagram of a map
rather than a map. It opens with the primary hub brought to the middle of the
view, and the "drag sideways" hint only appears when there is more than 64px of
pan to be had.

A sector whose airports are not in `AMV_DATA.airports` is listed by the network
page and left off the map, and the legend says how many. Do not add coordinates
you have not looked up.

**The home page and the calendar now read the same feed.** Both paint from
`data.js` first and upgrade to `AMV_CREW.events()` when it answers, so the home
page can no longer advertise a departure the calendar has never heard of — which
it could for as long as that card was hand-typed only.

`data.js` events stay as the fallback, and they earn their place: a visitor who
is offline, blocked or on a slow connection gets a calendar rather than a
spinner. Keep them roughly true. Entries carry ISO-8601 dates with an explicit
UTC offset and past ones age out on their own — nothing needs deleting.
