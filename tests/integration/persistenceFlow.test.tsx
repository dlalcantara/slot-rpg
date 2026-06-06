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
  computeSpin: vi.fn(() => ({
    columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
    payouts: [],
  })),
  calculatePayouts: vi.fn(),
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

    // Advance timers so all reel columns finish animating → onSpinDone fires → currency bar updates
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('99')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /hard reset/i }))
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})
