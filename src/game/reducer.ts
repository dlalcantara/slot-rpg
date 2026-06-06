import type { GameState, Currencies } from './types'
import { ICON_CATALOG } from './catalog'
import { CURRENCY_REGISTRY, CURRENCY_ORDER } from './currencyRegistry'
import { computeSpin } from './spinLogic'
import { saveState, clearState } from './persistence'
import { makeInitialState } from './initialState'

export type GameAction =
  | { type: 'SPIN' }
  | { type: 'BUY_ICON'; iconDefinitionId: string }
  | { type: 'HARD_RESET' }
  | { type: 'CONTINUE_AFTER_WIN' }
  | { type: 'RESTORE_STATE'; savedState: GameState }

function applyAutoConversions(currencies: Currencies): Currencies {
  const result: Currencies = { ...currencies }
  for (const key of CURRENCY_ORDER) {
    const def = CURRENCY_REGISTRY[key]
    if (!def?.autoConvertTo) continue
    const { currency: targetKey, threshold, rate } = def.autoConvertTo
    const batches = Math.floor(result[key] / threshold)
    if (batches > 0) {
      result[key] -= batches * rate
      result[targetKey] = (result[targetKey] ?? 0) + batches
    }
  }
  return result
}

function checkPhase(currencies: Currencies): GameState['phase'] {
  for (const key of CURRENCY_ORDER) {
    const def = CURRENCY_REGISTRY[key]
    if (def?.lossCondition && currencies[key] <= def.lossCondition.threshold) {
      return 'gameover'
    }
  }
  for (const key of CURRENCY_ORDER) {
    const def = CURRENCY_REGISTRY[key]
    if (def?.winCondition && currencies[key] >= def.winCondition.threshold) {
      return 'win'
    }
  }
  return 'market'
}

function tryBuyIcon(state: GameState, iconDefinitionId: string): GameState {
  const def = ICON_CATALOG[iconDefinitionId]
  if (!def || !def.cost) return state

  const { currency: costCurrency, amount: costAmount } = def.cost
  const currencies: Currencies = { ...state.currencies }

  if (currencies[costCurrency] >= costAmount) {
    currencies[costCurrency] -= costAmount
  } else {
    // Attempt downward conversion
    const shortfall = costAmount - (currencies[costCurrency] ?? 0)
    const currencyDef = CURRENCY_REGISTRY[costCurrency]
    if (!currencyDef?.convertibleFrom) return state

    const { currency: sourceCurrency, rate } = currencyDef.convertibleFrom
    const unitsNeeded = Math.ceil(shortfall / rate)
    if ((currencies[sourceCurrency] ?? 0) < unitsNeeded) return state

    currencies[sourceCurrency] -= unitsNeeded
    currencies[costCurrency] = (currencies[costCurrency] ?? 0) + unitsNeeded * rate
    currencies[costCurrency] -= costAmount
  }

  const newIcon = { id: crypto.randomUUID(), definitionId: iconDefinitionId }
  const newState: GameState = {
    ...state,
    currencies,
    reel: { icons: [...state.reel.icons, newIcon] },
  }
  saveState(newState)
  return newState
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SPIN': {
      if (state.phase !== 'market') return state

      const spinResult = computeSpin(state.reel)
      let currencies: Currencies = { ...state.currencies, food: state.currencies.food - 1 }

      for (const payout of spinResult.payouts) {
        currencies[payout.currency] = (currencies[payout.currency] ?? 0) + payout.amount
      }

      currencies = applyAutoConversions(currencies)
      const phase = checkPhase(currencies)

      const newState: GameState = { ...state, currencies, phase, lastSpinResult: spinResult, spinCount: state.spinCount + 1 }
      saveState(newState)
      return newState
    }

    case 'BUY_ICON':
      return tryBuyIcon(state, action.iconDefinitionId)

    case 'CONTINUE_AFTER_WIN': {
      if (state.phase !== 'win') return state
      const newState: GameState = { ...state, phase: 'market' }
      saveState(newState)
      return newState
    }

    case 'HARD_RESET': {
      const fresh = makeInitialState()
      clearState()
      saveState(fresh)
      return fresh
    }

    case 'RESTORE_STATE':
      return action.savedState

    default:
      return state
  }
}
