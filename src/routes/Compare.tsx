import { lazy, Suspense } from 'react'
import { useParams } from 'react-router'
import { PageShell } from '../components/PageShell'
import { SearchLink } from '../components/SearchLink'
import type { Home, IndexData, ZipRow } from '../data/types'
import { useHome } from '../data/useHome'
import { useIndex } from '../data/useIndex'
import { useZipHomes } from '../data/useZipHomes'
import { money, signedPct } from '../lib/format'

const ZipCharts = lazy(() => import('../components/ZipCharts'))
const isZip = (s: string | undefined) => !!s && /^\d{5}$/.test(s)

export function Compare() {
  const { a, b } = useParams()
  const index = useIndex()
  return (
    <PageShell title="Compare">
      {!index.data ? <p>Loading…</p> : isZip(a) && isZip(b) ? <ZipCompare a={a!} b={b!} index={index.data} /> : <HomeCompare a={a} b={b} index={index.data} />}
    </PageShell>
  )
}

function ZipCompare({ a, b, index }: { a: string; b: string; index: IndexData }) {
  const ra = index.zips.find((z) => z.zip === a)
  const rb = index.zips.find((z) => z.zip === b)
  const ha = useZipHomes(ra ? a : undefined, index)
  const hb = useZipHomes(rb ? b : undefined, index)
  if (!ra || !rb) return <p>One of those ZIP codes isn’t in the data.</p>
  const rows: [string, (z: ZipRow) => string][] = [
    ['Sales', (z) => z.n.toLocaleString()],
    ['Median price', (z) => money(z.medPrice)],
    ['Median $ per sq ft', (z) => `$${z.medPpsf}`],
    ['Median vs. model', (z) => signedPct(z.medDev, 1)],
    ['Sold ≥10% below model', (z) => `${Math.round(z.pctBelow * 100)}%`],
  ]
  return (
    <>
      <table>
        <thead><tr><th scope="col">Measure</th><th scope="col" className="num"><SearchLink to={`/zip/${a}`}>{a}</SearchLink></th><th scope="col" className="num"><SearchLink to={`/zip/${b}`}>{b}</SearchLink></th></tr></thead>
        <tbody>{rows.map(([k, f]) => <tr key={k}><th scope="row">{k}</th><td className="num">{f(ra)}</td><td className="num">{f(rb)}</td></tr>)}</tbody>
      </table>
      {ha.data && hb.data && (
        <Suspense fallback={<p>Loading charts…</p>}>
          <ZipCharts series={[{ name: `ZIP ${a}`, color: '#0b5cad', homes: ha.data }, { name: `ZIP ${b}`, color: '#b45309', homes: hb.data }]} />
        </Suspense>
      )}
    </>
  )
}

function HomeCompare({ a, b, index }: { a?: string; b?: string; index: IndexData }) {
  const ha = useHome(a, index).data
  const hb = useHome(b, index).data
  if (!ha || !hb) return <p>Loading, or one of those sales couldn’t be found.</p>
  const rows: [string, (h: Home) => string][] = [
    ['Sold price', (h) => money(h.price)],
    ['Model estimate', (h) => money(h.pred)],
    ['Vs. model', (h) => signedPct(h.dev)],
    ['Sold', (h) => h.date],
    ['ZIP', (h) => h.zip],
    ['Bedrooms / baths', (h) => `${h.beds} / ${h.baths}`],
    ['Living area', (h) => `${h.sqft.toLocaleString()} sq ft`],
    ['$ per sq ft', (h) => `$${Math.round(h.price / h.sqft)}`],
    ['Lot', (h) => `${h.lot.toLocaleString()} sq ft`],
    ['Built', (h) => `${h.yearBuilt}${h.yearReno ? ` (renovated ${h.yearReno})` : ''}`],
    ['Grade / condition', (h) => `${h.grade} / ${h.condition}`],
    ['Waterfront / view', (h) => `${h.waterfront ? 'yes' : 'no'} / ${h.view}`],
  ]
  return (
    <table>
      <thead><tr><th scope="col">Measure</th><th scope="col" className="num"><SearchLink to={`/home/${ha.key}`}>Home A</SearchLink></th><th scope="col" className="num"><SearchLink to={`/home/${hb.key}`}>Home B</SearchLink></th></tr></thead>
      <tbody>{rows.map(([k, f]) => <tr key={k}><th scope="row">{k}</th><td className="num">{f(ha)}</td><td className="num">{f(hb)}</td></tr>)}</tbody>
    </table>
  )
}
