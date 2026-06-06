import type { GamePhase, Currencies } from '../game/types'
import { CURRENCY_REGISTRY } from '../game/currencyRegistry'

interface Props {
  phase: GamePhase
  currencies: Currencies
  spinning: boolean
  onSpin: () => void
}

function canSpin(phase: GamePhase, currencies: Currencies): boolean {
  if (phase !== 'market') return false
  for (const def of Object.values(CURRENCY_REGISTRY)) {
    if (def.lossCondition && (currencies[def.key] ?? 0) <= def.lossCondition.threshold) {
      return false
    }
  }
  return true
}

export function SpinButton({ phase, currencies, spinning, onSpin }: Props) {
  const enabled = canSpin(phase, currencies) && !spinning
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
