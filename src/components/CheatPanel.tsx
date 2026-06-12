import { useState } from 'react'
import type { Currencies, CurrencyKey } from '../game/types'
import { CURRENCY_REGISTRY, CURRENCY_ORDER } from '../game/currencyRegistry'

interface Props {
  currencies: Currencies
  onSetCurrency: (currency: CurrencyKey, amount: number) => void
  onClose: () => void
}

export function CheatPanel({ currencies, onSetCurrency, onClose }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({})

  function handleApply(key: string) {
    const raw = inputs[key]
    if (raw === undefined || raw === '') return
    const val = Number(raw)
    if (isFinite(val) && val >= 0) {
      onSetCurrency(key as CurrencyKey, val)
    }
    setInputs((prev) => ({ ...prev, [key]: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-fuchsia-600 p-4 max-w-xs w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-fuchsia-300 uppercase tracking-wider">🛠 Dev Cheat</h2>
          <button
            onClick={onClose}
            aria-label="Close cheat panel"
            className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {CURRENCY_ORDER.map((key) => {
            const def = CURRENCY_REGISTRY[key]
            if (!def) return null
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-300 w-16 shrink-0">{def.label}</span>
                <span className="text-xs text-gray-500 w-8">{currencies[key] ?? 0}</span>
                <input
                  type="number"
                  min="0"
                  aria-label={`Set ${def.label}`}
                  value={inputs[key] ?? ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-100 w-0"
                />
                <button
                  onClick={() => handleApply(key)}
                  className="text-xs bg-fuchsia-700 hover:bg-fuchsia-600 text-white rounded px-2 py-0.5 whitespace-nowrap"
                >
                  Set
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
