import type { Currencies } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'
import { MarketItem } from './MarketItem'

interface Props {
  currencies: Currencies
  onBuy: (definitionId: string) => void
}

export function Market({ currencies, onBuy }: Props) {
  const forSale = Object.values(ICON_CATALOG).filter((def) => def.cost !== null)

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
      <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Market</h3>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {forSale.map((def) => (
          <MarketItem key={def.definitionId} def={def} currencies={currencies} onBuy={onBuy} />
        ))}
      </div>
    </div>
  )
}
