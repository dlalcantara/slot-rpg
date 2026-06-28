export type CurrencyKey = 'food' | 'copper' | 'silver' | 'gold' | 'crowns' | 'air' | 'water' | 'earth' | 'fire' | 'energy'

export type IconEffect =
  | { type: 'add_currency'; currency: CurrencyKey; valuePerColumn: number }
  | { type: 'none' }

export interface IconDefinition {
  definitionId: string
  family: string
  valuePerColumn: number
  label: string
  emoji: string
  effect: IconEffect
  cost: { currency: CurrencyKey; amount: number } | null
  multiCost: { currency: CurrencyKey; amount: number }[] | null
}

export interface Icon {
  id: string
  definitionId: string
}

export interface Reel {
  icons: Icon[]
}

export interface AutoConvertTo {
  currency: string
  threshold: number
  rate: number
}

export interface ConvertibleFrom {
  currency: string
  rate: number
}

export interface WinCondition {
  threshold: number
}

export interface LossCondition {
  threshold: number
}

export interface CurrencyDefinition {
  key: string
  label: string
  startingAmount: number
  autoConvertTo: AutoConvertTo | null
  convertibleFrom: ConvertibleFrom | null
  winCondition: WinCondition | null
  lossCondition: LossCondition | null
}

export type Currencies = Record<string, number>

export interface Payout {
  family: string
  amount: number
  currency: string
}

export interface SpinResult {
  columns: Icon[][]
  payouts: Payout[]
}

export type GamePhase = 'market' | 'spinning' | 'magic' | 'gameover' | 'win' | 'starvation'

export type SpinMultiplier = 1

export interface PlayerSettings {
  autoConvert: boolean
  animate: boolean
  spinMultiplier: SpinMultiplier
  autoClaim: boolean
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  autoConvert: true,
  animate: true,
  spinMultiplier: 1,
  autoClaim: false,
}

export interface SpinLogEntry {
  spinNumber: number
  multiplier: number
  payouts: Payout[]
  timestamp: number
}

export interface MagicCell {
  icon: Icon
  valueOverride: number | null
}

export interface MagicCounters {
  respin: number
  swap: number
  increaseValue: number
}

export interface GameState {
  version: number
  reel: Reel
  currencies: Currencies
  phase: GamePhase
  lastSpinResult: SpinResult | null
  spinCount: number
  settings: PlayerSettings
  gameLog: SpinLogEntry[]
  magicGrid: MagicCell[][] | null
  blockedColumns: number[]
  magicCounters: MagicCounters
  unlockedAchievements: import('./achievements').AchievementId[]
  pendingMultiplier: SpinMultiplier
  rowCount: 3 | 4 | 5
  initialSpinPayouts: Payout[] | null
}

export type MagicMode = 'respin' | 'swap' | 'block' | 'increaseValue' | null

export type GameAction =
  | { type: 'SPIN'; multiplier: SpinMultiplier }
  | { type: 'BEGIN_MAGIC_PHASE' }
  | { type: 'MAGIC_RESPIN'; colIdx: number }
  | { type: 'MAGIC_SWAP'; fromCol: number; fromRow: number; toCol: number; toRow: number }
  | { type: 'MAGIC_BLOCK_COLUMN'; colIdx: number }
  | { type: 'MAGIC_INCREASE_VALUE'; colIdx: number; rowIdx: number }
  | { type: 'CLAIM' }
  | { type: 'BUY_ICON'; iconDefinitionId: string }
  | { type: 'HARD_RESET' }
  | { type: 'CONTINUE_AFTER_WIN' }
  | { type: 'RESTORE_STATE'; savedState: GameState }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<PlayerSettings> }
  | { type: 'SET_CURRENCY'; currency: CurrencyKey; amount: number }
  | { type: 'PRESTIGE'; keepDefinitionIds: string[] }
  | { type: 'DISMISS_STARVATION' }
