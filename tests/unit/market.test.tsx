import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Market } from '@/components/Market'
import { ReelView } from '@/components/ReelView'

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

// ─── T008: US3 — Purchase flash feedback ─────────────────────────────────────

describe('Market purchase flash (US3 v1.1)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  // Use an empty reel so no items are at cap (ownedCount*2 < 0 is false for all → use blank slots)
  const richReel = {
    icons: Array.from({ length: 6 }, (_, i) => ({ id: `slot${i}`, definitionId: 'blank' })),
  }
  const richCurrencies = { food: 0, copper: 100, silver: 100, gold: 100, crowns: 0, air: 0, water: 0, earth: 0, fire: 0, energy: 0 }

  it('after clicking Buy, a ✓ indicator appears on that item row', () => {
    render(<Market currencies={richCurrencies} reel={richReel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    fireEvent.click(appleBtn)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('after 1600ms the ✓ indicator is gone', () => {
    render(<Market currencies={richCurrencies} reel={richReel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    fireEvent.click(appleBtn)
    act(() => { vi.advanceTimersByTime(1600) })
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })

  it('buying apple does not show ✓ on copper row', () => {
    render(<Market currencies={richCurrencies} reel={richReel} onBuy={() => {}} />)
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    fireEvent.click(appleBtn)
    // Only one ✓ total, not one per row
    expect(screen.getAllByText('✓')).toHaveLength(1)
  })
})

// ─── T011: US4 — Unclaimed spin gating (Market) ──────────────────────────────

describe('Market unclaimed spin gating (US4 v1.1)', () => {
  const reel = { icons: Array.from({ length: 6 }, (_, i) => ({ id: `slot${i}`, definitionId: 'blank' })) }
  const richCurrencies = { food: 0, copper: 100, silver: 100, gold: 100, crowns: 0, air: 0, water: 0, earth: 0, fire: 0, energy: 0 }

  it('when isMagicPhase=true, all Buy buttons are disabled', () => {
    render(<Market currencies={richCurrencies} reel={reel} onBuy={() => {}} isMagicPhase={true} />)
    const buttons = screen.getAllByRole('button', { name: /buy/i })
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('when isMagicPhase=true, a "Claim" banner is rendered', () => {
    render(<Market currencies={richCurrencies} reel={reel} onBuy={() => {}} isMagicPhase={true} />)
    expect(screen.getByText(/claim/i)).toBeInTheDocument()
  })

  it('when isMagicPhase=false, Buy buttons follow normal logic and no "Claim" banner', () => {
    render(<Market currencies={richCurrencies} reel={reel} onBuy={() => {}} isMagicPhase={false} />)
    expect(screen.queryByText(/claim/i)).not.toBeInTheDocument()
    const appleBtn = screen.getByRole('button', { name: /buy apple/i })
    expect(appleBtn).not.toBeDisabled()
  })
})

// ─── T012: US4 — Unclaimed spin gating (ReelView) ────────────────────────────

describe('ReelView unclaimed spin gating (US4 v1.1)', () => {
  // Reel with 4 icon types each having 3 copies → prestige available
  const prestigeReel = {
    icons: [
      { id: 'a1', definitionId: 'apple' }, { id: 'a2', definitionId: 'apple' }, { id: 'a3', definitionId: 'apple' },
      { id: 'c1', definitionId: 'copper' }, { id: 'c2', definitionId: 'copper' }, { id: 'c3', definitionId: 'copper' },
      { id: 's1', definitionId: 'silver' }, { id: 's2', definitionId: 'silver' }, { id: 's3', definitionId: 'silver' },
      { id: 'g1', definitionId: 'gold' }, { id: 'g2', definitionId: 'gold' }, { id: 'g3', definitionId: 'gold' },
    ],
  }

  it('when isMagicPhase=true, Prestige button is disabled', () => {
    render(<ReelView reel={prestigeReel} onPrestige={() => {}} isMagicPhase={true} />)
    const prestigeBtn = screen.getByRole('button', { name: /open prestige selection/i })
    expect(prestigeBtn).toBeDisabled()
  })

  it('when isMagicPhase=true, a "Claim" banner is rendered', () => {
    render(<ReelView reel={prestigeReel} onPrestige={() => {}} isMagicPhase={true} />)
    expect(screen.getByText(/claim/i)).toBeInTheDocument()
  })

  it('when isMagicPhase=false, prestige availability follows normal logic', () => {
    render(<ReelView reel={prestigeReel} onPrestige={() => {}} isMagicPhase={false} />)
    expect(screen.queryByText(/claim/i)).not.toBeInTheDocument()
    const prestigeBtn = screen.getByRole('button', { name: /open prestige selection/i })
    expect(prestigeBtn).not.toBeDisabled()
  })
})
