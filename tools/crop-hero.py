"""Emit assets/img/plane-hero.webp from the supplied plane-logo.webp.

The source artwork is delivered on a tall white canvas with two things on it:
the 787-9 and its folk-art illustration on top, and a second AeroMexico lockup
underneath. The page already carries the mark in its nav, so the lockup is
duplication, and the surrounding white is dead vertical space that pushed the
aircraft below the fold.

This crops to the artwork band alone. It finds that band rather than hard-coding
it, so re-running against a re-exported source still does the right thing.

    python3 tools/crop-hero.py

The original is left untouched — it is the asset the airline handed over.
"""
import pathlib
from PIL import Image

IMG = pathlib.Path(__file__).resolve().parent.parent / "assets/img"
SRC = IMG / "plane-logo.webp"
DST = IMG / "plane-hero.webp"
PAD = 10          # breathing room around the ink, in source pixels
INK = 235         # anything darker than this counts as ink

im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.convert("L").load()


def bands(values, threshold=2, min_run=5):
    """Contiguous runs where the ink count clears `threshold`."""
    out, run = [], None
    for i, n in enumerate(values):
        if n > threshold and run is None:
            run = i
        elif n <= threshold and run is not None:
            if i - run > min_run:
                out.append((run, i))
            run = None
    if run is not None:
        out.append((run, len(values)))
    return out


rows = [sum(1 for x in range(0, w, 3) if px[x, y] < INK) for y in range(h)]
found = bands(rows)
assert found, "no ink found in the source"
top, bottom = found[0]      # first band = the aircraft; any later band is the lockup

cols = [sum(1 for y in range(top, bottom, 3) if px[x, y] < INK) for x in range(w)]
xs = [x for x, n in enumerate(cols) if n > 0]

box = (max(0, xs[0] - PAD), max(0, top - PAD),
       min(w, xs[-1] + PAD), min(h, bottom + PAD))
out = im.crop(box)
out.save(DST, "WEBP", quality=92, method=6)

print(f"{SRC.name} {im.size} -> {DST.name} {out.size}")
print(f"  dropped {len(found) - 1} trailing band(s) (the duplicate lockup)")
print(f"  aspect-ratio for brand.css: {out.width} / {out.height}")
