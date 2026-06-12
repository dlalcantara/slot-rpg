import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer } from '@/game/reducer'
import { makeInitialState } from '@/game/initialState'
import type { GameState, MagicCell } from '@/game/types'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const mockDrawColumn = vi.fn(() => [
  { id: 'c1', definitionId: 'apple' },
  { id: 'c2', definitionId: 'apple' },
  { id: 'c3', definitionId: 'apple' },
])

vi.mock('@/game/spinLogic', () => ({
  get drawColumn() { return mockDrawColumn },
  calculatePayouts: vi.fn(() => [{ family: 'apple', amount: 1, currency: 'food' }]),
}))

function stateWithCurrencies(overrides: Record<string, number>): GameState {
  return {
    ...makeInitialState(),
    currencies: { ...makeInitialState().currencies, ...overrides } as Record<string, number>,
  }
}

function magicState(overrides: Partial<GameState> = {}): GameState {
  const base = stateWithCurrencies({ food: 10, air: 10, water: 10, earth: 10, fire: 10 })
  const grid: MagicCell[][] = Array(5).fill(null).map((_, ci) => [
    { icon: { id: `c${ci}r0`, definitionId: 'apple' }, valueOverride: null },
    { icon: { id: `c${ci}r1`, definitionId: 'apple' }, valueOverride: null },
    { icon: { id: `c${ci}r2`, definitionId: 'apple' }, valueOverride: null },
  ])
  return { ...base, phase: 'magic', magicGrid: grid, pendingMultiplier: 1, ...overrides }
}

// ─── SPIN (new behaviour) ─────────────────────────────────────────────────────

describe('SPIN action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('transitions phase to spinning', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.phase).toBe('spinning')
  })

  it('deducts food', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.currencies.food).toBe(9)
  })

  it('populates magicGrid with 5 columns', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.magicGrid).not.toBeNull()
    expect(next.magicGrid!.length).toBe(5)
  })

  it('does NOT compute payouts yet (no lastSpinResult update)', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.lastSpinResult).toBeNull()
  })

  it('blocks spin when food < multiplier', () => {
    const state = stateWithCurrencies({ food: 9 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 10 })
    expect(next.currencies.food).toBe(9)
    expect(next.spinCount).toBe(state.spinCount)
  })

  it('stores pendingMultiplier', () => {
    const state = stateWithCurrencies({ food: 100 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 10 })
    expect(next.pendingMultiplier).toBe(10)
  })

  it('preserves locked columns from previous lastSpinResult', () => {
    const fireCol = [
      { id: 'locked0', definitionId: 'fire' },
      { id: 'locked1', definitionId: 'fire' },
      { id: 'locked2', definitionId: 'fire' },
    ]
    const lastSpinResult = {
      columns: Array(5).fill(null).map((_, i) =>
        i === 2 ? fireCol : [
          { id: `c${i}r0`, definitionId: 'blank' },
          { id: `c${i}r1`, definitionId: 'blank' },
          { id: `c${i}r2`, definitionId: 'blank' },
        ]
      ),
      payouts: [],
    }
    const state: GameState = {
      ...stateWithCurrencies({ food: 10 }),
      phase: 'market',
      lastSpinResult,
      lockedColumns: [2],
    }
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.magicGrid![2][0].icon.definitionId).toBe('fire')
  })

  it('preserves lockedColumns during spinning phase (not cleared by SPIN)', () => {
    const state: GameState = { ...stateWithCurrencies({ food: 10 }), lockedColumns: [1, 3] }
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.lockedColumns).toEqual([1, 3])
  })
})

// ─── BEGIN_MAGIC_PHASE ────────────────────────────────────────────────────────

describe('BEGIN_MAGIC_PHASE action', () => {
  it('transitions phase to magic', () => {
    const state: GameState = { ...stateWithCurrencies({ food: 10 }), phase: 'spinning' }
    const next = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(next.phase).toBe('magic')
  })

  it('resets magicCounters to zero', () => {
    const state: GameState = {
      ...stateWithCurrencies({ food: 10 }),
      phase: 'spinning',
      magicCounters: { respin: 3, swap: 2, increaseValue: 1 },
    }
    const next = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(next.magicCounters).toEqual({ respin: 0, swap: 0, increaseValue: 0 })
  })

  it('clears lockedColumns', () => {
    const state: GameState = {
      ...stateWithCurrencies({ food: 10 }),
      phase: 'spinning',
      lockedColumns: [0, 2],
    }
    const next = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(next.lockedColumns).toEqual([])
  })

  it('is a no-op when not in spinning phase', () => {
    const state = magicState()
    const next = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(next).toBe(state)
  })
})

// ─── MAGIC_RESPIN ─────────────────────────────────────────────────────────────

describe('MAGIC_RESPIN action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deducts 1 Air on first respin', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, air: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    expect(next.currencies.air).toBe(4)
  })

  it('deducts escalating cost: 2nd respin costs 2 Air', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, air: 10 },
      magicCounters: { respin: 1, swap: 0, increaseValue: 0 },
    })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    expect(next.currencies.air).toBe(8) // 10 - 2
  })

  it('increments respin counter', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, air: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    expect(next.magicCounters.respin).toBe(1)
  })

  it('replaces the target column with fresh icons', () => {
    mockDrawColumn.mockReturnValueOnce([
      { id: 'new0', definitionId: 'fire' },
      { id: 'new1', definitionId: 'fire' },
      { id: 'new2', definitionId: 'fire' },
    ])
    const state = magicState({ currencies: { ...makeInitialState().currencies, air: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 2 })
    expect(next.magicGrid![2][0].icon.definitionId).toBe('fire')
  })

  it('is a no-op when Air insufficient', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, air: 0 } })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    expect(next).toBe(state)
  })
})

// ─── MAGIC_SWAP ───────────────────────────────────────────────────────────────

describe('MAGIC_SWAP action', () => {
  it('deducts 1 Water on first swap', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, water: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })
    expect(next.currencies.water).toBe(4)
  })

  it('swaps two adjacent cells', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, water: 5 } })
    const cellA = state.magicGrid![0][0].icon.definitionId
    const cellB = state.magicGrid![0][1].icon.definitionId
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })
    expect(next.magicGrid![0][0].icon.definitionId).toBe(cellB)
    expect(next.magicGrid![0][1].icon.definitionId).toBe(cellA)
  })

  it('increments swap counter', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, water: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })
    expect(next.magicCounters.swap).toBe(1)
  })

  it('is a no-op for non-adjacent cells', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, water: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 2, toRow: 2 })
    expect(next).toBe(state)
  })

  it('is a no-op when Water insufficient', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, water: 0 } })
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })
    expect(next).toBe(state)
  })
})

// ─── MAGIC_LOCK ───────────────────────────────────────────────────────────────

describe('MAGIC_LOCK action', () => {
  it('deducts 1 Earth for first lock', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 0 })
    expect(next.currencies.earth).toBe(4)
  })

  it('deducts 2 Earth for second lock', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 5 },
      lockedColumns: [1],
    })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 0 })
    expect(next.currencies.earth).toBe(3)
  })

  it('appends column index to lockedColumns', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 3 })
    expect(next.lockedColumns).toContain(3)
  })

  it('is a no-op when 3 columns already locked', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 10 },
      lockedColumns: [0, 1, 2],
    })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 3 })
    expect(next).toBe(state)
  })

  it('is a no-op when column already locked', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 5 },
      lockedColumns: [2],
    })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 2 })
    expect(next).toBe(state)
  })

  it('is a no-op when Earth insufficient', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 0 } })
    const next = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 0 })
    expect(next).toBe(state)
  })
})

// ─── MAGIC_INCREASE_VALUE ─────────────────────────────────────────────────────

describe('MAGIC_INCREASE_VALUE action', () => {
  it('deducts 1 Fire on first use', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, fire: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.currencies.fire).toBe(4)
  })

  it('adds 1 to value on first use (apple base=1 → 2)', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, fire: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicGrid![0][0].valueOverride).toBe(2) // 1 + 1
  })

  it('adds exactly 1 to value on second use (base=1 → 2, not 3)', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, fire: 5 },
      magicCounters: { respin: 0, swap: 0, increaseValue: 1 },
    })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicGrid![0][0].valueOverride).toBe(2) // 1 + 1 (not 1 + cost)
  })

  it('handles triple-apple (base=3): first use → 4', () => {
    const grid: MagicCell[][] = Array(5).fill(null).map((_, ci) => [
      { icon: { id: `c${ci}r0`, definitionId: 'triple-apple' }, valueOverride: null },
      { icon: { id: `c${ci}r1`, definitionId: 'triple-apple' }, valueOverride: null },
      { icon: { id: `c${ci}r2`, definitionId: 'triple-apple' }, valueOverride: null },
    ])
    const state = magicState({
      currencies: { ...makeInitialState().currencies, fire: 5 },
      magicGrid: grid,
    })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicGrid![0][0].valueOverride).toBe(4) // 3 + 1
  })

  it('handles dozen-apple (base=12): first use → 13', () => {
    const grid: MagicCell[][] = Array(5).fill(null).map((_, ci) => [
      { icon: { id: `c${ci}r0`, definitionId: 'dozen-apple' }, valueOverride: null },
      { icon: { id: `c${ci}r1`, definitionId: 'dozen-apple' }, valueOverride: null },
      { icon: { id: `c${ci}r2`, definitionId: 'dozen-apple' }, valueOverride: null },
    ])
    const state = magicState({
      currencies: { ...makeInitialState().currencies, fire: 5 },
      magicGrid: grid,
    })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicGrid![0][0].valueOverride).toBe(13) // 12 + 1
  })

  it('stacks on existing valueOverride by exactly +1 regardless of cost', () => {
    const grid: MagicCell[][] = Array(5).fill(null).map((_, ci) => [
      { icon: { id: `c${ci}r0`, definitionId: 'apple' }, valueOverride: 3 },
      { icon: { id: `c${ci}r1`, definitionId: 'apple' }, valueOverride: null },
      { icon: { id: `c${ci}r2`, definitionId: 'apple' }, valueOverride: null },
    ])
    const state = magicState({
      currencies: { ...makeInitialState().currencies, fire: 5 },
      magicGrid: grid,
      magicCounters: { respin: 0, swap: 0, increaseValue: 2 }, // next cost = 3 but increment is always +1
    })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicGrid![0][0].valueOverride).toBe(4) // 3 + 1 (not 3 + cost)
  })

  it('is a no-op when Fire insufficient', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, fire: 0 } })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next).toBe(state)
  })

  it('increments increaseValue counter', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, fire: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 0, rowIdx: 0 })
    expect(next.magicCounters.increaseValue).toBe(1)
  })
})

// ─── CLAIM ────────────────────────────────────────────────────────────────────

describe('CLAIM action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('transitions phase to market', () => {
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.phase).toBe('market')
  })

  it('clears magicGrid', () => {
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.magicGrid).toBeNull()
  })

  it('sets lastSpinResult from magicGrid', () => {
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.lastSpinResult).not.toBeNull()
    expect(next.lastSpinResult!.columns.length).toBe(5)
  })

  it('awards payouts to currencies', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'food', amount: 5, currency: 'food' }])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 10 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.currencies.food).toBe(15)
  })

  it('sets masterOfElements when condition met', () => {
    const grid: MagicCell[][] = [
      [
        { icon: { id: 'c0r0', definitionId: 'fire' }, valueOverride: null },
        { icon: { id: 'c0r1', definitionId: 'fire' }, valueOverride: null },
        { icon: { id: 'c0r2', definitionId: 'fire' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c1r0', definitionId: 'air' }, valueOverride: null },
        { icon: { id: 'c1r1', definitionId: 'air' }, valueOverride: null },
        { icon: { id: 'c1r2', definitionId: 'air' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c2r0', definitionId: 'water' }, valueOverride: null },
        { icon: { id: 'c2r1', definitionId: 'water' }, valueOverride: null },
        { icon: { id: 'c2r2', definitionId: 'water' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c3r0', definitionId: 'earth' }, valueOverride: null },
        { icon: { id: 'c3r1', definitionId: 'earth' }, valueOverride: null },
        { icon: { id: 'c3r2', definitionId: 'earth' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c4r0', definitionId: 'air' }, valueOverride: null },
        { icon: { id: 'c4r1', definitionId: 'water' }, valueOverride: null },
        { icon: { id: 'c4r2', definitionId: 'earth' }, valueOverride: null },
      ],
    ]
    const state = magicState({ magicGrid: grid })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.masterOfElements).toBe(true)
  })

  it('masterOfElements stays true once set', () => {
    const state = magicState({ masterOfElements: true })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.masterOfElements).toBe(true)
  })

  it('appends to gameLog', () => {
    const state = magicState()
    expect(state.gameLog).toHaveLength(0)
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.gameLog).toHaveLength(1)
  })

  it('is a no-op when not in magic phase', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next).toBe(state)
  })
})

// ─── BUY_ICON ─────────────────────────────────────────────────────────────────

describe('BUY_ICON action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deducts cost and adds icon to reel', () => {
    const state = stateWithCurrencies({ copper: 5 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.currencies.copper).toBe(4)
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })

  it('rejects purchase when all tiers insufficient', () => {
    const state = makeInitialState()
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length)
  })

  it('purchases elemental icon with correct cost (air costs 1 copper)', () => {
    const state = stateWithCurrencies({ copper: 1 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'air' })
    expect(next.currencies.copper).toBe(0)
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
    expect(next.reel.icons[next.reel.icons.length - 1].definitionId).toBe('air')
  })

  it('purchases fire with 1 gold', () => {
    const state = stateWithCurrencies({ gold: 1 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'fire' })
    expect(next.currencies.gold).toBe(0)
    expect(next.reel.icons[next.reel.icons.length - 1].definitionId).toBe('fire')
  })
})

// ─── WIN / GAMEOVER / RESET ───────────────────────────────────────────────────

describe('WIN condition', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets phase to win at CLAIM when crowns reach 100', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'crown', amount: 100, currency: 'crowns' }])
    const state = magicState({ currencies: { ...makeInitialState().currencies, crowns: 0 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.phase).toBe('win')
  })

  it('CONTINUE_AFTER_WIN transitions phase to market', () => {
    const state: GameState = { ...makeInitialState(), phase: 'win' }
    const next = gameReducer(state, { type: 'CONTINUE_AFTER_WIN' })
    expect(next.phase).toBe('market')
  })
})

describe('HARD_RESET action', () => {
  it('returns exact initial state', () => {
    const state: GameState = {
      ...makeInitialState(),
      currencies: { food: 5, copper: 50, silver: 2, gold: 1, crowns: 90, air: 3, water: 3, earth: 3, fire: 3 },
      phase: 'gameover',
    }
    const next = gameReducer(state, { type: 'HARD_RESET' })
    expect(next.phase).toBe('market')
    expect(next.currencies.food).toBe(100)
    expect(next.reel.icons.length).toBe(4)
    expect(next.lastSpinResult).toBeNull()
    expect(next.magicGrid).toBeNull()
    expect(next.lockedColumns).toEqual([])
    expect(next.masterOfElements).toBe(false)
  })
})

describe('UPDATE_SETTINGS action', () => {
  it('merges patch into settings', () => {
    const state = makeInitialState()
    const next = gameReducer(state, { type: 'UPDATE_SETTINGS', patch: { autoConvert: false } })
    expect(next.settings.autoConvert).toBe(false)
    expect(next.settings.animate).toBe(true)
  })
})

// ─── tryBuyIcon multi-level currency conversion (US5) ─────────────────────────

describe('BUY_ICON multi-level currency conversion (US5)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('succeeds with 0 copper but sufficient silver (one-level conversion)', () => {
    const state = stateWithCurrencies({ copper: 0, silver: 1, gold: 0 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
    expect(next.currencies.silver).toBe(0)
    expect(next.currencies.copper).toBeGreaterThanOrEqual(99)
  })

  it('succeeds with 0 copper, 0 silver, but sufficient gold (two-level chain)', () => {
    const state = stateWithCurrencies({ copper: 0, silver: 0, gold: 1 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })

  it('fails when 0 copper, 0 silver, 0 gold', () => {
    const state = stateWithCurrencies({ copper: 0, silver: 0, gold: 0 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length)
    expect(next).toBe(state)
  })

  it('succeeds with 0 silver but sufficient gold for a silver-cost item (triple-apple costs 1 silver)', () => {
    const state = stateWithCurrencies({ copper: 0, silver: 0, gold: 1 })
    // triple-apple costs 1 silver; 1 gold = 100 silver, so we can afford it
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'triple-apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
  })
})

// ─── TOGGLE_ICON (US1) ────────────────────────────────────────────────────────

describe('TOGGLE_ICON action', () => {
  function stateWith13Icons(): GameState {
    const base = makeInitialState()
    const extraIcons = Array.from({ length: 9 }, (_, i) => ({
      id: `extra-${i}`,
      definitionId: 'apple',
    }))
    return {
      ...base,
      phase: 'market',
      reel: { icons: [...base.reel.icons, ...extraIcons] },
    }
  }

  it('disables an icon by adding its id to disabledIconIds', () => {
    const state = stateWith13Icons()
    const iconId = state.reel.icons[0].id
    const next = gameReducer(state, { type: 'TOGGLE_ICON', iconId })
    expect(next.disabledIconIds).toContain(iconId)
  })

  it('re-enables a disabled icon by removing its id from disabledIconIds', () => {
    const state = stateWith13Icons()
    const iconId = state.reel.icons[0].id
    const disabled = gameReducer(state, { type: 'TOGGLE_ICON', iconId })
    const reenabled = gameReducer(disabled, { type: 'TOGGLE_ICON', iconId })
    expect(reenabled.disabledIconIds).not.toContain(iconId)
  })

  it('enforces 12-icon floor: cannot disable when exactly 12 enabled', () => {
    const state = stateWith13Icons() // 13 icons, 0 disabled → 13 enabled
    const iconId = state.reel.icons[0].id
    const after12 = gameReducer(state, { type: 'TOGGLE_ICON', iconId }) // now 12 enabled
    expect(after12.disabledIconIds).toHaveLength(1)
    const iconId2 = state.reel.icons[1].id
    const blocked = gameReducer(after12, { type: 'TOGGLE_ICON', iconId: iconId2 })
    expect(blocked.disabledIconIds).toHaveLength(1) // still 1, not 2
    expect(blocked).toBe(after12)
  })

  it('is a no-op when not in market phase', () => {
    const state: GameState = { ...stateWith13Icons(), phase: 'magic' }
    const iconId = state.reel.icons[0].id
    const next = gameReducer(state, { type: 'TOGGLE_ICON', iconId })
    expect(next).toBe(state)
  })

  it('does nothing when reel has fewer than 13 icons (all 4 initial icons cannot be disabled)', () => {
    const state = makeInitialState() // 4 icons
    const iconId = state.reel.icons[0].id
    const next = gameReducer(state, { type: 'TOGGLE_ICON', iconId })
    expect(next).toBe(state)
  })
})

// ─── SET_CURRENCY (cheat) ─────────────────────────────────────────────────────

describe('SET_CURRENCY action', () => {
  it('sets a currency to the given value', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: 500 })
    expect(next.currencies.food).toBe(500)
  })

  it('allows setting a currency to 0', () => {
    const state = stateWithCurrencies({ air: 5 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'air', amount: 0 })
    expect(next.currencies.air).toBe(0)
  })

  it('ignores negative amount — state unchanged', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: -5 })
    expect(next).toBe(state)
  })

  it('ignores NaN amount — state unchanged', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: NaN })
    expect(next).toBe(state)
  })

  it('ignores Infinity — state unchanged', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: Infinity })
    expect(next).toBe(state)
  })

  it('floors non-integer amount', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: 12.9 })
    expect(next.currencies.food).toBe(12)
  })

  it('ignores unknown currency — state unchanged', () => {
    const state = stateWithCurrencies({ food: 10 })
    // @ts-expect-error testing unknown key
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'notACurrency', amount: 5 })
    expect(next).toBe(state)
  })

  it('does not change phase or other currencies', () => {
    const state = stateWithCurrencies({ food: 10, air: 3 })
    const next = gameReducer(state, { type: 'SET_CURRENCY', currency: 'food', amount: 200 })
    expect(next.phase).toBe(state.phase)
    expect(next.currencies.air).toBe(state.currencies.air)
  })
})
