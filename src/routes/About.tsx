import { PageShell } from '../components/PageShell'
import { useIndex } from '../data/useIndex'
import { useLang, useT } from '../i18n'
import { money, priceShort, signedPct } from '../lib/format'

const LEGACY = `${import.meta.env.BASE_URL}legacy/Seattle_Home_Value_Dashboard_v4.html`
const MODELS = [
  ['about.m.linear', 'linear_course_features'],
  ['about.m.rf', 'random_forest_course_features'],
  ['about.m.hgb', 'hgb_17_features_log'],
  ['about.m.hgbn', 'hgb_17_features_log_neighbors'],
] as const

export function About() {
  const t = useT()
  const zh = useLang() === 'zh'
  const { data: ix } = useIndex()
  const m = ix?.model

  return (
    <PageShell title={t('about.title')}>
      <p>{t('about.intro')}</p>

      <section>
        <h2>{t('about.data.h')}</h2>
        <ul>
          <li>{t('about.data.1', { n: ix ? ix.nHomes.toLocaleString() : '21,613', range: ix ? `${ix.dataRange[0]} – ${ix.dataRange[1]}` : '2014–2015' })}</li>
          <li>{t('about.data.2')}</li>
          <li>{t('about.data.3')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('about.model.h')}</h2>
        <p>{t('about.model.p')}</p>
        {m && (
          <table>
            <thead><tr><th scope="col">{t('about.table.model')}</th><th scope="col" className="num">{t('about.table.r2')}</th><th scope="col" className="num">{t('about.table.err')}</th></tr></thead>
            <tbody>
              {MODELS.map(([label, key]) => (
                <tr key={key}><td>{t(label)}</td><td className="num">{m.models[key].r2.toFixed(3)}</td><td className="num">{money(m.models[key].mae)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {m && <p className="hint">{t('about.cv', { p10: signedPct(m.error_overall.p10), p90: signedPct(m.error_overall.p90) })}</p>}
        <h3>{t('about.why.h')}</h3>
        <p>
          {t('about.why.p1')} <a href={LEGACY}>{t('about.why.link')}</a>{zh ? '。' : '. '}{t('about.why.p2')}
        </p>
        {m && (
          <table>
            <thead><tr><th scope="col">{t('about.bias.price')}</th><th scope="col" className="num">{t('about.bias.n')}</th><th scope="col" className="num">{t('about.bias.linear')}</th><th scope="col" className="num">{t('about.bias.v2')}</th></tr></thead>
            <tbody>
              {m.bias_by_price.map((b) => (
                <tr key={b.price_lo}>
                  <td>
                    {b.price_lo === 0
                      ? t('about.bias.under', { hi: priceShort(b.price_hi) })
                      : b.price_hi > 1e8
                        ? t('about.bias.over', { lo: priceShort(b.price_lo) })
                        : t('about.bias.range', { lo: priceShort(b.price_lo), hi: priceShort(b.price_hi) })}
                  </td>
                  <td className="num">{b.n.toLocaleString()}</td>
                  <td className="num">{signedPct(b.linear_median_error, 1)}</td>
                  <td className="num">{signedPct(b.v2_median_error, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p>
          {t('about.bias.note')}
          {m && `${zh ? '' : ' '}${t('about.bias.overlap', { n: m.top200_overlap }).trim()}`}
        </p>
        <h3>{t('about.deal.h')}</h3>
        <ul>
          <li>{t('about.deal.1')}</li>
          <li>{t('about.deal.2')}</li>
          <li>{t('about.deal.3')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('about.map.h')}</h2>
        <ul>
          <li>{t('about.map.1', { n: ix?.hex.minN ?? 3 })}</li>
          <li>{t('about.map.2')}</li>
          <li>{t('about.map.3')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('about.credits.h')}</h2>
        <ul>
          <li>{t('about.credits.1')}</li>
          <li>{t('about.credits.2')}</li>
          <li>{t('about.credits.3')}</li>
          <li>{t('about.credits.4')}</li>
        </ul>
        <p>{t('about.disclaimer')}</p>
      </section>
    </PageShell>
  )
}
