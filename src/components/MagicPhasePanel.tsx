import type { Currencies, MagicCounters } from '../game/types'

interface Props {
  currencies: Currencies
  magicCounters: MagicCounters
  lockedColumns: number[]
}

function cost(n: number) {
  return n + 1
}

interface ActionRowProps {
  label: string
  currencyLabel: string
  currentCost: number
  available: number
  disabled: boolean
}

function ActionRow({ label, currencyLabel, currentCost, available, disabled }: ActionRowProps) {
  return (
    <div className={`flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-700 ${disabled ? 'opacity-50' : ''}`}>
      <div className="text-sm text-gray-200 flex-1">{label}</div>
      <div className="text-xs text-gray-400 whitespace-nowrap">
        {currentCost} {currencyLabel} <span className="text-gray-500">({available} avail)</span>
      </div>
    </div>
  )
}

export function MagicPhasePanel({ currencies, magicCounters, lockedColumns }: Props) {
  const air = currencies.air ?? 0
  const water = currencies.water ?? 0
  const earth = currencies.earth ?? 0
  const fire = currencies.fire ?? 0

  const respinCost = cost(magicCounters.respin)
  const swapCost = cost(magicCounters.swap)
  const lockCost = lockedColumns.length + 1
  const increaseCost = cost(magicCounters.increaseValue)

  return (
    <div className="bg-gray-800 rounded-xl border border-purple-700 p-3 space-y-2">
      <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">✨ Magic Phase</h3>
      <p className="text-xs text-gray-400">Select actions on the grid, then press CLAIM.</p>

      <div className="space-y-1">
        <ActionRow
          label="Respin Column — click a column to respin it"
          currencyLabel="Air"
          currentCost={respinCost}
          available={air}
          disabled={air < respinCost}
        />
        <ActionRow
          label="Swap Cells — click two adjacent cells to swap"
          currencyLabel="Water"
          currentCost={swapCost}
          available={water}
          disabled={water < swapCost}
        />
        <ActionRow
          label={`Lock Column — ${lockedColumns.length}/3 locked`}
          currencyLabel="Earth"
          currentCost={lockCost}
          available={earth}
          disabled={earth < lockCost || lockedColumns.length >= 3}
        />
        <ActionRow
          label="Boost Value — click a cell to increase its value"
          currencyLabel="Fire"
          currentCost={increaseCost}
          available={fire}
          disabled={fire < increaseCost}
        />
      </div>

      {lockedColumns.length > 0 && (
        <p className="text-xs text-amber-400">
          Locked: columns {lockedColumns.map((c) => c + 1).join(', ')}
        </p>
      )}
    </div>
  )
}
