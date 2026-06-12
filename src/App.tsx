import { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { gameReducer } from './game/reducer'
import { loadState, saveState } from './game/persistence'
import { makeInitialState } from './game/initialState'
import { isNotableResult } from './game/notableResult'
import { SlotGrid } from './components/SlotGrid'
import { CurrencyDisplay } from './components/CurrencyDisplay'
import { SpinButton } from './components/SpinButton'
import { SpinControls } from './components/SpinControls'
import { GameLog } from './components/GameLog'
import { Market } from './components/Market'
import { GameOverScreen } from './components/GameOverScreen'
import { WinModal } from './components/WinModal'
import { HardResetButton } from './components/HardResetButton'
import { ReelView } from './components/ReelView'
import { SpinResultModal } from './components/SpinResultModal'
import { MagicPhasePanel } from './components/MagicPhasePanel'
import { CheatPanel } from './components/CheatPanel'
import type { Currencies, MagicMode } from './game/types'

type ActiveTab = 'reel' | 'spin' | 'market'

function loadOrInit() {
  return loadState() ?? makeInitialState()
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadOrInit)
  const [spinning, setSpinning] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('spin')
  const [respinTokens, setRespinTokens] = useState<number[]>([0, 0, 0, 0, 0])
  const [magicMode, setMagicMode] = useState<MagicMode>(null)
  const [swapFrom, setSwapFrom] = useState<{ col: number; row: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showMasterOfElements, setShowMasterOfElements] = useState(false)
  const [showCheat, setShowCheat] = useState(false)
  const titleClickCountRef = useRef(0)
  const [displayedCurrencies, setDisplayedCurrencies] = useState<Currencies>(() => loadOrInit().currencies)
  const prevCurrenciesRef = useRef<Currencies>(state.currencies)
  const prevMasterRef = useRef<boolean>(state.masterOfElements)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!spinning && !showModal) {
      setDisplayedCurrencies(state.currencies)
    }
  }, [state.currencies, spinning, showModal])

  useEffect(() => {
    if (state.masterOfElements && !prevMasterRef.current) {
      setShowMasterOfElements(true)
    }
    prevMasterRef.current = state.masterOfElements
  }, [state.masterOfElements])

  const handleSpin = useCallback(() => {
    if (spinning) return
    prevCurrenciesRef.current = state.currencies
    setSpinning(true)
    dispatch({ type: 'SPIN', multiplier: state.settings.spinMultiplier })
  }, [spinning, state.currencies, state.settings.spinMultiplier])

  const handleSpinDone = useCallback(() => {
    setSpinning(false)
    setMagicMode(null)
    setSwapFrom(null)
    dispatch({ type: 'BEGIN_MAGIC_PHASE' })
  }, [])

  const handleClaim = useCallback(() => {
    setMagicMode(null)
    setSwapFrom(null)
    dispatch({ type: 'CLAIM' })
  }, [])

  useEffect(() => {
    if (state.phase !== 'magic' && !spinning) {
      const notable = isNotableResult(prevCurrenciesRef.current, state.currencies)
      if (notable) {
        setShowModal(true)
      }
    }
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleModalDismiss = useCallback(() => {
    setShowModal(false)
    setDisplayedCurrencies(state.currencies)
  }, [state.currencies])

  const handleBuy = useCallback((iconDefinitionId: string) => {
    dispatch({ type: 'BUY_ICON', iconDefinitionId })
  }, [])

  const handleReset = useCallback(() => {
    setSpinning(false)
    setShowModal(false)
    setShowMasterOfElements(false)
    setMagicMode(null)
    setSwapFrom(null)
    const fresh = makeInitialState()
    setDisplayedCurrencies(fresh.currencies)
    dispatch({ type: 'HARD_RESET' })
  }, [])

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE_AFTER_WIN' })
  }, [])

  // US8: secret cheat trigger — click title 5× quickly
  const titleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleTitleClick = useCallback(() => {
    titleClickCountRef.current += 1
    if (titleClickCountRef.current >= 5) {
      setShowCheat(true)
      titleClickCountRef.current = 0
      if (titleClickTimerRef.current) clearTimeout(titleClickTimerRef.current)
      return
    }
    if (titleClickTimerRef.current) clearTimeout(titleClickTimerRef.current)
    titleClickTimerRef.current = setTimeout(() => { titleClickCountRef.current = 0 }, 1500)
  }, [])

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'reel', label: 'Reel' },
    { id: 'spin', label: 'Spin' },
    { id: 'market', label: 'Market' },
  ]

  const isMagicPhase = state.phase === 'magic'

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center">
      <div className="w-full max-w-lg mx-auto p-2 space-y-2">
        <div className="flex items-center justify-between">
          <h1
            className="text-xl font-bold text-gray-100 select-none cursor-default"
            onClick={handleTitleClick}
          >
            Slot RPG
          </h1>
          <HardResetButton onReset={handleReset} />
        </div>

        <CurrencyDisplay currencies={displayedCurrencies} spinCount={state.spinCount} />

        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={activeTab === 'reel' ? '' : 'hidden'}>
          <ReelView
            reel={state.reel}
            disabledIconIds={state.disabledIconIds}
            onToggleIcon={(iconId) => dispatch({ type: 'TOGGLE_ICON', iconId })}
          />
        </div>

        <div className={activeTab === 'spin' ? '' : 'hidden'}>
          <SlotGrid
            lastSpinResult={state.lastSpinResult}
            magicGrid={state.magicGrid}
            lockedColumns={state.lockedColumns}
            reel={state.reel}
            spinning={spinning}
            animate={state.settings.animate}
            onSpinDone={handleSpinDone}
            isMagicPhase={isMagicPhase}
            magicMode={magicMode}
            swapFrom={swapFrom}
            respinTokens={respinTokens}
            onModeChange={setMagicMode}
            onSwapFrom={setSwapFrom}
            onMagicAction={(action) => {
              if (action.type === 'MAGIC_RESPIN') {
                const idx = action.colIdx
                setRespinTokens((prev) => prev.map((t, i) => (i === idx ? t + 1 : t)))
              }
              dispatch(action)
            }}
          />
          <div className="mt-3 space-y-2">
            <SpinControls
              settings={state.settings}
              spinning={spinning}
              onSettingsChange={(patch) => dispatch({ type: 'UPDATE_SETTINGS', patch })}
            />
            {isMagicPhase ? (
              <>
                <button
                  onClick={handleClaim}
                  className="w-full py-4 text-2xl font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all"
                  aria-label="Claim spin result"
                >
                  ✨ CLAIM
                </button>
                <MagicPhasePanel
                  currencies={state.currencies}
                  magicCounters={state.magicCounters}
                  lockedColumns={state.lockedColumns}
                  magicMode={magicMode}
                  swapFrom={swapFrom}
                  onSelectMode={setMagicMode}
                />
              </>
            ) : (
              <SpinButton
                phase={state.phase}
                currencies={state.currencies}
                spinning={spinning}
                multiplier={state.settings.spinMultiplier}
                onSpin={handleSpin}
              />
            )}
          </div>
          <GameLog entries={state.gameLog} />
        </div>

        <div className={activeTab === 'market' ? '' : 'hidden'}>
          <Market currencies={state.currencies} onBuy={handleBuy} />
        </div>

        {state.phase === 'gameover' && <GameOverScreen onReset={handleReset} />}
        {state.phase === 'win' && (
          <WinModal onContinue={handleContinue} onReset={handleReset} />
        )}
        {showModal && state.lastSpinResult && (
          <SpinResultModal result={state.lastSpinResult} onDismiss={handleModalDismiss} />
        )}
        {showMasterOfElements && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl border border-yellow-400 p-6 max-w-sm w-full text-center space-y-4">
              <div className="text-4xl">🌟</div>
              <h2 className="text-2xl font-bold text-yellow-300">Master of Elements!</h2>
              <p className="text-gray-300 text-sm">
                You have aligned Air, Water, Earth, and Fire. The elements bow to your will.
              </p>
              <button
                onClick={() => setShowMasterOfElements(false)}
                className="w-full py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {showCheat && (
          <CheatPanel
            currencies={state.currencies}
            onSetCurrency={(currency, amount) => dispatch({ type: 'SET_CURRENCY', currency, amount })}
            onClose={() => setShowCheat(false)}
          />
        )}
      </div>
    </div>
  )
}
