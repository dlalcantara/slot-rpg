import type { Currencies } from '../game/types'
import { CURRENCY_REGISTRY, CURRENCY_ORDER } from '../game/currencyRegistry'

interface Props {
  currencies: Currencies
  spinCount: number
}

const COLOR: Record<string, string> = {
  food: 'text-amber-400',
  copper: 'text-orange-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
  crowns: 'text-purple-400',
  air: 'text-sky-300',
  water: 'text-blue-400',
  earth: 'text-green-600',
  fire: 'text-red-500',
}

export function CurrencyDisplay({ currencies, spinCount }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center p-3 bg-gray-800 rounded-xl border border-gray-700">
      {CURRENCY_ORDER.filter((key) => key !== 'energy').map((key) => {
        const def = CURRENCY_REGISTRY[key]
        if (!def) return null
        return (
          <div key={key} className="flex flex-col items-center min-w-12">
            <span className="text-xs text-gray-400">{def.label}</span>
            <span className={`currency-value text-lg ${COLOR[key] ?? ''}`}>
              {currencies[key] ?? 0}
            </span>
          </div>
        )
      })}
      <div className="flex flex-col items-center min-w-12">
        <span className="text-xs text-gray-400">Spins</span>
        <span className="currency-value text-lg text-gray-300">{spinCount}</span>
      </div>
    </div>
  )
}
