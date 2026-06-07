import { describe, it, expect } from 'vitest'
import { isNotableResult } from '@/game/notableResult'
import type { Currencies } from '@/game/types'

const base: Currencies = { food: 0, copper: 0, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0 }

describe('isNotableResult — unchanged behaviour', () => {
  it('returns false when nothing changed', () => {
    const c = { ...base, food: 100 }
    expect(isNotableResult(c, c)).toBe(false)
  })

  it('returns false when gain is exactly 20%', () => {
    const prev = { ...base, food: 100 }
    const next = { ...base, food: 120 }
    expect(isNotableResult(prev, next)).toBe(false)
  })

  it('returns true when gain is >20%', () => {
    const prev = { ...base, food: 100 }
    const next = { ...base, food: 121 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns true when previous balance is 0 and gain occurs (food)', () => {
    const prev = { ...base }
    const next = { ...base, food: 1 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns false for a loss', () => {
    const prev = { ...base, food: 100 }
    const next = { ...base, food: 99 }
    expect(isNotableResult(prev, next)).toBe(false)
  })
})

describe('isNotableResult — combined money (Gold/Silver/Copper)', () => {
  it('does NOT trigger when 99 copper earned on 1 gold (combined=10000)', () => {
    const prev = { ...base, gold: 1 }                          // combined = 10000
    const next = { ...base, gold: 1, copper: 99 }              // gain = 99
    expect(isNotableResult(prev, next)).toBe(false)             // 99/10000 = 0.99%
  })

  it('DOES trigger when 21 copper earned on 100 copper (combined=100)', () => {
    const prev = { ...base, copper: 100 }                      // combined = 100
    const next = { ...base, copper: 121 }                      // gain = 21
    expect(isNotableResult(prev, next)).toBe(true)              // 21/100 = 21%
  })

  it('DOES trigger when combined money starts at 0', () => {
    const prev = { ...base }
    const next = { ...base, copper: 1 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('does NOT trigger when 200 copper earned on 1000 combined money (= 20%)', () => {
    const prev = { ...base, copper: 1000 }                     // combined = 1000
    const next = { ...base, copper: 1200 }                     // gain = 200
    expect(isNotableResult(prev, next)).toBe(false)             // 200/1000 = 20%, not >20%
  })

  it('DOES trigger when 201 copper earned on 1000 combined money', () => {
    const prev = { ...base, copper: 1000 }
    const next = { ...base, copper: 1201 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('considers silver in combined money: 1 silver = 100 combined', () => {
    const prev = { ...base, silver: 1 }                        // combined = 100
    const next = { ...base, silver: 1, copper: 21 }            // gain = 21
    expect(isNotableResult(prev, next)).toBe(true)
  })
})

describe('isNotableResult — elemental currencies', () => {
  it('returns true when 3 Air gained on 10 Air (30%)', () => {
    const prev = { ...base, air: 10 }
    const next = { ...base, air: 13 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns false when 1 Air gained on 10 Air (10%)', () => {
    const prev = { ...base, air: 10 }
    const next = { ...base, air: 11 }
    expect(isNotableResult(prev, next)).toBe(false)
  })

  it('returns true when any elemental currency gained from 0', () => {
    for (const key of ['air', 'water', 'earth', 'fire']) {
      const prev = { ...base }
      const next = { ...base, [key]: 1 }
      expect(isNotableResult(prev, next)).toBe(true)
    }
  })
})

describe('isNotableResult — crowns treated as regular per-key currency', () => {
  it('returns true when any crown gained from 0', () => {
    const prev = { ...base }
    const next = { ...base, crowns: 1 }
    expect(isNotableResult(prev, next)).toBe(true)
  })

  it('returns false when 10 crowns gained on 100 crowns (10%)', () => {
    const prev = { ...base, crowns: 100 }
    const next = { ...base, crowns: 110 }
    expect(isNotableResult(prev, next)).toBe(false)
  })
})
