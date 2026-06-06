import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearState } from '@/game/persistence'
import { makeInitialState } from '@/game/initialState'

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
    expect(parsed.version).toBe(2)
    expect(parsed.currencies.food).toBe(100)
  })

  it('loadState returns parsed GameState when key present', () => {
    const state = makeInitialState()
    saveState(state)
    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded!.version).toBe(2)
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
})
