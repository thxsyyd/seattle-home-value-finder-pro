"""Check the colour rules: blue and red may only carry data meaning.

Scans every hex colour in src/ and flags saturated blues and reds that appear outside the files allowed to hold
data colours (the design tokens, the marker layer and the optional area-colour scale). Run:
    pipeline/.venv/bin/python scripts/color_audit.py
Exit status 1 means a control, link or background has picked up a data colour.
"""
import colorsys
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = {"src/styles/tokens.css", "src/map/homesLayer.ts", "src/map/colors.ts", "src/styles/layout.css"}
# inside layout.css only these data-colour lines are fine (they use var(--data-*) not hex); hex there is a violation.
HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")


def family(h: str):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hue, light, sat = colorsys.rgb_to_hls(r, g, b)
    hue *= 360
    if sat < 0.25 or light > 0.93 or light < 0.07:
        return None
    if 190 <= hue <= 265:
        return "blue"
    if hue <= 15 or hue >= 340:
        return "red"
    return None


bad = []
count = 0
for path in sorted(ROOT.glob("src/**/*")):
    if path.suffix not in {".css", ".ts", ".tsx"} or ".test." in path.name or "/i18n/" in str(path):
        continue
    rel = str(path.relative_to(ROOT))
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        for m in HEX.finditer(line):
            fam = family(m.group())
            if fam:
                count += 1
                if rel not in ALLOWED or rel == "src/styles/layout.css":
                    bad.append(f"{rel}:{n} {m.group()} ({fam})")
print(f"{count} blue/red hex colours found; allowed only in tokens, marker layer and area scale")
for b in bad:
    print("  VIOLATION", b)
sys.exit(1 if bad else 0)
