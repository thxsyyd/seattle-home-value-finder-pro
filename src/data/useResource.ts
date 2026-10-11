import { useEffect, useRef, useState } from 'react'

export type Status = 'idle' | 'loading' | 'ready' | 'error'
export interface Resource<T> {
  data: T | undefined
  error: Error | undefined
  status: Status
}

/** Run `loader` whenever `key` changes; the previous call is aborted. A null key means idle. */
export function useResource<T>(key: string | null, loader: (signal: AbortSignal) => Promise<T>): Resource<T> {
  const [state, setState] = useState<{ key: string | null; res: Resource<T> }>({
    key: null,
    res: { data: undefined, error: undefined, status: 'idle' },
  })
  const loaderRef = useRef(loader)
  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    if (key === null) return
    const ctl = new AbortController()
    loaderRef.current(ctl.signal).then(
      (data) => setState({ key, res: { data, error: undefined, status: 'ready' } }),
      (error: Error) => {
        if (error.name !== 'AbortError') setState({ key, res: { data: undefined, error, status: 'error' } })
      },
    )
    return () => ctl.abort()
  }, [key])

  if (key === null) return { data: undefined, error: undefined, status: 'idle' }
  if (state.key !== key) return { data: undefined, error: undefined, status: 'loading' }
  return state.res
}
