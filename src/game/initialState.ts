import type { GameState } from './types'
import { DEFAULT_SETTINGS } from './types'
import { CURRENCY_REGISTRY } from './currencyRegistry'

let _counter = 0
function stableId(prefix: string) {
  return `${prefix}-${++_counter}`
}

export const PRESTIGE_STARTING_CURRENCIES: Record<string, number> = {
  food: 10,
  air: 10,
  water: 10,
  copper: 10,
  ...Object.fromEntries(
    Object.keys(CURRENCY_REGISTRY)
      .filter((k) => k !== 'food' && k !== 'air' && k !== 'water' && k !== 'copper')
      .map((k) => [k, 0])
  ),
}

export function makeInitialState(): GameState {
  return {
    version: 6,
    reel: {
      icons: [
        { id: stableId('air'), definitionId: 'air' },
        { id: stableId('water'), definitionId: 'water' },
        { id: stableId('apple'), definitionId: 'apple' },
        { id: stableId('copper'), definitionId: 'copper' },
      ],
    },
    currencies: { ...PRESTIGE_STARTING_CURRENCIES },
    phase: 'market',
    lastSpinResult: null,
    spinCount: 0,
    settings: DEFAULT_SETTINGS,
    gameLog: [],
    magicGrid: null,
    blockedColumns: [],
    magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
    unlockedAchievements: [],
    pendingMultiplier: 1,
    rowCount: 3,
    initialSpinPayouts: null,
  }
}

export const INITIAL_STATE: GameState = makeInitialState()
