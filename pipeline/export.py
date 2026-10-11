"""Write the static data files the site loads, and enforce the size budgets."""
import gzip
import hashlib
import json
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from .config import BUDGET_KB, OUT

CHUNK_COLS = ["key", "date", "price", "pred", "predLin", "dev", "beds", "baths", "sqft", "lot", "floors", "wf",
              "view", "cond", "grade", "yb", "yr", "lat", "lon", "sim"]


def _dump(path, obj) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    b = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    path.write_bytes(b)
    return len(gzip.compress(b, 9))


def export_chunks(df: pd.DataFrame, sim: dict[str, list[str]], zip_order: list[str]) -> tuple[dict, str]:
    df = df.sort_values(["zipcode", "key"]).reset_index(drop=True)
    pos = {k: (zip_order.index(z), i) for z, g in df.groupby("zipcode") for i, k in enumerate(g["key"])}
    h = hashlib.sha1()
    sizes = {}
    for z, g in df.groupby("zipcode"):
        rows = []
        for r in g.itertuples(index=False):
            rows.append([
                r.key, r.date.strftime("%Y-%m-%d"), int(r.price), int(round(r.pred)), int(round(r.pred_lin)),
                int(round(r.dev * 1000)), int(r.bedrooms), float(r.bathrooms), int(r.sqft_living), int(r.sqft_lot),
                float(r.floors), int(r.waterfront), int(r.view), int(r.condition), int(r.grade), int(r.yr_built),
                int(r.yr_renovated), round(float(r.lat), 5), round(float(r.long), 5),
                [list(pos[k]) for k in sim[r.key]],
            ])
        obj = {"cols": CHUNK_COLS, "rows": rows}
        sizes[z] = _dump(OUT / "zip" / f"{z}.json", obj)
        h.update(json.dumps(obj, separators=(",", ":")).encode())
    return sizes, h.hexdigest()[:8]


def histogram(df: pd.DataFrame, step=50_000, top=2_000_000) -> dict:
    edges = list(range(0, top + step, step))
    counts, _ = np.histogram(df["price"].clip(upper=top - 1), bins=edges)
    return {"step": step, "top": top, "counts": counts.tolist()}


def write_index(zip_rows: dict, card: dict, pidx: dict, hexinfo: dict, df: pd.DataFrame, version: str) -> int:
    pidx = {k: v for k, v in pidx.items() if not k.startswith("_")}
    idx = {
        "version": version,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "dataRange": [df["date"].min().strftime("%Y-%m-%d"), df["date"].max().strftime("%Y-%m-%d")],
        "nHomes": int(len(df)),
        **zip_rows,
        "histogram": histogram(df),
        "model": {k: card[k] for k in ("cv", "models", "error_bands", "error_overall", "bias_by_price", "top200_overlap")},
        "priceIndex": pidx,
        "hex": hexinfo,
    }
    return _dump(OUT / "index.json", idx)


def check_budgets(sizes: dict[str, int], chunk_sizes: dict[str, int]) -> list[str]:
    lines, bad = [], []
    for name, kb in BUDGET_KB.items():
        if name == "zip_chunk_max":
            actual = max(chunk_sizes.values()) / 1024
        else:
            actual = sizes[name] / 1024
        flag = "OK " if actual <= kb else "OVER"
        if actual > kb:
            bad.append(name)
        lines.append(f"{flag} {name}: {actual:.1f} KB gzip (budget {kb})")
    tot = sum(chunk_sizes.values()) / 1024
    lines.append(f"all {len(chunk_sizes)} zip chunks: {tot:.0f} KB gzip; median {np.median(list(chunk_sizes.values()))/1024:.1f} KB")
    assert not bad, "over budget: " + ", ".join(bad) + "\n" + "\n".join(lines)
    return lines
