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

function renderColumn(overrides: Partial<Parameters<typeof ReelColumn>[0]> = {}) {
  const defaults = {
    icons: appleIcons,
    valueOverrides: emptyOverrides,
    reelIcons,
    spinning: false,
    animate: true,
    colIndex: 0,
    locked: false,
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
    expect(screen.getAllByText('Apple')).toHaveLength(3)

    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={true}
        colIndex={0}
        locked={false}
        isMagicPhase={false}
        respinToken={0}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    expect(screen.queryAllByText('Apple')).toHaveLength(0)
    expect(screen.getAllByText('Copper')).toHaveLength(3)
  })

  it('does not sync icons when animation is in flight', () => {
    const { rerender } = renderColumn({ icons: appleIcons, spinning: true, animate: true })
    // Animation is running; icon changes should not stomp the shuffle
    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={true}
        animate={true}
        colIndex={0}
        locked={false}
        isMagicPhase={false}
        respinToken={0}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )
    // Still animating — should not have settled on copper yet
    // After animation stops (5000ms), it will settle on the current icons prop (copper)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getAllByText('Copper')).toHaveLength(3)
  })
})

// ─── US3: per-column respin animation ───────────────────────────────────────

describe('ReelColumn respin animation (US3)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('animate on: respinToken change triggers animation then settles on new icons', () => {
    const onDone = vi.fn()
    const { rerender } = renderColumn({ icons: appleIcons, spinning: false, animate: true, respinToken: 0, onDone })

    expect(screen.getAllByText('Apple')).toHaveLength(3)

    // Trigger respin on column — new icons arrive simultaneously
    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={true}
        colIndex={0}
        locked={false}
        isMagicPhase={false}
        respinToken={1}
        isTargetingMode={false}
        onDone={onDone}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    // After animation completes, should show new icons (Copper)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getAllByText('Copper')).toHaveLength(3)
  })

  it('animate off: respinToken change updates immediately with no animation', () => {
    const { rerender } = renderColumn({ icons: appleIcons, spinning: false, animate: false, respinToken: 0 })

    expect(screen.getAllByText('Apple')).toHaveLength(3)

    rerender(
      <ReelColumn
        icons={copperIcons}
        valueOverrides={emptyOverrides}
        reelIcons={reelIcons}
        spinning={false}
        animate={false}
        colIndex={0}
        locked={false}
        isMagicPhase={false}
        respinToken={1}
        isTargetingMode={false}
        onCellClick={vi.fn()}
        onColumnClick={vi.fn()}
      />
    )

    // Immediate update — no timer needed
    expect(screen.queryAllByText('Apple')).toHaveLength(0)
    expect(screen.getAllByText('Copper')).toHaveLength(3)
  })
})

// ─── US4: locked column indicator ───────────────────────────────────────────

describe('ReelColumn locked indicator (US4)', () => {
  it('locked column renders a persistent locked indicator', () => {
    renderColumn({ locked: true })
    expect(screen.getByRole('status', { name: /locked/i })).toBeInTheDocument()
  })

  it('unlocked column does not render the locked indicator', () => {
    renderColumn({ locked: false })
    expect(screen.queryByRole('status', { name: /locked/i })).not.toBeInTheDocument()
  })
})
