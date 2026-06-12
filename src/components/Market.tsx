import type { Currencies, IconDefinition } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'
import { MarketItem } from './MarketItem'

interface Props {
  currencies: Currencies
  onBuy: (definitionId: string) => void
}

const TIER_WEIGHT: Record<string, number> = { copper: 1, silver: 100, gold: 10000 }

function normalizedPrice(def: IconDefinition): number {
  if (!def.cost) return 0
  return (TIER_WEIGHT[def.cost.currency] ?? 0) * def.cost.amount
}

export function Market({ currencies, onBuy }: Props) {
  const forSale = Object.values(ICON_CATALOG)
    .filter((def) => def.cost !== null)
    .sort((a, b) => normalizedPrice(a) - normalizedPrice(b))

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
      <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Market</h3>
      <div role="list" className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {forSale.map((def) => (
          <div key={def.definitionId} role="listitem">
            <MarketItem def={def} currencies={currencies} onBuy={onBuy} />
          </div>
        ))}
      </div>
    </div>
  )
}
