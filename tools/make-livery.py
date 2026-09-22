"""Emit assets/img/livery-swoosh.svg and livery-fin.svg — the paint, as geometry.

    assets/img/livery-swoosh.svg   the sweep that rises across the rear body
    assets/img/livery-fin.svg      the block it rises into

WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT. Aeroméxico's scheme has one
signature anybody would recognise without being told the name: a long shallow
sweep that starts thin low on the forward body, rises aft, widens, and runs up
into the fin. That sweep is a curve with a width that varies along it, which is
to say it is a set of numbers, which is why it can be here at all — brand.css's
standing rule is no pictorial invention, and geometry emitted from parameters is
the one exception.

WHAT IS NOT HERE IS THE AEROPLANE. No fuselage outline, no nose, no windows, no
door, no wing. A side elevation of an airframe is a likeness, and a likeness is
what this repo's generators are written to refuse — the header on
tools/make-views.py says so in as many words and this file holds the same line.
What is emitted is a COLOUR ARCHITECTURE: the order and shape of the fields, the
way a livery is set out on a paint drawing before anyone draws the body it goes
on. Read as a band across a card it says Aeroméxico; read as a picture of an
aeroplane it says nothing, because it is not one.

Nor is the Caballero Águila here, for the reason make-views.py gives about the
fin: the mark is real artwork the airline owns and this site uses it properly
elsewhere, but painting it into a generated scheme would make the scheme claim
to be a photograph of a specific tail.

THE FRAME is 1200x300 — a band, not the 1600x1000 sky frame, because these are
mounted across a card rather than behind a page. Both files are MONOCHROME
MASKS like every other generated device here, so the colours are brand.css's:
one pair of files serves the mainline scheme and the Connect one.

    python3 tools/make-livery.py
"""
import pathlib

IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img"

VB_W, VB_H = 1200, 300

# Built past the edges: these are mounted at `100% 100%` across boxes of
# whatever width a card happens to be, and a sweep that stopped inside the
# viewBox would show its own end.
BLEED = 200

# ---- The sweep -------------------------------------------------------------
# Given as a chord from where it starts (low and forward) to where it ends (high
# and aft), a bow that pushes the curve off that chord, and the half-width at
# each end. It starts as barely a line and ends as a field, which is the whole
# character of it — a sweep of constant width is a cheatline, a different
# airline and a much older one.
# A FIRST PASS ENDED AT 86 HALF-WIDTH and covered half the band, which reads as
# a wedge laid over the scheme rather than as a sweep belonging to it. The real
# thing is an accent across the lower rear that you notice second, after the
# blue: it has to leave most of the field alone to do that.
SWEEP_START = (-BLEED, 256)
SWEEP_END = (900, 158)
SWEEP_W0, SWEEP_W1 = 4, 44
SWEEP_BOW = 46

# ---- The block it rises into -----------------------------------------------
# The fin, as the four corners of a swept quadrilateral. Its root sits where the
# sweep arrives so the two read as one continuous movement rather than as a
# shape parked next to a curve — and brand.css paints it OVER the sweep, because
# on the aeroplane the sweep runs up to the tail and the tail is in front of it.
FIN = [(880, 300), (1046, 30), (1200 + BLEED, 30), (1200 + BLEED, 300)]


def head():
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VB_W} {VB_H}" '
            f'width="{VB_W}" height="{VB_H}" preserveAspectRatio="none">')


def poly(points, r=0):
    """A polygon with every corner radiused, at any angle.

    The same helper as tools/make-views.py, which is the honest way to say that
    a fin is a fin wherever it is drawn: pull each corner back along both of its
    edges and join the two ends with a quadratic through the original point.
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


def sweep():
    """The rising sweep: a ribbon along a bowed chord, thin to thick.

    Two quadratics sharing a control point pushed off the chord by `SWEEP_BOW`,
    one down each side, with the offset scaled by the half-width at that end. A
    straight-edged wedge would be a stripe; the bow is what makes it sweep.
    """
    x0, y0 = SWEEP_START
    x1, y1 = SWEEP_END
    dx, dy = x1 - x0, y1 - y0
    d = (dx * dx + dy * dy) ** 0.5 or 1
    nx, ny = -dy / d, dx / d                    # unit normal to the chord
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    cx, cy = mx + nx * SWEEP_BOW, my + ny * SWEEP_BOW
    wm = (SWEEP_W0 + SWEEP_W1) / 2 * 1.1
    return (f"M{x0 + nx * SWEEP_W0:.1f},{y0 + ny * SWEEP_W0:.1f} "
            f"Q{cx + nx * wm:.1f},{cy + ny * wm:.1f} "
            f"{x1 + nx * SWEEP_W1:.1f},{y1 + ny * SWEEP_W1:.1f} "
            f"L{x1 - nx * SWEEP_W1:.1f},{y1 - ny * SWEEP_W1:.1f} "
            f"Q{cx - nx * wm:.1f},{cy - ny * wm:.1f} "
            f"{x0 - nx * SWEEP_W0:.1f},{y0 - ny * SWEEP_W0:.1f} Z")


def write(name, d):
    body = head() + f'<path fill="#fff" d="{d}"/></svg>\n'
    (IMG / name).write_text(body, encoding="utf-8")
    print(f"wrote assets/img/{name}  ({len(body)} bytes)")


def main():
    write("livery-swoosh.svg", sweep())
    write("livery-fin.svg", poly(FIN, 14))


if __name__ == "__main__":
    main()
