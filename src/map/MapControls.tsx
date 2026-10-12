import { useT } from '../i18n'
import type { LayerKey, MetricKey } from '../lib/filters'

function Group<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: 'var(--r-pill)', boxShadow: '0 1px 4px #0003', padding: 2 }}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          style={{
            border: 0, cursor: 'pointer', minHeight: 36, padding: '0 var(--s-3)', borderRadius: 'var(--r-pill)', font: 'inherit', fontSize: 'var(--fs-small)',
            background: value === v ? 'var(--accent)' : 'transparent', color: value === v ? '#fff' : 'var(--text)',
          }}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export function MapControls({ layer, metric, onLayer, onMetric }: { layer: LayerKey; metric: MetricKey; onLayer: (l: LayerKey) => void; onMetric: (m: MetricKey) => void }) {
  const t = useT()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
      <Group<LayerKey> label={t('map.areas')} value={layer === 'zip' ? 'zip' : 'hex'} options={[['hex', t('map.smoothed')], ['zip', t('map.zips')]]} onChange={onLayer} />
      <Group<MetricKey> label={t('map.colourBy')} value={metric} options={[['ppsf', t('map.ppsf')], ['price', t('map.price')], ['dev', t('map.dev')]]} onChange={onMetric} />
    </div>
  )
}
