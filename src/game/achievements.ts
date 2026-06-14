import type { GameState, GameAction, Icon } from './types'
import { ICON_CATALOG } from './catalog'

export type AchievementId =
  | 'how-do-you-like-them-apples'
  | 'second-breakfast'
  | 'out-of-stock'
  | 'sss'
  | 'i-understand-it-now'
  | 'coin-collector'
  | 'be-water-my-friend'
  | 'why'
  | 'born-with-diamond-spoon'
  | 'this-is-sparta'
  | 'blow-it-up'
  | 'sweet'
  | 'nice'
  | 'master-of-elements'
  | 'happily-ever-after'

export interface AchievementDefinition {
  id: AchievementId
  title: string
  description: string
  isWip: boolean
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'how-do-you-like-them-apples',
    title: 'How Do You Like Them Apples',
    description: 'Buy an apple from the Reels Store.',
    isWip: false,
  },
  {
    id: 'second-breakfast',
    title: 'Second Breakfast',
    description: 'Earn >= 2 Apple in one spin.',
    isWip: false,
  },
  {
    id: 'out-of-stock',
    title: 'Out of Stock',
    description: 'Fill the reel so far that one icon type can no longer be purchased.',
    isWip: false,
  },
  {
    id: 'sss',
    title: 'SSS',
    description: 'Own at least 3 silver-family icons.',
    isWip: false,
  },
  {
    id: 'i-understand-it-now',
    title: 'I Understand It Now',
    description: 'Prestige keeping an icon that costs at least 1 silver',
    isWip: false,
  },
  {
    id: 'coin-collector',
    title: 'Coin Collector',
    description: 'Have at least one copper, one silver, and one gold icon in your reel.',
    isWip: false,
  },
  {
    id: 'blow-it-up',
    title: 'Blow it up',
    description: 'Use the respin action and earn even more as a result.',
    isWip: false,
  },
  {
    id: 'be-water-my-friend',
    title: 'Be Water, My Friend',
    description: 'Use a swap during magic phase and earn from two different icon families.',
    isWip: false,
  },
  {
    id: 'why',
    title: 'WHY!!!',
    description: 'Block a column that would have paid out more than what you actually earned.',
    isWip: false,
  },
  {
    id: 'born-with-diamond-spoon',
    title: 'Born with a Diamond Spoon',
    description: 'Prestige while keeping a crown icon.',
    isWip: false,
  },
  {
    id: 'this-is-sparta',
    title: 'This Is Sparta',
    description: 'Accumulate 300 crowns.',
    isWip: false,
  },
  {
    id: 'sweet',
    title: 'Sweet',
    description: 'Earn ≥16 energy in a single spin.',
    isWip: false,
  },
  {
    id: 'nice',
    title: 'Nice',
    description: 'Earn ≥69 energy in a single spin.',
    isWip: false,
  },
  {
    id: 'master-of-elements',
    title: 'Master of Elements',
    description: 'Earn all four elements in one spin.',
    isWip: false,
  },
  {
    id: 'happily-ever-after',
    title: 'Happily Ever After',
    description: 'Unlock all other achievements.',
    isWip: false,
  },
]

const NON_META_ACHIEVEMENT_IDS: AchievementId[] = ACHIEVEMENTS
  .filter((a) => !a.isWip && a.id !== 'happily-ever-after')
  .map((a) => a.id)

function iconColumns(state: GameState): Icon[][] {
  if (!state.magicGrid) return []
  return state.magicGrid.map((col) => col.map((cell) => cell.icon))
}

export function checkNewAchievements(
  prevState: GameState,
  newState: GameState,
  action: GameAction,
  claimPayouts?: import('./types').Payout[],
): AchievementId[] {
  const already = new Set(newState.unlockedAchievements)
  const earned: AchievementId[] = []

  function tryEarn(id: AchievementId) {
    if (!already.has(id)) {
      earned.push(id)
      already.add(id)
    }
  }

  if (action.type === 'BUY_ICON') {
    const def = ICON_CATALOG[action.iconDefinitionId]
    if (def?.family === 'apple') tryEarn('how-do-you-like-them-apples')

    const reelIcons = newState.reel.icons
    const countMap = new Map<string, number>()
    for (const icon of reelIcons) {
      countMap.set(icon.definitionId, (countMap.get(icon.definitionId) ?? 0) + 1)
    }
    const maxCount = Math.max(0, ...countMap.values())
    if (maxCount * 2 >= reelIcons.length) tryEarn('out-of-stock')

    const silverCount = reelIcons.filter((i) => ICON_CATALOG[i.definitionId]?.family === 'silver').length
    if (silverCount >= 3) tryEarn('sss')

    const families = new Set(reelIcons.map((i) => ICON_CATALOG[i.definitionId]?.family))
    if (families.has('copper') && families.has('silver') && families.has('gold')) tryEarn('coin-collector')
  }

  if (action.type === 'CLAIM') {
    const allCols = iconColumns(prevState)
    const activeCols = allCols.filter((_, i) => !prevState.blockedColumns.includes(i))

    // second-breakfast: apple-family payout amount ≥2
    const applePayout = (claimPayouts ?? []).find((p) => p.family === 'apple')?.amount ?? 0
    if (applePayout >= 2) tryEarn('second-breakfast')

    // be-water-my-friend: used swap + rawPayouts from ≥2 distinct families
    if (prevState.magicCounters.swap > 0) {
      const families = new Set(activeCols.flat().map((i) => ICON_CATALOG[i.definitionId]?.family).filter(Boolean))
      if (families.size >= 2) tryEarn('be-water-my-friend')
    }

    // why: blocked column(s) and the blocked cols would have paid more
    if (prevState.blockedColumns.length > 0) {
      const allTotal = allCols.flat().reduce((sum, i) => sum + (ICON_CATALOG[i.definitionId]?.valuePerColumn ?? 0), 0)
      const activeTotal = activeCols.flat().reduce((sum, i) => sum + (ICON_CATALOG[i.definitionId]?.valuePerColumn ?? 0), 0)
      if (allTotal > activeTotal) tryEarn('why')
    }

    // blow-it-up: respin was used, initial spin was non-zero, claim total > initial total
    if (prevState.magicCounters.respin > 0) {
      const sumPayouts = (payouts: import('./types').Payout[] | null) =>
        (payouts ?? []).reduce((sum, p) => sum + p.amount, 0)
      const initialTotal = sumPayouts(prevState.initialSpinPayouts)
      const claimTotal = sumPayouts(claimPayouts ?? null)
      if (initialTotal > 0 && claimTotal > initialTotal) tryEarn('blow-it-up')
    }

    // sweet / nice: energy earned in this spin
    const energyAmount = (claimPayouts ?? []).find((p) => p.currency === 'energy')?.amount ?? 0
    if (energyAmount >= 16) tryEarn('sweet')
    if (energyAmount >= 69) tryEarn('nice')

    // this-is-sparta
    if ((newState.currencies.crowns ?? 0) >= 300) tryEarn('this-is-sparta')

    // master-of-elements: all 4 element families appear in claimPayouts
    const payoutFamilies = new Set((claimPayouts ?? []).map((p) => p.family))
    if (['air', 'water', 'earth', 'fire'].every((f) => payoutFamilies.has(f))) tryEarn('master-of-elements')
  }

  if (action.type === 'PRESTIGE') {
    const reelIcons = newState.reel.icons
    const countMap = new Map<string, number>()
    for (const icon of reelIcons) {
      countMap.set(icon.definitionId, (countMap.get(icon.definitionId) ?? 0) + 1)
    }
    const maxCount = Math.max(0, ...countMap.values())
    if (maxCount * 2 >= reelIcons.length) tryEarn('out-of-stock')

    const silverCount = reelIcons.filter((i) => ICON_CATALOG[i.definitionId]?.family === 'silver').length
    if (silverCount >= 3) tryEarn('sss')

    const families = new Set(reelIcons.map((i) => ICON_CATALOG[i.definitionId]?.family))
    if (families.has('copper') && families.has('silver') && families.has('gold')) tryEarn('coin-collector')

    const keepDefs = (action as { type: 'PRESTIGE'; keepDefinitionIds: string[] }).keepDefinitionIds
    if (keepDefs.some((id) => ICON_CATALOG[id]?.family === 'crown')) tryEarn('born-with-diamond-spoon')
    if (keepDefs.some((id) => {
      const f = ICON_CATALOG[id]?.cost?.currency
      return f === 'silver' || f === 'gold'
    })) tryEarn('i-understand-it-now')
  }

  // happily-ever-after cascade: all 14 non-WIP non-meta IDs unlocked
  if (!already.has('happily-ever-after')) {
    const allUnlocked = NON_META_ACHIEVEMENT_IDS.every((id) => already.has(id))
    if (allUnlocked) tryEarn('happily-ever-after')
  }

  return earned
}
