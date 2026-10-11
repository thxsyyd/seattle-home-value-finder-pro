import { loadZip } from './api'
import type { Home, IndexData } from './types'
import { useResource } from './useResource'

export function useZipHomes(zip: string | undefined, index: IndexData | undefined) {
  const v = index?.version
  return useResource<Home[]>(zip && v ? `zip:${v}:${zip}` : null, (signal) => loadZip(zip!, v!, signal))
}
