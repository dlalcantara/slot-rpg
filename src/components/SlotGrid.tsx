import { useState } from 'react'
import type { SpinResult, Icon, Reel, MagicCell, GameAction } from '../game/types'
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
  onSpinDone: () => void
  onMagicAction: (action: GameAction) => void
}

type MagicMode = 'respin' | 'swap' | 'lock' | 'increaseValue' | null

export function SlotGrid({
  lastSpinResult,
  magicGrid,
  lockedColumns,
  reel,
  spinning,
  animate,
  isMagicPhase,
  onSpinDone,
  onMagicAction,
}: Props) {
  const [magicMode, setMagicMode] = useState<MagicMode>(null)
  const [swapFrom, setSwapFrom] = useState<{ col: number; row: number } | null>(null)

  // Display: during magic phase show magicGrid, otherwise show lastSpinResult or placeholder
  const displayColumns: Icon[][] = isMagicPhase && magicGrid
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

  function handleCellClick(colIdx: number, rowIdx: number) {
    if (!isMagicPhase) return

    if (magicMode === 'respin' || magicMode === 'lock') return // handled by column click

    if (magicMode === 'swap') {
      if (!swapFrom) {
        setSwapFrom({ col: colIdx, row: rowIdx })
      } else {
        onMagicAction({ type: 'MAGIC_SWAP', fromCol: swapFrom.col, fromRow: swapFrom.row, toCol: colIdx, toRow: rowIdx })
        setSwapFrom(null)
        setMagicMode(null)
      }
      return
    }

    if (magicMode === 'increaseValue') {
      onMagicAction({ type: 'MAGIC_INCREASE_VALUE', colIdx, rowIdx })
      setMagicMode(null)
      return
    }
  }

  function handleColumnClick(colIdx: number) {
    if (!isMagicPhase) return

    if (magicMode === 'respin') {
      onMagicAction({ type: 'MAGIC_RESPIN', colIdx })
      setMagicMode(null)
      return
    }

    if (magicMode === 'lock') {
      onMagicAction({ type: 'MAGIC_LOCK', colIdx })
      setMagicMode(null)
      return
    }
  }

  return (
    <div className="space-y-2">
      {isMagicPhase && (
        <div className="flex gap-1 flex-wrap px-1">
          {(['respin', 'swap', 'lock', 'increaseValue'] as MagicMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMagicMode(magicMode === mode ? null : mode)}
              className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                magicMode === mode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode === 'respin' ? 'Respin' : mode === 'swap' ? 'Swap' : mode === 'lock' ? 'Lock' : 'Boost'}
            </button>
          ))}
          {swapFrom && (
            <span className="text-xs text-amber-400 px-2 py-1">
              Selecting 2nd cell…
            </span>
          )}
        </div>
      )}

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
            onDone={i === lastColIndex ? onSpinDone : undefined}
            onCellClick={(rowIdx) => handleCellClick(i, rowIdx)}
            onColumnClick={() => handleColumnClick(i)}
          />
        ))}
      </div>
    </div>
  )
}
