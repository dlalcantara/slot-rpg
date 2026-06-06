import type { SpinResult, Icon, Reel } from '../game/types'
import { ReelColumn } from './ReelColumn'

const PLACEHOLDER_ICON: Icon = { id: 'ph', definitionId: 'blank' }
const PLACEHOLDER_COL = [PLACEHOLDER_ICON, PLACEHOLDER_ICON, PLACEHOLDER_ICON]

interface Props {
  lastSpinResult: SpinResult | null
  reel: Reel
  spinning: boolean
  onSpinDone: () => void
}

export function SlotGrid({ lastSpinResult, reel, spinning, onSpinDone }: Props) {
  const columns = lastSpinResult?.columns ?? Array(5).fill(PLACEHOLDER_COL)
  const lastColIndex = columns.length - 1

  return (
    <div
      className="flex gap-2 justify-center p-3 bg-gray-800 rounded-xl border border-gray-700"
      aria-label="Slot machine grid"
    >
      {columns.map((col, i) => (
        <ReelColumn
          key={i}
          icons={col}
          reelIcons={reel.icons}
          spinning={spinning}
          colIndex={i}
          onDone={i === lastColIndex ? onSpinDone : undefined}
        />
      ))}
    </div>
  )
}
