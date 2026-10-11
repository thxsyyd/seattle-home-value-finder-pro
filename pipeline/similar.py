"""Five similar homes per sale (same zip preferred), precomputed so the client does no ML."""
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from .features import xy_km

N_SIM = 5


def similar(df: pd.DataFrame) -> dict[str, list[str]]:
    """Return key -> list of 5 similar sale keys: nearest in a standardised (size, grade, age, location) space.

    Other sales of the same house are excluded. Distances weight location (km) and home characteristics.
    """
    feat = np.column_stack([
        np.log(df["sqft_living"]) / 0.35, df["grade"] / 1.6, (df["yr_built"] - 1975) / 30,
        df["bedrooms"].clip(upper=6) / 1.0, xy_km(df)[:, 0] / 4.0, xy_km(df)[:, 1] / 4.0,
    ])
    tree = cKDTree(feat)
    _, idx = tree.query(feat, k=N_SIM + 4)
    keys, ids = df["key"].to_numpy(), df["id"].to_numpy()
    out = {}
    for i in range(len(df)):
        sel = [j for j in idx[i] if ids[j] != ids[i]][:N_SIM]
        out[keys[i]] = [keys[j] for j in sel]
    return out
