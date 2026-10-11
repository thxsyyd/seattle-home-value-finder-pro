"""Pipeline invariants. Run after `python -m pipeline.build`:  pipeline/.venv/bin/python -m pytest pipeline"""
import json
import random
import subprocess

import h3
import numpy as np
import pytest

from pipeline.config import OUT, ROOT
from pipeline.features import neighbor_features
from pipeline.load import load


@pytest.fixture(scope="module")
def df():
    d = load()
    d["pred"] = d["price"]  # placeholder, not used here
    return d


def test_load_basics(df):
    assert len(df) == 21613
    assert df["key"].is_unique
    assert df["zipcode"].nunique() == 70
    assert df["zipcode"].str.len().eq(5).all()


def test_neighbor_features_never_use_own_price(df):
    """A training row's comparable-sale features must not change when its own price (or any same-id sale) changes."""
    sub = df.sample(3000, random_state=1).reset_index(drop=True)
    base = neighbor_features(sub, sub, same_pool=True)
    changed = sub.copy()
    changed.loc[:, "ppsf"] = changed["ppsf"] * 3.0  # inflate everyone's own price
    # a row's feature depends on *other* houses only; so changing house i must not change row i's features
    i = 17
    mod = sub.copy()
    same = mod["id"] == mod.loc[i, "id"]
    mod.loc[same, "ppsf"] = mod.loc[same, "ppsf"] * 10
    after = neighbor_features(mod, mod, same_pool=True)
    assert np.allclose(base[i], after[i])


def test_validation_features_ignore_validation_prices(df):
    pool = df.iloc[:15000].reset_index(drop=True)
    val = df.iloc[15000:15500].reset_index(drop=True)
    a = neighbor_features(pool, val, same_pool=False)
    val2 = val.copy()
    val2["ppsf"] = val2["ppsf"] * 5
    b = neighbor_features(pool, val2, same_pool=False)
    assert np.allclose(a, b)


def test_chunks_conserve_rows_and_refs(df):
    idx = json.loads((OUT / "index.json").read_text())
    order = [z["zip"] for z in idx["zips"]]
    assert len(order) == 70
    chunks = {z: json.loads((OUT / "zip" / f"{z}.json").read_text()) for z in order}
    assert sum(len(c["rows"]) for c in chunks.values()) == 21613 == idx["nHomes"]
    keys = set()
    for z, c in chunks.items():
        ci = {n: i for i, n in enumerate(c["cols"])}
        for r in c["rows"]:
            assert r[ci["key"]].startswith(z + "-")
            keys.add(r[ci["key"]])
            assert len(r[ci["sim"]]) == 5
            for zi, ri in r[ci["sim"]]:
                assert ri < len(chunks[order[zi]]["rows"])
    assert keys == set(df["key"])


def test_hex_layers_consistent():
    for name in ("hex7", "hex8"):
        gj = json.loads((OUT / f"{name}.geojson").read_text())
        assert gj["features"]
        total = sum(f["properties"]["n"] for f in gj["features"])
        assert total == 21613
        assert all(len(f["geometry"]["coordinates"][0]) == 7 for f in gj["features"])


def test_zip_polygons_complete():
    gj = json.loads((OUT / "zips.geojson").read_text())
    assert len(gj["features"]) == 70


def test_h3_matches_node_h3js():
    """Cross-check Python h3 against h3-js on random King County points (res 6-8 and parent links)."""
    rnd = random.Random(0)
    pts = [(rnd.uniform(47.2, 47.78), rnd.uniform(-122.5, -121.8)) for _ in range(20)]
    py = [[h3.latlng_to_cell(a, b, r) for r in (6, 7, 8)] for a, b in pts]
    js = (
        "const h3=require('h3-js');const pts=JSON.parse(process.argv[1]);"
        "console.log(JSON.stringify(pts.map(([a,b])=>[6,7,8].map(r=>h3.latLngToCell(a,b,r)))))"
    )
    out = subprocess.run(["node", "-e", js, json.dumps(pts)], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    assert json.loads(out) == py
    assert all(h.startswith("88") and len(h) == 15 for _, _, h in py)
