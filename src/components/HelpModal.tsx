interface Props {
  topic: 'game' | 'reel' | 'spin' | 'market' | 'achievements'
  onClose: () => void
}

const CONTENT: Record<Props['topic'], { heading: string; body: React.ReactNode }> = {
  game: {
    heading: 'About Slot RPG',
    body: (
      <>
        <p>Slot RPG is a slot-machine game where you earn currencies by spinning the reel. Use your earnings to buy new icons and add them to your reel, creating more powerful combinations.</p>
        <p>After each spin you enter the <strong>magic phase</strong>, where you can respin a column, swap two icons, block a column, or increase an icon's value — then claim your results.</p>
        <p>Upgrade through tiers: earn Copper → Silver → Gold → Crowns. Collect all four elemental currencies to unlock the Energy icon. Prestige to start fresh while keeping a few icons.</p>
        <p className="text-xs text-gray-400 border-t border-gray-600 pt-3 mt-2"><strong>AI &amp; Attribution</strong> — Claude (an AI assistant) was used only for programming this game. The design is original and no AI-generated art assets were used.</p>
      </>
    ),
  },
  reel: {
    heading: 'The Reel Tab',
    body: (
      <>
        <p>The <strong>Reel</strong> is the pool of icons that can appear when you spin. Each icon you buy is added to the reel and will show up in future spins.</p>
        <p><strong>Prestige</strong> resets your currencies and reel back to the start, but lets you keep up to two icons you've already unlocked — useful for building momentum in a new run.</p>
      </>
    ),
  },
  spin: {
    heading: 'The Spin Tab',
    body: (
      <>
        <p><strong>Ways to Win</strong> — this slot machine uses a "Ways to Win" system. When identical icon families appear across all columns from left to right, you earn currency by multiplying the number of matching icons in each column together.</p>
        <p>After each spin you enter the <strong>magic phase</strong> with optional actions:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Respin</strong> a column to re-roll its icons</li>
          <li><strong>Swap</strong> two icons between positions</li>
          <li><strong>Block</strong> a column to exclude it from the payout</li>
          <li><strong>Increase Value</strong> to double an icon's value</li>
        </ul>
        <p>Claim when you're happy with the result.</p>
      </>
    ),
  },
  market: {
    heading: 'The Reels Store',
    body: (
      <>
        <p>The <strong>Reels Store</strong> lets you spend currencies to buy new icons and add them to your reel.</p>
        <p>Icons come in three cost tiers: <strong>Copper</strong> (cheap), <strong>Silver</strong> (mid-tier), and <strong>Gold</strong> (expensive). Higher-tier icons produce more valuable payouts.</p>
        <p>You cannot buy an icon if it would fill more than half of your reel slots with that single icon type.</p>
      </>
    ),
  },
  achievements: {
    heading: 'Feats',
    body: (
      <>
        <p><strong>Feats</strong> are achievements that unlock automatically when you meet in-game conditions. Check the Feats tab to see your progress.</p>
        <p>The <strong>Happily Ever After</strong> feat is a meta-achievement — it unlocks only once you've earned all other feats.</p>
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
