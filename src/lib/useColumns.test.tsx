import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useColumns } from './useColumns'

let trigger: () => void = () => {}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        trigger = cb
      }
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function Probe() {
  const ref = useRef<HTMLDivElement>(null)
  const cols = useColumns(ref)
  return <div ref={ref} data-cols={cols} />
}

describe('useColumns', () => {
  it('follows the element width as it is resized', () => {
    const width = { v: 480 }
    const { container } = render(<Probe />)
    const el = container.firstElementChild as HTMLElement
    el.getBoundingClientRect = () => ({ width: width.v }) as DOMRect
    act(() => trigger())
    expect(el.dataset.cols).toBe('1')
    width.v = 700
    act(() => trigger())
    expect(el.dataset.cols).toBe('2')
    width.v = 1108
    act(() => trigger())
    expect(el.dataset.cols).toBe('3')
  })
})
