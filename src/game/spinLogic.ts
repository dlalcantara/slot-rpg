import type { Icon, Reel, SpinResult, Payout } from './types'
import { ICON_CATALOG } from './catalog'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function extractColumn(icons: Icon[], startOffset: number): Icon[] {
  const len = icons.length
  return [
    icons[startOffset % len],
    icons[(startOffset + 1) % len],
    icons[(startOffset + 2) % len],
  ]
}

export function calculatePayouts(columns: Icon[][]): Payout[] {
  const familyPerColumnValues: Map<string, number[]> = new Map()

  columns.forEach((col) => {
    const familyCounts: Map<string, number> = new Map()
    col.forEach((icon) => {
      const def = ICON_CATALOG[icon.definitionId]
      if (!def || def.family === 'blank') return
      familyCounts.set(def.family, (familyCounts.get(def.family) ?? 0) + def.valuePerColumn)
    })
    familyCounts.forEach((value, family) => {
      if (!familyPerColumnValues.has(family)) familyPerColumnValues.set(family, [])
      familyPerColumnValues.get(family)!.push(value)
    })
  })

  const payouts: Payout[] = []
  familyPerColumnValues.forEach((colValues, family) => {
    if (colValues.length < 5) return // must appear in all 5 columns
    const amount = colValues.reduce((acc, v) => acc * v, 1)
    if (amount === 0) return
    // Find effect from any catalog entry of this family
    const def = Object.values(ICON_CATALOG).find((d) => d.family === family)
    if (!def || def.effect.type === 'none') return
    payouts.push({ family, amount, currency: def.effect.currency })
  })

  return payouts
}

export function computeSpin(reel: Reel): SpinResult {
  const columns: Icon[][] = []
  for (let i = 0; i < 5; i++) {
    const shuffled = shuffle(reel.icons)
    const offset = Math.floor(Math.random() * shuffled.length)
    columns.push(extractColumn(shuffled, offset))
  }
  const payouts = calculatePayouts(columns)
  return { columns, payouts }
}
