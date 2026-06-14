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
    expect(screen.getAllByText('🟠')).toHaveLength(3)
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
    expect(screen.getAllByText('🟠')).toHaveLength(3)
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
    expect(screen.getAllByText('🟠')).toHaveLength(3)
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
    expect(screen.getAllByText('🟠')).toHaveLength(3)
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
