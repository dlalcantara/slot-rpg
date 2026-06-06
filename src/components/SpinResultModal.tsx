import type { SpinResult } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  result: SpinResult
  onDismiss: () => void
}

export function SpinResultModal({ result, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-100 text-center">Spin Result</h2>

        {result.payouts.length === 0 ? (
          <p className="text-center text-gray-400">No match — better luck next time!</p>
        ) : (
          <ul className="space-y-2">
            {result.payouts.map((payout, i) => {
              const currencyDef = CURRENCY_REGISTRY[payout.currency]
              return (
                <li key={i} className="flex justify-between items-center bg-gray-700 rounded-lg px-4 py-2">
                  <span className="text-gray-300 capitalize">{payout.family}</span>
                  <span className="font-bold text-yellow-400">
                    +{payout.amount} {currencyDef?.label ?? payout.currency}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <button
          onClick={onDismiss}
          className="w-full py-3 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
