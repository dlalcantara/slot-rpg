import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer } from '@/game/reducer'
import { makeInitialState, PRESTIGE_STARTING_CURRENCIES } from '@/game/initialState'
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
    const state = stateWithCurrencies({ food: 0 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.currencies.food).toBe(0)
    expect(next.spinCount).toBe(state.spinCount)
  })

  it('stores pendingMultiplier', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.pendingMultiplier).toBe(1)
  })

  it('draws all 5 columns fresh (no locked column carry-over)', () => {
    const state = stateWithCurrencies({ food: 10 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(mockDrawColumn).toHaveBeenCalledTimes(5)
    expect(next.magicGrid!.length).toBe(5)
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

  it('resets blockedColumns to empty', () => {
    const state: GameState = {
      ...stateWithCurrencies({ food: 10 }),
      phase: 'spinning',
      blockedColumns: [0, 2],
    }
    const next = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(next.blockedColumns).toEqual([])
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

  it('cost scales with pendingMultiplier', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, air: 20 },
      pendingMultiplier: 1,
    })
    const next = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    expect(next.currencies.air).toBe(19) // 20 - (1 * 1)
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

  it('swap cost scales with pendingMultiplier', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, water: 20 },
      pendingMultiplier: 1,
    })
    const next = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })
    expect(next.currencies.water).toBe(19) // 20 - (1 * 1)
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

// ─── MAGIC_BLOCK_COLUMN ───────────────────────────────────────────────────────

describe('MAGIC_BLOCK_COLUMN action', () => {
  it('deducts 1 Earth for first block', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
    expect(next.currencies.earth).toBe(4)
  })

  it('deducts 2 Earth for second block', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 5 },
      blockedColumns: [1],
    })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
    expect(next.currencies.earth).toBe(3)
  })

  it('block cost scales with pendingMultiplier', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 20 },
      pendingMultiplier: 1,
    })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
    expect(next.currencies.earth).toBe(19) // 20 - (1 * 1)
  })

  it('second block cost is 2x pendingMultiplier', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 30 },
      blockedColumns: [1],
      pendingMultiplier: 1,
    })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
    expect(next.currencies.earth).toBe(28) // 30 - (2 * 1)
  })

  it('appends column index to blockedColumns', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 5 } })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 3 })
    expect(next.blockedColumns).toContain(3)
  })

  it('is a no-op when 4 columns already blocked', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 10 },
      blockedColumns: [0, 1, 2, 3],
    })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 4 })
    expect(next).toBe(state)
  })

  it('is a no-op when column already blocked', () => {
    const state = magicState({
      currencies: { ...makeInitialState().currencies, earth: 5 },
      blockedColumns: [2],
    })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 2 })
    expect(next).toBe(state)
  })

  it('is a no-op when Earth insufficient', () => {
    const state = magicState({ currencies: { ...makeInitialState().currencies, earth: 0 } })
    const next = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
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

  it('handles triple-apple (base=2): first use → 3', () => {
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
    expect(next.magicGrid![0][0].valueOverride).toBe(3) // 2 + 1
  })

  it('handles dozen-apple (base=3): first use → 4', () => {
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
    expect(next.magicGrid![0][0].valueOverride).toBe(4) // 3 + 1
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
      magicCounters: { respin: 0, swap: 0, increaseValue: 2 },
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

  it('resets blockedColumns to empty', () => {
    const state = magicState({ blockedColumns: [1, 3] })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.blockedColumns).toEqual([])
  })

  it('sets lastSpinResult from magicGrid (all 5 columns)', () => {
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.lastSpinResult).not.toBeNull()
    expect(next.lastSpinResult!.columns.length).toBe(5)
  })

  it('excludes blocked columns from payout calculation', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    const spy = vi.mocked(calculatePayouts)
    spy.mockReturnValueOnce([])

    // Block column 4 (index 4); active columns should be 0-3
    const state = magicState({ blockedColumns: [4] })
    gameReducer(state, { type: 'CLAIM' })

    // calculatePayouts should be called with only 4 columns
    expect(spy).toHaveBeenCalledOnce()
    const columnsArg = spy.mock.calls[0][0]
    expect(columnsArg).toHaveLength(4)
  })

  it('awards payouts to currencies', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'food', amount: 5, currency: 'food' }])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 10 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.currencies.food).toBe(15)
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

// ─── CLAIM with blocked columns (T006) ────────────────────────────────────────

describe('CLAIM with blocked columns', () => {
  beforeEach(() => vi.clearAllMocks())

  it('payout uses only active (non-blocked) columns; blockedColumns cleared after CLAIM', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    const spy = vi.mocked(calculatePayouts)
    spy.mockReturnValueOnce([{ family: 'apple', amount: 4, currency: 'food' }])

    const state = magicState({ blockedColumns: [0] })
    const next = gameReducer(state, { type: 'CLAIM' })

    // Called with 4 active columns
    expect(spy.mock.calls[0][0]).toHaveLength(4)
    // blockedColumns reset
    expect(next.blockedColumns).toEqual([])
    // lastSpinResult still has all 5 columns for display
    expect(next.lastSpinResult!.columns).toHaveLength(5)
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
    const state = stateWithCurrencies({ copper: 0, silver: 0, gold: 0 })
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

  it('3rd copy of an icon can be purchased', () => {
    const base = stateWithCurrencies({ copper: 5 })
    // Start with 2 (initial apple + 1 extra), buying 3rd should succeed
    const with1extra = {
      ...base,
      reel: {
        icons: [...base.reel.icons, { id: 'extra-apple-1', definitionId: 'apple' }],
      },
    }
    const next = gameReducer(with1extra, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.filter((i) => i.definitionId === 'apple').length).toBe(3)
  })

  it('4th copy of an icon is rejected (3-copy cap)', () => {
    const base = stateWithCurrencies({ copper: 10 })
    const with3apples = {
      ...base,
      reel: {
        icons: [
          ...base.reel.icons,
          { id: 'extra-apple-1', definitionId: 'apple' },
          { id: 'extra-apple-2', definitionId: 'apple' },
        ],
      },
    }
    // Now base.reel.icons already has 1 apple + 2 extras = 3 apples
    const next = gameReducer(with3apples, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next).toBe(with3apples)
    expect(next.reel.icons.filter((i) => i.definitionId === 'apple').length).toBe(3)
  })
})

// ─── WIN / GAMEOVER / RESET ───────────────────────────────────────────────────

describe('WIN condition', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT set phase to win when crowns reach 100 (win condition removed)', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'crown', amount: 100, currency: 'crowns' }])
    const state = magicState({ currencies: { ...makeInitialState().currencies, crowns: 0 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.phase).toBe('market')
  })

  it('CONTINUE_AFTER_WIN transitions phase to market', () => {
    const state: GameState = { ...makeInitialState(), phase: 'win' }
    const next = gameReducer(state, { type: 'CONTINUE_AFTER_WIN' })
    expect(next.phase).toBe('market')
  })
})

describe('HARD_RESET action', () => {
  it('returns fresh state with prestige starting currencies', () => {
    const state: GameState = {
      ...makeInitialState(),
      currencies: { food: 5, copper: 50, silver: 2, gold: 1, crowns: 90, air: 3, water: 3, earth: 3, fire: 3 },
      phase: 'gameover',
    }
    const next = gameReducer(state, { type: 'HARD_RESET' })
    expect(next.phase).toBe('market')
    expect(next.currencies.food).toBe(10)
    expect(next.currencies.air).toBe(10)
    expect(next.currencies.water).toBe(10)
    expect(next.reel.icons.length).toBe(4)
    expect(next.lastSpinResult).toBeNull()
    expect(next.magicGrid).toBeNull()
    expect(next.blockedColumns).toEqual([])
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

// ─── tryBuyIcon multi-level currency conversion ────────────────────────────────

describe('BUY_ICON multi-level currency conversion', () => {
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
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'triple-apple' })
    expect(next.reel.icons.length).toBe(state.reel.icons.length + 1)
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

// ─── PRESTIGE (T040) ──────────────────────────────────────────────────────────

describe('PRESTIGE action', () => {
  function buildReelWith3xIcons(defIds: string[]): GameState['reel'] {
    const icons = defIds.flatMap((defId) => [
      { id: `${defId}-1`, definitionId: defId },
      { id: `${defId}-2`, definitionId: defId },
      { id: `${defId}-3`, definitionId: defId },
    ])
    return { icons }
  }

  it('resets reel to 1 copy of each selected defId', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next.reel.icons).toHaveLength(4)
    const defIds = next.reel.icons.map((i) => i.definitionId)
    expect(defIds).toContain('apple')
    expect(defIds).toContain('copper')
    expect(defIds).toContain('air')
    expect(defIds).toContain('water')
  })

  it('resets currencies to PRESTIGE_STARTING_CURRENCIES', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
      currencies: { food: 500, copper: 9999, silver: 100, gold: 50, crowns: 0, air: 0, water: 0, earth: 0, fire: 0 },
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next.currencies).toMatchObject(PRESTIGE_STARTING_CURRENCIES)
  })

  it('preserves spinCount', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      spinCount: 42,
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next.spinCount).toBe(42)
  })

  it('resets phase to market', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next.phase).toBe('market')
  })

  it('is a no-op when fewer than 4 defIds selected', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air'],
    })
    expect(next).toBe(state)
  })

  it('is a no-op when selected defId does not have 3 copies in reel', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air']),
    }
    // 'water' has 0 copies — invalid selection
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next).toBe(state)
  })

  it('allows selecting 5 icons (keeps 1 copy each)', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water', 'earth']),
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water', 'earth'],
    })
    expect(next.reel.icons).toHaveLength(5)
  })

  it('resets magicGrid, blockedColumns, magicCounters, pendingMultiplier', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
      blockedColumns: [1],
      magicCounters: { respin: 5, swap: 3, increaseValue: 2 },
      pendingMultiplier: 1,
    }
    const next = gameReducer(state, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(next.blockedColumns).toEqual([])
    expect(next.magicCounters).toEqual({ respin: 0, swap: 0, increaseValue: 0 })
    expect(next.pendingMultiplier).toBe(1)
    expect(next.magicGrid).toBeNull()
  })
})

// ─── T034: initialSpinPayouts lifecycle (US5) ────────────────────────────────

describe('initialSpinPayouts lifecycle (T034)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('after SPIN action, state.initialSpinPayouts is set (non-null)', () => {
    const state = stateWithCurrencies({ food: 10 })
    const after = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    // SPIN should compute and store initialSpinPayouts from the drawn columns
    expect(after.initialSpinPayouts).not.toBeUndefined()
  })

  it('after CLAIM, state.initialSpinPayouts is reset to null', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'food', amount: 1, currency: 'food' }])
    const state = magicState({ initialSpinPayouts: [{ family: 'food', amount: 1, currency: 'food' }] })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.initialSpinPayouts).toBeNull()
  })

  it('after auto-prestige (starvation), state.initialSpinPayouts is null', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({
      currencies: { ...makeInitialState().currencies, food: 0 },
      initialSpinPayouts: [{ family: 'food', amount: 1, currency: 'food' }],
    })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.initialSpinPayouts).toBeNull()
  })
})

// ─── T021: auto-prestige on food=0 (US2) ─────────────────────────────────────

describe('CLAIM auto-prestige on food=0 (T021)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CLAIM that results in food=0 sets phase to starvation (not gameover)', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 0 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.phase).toBe('starvation')
    expect(next.phase).not.toBe('gameover')
  })

  it('auto-prestige resets reel to {apple, copper, air, water}', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 0 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    const defIds = next.reel.icons.map((i) => i.definitionId).sort()
    expect(defIds).toEqual(['air', 'apple', 'copper', 'water'])
  })

  it('auto-prestige resets currencies to PRESTIGE_STARTING_CURRENCIES including copper=10', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 0, copper: 500, silver: 50 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.currencies).toMatchObject(PRESTIGE_STARTING_CURRENCIES)
  })

  it('auto-prestige resets rowCount to 3', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({ currencies: { ...makeInitialState().currencies, food: 0 }, rowCount: 5 })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.rowCount).toBe(3)
  })

  it('auto-prestige preserves previously unlocked achievements', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([])
    const state = magicState({
      currencies: { ...makeInitialState().currencies, food: 0 },
      unlockedAchievements: ['how-do-you-like-them-apples'],
    })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.unlockedAchievements).toContain('how-do-you-like-them-apples')
  })

  it('DISMISS_STARVATION action transitions phase to market', () => {
    const state: GameState = { ...makeInitialState(), phase: 'starvation' }
    const next = gameReducer(state, { type: 'DISMISS_STARVATION' })
    expect(next.phase).toBe('market')
  })
})

// ─── T019: prestige starting copper (US3) ────────────────────────────────────

describe('PRESTIGE starting currencies include copper=10 (T019)', () => {
  function buildReelWith3xIcons(defIds: string[]): GameState['reel'] {
    const icons = defIds.flatMap((defId) => [
      { id: `${defId}-1`, definitionId: defId },
      { id: `${defId}-2`, definitionId: defId },
      { id: `${defId}-3`, definitionId: defId },
    ])
    return { icons }
  }

  it('after PRESTIGE action, state.currencies.copper equals 10', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, { type: 'PRESTIGE', keepDefinitionIds: ['apple', 'copper', 'air', 'water'] })
    expect(next.currencies.copper).toBe(10)
  })

  it('after PRESTIGE action, food=10, air=10, water=10', () => {
    const state: GameState = {
      ...makeInitialState(),
      phase: 'market',
      reel: buildReelWith3xIcons(['apple', 'copper', 'air', 'water']),
    }
    const next = gameReducer(state, { type: 'PRESTIGE', keepDefinitionIds: ['apple', 'copper', 'air', 'water'] })
    expect(next.currencies.food).toBe(10)
    expect(next.currencies.air).toBe(10)
    expect(next.currencies.water).toBe(10)
  })
})

// ─── T009: rowCount updates on CLAIM ─────────────────────────────────────────

describe('CLAIM rowCount updates (T009)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CLAIM with energy payout ≥16 sets rowCount to 4', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'energy', amount: 16, currency: 'energy' }])
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.rowCount).toBe(4)
  })

  it('CLAIM with energy ≥69 sets rowCount to 5', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'energy', amount: 69, currency: 'energy' }])
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.rowCount).toBe(5)
  })

  it('CLAIM with energy 15 leaves rowCount unchanged', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'energy', amount: 15, currency: 'energy' }])
    const state = magicState()
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.rowCount).toBe(3)
  })

  it('CLAIM with energy ≥16 when rowCount already 4 does not re-fire sweet dialog', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'energy', amount: 16, currency: 'energy' }])
    const state = magicState({ rowCount: 4, unlockedAchievements: ['sweet'] })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.rowCount).toBe(4)
    expect(next.unlockedAchievements.filter((id) => id === 'sweet')).toHaveLength(1)
  })
})

// ─── T010: Achievement accumulation via BUY_ICON ──────────────────────────────

describe('BUY_ICON achievement accumulation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('BUY_ICON apple → unlockedAchievements gains how-do-you-like-them-apples', () => {
    const state = stateWithCurrencies({ copper: 5 })
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.unlockedAchievements).toContain('how-do-you-like-them-apples')
  })

  it('duplicate BUY_ICON apple does not append the same achievement twice', () => {
    const state = stateWithCurrencies({ copper: 50 })
    const after1 = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    const after2 = gameReducer(after1, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    const count = after2.unlockedAchievements.filter((id) => id === 'how-do-you-like-them-apples').length
    expect(count).toBe(1)
  })
})

// ─── T016: Market cap formula (BUY_ICON) ─────────────────────────────────────

describe('BUY_ICON market cap formula (ownedCount * 2 >= reel.icons.length)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocked when ownedCount * 2 >= reel.icons.length', () => {
    // Reel: 6 icons, 3 apples → 3*2=6 >= 6 → blocked
    const base = stateWithCurrencies({ copper: 5 })
    const state: GameState = {
      ...base,
      reel: {
        icons: [
          { id: '1', definitionId: 'apple' },
          { id: '2', definitionId: 'apple' },
          { id: '3', definitionId: 'apple' },
          { id: '4', definitionId: 'copper' },
          { id: '5', definitionId: 'air' },
          { id: '6', definitionId: 'water' },
        ],
      },
    }
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next).toBe(state)
  })

  it('allowed and reel grows by 1 when ownedCount * 2 < reel.icons.length', () => {
    // Reel: 5 icons, 2 apples → 2*2=4 < 5 → allowed
    const base = stateWithCurrencies({ copper: 5 })
    const state: GameState = {
      ...base,
      reel: {
        icons: [
          { id: '1', definitionId: 'apple' },
          { id: '2', definitionId: 'apple' },
          { id: '3', definitionId: 'copper' },
          { id: '4', definitionId: 'air' },
          { id: '5', definitionId: 'water' },
        ],
      },
    }
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.reel.icons.length).toBe(6)
  })

  it('odd-reel edge case: 3/7 allowed → 4/8 blocked', () => {
    // Reel: 7 icons, 3 apples → 3*2=6 < 7 → allowed
    const base = stateWithCurrencies({ copper: 5 })
    const state: GameState = {
      ...base,
      reel: {
        icons: [
          { id: '1', definitionId: 'apple' },
          { id: '2', definitionId: 'apple' },
          { id: '3', definitionId: 'apple' },
          { id: '4', definitionId: 'copper' },
          { id: '5', definitionId: 'air' },
          { id: '6', definitionId: 'water' },
          { id: '7', definitionId: 'earth' },
        ],
      },
    }
    const after = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    // 4 apples, 8 icons → 4*2=8 >= 8 → blocked on next buy
    expect(after.reel.icons.length).toBe(8)
    const blocked = gameReducer(after, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(blocked).toBe(after)
  })
})

// ─── T022: SpinMultiplier type and persistence clamp ─────────────────────────

describe('SpinMultiplier = 1 only', () => {
  it('SPIN with multiplier 1 succeeds', () => {
    const state = stateWithCurrencies({ food: 5 })
    const next = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(next.phase).toBe('spinning')
  })

  it('initial state has spinMultiplier: 1', () => {
    const state = makeInitialState()
    expect(state.settings.spinMultiplier).toBe(1)
  })
})

// ─── T027: 100 crowns → no win ────────────────────────────────────────────────

describe('Win condition removed for crowns', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reaching 100 crowns does not trigger win phase', async () => {
    const { calculatePayouts } = await import('@/game/spinLogic')
    vi.mocked(calculatePayouts).mockReturnValueOnce([{ family: 'crown', amount: 100, currency: 'crowns' }])
    const state = magicState({ currencies: { ...makeInitialState().currencies, crowns: 0 } })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.phase).toBe('market')
  })
})
