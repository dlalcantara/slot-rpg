import type { GameState } from './types'
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
    version: 1,
    reel: {
      icons: [
        { id: stableId('blank'), definitionId: 'blank' },
        { id: stableId('blank'), definitionId: 'blank' },
        { id: stableId('blank'), definitionId: 'blank' },
        { id: stableId('apple'), definitionId: 'apple' },
        { id: stableId('copper'), definitionId: 'copper' },
      ],
    },
    currencies: buildInitialCurrencies(),
    phase: 'market',
    lastSpinResult: null,
  }
}

export const INITIAL_STATE: GameState = makeInitialState()
