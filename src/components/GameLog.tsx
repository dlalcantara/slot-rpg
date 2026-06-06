import type { SpinLogEntry } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  entries: SpinLogEntry[]
}

function formatPayouts(payouts: SpinLogEntry['payouts']): string {
  if (payouts.length === 0) return 'No match'
  return payouts
    .map((p) => {
      const label = CURRENCY_REGISTRY[p.currency]?.label ?? p.currency
      return `+${p.amount} ${label}`
    })
    .join(', ')
}

export function GameLog({ entries }: Props) {
  if (entries.length === 0) return null

  return (
    <div className="mt-3 bg-gray-800 rounded-xl border border-gray-700 p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Spins</h3>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {entries.map((entry, i) => (
          <li
            key={i}
            className="flex justify-between text-xs py-1 border-b border-gray-700 last:border-0"
          >
            <span className="text-gray-400">
              Spin #{entry.spinNumber}
              {entry.multiplier > 1 && (
                <span className="ml-1 text-indigo-400 font-bold">(x{entry.multiplier})</span>
              )}
            </span>
            <span className={entry.payouts.length > 0 ? 'text-yellow-400' : 'text-gray-500'}>
              {formatPayouts(entry.payouts)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
