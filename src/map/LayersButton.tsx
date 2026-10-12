import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { useT } from '../i18n'
import { useFilters } from '../state/useFilters'
import { MapControls } from './MapControls'

/** Small "Map layers" button in the map's corner; opens the area and colour settings. */
export function LayersButton() {
  const t = useT()
  const [filters, setFilters] = useFilters()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div className="layers" ref={box}>
      <button type="button" className="layers-btn" aria-expanded={open} aria-controls="layers-pop" onClick={() => setOpen(!open)}>
        <Icon name="layers" /> {t('map.layers')}
      </button>
      {open && (
        <div id="layers-pop" className="layers-pop">
          <MapControls layer={filters.layer} metric={filters.metric} onLayer={(layer) => setFilters({ layer })} onMetric={(metric) => setFilters({ metric })} />
        </div>
      )}
    </div>
  )
}
