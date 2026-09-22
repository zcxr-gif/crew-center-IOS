"""Emit assets/img/view-*.svg — one view out of the aeroplane per page.

The home page opens at a cabin window and goes forward into the flight deck
(tools/make-flightdeck.py). Every other page opens on a different view from the
same aeroplane, so the site is one flight rather than one picture reused eight
times:

    view-wing.svg           /fleet    over the wing at cruise
    view-city.svg           /network  a city under the wing at night
    view-contrails.svg      /ranks    trails climbing out of the deck
    view-runway.svg         /events   an airfield in perspective, in lights
    view-cabin-row.svg      /about    a row of cabin windows, receding
    view-tail.svg           /staff    a fin against a dusk sky
    view-door.svg           /apply    the door, open on the morning

WHY THESE ARE ALLOWED TO EXIST. brand.css's standing rule is no pictorial
invention, and "if the next idea cannot be expressed as a script that emits it,
it is the wrong idea." Every view below is a set of coordinates and nothing
else: a wing is a swept quadrilateral with a nacelle and a winglet, a runway is
a trapezoid with its markings spaced by a perspective law, a city is a field of
points whose size and density follow depth, a fin is four corners. Nothing here
is traced, shaded or drawn by eye, and no view contains a likeness of anything —
there is no aircraft silhouette flying in front of you, no terrain, no people.

WHAT IS NOT HERE, and should not be added: the Caballero Águila on the fin. The
mark is real artwork the airline owns and it is used all over this site, but
painting it onto a generated tail would make the tail claim to be a photograph
of a specific aeroplane. The fin is a shape; /staff is not a livery study.

THE COMMON FRAME. Every file is 1600x1000, the same frame the flight deck uses,
and brand.css mounts all of them inside `.sky__frame` — one box, sized to cover
the band, that the sky gradient and the cloud decks live in too. That is what
keeps a runway's vanishing point on the painted horizon at every viewport
ratio. HORIZON below is that line and it must match `--sky-h` in brand.css.

Every file is a MONOCHROME MASK, like mark.svg and greca.svg: brand.css decides
whether a view is a dark interior or a lit exterior, which is why a wing (lit
from above at dawn) and a cabin wall (near black) come out of the same script.

    python3 tools/make-views.py
"""
import pathlib
import random

IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img"

VB_W, VB_H = 1600, 1000
CX = VB_W / 2

# The painted horizon, in frame units. `--sky-h: 55%` in brand.css is this
# number; a view whose geometry meets the horizon (the runway, the city, the
# wing tip) is wrong the moment the two disagree.
HORIZON = 550

# Everything is built past the edges of the frame, because `.sky__frame` is
# sized to COVER its band and the overflow is cropped — a shape that stops at
# the viewBox edge would show its own end on a wide screen.
BLEED = 500


def head():
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VB_W} {VB_H}" '
            f'width="{VB_W}" height="{VB_H}" preserveAspectRatio="none">')


def rounded_rect(cx, cy, w, h, rx, ry):
    """A stadium/rounded rectangle as an explicit path.

    Written out rather than left as <rect rx ry> because these are also used as
    holes inside a fill-rule="evenodd" shape, where the direction a subpath is
    wound decides whether it cuts or fills.
    """
    x0, x1 = cx - w / 2, cx + w / 2
    y0, y1 = cy - h / 2, cy + h / 2
    rx, ry = min(rx, w / 2), min(ry, h / 2)
    return (f"M{x0 + rx:.1f},{y0:.1f} H{x1 - rx:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x1:.1f},{y0 + ry:.1f} "
            f"V{y1 - ry:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x1 - rx:.1f},{y1:.1f} "
            f"H{x0 + rx:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x0:.1f},{y1 - ry:.1f} "
            f"V{y0 + ry:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x0 + rx:.1f},{y0:.1f} Z")


def poly(points, r=0):
    """A polygon with every corner radiused, at any angle.

    Each corner is pulled back along both of its edges and the two ends joined
    by a quadratic through the original point, which is the only way to radius
    a shape that is not still square — an `rx` on a <rect> cannot do a swept
    wing or a canted winglet.
    """
    n = len(points)
    out = []
    for i, (x, y) in enumerate(points):
        px, py = points[(i - 1) % n]
        nx, ny = points[(i + 1) % n]

        def pull(ax, ay):
            vx, vy = ax - x, ay - y
            d = (vx * vx + vy * vy) ** 0.5 or 1
            k = min(r, d / 2) / d
            return x + vx * k, y + vy * k

        ix, iy = pull(px, py)
        ox, oy = pull(nx, ny)
        if r <= 0:
            out.append(("M" if i == 0 else "L") + f"{x:.1f},{y:.1f}")
            continue
        out.append(("M" if i == 0 else "L") + f"{ix:.1f},{iy:.1f}")
        out.append(f"Q{x:.1f},{y:.1f} {ox:.1f},{oy:.1f}")
    return " ".join(out) + " Z"


def wall_minus(holes):
    """An oversized wall with shapes cut out of it, as one evenodd path."""
    return (f'M{-BLEED},{-BLEED} H{VB_W + BLEED} V{VB_H + BLEED} H{-BLEED} Z '
            + " ".join(holes))


def paths(d, fill_rule=None):
    rule = f' fill-rule="{fill_rule}"' if fill_rule else ""
    return head() + f'<path fill="#fff"{rule} d="{d}"/></svg>\n'


def dots(circles):
    # Whole units for the centres and one decimal for the radius. At the size
    # these are drawn a tenth of a frame unit is well under a tenth of a pixel,
    # and the precision was a third of the file.
    body = "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}"/>'
                   for x, y, r in circles)
    return head() + f'<g fill="#fff">{body}</g></svg>\n'


# ---------------------------------------------------------------------------
# /fleet — over the wing
# ---------------------------------------------------------------------------
# A window seat behind the root, looking out along the wing. Three shapes: the
# planform, the nacelle that pokes forward of the leading edge, and the winglet
# that cants up off the tip. The tip sits just below the horizon, because the
# aeroplane is flying level — a tip above it is a banking turn, which is a
# different picture and a busier one.
WING = [(-BLEED, 786), (1290, 620), (1382, 702), (-BLEED, 1500)]
WINGLET = [(1290, 620), (1382, 702), (1530, 470), (1448, 396)]
NACELLE = (300, 772, 470, 182, 88, 88)   # cx, cy, w, h, rx, ry


def wing():
    return paths(" ".join([
        poly(WING, 12),
        poly(WINGLET, 14),
        rounded_rect(*NACELLE),
    ]))


# ---------------------------------------------------------------------------
# /network — the city below, at night
# ---------------------------------------------------------------------------
# Not a map and not a place: a field of lights whose size and spacing follow
# depth, which is the whole of what a city looks like from a descent. `v` is
# depth, 0 at the horizon and 1 underneath you, and y follows v to a power so
# the lights crowd toward the horizon the way a plan does when you tip it away.
CITY_SEED = 11
# Counted, not guessed: this is the only file here that is a list of points
# rather than a handful of paths, so it is the only one whose SIZE is a design
# constraint. A first pass at 1100 loose lights and 22 avenues emitted 75 KB of
# mask for a picture that reads identically at a third of that.
CITY_LIGHTS = 700
CITY_ROADS = 16
CITY_ROAD_STEPS = 26


def city_y(v):
    return HORIZON + 5 + (VB_H + 260 - HORIZON) * (v ** 2.15)


def city_r(v):
    # Sized to survive a blur. brand.css paints these through a filter, and a
    # lamp smaller than the blur radius does not become a soft lamp — it
    # becomes nothing. A first pass at 0.9 + 5.4 lost the whole far half.
    return 1.8 + 8.0 * (v ** 1.5)


def city():
    rng = random.Random(CITY_SEED)
    out = []
    for _ in range(CITY_LIGHTS):
        v = rng.random()
        out.append((rng.uniform(-BLEED, VB_W + BLEED), city_y(v), city_r(v)))

    # The avenues. Without them the field reads as static; a city seen from the
    # air is mostly the grid. Each one runs from a vanishing point on the
    # horizon out toward the viewer, sampled at the same depth law so its lamps
    # space out as it comes forward.
    for _ in range(CITY_ROADS):
        vx = rng.uniform(CX - 700, CX + 700)
        far, near = rng.uniform(0.04, 0.2), rng.uniform(0.75, 1.0)
        spread = rng.uniform(-1.0, 1.0)
        steps = CITY_ROAD_STEPS
        for i in range(steps):
            v = far + (near - far) * (i / (steps - 1))
            x = vx + spread * (VB_W * 1.15) * (v ** 1.25)
            out.append((x, city_y(v), city_r(v) * 0.82))
    return dots(out)


# ---------------------------------------------------------------------------
# /ranks — climbing
# ---------------------------------------------------------------------------
# Trails, fanning up and to the right, wide and diffuse at the bottom where
# they are old and narrow at the head where they are new. No aeroplane at the
# head of any of them: a drawn aircraft is the pictorial invention this whole
# file is written to avoid, and the climb is legible without one.
# THIS NUMBER HAS BEEN WRONG IN BOTH DIRECTIONS. Two passes were too wide and
# read as ribbons laid across the sky rather than as trails behind anything;
# the pass after that was thin enough that brand.css's blur erased them and
# /ranks was a plain sunrise. A trail has to be about as wide as the blur that
# softens it — under that and there is nothing left to soften. A contrail is a thread that
# spreads as it ages, so w0 (the old end, bottom left) is small and w1 (the
# head) is barely there; brand.css blurs them, and the blur is most of the
# width you actually see.
TRAILS = [
    # x0, y0, x1, y1, w0, w1, bow
    (-480, 1010, 1180, 262, 11.0, 2.4, 150),
    (-420, 1180, 1520, 380, 8.0, 2.0, 118),
    (120, 1150, 1610, 168, 6.5, 1.7, 96),
    (-500, 820, 700, 262, 5.0, 1.5, 74),
]


def trail(x0, y0, x1, y1, w0, w1, bow):
    """One trail: a tapered ribbon along a bowed line.

    Built as two quadratics sharing a control point pushed off the chord by
    `bow`, so the trail arcs the way a climb does instead of ruling a straight
    line across the sky.
    """
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    d = (dx * dx + dy * dy) ** 0.5 or 1
    nx, ny = -dy / d, dx / d              # unit normal to the chord
    cxp, cyp = mx + nx * bow, my + ny * bow
    wm = (w0 + w1) / 2 * 1.15
    return (f"M{x0 + nx * w0:.1f},{y0 + ny * w0:.1f} "
            f"Q{cxp + nx * wm:.1f},{cyp + ny * wm:.1f} {x1 + nx * w1:.1f},{y1 + ny * w1:.1f} "
            f"L{x1 - nx * w1:.1f},{y1 - ny * w1:.1f} "
            f"Q{cxp - nx * wm:.1f},{cyp - ny * wm:.1f} {x0 - nx * w0:.1f},{y0 - ny * w0:.1f} Z")


def contrails():
    return paths(" ".join(trail(*t) for t in TRAILS))


# ---------------------------------------------------------------------------
# /events — the airfield, in lights
# ---------------------------------------------------------------------------
# Lined up, looking down the runway. THERE IS NO SURFACE, and that is the whole
# design of this one. A runway surface is a trapezoid between a vanishing point
# on the horizon and a near edge, and a page header is a wide, shallow band: fit
# that trapezoid into it and you get a wedge with its apex on the horizon, which
# reads as a hill. Two passes went that way before the surface came out.
#
# The lights do not have the problem, because a converging constellation needs
# no height to read — it is the one part of an airfield that is legible in a
# letterbox. Edges, centreline and threshold, and nothing else.
#
# TWO LAWS, AND THEY ARE DIFFERENT ON PURPOSE. The edges of a runway are
# straight, so half-width is LINEAR in y. What is not linear is where the
# markings fall: those are evenly spaced on the ground and therefore crowd
# toward the horizon on screen, which is the `**` below. Give both the same law
# and the runway either bows or its stripes march at a constant pitch, and
# either one reads as a drawing of a runway rather than a runway.
VP_Y = HORIZON + 3
VP_HALF = 30
# The near end runs off the bottom of the frame on purpose: the lights are
# meant to arrive from under you, not to start at an edge.
NEAR_Y = 1150
NEAR_HALF = 760
MARK_POW = 2.4


def rw_half(y):
    return VP_HALF + (NEAR_HALF - VP_HALF) * (y - VP_Y) / (NEAR_Y - VP_Y)


def rw_y(t):
    return VP_Y + (NEAR_Y - VP_Y) * (t ** MARK_POW)


def runway():
    out = []
    # The centreline: dashes, each one a trapezoid because a stripe in
    # perspective is wider at its near end than at its far end.
    for i in range(20):
        t0 = 0.035 + i * 0.049
        t1 = t0 + 0.038
        if t1 > 1.02:
            break
        y0, y1 = rw_y(t0), rw_y(t1)
        w0, w1 = rw_half(y0) * 0.028, rw_half(y1) * 0.028
        out.append(poly([(CX - w0, y0), (CX + w0, y0), (CX + w1, y1), (CX - w1, y1)]))
    # The edges: a lamp either side at each depth, sized with the same law, so
    # the two rows converge on the vanishing point without being aimed at it.
    for i in range(30):
        t = 0.02 + i * 0.034
        y = rw_y(t)
        h = rw_half(y)
        # Same floor as the city's lamps and for the same reason: brand.css
        # blurs these, and a lamp smaller than the blur is not a soft lamp.
        r = max(3.4, h * 0.03)
        for side in (-1, 1):
            out.append(rounded_rect(CX + side * h, y, r * 2.4, r * 2, r, r))
    # The threshold bar, across the far end, which is what tells you which way
    # you are looking at it.
    ty = rw_y(0.085)
    th = rw_half(ty)
    for k in range(-4, 5):
        if k == 0:
            continue
        out.append(rounded_rect(CX + k * th * 0.19, ty, th * 0.1, th * 0.05, 2, 2))
    return paths(" ".join(out))


# ---------------------------------------------------------------------------
# /about — a row of cabin windows
# ---------------------------------------------------------------------------
# The same aperture as the home page's, five times, receding. Each one is a
# fixed fraction of the last and steps toward a vanishing point, so the row is
# a perspective rather than a set of decreasing copies — which is the
# difference between looking down a cabin and looking at a diagram of one.
ROW_N = 5
ROW_X, ROW_W, ROW_H = 150, 322, 452
ROW_CY = 486
ROW_STEP = 1.60
ROW_SHRINK_W, ROW_SHRINK_H = 0.745, 0.815
ROW_DRIFT = 13


def cabin_row():
    holes = []
    x, w, h, cy = ROW_X, ROW_W, ROW_H, ROW_CY
    for _ in range(ROW_N):
        holes.append(rounded_rect(x + w / 2, cy, w, h, w * 0.47, h * 0.36))
        x += w * ROW_STEP
        w *= ROW_SHRINK_W
        h *= ROW_SHRINK_H
        cy += ROW_DRIFT
    return paths(wall_minus(holes), fill_rule="evenodd")


# ---------------------------------------------------------------------------
# /staff — the fin
# ---------------------------------------------------------------------------
# An aeroplane on stand, from behind and off to one side: the fin, and the top
# of the fuselage it stands on. Two shapes. The fin is a swept quadrilateral
# with a radiused tip; the fuselage is a long shallow curve that runs off both
# ends of the frame, so it reads as a body rather than as a plinth.
FIN = [(548, 1020), (1006, 292), (1246, 318), (1332, 1020)]
FUSE_TOP = 822


def tail():
    fuse = (f"M{-BLEED},{VB_H + BLEED} L{-BLEED},{FUSE_TOP + 150} "
            f"Q{CX:.0f},{FUSE_TOP} {VB_W + BLEED},{FUSE_TOP + 150} "
            f"L{VB_W + BLEED},{VB_H + BLEED} Z")
    return paths(poly(FIN, 26) + " " + fuse)


# ---------------------------------------------------------------------------
# /apply — the door
# ---------------------------------------------------------------------------
# A door, open on the morning. It is not the home page's window at a different
# size: a passenger door is nearly twice as tall as it is wide, its top corners
# are radiused hard and its bottom ones barely at all, and it is offset from
# the centreline because you are walking up to it rather than sitting square in
# front of it.
# Sized so the radiused top is inside the frame at a page header's ratio as
# well as a phone's: a shallow band crops top and bottom, and a door whose
# curve is cropped away is a rectangle. Set right of the centreline so the
# heading has unbroken wall to sit on rather than straddling the opening.
DOOR_W, DOOR_H = 430, 516
DOOR_CX, DOOR_CY = 902, 468
DOOR_RX_TOP, DOOR_RY_TOP = 206, 156
DOOR_RX_BOT, DOOR_RY_BOT = 64, 54


def door_hole():
    x0, x1 = DOOR_CX - DOOR_W / 2, DOOR_CX + DOOR_W / 2
    y0, y1 = DOOR_CY - DOOR_H / 2, DOOR_CY + DOOR_H / 2
    rxt, ryt = min(DOOR_RX_TOP, DOOR_W / 2), DOOR_RY_TOP
    rxb, ryb = min(DOOR_RX_BOT, DOOR_W / 2), DOOR_RY_BOT
    return (f"M{x0 + rxt:.1f},{y0:.1f} H{x1 - rxt:.1f} A{rxt:.1f},{ryt:.1f} 0 0 1 {x1:.1f},{y0 + ryt:.1f} "
            f"V{y1 - ryb:.1f} A{rxb:.1f},{ryb:.1f} 0 0 1 {x1 - rxb:.1f},{y1:.1f} "
            f"H{x0 + rxb:.1f} A{rxb:.1f},{ryb:.1f} 0 0 1 {x0:.1f},{y1 - ryb:.1f} "
            f"V{y0 + ryt:.1f} A{rxt:.1f},{ryt:.1f} 0 0 1 {x0 + rxt:.1f},{y0:.1f} Z")


def door():
    return paths(wall_minus([door_hole()]), fill_rule="evenodd")


VIEWS = {
    "view-wing.svg": wing,
    "view-city.svg": city,
    "view-contrails.svg": contrails,
    "view-runway.svg": runway,
    "view-cabin-row.svg": cabin_row,
    "view-tail.svg": tail,
    "view-door.svg": door,
}


def main():
    for name, build in VIEWS.items():
        body = build()
        (IMG / name).write_text(body, encoding="utf-8")
        print(f"wrote assets/img/{name}  ({len(body)} bytes)")


if __name__ == "__main__":
    main()
