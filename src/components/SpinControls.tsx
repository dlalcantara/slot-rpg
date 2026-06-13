import type { PlayerSettings, SpinMultiplier } from '../game/types'

interface Props {
  settings: PlayerSettings
  spinning: boolean
  isMagicPhase: boolean
  onSettingsChange: (patch: Partial<PlayerSettings>) => void
}

const MULTIPLIERS: SpinMultiplier[] = [1]

export function SpinControls({ settings, spinning, isMagicPhase, onSettingsChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      {/* Multiplier toggle */}
      <div className="flex gap-1 items-center">
        {MULTIPLIERS.map((m) => (
          <button
            key={m}
            onClick={() => onSettingsChange({ spinMultiplier: m })}
            disabled={spinning || isMagicPhase}
            className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 ${
              settings.spinMultiplier === m
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            aria-pressed={settings.spinMultiplier === m}
            aria-label={`Spin multiplier ${m}x`}
          >
            x{m}
          </button>
        ))}
      </div>

      {/* Toggles */}
      <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.animate}
          onChange={(e) => onSettingsChange({ animate: e.target.checked })}
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
          className="accent-indigo-500"
          aria-label="Auto-convert money"
        />
        Auto-convert
      </label>
    </div>
  )
}
