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

  // T006: US1 — spin topic updated content
  describe('spin topic — worked example and updated content', () => {
    it('spin body contains multiplied Apple count from example', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      const body = document.querySelector('.text-sm.text-gray-300')
      expect(body?.textContent).toMatch(/2 × 1/)
    })

    it('spin body contains "4" (Apple count in example)', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.getByText(/4 🍎 Apples/)).toBeDefined()
    })

    it('spin body contains Air and indicates it does not pay out', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.getByText(/Air does not pay out/)).toBeDefined()
      expect(screen.getByText(/not present in every column/)).toBeDefined()
    })

    it('spin body contains "Reels Store"', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.getAllByText(/Reels Store/).length).toBeGreaterThan(0)
    })

    it('spin body does NOT contain old optional-actions bullet "Respin a column to re-roll"', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.queryByText(/Respin a column to re-roll/)).toBeNull()
    })

    it('spin body does NOT contain old "Swap two icons between positions" bullet', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.queryByText(/Swap two icons between positions/)).toBeNull()
    })

    it('spin body does NOT contain old "Block a column to exclude" bullet', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.queryByText(/Block a column to exclude it from the payout/)).toBeNull()
    })

    it('spin body does NOT contain old "Increase Value" bullet', () => {
      render(<HelpModal topic="spin" onClose={vi.fn()} />)
      expect(screen.queryByText(/Increase Value to double/)).toBeNull()
    })
  })

  // T015: US2 — magic topic
  describe('magic topic — new help panel', () => {
    it('renders heading "The Magic Phase"', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The Magic Phase')
    })

    it('magic body contains "elemental"', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByText(/elemental/i)).toBeDefined()
    })

    it('magic body contains Respin action', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByText(/Respin/)).toBeDefined()
    })

    it('magic body contains Swap action', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByText(/Swap/)).toBeDefined()
    })

    it('magic body contains Block action', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByText(/Block/)).toBeDefined()
    })

    it('magic body contains Boost Value action', () => {
      render(<HelpModal topic="magic" onClose={vi.fn()} />)
      expect(screen.getByText(/Boost Value/)).toBeDefined()
    })
  })

  // T019: US3 — market topic Reel tab reference
  describe('market topic — Reel tab reference', () => {
    it('market body contains Reel tab reference', () => {
      render(<HelpModal topic="market" onClose={vi.fn()} />)
      const body = document.querySelector('.text-sm.text-gray-300')
      expect(body?.textContent).toMatch(/Reel.*tab/i)
    })

    it('market body mentions current icons in slot machine', () => {
      render(<HelpModal topic="market" onClose={vi.fn()} />)
      expect(screen.getByText(/icons currently in your slot machine/i)).toBeDefined()
    })
  })

  // T021: US4 — game topic non-idle and Feats
  describe('game topic — non-idle and Feats content', () => {
    it('game body contains "non-idle"', () => {
      render(<HelpModal topic="game" onClose={vi.fn()} />)
      expect(screen.getByText(/non-idle/)).toBeDefined()
    })

    it('game body contains "Feats"', () => {
      render(<HelpModal topic="game" onClose={vi.fn()} />)
      const bodyEl = document.querySelector('.text-sm.text-gray-300')
      expect(bodyEl?.textContent).toMatch(/Feats/)
    })
  })
})
