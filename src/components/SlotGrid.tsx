import type { SpinResult, Icon, Reel, MagicCell, GameAction, MagicMode } from '../game/types'
import { ReelColumn } from './ReelColumn'

const PLACEHOLDER_ICON: Icon = { id: 'ph', definitionId: 'blank' }
const PLACEHOLDER_COL = [PLACEHOLDER_ICON, PLACEHOLDER_ICON, PLACEHOLDER_ICON]

interface Props {
  lastSpinResult: SpinResult | null
  magicGrid: MagicCell[][] | null
  lockedColumns: number[]
  reel: Reel
  spinning: boolean
  animate: boolean
  isMagicPhase: boolean
  magicMode?: MagicMode
  swapFrom?: { col: number; row: number } | null
  respinTokens?: number[]
  onSpinDone: () => void
  onMagicAction: (action: GameAction) => void
  onModeChange?: (mode: MagicMode) => void
  onSwapFrom?: (coords: { col: number; row: number } | null) => void
}

export function SlotGrid({
  lastSpinResult,
  magicGrid,
  lockedColumns,
  reel,
  spinning,
  animate,
  isMagicPhase,
  magicMode = null,
  swapFrom = null,
  respinTokens = [0, 0, 0, 0, 0],
  onSpinDone,
  onMagicAction,
  onModeChange = () => {},
  onSwapFrom = () => {},
}: Props) {
  // Display: use magicGrid whenever present (populated on SPIN), else lastSpinResult or placeholder.
  // This ensures columns settle on the real result during the spinning phase (US1 fix).
  const displayColumns: Icon[][] = magicGrid
    ? magicGrid.map((col) => col.map((cell) => cell.icon))
    : (lastSpinResult?.columns ?? Array(5).fill(PLACEHOLDER_COL))

  const valueOverrides: Map<string, number> = isMagicPhase && magicGrid
    ? (() => {
        const m = new Map<string, number>()
        for (const col of magicGrid) {
          for (const cell of col) {
            if (cell.valueOverride !== null) m.set(cell.icon.id, cell.valueOverride)
          }
        }
        return m
      })()
    : new Map()

  const lastColIndex = displayColumns.length - 1
  const isTargetingMode = magicMode === 'respin' || magicMode === 'lock'

  function handleCellClick(colIdx: number, rowIdx: number) {
    if (!isMagicPhase) return

    if (magicMode === 'respin' || magicMode === 'lock') return

    if (magicMode === 'swap') {
      if (!swapFrom) {
        onSwapFrom({ col: colIdx, row: rowIdx })
      } else {
        onMagicAction({ type: 'MAGIC_SWAP', fromCol: swapFrom.col, fromRow: swapFrom.row, toCol: colIdx, toRow: rowIdx })
        onSwapFrom(null)
        onModeChange(null)
      }
      return
    }

    if (magicMode === 'increaseValue') {
      onMagicAction({ type: 'MAGIC_INCREASE_VALUE', colIdx, rowIdx })
      onModeChange(null)
      return
    }
  }

  function handleColumnClick(colIdx: number) {
    if (!isMagicPhase) return

    if (magicMode === 'respin') {
      onMagicAction({ type: 'MAGIC_RESPIN', colIdx })
      onModeChange(null)
      return
    }

    if (magicMode === 'lock') {
      onMagicAction({ type: 'MAGIC_LOCK', colIdx })
      onModeChange(null)
      return
    }
  }

  return (
    <div
      className="flex gap-2 justify-center p-3 bg-gray-800 rounded-xl border border-gray-700"
      aria-label="Slot machine grid"
    >
      {displayColumns.map((col, i) => (
        <ReelColumn
          key={i}
          icons={col}
          valueOverrides={valueOverrides}
          reelIcons={reel.icons}
          spinning={spinning}
          animate={animate}
          colIndex={i}
          locked={lockedColumns.includes(i)}
          isMagicPhase={isMagicPhase}
          respinToken={respinTokens[i] ?? 0}
          isTargetingMode={isTargetingMode}
          onDone={i === lastColIndex ? onSpinDone : undefined}
          onCellClick={(rowIdx) => handleCellClick(i, rowIdx)}
          onColumnClick={() => handleColumnClick(i)}
        />
      ))}
    </div>
  )
}
