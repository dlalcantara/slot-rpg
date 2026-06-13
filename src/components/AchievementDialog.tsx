import { ACHIEVEMENTS } from '../game/achievements'
import type { AchievementId } from '../game/achievements'

interface Props {
  achievementId: AchievementId | null
  onDismiss: () => void
}

export function AchievementDialog({ achievementId, onDismiss }: Props) {
  if (!achievementId) return null

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
  if (!achievement) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-yellow-400 p-6 max-w-sm w-full text-center space-y-4">
        <div className="text-4xl">🏆</div>
        <div>
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Achievement Unlocked</p>
          <h2 className="text-xl font-bold text-yellow-300">{achievement.title}</h2>
        </div>
        <p className="text-gray-300 text-sm">{achievement.description}</p>
        <button
          onClick={onDismiss}
          className="w-full py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
