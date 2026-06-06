import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '@/App'
import type { SpinResult } from '@/game/types'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const defaultSpin: SpinResult = {
  columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
  payouts: [],
}
const mockComputeSpin = vi.fn(() => defaultSpin)

vi.mock('@/game/spinLogic', () => ({
  get computeSpin() {
    return mockComputeSpin
  },
  calculatePayouts: vi.fn(),
}))

describe('full spin flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockComputeSpin.mockReturnValue({
      columns: Array(5).fill([{ id: 'c1', definitionId: 'blank' }]),
      payouts: [],
    })
  })

  it('shows spin button and food counter on load', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /spin/i })).toBeInTheDocument()
    expect(screen.getByText(/food/i)).toBeInTheDocument()
  })

  it('food decrements after clicking SPIN', () => {
    render(<App />)
    expect(screen.getByText('100')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('shows game over screen when food reaches 0', () => {
    render(<App />)
    const spinBtn = screen.getByRole('button', { name: /spin/i })
    for (let i = 0; i < 100; i++) {
      if ((spinBtn as HTMLButtonElement).disabled) break
      fireEvent.click(spinBtn)
    }
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('win modal appears when crowns reach 100', () => {
    const winSpin: SpinResult = {
      columns: Array(5).fill([{ id: 'w1', definitionId: 'crown' }]),
      payouts: [{ family: 'crown', amount: 100, currency: 'crowns' }],
    }
    mockComputeSpin.mockReturnValueOnce(winSpin)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    expect(screen.getByText(/you win/i)).toBeInTheDocument()
  })

  it('win modal can be dismissed to continue playing', () => {
    const winSpin: SpinResult = {
      columns: Array(5).fill([{ id: 'w1', definitionId: 'crown' }]),
      payouts: [{ family: 'crown', amount: 100, currency: 'crowns' }],
    }
    mockComputeSpin.mockReturnValueOnce(winSpin)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /spin/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.queryByText(/you win/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spin/i })).toBeInTheDocument()
  })
})
