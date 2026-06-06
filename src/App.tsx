import { useReducer, useEffect, useState, useCallback } from 'react'
import { gameReducer } from './game/reducer'
import { loadState, saveState } from './game/persistence'
import { makeInitialState } from './game/initialState'
import { SlotGrid } from './components/SlotGrid'
import { CurrencyDisplay } from './components/CurrencyDisplay'
import { SpinButton } from './components/SpinButton'
import { Market } from './components/Market'
import { GameOverScreen } from './components/GameOverScreen'
import { WinModal } from './components/WinModal'
import { HardResetButton } from './components/HardResetButton'
import { ReelView } from './components/ReelView'
import { SpinResultModal } from './components/SpinResultModal'

type ActiveTab = 'reel' | 'spin' | 'market'

function loadOrInit() {
  return loadState() ?? makeInitialState()
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadOrInit)
  const [spinning, setSpinning] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('spin')
  const [spinDone, setSpinDone] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const handleSpin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setSpinDone(false)
    dispatch({ type: 'SPIN' })
  }, [spinning])

  const handleSpinDone = useCallback(() => {
    setSpinning(false)
    setSpinDone(true)
  }, [])

  const handleModalDismiss = useCallback(() => {
    setSpinDone(false)
  }, [])

  const handleBuy = useCallback((iconDefinitionId: string) => {
    dispatch({ type: 'BUY_ICON', iconDefinitionId })
  }, [])

  const handleReset = useCallback(() => {
    setSpinning(false)
    setSpinDone(false)
    dispatch({ type: 'HARD_RESET' })
  }, [])

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE_AFTER_WIN' })
  }, [])

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'reel', label: 'Reel' },
    { id: 'spin', label: 'Spin' },
    { id: 'market', label: 'Market' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center">
      <div className="w-full max-w-lg mx-auto p-2 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Slot RPG</h1>
          <HardResetButton onReset={handleReset} />
        </div>

        {/* Persistent currency bar — always visible */}
        <CurrencyDisplay currencies={state.currencies} spinCount={state.spinCount} />

        {/* Tab bar */}
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

        {/* Tab panels — all mounted, hidden when inactive */}
        <div className={activeTab === 'reel' ? '' : 'hidden'}>
          <ReelView reel={state.reel} />
        </div>

        <div className={activeTab === 'spin' ? '' : 'hidden'}>
          <SlotGrid
            lastSpinResult={state.lastSpinResult}
            reel={state.reel}
            spinning={spinning}
            onSpinDone={handleSpinDone}
          />
          <div className="mt-3">
            <SpinButton
              phase={state.phase}
              currencies={state.currencies}
              spinning={spinning}
              onSpin={handleSpin}
            />
          </div>
        </div>

        <div className={activeTab === 'market' ? '' : 'hidden'}>
          <Market currencies={state.currencies} onBuy={handleBuy} />
        </div>

        {/* Overlays */}
        {state.phase === 'gameover' && <GameOverScreen onReset={handleReset} />}
        {state.phase === 'win' && (
          <WinModal onContinue={handleContinue} onReset={handleReset} />
        )}
        {spinDone && state.lastSpinResult && (
          <SpinResultModal result={state.lastSpinResult} onDismiss={handleModalDismiss} />
        )}
      </div>
    </div>
  )
}
