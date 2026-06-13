import { describe, it, expect } from 'vitest'
import { checkNewAchievements, ACHIEVEMENTS } from '@/game/achievements'
import type { AchievementId } from '@/game/achievements'
import { makeInitialState } from '@/game/initialState'
import type { GameState, MagicCell } from '@/game/types'

function baseState(overrides: Partial<GameState> = {}): GameState {
  return { ...makeInitialState(), ...overrides }
}

function magicStateWith(grid: MagicCell[][]): GameState {
  return {
    ...makeInitialState(),
    phase: 'magic',
    magicGrid: grid,
    pendingMultiplier: 1,
    blockedColumns: [],
    magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
  }
}

function makeGrid(colDefs: string[][]): MagicCell[][] {
  return colDefs.map((col, ci) =>
    col.map((definitionId, ri) => ({
      icon: { id: `c${ci}r${ri}`, definitionId },
      valueOverride: null,
    })),
  )
}

function stateWithUnlocked(ids: AchievementId[]): Partial<GameState> {
  return { unlockedAchievements: ids }
}

// ─── ACHIEVEMENTS CATALOG ─────────────────────────────────────────────────────

describe('ACHIEVEMENTS catalog', () => {
  it('has exactly 15 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(15)
  })

  it('has exactly 2 WIP achievements', () => {
    expect(ACHIEVEMENTS.filter((a) => a.isWip)).toHaveLength(2)
  })

  it('has happily-ever-after as the last entry', () => {
    expect(ACHIEVEMENTS[ACHIEVEMENTS.length - 1].id).toBe('happily-ever-after')
  })
})

// ─── how-do-you-like-them-apples ─────────────────────────────────────────────

describe('checkNewAchievements — how-do-you-like-them-apples', () => {
  it('earned when buying an apple-family icon', () => {
    const prev = baseState()
    const next = { ...prev, reel: { icons: [...prev.reel.icons, { id: 'new', definitionId: 'apple' }] } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(result).toContain('how-do-you-like-them-apples')
  })

  it('not earned when buying a non-apple icon', () => {
    const prev = baseState()
    const next = { ...prev, reel: { icons: [...prev.reel.icons, { id: 'new', definitionId: 'copper' }] } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'copper' })
    expect(result).not.toContain('how-do-you-like-them-apples')
  })

  it('not returned if already unlocked', () => {
    const prev = baseState({ unlockedAchievements: ['how-do-you-like-them-apples'] })
    const next = { ...prev, reel: { icons: [...prev.reel.icons, { id: 'new', definitionId: 'apple' }] } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(result).not.toContain('how-do-you-like-them-apples')
  })
})

// ─── second-breakfast ────────────────────────────────────────────────────────

describe('checkNewAchievements — second-breakfast', () => {
  it('earned when ≥2 apple-family icons appear in spin result', () => {
    const grid = makeGrid([
      ['apple', 'blank', 'blank'],
      ['apple', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('second-breakfast')
  })

  it('not earned when only 1 apple-family icon in spin result', () => {
    const grid = makeGrid([
      ['apple', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('second-breakfast')
  })
})

// ─── out-of-stock ─────────────────────────────────────────────────────────────

describe('checkNewAchievements — out-of-stock', () => {
  it('earned when max icon count * 2 >= reel size after BUY_ICON', () => {
    const prev = baseState()
    // Build a reel with 3 apples out of 6 total icons (3*2=6 >= 6)
    const icons = [
      { id: '1', definitionId: 'apple' },
      { id: '2', definitionId: 'apple' },
      { id: '3', definitionId: 'apple' },
      { id: '4', definitionId: 'copper' },
      { id: '5', definitionId: 'air' },
      { id: '6', definitionId: 'water' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(result).toContain('out-of-stock')
  })

  it('not earned when max count * 2 < reel size', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'apple' },
      { id: '2', definitionId: 'apple' },
      { id: '3', definitionId: 'copper' },
      { id: '4', definitionId: 'air' },
      { id: '5', definitionId: 'water' },
      { id: '6', definitionId: 'earth' },
      { id: '7', definitionId: 'fire' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'apple' })
    expect(result).not.toContain('out-of-stock')
  })
})

// ─── sss ─────────────────────────────────────────────────────────────────────

describe('checkNewAchievements — sss', () => {
  it('earned when reel has ≥3 silver-family icons after BUY_ICON', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'silver' },
      { id: '2', definitionId: 'silver' },
      { id: '3', definitionId: 'silver' },
      { id: '4', definitionId: 'copper' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'silver' })
    expect(result).toContain('sss')
  })

  it('not earned with only 2 silver-family icons', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'silver' },
      { id: '2', definitionId: 'silver' },
      { id: '3', definitionId: 'copper' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'silver' })
    expect(result).not.toContain('sss')
  })
})

// ─── i-understand-it-now ─────────────────────────────────────────────────────

describe('checkNewAchievements — i-understand-it-now', () => {
  it('earned when prestige keeps a silver-cost icon', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'earth' }, // costs silver
      { id: '2', definitionId: 'copper' },
      { id: '3', definitionId: 'air' },
      { id: '4', definitionId: 'water' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['earth', 'copper', 'air', 'water'],
    })
    expect(result).toContain('i-understand-it-now')
  })

  it('not earned when prestige only keeps copper-cost icons', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'apple' },
      { id: '2', definitionId: 'copper' },
      { id: '3', definitionId: 'air' },
      { id: '4', definitionId: 'water' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(result).not.toContain('i-understand-it-now')
  })
})

// ─── coin-collector ───────────────────────────────────────────────────────────

describe('checkNewAchievements — coin-collector', () => {
  it('earned when reel has copper, silver, and gold families', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'copper' },
      { id: '2', definitionId: 'silver' },
      { id: '3', definitionId: 'gold' },
      { id: '4', definitionId: 'apple' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'gold' })
    expect(result).toContain('coin-collector')
  })

  it('not earned when gold is missing', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'copper' },
      { id: '2', definitionId: 'silver' },
      { id: '3', definitionId: 'apple' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, { type: 'BUY_ICON', iconDefinitionId: 'silver' })
    expect(result).not.toContain('coin-collector')
  })
})

// ─── be-water-my-friend ───────────────────────────────────────────────────────

describe('checkNewAchievements — be-water-my-friend', () => {
  it('earned when swap was used and ≥2 distinct families in result', () => {
    const grid = makeGrid([
      ['apple', 'blank', 'blank'],
      ['copper', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    prev.magicCounters = { respin: 0, swap: 1, increaseValue: 0 }
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('be-water-my-friend')
  })

  it('not earned when swap was not used', () => {
    const grid = makeGrid([
      ['apple', 'blank', 'blank'],
      ['copper', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('be-water-my-friend')
  })
})

// ─── why ─────────────────────────────────────────────────────────────────────

describe('checkNewAchievements — why', () => {
  it('earned when a blocked column would have paid more', () => {
    // All cols have apple (valuePerColumn=1), col 0 is blocked → blocked col would have added 3 to total
    const grid = makeGrid([
      ['apple', 'apple', 'apple'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    prev.blockedColumns = [0]
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('why')
  })

  it('not earned when no columns are blocked', () => {
    const grid = makeGrid([
      ['apple', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('why')
  })
})

// ─── born-with-diamond-spoon ──────────────────────────────────────────────────

describe('checkNewAchievements — born-with-diamond-spoon', () => {
  it('earned when prestige keeps a crown icon', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'crown' },
      { id: '2', definitionId: 'copper' },
      { id: '3', definitionId: 'air' },
      { id: '4', definitionId: 'water' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['crown', 'copper', 'air', 'water'],
    })
    expect(result).toContain('born-with-diamond-spoon')
  })

  it('not earned when prestige does not keep a crown icon', () => {
    const prev = baseState()
    const icons = [
      { id: '1', definitionId: 'apple' },
      { id: '2', definitionId: 'copper' },
      { id: '3', definitionId: 'air' },
      { id: '4', definitionId: 'water' },
    ]
    const next = { ...prev, reel: { icons } }
    const result = checkNewAchievements(prev, next, {
      type: 'PRESTIGE',
      keepDefinitionIds: ['apple', 'copper', 'air', 'water'],
    })
    expect(result).not.toContain('born-with-diamond-spoon')
  })
})

// ─── this-is-sparta ───────────────────────────────────────────────────────────

describe('checkNewAchievements — this-is-sparta', () => {
  it('earned when newState.currencies.crowns >= 300', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    const next = baseState({ currencies: { ...makeInitialState().currencies, crowns: 300 } })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('this-is-sparta')
  })

  it('not earned when crowns < 300', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    const next = baseState({ currencies: { ...makeInitialState().currencies, crowns: 299 } })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('this-is-sparta')
  })

  it('not returned if already unlocked', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    prev.unlockedAchievements = ['this-is-sparta']
    const next = baseState({ currencies: { ...makeInitialState().currencies, crowns: 5000 }, ...stateWithUnlocked(['this-is-sparta']) })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('this-is-sparta')
  })
})

// ─── ancient-civilization ────────────────────────────────────────────────────

describe('checkNewAchievements — ancient-civilization', () => {
  it('earned when newState.currencies.crowns >= 5000', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    const next = baseState({ currencies: { ...makeInitialState().currencies, crowns: 5000 } })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('ancient-civilization')
  })

  it('already unlocked → not returned again', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    prev.unlockedAchievements = ['ancient-civilization']
    const next = baseState({ currencies: { ...makeInitialState().currencies, crowns: 5000 }, ...stateWithUnlocked(['ancient-civilization']) })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('ancient-civilization')
  })
})

// ─── master-of-elements ───────────────────────────────────────────────────────

describe('checkNewAchievements — master-of-elements', () => {
  it('earned when all 4 element families appear in active spin result (≥1 each)', () => {
    const grid = makeGrid([
      ['air', 'blank', 'blank'],
      ['water', 'blank', 'blank'],
      ['earth', 'blank', 'blank'],
      ['fire', 'blank', 'blank'],
      ['air', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('master-of-elements')
  })

  it('not earned when one element family is missing', () => {
    const grid = makeGrid([
      ['air', 'blank', 'blank'],
      ['water', 'blank', 'blank'],
      ['earth', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    const prev = magicStateWith(grid)
    const next = baseState()
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('master-of-elements')
  })
})

// ─── happily-ever-after ───────────────────────────────────────────────────────

describe('checkNewAchievements — happily-ever-after', () => {
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

  it('earned when 14th non-meta achievement is added (completing the set)', () => {
    // prevState has 13, newState has 14 (the last one just added)
    const thirteenIds = ALL_NON_META.slice(0, 12)
    const allFourteen = ALL_NON_META.slice(0, 12).concat(['born-with-diamond-spoon'])
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    prev.unlockedAchievements = thirteenIds
    const next = baseState({ unlockedAchievements: allFourteen })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).toContain('happily-ever-after')
  })

  it('not earned if happily-ever-after already present', () => {
    const prev = magicStateWith(makeGrid([['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank'], ['blank', 'blank', 'blank']]))
    prev.unlockedAchievements = [...ALL_NON_META, 'happily-ever-after']
    const next = baseState({ unlockedAchievements: [...ALL_NON_META, 'happily-ever-after'] })
    const result = checkNewAchievements(prev, next, { type: 'CLAIM' })
    expect(result).not.toContain('happily-ever-after')
  })
})
