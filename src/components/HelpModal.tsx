interface Props {
  topic: 'game' | 'reel' | 'spin' | 'market' | 'achievements' | 'magic'
  onClose: () => void
}

const CONTENT: Record<Props['topic'], { heading: string; body: React.ReactNode }> = {
  game: {
    heading: 'About Slot RPG',
    body: (
      <>
        <p>Slot RPG is a non-idle incremental game where you earn resources by spinning the slot machine. </p>
        <p>Use your earnings to buy new icons from the <strong>Reels Store</strong> and add them to your <strong>Reel</strong>, creating more powerful combinations.</p>
        <p>The <strong>Feats</strong> tab contains achievements and challenges that unlock automatically as you play.</p>
        <p className="text-xs text-gray-400 border-t border-gray-600 pt-3 mt-2"><strong>AI &amp; Attribution</strong> — Claude (an AI assistant) was used only for programming this game. The design is original and no AI-generated art assets were used.</p>
      </>
    ),
  },
  reel: {
    heading: 'The Reel Tab',
    body: (
      <>
        <p>The <strong>Reel</strong> is the pool of icons that can appear when you spin. Each icon you buy is added to the reel and will show up in future spins.</p>
        <p><strong>Prestige</strong> resets your currencies and reel back to the start, but lets you keep up to two icons you've already unlocked.</p>
      </>
    ),
  },
  spin: {
    heading: 'The Spin Tab',
    body: (
      <>
        <p><strong>Ways to Win</strong> — this slot machine uses a "Ways to Win" system. When identical icons appear across all columns, you earn currency by multiplying the number of matching icons in each column.</p>
        <div className="rounded-lg overflow-hidden border border-gray-600 my-2 w-fit mx-auto">
          <div className="grid grid-cols-5 gap-px bg-gray-600">
            <div className="relative bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎<span className="absolute bottom-0 right-0.5 text-[8px] text-gray-400 leading-none">×2</span></div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🟤</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-yellow-400">💨</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-yellow-400">💨</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-yellow-400">💨</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🟤</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-yellow-400">💨</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🟤</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🟤</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🍎</div>
            <div className="bg-gray-800 w-9 h-9 flex items-center justify-center text-base ring-1 ring-inset ring-green-500">🟤</div>
          </div>
        </div>
        <p className="text-xs">→ 4 🍎 Apples (2 × 1 × 2 × 1 × 1)</p>
        <p className="text-xs">→ 1 🟤 Copper (1 × 1 × 1 × 1 × 1)</p>
        <p className="text-xs">→ Air does not pay out — not present in every column</p>
        <p>Each spin costs one 🍎 Apple. Be careful not to run out!</p>
        <p>Buy icons from the <strong>Reels Store</strong> to increase your possible payouts.</p>
        <p>After each spin you enter the <strong>Magic Phase</strong> — open its ❓ for details.</p>
      </>
    ),
  },
  market: {
    heading: 'The Reels Store',
    body: (
      <>
        <p>The <strong>Reels Store</strong> lets you spend currencies to buy new icons and add them to your reel.</p>
        <p>You cannot buy an icon if it would fill more than half of your reel slots with that single icon type.</p>
        <p>Visit the <strong>Reel</strong> tab to see all the icons currently in your slot machine.</p>
      </>
    ),
  },
  achievements: {
    heading: 'Feats',
    body: (
      <>
        <p><strong>Feats</strong> are achievements that unlock automatically when you meet in-game conditions. Check the Feats tab to see your progress.</p>
      </>
    ),
  },
  magic: {
    heading: 'The Magic Phase',
    body: (
      <>
        <p>After each spin you can use these currencies before claiming your result:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Respin</strong> — spend 💨 Air to re-roll a column</li>
          <li><strong>Swap</strong> — spend 💧 Water to swap two adjacent cells</li>
          <li><strong>Block</strong> — spend 🌿 Earth to exclude a column from the payout</li>
          <li><strong>Boost Value</strong> — spend 🔥 Fire to double an icon's value</li>
        </ul>
        <p>Claim when you're happy with the result.</p>
        <p>Spin the slot machine to earn elemental currencies (💨 Air, 💧 Water, 🌿 Earth, 🔥 Fire) needed for Magic Phase actions.</p>
      </>
    ),
  },
}

export function HelpModal({ topic, onClose }: Props) {
  const { heading, body } = CONTENT[topic]

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-600 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-100">{heading}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-300 space-y-3">{body}</div>
      </div>
    </div>
  )
}
