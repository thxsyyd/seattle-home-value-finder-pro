"""Out-of-fold price predictions (HistGradientBoosting, log target) plus baselines and error bands."""
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupKFold

from .config import COURSE_FEATURES, N_FOLDS, SEED
from .features import design_matrix, neighbor_features


def _hgb() -> HistGradientBoostingRegressor:
    return HistGradientBoostingRegressor(
        learning_rate=0.06, max_iter=500, early_stopping=True, validation_fraction=0.1,
        n_iter_no_change=25, random_state=SEED,
    )


def run_oof(df: pd.DataFrame) -> pd.DataFrame:
    """Return df with columns pred, pred_lin (OOF) plus baselines pred_rf, pred_hgb_nonb (for the model card)."""
    y = df["price"].to_numpy(dtype=float)
    ly = np.log(y)
    n = len(df)
    pred = np.full(n, np.nan)
    pred_lin = np.full(n, np.nan)
    pred_rf = np.full(n, np.nan)
    pred_hgb_nonb = np.full(n, np.nan)

    gkf = GroupKFold(n_splits=N_FOLDS, shuffle=True, random_state=SEED)
    fold_of = np.full(n, -1)
    for f, (tr, va) in enumerate(gkf.split(df, y, groups=df["id"])):
        fold_of[va] = f
        d_tr, d_va = df.iloc[tr], df.iloc[va]
        # fold-safe comparable-sale features: pool = training fold only
        nb_tr = neighbor_features(d_tr, d_tr, same_pool=True)
        nb_va = neighbor_features(d_tr, d_va, same_pool=False)

        m = _hgb().fit(design_matrix(d_tr, nb_tr), ly[tr])
        pred[va] = np.exp(m.predict(design_matrix(d_va, nb_va)))

        m2 = _hgb().fit(design_matrix(d_tr), ly[tr])
        pred_hgb_nonb[va] = np.exp(m2.predict(design_matrix(d_va)))

        lin = LinearRegression().fit(d_tr[COURSE_FEATURES], y[tr])
        pred_lin[va] = lin.predict(d_va[COURSE_FEATURES])

        rf = RandomForestRegressor(n_estimators=200, min_samples_leaf=2, n_jobs=-1, random_state=SEED)
        rf.fit(d_tr[COURSE_FEATURES], y[tr])
        pred_rf[va] = rf.predict(d_va[COURSE_FEATURES])

    out = df.copy()
    out["pred"], out["pred_lin"], out["pred_rf"], out["pred_hgb_nonb"] = pred, pred_lin, pred_rf, pred_hgb_nonb
    out["fold"] = fold_of
    out["dev"] = out["price"] / out["pred"] - 1
    out["dev_lin"] = out["price"] / out["pred_lin"] - 1
    return out


def _metrics(y, p) -> dict:
    return {"r2": float(r2_score(y, p)), "mae": float(mean_absolute_error(y, p)),
            "mape_median": float(np.median(np.abs(y - p) / y))}


def model_card(df: pd.DataFrame) -> dict:
    y = df["price"].to_numpy(dtype=float)
    card = {
        "cv": {"folds": N_FOLDS, "grouped_by": "house id", "seed": SEED},
        "models": {
            "linear_course_features": _metrics(y, df["pred_lin"]),
            "random_forest_course_features": _metrics(y, df["pred_rf"]),
            "hgb_17_features_log": _metrics(y, df["pred_hgb_nonb"]),
            "hgb_17_features_log_neighbors": _metrics(y, df["pred"]),
        },
        "features": {"course": ["sqft_living", "bathrooms", "grade", "view", "lat", "long"], "v2_neighbors": 20},
    }
    # error bands: price/pred ratio quantiles by predicted-price quintile
    q = pd.qcut(df["pred"], 5, labels=False, duplicates="drop")
    bands = []
    for b in sorted(q.unique()):
        s = df[q == b]
        r = s["price"] / s["pred"]
        bands.append({"pred_min": float(s["pred"].min()), "pred_max": float(s["pred"].max()), "n": int(len(s)),
                      "p10": float(r.quantile(0.10) - 1), "p90": float(r.quantile(0.90) - 1),
                      "median": float(r.median() - 1)})
    card["error_bands"] = bands
    r_all = df["price"] / df["pred"]
    card["error_overall"] = {"p10": float(r_all.quantile(0.10) - 1), "p90": float(r_all.quantile(0.90) - 1)}
    # linear-model bias by actual-price bucket (the "overestimates the mid-range" finding)
    bias = []
    for lo, hi in [(0, 3e5), (3e5, 5e5), (5e5, 8e5), (8e5, 1.2e6), (1.2e6, 1e9)]:
        s = df[(df["price"] >= lo) & (df["price"] < hi)]
        bias.append({"price_lo": lo, "price_hi": hi, "n": int(len(s)),
                     "linear_median_error": float(np.median((s["pred_lin"] - s["price"]) / s["price"])),
                     "v2_median_error": float(np.median((s["pred"] - s["price"]) / s["price"]))})
    card["bias_by_price"] = bias
    top_lin = set(df.nsmallest(200, "dev_lin")["key"])
    top_v2 = set(df.nsmallest(200, "dev")["key"])
    card["top200_overlap"] = len(top_lin & top_v2)
    return card
