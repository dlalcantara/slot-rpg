import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Market } from '@/components/Market'

const emptyCurrencies = {
  food: 0, copper: 0, silver: 0, gold: 0, crowns: 0,
  air: 0, water: 0, earth: 0, fire: 0,
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
