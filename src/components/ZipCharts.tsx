import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { Home } from '../data/types'
import { useT } from '../i18n'
import { histogram } from '../lib/query'
import { priceShort } from '../lib/format'

export interface Series {
  name: string
  color: string
  homes: Home[]
}

const STEP = 100_000
const TOP = 1_500_000

/** Price distribution (share of each ZIP's sales per bin) and size-vs-price scatter. Loaded lazily with Recharts. */
export default function ZipCharts({ series }: { series: Series[] }) {
  const t = useT()
  const bins = TOP / STEP
  const counts = series.map((s) => histogram(s.homes.map((h) => h.price), STEP, TOP))
  const data = Array.from({ length: bins }, (_, i) => {
    const row: Record<string, number | string> = { bin: i === bins - 1 ? `${priceShort(i * STEP)}+` : priceShort(i * STEP) }
    series.forEach((s, k) => (row[s.name] = +((counts[k][i] / Math.max(1, s.homes.length)) * 100).toFixed(1)))
    return row
  })
  const dots = series.map((s) => s.homes.filter((_, i) => i % Math.max(1, Math.ceil(s.homes.length / 250)) === 0).map((h) => ({ x: h.sqft, y: h.price })))

  return (
    <>
      <h2 className="chart-h">{t('charts.prices')}</h2>
      <div className="chart-box" role="img" aria-label={t('charts.barAria')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bin" tick={{ fontSize: 12 }} interval={1} />
            <YAxis tick={{ fontSize: 12 }} unit="%" width={44} />
            <Tooltip formatter={(v) => t('charts.share', { v: String(v) })} />
            {series.length > 1 && <Legend />}
            {series.map((s) => <Bar key={s.name} dataKey={s.name} fill={s.color} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="chart-h">{t('charts.size')}</h2>
      <div className="chart-box" role="img" aria-label={t('charts.scatterAria')}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name={t('charts.area')} tick={{ fontSize: 12 }} domain={[0, 6000]} />
            <YAxis type="number" dataKey="y" name={t('charts.price')} tick={{ fontSize: 12 }} tickFormatter={priceShort} width={56} domain={[0, 3_000_000]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => (n === t('charts.price') ? priceShort(Number(v)) : v)} />
            {series.length > 1 && <Legend />}
            {series.map((s, k) => <Scatter key={s.name} name={s.name} data={dots[k]} fill={s.color} fillOpacity={0.55} />)}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
