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

function loadOrInit() {
  return loadState() ?? makeInitialState()
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadOrInit)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const handleSpin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    dispatch({ type: 'SPIN' })
  }, [spinning])

  const handleSpinDone = useCallback(() => {
    setSpinning(false)
  }, [])

  const handleBuy = useCallback((iconDefinitionId: string) => {
    dispatch({ type: 'BUY_ICON', iconDefinitionId })
  }, [])

  const handleReset = useCallback(() => {
    setSpinning(false)
    dispatch({ type: 'HARD_RESET' })
  }, [])

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE_AFTER_WIN' })
  }, [])

  const showMarket = state.phase === 'market' || state.phase === 'win'

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center">
      <div className="w-full max-w-sm mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Slot RPG</h1>
          <HardResetButton onReset={handleReset} />
        </div>

        {/* Currency */}
        <CurrencyDisplay currencies={state.currencies} />

        {/* Slot grid */}
        <SlotGrid
          lastSpinResult={state.lastSpinResult}
          spinning={spinning}
          onSpinDone={handleSpinDone}
        />

        {/* Spin button */}
        <SpinButton
          phase={state.phase}
          currencies={state.currencies}
          onSpin={handleSpin}
        />

        {/* Market */}
        {showMarket && (
          <Market currencies={state.currencies} onBuy={handleBuy} />
        )}

        {/* Overlays */}
        {state.phase === 'gameover' && <GameOverScreen onReset={handleReset} />}
        {state.phase === 'win' && (
          <WinModal onContinue={handleContinue} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
