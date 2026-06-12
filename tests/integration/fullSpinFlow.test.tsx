import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import App from '@/App'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const blankColumn = [
  { id: 'c1', definitionId: 'blank' },
  { id: 'c2', definitionId: 'blank' },
  { id: 'c3', definitionId: 'blank' },
]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDrawColumn = vi.fn(() => blankColumn) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCalculatePayouts = vi.fn(() => [] as { family: string; amount: number; currency: string }[]) as any

vi.mock('@/game/spinLogic', () => ({
  get drawColumn() { return mockDrawColumn },
  get calculatePayouts() { return mockCalculatePayouts },
}))

function advancePastAnimation() {
  act(() => { vi.advanceTimersByTime(5000) })
}

describe('full spin flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(blankColumn)
    mockCalculatePayouts.mockReturnValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows spin button and food counter on load', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Spin the reels' })).toBeInTheDocument()
    expect(screen.getByText(/food/i)).toBeInTheDocument()
  })

  it('food decrements after clicking SPIN (deducted at spin time)', () => {
    render(<App />)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    // Food is deducted synchronously at SPIN action dispatch
    // But displayedCurrencies is frozen during spinning; advance past animation first
    advancePastAnimation()
    // Now in magic phase; click CLAIM to complete round
    fireEvent.click(screen.getByRole('button', { name: 'Claim spin result' }))
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('shows CLAIM button after spin animation completes', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    advancePastAnimation()
    expect(screen.getByRole('button', { name: 'Claim spin result' })).toBeInTheDocument()
  })

  it('shows game over screen when food reaches 0', () => {
    render(<App />)
    for (let i = 0; i < 100; i++) {
      const spinBtn = screen.queryByRole('button', { name: 'Spin the reels' })
      if (!spinBtn || (spinBtn as HTMLButtonElement).disabled) break
      fireEvent.click(spinBtn)
      advancePastAnimation()
      const claimBtn = screen.queryByRole('button', { name: 'Claim spin result' })
      if (claimBtn) fireEvent.click(claimBtn)
    }
    expect(screen.getAllByRole('button', { name: /reset/i }).length).toBeGreaterThan(0)
  })

  it('win modal appears when crowns reach 100 after CLAIM', () => {
    mockCalculatePayouts.mockReturnValue([{ family: 'crown', amount: 100, currency: 'crowns' }])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    advancePastAnimation()
    fireEvent.click(screen.getByRole('button', { name: 'Claim spin result' }))
    expect(screen.getByText(/you win/i)).toBeInTheDocument()
  })

  it('win modal can be dismissed to continue playing', () => {
    mockCalculatePayouts.mockReturnValue([{ family: 'crown', amount: 100, currency: 'crowns' }])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    advancePastAnimation()
    fireEvent.click(screen.getByRole('button', { name: 'Claim spin result' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue Playing' }))
    expect(screen.queryByText(/you win/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spin the reels' })).toBeInTheDocument()
  })
})
