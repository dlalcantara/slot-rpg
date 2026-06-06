interface Props {
  onReset: () => void
}

export function HardResetButton({ onReset }: Props) {
  return (
    <button
      onClick={onReset}
      className="px-3 py-1 text-xs text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-700 rounded-lg transition-colors"
      aria-label="Hard Reset"
    >
      Hard Reset
    </button>
  )
}
