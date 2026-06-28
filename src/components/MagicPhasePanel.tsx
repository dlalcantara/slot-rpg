import type { Currencies, MagicCounters, MagicMode, SpinMultiplier } from '../game/types'

interface Props {
  currencies: Currencies
  magicCounters: MagicCounters
  blockedColumns: number[]
  multiplier: SpinMultiplier
  magicMode: MagicMode
  swapFrom: { col: number; row: number } | null
  onSelectMode: (mode: MagicMode) => void
  onHelp?: () => void
}

function cost(n: number) {
  return n + 1
}

interface ActionRowProps {
  mode: NonNullable<MagicMode>
  label: string
  currencyLabel: string
  currentCost: number
  available: number
  disabled: boolean
  selected: boolean
  onClick: () => void
}

function ActionRow({ mode, label, currencyLabel, currentCost, available, disabled, selected, onClick }: ActionRowProps) {
  void mode
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className={`flex items-center justify-between gap-2 p-2 rounded-lg w-full text-left transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-gray-700'
          : selected
          ? 'bg-purple-700 ring-2 ring-purple-400'
          : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
      }`}
    >
      <div className="text-sm text-gray-200 flex-1">{label}</div>
      <div className="text-xs text-gray-400 whitespace-nowrap">
        {currentCost} {currencyLabel} <span className="text-gray-500">({available} avail)</span>
      </div>
    </button>
  )
}

export function MagicPhasePanel({ currencies, magicCounters, blockedColumns, multiplier, magicMode, swapFrom, onSelectMode, onHelp }: Props) {
  const air = currencies.air ?? 0
  const water = currencies.water ?? 0
  const earth = currencies.earth ?? 0
  const fire = currencies.fire ?? 0

  const respinCost = cost(magicCounters.respin) * multiplier
  const swapCost = cost(magicCounters.swap) * multiplier
  const blockCost = (blockedColumns.length + 1) * multiplier
  const increaseCost = cost(magicCounters.increaseValue) * multiplier

  function toggle(mode: NonNullable<MagicMode>) {
    onSelectMode(magicMode === mode ? null : mode)
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-purple-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">✨ Magic Phase</h3>
        {onHelp && (
          <button
            type="button"
            aria-label="Help: Magic Phase"
            onClick={onHelp}
            className="text-gray-400 hover:text-gray-200 text-sm px-1"
          >
            ❓
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">Click an action below, then act on the grid.</p>

      <div className="space-y-1">
        <ActionRow
          mode="respin"
          label="Respin Column — click a column to respin it"
          currencyLabel="Air"
          currentCost={respinCost}
          available={air}
          disabled={air < respinCost}
          selected={magicMode === 'respin'}
          onClick={() => toggle('respin')}
        />
        <ActionRow
          mode="swap"
          label="Swap Cells — click two adjacent cells to swap"
          currencyLabel="Water"
          currentCost={swapCost}
          available={water}
          disabled={water < swapCost}
          selected={magicMode === 'swap'}
          onClick={() => toggle('swap')}
        />
        <ActionRow
          mode="block"
          label={`Block Column — ${blockedColumns.length}/4 blocked`}
          currencyLabel="Earth"
          currentCost={blockCost}
          available={earth}
          disabled={earth < blockCost || blockedColumns.length >= 4}
          selected={magicMode === 'block'}
          onClick={() => toggle('block')}
        />
        <ActionRow
          mode="increaseValue"
          label="Boost Value — click a cell to increase its value"
          currencyLabel="Fire"
          currentCost={increaseCost}
          available={fire}
          disabled={fire < increaseCost}
          selected={magicMode === 'increaseValue'}
          onClick={() => toggle('increaseValue')}
        />
      </div>

      {magicMode === 'swap' && swapFrom && (
        <p className="text-xs text-amber-400">
          Select 2nd cell to swap (from col {swapFrom.col + 1}, row {swapFrom.row + 1})
        </p>
      )}

      {blockedColumns.length > 0 && (
        <p className="text-xs text-amber-400">
          Blocked: columns {blockedColumns.map((c) => c + 1).join(', ')}
        </p>
      )}
    </div>
  )
}
