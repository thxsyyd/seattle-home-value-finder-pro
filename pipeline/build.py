"""Orchestrate the pipeline:  python -m pipeline.build [--step model|hex|zips|export|all]"""
import argparse
import gzip
import json
import pickle

import pandas as pd

from . import export, hexes, price_index, similar, zips
from .config import OUT, SEED, WORK
from .load import load
from .model import model_card, run_oof

OOF = WORK / "oof.pkl"


def step_model() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    df = run_oof(load())
    card = model_card(df)
    with OOF.open("wb") as f:
        pickle.dump((df, card), f)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "model_card.json").write_text(json.dumps(card, indent=1), encoding="utf-8")
    for k, v in card["models"].items():
        print(f"  {k}: R2={v['r2']:.3f} MAE=${v['mae']:,.0f}")
    print(f"  error band p10/p90: {card['error_overall']['p10']:+.1%} / {card['error_overall']['p90']:+.1%}; top-200 overlap {card['top200_overlap']}")


def _load_oof() -> tuple[pd.DataFrame, dict]:
    with OOF.open("rb") as f:
        return pickle.load(f)


def step_hex() -> dict:
    df, _ = _load_oof()
    df = hexes.add_cells(df)
    loo = hexes.choose_k(df)
    best = {u: min(v, key=v.get) for u, v in loo.items()}
    print("  LOO MAE by k:", {u: {k: round(m, 4) for k, m in v.items()} for u, v in loo.items()}, "-> k =", best)
    agg = hexes.aggregate(df, best)
    sizes = {}
    for res, name in ((7, "hex7.geojson"), (8, "hex8.geojson")):
        gj = hexes.to_geojson(agg[res])
        hexes.dump(gj, OUT / name)
        sizes[name] = len(gzip.compress((OUT / name).read_bytes(), 9))
        print(f"  {name}: {len(gj['features'])} cells, {sizes[name]/1024:.1f} KB gzip, grey {int(agg[res]['grey'].sum())}")
    return {"k": {str(u): v for u, v in best.items()}, "looMae": {str(u): {str(k): round(m, 5) for k, m in v.items()} for u, v in loo.items()},
            "minN": 3, "sizes": sizes, "greyShare": {str(u): float(agg[u]["grey"].mean()) for u in agg}}


def step_zips() -> dict:
    df, _ = _load_oof()
    zset = set(df["zipcode"])
    raw = zips.extract_raw(zset)
    simp = zips.simplify(raw)
    rep = zips.validate(raw, simp, zset, df)
    print("  ", rep)
    hexes.dump(simp, OUT / "zips.geojson")
    return {"report": rep, "size": len(gzip.compress((OUT / "zips.geojson").read_bytes(), 9))}


def step_export(hexinfo: dict, zipinfo: dict) -> None:
    df, card = _load_oof()
    zset = set(df["zipcode"])
    simp = json.loads((OUT / "zips.geojson").read_text(encoding="utf-8"))
    zrows = zips.zip_stats(df, simp)
    order = [r["zip"] for r in zrows["zips"]]
    sim = similar.similar(df)
    chunk_sizes, version = export.export_chunks(df, sim, order)
    months = sorted(df["date"].dt.strftime("%Y-%m").unique())
    pidx = price_index.build(zset, months)
    print("  price index:", pidx["metro"]["asOf"], "rate", pidx["mortgageRate"], "fhfa", pidx["zip"]["fhfaLatestYear"],
          "zips w/ factor", len(pidx["zip"]["factor"]), "missing", pidx["zip"]["missing"])
    idx_size = export.write_index(zrows, card, pidx, hexinfo, df, version)
    sizes = {"index.json": idx_size, "hex7.geojson": hexinfo["sizes"]["hex7.geojson"],
             "hex8.geojson": hexinfo["sizes"]["hex8.geojson"], "zips.geojson": zipinfo["size"]}
    for line in export.check_budgets(sizes, chunk_sizes):
        print("  " + line)
    print("  dataVersion", version)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--step", default="all", choices=["model", "hex", "zips", "export", "all"])
    a = ap.parse_args()
    print(f"seed {SEED}")
    if a.step in ("model", "all"):
        print("[model]"); step_model()
    hexinfo = zipinfo = None
    if a.step in ("hex", "all", "export"):
        print("[hex]"); hexinfo = step_hex()
    if a.step in ("zips", "all", "export"):
        print("[zips]"); zipinfo = step_zips()
    if a.step in ("export", "all"):
        print("[export]"); step_export(hexinfo, zipinfo)


if __name__ == "__main__":
    main()
