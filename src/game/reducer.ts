import type {
  GameState,
  Currencies,
  SpinLogEntry,
  MagicCell,
  Icon,
} from './types'
import { ICON_CATALOG } from './catalog'
import { CURRENCY_REGISTRY, CURRENCY_ORDER } from './currencyRegistry'
import { drawColumn, calculatePayouts } from './spinLogic'
import { saveState, clearState } from './persistence'
import { makeInitialState, PRESTIGE_STARTING_CURRENCIES } from './initialState'
import { detectMasterOfElements } from './masterOfElements'
import type { GameAction } from './types'

export type { GameAction }

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

function ensureLiquidity(
  currencies: Currencies,
  currency: string,
  amount: number,
): Currencies | null {
  if ((currencies[currency] ?? 0) >= amount) return currencies

  const def = CURRENCY_REGISTRY[currency]
  if (!def?.convertibleFrom) return null

  const { currency: src, rate } = def.convertibleFrom
  const unitsNeeded = Math.ceil((amount - (currencies[currency] ?? 0)) / rate)

  const funded = ensureLiquidity(currencies, src, unitsNeeded)
  if (!funded) return null

  return {
    ...funded,
    [src]: funded[src] - unitsNeeded,
    [currency]: (funded[currency] ?? 0) + unitsNeeded * rate,
  }
}

function tryBuyIcon(state: GameState, iconDefinitionId: string): GameState {
  const def = ICON_CATALOG[iconDefinitionId]
  if (!def || !def.cost) return state

  const ownedCount = state.reel.icons.filter((i) => i.definitionId === iconDefinitionId).length
  if (ownedCount >= 3) return state

  const { currency: costCurrency, amount: costAmount } = def.cost
  const funded = ensureLiquidity({ ...state.currencies }, costCurrency, costAmount)
  if (!funded) return state

  const currencies = { ...funded, [costCurrency]: funded[costCurrency] - costAmount }
  const newIcon = { id: crypto.randomUUID(), definitionId: iconDefinitionId }
  const newState: GameState = {
    ...state,
    currencies,
    reel: { icons: [...state.reel.icons, newIcon] },
  }
  saveState(newState)
  return newState
}

function iconsToMagicCells(icons: Icon[]): MagicCell[] {
  return icons.map((icon) => ({ icon: { ...icon, id: crypto.randomUUID() }, valueOverride: null }))
}

function buildOverridesMap(grid: MagicCell[][]): Map<string, number> {
  const overrides = new Map<string, number>()
  for (const col of grid) {
    for (const cell of col) {
      if (cell.valueOverride !== null) {
        overrides.set(cell.icon.id, cell.valueOverride)
      }
    }
  }
  return overrides
}

function magicGridToIconColumns(grid: MagicCell[][]): Icon[][] {
  return grid.map((col) => col.map((cell) => cell.icon))
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SPIN': {
      if (state.phase !== 'market') return state
      const { multiplier } = action
      if ((state.currencies.food ?? 0) < multiplier) return state

      const currencies: Currencies = { ...state.currencies, food: state.currencies.food - multiplier }

      const newColumns: Icon[][] = []
      for (let i = 0; i < 5; i++) {
        newColumns.push(drawColumn(state.reel))
      }

      const magicGrid: MagicCell[][] = newColumns.map(iconsToMagicCells)

      const newState: GameState = {
        ...state,
        currencies,
        phase: 'spinning',
        magicGrid,
        pendingMultiplier: multiplier,
        spinCount: state.spinCount + 1,
      }
      saveState(newState)
      return newState
    }

    case 'BEGIN_MAGIC_PHASE': {
      if (state.phase !== 'spinning') return state
      const newState: GameState = {
        ...state,
        phase: 'magic',
        magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
        blockedColumns: [],
      }
      saveState(newState)
      return newState
    }

    case 'MAGIC_RESPIN': {
      if (state.phase !== 'magic' || !state.magicGrid) return state
      const { colIdx } = action
      const cost = (state.magicCounters.respin + 1) * state.pendingMultiplier
      if ((state.currencies.air ?? 0) < cost) return state

      const newColumn = iconsToMagicCells(drawColumn(state.reel))
      const newGrid = state.magicGrid.map((col, i) => i === colIdx ? newColumn : col)

      const newState: GameState = {
        ...state,
        magicGrid: newGrid,
        currencies: { ...state.currencies, air: (state.currencies.air ?? 0) - cost },
        magicCounters: { ...state.magicCounters, respin: state.magicCounters.respin + 1 },
      }
      saveState(newState)
      return newState
    }

    case 'MAGIC_SWAP': {
      if (state.phase !== 'magic' || !state.magicGrid) return state
      const { fromCol, fromRow, toCol, toRow } = action
      const isAdjacent = Math.abs(fromCol - toCol) + Math.abs(fromRow - toRow) === 1
      if (!isAdjacent) return state
      const cost = (state.magicCounters.swap + 1) * state.pendingMultiplier
      if ((state.currencies.water ?? 0) < cost) return state

      const newGrid = state.magicGrid.map((col) => [...col])
      const tmp = newGrid[fromCol][fromRow]
      newGrid[fromCol][fromRow] = newGrid[toCol][toRow]
      newGrid[toCol][toRow] = tmp

      const newState: GameState = {
        ...state,
        magicGrid: newGrid,
        currencies: { ...state.currencies, water: (state.currencies.water ?? 0) - cost },
        magicCounters: { ...state.magicCounters, swap: state.magicCounters.swap + 1 },
      }
      saveState(newState)
      return newState
    }

    case 'MAGIC_BLOCK_COLUMN': {
      if (state.phase !== 'magic') return state
      const { colIdx } = action
      if (state.blockedColumns.includes(colIdx)) return state
      if (state.blockedColumns.length >= 4) return state
      const cost = (state.blockedColumns.length + 1) * state.pendingMultiplier
      if ((state.currencies.earth ?? 0) < cost) return state

      const newState: GameState = {
        ...state,
        blockedColumns: [...state.blockedColumns, colIdx],
        currencies: { ...state.currencies, earth: (state.currencies.earth ?? 0) - cost },
      }
      saveState(newState)
      return newState
    }

    case 'MAGIC_INCREASE_VALUE': {
      if (state.phase !== 'magic' || !state.magicGrid) return state
      const { colIdx, rowIdx } = action
      const cell = state.magicGrid[colIdx]?.[rowIdx]
      if (!cell) return state
      const def = ICON_CATALOG[cell.icon.definitionId]
      if (!def || def.family === 'blank') return state
      const cost = (state.magicCounters.increaseValue + 1) * state.pendingMultiplier
      if ((state.currencies.fire ?? 0) < cost) return state

      const currentValue = cell.valueOverride ?? def.valuePerColumn
      const newGrid = state.magicGrid.map((col, ci) =>
        col.map((c, ri) =>
          ci === colIdx && ri === rowIdx
            ? { ...c, valueOverride: currentValue + 1 }
            : c
        )
      )

      const newState: GameState = {
        ...state,
        magicGrid: newGrid,
        currencies: { ...state.currencies, fire: (state.currencies.fire ?? 0) - cost },
        magicCounters: { ...state.magicCounters, increaseValue: state.magicCounters.increaseValue + 1 },
      }
      saveState(newState)
      return newState
    }

    case 'CLAIM': {
      if (state.phase !== 'magic' || !state.magicGrid) return state
      const multiplier = state.pendingMultiplier

      const overrides = buildOverridesMap(state.magicGrid)
      const allIconColumns = magicGridToIconColumns(state.magicGrid)
      const activeIconColumns = allIconColumns.filter((_, i) => !state.blockedColumns.includes(i))
      const rawPayouts = calculatePayouts(activeIconColumns, overrides, activeIconColumns.length)

      let currencies: Currencies = { ...state.currencies }
      for (const payout of rawPayouts) {
        currencies[payout.currency] = (currencies[payout.currency] ?? 0) + payout.amount * multiplier
      }

      if (state.settings.autoConvert) {
        currencies = applyAutoConversions(currencies)
      }

      const masterOfElements = state.masterOfElements || detectMasterOfElements(state.magicGrid)
      const phase = checkPhase(currencies)
      const scaledPayouts = rawPayouts.map((p) => ({ ...p, amount: p.amount * multiplier }))
      const logEntry: SpinLogEntry = {
        spinNumber: state.spinCount,
        multiplier,
        payouts: scaledPayouts,
        timestamp: Date.now(),
      }
      const gameLog = [logEntry, ...state.gameLog].slice(0, 10)

      const newState: GameState = {
        ...state,
        currencies,
        phase,
        lastSpinResult: { columns: allIconColumns, payouts: scaledPayouts },
        magicGrid: null,
        blockedColumns: [],
        gameLog,
        masterOfElements,
      }
      saveState(newState)
      return newState
    }

    case 'PRESTIGE': {
      if (state.phase !== 'market') return state
      const { keepDefinitionIds } = action
      if (keepDefinitionIds.length < 4) return state

      const countMap = new Map<string, number>()
      for (const icon of state.reel.icons) {
        countMap.set(icon.definitionId, (countMap.get(icon.definitionId) ?? 0) + 1)
      }
      const valid = keepDefinitionIds.every((defId) => (countMap.get(defId) ?? 0) >= 3)
      if (!valid) return state

      const newState: GameState = {
        ...state,
        reel: {
          icons: keepDefinitionIds.map((defId) => ({ id: crypto.randomUUID(), definitionId: defId })),
        },
        currencies: { ...PRESTIGE_STARTING_CURRENCIES },
        phase: 'market',
        lastSpinResult: null,
        magicGrid: null,
        blockedColumns: [],
        magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
        masterOfElements: false,
        pendingMultiplier: 1,
        gameLog: [],
      }
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

    case 'UPDATE_SETTINGS': {
      const newState: GameState = { ...state, settings: { ...state.settings, ...action.patch } }
      saveState(newState)
      return newState
    }

    case 'SET_CURRENCY': {
      const { currency, amount } = action
      if (!(currency in state.currencies)) return state
      if (!isFinite(amount) || amount < 0) return state
      const newState: GameState = {
        ...state,
        currencies: { ...state.currencies, [currency]: Math.floor(amount) },
      }
      saveState(newState)
      return newState
    }

    default:
      return state
  }
}
