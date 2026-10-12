"""Compose the 1200x630 link-preview image (public/og.jpg) from docs/screenshots/map-only.jpg.

Run: pipeline/.venv/bin/python scripts/make_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
FONT_PATHS = ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]
REG_PATHS = ["/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"]


def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def wrap(draw, text, fnt, width):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    return lines + [cur]


img = Image.new("RGB", (W, H), "#ffffff")
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 14, H], fill="#0b5cad")

shot = Image.open(ROOT / "docs/screenshots/map-only.jpg").convert("RGB")
# the screenshot already holds only the map; scale it to fill the right side
map_part = shot
scale = H / map_part.height
map_part = map_part.resize((int(map_part.width * scale), H), Image.LANCZOS)
img.paste(map_part, (W - map_part.width, 0))
d.rectangle([W - map_part.width - 6, 0, W - map_part.width, H], fill="#0b5cad")

x = 56
d.text((x, 70), "Seattle Home Value", font=font(FONT_PATHS, 58), fill="#1b2430")
d.text((x, 138), "Finder", font=font(FONT_PATHS, 58), fill="#0b5cad")
sub = font(REG_PATHS, 28)
y = 240
for line in wrap(d, "What King County homes sold for in 2014–15, compared with a price model.", sub, 470):
    d.text((x, y), line, font=sub, fill="#3b4656")
    y += 40
small = font(REG_PATHS, 22)
d.text((x, H - 96), "Past sales, not listings", font=font(FONT_PATHS, 22), fill="#1b2430")
d.text((x, H - 62), "By Daisy Tang · INFO 5002, Northeastern University", font=small, fill="#5b6675")

(ROOT / "public").mkdir(exist_ok=True)
img.save(ROOT / "public/og.jpg", quality=88, optimize=True)
print("wrote public/og.jpg", img.size)
