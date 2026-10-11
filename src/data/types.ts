export type BBox = [west: number, south: number, east: number, north: number]

export interface ZipRow {
  zip: string
  n: number
  medPrice: number
  medPpsf: number
  medDev: number
  pctBelow: number
  bbox: BBox
  centroid: [lon: number, lat: number]
}

export interface ErrorBand {
  pred_min: number
  pred_max: number
  n: number
  p10: number
  p90: number
  median: number
}

export interface ModelMetrics {
  r2: number
  mae: number
  mape_median: number
}

export interface PriceIndex {
  metro: { series: string; asOf: string; byMonth: Record<string, number> }
  zip: {
    series: string
    fhfaLatestYear: number
    rollForward: number
    factor: Record<string, Record<string, number>>
    missing: string[]
  }
  mortgageRate: { series: string; asOf: string; pct: number }
}

export interface IndexData {
  version: string
  generated: string
  dataRange: [string, string]
  nHomes: number
  zips: ZipRow[]
  histogram: { step: number; top: number; counts: number[] }
  model: {
    cv: { folds: number; grouped_by: string; seed: number }
    models: Record<string, ModelMetrics>
    error_bands: ErrorBand[]
    error_overall: { p10: number; p90: number }
    bias_by_price: { price_lo: number; price_hi: number; n: number; linear_median_error: number; v2_median_error: number }[]
    top200_overlap: number
  }
  priceIndex: PriceIndex
  hex: { k: Record<string, number>; minN: number }
}

/** One sale. `dev` is price/pred - 1 (negative = sold below the model estimate). */
export interface Home {
  key: string
  zip: string
  date: string
  price: number
  pred: number
  predLin: number
  dev: number
  beds: number
  baths: number
  sqft: number
  lot: number
  floors: number
  waterfront: number
  view: number
  condition: number
  grade: number
  yearBuilt: number
  yearReno: number
  lat: number
  lon: number
  /** similar homes as [zipIndex, rowIndex] into index.zips / that zip's chunk */
  sim: [number, number][]
}
