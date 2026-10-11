import { useEffect, useRef } from 'react'

/** Move focus to a heading when a detail panel opens, so keyboard and screen-reader users land on the new content. */
export function useFocusOnMount<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [dep])
  return ref
}
