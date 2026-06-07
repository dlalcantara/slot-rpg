import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearState } from '@/game/persistence'
import { makeInitialState } from '@/game/initialState'
import { DEFAULT_SETTINGS } from '@/game/types'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveState writes correct JSON to localStorage', () => {
    const state = makeInitialState()
    saveState(state)
    const raw = localStorage.getItem('slot-rpg-state')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(4)
    expect(parsed.currencies.food).toBe(100)
  })

  it('loadState returns parsed GameState when key present', () => {
    const state = makeInitialState()
    saveState(state)
    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.version).toBe(4)
    expect(loaded!.currencies.food).toBe(100)
  })

  it('loadState returns null when key absent', () => {
    expect(loadState()).toBeNull()
  })

  it('loadState returns null when JSON is invalid', () => {
    localStorage.setItem('slot-rpg-state', 'not-json')
    expect(loadState()).toBeNull()
  })

  it('loadState returns null when version mismatches', () => {
    const state = { ...makeInitialState(), version: 999 }
    saveState(state)
    expect(loadState()).toBeNull()
  })

  it('clearState removes the key', () => {
    const state = makeInitialState()
    saveState(state)
    clearState()
    expect(localStorage.getItem('slot-rpg-state')).toBeNull()
  })

  it('persists and restores settings correctly', () => {
    const state = makeInitialState()
    const customSettings = { autoConvert: false, animate: false, spinMultiplier: 10 as const }
    const stateWithSettings = { ...state, settings: customSettings }
    saveState(stateWithSettings)
    const loaded = loadState()
    expect(loaded!.settings.autoConvert).toBe(false)
    expect(loaded!.settings.animate).toBe(false)
    expect(loaded!.settings.spinMultiplier).toBe(10)
  })

  it('persists and restores gameLog correctly', () => {
    const state = makeInitialState()
    const entry = { spinNumber: 1, multiplier: 1 as const, payouts: [], timestamp: 12345 }
    const stateWithLog = { ...state, gameLog: [entry] }
    saveState(stateWithLog)
    const loaded = loadState()
    expect(loaded!.gameLog).toHaveLength(1)
    expect(loaded!.gameLog[0].spinNumber).toBe(1)
  })

  it('discards state with version < 4 (no migration)', () => {
    const v3State = {
      version: 3,
      reel: { icons: [] },
      currencies: { food: 50, copper: 0, silver: 0, gold: 0, crowns: 0 },
      phase: 'market',
      lastSpinResult: null,
      spinCount: 5,
      settings: DEFAULT_SETTINGS,
      gameLog: [],
    }
    localStorage.setItem('slot-rpg-state', JSON.stringify(v3State))
    const loaded = loadState()
    expect(loaded).toBeNull()
  })
})
