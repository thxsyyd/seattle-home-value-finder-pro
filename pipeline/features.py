"""Feature construction, including fold-safe nearest-neighbour comparable-sale features."""
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from .config import BASE_FEATURES, K_NEIGHBORS

LAT0 = 47.5
KM_LAT = 110.57
KM_LON = 111.32 * np.cos(np.radians(LAT0))


def xy_km(df: pd.DataFrame) -> np.ndarray:
    return np.column_stack([(df["long"].to_numpy() + 122.2) * KM_LON, (df["lat"].to_numpy() - LAT0) * KM_LAT])


def neighbor_features(pool: pd.DataFrame, query: pd.DataFrame, same_pool: bool, k: int = K_NEIGHBORS) -> np.ndarray:
    """Mean/median log($/sqft) of the k nearest *pool* sales and their mean distance (km).

    When ``same_pool`` is True the query rows are themselves in the pool (training rows);
    every pool row with the same house id is excluded so a house never sees its own price.
    """
    tree = cKDTree(xy_km(pool))
    extra = 4 if same_pool else 0
    dist, idx = tree.query(xy_km(query), k=k + extra)
    pool_lp = np.log(pool["ppsf"].to_numpy())
    pool_id = pool["id"].to_numpy()
    out = np.empty((len(query), 3))
    q_id = query["id"].to_numpy()
    for i in range(len(query)):
        ii, dd = idx[i], dist[i]
        if same_pool:
            keep = pool_id[ii] != q_id[i]
            ii, dd = ii[keep][:k], dd[keep][:k]
        vals = pool_lp[ii]
        out[i] = (vals.mean(), np.median(vals), dd.mean())
    return out


def design_matrix(df: pd.DataFrame, nb: np.ndarray | None = None) -> np.ndarray:
    cols = [df[BASE_FEATURES].to_numpy(dtype=float), df[["t"]].to_numpy(dtype=float)]
    if nb is not None:
        cols.append(nb)
    return np.hstack(cols)
