import type { SpinResult, Icon } from '../game/types'
import { ReelColumn } from './ReelColumn'

const PLACEHOLDER_ICON: Icon = { id: 'ph', definitionId: 'blank' }
const PLACEHOLDER_COL = [PLACEHOLDER_ICON, PLACEHOLDER_ICON, PLACEHOLDER_ICON]

interface Props {
  lastSpinResult: SpinResult | null
  spinning: boolean
  onSpinDone: () => void
}

export function SlotGrid({ lastSpinResult, spinning, onSpinDone }: Props) {
  const columns = lastSpinResult?.columns ?? Array(5).fill(PLACEHOLDER_COL)

  return (
    <div
      className="flex gap-2 justify-center p-4 bg-gray-800 rounded-xl border border-gray-700"
      aria-label="Slot machine grid"
    >
      {columns.map((col, i) => (
        <ReelColumn
          key={i}
          icons={col}
          spinning={spinning}
          colIndex={i}
          onDone={i === 4 ? onSpinDone : undefined}
        />
      ))}
    </div>
  )
}
