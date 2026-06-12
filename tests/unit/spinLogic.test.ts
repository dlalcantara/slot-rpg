import { describe, it, expect } from 'vitest'
import { computeSpin, calculatePayouts, drawColumn } from '@/game/spinLogic'
import type { Icon, Reel } from '@/game/types'

function makeReel(definitionIds: string[]): Reel {
  return {
    icons: definitionIds.map((definitionId, i) => ({ id: `icon-${i}`, definitionId })),
  }
}

function makeColumns(colDefs: string[][]): Icon[][] {
  return colDefs.map((col, ci) =>
    col.map((definitionId, ri) => ({ id: `c${ci}r${ri}`, definitionId })),
  )
}

describe('calculatePayouts — value overrides', () => {
  it('uses override value instead of catalog valuePerColumn', () => {
    const columns = makeColumns([
      ['apple'], ['apple'], ['apple'], ['apple'], ['apple'],
    ])
    // Override icon in col 0, row 0 to value 5
    const overrides = new Map([[columns[0][0].id, 5]])
    const payouts = calculatePayouts(columns, overrides)
    const foodPayout = payouts.find((p) => p.currency === 'food')
    expect(foodPayout!.amount).toBe(5) // 5 * 1 * 1 * 1 * 1
  })

  it('elemental icon appears in all 5 columns → awards elemental currency', () => {
    const columns = makeColumns([['air'], ['air'], ['air'], ['air'], ['air']])
    const payouts = calculatePayouts(columns)
    expect(payouts.find((p) => p.currency === 'air')).toBeDefined()
  })
})

describe('computeSpin', () => {
  it('produces exactly 5 columns each with 3 icons', () => {
    const reel = makeReel(['blank', 'apple', 'copper', 'blank', 'blank'])
    const result = computeSpin(reel)
    expect(result.columns).toHaveLength(5)
    result.columns.forEach((col) => expect(col).toHaveLength(3))
  })

  it('each column only contains icons from the reel', () => {
    const reel = makeReel(['apple', 'copper', 'blank'])
    const result = computeSpin(reel)
    const validIds = new Set(['apple', 'copper', 'blank'])
    result.columns.forEach((col) =>
      col.forEach((icon) => expect(validIds.has(icon.definitionId)).toBe(true)),
    )
  })

  it('blank family never produces a payout', () => {
    const reel = makeReel(['blank', 'blank', 'blank', 'blank', 'blank'])
    const result = computeSpin(reel)
    expect(result.payouts).toHaveLength(0)
  })
})

// ─── drawColumn with disabledIconIds (US1) ────────────────────────────────────

describe('drawColumn with disabledIconIds', () => {
  it('excludes disabled icon ids from drawn results', () => {
    const reel: Reel = {
      icons: [
        { id: 'apple-1', definitionId: 'apple' },
        { id: 'apple-2', definitionId: 'apple' },
        { id: 'copper-1', definitionId: 'copper' },
        { id: 'copper-2', definitionId: 'copper' },
        { id: 'copper-3', definitionId: 'copper' },
        { id: 'copper-4', definitionId: 'copper' },
      ],
    }
    const disabledIconIds = ['apple-1', 'apple-2']

    // Run many times to avoid false positives from randomness
    for (let i = 0; i < 50; i++) {
      const column = drawColumn(reel, disabledIconIds)
      column.forEach((icon) => {
        expect(disabledIconIds).not.toContain(icon.id)
      })
    }
  })

  it('falls back to full reel when all icons are disabled (safety fallback)', () => {
    const reel: Reel = {
      icons: [
        { id: 'apple-1', definitionId: 'apple' },
        { id: 'apple-2', definitionId: 'apple' },
        { id: 'apple-3', definitionId: 'apple' },
      ],
    }
    const disabledIconIds = ['apple-1', 'apple-2', 'apple-3']
    const column = drawColumn(reel, disabledIconIds)
    expect(column).toHaveLength(3)
    column.forEach((icon) => expect(icon.definitionId).toBe('apple'))
  })

  it('uses full pool when disabledIconIds is empty', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const column = drawColumn(reel, [])
    expect(column).toHaveLength(3)
  })
})

describe('calculatePayouts', () => {
  it('computes correct payout product [2,3,1,2,1] = 12 for apple family', () => {
    const columns = makeColumns([
      ['apple', 'apple'],       // value 1+1 = 2
      ['apple', 'apple', 'apple'], // 3
      ['apple'],                   // 1
      ['apple', 'apple'],          // 2
      ['apple'],                   // 1
    ])
    const payouts = calculatePayouts(columns)
    const foodPayout = payouts.find((p) => p.currency === 'food')
    expect(foodPayout).toBeDefined()
    expect(foodPayout!.amount).toBe(12)
  })

  it('icon family absent from any column yields no payout', () => {
    const columns = makeColumns([
      ['apple'],
      ['apple'],
      ['apple'],
      ['apple'],
      ['blank'],
    ])
    const payouts = calculatePayouts(columns)
    expect(payouts.find((p) => p.currency === 'food')).toBeUndefined()
  })

  it('blank family never produces a payout even across all 5 columns', () => {
    const columns = makeColumns([
      ['blank'],
      ['blank'],
      ['blank'],
      ['blank'],
      ['blank'],
    ])
    expect(calculatePayouts(columns)).toHaveLength(0)
  })

  it('triple-apple contributes value 3 per column', () => {
    const columns = makeColumns([
      ['triple-apple'],
      ['triple-apple'],
      ['triple-apple'],
      ['triple-apple'],
      ['triple-apple'],
    ])
    const payouts = calculatePayouts(columns)
    const foodPayout = payouts.find((p) => p.currency === 'food')
    expect(foodPayout).toBeDefined()
    expect(foodPayout!.amount).toBe(243) // 3^5
  })
})
