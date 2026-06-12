import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '@/App'
import { makeInitialState, PRESTIGE_STARTING_CURRENCIES } from '@/game/initialState'
import { gameReducer } from '@/game/reducer'
import type { GameState } from '@/game/types'

const mockLoadState = vi.fn(() => null as GameState | null)

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  get loadState() { return mockLoadState },
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

function makePrestigeReadyState(): GameState {
  const base = makeInitialState()
  const icons = [
    { id: 'a1', definitionId: 'apple' },
    { id: 'a2', definitionId: 'apple' },
    { id: 'a3', definitionId: 'apple' },
    { id: 'c1', definitionId: 'copper' },
    { id: 'c2', definitionId: 'copper' },
    { id: 'c3', definitionId: 'copper' },
    { id: 'air1', definitionId: 'air' },
    { id: 'air2', definitionId: 'air' },
    { id: 'air3', definitionId: 'air' },
    { id: 'water1', definitionId: 'water' },
    { id: 'water2', definitionId: 'water' },
    { id: 'water3', definitionId: 'water' },
  ]
  return {
    ...base,
    reel: { icons },
    currencies: { food: 10, copper: 50, silver: 20, gold: 5, crowns: 0, air: 10, water: 10, earth: 0, fire: 0 },
    spinCount: 42,
  }
}

describe('prestige flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockLoadState.mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prestige button is available when 4 icon types have 3 copies', () => {
    mockLoadState.mockReturnValue(makePrestigeReadyState())
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Reel' }))
    const prestigeBtn = screen.getByRole('button', { name: /prestige/i })
    expect(prestigeBtn).toBeInTheDocument()
    expect(prestigeBtn).not.toBeDisabled()
  })

  it('prestige button is disabled when fewer than 4 icon types have 3 copies', () => {
    mockLoadState.mockReturnValue(makeInitialState())
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Reel' }))
    const btn = screen.getByRole('button', { name: /prestige/i })
    expect(btn).toBeDisabled()
  })

  it('PRESTIGE reducer: valid selection resets reel to selected icons and preserves spinCount', () => {
    const state = makePrestigeReadyState()
    const nextState = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(nextState.reel.icons).toHaveLength(4)
    const defIds = nextState.reel.icons.map((i) => i.definitionId).sort()
    expect(defIds).toEqual(['air', 'apple', 'copper', 'water'])
    expect(nextState.spinCount).toBe(42)
    expect(nextState.currencies.food).toBe(PRESTIGE_STARTING_CURRENCIES.food)
    expect(nextState.currencies.copper).toBe(0)
    expect(nextState.currencies.silver).toBe(0)
  })

  it('PRESTIGE reducer: fewer than 4 icons selected → state unchanged', () => {
    const state = makePrestigeReadyState()
    const nextState = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air'],
    })
    expect(nextState).toBe(state)
  })

  it('PRESTIGE reducer: selected icon without 3 copies → state unchanged', () => {
    const state = makePrestigeReadyState()
    const nextState = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'blank'],
    })
    expect(nextState).toBe(state)
  })
})
