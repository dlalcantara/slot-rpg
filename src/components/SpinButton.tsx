import type { GamePhase, Currencies, SpinMultiplier } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  phase: GamePhase
  currencies: Currencies
  spinning: boolean
  multiplier: SpinMultiplier
  onSpin: () => void
}

function canSpin(phase: GamePhase, currencies: Currencies, multiplier: SpinMultiplier): boolean {
  if (phase !== 'market') return false
  if ((currencies.food ?? 0) < multiplier) return false
  for (const def of Object.values(CURRENCY_REGISTRY)) {
    if (def.lossCondition && (currencies[def.key] ?? 0) <= def.lossCondition.threshold) {
      return false
    }
  }
  return true
}

export function SpinButton({ phase, currencies, spinning, multiplier, onSpin }: Props) {
  const enabled = canSpin(phase, currencies, multiplier) && !spinning
  return (
    <button
      onClick={onSpin}
      disabled={!enabled}
      className="w-full py-4 text-2xl font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      aria-label="Spin the reels"
    >
      🎰 SPIN
    </button>
  )
}
