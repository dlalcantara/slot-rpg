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
  computeSpin: vi.fn(() => ({
    columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
    payouts: [],
  })),
  calculatePayouts: vi.fn(),
}))

describe('market flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLoadState.mockReturnValue(null)
  })

  it('shows market items on load', () => {
    render(<App />)
    expect(screen.getAllByText('Apple').length).toBeGreaterThan(0)
  })

  it('buy button is disabled when player cannot afford item', () => {
    render(<App />)
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    // All buy buttons should be disabled since player starts with 0 of all money
    expect(buyButtons[0]).toBeDisabled()
  })

  it('successful purchase deducts copper and increases balance display', () => {
    const seededState: GameState = {
      ...makeInitialState(),
      currencies: { food: 100, copper: 5, silver: 0, gold: 0, crowns: 0 },
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
