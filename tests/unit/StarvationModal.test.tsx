import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarvationModal } from '@/components/StarvationModal'

describe('StarvationModal (T022)', () => {
  it('renders notification text containing "ran out of food"', () => {
    render(<StarvationModal onDismiss={vi.fn()} />)
    expect(screen.getByText(/ran out of food/i)).toBeInTheDocument()
  })

  it('renders notification text containing "reset"', () => {
    render(<StarvationModal onDismiss={vi.fn()} />)
    expect(screen.getByText(/reset/i)).toBeInTheDocument()
  })

  it('clicking dismiss fires the dismiss callback', () => {
    const onDismiss = vi.fn()
    render(<StarvationModal onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
