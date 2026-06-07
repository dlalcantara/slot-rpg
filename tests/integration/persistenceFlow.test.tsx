import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from '@/App'
import { makeInitialState } from '@/game/initialState'
import type { GameState } from '@/game/types'

const mockLoadState = vi.fn(() => null as GameState | null)

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  get loadState() {
    return mockLoadState
  },
  clearState: vi.fn(),
}))

vi.mock('@/game/spinLogic', () => ({
  drawColumn: vi.fn(() => [
    { id: 'c1', definitionId: 'blank' },
    { id: 'c2', definitionId: 'blank' },
    { id: 'c3', definitionId: 'blank' },
  ]),
  calculatePayouts: vi.fn(() => []),
}))

describe('persistence flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockLoadState.mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores state on remount with seeded state from loadState', () => {
    const savedState: GameState = {
      ...makeInitialState(),
      currencies: { food: 77, copper: 3, silver: 0, gold: 0, crowns: 0 },
    }
    mockLoadState.mockReturnValue(savedState)

    render(<App />)
    expect(screen.getByText('77')).toBeInTheDocument()
  })

  it('hard reset returns game to initial state', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
    // Now in magic phase; claim to complete the round and update currency display
    fireEvent.click(screen.getByRole('button', { name: 'Claim spin result' }))
    expect(screen.getByText('99')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /hard reset/i }))
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})
