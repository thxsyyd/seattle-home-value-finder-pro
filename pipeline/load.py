"""Read the Kaggle King County CSV and add a stable per-sale key."""
import pandas as pd

from .config import RAW_CSV


def load() -> pd.DataFrame:
    df = pd.read_csv(RAW_CSV, dtype={"id": str, "zipcode": str})
    df["date"] = pd.to_datetime(df["date"], format="%Y%m%dT%H%M%S")
    df["floors"] = df["floors"].astype(float)
    df = df.sort_values(["id", "date"], kind="stable").reset_index(drop=True)
    # Same house sold twice shares an id; later sales get a -2, -3 suffix.
    nth = df.groupby("id").cumcount() + 1
    df["key"] = df["zipcode"] + "-" + df["id"] + nth.map(lambda n: "" if n == 1 else f"-{n}")
    # months since 2014-05 (0..12), used as a time feature
    df["t"] = (df["date"].dt.year - 2014) * 12 + df["date"].dt.month - 5
    df["ppsf"] = df["price"] / df["sqft_living"]
    return df
