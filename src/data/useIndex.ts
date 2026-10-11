import { loadIndex } from './api'
import { useResource } from './useResource'

export const useIndex = () => useResource('index', (signal) => loadIndex(signal))
