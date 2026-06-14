import { describe, it, expect } from 'vitest'
import { ICON_CATALOG } from '@/game/catalog'
import { CURRENCY_REGISTRY } from '@/game/currencyRegistry'

describe('ICON_CATALOG emoji field', () => {
  it('every entry has a non-empty emoji field', () => {
    for (const [id, def] of Object.entries(ICON_CATALOG)) {
      expect(def.emoji, `${id} missing emoji`).toBeDefined()
      expect(def.emoji.length, `${id} emoji is empty`).toBeGreaterThan(0)
    }
  })
})

describe('elemental icon definitions', () => {
  it.each(['air', 'water', 'earth', 'fire'])('%s exists in catalog', (id) => {
    expect(ICON_CATALOG[id]).toBeDefined()
  })

  it('air costs 1 copper', () => {
    expect(ICON_CATALOG.air.cost).toEqual({ currency: 'copper', amount: 1 })
  })

  it('water costs 1 copper', () => {
    expect(ICON_CATALOG.water.cost).toEqual({ currency: 'copper', amount: 1 })
  })

  it('earth costs 1 silver', () => {
    expect(ICON_CATALOG.earth.cost).toEqual({ currency: 'silver', amount: 1 })
  })

  it('fire costs 1 gold', () => {
    expect(ICON_CATALOG.fire.cost).toEqual({ currency: 'gold', amount: 1 })
  })

  it.each(['air', 'water', 'earth', 'fire'])('%s effect awards matching currency', (id) => {
    const def = ICON_CATALOG[id]
    expect(def.effect.type).toBe('add_currency')
    if (def.effect.type === 'add_currency') {
      expect(def.effect.currency).toBe(id)
    }
  })
})

describe('elemental currency definitions', () => {
  it.each(['air', 'water', 'earth', 'fire'])('%s exists in registry', (key) => {
    expect(CURRENCY_REGISTRY[key]).toBeDefined()
  })

  it('air starts at 10', () => {
    expect(CURRENCY_REGISTRY.air.startingAmount).toBe(10)
  })

  it('water starts at 10', () => {
    expect(CURRENCY_REGISTRY.water.startingAmount).toBe(10)
  })

  it.each(['earth', 'fire'])('%s starts at 0', (key) => {
    expect(CURRENCY_REGISTRY[key].startingAmount).toBe(0)
  })

  it.each(['air', 'water', 'earth', 'fire'])('%s has no auto-convert', (key) => {
    expect(CURRENCY_REGISTRY[key].autoConvertTo).toBeNull()
  })

  it.each(['air', 'water', 'earth', 'fire'])('%s has no win/loss conditions', (key) => {
    expect(CURRENCY_REGISTRY[key].winCondition).toBeNull()
    expect(CURRENCY_REGISTRY[key].lossCondition).toBeNull()
  })
})
