import type { IconDefinition, Currencies } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  def: IconDefinition
  currencies: Currencies
  canBuyMore: boolean
  onBuy: (definitionId: string) => void
}

function canAfford(currencies: Currencies, currency: string, amount: number): boolean {
  if ((currencies[currency] ?? 0) >= amount) return true
  const def = CURRENCY_REGISTRY[currency]
  if (!def?.convertibleFrom) return false
  const { currency: src, rate } = def.convertibleFrom
  const unitsNeeded = Math.ceil((amount - (currencies[currency] ?? 0)) / rate)
  return canAfford(currencies, src, unitsNeeded)
}

function canAffordMulti(costs: { currency: string; amount: number }[], currencies: Currencies): boolean {
  return costs.every(({ currency, amount }) => canAfford(currencies, currency, amount))
}

function getAltPrice(costCurrency: string, amount: number): string | null {
  if (costCurrency === 'gold') {
    return `${amount * 100} Silver / ${amount * 10000} Copper`
  }
  if (costCurrency === 'silver') {
    return `${amount * 100} Copper`
  }
  return null
}

export function MarketItem({ def, currencies, canBuyMore, onBuy }: Props) {
  const isMultiCost = def.cost === null && def.multiCost !== null

  if (def.cost === null && !isMultiCost) return null

  const affordable = isMultiCost
    ? canAffordMulti(def.multiCost!, currencies)
    : canAfford(currencies, def.cost!.currency, def.cost!.amount)
  const atCap = !canBuyMore

  return (
    <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="icon-cell">{def.label}</span>
        <div>
          <p className="text-sm font-medium">{def.label}</p>
          {isMultiCost ? (
            <p className="text-xs text-gray-400">
              {def.multiCost!.map((c) => {
                const reg = CURRENCY_REGISTRY[c.currency]
                return `${c.amount} ${reg?.label ?? c.currency}`
              }).join(' + ')}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {def.cost!.amount} {CURRENCY_REGISTRY[def.cost!.currency]?.label ?? def.cost!.currency}
              </p>
              {getAltPrice(def.cost!.currency, def.cost!.amount) && (
                <p className="text-xs text-gray-500">{getAltPrice(def.cost!.currency, def.cost!.amount)}</p>
              )}
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onBuy(def.definitionId)}
        disabled={!affordable || atCap}
        className="px-3 py-1 text-sm font-bold rounded-lg bg-green-700 hover:bg-green-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label={`Buy ${def.label}`}
      >
        Buy
      </button>
    </div>
  )
}
