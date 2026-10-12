/** Opens on Seattle and Bellevue so the first screen already shows homes. */
export const DEFAULT_VIEW = { lat: 47.6, lon: -122.25, zoom: 11.3 }

export function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
