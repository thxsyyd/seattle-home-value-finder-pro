"""H3 aggregation with hierarchical shrinkage, and hexagon GeoJSON."""
import json

import h3
import numpy as np
import pandas as pd

from .config import HEX_MIN_N, SHRINK_K_GRID

LEVELS = (6, 7, 8)


def add_cells(df: pd.DataFrame) -> pd.DataFrame:
    """Assign res 8 from coordinates, then derive res 7 and 6 as parents so the hierarchy is strictly nested
    (H3 is only approximately nested, so cells computed independently per resolution can disagree)."""
    df = df.copy()
    df["h8"] = [h3.latlng_to_cell(a, b, 8) for a, b in zip(df["lat"], df["long"])]
    df["h7"] = [h3.cell_to_parent(c, 7) for c in df["h8"]]
    df["h6"] = [h3.cell_to_parent(c, 6) for c in df["h8"]]
    return df


def _shrink_chain(stats: dict[int, tuple[int, float]], k: float, top: float, upto: int) -> float:
    """Shrunk estimate for the cell at level `upto`; each level shrinks toward its parent's estimate."""
    est = top
    for r in LEVELS:
        if r > upto:
            break
        n, m = stats[r]
        est = (n * m + k * est) / (n + k) if n else est
    return est


def choose_k(df: pd.DataFrame) -> dict:
    """Leave-one-out MAE of predicting each house's log $/sqft from its cell estimate, per level and k."""
    lp = np.log(df["ppsf"].to_numpy())
    top = float(np.median(lp))
    groups = {r: df.groupby(f"h{r}").indices for r in LEVELS}
    cols = {r: df[f"h{r}"].to_numpy() for r in LEVELS}
    errs = {u: {k: [] for k in SHRINK_K_GRID} for u in (7, 8)}
    for i in range(len(df)):
        stats = {}
        for r in LEVELS:
            idx = groups[r][cols[r][i]]
            v = lp[idx[idx != i]]
            stats[r] = (len(v), float(np.median(v)) if len(v) else 0.0)
        for u in (7, 8):
            for k in SHRINK_K_GRID:
                errs[u][k].append(abs(_shrink_chain(stats, k, top, u) - lp[i]))
    return {u: {k: float(np.mean(v)) for k, v in errs[u].items()} for u in errs}


def aggregate(df: pd.DataFrame, k: dict[int, float]) -> dict[int, pd.DataFrame]:
    """Per-cell stats for res 7 and 8 with hierarchically shrunk $/sqft, price and deviation."""
    top = {"ppsf": float(np.median(np.log(df["ppsf"]))), "price": float(np.median(np.log(df["price"]))), "dev": 0.0}
    kind = {"ppsf": "log", "price": "log", "dev": "lin"}
    src = {"ppsf": df["ppsf"], "price": df["price"], "dev": df["dev"]}
    out = {}
    for upto in (7, 8):
        kk = k[upto]
        rows = []
        for cell, sub in df.groupby(f"h{upto}"):
            rec = {"c": cell, "n": len(sub)}
            for name in ("ppsf", "price", "dev"):
                est = top[name]
                for r in LEVELS:
                    if r > upto:
                        break
                    parent_cell = h3.cell_to_parent(cell, r) if r < upto else cell
                    s = src[name][df[f"h{r}"] == parent_cell]
                    v = np.log(s.to_numpy()) if kind[name] == "log" else s.to_numpy()
                    m = float(np.median(v))
                    est = (len(v) * m + kk * est) / (len(v) + kk)
                raw = float(np.median(sub[name]))
                rec[name + "_est"] = float(np.exp(est)) if kind[name] == "log" else est
                rec[name + "_raw"] = raw
            rec["grey"] = rec["n"] < HEX_MIN_N
            rows.append(rec)
        out[upto] = pd.DataFrame(rows)
    return out


def to_geojson(cells: pd.DataFrame) -> dict:
    feats = []
    for r in cells.itertuples(index=False):
        ring = [[round(lng, 4), round(lat, 4)] for lat, lng in h3.cell_to_boundary(r.c)]
        ring.append(ring[0])
        feats.append({
            "type": "Feature",
            "properties": {"c": r.c, "n": int(r.n), "p": int(round(r.ppsf_est)), "r": int(round(r.ppsf_raw)),
                           "m": int(round(r.price_est)), "d": round(r.dev_est, 3), "g": 1 if r.grey else 0},
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        })
    return {"type": "FeatureCollection", "features": feats}


def dump(obj, path) -> None:
    path.write_text(json.dumps(obj, separators=(",", ":")), encoding="utf-8")
