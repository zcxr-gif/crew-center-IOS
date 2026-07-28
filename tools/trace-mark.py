"""Vectorise the Caballero Águila from assets/img/Aeromexico-Symbol.webp.

The source is navy-on-transparent RGBA. potrace wants a two-colour bitmap, and
the logo's white cut-lines have to survive as actual HOLES (not white shapes)
so that brand.css can paint the result through a CSS mask. Compositing onto
white and thresholding gives potrace exactly that: it traces the navy, and the
enclosed white channels between the feathers come out as counters.
"""
import subprocess, pathlib
from PIL import Image

SRC = pathlib.Path("/home/user/crew-center-IOS/assets/img/Aeromexico-Symbol.webp")
OUT = pathlib.Path("/home/user/crew-center-IOS/assets/img/mark.svg")
TMP = pathlib.Path("/tmp/claude-0/-home-user/d0804080-feed-50d7-96a9-1777c686e5e4/scratchpad")

im = Image.open(SRC).convert("RGBA")

# Flatten onto white so the transparent surround becomes background, not black.
flat = Image.new("RGB", im.size, "white")
flat.paste(im, mask=im.split()[3])

# Crop to the ink. The source carries a wide transparent margin; leaving it in
# would bake padding into the viewBox and make every CSS size wrong.
grey = flat.convert("L")
bbox = grey.point(lambda p: 255 if p < 200 else 0).getbbox()
flat = flat.crop(bbox)
print(f"source {im.size} -> content bbox {bbox} -> {flat.size}")

# Upscale before thresholding: potrace traces the pixel grid, so more pixels
# means smoother curves along the feather edges.
flat = flat.resize((flat.width * 3, flat.height * 3), Image.LANCZOS)

bw = flat.convert("L").point(lambda p: 0 if p < 150 else 255, mode="1")
pbm = TMP / "mark.pbm"
bw.save(pbm)

subprocess.run([
    "potrace", str(pbm), "--svg", "-o", str(OUT),
    "--turdsize", "4",      # drop specks smaller than this
    "--alphamax", "1.0",    # corner threshold — keeps the beak and jaw crisp
    "--opttolerance", "0.2",
], check=True)

svg = OUT.read_text(encoding="utf-8")
print("traced:", len(svg), "bytes")
print(svg[:400])
