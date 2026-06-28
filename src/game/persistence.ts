import type { GameState } from './types'

const STORAGE_KEY = 'slot-rpg-state'
const CURRENT_VERSION = 6

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { disabledIconIds: _d, ...rest4 } = parsed as Record<string, unknown>
      return { ...(rest4 as unknown as GameState), version: 5, blockedColumns: [] }
    }
    if (parsed.version === 5) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { disabledIconIds: _d, lockedColumns: _l, ...rest5 } = parsed as Record<string, unknown>
      return { ...(rest5 as unknown as GameState), version: 6, blockedColumns: [] }
    }
    if (parsed.version !== CURRENT_VERSION) return null
    const state = parsed as unknown as GameState & { masterOfElements?: unknown }
    delete state.masterOfElements
    if (!Array.isArray(state.unlockedAchievements)) state.unlockedAchievements = []
    if (state.settings?.spinMultiplier !== 1) {
      state.settings = { ...state.settings, spinMultiplier: 1 }
    }
    if (state.rowCount == null) state.rowCount = 3
    if (!Object.prototype.hasOwnProperty.call(state.settings ?? {}, 'autoClaim')) {
      state.settings = { ...state.settings, autoClaim: false }
    }
    if (!Object.prototype.hasOwnProperty.call(state, 'initialSpinPayouts')) state.initialSpinPayouts = null
    state.unlockedAchievements = state.unlockedAchievements
      .filter((id) => (id as string) !== 'ancient-civilization')
      .map((id) => (id as string) === 'wip1' ? 'sweet' : (id as string) === 'wip2' ? 'nice' : id) as typeof state.unlockedAchievements
    return state
  } catch {
    return null
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
