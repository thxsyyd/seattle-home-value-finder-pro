import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { useT } from '../i18n'
import { clampPanel, MIN_MAP, HANDLE } from '../lib/split'

interface Props {
  /** the element that holds list, handle and map */
  container: RefObject<HTMLElement | null>
  /** current list width in px, or null for the default share */
  value: number | null
  onChange: (px: number | null, final: boolean) => void
}

const STEP = 24

/** Drag (or use the arrow keys) to trade width between the results list and the map. Double-click resets. */
export function Splitter({ container, value, onChange }: Props) {
  const t = useT()
  const dragging = useRef(false)

  const total = () => container.current?.getBoundingClientRect().width ?? 1200
  const current = () => value ?? Math.round(container.current?.querySelector('.panel')?.getBoundingClientRect().width ?? total() * 0.34)

  const move = (e: PointerEvent) => {
    const rect = container.current?.getBoundingClientRect()
    if (!dragging.current || !rect) return
    onChange(clampPanel(e.clientX - rect.left - HANDLE / 2, rect.width), false)
  }
  const key = (e: KeyboardEvent) => {
    const w = total()
    const map: Record<string, number | null> = {
      ArrowLeft: clampPanel(current() - STEP, w),
      ArrowRight: clampPanel(current() + STEP, w),
      Home: clampPanel(0, w),
      End: clampPanel(w, w),
      Enter: null,
    }
    if (e.key in map) {
      e.preventDefault()
      onChange(map[e.key], true)
    }
  }

  const w = total()
  return (
    <div
      className="splitter"
      role="separator"
      aria-orientation="vertical"
      aria-label={t('split.label')}
      aria-valuemin={clampPanel(0, w)}
      aria-valuemax={w - MIN_MAP - HANDLE}
      aria-valuenow={current()}
      tabIndex={0}
      title={t('split.hint')}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={move}
      onPointerUp={(e) => {
        dragging.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
        const rect = container.current?.getBoundingClientRect()
        if (rect) onChange(clampPanel(e.clientX - rect.left - HANDLE / 2, rect.width), true)
      }}
      onDoubleClick={() => onChange(null, true)}
      onKeyDown={key}
    >
      <span className="splitter-grip" aria-hidden="true" />
    </div>
  )
}
