"""King County ZCTA polygons: filter, simplify with mapshaper (topology-preserving), validate, per-zip stats."""
import json
import subprocess

import numpy as np
import pandas as pd
from shapely.geometry import Point, shape

from .config import KC_ZCTA_RAW, ROOT, STATE_ZCTA, WORK

SIMPLIFY_PCT = 15


def extract_raw(zips: set[str]) -> dict:
    src = STATE_ZCTA if STATE_ZCTA.exists() else KC_ZCTA_RAW
    gj = json.loads(src.read_text(encoding="utf-8"))
    feats = []
    for f in gj["features"]:
        z = f["properties"].get("ZCTA5CE10") or f["properties"].get("z")
        if z in zips:
            feats.append({"type": "Feature", "properties": {"z": z}, "geometry": f["geometry"]})
    out = {"type": "FeatureCollection", "features": sorted(feats, key=lambda f: f["properties"]["z"])}
    if src == STATE_ZCTA:
        KC_ZCTA_RAW.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    return out


def simplify(raw: dict, pct: int = SIMPLIFY_PCT) -> dict:
    WORK.mkdir(parents=True, exist_ok=True)
    inp, outp = WORK / "zcta_in.geojson", WORK / "zcta_out.geojson"
    inp.write_text(json.dumps(raw), encoding="utf-8")
    subprocess.run(["npx", "mapshaper", str(inp), "-simplify", "visvalingam", f"{pct}%", "keep-shapes",
                    "-o", str(outp), "format=geojson", "precision=0.0001", "force"],
                   cwd=ROOT, check=True, capture_output=True)
    return json.loads(outp.read_text(encoding="utf-8"))


def _area_km2(geom) -> float:
    g = shape(geom)
    # equirectangular approximation, fine for a relative before/after comparison
    k = 110.57 * 111.32 * np.cos(np.radians(g.centroid.y))
    return g.area * k / 1.0


def validate(raw: dict, simp: dict, zips: set[str], df: pd.DataFrame) -> dict:
    got = {f["properties"]["z"] for f in simp["features"]}
    assert got == zips, f"missing zips: {sorted(zips - got)}"
    ra = {f["properties"]["z"]: _area_km2(f["geometry"]) for f in raw["features"]}
    sa = {f["properties"]["z"]: _area_km2(f["geometry"]) for f in simp["features"]}
    worst = max(abs(sa[z] / ra[z] - 1) for z in zips)
    polys = {f["properties"]["z"]: shape(f["geometry"]) for f in simp["features"]}
    inside = sum(polys[z].covers(Point(lo, la)) for z, lo, la in zip(df["zipcode"], df["long"], df["lat"]))

    def nverts(fc):
        return sum(len(c) for f in fc["features"] for p in (f["geometry"]["coordinates"] if f["geometry"]["type"] == "MultiPolygon" else [f["geometry"]["coordinates"]]) for ring in p for c in [ring])
    return {"zips": len(got), "vertices_raw": nverts(raw), "vertices_simplified": nverts(simp),
            "max_area_change": float(worst), "homes_inside_own_zip": float(inside / len(df))}


def zip_stats(df: pd.DataFrame, simp: dict) -> dict:
    """Per-zip summary rows for index.json (order = zip index used by chunks)."""
    geo = {f["properties"]["z"]: shape(f["geometry"]) for f in simp["features"]}
    rows = []
    for z, s in df.groupby("zipcode"):
        b = geo[z].bounds
        rows.append({"zip": z, "n": int(len(s)), "medPrice": int(s["price"].median()), "medPpsf": int(round(s["ppsf"].median())),
                     "medDev": round(float(s["dev"].median()), 4), "pctBelow": round(float((s["dev"] < -0.10).mean()), 3),
                     "bbox": [round(b[0], 4), round(b[1], 4), round(b[2], 4), round(b[3], 4)],
                     "centroid": [round(geo[z].centroid.x, 4), round(geo[z].centroid.y, 4)]})
    return {"zips": sorted(rows, key=lambda r: r["zip"])}
