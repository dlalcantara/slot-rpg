import type { MagicCell } from './types'

const ELEMENTAL_FAMILIES = ['air', 'water', 'earth', 'fire'] as const
const MIN_COUNT = 3

export function detectMasterOfElements(grid: MagicCell[][]): boolean {
  const counts: Record<string, number> = { air: 0, water: 0, earth: 0, fire: 0 }
  for (const col of grid) {
    for (const cell of col) {
      const id = cell.icon.definitionId
      if (id in counts) counts[id]++
    }
  }
  return ELEMENTAL_FAMILIES.every((f) => counts[f] >= MIN_COUNT)
}
