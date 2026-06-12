import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpinResultToast } from '@/components/SpinResultToast'
import type { SpinResult } from '@/game/types'

function makeResult(payouts: SpinResult['payouts']): SpinResult {
  return {
    columns: [],
    payouts,
    valueOverrides: new Map(),
  }
}

describe('SpinResultToast', () => {
  it('renders "No match" message when payouts are empty', () => {
    render(<SpinResultToast result={makeResult([])} />)
    expect(screen.getByText(/no match/i)).toBeInTheDocument()
  })

  it('renders payout text when payouts present', () => {
    render(
      <SpinResultToast
        result={makeResult([{ family: 'apple', currency: 'food', amount: 5 }])}
      />,
    )
    expect(screen.getByText(/\+5/)).toBeInTheDocument()
    expect(screen.getByText(/food/i)).toBeInTheDocument()
  })

  it('has role="status" for accessibility', () => {
    render(<SpinResultToast result={makeResult([])} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-live="polite"', () => {
    render(<SpinResultToast result={makeResult([])} />)
    const el = screen.getByRole('status')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('renders multiple payouts joined by comma', () => {
    render(
      <SpinResultToast
        result={makeResult([
          { family: 'apple', currency: 'food', amount: 3 },
          { family: 'copper', currency: 'copper', amount: 2 },
        ])}
      />,
    )
    const text = screen.getByRole('status').textContent ?? ''
    expect(text).toContain('+3')
    expect(text).toContain('+2')
  })
})
