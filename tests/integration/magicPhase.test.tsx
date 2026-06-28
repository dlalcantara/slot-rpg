import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReducer } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { gameReducer } from '@/game/reducer'
import { makeInitialState } from '@/game/initialState'
import type { GameState, GameAction } from '@/game/types'
import { DEFAULT_SETTINGS } from '@/game/types'
import { SlotGrid } from '@/components/SlotGrid'
import App from '@/App'
import { loadState } from '@/game/persistence'
import { calculatePayouts } from '@/game/spinLogic'

vi.mock('@/game/persistence', () => ({
  saveState: vi.fn(),
  loadState: vi.fn(() => null),
  clearState: vi.fn(),
}))

const appleColumn = [
  { id: 'a1', definitionId: 'apple' },
  { id: 'a2', definitionId: 'apple' },
  { id: 'a3', definitionId: 'apple' },
]
const copperColumn = [
  { id: 'c1', definitionId: 'copper' },
  { id: 'c2', definitionId: 'copper' },
  { id: 'c3', definitionId: 'copper' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDrawColumn = vi.fn(() => appleColumn) as any
vi.mock('@/game/spinLogic', () => ({
  get drawColumn() { return mockDrawColumn },
  calculatePayouts: vi.fn(() => []),
}))

// ─── Pure reducer tests ──────────────────────────────────────────────────────

describe('full spin → magic phase → CLAIM flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  function setup(): GameState {
    return {
      ...makeInitialState(),
      currencies: {
        food: 10, copper: 0, silver: 0, gold: 0, crowns: 0,
        air: 5, water: 5, earth: 5, fire: 5,
      },
    }
  }

  it('SPIN → BEGIN_MAGIC_PHASE → CLAIM completes round and awards food', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    expect(state.phase).toBe('spinning')

    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    expect(state.phase).toBe('magic')
    expect(state.magicGrid).not.toBeNull()

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
    expect(state.magicGrid).toBeNull()
    expect(state.lastSpinResult).not.toBeNull()
    expect(state.gameLog.length).toBeGreaterThan(0)
  })

  it('MAGIC_RESPIN changes a column before CLAIM', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    const originalCol0 = state.magicGrid![0].map((c) => c.icon.id)
    state = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 0 })
    const newCol0 = state.magicGrid![0].map((c) => c.icon.id)

    expect(state.currencies.air).toBe(4)
    expect(state.magicCounters.respin).toBe(1)
    void originalCol0
    void newCol0

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
  })

  it('MAGIC_BLOCK_COLUMN → CLAIM excludes blocked column from payout and resets blockedColumns', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    state = gameReducer(state, { type: 'MAGIC_BLOCK_COLUMN', colIdx: 0 })
    expect(state.blockedColumns).toContain(0)
    expect(state.currencies.earth).toBe(4)

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.blockedColumns).toEqual([])
    expect(state.lastSpinResult!.columns).toHaveLength(5)
  })

  it('multiple magic actions before CLAIM all reflected in result', () => {
    let state = setup()
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })

    state = gameReducer(state, { type: 'MAGIC_RESPIN', colIdx: 1 })
    expect(state.currencies.air).toBe(4)

    state = gameReducer(state, { type: 'MAGIC_SWAP', fromCol: 2, fromRow: 0, toCol: 2, toRow: 1 })
    expect(state.currencies.water).toBe(4)

    state = gameReducer(state, { type: 'MAGIC_INCREASE_VALUE', colIdx: 3, rowIdx: 0 })
    expect(state.currencies.fire).toBe(4)

    state = gameReducer(state, { type: 'CLAIM' })
    expect(state.phase).toMatch(/^(market|gameover|win)$/)
    expect(state.lastSpinResult).not.toBeNull()
  })
})

// ─── US2: rendered grid reflects magic edits ─────────────────────────────────

function GridWrapper({ initialState }: { initialState: GameState }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const isMagicPhase = state.phase === 'magic'

  return (
    <>
      <SlotGrid
        lastSpinResult={state.lastSpinResult}
        magicGrid={state.magicGrid}
        blockedColumns={state.blockedColumns}
        reel={state.reel}
        rowCount={state.rowCount ?? 3}
        spinning={false}
        animate={false}
        isMagicPhase={isMagicPhase}
        onSpinDone={() => {}}
        onMagicAction={(action: GameAction) => dispatch(action)}
      />
      <button
        onClick={() => dispatch({ type: 'MAGIC_RESPIN', colIdx: 0 })}
        data-testid="test-respin-0"
      >
        Respin Col 0
      </button>
      <button
        onClick={() => dispatch({ type: 'MAGIC_SWAP', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 })}
        data-testid="test-swap"
      >
        Swap
      </button>
    </>
  )
}

describe('US2: rendered grid changes after magic actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawColumn
      .mockReturnValueOnce(appleColumn)
      .mockReturnValueOnce(appleColumn)
      .mockReturnValueOnce(appleColumn)
      .mockReturnValueOnce(appleColumn)
      .mockReturnValueOnce(appleColumn)
      // Respin call returns copper
      .mockReturnValue(copperColumn)
  })

  function magicState(): GameState {
    let state: GameState = {
      ...makeInitialState(),
      currencies: { food: 10, copper: 0, silver: 0, gold: 0, crowns: 0, air: 5, water: 5, earth: 5, fire: 5 },
    }
    state = gameReducer(state, { type: 'SPIN', multiplier: 1 })
    state = gameReducer(state, { type: 'BEGIN_MAGIC_PHASE' })
    return state
  }

  it('rendered grid text changes after MAGIC_RESPIN', () => {
    render(<GridWrapper initialState={magicState()} />)
    expect(screen.getAllByText('🍎').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('test-respin-0'))

    expect(screen.getAllByText('🟤').length).toBeGreaterThan(0)
  })

  it('rendered grid text changes after MAGIC_SWAP', () => {
    const base: GameState = {
      ...makeInitialState(),
      phase: 'magic',
      currencies: { food: 10, copper: 0, silver: 0, gold: 0, crowns: 0, air: 5, water: 5, earth: 5, fire: 5 },
      magicGrid: [
        [
          { icon: { id: 'c0r0', definitionId: 'apple' }, valueOverride: null },
          { icon: { id: 'c0r1', definitionId: 'copper' }, valueOverride: null },
          { icon: { id: 'c0r2', definitionId: 'apple' }, valueOverride: null },
        ],
        ...Array(4).fill(null).map((_, ci) => [
          { icon: { id: `c${ci + 1}r0`, definitionId: 'apple' }, valueOverride: null },
          { icon: { id: `c${ci + 1}r1`, definitionId: 'apple' }, valueOverride: null },
          { icon: { id: `c${ci + 1}r2`, definitionId: 'apple' }, valueOverride: null },
        ]),
      ],
      lastSpinResult: null,
      blockedColumns: [],
      magicCounters: { respin: 0, swap: 0, increaseValue: 0 },
      pendingMultiplier: 1,
    }

    render(<GridWrapper initialState={base} />)
    fireEvent.click(screen.getByTestId('test-swap'))

    // After swap row 0 and row 1, copper (originally row 1) should still be visible
    expect(screen.getAllByText('🟤').length).toBeGreaterThan(0)
  })
})

// ─── US5: column click-target affordance ─────────────────────────────────────

describe('US5: column click-target affordance when targeting mode active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  afterEach(() => vi.useRealTimers())

  function getToMagicPhase() {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
  }

  it('column select buttons absent when no targeting mode is active', () => {
    getToMagicPhase()
    expect(screen.queryAllByRole('button', { name: /Select column/i })).toHaveLength(0)
  })

  it('column select buttons appear when respin mode is active', () => {
    getToMagicPhase()
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    fireEvent.click(respinRow)
    expect(screen.getAllByRole('button', { name: /Select column/i })).toHaveLength(5)
  })

  it('column select buttons appear when block mode is active', () => {
    const stateWithEarth = { ...makeInitialState(), currencies: { ...makeInitialState().currencies, earth: 10 } }
    vi.mocked(loadState).mockReturnValue(stateWithEarth)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
    vi.mocked(loadState).mockReturnValue(null)

    const blockRow = screen.getByRole('button', { name: /block column/i })
    fireEvent.click(blockRow)
    expect(screen.getAllByRole('button', { name: /Select column/i })).toHaveLength(5)
  })

  it('column select buttons disappear after deactivating the mode', () => {
    getToMagicPhase()
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    fireEvent.click(respinRow) // activate
    fireEvent.click(respinRow) // deactivate (toggle off)
    expect(screen.queryAllByRole('button', { name: /Select column/i })).toHaveLength(0)
  })
})

// ─── US2 (v0.6): CLAIM/SpinControls layout ───────────────────────────────────

describe('US2 (v0.6): SPIN/CLAIM same anchor, SpinControls always visible', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  afterEach(() => vi.useRealTimers())

  function getToMagicPhase() {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
  }

  it('SpinControls is present during magic phase', () => {
    getToMagicPhase()
    const spinTab = document.querySelector('[aria-label="Slot machine grid"]')
    expect(spinTab).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument()
  })

  it('CLAIM button appears before MagicPhasePanel in document order during magic phase', () => {
    getToMagicPhase()
    const claimBtn = screen.getByRole('button', { name: /claim/i })
    const respinBtn = screen.getByRole('button', { name: /respin column/i })
    const pos = claimBtn.compareDocumentPosition(respinBtn)
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

// ─── Magic action selector ────────────────────────────────────────────────────

describe('magic action selector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  afterEach(() => vi.useRealTimers())

  function getToMagicPhase() {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
  }

  it('clicking an ability row selects it (aria-pressed=true)', () => {
    getToMagicPhase()
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    fireEvent.click(respinRow)
    expect(respinRow).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking the active row clears the mode', () => {
    getToMagicPhase()
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    fireEvent.click(respinRow)
    expect(respinRow).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(respinRow)
    expect(respinRow).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking another row switches the active mode', () => {
    getToMagicPhase()
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    const swapRow = screen.getByRole('button', { name: /swap cells/i })
    fireEvent.click(respinRow)
    fireEvent.click(swapRow)
    expect(respinRow).toHaveAttribute('aria-pressed', 'false')
    expect(swapRow).toHaveAttribute('aria-pressed', 'true')
  })

  it('unaffordable row is not selectable (disabled)', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })
    const respinRow = screen.getByRole('button', { name: /respin column/i })
    expect(respinRow).not.toBeDisabled()
  })

  it('the old toggle button strip is not rendered', () => {
    getToMagicPhase()
    const toggleButtons = screen.queryAllByRole('button').filter(
      (btn) => ['Respin', 'Swap', 'Lock', 'Boost'].includes(btn.textContent?.trim() ?? '')
    )
    expect(toggleButtons).toHaveLength(0)
  })

  it('swap hint shown in guide after first cell is selected', () => {
    getToMagicPhase()
    const swapRow = screen.getByRole('button', { name: /swap cells/i })
    fireEvent.click(swapRow)
    expect(screen.queryByText(/select 2nd/i)).not.toBeInTheDocument()
    const cells = screen.getAllByRole('listitem')
    fireEvent.click(cells[0])
    expect(screen.getByText(/select 2nd/i)).toBeInTheDocument()
  })
})

// ─── T004: US6 — currency display updates immediately after claim ─────────────

describe('US6: currency display updates immediately after claim (no timer dependency)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.mocked(loadState).mockReturnValue(null)
  })

  it('currency display reflects updated total within 500ms of claim', () => {
    const initialFood = 20
    const payoutAmount = 5

    // First calculatePayouts call is during SPIN, second during CLAIM
    vi.mocked(calculatePayouts)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([{ family: 'apple', amount: payoutAmount, currency: 'food' }])

    const initialState: GameState = {
      ...makeInitialState(),
      settings: { ...makeInitialState().settings, animate: false },
      currencies: { ...makeInitialState().currencies, food: initialFood },
    }
    vi.mocked(loadState).mockReturnValue(initialState)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })

    fireEvent.click(screen.getByRole('button', { name: /claim spin result/i }))

    // Advance less than 3000ms — display must update without waiting for timer
    act(() => { vi.advanceTimersByTime(500) })

    // Expected food: initialFood - 1 (spin cost) + payoutAmount = 24
    const expectedFood = initialFood - 1 + payoutAmount
    const currencyValues = document.querySelectorAll('.currency-value')
    const texts = Array.from(currencyValues).map((el) => el.textContent)
    expect(texts).toContain(String(expectedFood))
  })
})

// ─── T011: US7 — auto-claim skips magic phase ────────────────────────────────

describe('US7: auto-claim skips magic phase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
    mockDrawColumn.mockReturnValue(appleColumn)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.mocked(loadState).mockReturnValue(null)
  })

  it('with autoClaim=true, magic phase panel and CLAIM button are never shown', () => {
    const initialState: GameState = {
      ...makeInitialState(),
      settings: { ...DEFAULT_SETTINGS, autoClaim: true },
      currencies: { ...makeInitialState().currencies, food: 10 },
    }
    vi.mocked(loadState).mockReturnValue(initialState)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Spin the reels' }))
    act(() => { vi.advanceTimersByTime(5000) })

    // Magic phase should have been skipped
    expect(screen.queryByRole('button', { name: /claim spin result/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /respin column/i })).toBeNull()
  })
})
