"""Emit the home page's opening sequence: a cabin window, then a flight deck.

    assets/img/cabin-window.svg     the cabin wall, with one window cut out
    assets/img/cabin-bezel.svg      the ring of light around that window
    assets/img/flightdeck.svg       the forward structure, with the glass cut out
    assets/img/flightdeck-glare.svg the glareshield, as its own mass
    assets/img/flightdeck-glow.svg  the lip of the glareshield, for the underglow

WHY THIS IS GENERATED AND NOT DRAWN. brand.css sets the standing rule: no
pictorial invention — no drawn eagles, no illustrated tiles — but geometry
emitted from parameters is allowed, "if the next idea cannot be expressed as a
script that emits it, it is the wrong idea." A cabin window and a windshield
are the one part of an aeroplane that passes that test outright. Neither is a
picture of anything: a passenger window is a rounded rectangle, and a flight
deck's forward glass is four flat panes between structural posts. Both are
sets of coordinates, and both are below.

Nothing here is a likeness of a specific airframe and nothing is shaded,
textured or lit — every file is a MONOCHROME MASK, exactly like mark.svg and
greca.svg. brand.css paints them through `mask`, which is what lets one file
serve the cabin's near-black, the deck's gradient and the marigold underglow
without this script knowing a single colour.

THE COMMON FRAME. Every file below shares one viewBox, 1600x1000, and brand.css
mounts every one of them on an element at `inset: 0` with `mask-size: cover`.
That is load-bearing: it is what keeps the bezel registered to its aperture and
the underglow registered to the glareshield lip at every viewport ratio. Change
VB_W/VB_H and they all move together; change one file's viewBox alone and the
layers come apart.

Because `cover` crops rather than stretches, the geometry is built to survive
being cut in from the sides — the outboard side panes are the first thing lost
on a phone, and what is left (the two forward panes, the centre post, the roof
and the glareshield) is still a flight deck.

    python3 tools/make-flightdeck.py
"""
import pathlib

IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img"

# The shared frame. See THE COMMON FRAME above before touching these.
VB_W, VB_H = 1600, 1000
CX = VB_W / 2

# Every mask starts from a rectangle larger than the viewBox, so that the
# "solid" side of a cut-out never shows a seam once `cover` scales it up.
BLEED = 400

# ---- The cabin window ------------------------------------------------------
# A passenger window is a stadium: a rectangle with ends rounded to very nearly
# half its width. Taller than it is wide, and sat above centre, because a seated
# eye line is above the middle of the pane.
WIN_W, WIN_H = 372, 556
WIN_CY = 452
WIN_RX, WIN_RY = 172, 200
# The bezel is the lit inner reveal — the depth of the wall you see around the
# aperture. One number: how far in from the wall the light reaches. Kept narrow
# on purpose: a wide one stops reading as depth and starts reading as a moulded
# plastic ring, which is the difference between a window and a porthole sticker.
BEZEL = 17

# ---- The flight deck -------------------------------------------------------
# Half-width of the centre post, top and bottom. It tapers: the posts converge
# toward the roof on every airliner built.
POST_TOP, POST_BOT = 30, 38
# The forward panes — the two big ones either side of the centre post. Given as
# the right-hand pane and mirrored, so the deck cannot go lopsided by a typo.
#
# THE GLASS TAKES MOST OF THE FRAME, and that is a composition decision rather
# than a measurement: a first pass sat the sill halfway up and left a quarter of
# the screen as flat black coaming under it. From the seat you are looking OUT.
FWD = [(POST_TOP, 206), (470, 262), (462, 690), (POST_BOT, 714)]
# The outboard sliding windows, same convention. Shorter, and raked harder.
SIDE = [(502, 274), (724, 340), (716, 650), (494, 686)]
# Corner radius on every pane. Real glass is radiused generously — a sharp
# corner is a stress riser, and on screen it reads as a cut-out rather than a
# window.
PANE_R = 18

# The glareshield: the mass under the glass that the instruments sit behind. A
# shallow rise to the centre, stated as the height of its top edge outboard and
# on the centreline.
GLARE_EDGE, GLARE_MID = 802, 744


def head(extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VB_W} {VB_H}" '
            f'width="{VB_W}" height="{VB_H}" preserveAspectRatio="xMidYMid slice"'
            f'{extra}>')


def bleed_rect():
    """The oversized ground every cut-out is taken out of."""
    return (f'<rect x="{-BLEED}" y="{-BLEED}" '
            f'width="{VB_W + 2 * BLEED}" height="{VB_H + 2 * BLEED}"/>')


def rounded_rect(cx, cy, w, h, rx, ry):
    """A stadium/rounded rectangle as an explicit path.

    Written out rather than left as <rect rx ry> because these paths are also
    used as holes inside a fill-rule="evenodd" shape, where the direction the
    subpath is wound decides whether it cuts or fills.
    """
    x0, x1 = cx - w / 2, cx + w / 2
    y0, y1 = cy - h / 2, cy + h / 2
    rx, ry = min(rx, w / 2), min(ry, h / 2)
    return (f"M{x0 + rx:.1f},{y0:.1f} H{x1 - rx:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x1:.1f},{y0 + ry:.1f} "
            f"V{y1 - ry:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x1 - rx:.1f},{y1:.1f} "
            f"H{x0 + rx:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x0:.1f},{y1 - ry:.1f} "
            f"V{y0 + ry:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {x0 + rx:.1f},{y0:.1f} Z")


def pane(points, mirror=False):
    """One window pane: four corners, given as offsets from the centreline.

    Corners are radiused by pulling each one back along both of its edges and
    joining the two with a quadratic through the original corner — which gives
    a true rounded polygon at any angle, where an `rx` on a <rect> only works
    on a shape that is still square.
    """
    pts = [((CX - dx) if mirror else (CX + dx), y) for dx, y in points]
    n = len(pts)
    out = []
    for i, (x, y) in enumerate(pts):
        px, py = pts[(i - 1) % n]
        nx, ny = pts[(i + 1) % n]

        def pull(ax, ay):
            vx, vy = ax - x, ay - y
            d = (vx * vx + vy * vy) ** 0.5 or 1
            k = min(PANE_R, d / 2) / d
            return x + vx * k, y + vy * k

        ix, iy = pull(px, py)
        ox, oy = pull(nx, ny)
        out.append(("M" if i == 0 else "L") + f"{ix:.1f},{iy:.1f}")
        out.append(f"Q{x:.1f},{y:.1f} {ox:.1f},{oy:.1f}")
    return " ".join(out) + " Z"


def glare_edge():
    """The top lip of the glareshield, as a path across the whole frame.

    One symmetrical curve, rising by (GLARE_EDGE - GLARE_MID) at the centre.
    Shared by the glareshield mass and by the underglow, so the light can never
    sit off the surface it is supposed to be coming from.
    """
    return (f"M{-BLEED},{GLARE_EDGE} "
            f"C{CX * 0.55:.0f},{GLARE_EDGE - 4} {CX * 0.55:.0f},{GLARE_MID} {CX:.0f},{GLARE_MID} "
            f"C{CX * 1.45:.0f},{GLARE_MID} {CX * 1.45:.0f},{GLARE_EDGE - 4} "
            f"{VB_W + BLEED},{GLARE_EDGE}")


def write(name, body):
    path = IMG / name
    path.write_text(body + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(IMG.parent.parent)}  ({len(body)} bytes)")


def main():
    # ---- 1. The cabin wall, with the window taken out of it -----------------
    # One path, two subpaths, evenodd: wall minus aperture. Painted by brand.css
    # with a radial gradient centred on the aperture, which is what makes the
    # light look as though it is coming THROUGH the hole rather than being
    # printed on the wall.
    win = rounded_rect(CX, WIN_CY, WIN_W, WIN_H, WIN_RX, WIN_RY)
    write("cabin-window.svg", head() + (
        f'<path fill="#fff" fill-rule="evenodd" d="'
        f'M{-BLEED},{-BLEED} H{VB_W + BLEED} V{VB_H + BLEED} H{-BLEED} Z {win}"/>'
    ) + "</svg>")

    # ---- 2. The bezel -------------------------------------------------------
    # The reveal: a ring BEZEL wide, hugging the inside of the aperture. Two
    # concentric stadiums, evenodd — the aperture minus a smaller copy of
    # itself. It is the only thing in the cabin that is lit from outside.
    inner = rounded_rect(CX, WIN_CY, WIN_W - BEZEL * 2, WIN_H - BEZEL * 2,
                         WIN_RX - BEZEL, WIN_RY - BEZEL)
    write("cabin-bezel.svg", head() +
          f'<path fill="#fff" fill-rule="evenodd" d="{win} {inner}"/>' + "</svg>")

    # ---- 3. The forward structure ------------------------------------------
    # Everything that is not glass: the roof, the centre post, the two window
    # posts, the sills and the whole lower half. Four panes cut out of one
    # oversized rectangle, so the structure runs off every edge.
    holes = " ".join([pane(FWD), pane(FWD, mirror=True),
                      pane(SIDE), pane(SIDE, mirror=True)])
    write("flightdeck.svg", head() + (
        f'<path fill="#fff" fill-rule="evenodd" d="'
        f'M{-BLEED},{-BLEED} H{VB_W + BLEED} V{VB_H + BLEED} H{-BLEED} Z {holes}"/>'
    ) + "</svg>")

    # ---- 4. The glareshield as its own mass ---------------------------------
    # Laid over the structure and painted darker, which is the only reason it
    # exists: a flight deck with one flat tone for posts and coaming reads as a
    # stencil. Two tones and it reads as a room.
    write("flightdeck-glare.svg", head() + (
        f'<path fill="#fff" d="{glare_edge()} '
        f'L{VB_W + BLEED},{VB_H + BLEED} L{-BLEED},{VB_H + BLEED} Z"/>'
    ) + "</svg>")

    # ---- 5. The underglow ---------------------------------------------------
    # The instruments, stated as the one thing you can actually see of them
    # from this angle: a line of light along the lip, thrown up onto the glass.
    # A stroke, not a fill — brand.css blurs it and paints it marigold, and the
    # blur is what turns a line into a glow.
    write("flightdeck-glow.svg", head() + (
        f'<path fill="none" stroke="#fff" stroke-width="9" '
        f'stroke-linecap="round" d="{glare_edge()}"/>'
    ) + "</svg>")


if __name__ == "__main__":
    main()
