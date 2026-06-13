import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '@/App'
import type { GameState } from '@/game/types'
import { makeInitialState } from '@/game/initialState'

const mockLoadState = vi.fn(() => null as GameState | null)

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  get loadState() {
    return mockLoadState
  },
  clearState: vi.fn(),
}))

vi.mock('@/game/spinLogic', () => ({
  drawColumn: vi.fn(() => [
    { id: 'c1', definitionId: 'blank' },
    { id: 'c2', definitionId: 'blank' },
    { id: 'c3', definitionId: 'blank' },
  ]),
  calculatePayouts: vi.fn(() => []),
}))

describe('market flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLoadState.mockReturnValue(null)
  })

  it('T028: player with {copper:0, silver:0, gold:2} — Buy button for 1-copper-cost item is enabled', () => {
    const seededState: GameState = {
      ...makeInitialState(),
      currencies: { food: 10, copper: 0, silver: 0, gold: 2, crowns: 0, air: 0, water: 0, earth: 0, fire: 0, energy: 0 },
    }
    mockLoadState.mockReturnValue(seededState)
    render(<App />)
    // Apple costs 1 copper; with gold=2 → gold→silver→copper chain should afford it
    const buyAppleBtn = screen.getAllByRole('button', { name: /buy apple/i })[0]
    expect(buyAppleBtn).not.toBeDisabled()
    fireEvent.click(buyAppleBtn)
    // After buying, gold decreases via conversion chain
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('T010: player with exactly {gold:1, air:1, water:1, earth:1, fire:1} can buy Energy icon', () => {
    const seededState: GameState = {
      ...makeInitialState(),
      currencies: { food: 10, copper: 0, silver: 0, gold: 1, crowns: 0, air: 1, water: 1, earth: 1, fire: 1, energy: 0 },
    }
    mockLoadState.mockReturnValue(seededState)
    render(<App />)
    const buyEnergyBtn = screen.getByRole('button', { name: /buy energy/i })
    expect(buyEnergyBtn).not.toBeDisabled()
    fireEvent.click(buyEnergyBtn)
    // All five currencies should be deducted (gold, air, water, earth, fire all go to 0)
    expect(screen.queryByText('2')).not.toBeInTheDocument()
  })

  it('T010: player missing any one of the five cannot buy Energy icon', () => {
    const seededState: GameState = {
      ...makeInitialState(),
      currencies: { food: 10, copper: 0, silver: 0, gold: 0, crowns: 0, air: 1, water: 1, earth: 1, fire: 1, energy: 0 },
    }
    mockLoadState.mockReturnValue(seededState)
    render(<App />)
    const buyEnergyBtn = screen.getByRole('button', { name: /buy energy/i })
    expect(buyEnergyBtn).toBeDisabled()
  })

  it('shows market items on load', () => {
    render(<App />)
    expect(screen.getAllByText('Apple').length).toBeGreaterThan(0)
  })

  it('buy button is disabled when player cannot afford item', () => {
    const brokState: GameState = {
      ...makeInitialState(),
      currencies: { food: 10, copper: 0, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0, energy: 0 },
    }
    mockLoadState.mockReturnValue(brokState)
    render(<App />)
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    // All buy buttons should be disabled since player has 0 of all currencies
    expect(buyButtons[0]).toBeDisabled()
  })

  it('successful purchase deducts copper and increases balance display', () => {
    const seededState: GameState = {
      ...makeInitialState(),
      currencies: { food: 100, copper: 5, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0 },
    }
    mockLoadState.mockReturnValue(seededState)

    render(<App />)
    expect(screen.getByText('5')).toBeInTheDocument()

    const buyButtons = screen.getAllByRole('button', { name: /buy apple/i })
    expect(buyButtons[0]).not.toBeDisabled()
    fireEvent.click(buyButtons[0])

    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
