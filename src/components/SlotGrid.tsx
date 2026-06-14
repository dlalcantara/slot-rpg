import type { SpinResult, Icon, Reel, MagicCell, GameAction, MagicMode } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'
import { ReelColumn } from './ReelColumn'

const PLACEHOLDER_ICON: Icon = { id: 'ph', definitionId: 'blank' }

interface Props {
  lastSpinResult: SpinResult | null
  magicGrid: MagicCell[][] | null
  blockedColumns: number[]
  reel: Reel
  rowCount: number
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

function computeHighlights(
  grid: MagicCell[][],
  blockedCols: number[],
): Map<string, 'green' | 'yellow'> {
  const activeCount = grid.length - blockedCols.length
  const familyColSets = new Map<string, Set<number>>()
  grid.forEach((col, colIdx) => {
    if (blockedCols.includes(colIdx)) return
    col.forEach((cell) => {
      const family = ICON_CATALOG[cell.icon.definitionId]?.family ?? 'blank'
      if (family === 'blank') return
      if (!familyColSets.has(family)) familyColSets.set(family, new Set())
      familyColSets.get(family)!.add(colIdx)
    })
  })
  const map = new Map<string, 'green' | 'yellow'>()
  grid.forEach((col) => {
    col.forEach((cell) => {
      const defId = cell.icon.definitionId
      const family = ICON_CATALOG[defId]?.family ?? 'blank'
      if (family === 'blank') return
      const colSet = familyColSets.get(family)
      if (!colSet) return
      if (colSet.size === activeCount) map.set(defId, 'green')
      else if (colSet.size === activeCount - 1) map.set(defId, 'yellow')
    })
  })
  return map
}

export function SlotGrid({
  lastSpinResult,
  magicGrid,
  blockedColumns,
  reel,
  rowCount,
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
  const placeholderCol = Array(rowCount).fill(PLACEHOLDER_ICON)
  const lastCols = lastSpinResult?.columns
  const displayColumns: Icon[][] = magicGrid
    ? magicGrid.map((col) => col.map((cell) => cell.icon))
    : lastCols && lastCols[0]?.length === rowCount
      ? lastCols
      : Array(5).fill(placeholderCol)

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

  const highlights: Map<string, 'green' | 'yellow'> = isMagicPhase && magicGrid
    ? computeHighlights(magicGrid, blockedColumns)
    : new Map()

  const lastColIndex = displayColumns.length - 1
  const isTargetingMode = magicMode === 'respin' || magicMode === 'block'

  function handleCellClick(colIdx: number, rowIdx: number) {
    if (!isMagicPhase) return

    if (magicMode === 'respin' || magicMode === 'block') return

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

    if (magicMode === 'block') {
      onMagicAction({ type: 'MAGIC_BLOCK_COLUMN', colIdx })
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
          blocked={blockedColumns.includes(i)}
          highlights={highlights}
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
