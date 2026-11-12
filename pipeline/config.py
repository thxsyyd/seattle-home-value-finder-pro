"""Paths and tunables for the offline data pipeline."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_CSV = ROOT / "data" / "raw" / "kc_house_data.csv"
# 21 MB statewide ZCTA file kept one level above the repo; zips.py caches the King County subset next to the CSV.
STATE_ZCTA = ROOT.parent / "wa_washington_zip_codes_geo.min.json"
KC_ZCTA_RAW = ROOT / "data" / "raw" / "king_county_zcta_raw.geojson"
WORK = ROOT / "data" / "work"
OUT = ROOT / "public" / "data" / "v1"

SEED = 42
N_FOLDS = 5
K_NEIGHBORS = 20

# Baseline feature set (LinearRegression, R^2 0.647 on an 80/20 split).
COURSE_FEATURES = ["sqft_living", "bathrooms", "grade", "view", "lat", "long"]
BASE_FEATURES = [
    "bedrooms", "bathrooms", "sqft_living", "sqft_lot", "floors", "waterfront", "view",
    "condition", "grade", "sqft_above", "sqft_basement", "yr_built", "yr_renovated",
    "lat", "long", "sqft_living15", "sqft_lot15",
]

HEX_RES_COARSE = 7
HEX_RES_FINE = 8
HEX_MIN_N = 3          # fewer sales than this -> grey cell
SHRINK_K_GRID = [5, 10, 15, 20, 30]

# Size budgets (gzip, KB) asserted by export.py
BUDGET_KB = {"index.json": 40, "hex7.geojson": 40, "hex8.geojson": 120, "zips.geojson": 90, "zip_chunk_max": 30}  # largest zip has 602 sales, ~44 B gzip each
