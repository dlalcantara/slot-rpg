import type { Reel } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  reel: Reel
}

export function ReelView({ reel }: Props) {
  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Your Reel ({reel.icons.length} icons)</h2>
      <div className="flex flex-wrap gap-2">
        {reel.icons.map((icon, i) => {
          const def = ICON_CATALOG[icon.definitionId]
          return (
            <div key={`${icon.id}-${i}`} className="icon-cell">
              {def?.label ?? '?'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
