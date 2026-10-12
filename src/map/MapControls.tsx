import { useT } from '../i18n'
import type { LayerKey, MetricKey } from '../lib/filters'

function Group<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="mc-group">
      <span className="mc-title" aria-hidden="true">{label}</span>
      <div className="seg stacked">
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  )
}

/** Layer and colour settings, shown in the sidebar while the map is on screen. */
export function MapControls({ layer, metric, onLayer, onMetric }: { layer: LayerKey; metric: MetricKey; onLayer: (l: LayerKey) => void; onMetric: (m: MetricKey) => void }) {
  const t = useT()
  return (
    <div className="mc">
      <Group<LayerKey> label={t('map.areas')} value={layer === 'zip' ? 'zip' : 'hex'} options={[['hex', t('map.smoothed')], ['zip', t('map.zips')]]} onChange={onLayer} />
      <Group<MetricKey> label={t('map.colourBy')} value={metric} options={[['ppsf', t('map.ppsf')], ['price', t('map.price')], ['dev', t('map.dev')]]} onChange={onMetric} />
    </div>
  )
}
