import type { Currencies } from './types'

const NOTABLE_THRESHOLD = 0.2
const MONEY_KEYS = new Set(['copper', 'silver', 'gold'])

function combinedMoney(c: Currencies): number {
  return 10000 * (c.gold ?? 0) + 100 * (c.silver ?? 0) + (c.copper ?? 0)
}

export function isNotableResult(prev: Currencies, next: Currencies): boolean {
  // Gold/Silver/Copper: treat as one combined money pool
  const prevMoney = combinedMoney(prev)
  const nextMoney = combinedMoney(next)
  const moneyGain = nextMoney - prevMoney
  if (moneyGain > 0) {
    if (prevMoney === 0 || moneyGain / prevMoney > NOTABLE_THRESHOLD) return true
  }

  // All other currencies: per-key logic
  for (const key of Object.keys(next)) {
    if (MONEY_KEYS.has(key)) continue
    const gained = (next[key] ?? 0) - (prev[key] ?? 0)
    if (gained <= 0) continue
    const prevBalance = prev[key] ?? 0
    if (prevBalance === 0) return true
    if (gained / prevBalance > NOTABLE_THRESHOLD) return true
  }

  return false
}
