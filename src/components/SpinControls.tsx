import type { PlayerSettings } from '../game/types'

interface Props {
  settings: PlayerSettings
  spinning: boolean
  isMagicPhase: boolean
  onSettingsChange: (patch: Partial<PlayerSettings>) => void
}

export function SpinControls({ settings, spinning, isMagicPhase, onSettingsChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.animate}
          onChange={(e) => onSettingsChange({ animate: e.target.checked })}
          disabled={spinning || isMagicPhase}
          className="accent-indigo-500"
          aria-label="Animate reels"
        />
        Animate
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.autoConvert}
          onChange={(e) => onSettingsChange({ autoConvert: e.target.checked })}
          disabled={spinning || isMagicPhase}
          className="accent-indigo-500"
          aria-label="Auto-convert money"
        />
        Auto-convert
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.autoClaim ?? false}
          onChange={(e) => onSettingsChange({ autoClaim: e.target.checked })}
          disabled={spinning || isMagicPhase}
          className="accent-indigo-500"
          aria-label="Auto-claim"
        />
        Auto-claim
      </label>
    </div>
  )
}
