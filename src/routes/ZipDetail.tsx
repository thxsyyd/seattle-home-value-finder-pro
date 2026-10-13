import { lazy, Suspense } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { SearchLink } from '../components/SearchLink'
import { useZipHomes } from '../data/useZipHomes'
import { useT } from '../i18n'
import { useFocusOnMount } from '../lib/useFocusOnMount'
import { money, signedPct } from '../lib/format'
import { useFilters } from '../state/useFilters'
import type { ExploreContext } from './Explore'

const ZipCharts = lazy(() => import('../components/ZipCharts'))

export function ZipDetail() {
  const { zip } = useParams()
  const t = useT()
  const { index } = useOutletContext<ExploreContext>()
  const [, setFilters] = useFilters()
  const navigate = useNavigate()
  const heading = useFocusOnMount<HTMLHeadingElement>(zip)
  const row = index?.zips.find((z) => z.zip === zip)
  const homes = useZipHomes(row ? zip : undefined, index)

  return (
    <div className="panel-pad detail">
      <SearchLink to="/" className="backlink">{t('back.results')}</SearchLink>
      <h1 ref={heading} tabIndex={-1}>{t('zip.title', { zip: zip ?? '' })}</h1>
      {!index && <p>{t('loading')}</p>}
      {index && !row && <p>{t('zip.none')}</p>}
      {row && index && (
        <>
          <dl>
            <dt>{t('zip.sales')}</dt><dd>{row.n.toLocaleString()}</dd>
            <dt>{t('zip.median')}</dt><dd>{money(row.medPrice)}</dd>
            <dt>{t('zip.ppsf')}</dt><dd>${row.medPpsf}</dd>
            <dt>{t('zip.dev')}</dt><dd>{signedPct(row.medDev, 1)}</dd>
            <dt>{t('zip.below')}</dt><dd>{t('zip.belowVal', { p: Math.round(row.pctBelow * 100) })}</dd>
          </dl>
          <p className="hint">{t('zip.explain')}</p>
          <p style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="secondary" onClick={() => setFilters({ ll: [row.centroid[1], row.centroid[0]], z: 12.5 })}>{t('zip.show')}</button>
            <label>
              {t('zip.compareWith')}{' '}
              <select
                value=""
                onChange={(e) => e.target.value && navigate({ pathname: `/compare/${zip}/${e.target.value}`, search: location.search })}
                style={{ minHeight: 40, font: 'inherit' }}
              >
                <option value="">{t('zip.choose')}</option>
                {index.zips.filter((z) => z.zip !== zip).map((z) => <option key={z.zip} value={z.zip}>{z.zip}</option>)}
              </select>
            </label>
          </p>
          {homes.data && (
            <Suspense fallback={<p>{t('charts.loading')}</p>}>
              <ZipCharts series={[{ name: t('zip.series', { zip: zip ?? '' }), color: '#222222', homes: homes.data }]} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
