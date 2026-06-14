import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HelpModal } from '@/components/HelpModal'

describe('HelpModal', () => {
  it('renders correct heading for topic "game"', () => {
    render(<HelpModal topic="game" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('About Slot RPG')
  })

  it('renders correct heading for topic "reel"', () => {
    render(<HelpModal topic="reel" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The Reel Tab')
  })

  it('renders correct heading for topic "spin"', () => {
    render(<HelpModal topic="spin" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The Spin Tab')
  })

  it('renders correct heading for topic "market"', () => {
    render(<HelpModal topic="market" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The Reels Store')
  })

  it('renders correct heading for topic "achievements"', () => {
    render(<HelpModal topic="achievements" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Feats')
  })

  it('renders AI attribution paragraph when topic is "game"', () => {
    render(<HelpModal topic="game" onClose={vi.fn()} />)
    expect(screen.getByText(/Claude \(an AI assistant\) was used only for programming this game/)).toBeDefined()
  })

  it('does not render AI attribution when topic is not "game"', () => {
    render(<HelpModal topic="spin" onClose={vi.fn()} />)
    expect(screen.queryByText(/Claude \(an AI assistant\)/)).toBeNull()
  })

  it('renders "Ways to Win" text when topic is "spin"', () => {
    render(<HelpModal topic="spin" onClose={vi.fn()} />)
    expect(screen.getAllByText(/Ways to Win/).length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal topic="game" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
