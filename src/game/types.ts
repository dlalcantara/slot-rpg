export type CurrencyKey = 'food' | 'copper' | 'silver' | 'gold' | 'crowns'

export type IconEffect =
  | { type: 'add_currency'; currency: CurrencyKey; valuePerColumn: number }
  | { type: 'none' }

export interface IconDefinition {
  definitionId: string
  family: string
  valuePerColumn: number
  label: string
  effect: IconEffect
  cost: { currency: CurrencyKey; amount: number } | null
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

export type GamePhase = 'market' | 'spinning' | 'gameover' | 'win'

export interface GameState {
  version: number
  reel: Reel
  currencies: Currencies
  phase: GamePhase
  lastSpinResult: SpinResult | null
}
