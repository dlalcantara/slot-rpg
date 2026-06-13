interface Props {
  onDismiss: () => void
}

export function StarvationModal({ onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 border border-amber-800">
        <h2 className="text-2xl font-bold text-amber-400">Starvation</h2>
        <p className="text-gray-300">You ran out of food. The slot machine has been reset.</p>
        <button
          onClick={onDismiss}
          className="w-full py-3 text-lg font-bold rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
