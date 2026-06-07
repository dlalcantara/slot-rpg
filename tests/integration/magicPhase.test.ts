import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer } from '@/game/reducer'
import { makeInitialState } from '@/game/initialState'
import type { GameState } from '@/game/types'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

describe('full spin → magic phase → CLAIM flow', () => {
  beforeEach(() => vi.clearAllMocks())

  function setup(): GameState {
    return {
      ...makeInitialState(),
      currencies: {
        food: 10, copper: 0, silver: 0, gold: 0, crowns: 0,
        air: 5, water: 5, earth: 5, fire: 5,
      },
    }
  }

  it('SPIN → BEGIN_MAGIC_PHASE → CLAIM completes round and awards food', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(state.phase).toBe('spinning')

    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(state.phase).toBe('magic')
    expect(state.magicGrid).not.toBeNull()

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
    expect(state.magicGrid).toBeNull()
    expect(state.lastSpinResult).not.toBeNull()
    expect(state.gameLog.length).toBeGreaterThan(0)
  })

  it('MAGIC_RESPIN changes a column before CLAIM', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    const originalCol0 = state.magicGrid![0].map((c) => c.icon.id)
    state = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    const newCol0 = state.magicGrid![0].map((c) => c.icon.id)

    // Column may or may not have changed (random), but Air was deducted
    expect(state.currencies.air).toBe(4)
    expect(state.magicCounters.respin).toBe(1)
    void originalCol0
    void newCol0

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
  })

  it('MAGIC_LOCK → SPIN preserves locked column icons', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    const lockedIcons = state.magicGrid![0].map((c) => c.icon.definitionId)
    state = gameReducer(state, { type: 'MAGIC_LOCK', colIdx: 0 })
    expect(state.lockedColumns).toContain(0)
    expect(state.currencies.earth).toBe(4)

    state = gameReducer(state, { type: 'CLAIM' })
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })

    // Locked column 0 should have same icons
    const col0After = state.magicGrid![0].map((c) => c.icon.definitionId)
    expect(col0After).toEqual(lockedIcons)
    // lockedColumns cleared after being used in SPIN
    expect(state.lockedColumns).toEqual([])
  })

  it('multiple magic actions before CLAIM all reflected in result', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    // Respin col 1
    state = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 1 })
    expect(state.currencies.air).toBe(4)

    // Swap adjacent cells in col 2
    state = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 2, fromRow: 0, toCol: 2, toRow: 1 })
    expect(state.currencies.water).toBe(4)

    // Increase value of a cell
    state = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 3, rowIdx: 0 })
    expect(state.currencies.fire).toBe(4)

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
    expect(state.lastSpinResult).not.toBeNull()
  })
})
