import { useState } from 'react'
import type { Reel } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  reel: Reel
  onPrestige: (keepDefinitionIds: string[]) => void
  isMagicPhase?: boolean
}

export function ReelView({ reel, onPrestige, isMagicPhase = false }: Props) {
  const [prestigeSelecting, setPrestigeSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const countByDefId = new Map<string, number>()
  for (const icon of reel.icons) {
    countByDefId.set(icon.definitionId, (countByDefId.get(icon.definitionId) ?? 0) + 1)
  }

  const eligibleDefIds = [...countByDefId.entries()]
    .filter(([, count]) => count >= 3)
    .map(([defId]) => defId)

  const prestigeAvailable = eligibleDefIds.length >= 4

  function toggleSelected(defId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(defId)) next.delete(defId)
      else next.add(defId)
      return next
    })
  }

  function handleConfirmPrestige() {
    onPrestige([...selected])
    setPrestigeSelecting(false)
    setSelected(new Set())
  }

  function handleCancelPrestige() {
    setPrestigeSelecting(false)
    setSelected(new Set())
  }

  if (prestigeSelecting) {
    return (
      <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400">Select Icons to Keep</h2>
        {isMagicPhase && (
          <p className="text-yellow-400 bg-yellow-900/30 rounded p-2 text-sm">
            Claim your spin before prestiging.
          </p>
        )}
        <p className="text-sm text-gray-300">Select at least 4 icons to keep (must have 3 copies):</p>
        <div className="flex flex-wrap gap-2">
          {eligibleDefIds.map((defId) => {
            const def = ICON_CATALOG[defId]
            const isSelected = selected.has(defId)
            return (
              <button
                key={defId}
                onClick={() => toggleSelected(defId)}
                aria-pressed={isSelected}
                className={`icon-cell relative cursor-pointer ${isSelected ? 'ring-2 ring-indigo-400 bg-indigo-900' : ''}`}
              >
                {def?.emoji ?? defId}
                {def && def.valuePerColumn > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 text-xs text-gray-400 leading-none">×{def.valuePerColumn}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleConfirmPrestige}
            disabled={selected.size < 4 || isMagicPhase}
            className="flex-1 py-2 font-bold rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Prestige ({selected.size} selected)
          </button>
          <button
            onClick={handleCancelPrestige}
            className="flex-1 py-2 font-bold rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400">
          Your Reel ({reel.icons.length} icons)
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...countByDefId.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([defId, count]) => {
            const def = ICON_CATALOG[defId]
            return (
              <div key={defId} className="icon-cell relative">
                {def?.emoji ?? '?'}
                {def && def.valuePerColumn > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 text-xs text-gray-400 leading-none">×{def.valuePerColumn}</span>
                )}
                <span className="absolute top-0 left-0 text-xs font-bold text-white bg-gray-900/70 rounded-br px-0.5 leading-none">
                  {count}
                </span>
              </div>
            )
          })}
      </div>
      {isMagicPhase && (
        <p className="text-yellow-400 bg-yellow-900/30 rounded p-2 text-sm">
          Claim your spin before prestiging.
        </p>
      )}
      <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-500">
          Prestige: once you have 4 or more icon types with 3 copies each, you can
          Prestige — choose which icons to keep (1 copy each), reset your currencies,
          and start fresh with a focused reel. Your spin count is preserved.
        </p>
        <button
          onClick={() => setPrestigeSelecting(true)}
          disabled={!prestigeAvailable || isMagicPhase}
          className="w-full py-2 font-bold rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={prestigeAvailable ? 'Open prestige selection' : 'Prestige not available yet'}
        >
          ✨ Prestige {!prestigeAvailable && `(need ${4 - eligibleDefIds.length} more)`}
        </button>
      </div>
    </div>
  )
}
