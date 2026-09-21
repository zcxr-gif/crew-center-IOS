"""Emit assets/img/cloudbank.svg and cloudbank-far.svg — the deck below.

The home page's opening sequence looks out of a window, and the one thing that
has to be out there is weather. These are the cloud tops: a flat deck with a
lumpy upper surface, seen from above at cruise.

WHY IT IS ALLOWED TO EXIST. brand.css's standing rule is no pictorial
invention, and "if the next idea cannot be expressed as a script that emits it,
it is the wrong idea." A cumulus deck passes on the same grounds as the greca:
nothing here is drawn or traced. Every lump is a circle whose centre and radius
come out of a seeded PRNG, unioned by overlapping — the shape is a consequence
of the arguments to `deck()` at the foot of this file, and retuning the cluster
count or the radius range gives a different sky rather than a redrawn one. The
seed is fixed so the file is reproducible: running this twice gives
byte-identical output, and the diff of a retune is readable.

SEAMLESS BY CONSTRUCTION. Any lump within its own radius of either edge is
emitted a second time one tile-width away, so the tile abuts a copy of itself
with no join. brand.css drifts the deck by translating an element that holds a
whole number of tiles, by a whole number of tiles, and relies on that join — a
seam would walk across the window every W pixels.

    assets/img/cloudbank.svg      the near deck: tall lumps, hard top
    assets/img/cloudbank-far.svg  the far deck: flatter, for the layer behind

Both are monochrome masks, like the greca and the mark: brand.css paints them
and sets their opacity, so one file serves the lit tops and the shadowed side.

    python3 tools/make-cloudbank.py
"""
import pathlib
import random

IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img"

W = 1600               # tile width; the height is measured, not set — see below
PAD = 5                # clear air above the tallest lump, in tile units
FLOOR = 70             # default solid deck kept below the base (see svg())
SEED = 7               # fixed: see SEAMLESS BY CONSTRUCTION above


def deck(clusters, per, r_range, base, seed, tufts=5, course=3):
    """One cloud deck, as a list of (cx, cy, r) circles.

    clusters  how many cumulus heaps across the tile
    per       lumps in a heap — more reads as a single softer mass
    r_range   (min, max) lump radius
    base      y of the flat underside; everything below it is solid
    tufts     smaller lumps riding the tops of the big ones
    course    lumps in the unbroken low row, per heap — see THE COURSE below

    THE COURSE IS WHAT MAKES IT A DECK. Heaps alone leave slots: two narrow
    ones land side by side without overlapping, and the sky shows through a
    vertical gap all the way down to the flat underside — which reads as a hole
    punched in the cloud, not as a gap between clouds. So a low, unbroken row
    runs the whole width underneath them, with its radius set from its own
    spacing so consecutive lumps are guaranteed to overlap however the radii
    jitter. It is also what a cumulus deck IS: a continuous layer with heaps
    rising out of it.

    DETAIL AT TWO SCALES. A first pass used one radius range and drew a row of
    near-identical bubbles: from inside the flight deck it read as a cartoon,
    because real cloud tops carry small relief on top of large. The tufts are
    that second scale, and they are placed ON a lump already emitted rather
    than at random, so every one of them is guaranteed to overlap the mass it
    belongs to instead of floating off it.
    """
    rng = random.Random(seed)
    out = []

    # The course, first, so the heaps are drawn over it. Spacing s, radius
    # 0.75s: the closest two neighbours can get to not touching is 2 * 0.75 *
    # 0.85 * s = 1.27s, still wider than the s between their centres.
    n = max(1, clusters * course)
    s = W / n
    for i in range(n):
        r = s * 0.75 * rng.uniform(0.85, 1.15)
        out.append(((i + 0.5) * s, base - r * rng.uniform(0.35, 0.6), r))

    for i in range(clusters):
        # Heaps are spaced evenly and then jittered, rather than placed at
        # random: pure random placement clumps and leaves gaps, which reads as
        # a mistake rather than as weather.
        hx = (i + 0.5) * (W / clusters) + rng.uniform(-W / clusters * 0.3, W / clusters * 0.3)
        # One multiplier per heap, so some heaps tower and some lie flat.
        spread = rng.uniform(0.62, 1.3)
        heap = []
        for _ in range(per):
            r = rng.uniform(*r_range) * spread
            cx = hx + rng.uniform(-1.6, 1.6) * r
            # EVERY LUMP REACHES THE DECK. Its centre is set from its OWN radius
            # rather than from a heap height, so the bottom of the circle always
            # crosses the flat underside. A lump parked above it leaves a
            # triangular notch between itself and its neighbour, and that notch
            # is the one artefact that gives the whole thing away as circles.
            #
            # It also means relief follows size, which is what a cumulus deck
            # does: the big heaps are the tall ones, and the small ones lie in
            # between them rather than floating at the same height.
            cy = base - r * rng.uniform(0.55, 0.95)
            heap.append((cx, cy, r))
        for _ in range(tufts):
            bx, by, br = heap[rng.randrange(len(heap))]
            out.append((bx + rng.uniform(-0.6, 0.6) * br,
                        by - rng.uniform(0.2, 0.5) * br,
                        br * rng.uniform(0.3, 0.55)))
        out.extend(heap)
    return out


def svg(circles, base, floor=FLOOR):
    """Circles plus the solid underside, wrapped, with the edges wrapped too.

    THE TILE IS TRIMMED TO ITS OWN CLOUD TOPS. The height is measured off the
    tallest lump rather than declared, so the top edge of the file is the top
    of the weather, give or take PAD. That is what lets brand.css sit the deck
    ON the horizon by setting one number: if the tile carried a band of empty
    air above the lumps, that band would open a gap between the horizon and the
    cloud tops, and the gap would change every time the geometry was retuned.

    THE SKIRT IS NOT DECORATION. `floor` is how far the flat underside runs on
    past the lumps, and it is what hides the tile's own bottom edge. A deck has
    to end somewhere below the frame that is actually looked through — behind
    the glareshield, or below the window — or a straight horizontal cut shows
    through the gaps in whatever is in front of it. The far deck needs a long
    one for exactly that reason: the near deck is in front of it, and the near
    deck has gaps.
    """
    lift = min(cy - r for cy, r in ((c[1], c[2]) for c in circles)) - PAD
    circles = [(cx, cy - lift, r) for cx, cy, r in circles]
    base -= lift
    h = base + floor

    parts = [f'<rect x="0" y="{base:.0f}" width="{W}" height="{floor}"/>']
    for cx, cy, r in circles:
        xs = [cx]
        # The wrap. Anything overhanging an edge is emitted again on the other
        # side, so the tile joins a copy of itself cleanly.
        if cx - r < 0:
            xs.append(cx + W)
        if cx + r > W:
            xs.append(cx - W)
        for x in xs:
            parts.append(f'<circle cx="{x:.1f}" cy="{cy:.1f}" r="{r:.1f}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h:.0f}" '
            f'width="{W}" height="{h:.0f}" preserveAspectRatio="none">'
            f'<g fill="#fff">' + "".join(parts) + "</g></svg>\n")


def write(name, body):
    path = IMG / name
    path.write_text(body, encoding="utf-8")
    # THE ASPECT IS PRINTED BECAUSE brand.css NEEDS IT. The tile height is
    # measured off the geometry, so it moves whenever these are retuned — and
    # `--tile` on .deck__cloud--near/--far is this ratio times the band's
    # height in the stylesheet. Change the clouds, carry the number across, or
    # the deck goes back to stretching on a phone.
    h = int(body.split('height="', 1)[1].split('"', 1)[0])
    print(f"wrote {path.relative_to(IMG.parent.parent)}  ({len(body)} bytes, "
          f"{W}x{h}, aspect {W / h:.2f})")


def main():
    # The near deck. Big lumps, high relief — this is the one that reads as
    # cloud rather than as haze, and it is the one that drifts fastest.
    write("cloudbank.svg",
          svg(deck(clusters=8, per=8, r_range=(26, 94), base=268, seed=SEED),
              base=268))

    # The far deck. Flatter and lower, so that parallax between the two does
    # the work no single layer can: one layer drifting is a moving picture, two
    # at different rates is distance.
    write("cloudbank-far.svg",
          svg(deck(clusters=13, per=7, r_range=(16, 54), base=300,
                   seed=SEED + 1, tufts=3),
              base=300, floor=210))


if __name__ == "__main__":
    main()
