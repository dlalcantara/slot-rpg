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

function extractColumn(icons: Icon[], startOffset: number, rowCount: number): Icon[] {
  const len = icons.length
  const result: Icon[] = []
  for (let i = 0; i < rowCount; i++) {
    result.push(icons[(startOffset + i) % len])
  }
  return result
}

export function drawColumn(reel: Reel, rowCount = 3): Icon[] {
  const pool = reel.icons.length > 0 ? reel.icons : reel.icons
  const shuffled = shuffle(pool)
  const offset = Math.floor(Math.random() * shuffled.length)
  return extractColumn(shuffled, offset, rowCount)
}

export function calculatePayouts(
  columns: Icon[][],
  overrides?: Map<string, number>,
  requiredColumnCount = columns.length,
): Payout[] {
  const familyPerColumnValues: Map<string, number[]> = new Map()

  columns.forEach((col) => {
    const familyCounts: Map<string, number> = new Map()
    col.forEach((icon) => {
      const def = ICON_CATALOG[icon.definitionId]
      if (!def || def.family === 'blank') return
      const value = overrides?.get(icon.id) ?? def.valuePerColumn
      familyCounts.set(def.family, (familyCounts.get(def.family) ?? 0) + value)
    })
    familyCounts.forEach((value, family) => {
      if (!familyPerColumnValues.has(family)) familyPerColumnValues.set(family, [])
      familyPerColumnValues.get(family)!.push(value)
    })
  })

  const payouts: Payout[] = []
  familyPerColumnValues.forEach((colValues, family) => {
    if (colValues.length < requiredColumnCount) return
    const amount = colValues.reduce((acc, v) => acc * v, 1)
    if (amount === 0) return
    const def = Object.values(ICON_CATALOG).find((d) => d.family === family)
    if (!def || def.effect.type === 'none') return
    payouts.push({ family, amount, currency: def.effect.currency })
  })

  return payouts
}

export function computeSpin(reel: Reel, rowCount = 3): SpinResult {
  const columns: Icon[][] = []
  for (let i = 0; i < 5; i++) {
    columns.push(drawColumn(reel, rowCount))
  }
  const payouts = calculatePayouts(columns)
  return { columns, payouts }
}
