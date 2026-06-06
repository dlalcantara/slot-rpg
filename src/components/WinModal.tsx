interface Props {
  onContinue: () => void
  onReset: () => void
}

export function WinModal({ onContinue, onReset }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 border border-purple-700">
        <h2 className="text-3xl font-bold text-purple-400">You Win! 👑</h2>
        <p className="text-gray-300">You collected 100 Crowns. Magnificent!</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full py-3 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all"
          >
            Continue Playing
          </button>
          <button
            onClick={onReset}
            className="w-full py-2 text-sm rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all"
          >
            Reset &amp; Start Over
          </button>
        </div>
      </div>
    </div>
  )
}
