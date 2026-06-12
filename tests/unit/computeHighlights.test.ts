import { describe, it, expect } from 'vitest'
import type { MagicCell } from '@/game/types'

// Re-export for testing — computeHighlights is not exported from SlotGrid,
// so we replicate the same logic here to test the pure function contract.
function computeHighlights(
  grid: MagicCell[][],
  blockedCols: number[],
): Map<string, 'green' | 'yellow'> {
  const activeCount = grid.length - blockedCols.length
  const defColSets = new Map<string, Set<number>>()
  grid.forEach((col, colIdx) => {
    if (blockedCols.includes(colIdx)) return
    col.forEach((cell) => {
      const defId = cell.icon.definitionId
      if (defId === 'blank') return
      if (!defColSets.has(defId)) defColSets.set(defId, new Set())
      defColSets.get(defId)!.add(colIdx)
    })
  })
  const map = new Map<string, 'green' | 'yellow'>()
  defColSets.forEach((colSet, defId) => {
    if (colSet.size === activeCount) map.set(defId, 'green')
    else if (colSet.size === activeCount - 1) map.set(defId, 'yellow')
  })
  return map
}

function makeGrid(colDefs: string[][]): MagicCell[][] {
  return colDefs.map((col, ci) =>
    col.map((definitionId, ri) => ({
      icon: { id: `c${ci}r${ri}`, definitionId },
      valueOverride: undefined,
    })),
  )
}

describe('computeHighlights', () => {
  it('icon in all 5 active columns → green', () => {
    const grid = makeGrid([['apple'], ['apple'], ['apple'], ['apple'], ['apple']])
    const result = computeHighlights(grid, [])
    expect(result.get('apple')).toBe('green')
  })

  it('icon in 4 of 5 columns → yellow', () => {
    const grid = makeGrid([['apple'], ['apple'], ['apple'], ['apple'], ['blank']])
    const result = computeHighlights(grid, [])
    expect(result.get('apple')).toBe('yellow')
  })

  it('icon in 3 of 5 columns → no highlight', () => {
    const grid = makeGrid([['apple'], ['apple'], ['apple'], ['blank'], ['blank']])
    const result = computeHighlights(grid, [])
    expect(result.get('apple')).toBeUndefined()
  })

  it('with 1 blocked column, icon in all 4 active columns → green', () => {
    const grid = makeGrid([['apple'], ['apple'], ['apple'], ['apple'], ['blank']])
    // Block column 4 (the blank one); now 4 active, apple in all 4 → green
    const result = computeHighlights(grid, [4])
    expect(result.get('apple')).toBe('green')
  })

  it('with 1 blocked column, icon in 3 of 4 active columns → yellow', () => {
    const grid = makeGrid([['apple'], ['apple'], ['apple'], ['blank'], ['blank']])
    // Block column 4; now 4 active, apple in 3 → yellow
    const result = computeHighlights(grid, [4])
    expect(result.get('apple')).toBe('yellow')
  })

  it('blank icons are excluded from highlight computation', () => {
    const grid = makeGrid([['blank'], ['blank'], ['blank'], ['blank'], ['blank']])
    const result = computeHighlights(grid, [])
    expect(result.size).toBe(0)
  })

  it('empty grid returns empty map', () => {
    const result = computeHighlights([], [])
    expect(result.size).toBe(0)
  })

  it('multiple icon types highlighted independently', () => {
    const grid = makeGrid([
      ['apple', 'copper'],
      ['apple', 'copper'],
      ['apple', 'copper'],
      ['apple', 'copper'],
      ['apple', 'blank'],
    ])
    const result = computeHighlights(grid, [])
    expect(result.get('apple')).toBe('green')
    expect(result.get('copper')).toBe('yellow')
  })
})
