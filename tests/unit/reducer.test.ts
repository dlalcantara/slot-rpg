import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer } from '@/game/reducer'
import { makeInitialState } from '@/game/initialState'
import type { GameState } from '@/game/types'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const mockComputeSpin = vi.fn(() => ({
  columns: [
    [{ id: 'c1', definitionId: 'apple' }],
    [{ id: 'c2', definitionId: 'apple' }],
    [{ id: 'c3', definitionId: 'apple' }],
    [{ id: 'c4', definitionId: 'apple' }],
    [{ id: 'c5', definitionId: 'apple' }],
  ],
  payouts: [{ family: 'apple', amount: 1, currency: 'food' }],
}))

vi.mock('@/game/spinLogic', () => ({
  get computeSpin() {
    return mockComputeSpin
  },
  calculatePayouts: vi.fn(),
}))

function stateWithCurrencies(overrides: Record<string, number>): GameState {
  return {
    ...makeInitialState(),
    currencies: { ...makeInitialState().currencies, ...overrides } as Record<string, number>,
  }
}

describe('SPIN action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('decrements food by 1', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN' })
    // food starts 10, payout adds 1, net = 10
    expect(next.currencies.food).toBe(10)
  })

  it('applies payout to correct currency', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'copper' }]),
      payouts: [{ family: 'copper', amount: 5, currency: 'copper' }],
    })
    const state = stateWithCurrencies({ food: 10, copper: 0 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.currencies.copper).toBe(5)
  })

  it('sets phase to gameover when food reaches 0', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
      payouts: [],
    })
    const state = stateWithCurrencies({ food: 1 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.phase).toBe('gameover')
  })

  it('sets lastSpinResult after spin', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.lastSpinResult).not.toBeNull()
  })

  it('phase stays market when food > 0 and crowns < 100', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
      payouts: [],
    })
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.phase).toBe('market')
  })
})

describe('BUY_ICON action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deducts cost directly when player has sufficient funds', () => {
    const state = stateWithCurrencies({ copper: 5 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.currencies.copper).toBe(4)
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })

  it('performs downward conversion when direct funds insufficient', () => {
    const state = stateWithCurrencies({ copper: 0, silver: 1 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.currencies.copper).toBe(99)
    expect(next.currencies.silver).toBe(0)
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })

  it('rejects purchase when all tiers insufficient', () => {
    const state = makeInitialState() // 0 copper, 0 silver, 0 gold
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length)
    expect(next.currencies).toEqual(state.currencies)
  })

  it('increases reel length by exactly 1 on success', () => {
    const state = stateWithCurrencies({ copper: 1 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })
})

describe('WIN condition', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets phase to win when crowns reach 100 after spin', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'crown' }]),
      payouts: [{ family: 'crown', amount: 100, currency: 'crowns' }],
    })
    const state = stateWithCurrencies({ food: 10, crowns: 0 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.phase).toBe('win')
  })

  it('CONTINUE_AFTER_WIN transitions phase to market', () => {
    const state = { ...makeInitialState(), phase: 'win' as const }
    const next = gameReducer(state, { type: 'CONTINUE_AFTER_WIN' })
    expect(next.phase).toBe('market')
    expect(next.currencies).toEqual(state.currencies)
  })
})

describe('HARD_RESET action', () => {
  it('returns exact initial state', () => {
    const state: GameState = {
      ...makeInitialState(),
      currencies: { food: 5, copper: 50, silver: 2, gold: 1, crowns: 90 },
      phase: 'gameover',
    }
    const next = gameReducer(state, { type: 'HARD_RESET' })
    expect(next.phase).toBe('market')
    expect(next.currencies.food).toBe(100)
    expect(next.currencies.copper).toBe(0)
    expect(next.reel.icons.length).toBe(5)
    expect(next.lastSpinResult).toBeNull()
  })
})

describe('Auto-conversion (US5)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('converts 99 copper + 1 copper earned to 0 copper + 1 silver', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'copper' }]),
      payouts: [{ family: 'copper', amount: 1, currency: 'copper' }],
    })
    const state = stateWithCurrencies({ food: 10, copper: 99 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.currencies.copper).toBe(0)
    expect(next.currencies.silver).toBe(1)
  })

  it('converts 99 silver + 1 silver earned to 0 silver + 1 gold', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'silver' }]),
      payouts: [{ family: 'silver', amount: 1, currency: 'silver' }],
    })
    const state = stateWithCurrencies({ food: 10, silver: 99 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.currencies.silver).toBe(0)
    expect(next.currencies.gold).toBe(1)
  })

  it('99 copper + 2 copper earned → 1 copper + 1 silver', () => {
    mockComputeSpin.mockReturnValueOnce({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'copper' }]),
      payouts: [{ family: 'copper', amount: 2, currency: 'copper' }],
    })
    const state = stateWithCurrencies({ food: 10, copper: 99 })
    const next = gameReducer(state, { type: 'SPIN' })
    expect(next.currencies.copper).toBe(1)
    expect(next.currencies.silver).toBe(1)
  })
})
