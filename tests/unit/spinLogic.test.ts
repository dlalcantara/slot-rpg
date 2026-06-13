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

describe('drawColumn', () => {
  it('uses icons from the reel', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const column = drawColumn(reel)
    expect(column).toHaveLength(3)
  })

  it('produces 3 icons', () => {
    const reel = makeReel(['apple', 'copper', 'blank'])
    const column = drawColumn(reel)
    expect(column).toHaveLength(3)
  })

  it('returns exactly 4 icons when rowCount=4', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const column = drawColumn(reel, 4)
    expect(column).toHaveLength(4)
  })

  it('returns exactly 5 icons when rowCount=5', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const column = drawColumn(reel, 5)
    expect(column).toHaveLength(5)
  })

  it('wraps correctly for rowCount=4 (all icons from reel)', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const validIds = new Set(['apple', 'copper', 'blank'])
    const column = drawColumn(reel, 4)
    column.forEach((icon) => expect(validIds.has(icon.definitionId)).toBe(true))
  })

  it('wraps correctly for rowCount=5 (all icons from reel)', () => {
    const reel = makeReel(['apple', 'copper', 'blank', 'apple', 'copper'])
    const validIds = new Set(['apple', 'copper', 'blank'])
    const column = drawColumn(reel, 5)
    column.forEach((icon) => expect(validIds.has(icon.definitionId)).toBe(true))
  })

  it('existing 3-row behavior still passes with rowCount=3', () => {
    const reel = makeReel(['apple', 'copper', 'blank'])
    expect(drawColumn(reel, 3)).toHaveLength(3)
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

  it('triple-apple contributes value 2 per column', () => {
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
    expect(foodPayout!.amount).toBe(32) // 2^5
  })
})

// ─── calculatePayouts with requiredColumnCount (T007) ─────────────────────────

describe('calculatePayouts with requiredColumnCount', () => {
  it('icon in 4 of 4 active columns wins when requiredColumnCount=4', () => {
    const columns = makeColumns([
      ['apple'], ['apple'], ['apple'], ['apple'],
    ])
    const payouts = calculatePayouts(columns, undefined, 4)
    expect(payouts.find((p) => p.currency === 'food')).toBeDefined()
  })

  it('icon in 3 of 4 active columns → no payout when requiredColumnCount=4', () => {
    const columns = makeColumns([
      ['apple'], ['apple'], ['apple'], ['blank'],
    ])
    const payouts = calculatePayouts(columns, undefined, 4)
    expect(payouts.find((p) => p.currency === 'food')).toBeUndefined()
  })

  it('defaults to columns.length as requiredColumnCount (5-column behavior preserved)', () => {
    const fiveAppleCols = makeColumns([
      ['apple'], ['apple'], ['apple'], ['apple'], ['apple'],
    ])
    const payoutsFive = calculatePayouts(fiveAppleCols)
    expect(payoutsFive.find((p) => p.currency === 'food')).toBeDefined()

    // 4 of 5 columns → no payout with default
    const fourAppleCols = makeColumns([
      ['apple'], ['apple'], ['apple'], ['apple'], ['blank'],
    ])
    const payoutsFour = calculatePayouts(fourAppleCols)
    expect(payoutsFour.find((p) => p.currency === 'food')).toBeUndefined()
  })
})
