import type { Reel } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  reel: Reel
  disabledIconIds: string[]
  onToggleIcon: (iconId: string) => void
}

export function ReelView({ reel, disabledIconIds, onToggleIcon }: Props) {
  const enabledCount = reel.icons.length - disabledIconIds.length
  const canDisable = enabledCount > 12

  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400">
          Your Reel ({reel.icons.length} icons, {enabledCount} enabled)
        </h2>
        {!canDisable && reel.icons.length >= 13 && (
          <span className="text-xs text-amber-400">Min 12 enabled</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {reel.icons.map((icon) => {
          const def = ICON_CATALOG[icon.definitionId]
          const disabled = disabledIconIds.includes(icon.id)
          return (
            <button
              key={icon.id}
              onClick={() => onToggleIcon(icon.id)}
              disabled={!disabled && !canDisable}
              aria-pressed={!disabled}
              aria-label={`${def?.label ?? '?'} — ${disabled ? 'disabled, click to enable' : 'enabled, click to disable'}`}
              className={`icon-cell transition-opacity ${
                disabled ? 'opacity-40' : ''
              } ${!disabled && !canDisable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {def?.label ?? '?'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
