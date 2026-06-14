import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SlotGrid } from '@/components/SlotGrid'
import type { MagicCell, Reel } from '@/game/types'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const appleCol: MagicCell[] = [
  { icon: { id: 'a1', definitionId: 'apple' }, valueOverride: null },
  { icon: { id: 'a2', definitionId: 'apple' }, valueOverride: null },
  { icon: { id: 'a3', definitionId: 'apple' }, valueOverride: null },
]
const magicGrid: MagicCell[][] = Array(5).fill(null).map(() => appleCol.map((c) => ({ ...c })))

// Blank reel so animation shuffles show '[ ]', making settled state distinguishable
const reel: Reel = {
  icons: [
    { id: 'blank1', definitionId: 'blank' },
    { id: 'blank2', definitionId: 'blank' },
  ],
}

// ─── rowCount expansion display (energy bug regression) ─────────────────────

describe('SlotGrid rowCount expansion display', () => {
  it('shows 4-row placeholder grid when rowCount=4 but lastSpinResult has 3-row columns', () => {
    const threeRowCols = Array(5).fill(null).map(() => [
      { id: 'a1', definitionId: 'apple' },
      { id: 'a2', definitionId: 'apple' },
      { id: 'a3', definitionId: 'apple' },
    ])
    render(
      <SlotGrid
        lastSpinResult={{ columns: threeRowCols, payouts: [] }}
        magicGrid={null}
        blockedColumns={[]}
        reel={reel}
        rowCount={4}
        spinning={false}
        animate={false}
        isMagicPhase={false}
        onSpinDone={vi.fn()}
        onMagicAction={vi.fn()}
      />
    )
    // With the fix: shows placeholder grid sized to rowCount=4 (5 cols × 4 rows = 20 cells)
    const listitems = screen.getAllByRole('listitem')
    expect(listitems).toHaveLength(20)
  })

  it('shows lastSpinResult when its row count matches rowCount', () => {
    const threeRowCols = Array(5).fill(null).map(() => [
      { id: 'a1', definitionId: 'apple' },
      { id: 'a2', definitionId: 'apple' },
      { id: 'a3', definitionId: 'apple' },
    ])
    render(
      <SlotGrid
        lastSpinResult={{ columns: threeRowCols, payouts: [] }}
        magicGrid={null}
        blockedColumns={[]}
        reel={reel}
        rowCount={3}
        spinning={false}
        animate={false}
        isMagicPhase={false}
        onSpinDone={vi.fn()}
        onMagicAction={vi.fn()}
      />
    )
    // rowCount=3 matches lastSpinResult's 3-row columns → shows apple icons
    expect(screen.getAllByText('🍎').length).toBeGreaterThan(0)
    const listitems = screen.getAllByRole('listitem')
    expect(listitems).toHaveLength(15) // 5 cols × 3 rows
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('spin settle on real result (US1)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('animation off: settled grid shows magicGrid symbols, not placeholder', () => {
    render(
      <SlotGrid
        lastSpinResult={null}
        magicGrid={magicGrid}
        blockedColumns={[]}
        reel={reel}
        rowCount={3}
        spinning={true}
        animate={false}
        isMagicPhase={false}
        onSpinDone={vi.fn()}
        onMagicAction={vi.fn()}
      />
    )
    // Before fix: displayColumns shows placeholder '[ ]' (lastSpinResult null, isMagicPhase false)
    // After fix: displayColumns shows magicGrid 'Apple' icons regardless of isMagicPhase
    expect(screen.queryAllByText('[ ]')).toHaveLength(0)
    expect(screen.getAllByText('🍎').length).toBeGreaterThan(0)
  })

  it('animation on: after animation settles, grid shows magicGrid symbols not placeholder', () => {
    render(
      <SlotGrid
        lastSpinResult={null}
        magicGrid={magicGrid}
        blockedColumns={[]}
        reel={reel}
        rowCount={3}
        spinning={true}
        animate={true}
        isMagicPhase={false}
        onSpinDone={vi.fn()}
        onMagicAction={vi.fn()}
      />
    )
    // Advance past all animation stop timers (last col stops at 1500 + 4*600 = 3900ms)
    act(() => { vi.advanceTimersByTime(5000) })

    // After animation: settled on magicGrid symbols, no placeholder blanks
    expect(screen.queryAllByText('[ ]')).toHaveLength(0)
    expect(screen.getAllByText('🍎').length).toBeGreaterThan(0)
  })
})
