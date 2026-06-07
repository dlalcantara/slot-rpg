import { describe, it, expect } from 'vitest'
import { detectMasterOfElements } from '@/game/masterOfElements'
import type { MagicCell } from '@/game/types'

function cell(definitionId: string): MagicCell {
  return { icon: { id: `${definitionId}-${Math.random()}`, definitionId }, valueOverride: null }
}

function makeGrid(definitionIds: string[][]): MagicCell[][] {
  return definitionIds.map((col) => col.map(cell))
}

describe('detectMasterOfElements', () => {
  it('returns true when each element appears exactly 3 times across a 5x3 grid', () => {
    // 5 columns × 3 rows = 15 cells; 3 of each element = 12, 3 blank
    const grid = makeGrid([
      ['air', 'water', 'earth'],
      ['fire', 'air', 'water'],
      ['earth', 'fire', 'air'],
      ['water', 'earth', 'fire'],
      ['blank', 'blank', 'blank'],
    ])
    expect(detectMasterOfElements(grid)).toBe(true)
  })

  it('returns true when each element appears more than 3 times', () => {
    const grid = makeGrid([
      ['air', 'air', 'water'],
      ['water', 'earth', 'earth'],
      ['fire', 'fire', 'air'],
      ['water', 'earth', 'fire'],
      ['air', 'water', 'earth'],
    ])
    expect(detectMasterOfElements(grid)).toBe(true)
  })

  it('returns false when one element is missing entirely', () => {
    const grid = makeGrid([
      ['air', 'air', 'air'],
      ['water', 'water', 'water'],
      ['earth', 'earth', 'earth'],
      ['blank', 'blank', 'blank'],
      ['blank', 'blank', 'blank'],
    ])
    expect(detectMasterOfElements(grid)).toBe(false)
  })

  it('returns false when one element has fewer than 3', () => {
    const grid = makeGrid([
      ['air', 'air', 'air'],
      ['water', 'water', 'water'],
      ['earth', 'earth', 'earth'],
      ['fire', 'fire', 'blank'],   // only 2 fire
      ['blank', 'blank', 'blank'],
    ])
    expect(detectMasterOfElements(grid)).toBe(false)
  })

  it('returns false on all-blank grid', () => {
    const grid = makeGrid(Array(5).fill(['blank', 'blank', 'blank']))
    expect(detectMasterOfElements(grid)).toBe(false)
  })
})
