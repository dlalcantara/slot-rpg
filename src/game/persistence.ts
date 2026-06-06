import type { GameState } from './types'

const STORAGE_KEY = 'slot-rpg-state'
const CURRENT_VERSION = 1

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
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== CURRENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
