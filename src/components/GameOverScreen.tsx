interface Props {
  onReset: () => void
}

export function GameOverScreen({ onReset }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 border border-red-800">
        <h2 className="text-3xl font-bold text-red-400">Game Over</h2>
        <p className="text-gray-300">You ran out of Food. Better luck next time!</p>
        <button
          onClick={onReset}
          className="w-full py-3 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 transition-all"
        >
          Reset &amp; Play Again
        </button>
      </div>
    </div>
  )
}
