import type { SpinResult } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  result: SpinResult
}

export function SpinResultToast({ result }: Props) {
  const text = result.payouts.length === 0
    ? 'No match — better luck next time!'
    : result.payouts
        .map((p) => `+${p.amount} ${CURRENCY_REGISTRY[p.currency]?.label ?? p.currency}`)
        .join(', ')

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 shadow-lg max-w-xs"
    >
      <p className="text-sm text-gray-100">{text}</p>
    </div>
  )
}
