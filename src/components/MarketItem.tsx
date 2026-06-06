import type { IconDefinition, Currencies } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  def: IconDefinition
  currencies: Currencies
  onBuy: (definitionId: string) => void
}

function canAfford(def: IconDefinition, currencies: Currencies): boolean {
  if (!def.cost) return false
  const { currency: costKey, amount } = def.cost
  if ((currencies[costKey] ?? 0) >= amount) return true
  // Check downward conversion chain
  const costDef = CURRENCY_REGISTRY[costKey]
  if (!costDef?.convertibleFrom) return false
  const { currency: sourceKey, rate } = costDef.convertibleFrom
  const shortfall = amount - (currencies[costKey] ?? 0)
  const unitsNeeded = Math.ceil(shortfall / rate)
  return (currencies[sourceKey] ?? 0) >= unitsNeeded
}

export function MarketItem({ def, currencies, onBuy }: Props) {
  if (!def.cost) return null
  const affordable = canAfford(def, currencies)
  const costDef = CURRENCY_REGISTRY[def.cost.currency]

  return (
    <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="icon-cell">{def.label}</span>
        <div>
          <p className="text-sm font-medium">{def.label}</p>
          <p className="text-xs text-gray-400">
            {def.cost.amount} {costDef?.label ?? def.cost.currency}
          </p>
        </div>
      </div>
      <button
        onClick={() => onBuy(def.definitionId)}
        disabled={!affordable}
        className="px-3 py-1 text-sm font-bold rounded-lg bg-green-700 hover:bg-green-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label={`Buy ${def.label}`}
      >
        Buy
      </button>
    </div>
  )
}
