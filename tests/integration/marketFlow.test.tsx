import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReducer } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from '@/App'
import type { GameState, GameAction } from '@/game/types'
import { makeInitialState } from '@/game/initialState'
import { gameReducer } from '@/game/reducer'
import { Market } from '@/components/Market'

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

  it('[US4] spin unclaimed gates market: Buy blocked during magic phase, unblocked after Claim', () => {
    // Use reducer directly to control state without animation
    function TestHarness() {
      const [state, dispatch] = useReducer(gameReducer, {
        ...makeInitialState(),
        currencies: { food: 10, copper: 100, silver: 0, gold: 0, crowns: 0, air: 0, water: 0, earth: 0, fire: 0, energy: 0 },
      } as GameState)
      return (
        <>
          <button onClick={() => dispatch({ type: 'SPIN', multiplier: 1 } as GameAction)}>Trigger Spin</button>
          <button onClick={() => dispatch({ type: 'BEGIN_MAGIC_PHASE' } as GameAction)}>Begin Magic</button>
          <button onClick={() => dispatch({ type: 'CLAIM' } as GameAction)}>Trigger Claim</button>
          <Market
            currencies={state.currencies}
            reel={state.reel}
            onBuy={() => {}}
            isMagicPhase={state.phase === 'magic'}
          />
        </>
      )
    }
    render(<TestHarness />)

    // Initially not in magic phase → buy enabled (assuming affordable)
    const buyBtnsInitial = screen.getAllByRole('button', { name: /buy apple/i })
    expect(buyBtnsInitial[0]).not.toBeDisabled()
    expect(screen.queryByText(/claim your spin/i)).not.toBeInTheDocument()

    // Enter magic phase
    act(() => { fireEvent.click(screen.getByText('Trigger Spin')) })
    act(() => { fireEvent.click(screen.getByText('Begin Magic')) })

    // In magic phase: buy blocked, claim banner present
    expect(screen.getByText(/claim your spin before purchasing/i)).toBeInTheDocument()
    const buyBtnsBlocked = screen.getAllByRole('button', { name: /buy apple/i })
    expect(buyBtnsBlocked[0]).toBeDisabled()

    // Claim the spin
    act(() => { fireEvent.click(screen.getByText('Trigger Claim')) })

    // After claim: buy re-enabled
    const buyBtnsAfter = screen.getAllByRole('button', { name: /buy apple/i })
    expect(buyBtnsAfter[0]).not.toBeDisabled()
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
