import { describe, it, expect } from 'vitest'
import { computeSpin, calculatePayouts } from '@/game/spinLogic'
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
