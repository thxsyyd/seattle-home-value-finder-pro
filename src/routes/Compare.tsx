import { lazy, Suspense, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { PageShell } from '../components/PageShell'
import { SearchLink } from '../components/SearchLink'
import type { Home, IndexData, ZipRow } from '../data/types'
import { useHome } from '../data/useHome'
import { useIndex } from '../data/useIndex'
import { useZipHomes } from '../data/useZipHomes'
import { useT, type T } from '../i18n'
import { money, signedPct } from '../lib/format'

const ZipCharts = lazy(() => import('../components/ZipCharts'))
const isZip = (s: string | undefined) => !!s && /^\d{5}$/.test(s)

export function Compare() {
  const { a, b } = useParams()
  const t = useT()
  const index = useIndex()
  return (
    <PageShell title={t('compare.title')}>
      {!index.data ? <p>{t('loading')}</p> : isZip(a) && isZip(b) ? <ZipCompare a={a!} b={b!} index={index.data} t={t} /> : <HomeCompare a={a} b={b} index={index.data} t={t} />}
    </PageShell>
  )
}

function ZipCompare({ a, b, index, t }: { a: string; b: string; index: IndexData; t: T }) {
  const ra = index.zips.find((z) => z.zip === a)
  const rb = index.zips.find((z) => z.zip === b)
  const ha = useZipHomes(ra ? a : undefined, index)
  const hb = useZipHomes(rb ? b : undefined, index)
  if (!ra || !rb) return <p>{t('compare.zipMissing')}</p>
  const rows: [string, (z: ZipRow) => string][] = [
    [t('zip.sales'), (z) => z.n.toLocaleString()],
    [t('zip.median'), (z) => money(z.medPrice)],
    [t('zip.ppsf'), (z) => `$${z.medPpsf}`],
    [t('zip.dev'), (z) => signedPct(z.medDev, 1)],
    [t('zip.below'), (z) => t('zip.belowShort', { p: Math.round(z.pctBelow * 100) })],
  ]
  return (
    <>
      <table>
        <thead><tr><th scope="col">{t('compare.measure')}</th><th scope="col" className="num"><SearchLink to={`/zip/${a}`}>{a}</SearchLink></th><th scope="col" className="num"><SearchLink to={`/zip/${b}`}>{b}</SearchLink></th></tr></thead>
        <tbody>{rows.map(([k, f]) => <tr key={k}><th scope="row">{k}</th><td className="num">{f(ra)}</td><td className="num">{f(rb)}</td></tr>)}</tbody>
      </table>
      {ha.data && hb.data && (
        <Suspense fallback={<p>{t('charts.loading')}</p>}>
          <ZipCharts series={[{ name: t('zip.series', { zip: a }), color: '#0b5cad', homes: ha.data }, { name: t('zip.series', { zip: b }), color: '#b45309', homes: hb.data }]} />
        </Suspense>
      )}
    </>
  )
}

function HomeCompare({ a, b, index, t }: { a?: string; b?: string; index: IndexData; t: T }) {
  const ha = useHome(a, index).data
  const hb = useHome(b, index).data
  if (!ha || !hb) return <p>{t('compare.homeMissing')}</p>
  const rows: [string, (h: Home) => string][] = [
    [t('compare.soldPrice'), (h) => money(h.price)],
    [t('home.estimate'), (h) => money(h.pred)],
    [t('compare.vs'), (h) => signedPct(h.dev)],
    [t('home.sold'), (h) => h.date],
    [t('home.zip'), (h) => h.zip],
    [t('home.bedsBaths'), (h) => `${h.beds} / ${h.baths}`],
    [t('home.area'), (h) => t('compare.sqft', { n: h.sqft.toLocaleString() })],
    [t('sort.ppsf'), (h) => `$${Math.round(h.price / h.sqft)}`],
    [t('home.lot'), (h) => t('compare.sqft', { n: h.lot.toLocaleString() })],
    [t('home.built'), (h) => (h.yearReno ? t('home.renovated', { y: h.yearBuilt, r: h.yearReno }) : String(h.yearBuilt))],
    [t('home.grade'), (h) => t('compare.gradeVal', { g: h.grade, c: h.condition })],
    [t('compare.wfView'), (h) => `${h.waterfront ? t('yes') : t('no')} / ${h.view}`],
  ]
  return (
    <table>
      <thead><tr><th scope="col">{t('compare.measure')}</th><th scope="col" className="num"><SearchLink to={`/home/${ha.key}`}>{t('compare.homeA')}</SearchLink></th><th scope="col" className="num"><SearchLink to={`/home/${hb.key}`}>{t('compare.homeB')}</SearchLink></th></tr></thead>
      <tbody>{rows.map(([k, f]) => <tr key={k}><th scope="row">{k}</th><td className="num">{f(ha)}</td><td className="num">{f(hb)}</td></tr>)}</tbody>
    </table>
  )
}

/** /compare with no ZIP codes: choose two. */
export function CompareIndex() {
  const t = useT()
  const index = useIndex()
  const navigate = useNavigate()
  const { search } = useLocation()
  const zips = index.data?.zips ?? []
  const [a, setA] = useState('98103')
  const [b, setB] = useState('98004')
  return (
    <PageShell title={t('compare.title')}>
      <p>{t('compareChooser.hint')}</p>
      {zips.length === 0 ? (
        <p>{t('loading')}</p>
      ) : (
        <form
          className="fields"
          onSubmit={(e) => {
            e.preventDefault()
            navigate({ pathname: `/compare/${a}/${b}`, search })
          }}
        >
          {([[a, setA, 'compareChooser.a'], [b, setB, 'compareChooser.b']] as const).map(([val, set, label]) => (
            <label key={label} className="field">
              <span>{t(label)}</span>
              <select value={val} onChange={(e) => set(e.target.value)} className="select-field">
                {zips.map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
              </select>
            </label>
          ))}
          <button type="submit" className="primary" disabled={a === b}>{t('compareChooser.go')}</button>
        </form>
      )}
    </PageShell>
  )
}
