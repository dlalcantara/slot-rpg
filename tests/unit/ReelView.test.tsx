import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReelView } from '@/components/ReelView'
import type { Reel } from '@/game/types'

function makeReel(defs: string[]): Reel {
  return { icons: defs.map((d, i) => ({ id: `i${i}`, definitionId: d })) }
}

describe('ReelView grouped icon display', () => {
  it('renders 2 icon cells for reel with apple, apple, copper (not 3)', () => {
    render(<ReelView reel={makeReel(['apple', 'apple', 'copper'])} onPrestige={vi.fn()} />)
    const cells = document.querySelectorAll('.icon-cell')
    expect(cells.length).toBe(2)
  })

  it('apple cell shows count badge "2" for two apples', () => {
    render(<ReelView reel={makeReel(['apple', 'apple', 'copper'])} onPrestige={vi.fn()} />)
    expect(screen.getByText('2')).toBeDefined()
  })

  it('copper cell shows count badge "1" for single copper', () => {
    render(<ReelView reel={makeReel(['apple', 'apple', 'copper'])} onPrestige={vi.fn()} />)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })

  it('renders 1 icon cell for single apple', () => {
    render(<ReelView reel={makeReel(['apple'])} onPrestige={vi.fn()} />)
    const cells = document.querySelectorAll('.icon-cell')
    expect(cells.length).toBe(1)
  })

  it('single apple cell shows count badge "1"', () => {
    render(<ReelView reel={makeReel(['apple'])} onPrestige={vi.fn()} />)
    expect(screen.getByText('1')).toBeDefined()
  })

  it('renders 2 cells for apple and copper, each showing count "1"', () => {
    render(<ReelView reel={makeReel(['apple', 'copper'])} onPrestige={vi.fn()} />)
    const cells = document.querySelectorAll('.icon-cell')
    expect(cells.length).toBe(2)
    expect(screen.getAllByText('1').length).toBe(2)
  })

  it('renders 1 cell for two apples (not two separate cells)', () => {
    render(<ReelView reel={makeReel(['apple', 'apple'])} onPrestige={vi.fn()} />)
    const cells = document.querySelectorAll('.icon-cell')
    expect(cells.length).toBe(1)
    expect(screen.getByText('2')).toBeDefined()
  })
})
