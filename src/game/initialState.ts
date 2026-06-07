import type { GameState } from './types'
import { DEFAULT_SETTINGS } from './types'
import { CURRENCY_REGISTRY } from './currencyRegistry'

let _counter = 0
function stableId(prefix: string) {
  return `${prefix}-${++_counter}`
}

function buildInitialCurrencies(): Record<string, number> {
  return Object.fromEntries(
    Object.values(CURRENCY_REGISTRY).map((def) => [def.key, def.startingAmount]),
  )
}

export function makeInitialState(): GameState {
  return {
    version: 4,
    reel: {
      icons: [
        { id: stableId('blank'), definitionId: 'blank' },
        { id: stableId('apple'), definitionId: 'apple' },
        { id: stableId('copper'), definitionId: 'copper' },
        { id: stableId('air'), definitionId: 'air' },
      ],
    },
    currencies: buildInitialCurrencies(),
    phase: 'market',
    lastSpinResult: null,
    spinCount: 0,
    settings: DEFAULT_SETTINGS,
    gameLog: [],
    magicGrid: null,
    lockedColumns: [],
    magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
    masterOfElements: false,
    pendingMultiplier: 1,
  }
}

export const INITIAL_STATE: GameState = makeInitialState()
