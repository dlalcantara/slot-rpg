import { ACHIEVEMENTS } from '../game/achievements'
import type { AchievementId } from '../game/achievements'

interface Props {
  unlockedAchievements: AchievementId[]
}

export function AchievementsTab({ unlockedAchievements }: Props) {
  const unlocked = new Set(unlockedAchievements)

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
      <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
        Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.filter((a) => !a.isWip).length})
      </h3>
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.id)
          const isWip = achievement.isWip

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-colors ${
                isUnlocked
                  ? 'bg-gray-700 border-green-500 text-white'
                  : isWip
                  ? 'bg-gray-900 border-gray-700 opacity-50'
                  : 'bg-gray-900 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${isUnlocked ? 'text-green-300' : 'text-gray-400'}`}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isWip ? 'Coming Soon' : achievement.description}
                  </p>
                </div>
                {isUnlocked && (
                  <span className="text-green-400 text-lg flex-shrink-0">✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
