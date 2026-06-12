import { describe, it, expect } from 'vitest'
import { makeInitialState } from '@/game/initialState'

describe('initial state (US7)', () => {
  it('new game deck contains exactly air, water, apple, copper (4 symbols)', () => {
    const state = makeInitialState()
    const defIds = state.reel.icons.map((i) => i.definitionId)
    expect(defIds).toHaveLength(4)
    expect(defIds).toContain('air')
    expect(defIds).toContain('water')
    expect(defIds).toContain('apple')
    expect(defIds).toContain('copper')
  })

  it('new game deck does NOT contain blank', () => {
    const state = makeInitialState()
    const defIds = state.reel.icons.map((i) => i.definitionId)
    expect(defIds).not.toContain('blank')
  })

  it('new game starts with air=10', () => {
    const state = makeInitialState()
    expect(state.currencies.air).toBe(10)
  })

  it('new game starts with water=10', () => {
    const state = makeInitialState()
    expect(state.currencies.water).toBe(10)
  })

  it('new game starts with food=100', () => {
    const state = makeInitialState()
    expect(state.currencies.food).toBe(100)
  })
})
