import type { Currencies } from './types'

const NOTABLE_THRESHOLD = 0.2

export function isNotableResult(prev: Currencies, next: Currencies): boolean {
  for (const key of Object.keys(next)) {
    if (key === 'crowns') {
      if ((next[key] ?? 0) > (prev[key] ?? 0)) return true
      continue
    }
    const gained = (next[key] ?? 0) - (prev[key] ?? 0)
    if (gained <= 0) continue
    const prevBalance = prev[key] ?? 0
    if (prevBalance === 0) return true
    if (gained / prevBalance > NOTABLE_THRESHOLD) return true
  }
  return false
}
