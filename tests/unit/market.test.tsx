import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Market } from '@/components/Market'

const emptyCurrencies = {
  food: 0, copper: 0, silver: 0, gold: 0, crowns: 0,
  air: 0, water: 0, earth: 0, fire: 0, energy: 0,
}

describe('Market ordering (US6)', () => {
  it('renders items in ascending normalized-price order (cheapest first)', () => {
    render(<Market currencies={emptyCurrencies} reel={{ icons: [] }} onBuy={() => {}} />)

    const items = screen.getAllByRole('listitem')
    const labels = items.map((el) => el.textContent ?? '')

    // Cheapest: 1 copper items (Apple, Copper, Air, Water) before 1 silver items (Silver, Earth, 3×Apple)
    // before 1 gold items (Gold, Fire, Crown, 12×Apple)
    // Find the first silver-cost item and verify all copper items come before it
    const copperItems = ['Apple', 'Copper', 'Air', 'Water']
    const firstSilverIdx = labels.findIndex((l) => l.includes('Silver') || l.includes('Earth') || l.includes('3× Apple'))
    if (firstSilverIdx >= 0) {
      // All copper items should appear before the first silver item
      for (const name of copperItems) {
        const idx = labels.findIndex((l) => l.includes(name))
        if (idx >= 0) {
          expect(idx).toBeLessThan(firstSilverIdx)
        }
      }
    }
  })

  it('cheapest item appears first in the list', () => {
    render(<Market currencies={emptyCurrencies} reel={{ icons: [] }} onBuy={() => {}} />)
    const items = screen.getAllByRole('listitem')
    // The very first item should be one of the 1-copper items
    const firstText = items[0].textContent ?? ''
    const copperItems = ['Apple', 'Copper', 'Air', 'Water']
    expect(copperItems.some((name) => firstText.includes(name))).toBe(true)
  })

  it('most expensive item appears last in the list', () => {
    render(<Market currencies={emptyCurrencies} reel={{ icons: [] }} onBuy={() => {}} />)
    const items = screen.getAllByRole('listitem')
    const lastText = items[items.length - 1].textContent ?? ''
    // Crown costs 100 gold — the most expensive item
    expect(lastText).toContain('Crown')
  })
})

// ─── T021: Market cap formula tests ──────────────────────────────────────────

describe('Market canBuyMore formula (T021)', () => {
  it('shows buy button disabled when ownedCount * 2 >= reel size (even-reel cap 3/6)', () => {
    // 6 total icons, 3 apples → 3*2=6 >= 6 → canBuyMore = false
    const reel = {
      icons: [
        { id: '1', definitionId: 'apple' },
        { id: '2', definitionId: 'apple' },
        { id: '3', definitionId: 'apple' },
        { id: '4', definitionId: 'copper' },
        { id: '5', definitionId: 'air' },
        { id: '6', definitionId: 'water' },
      ],
    }
    render(<Market currencies={emptyCurrencies} reel={reel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    expect(appleBtn).toBeDisabled()
  })

  it('buy button enabled when ownedCount * 2 < reel size (even-reel 2/6)', () => {
    // 6 total icons, 2 apples → 2*2=4 < 6 → canBuyMore = true
    const reel = {
      icons: [
        { id: '1', definitionId: 'apple' },
        { id: '2', definitionId: 'apple' },
        { id: '3', definitionId: 'copper' },
        { id: '4', definitionId: 'air' },
        { id: '5', definitionId: 'water' },
        { id: '6', definitionId: 'earth' },
      ],
    }
    const richCurrencies = { food: 0, copper: 100, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0 }
    render(<Market currencies={richCurrencies} reel={reel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    expect(appleBtn).not.toBeDisabled()
  })

  it('odd-reel: 3 apples out of 7 allowed (3*2=6 < 7)', () => {
    const reel = {
      icons: [
        { id: '1', definitionId: 'apple' },
        { id: '2', definitionId: 'apple' },
        { id: '3', definitionId: 'apple' },
        { id: '4', definitionId: 'copper' },
        { id: '5', definitionId: 'air' },
        { id: '6', definitionId: 'water' },
        { id: '7', definitionId: 'earth' },
      ],
    }
    const richCurrencies = { food: 0, copper: 100, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0 }
    render(<Market currencies={richCurrencies} reel={reel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    expect(appleBtn).not.toBeDisabled()
  })
})
