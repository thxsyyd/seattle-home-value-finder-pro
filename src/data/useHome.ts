import { loadZip } from './api'
import type { Home, IndexData } from './types'
import { useResource } from './useResource'

/** The ZIP code is the prefix of a sale key ("98103-7129300520[-2]"). */
export const zipOfKey = (key: string) => key.split('-', 1)[0]

/** Load one sale by key (fetches only its ZIP chunk, which is usually cached already). */
export function useHome(key: string | undefined, index: IndexData | undefined) {
  const v = index?.version
  return useResource<Home | null>(key && v ? `home:${v}:${key}` : null, async (signal) => {
    const homes = await loadZip(zipOfKey(key!), v!, signal)
    return homes.find((h) => h.key === key) ?? null
  })
}

/** The five precomputed similar sales of `home`, resolved through their ZIP chunks. */
export function useSimilar(home: Home | null | undefined, index: IndexData | undefined) {
  const v = index?.version
  return useResource<Home[]>(home && index && v ? `sim:${v}:${home.key}` : null, async (signal) => {
    const out: Home[] = []
    for (const [zi, ri] of home!.sim) {
      const homes = await loadZip(index!.zips[zi].zip, v!, signal)
      if (homes[ri]) out.push(homes[ri])
    }
    return out
  })
}
