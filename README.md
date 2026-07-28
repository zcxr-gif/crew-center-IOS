# Aeromexico Virtual

The public website for **Aeromexico Virtual**, an Infinite Flight virtual airline,
and the brand contract that its Inflight Crew Center renders from.

Static HTML, CSS and vanilla JS. No build step, no framework, no bundler — open
`index.html` and it works.

```
index.html        Home — hero, live roster, fleet, network, ranks, next event
fleet.html        The six operated types
network.html      Hubs + all 23 sectors, filterable by region
events.html       Upcoming and flown events
join.html         Requirements + the real application form (framed)
crew.html         The Crew Center, framed in our own chrome

brand.json        ← the brand contract. See "One brand, two products" below.
assets/brand.css  The design system. Every token lives here.
assets/js/data.js Fleet, routes, hubs, ranks, events, roster figures
assets/js/site.js Nav, footer, mark, icons, theme, reveal, counters
assets/js/live.js Mounts the Inflight live-traffic widget
assets/img/       The mark, and the three motifs. See "The ornament" below.
```

---

## The ornament

The site used to decorate itself with one blue → plum → pink gradient — blurred
behind the hero, painted across the CTA band, clipped into the headline, and
used as the fill of every fleet card — plus a dot-grid. That is the house style
of software nobody art-directed, and it said nothing about a Mexican airline.

**Two rules now. Colour comes from ornament, not from gradients — and the
ornament is linear, not tiled.** Three motifs carry it, each drawn from scratch
as geometry and documented at the top of its own file:

| file | motif | where it runs |
|---|---|---|
| `greca.svg` | the step-fret band (*xicalcoliuhqui*) off the friezes at Mitla | every `.rule`, the hero/strip seam, the footer cornice |
| `papel.svg` | papel picado, cut-paper fiesta bunting | once per page, above the CTA band |
| `serpent.svg` | Quetzalcóatl, after the nose art on Aeroméxico's XA-ADL | the CTA band watermark |

There was a fourth — a Puebla azulejo tiled across the hero, the CTA band, every
navy section and every fleet panel. It is gone, and it should not come back.
Authentic motif, wrong application: a geometric tile repeated edge to edge
behind content is exactly the wallpaper a generated layout reaches for, and at
that scale it read as a star field competing with the text rather than as
tilework. **Ornament here runs as bands along an edge** — a frieze on a seam,
bunting on a rule — the way a building carries it.

Two things about how they are wired:

**greca and serpent are CSS masks, not images.** They are monochrome
files painted through with a brand token, so one file serves every colour and
both themes — set `color` on the element and the motif follows. Give one a
`background-image` instead and it will be stuck black. Papel picado is the
exception and is a real background-image: fiesta colour is not brand colour, it
does not re-tint, and it is the same in the dark.

**The greca rule's dimensions are arithmetic, not taste.** `greca.svg` is a
40 × 26 tile, so at height *h* a tile renders `40/26 × h` wide. `.rule` is
13px × 120px because that is exactly six whole spirals. Any height that does
not divide cleanly ends the rule on half a spiral, which reads as a rendering
bug. Full-bleed friezes are exempt — they run to the viewport edge, where a
clipped tile is just how a border behaves.

The palette is the livery (navy, blue, that red) plus the colours the
Quetzalcóatl 787 actually wears, on white. The greys lean very slightly navy so
they read as chosen rather than as a default mid-grey. The national tricolour
runs across the top of every page (`.flagline`),
under every `.eyebrow`, beneath the active nav item, and next to *Hecho en
México* in the footer — always with hard stops, because a flag does not have a
gradient in it, and always with a hairline, because the middle band is white
and on white a bare white band disappears entirely.

If you are adding something and you reach for a multi-hue gradient, reach for a
motif instead.

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

Exactly one thing on this site is live: the **"who's airborne right now"**
roster, which is Inflight's embed widget (`assets/js/live.js`) reading Infinite
Flight traffic for callsigns starting `Aeromexico`. It runs in `roster` mode, so
it renders no map, needs no Mapbox token, and costs nobody a map load.

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
are picked up automatically. `_headers` sets a CSP whose only permitted frame
and connect target is `inflight.info`.

---

## Notes for whoever picks this up next

**`crew.html` frames a cross-origin sign-in.** That works, but a browser with
strict third-party storage partitioning can refuse it. The page detects the
frame never loading and swaps in a direct link — deliberately, rather than
showing an empty box. If that fallback starts firing for everyone, make
`crew.html` a branded launcher instead of a frame.

**There is no logo in the repo, deliberately.** Until the airline's own
Caballero Águila artwork is committed, the brand lockup is the wordmark plus the
tricolour — both real. An earlier pass shipped a hand-drawn eagle standing in
for it; a drawn-from-memory approximation of a real mark is worse than no mark,
because it looks like the airline chose it. It was removed rather than refined.

**Adding the real logo is one file.** `brand.css` paints `assets/img/mark.svg`
through a CSS mask (`.mark`), the same way it handles `greca.svg` and
`serpent.svg`, so one file recolours every placement — nav, footer, hero
watermark, favicon — and there is no second copy of the geometry to keep in
step. To add it:

1. Put the artwork at `assets/img/mark.svg`. From a bitmap:
   ```bash
   convert logo.png -threshold 60% -negate pbm:- \
     | potrace --svg --turdsize 8 --alphamax 1 -o assets/img/mark.svg
   ```
2. Flip `HAS_MARK` to `true` in `assets/js/site.js`.
3. Set `--mark-ratio` in `brand.css` to the artwork's real width/height.
4. Re-add the favicon and `og:image` links in the page heads.

The mask needs the logo's white cut-lines to be **actual holes**
(`fill-rule="evenodd"`), not white-filled shapes — otherwise they will paint
solid. `potrace` produces holes correctly from a clean two-colour bitmap.

`assets/img/serpent.svg` *is* original — drawn from scratch, not traced from
and not reproducing the XA-ADL nose art. Keep it that way.

Aeromexico Virtual is not affiliated with Aeroméxico; the footer disclaimer
says so on every page and should stay there. Using the airline's own
Caballero Águila is a call the VA's staff have made — worth knowing that it is
a real trademark, and that the disclaimer is what carries the distinction. The
tricolour is used as a decorative device only — plain bands, never the national
coat of arms.

**Events go stale.** `data.js` events carry ISO-8601 dates with an explicit UTC
offset; `events.html` sorts them into upcoming and flown on its own. Past events
do not need deleting — they move themselves.
