import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ReelColumn } from '@/components/ReelColumn'
import type { Icon } from '@/game/types'

const appleIcons: Icon[] = [
  { id: 'a1', definitionId: 'apple' },
  { id: 'a2', definitionId: 'apple' },
  { id: 'a3', definitionId: 'apple' },
]

const copperIcons: Icon[] = [
  { id: 'c1', definitionId: 'copper' },
  { id: 'c2', definitionId: 'copper' },
  { id: 'c3', definitionId: 'copper' },
]

const reelIcons: Icon[] = [{ id: 'r1', definitionId: 'apple' }]
const emptyOverrides = new Map<string, number>()
const emptyHighlights = new Map<string, 'green' | 'yellow'>()

function renderColumn(overrides: Partial<Parameters<typeof ReelColumn>[0]> = {}) {
  const defaults = {
    icons: appleIcons,
    valueOverrides: emptyOverrides,
    reelIcons,
    spinning: false,
    animate: true,
    colIndex: 0,
    blocked: false,
    highlights: emptyHighlights,
    isMagicPhase: false,
    respinToken: 0,
    isTargetingMode: false,
    onDone: undefined,
    onCellClick: vi.fn(),
    onColumnClick: vi.fn(),
  }
  return render(<ReelColumn {...defaults} {...overrides} />)
}

// ─── US2: icons prop sync ────────────────────────────────────────────────────

describe('ReelColumn icon sync (US2)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('updates displayed icons when icons prop changes and spinning is false', () => {
    const { rerender } = renderColumn({ icons: appleIcons, spinning: false })
    expect(screen.getAllByText('🍎')).toHaveLength(3)

    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={true}
        colIndex={0}
        blocked={false}
        highlights={emptyHighlights}
        isMagicPhase={false}
        respinToken={0}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    expect(screen.queryAllByText('🍎')).toHaveLength(0)
    expect(screen.getAllByText('🟤')).toHaveLength(3)
  })

  it('does not sync icons when animation is in flight', () => {
    const { rerender } = renderColumn({ icons: appleIcons, spinning: true, animate: true })
    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={true}
        animate={true}
        colIndex={0}
        blocked={false}
        highlights={emptyHighlights}
        isMagicPhase={false}
        respinToken={0}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getAllByText('🟤')).toHaveLength(3)
  })
})

// ─── US3: per-column respin animation ───────────────────────────────────────

describe('ReelColumn respin animation (US3)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('animate on: respinToken change triggers animation then settles on new icons', () => {
    const onDone = vi.fn()
    const { rerender } = renderColumn({ icons: appleIcons, spinning: false, animate: true, respinToken: 0, onDone })

    expect(screen.getAllByText('🍎')).toHaveLength(3)

    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={true}
        colIndex={0}
        blocked={false}
        highlights={emptyHighlights}
        isMagicPhase={false}
        respinToken={1}
        isTargetingMode={false}
        onDone={onDone}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getAllByText('🟤')).toHaveLength(3)
  })

  it('animate off: respinToken change updates immediately with no animation', () => {
    const { rerender } = renderColumn({ icons: appleIcons, spinning: false, animate: false, respinToken: 0 })

    expect(screen.getAllByText('🍎')).toHaveLength(3)

    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={false}
        colIndex={0}
        blocked={false}
        highlights={emptyHighlights}
        isMagicPhase={false}
        respinToken={1}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    expect(screen.queryAllByText('🍎')).toHaveLength(0)
    expect(screen.getAllByText('🟤')).toHaveLength(3)
  })
})

// ─── US4 (v0.6): respin animation does not grow column height ────────────────

describe('ReelColumn respin animation height (US4 v0.6)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('during respin animation the displayed icon count equals icons.length (3), not reelIcons.length', () => {
    const largeReelIcons: Icon[] = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i}`,
      definitionId: 'apple',
    }))

    const { rerender } = renderColumn({
      icons: appleIcons,
      reelIcons: largeReelIcons,
      spinning: false,
      animate: true,
      respinToken: 0,
    })

    rerender(
      <ReelColumn
        icons={appleIcons}
        valueOverrides={emptyOverrides}
        reelIcons={largeReelIcons}
        spinning={false}
        animate={true}
        colIndex={0}
        blocked={false}
        highlights={emptyHighlights}
        isMagicPhase={false}
        respinToken={1}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    act(() => { vi.advanceTimersByTime(400) })

    const listItems = document.querySelectorAll('[role="listitem"]')
    expect(listItems.length).toBe(3)
  })
})

// ─── US2 v1.1: multiplier badge display ─────────────────────────────────────

describe('ReelColumn multiplier badge (US2 v1.1)', () => {
  it('triple-apple: 2x🍎 emoji must not appear; ×2 badge must appear', () => {
    const icons: Icon[] = [{ id: 'ta1', definitionId: 'triple-apple' }]
    renderColumn({ icons })
    expect(screen.queryByText('2x🍎')).not.toBeInTheDocument()
    expect(screen.queryAllByText('×2')).toHaveLength(1)
  })

  it('dozen-apple: 3x🍎 emoji must not appear; ×3 badge must appear', () => {
    const icons: Icon[] = [{ id: 'da1', definitionId: 'dozen-apple' }]
    renderColumn({ icons })
    expect(screen.queryByText('3x🍎')).not.toBeInTheDocument()
    expect(screen.queryAllByText('×3')).toHaveLength(1)
  })

  it('triple-apple with Magic Boost override: only one ×N label (green override), not two', () => {
    const icons: Icon[] = [{ id: 'ta1', definitionId: 'triple-apple' }]
    const overrides = new Map<string, number>([['ta1', 5]])
    renderColumn({ icons, valueOverrides: overrides })
    const badges = screen.queryAllByText(/^×\d+$/)
    expect(badges).toHaveLength(1)
    expect(badges[0]).toHaveClass('text-green-400')
  })

  it('plain apple: no multiplier badge rendered', () => {
    const icons: Icon[] = [{ id: 'a1', definitionId: 'apple' }]
    renderColumn({ icons })
    expect(screen.queryByText(/^×\d+$/)).not.toBeInTheDocument()
  })
})

// ─── Blocked column indicator ───────────────────────────────────────────────

describe('ReelColumn blocked indicator', () => {
  it('blocked column renders a 🚫 blocked indicator', () => {
    renderColumn({ blocked: true })
    expect(screen.getByRole('status', { name: /blocked/i })).toBeInTheDocument()
  })

  it('unblocked column does not render the blocked indicator', () => {
    renderColumn({ blocked: false })
    expect(screen.queryByRole('status', { name: /blocked/i })).not.toBeInTheDocument()
  })
})
