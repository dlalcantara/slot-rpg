import type { GameState } from './types'

const STORAGE_KEY = 'slot-rpg-state'
const CURRENT_VERSION = 5

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage quota exceeded or unavailable — silently skip
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed.version !== 'number') return null
    if (parsed.version === 4) {
      return { ...(parsed as unknown as GameState), version: 5, disabledIconIds: [] }
    }
    if (parsed.version !== CURRENT_VERSION) return null
    return parsed as unknown as GameState
  } catch {
    return null
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
