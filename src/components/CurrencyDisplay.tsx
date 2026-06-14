import type { Currencies } from '../game/types'
import { CURRENCY_REGISTRY, CURRENCY_ORDER, CURRENCY_EMOJI, SPINS_EMOJI } from '../game/currencyRegistry'

interface Props {
  currencies: Currencies
  spinCount: number
}

export function CurrencyDisplay({ currencies, spinCount }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-gray-800 rounded-xl border border-gray-700">
      {CURRENCY_ORDER.filter((key) => key !== 'energy').map((key) => {
        const def = CURRENCY_REGISTRY[key]
        if (!def) return null
        return (
          <div key={key} data-testid="currency-cell" className="flex flex-col items-center">
            <span className="text-lg leading-none">{CURRENCY_EMOJI[key]}</span>
            <span className="text-xs text-gray-400">{def.label}</span>
            <span className="currency-value text-sm font-bold">{currencies[key] ?? 0}</span>
          </div>
        )
      })}
      <div data-testid="currency-cell" className="flex flex-col items-center">
        <span className="text-lg leading-none">{SPINS_EMOJI}</span>
        <span className="text-xs text-gray-400">Spins</span>
        <span className="currency-value text-sm font-bold">{spinCount}</span>
      </div>
    </div>
  )
}
