import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer } from '@/game/reducer'
import { makeInitialState } from '@/game/initialState'
import type { GameState, MagicCell } from '@/game/types'
import type { AchievementId } from '@/game/achievements'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

vi.mock('@/game/spinLogic', () => ({
  drawColumn: vi.fn(() => [
    { id: 'c1', definitionId: 'apple' },
    { id: 'c2', definitionId: 'apple' },
    { id: 'c3', definitionId: 'apple' },
  ]),
  calculatePayouts: vi.fn(() => [{ family: 'apple', amount: 1, currency: 'food' }]),
}))

function magicState(overrides: Partial<GameState> = {}): GameState {
  const base: GameState = {
    ...makeInitialState(),
    currencies: { food: 10, copper: 0, silver: 0, gold: 0, crowns: 0, air: 10, water: 10, earth: 10, fire: 10 },
    phase: 'magic',
    pendingMultiplier: 1,
    magicGrid: Array(5).fill(null).map((_, ci) => [
      { icon: { id: `c${ci}r0`, definitionId: 'apple' }, valueOverride: null },
      { icon: { id: `c${ci}r1`, definitionId: 'apple' }, valueOverride: null },
      { icon: { id: `c${ci}r2`, definitionId: 'apple' }, valueOverride: null },
    ]) as MagicCell[][],
    blockedColumns: [],
    magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
  }
  return { ...base, ...overrides }
}

// ─── T015: Achievement accumulation via BUY_ICON / CLAIM ─────────────────────

describe('achievement flow integration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('T015a: BUY_ICON apple → state.unlockedAchievements includes how-do-you-like-them-apples', () => {
    const state: GameState = {
      ...makeInitialState(),
      currencies: { ...makeInitialState().currencies, copper: 5 },
    }
    const next = gameReducer(state, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(next.unlockedAchievements).toContain('how-do-you-like-them-apples')
  })

  it('T015b: CLAIM with 2 apple-family icons in grid → second-breakfast added', () => {
    const grid: MagicCell[][] = [
      [
        { icon: { id: 'c0r0', definitionId: 'apple' }, valueOverride: null },
        { icon: { id: 'c0r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c0r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c1r0', definitionId: 'apple' }, valueOverride: null },
        { icon: { id: 'c1r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c1r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c2r0', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c2r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c2r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c3r0', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c3r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c3r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c4r0', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c4r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c4r2', definitionId: 'blank' }, valueOverride: null },
      ],
    ]
    const state = magicState({ magicGrid: grid })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.unlockedAchievements).toContain('second-breakfast')
  })
})

// ─── T031/T032: happily-ever-after cascade ────────────────────────────────────

describe('happily-ever-after meta-achievement', () => {
  beforeEach(() => vi.clearAllMocks())

  const ALL_NON_META: AchievementId[] = [
    'how-do-you-like-them-apples',
    'second-breakfast',
    'out-of-stock',
    'sss',
    'i-understand-it-now',
    'coin-collector',
    'be-water-my-friend',
    'why',
    'born-with-diamond-spoon',
    'this-is-sparta',
    'ancient-civilization',
    'master-of-elements',
  ]

  it('T031: adding the 14th non-meta achievement triggers happily-ever-after', () => {
    // Use a grid with all 4 element families to unlock master-of-elements
    const grid: MagicCell[][] = [
      [
        { icon: { id: 'c0r0', definitionId: 'air' }, valueOverride: null },
        { icon: { id: 'c0r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c0r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c1r0', definitionId: 'water' }, valueOverride: null },
        { icon: { id: 'c1r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c1r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c2r0', definitionId: 'earth' }, valueOverride: null },
        { icon: { id: 'c2r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c2r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c3r0', definitionId: 'fire' }, valueOverride: null },
        { icon: { id: 'c3r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c3r2', definitionId: 'blank' }, valueOverride: null },
      ],
      [
        { icon: { id: 'c4r0', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c4r1', definitionId: 'blank' }, valueOverride: null },
        { icon: { id: 'c4r2', definitionId: 'blank' }, valueOverride: null },
      ],
    ]
    // State has all non-meta achievements except master-of-elements
    const without13th = ALL_NON_META.filter((id) => id !== 'master-of-elements')
    const state = magicState({
      magicGrid: grid,
      unlockedAchievements: without13th,
    })
    const next = gameReducer(state, { type: 'CLAIM' })
    expect(next.unlockedAchievements).toContain('master-of-elements')
    expect(next.unlockedAchievements).toContain('happily-ever-after')
  })

  it('T032: happily-ever-after not added if already present', () => {
    const state = magicState({
      unlockedAchievements: [...ALL_NON_META, 'happily-ever-after'],
    })
    const next = gameReducer(state, { type: 'CLAIM' })
    const count = next.unlockedAchievements.filter((id) => id === 'happily-ever-after').length
    expect(count).toBe(1)
  })
})
