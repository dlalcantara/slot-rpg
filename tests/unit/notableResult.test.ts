import { describe, it, expect } from 'vitest'
import { isNotableResult } from '@/game/notableResult'
import type { Currencies } from '@/game/types'

describe('isNotableResult', () => {
  it('returns false when nothing changed', () => {
    const c: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(c, c)).toBe(false)
  })

  it('returns false when gain is ≤20% of previous balance', () => {
    const prev: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 120, copper: 0, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(prev, next)).toBe(false)
  })

  it('returns true when gain is >20% of previous balance', () => {
    const prev: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 121, copper: 0, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns true when any crown is gained', () => {
    const prev: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 1 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns true when previous balance is 0 and any gain occurs', () => {
    const prev: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 100, copper: 1, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns false for a loss (currency decreases)', () => {
    const prev: Currencies = { food: 100, copper: 50, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 99, copper: 50, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(prev, next)).toBe(false)
  })

  it('returns false when gain is exactly 20%', () => {
    const prev: Currencies = { food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }
    const next: Currencies = { food: 120, copper: 0, silver: 0, gold: 0, crowns: 0 }
    expect(isNotableResult(prev, next)).toBe(false)
  })
})
