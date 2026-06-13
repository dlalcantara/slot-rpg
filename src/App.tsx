import { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { gameReducer } from './game/reducer'
import { loadState, saveState } from './game/persistence'
import { makeInitialState } from './game/initialState'
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
import { SpinResultToast } from './components/SpinResultToast'
import { MagicPhasePanel } from './components/MagicPhasePanel'
import { CheatPanel } from './components/CheatPanel'
import { AchievementsTab } from './components/AchievementsTab'
import { AchievementDialog } from './components/AchievementDialog'
import { StarvationModal } from './components/StarvationModal'
import type { Currencies, MagicMode, SpinResult } from './game/types'
import type { AchievementId } from './game/achievements'

type ActiveTab = 'reel' | 'spin' | 'market' | 'achievements'

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
  const [toastResult, setToastResult] = useState<SpinResult | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showCheat, setShowCheat] = useState(false)
  const titleClickCountRef = useRef(0)
  const [displayedCurrencies, setDisplayedCurrencies] = useState<Currencies>(() => loadOrInit().currencies)
  const prevCurrenciesRef = useRef<Currencies>(state.currencies)
  const [pendingDialogs, setPendingDialogs] = useState<AchievementId[]>([])
  const prevUnlockedRef = useRef<AchievementId[]>(state.unlockedAchievements)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!spinning && !toastResult) {
      setDisplayedCurrencies(state.currencies)
    }
  }, [state.currencies, spinning, toastResult])

  useEffect(() => {
    const prev = prevUnlockedRef.current
    const curr = state.unlockedAchievements
    const newOnes = curr.filter((id) => !prev.includes(id))
    if (newOnes.length > 0) {
      setPendingDialogs((q) => [...q, ...newOnes])
    }
    prevUnlockedRef.current = curr
  }, [state.unlockedAchievements])

  // Show toast when lastSpinResult changes after CLAIM
  useEffect(() => {
    if (state.phase !== 'magic' && state.lastSpinResult) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToastResult(state.lastSpinResult)
      toastTimerRef.current = setTimeout(() => {
        setToastResult(null)
        setDisplayedCurrencies(state.currencies)
      }, 3000)
    }
  }, [state.lastSpinResult]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleBuy = useCallback((iconDefinitionId: string) => {
    dispatch({ type: 'BUY_ICON', iconDefinitionId })
  }, [])

  const handleReset = useCallback(() => {
    setSpinning(false)
    setToastResult(null)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setPendingDialogs([])
    setMagicMode(null)
    setSwapFrom(null)
    const fresh = makeInitialState()
    setDisplayedCurrencies(fresh.currencies)
    dispatch({ type: 'HARD_RESET' })
  }, [])

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE_AFTER_WIN' })
  }, [])

  const handleDismissAchievement = useCallback(() => {
    setPendingDialogs((q) => q.slice(1))
  }, [])

  // Secret cheat trigger — click title 5× quickly
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
    { id: 'achievements', label: 'Feats' },
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
            onPrestige={(keepDefinitionIds) => dispatch({ type: 'PRESTIGE', keepDefinitionIds })}
          />
        </div>

        <div className={activeTab === 'spin' ? '' : 'hidden'}>
          <SlotGrid
            lastSpinResult={state.lastSpinResult}
            magicGrid={state.magicGrid}
            blockedColumns={state.blockedColumns}
            reel={state.reel}
            rowCount={state.rowCount}
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
              isMagicPhase={isMagicPhase}
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
                  blockedColumns={state.blockedColumns}
                  multiplier={state.pendingMultiplier}
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
          <Market currencies={state.currencies} reel={state.reel} onBuy={handleBuy} />
        </div>

        <div className={activeTab === 'achievements' ? '' : 'hidden'}>
          <AchievementsTab unlockedAchievements={state.unlockedAchievements} />
        </div>

        {state.phase === 'gameover' && <GameOverScreen onReset={handleReset} />}
        {state.phase === 'starvation' && (
          <StarvationModal onDismiss={() => dispatch({ type: 'DISMISS_STARVATION' })} />
        )}
        {state.phase === 'win' && (
          <WinModal onContinue={handleContinue} onReset={handleReset} />
        )}
        {toastResult && <SpinResultToast result={toastResult} />}
        <AchievementDialog
          achievementId={pendingDialogs[0] ?? null}
          onDismiss={handleDismissAchievement}
        />
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
