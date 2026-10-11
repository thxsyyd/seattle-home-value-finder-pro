export const DEFAULT_VIEW = { lat: 47.45, lon: -122.1, zoom: 9.2 }

export function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
