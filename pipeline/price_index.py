"""Price-index factors to restate 2014-15 sale prices in today's dollars.

Sources (downloaded into data/work, cached):
  * FRED SEXRSA: S&P/Case-Shiller Seattle home price index, monthly, seasonally adjusted.
  * FHFA ZIP5: annual all-transactions HPI by five-digit ZIP (developmental), nominal.
  * FRED MORTGAGE30US: Freddie Mac 30-year fixed rate, weekly.
Factor for a zip/sale-year = FHFA(latest year)/FHFA(sale year) x SEXRSA(latest month)/mean(SEXRSA over latest FHFA year),
i.e. FHFA carries the zip-level shape up to its last full year and Case-Shiller rolls it forward to today.
"""
import pandas as pd
import requests

from .config import WORK

URLS = {
    "SEXRSA.csv": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=SEXRSA",
    "MORTGAGE30US.csv": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US",
    "hpi_at_zip5.xlsx": "https://www.fhfa.gov/hpi/download/annual/hpi_at_zip5.xlsx",
}


def _ensure(name: str) -> None:
    p = WORK / name
    if not p.exists():
        WORK.mkdir(parents=True, exist_ok=True)
        r = requests.get(URLS[name], headers={"User-Agent": "Mozilla/5.0"}, timeout=120)
        r.raise_for_status()
        p.write_bytes(r.content)


def _fred(name: str, col: str) -> pd.Series:
    _ensure(name)
    s = pd.read_csv(WORK / name, parse_dates=["observation_date"]).set_index("observation_date")[col]
    return pd.to_numeric(s, errors="coerce").dropna()


def _fhfa_zip5(zips: set[str]) -> pd.DataFrame:
    import openpyxl
    _ensure("hpi_at_zip5.xlsx")
    wb = openpyxl.load_workbook(WORK / "hpi_at_zip5.xlsx", read_only=True)
    ws = wb["ZIP5"]
    rows = []
    header_seen = False
    for r in ws.iter_rows(values_only=True):
        if not header_seen:
            header_seen = r[0] == "Five-Digit ZIP Code"
            continue
        z = str(r[0]).zfill(5) if r[0] is not None else ""  # numeric cells drop leading zeros
        if z in zips:
            try:
                rows.append((z, int(r[1]), float(r[3])))
            except (TypeError, ValueError):
                pass  # "." = suppressed small-sample value
    return pd.DataFrame(rows, columns=["zip", "year", "hpi"])


def build(zips: set[str], sale_months: list[str]) -> dict:
    sx = _fred("SEXRSA.csv", "SEXRSA")
    latest_month = sx.index[-1]
    fh = _fhfa_zip5(zips)
    fh_year = int(fh["year"].max())  # latest year present for the 70 zips
    full = fh[fh["year"] == fh_year]["zip"].nunique()
    ref = sx[sx.index.year == fh_year].mean()
    roll = float(sx.iloc[-1] / ref)

    metro = {m: float(sx.iloc[-1] / sx[pd.Timestamp(m + "-01")]) for m in sale_months}
    piv = fh.pivot(index="zip", columns="year", values="hpi")
    zip_factor = {}
    for z in sorted(zips):
        if z not in piv.index or pd.isna(piv.loc[z].get(fh_year)):
            continue
        f = {}
        for y in (2014, 2015):
            v = piv.loc[z].get(y)
            if pd.notna(v):
                f[str(y)] = round(float(piv.loc[z, fh_year] / v * roll), 4)
        if len(f) == 2:
            zip_factor[z] = f

    mort = _fred("MORTGAGE30US.csv", "MORTGAGE30US")
    return {
        "metro": {"series": "S&P/Case-Shiller Seattle (FRED SEXRSA)", "asOf": latest_month.strftime("%Y-%m"),
                  "byMonth": {k: round(v, 4) for k, v in metro.items()}},
        "zip": {"series": "FHFA all-transactions ZIP5 HPI (annual, nominal) rolled forward with SEXRSA",
                "fhfaLatestYear": fh_year, "rollForward": round(roll, 4), "factor": zip_factor,
                "missing": sorted(zips - set(zip_factor))},
        "mortgageRate": {"series": "Freddie Mac 30-year fixed (FRED MORTGAGE30US)",
                         "asOf": mort.index[-1].strftime("%Y-%m-%d"), "pct": float(mort.iloc[-1])},
        "_diag": {"fhfa_zips_at_latest_year": int(full)},
    }
