import { ALL_BADGES } from '../hooks/useBadges'
import type { BadgeId } from '../hooks/useBadges'

type Props = {
  address: string
  streak: number
  bestStreak: number
  earned: BadgeId[]
  winRate: number
  onClose: () => void
}

export function ShareCardModal({ address, streak, bestStreak, earned, winRate, onClose }: Props) {
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`

  const tweetText = encodeURIComponent(
    `🔥 ${streak}-day BTC prediction streak on StreakSui!\n\nWin rate: ${winRate}% · Best streak: ${bestStreak}\n\nBuilt on DeepBook Predict on Sui 🌊`,
  )
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 px-4 pb-6 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card face — designed to be screenshot-worthy */}
        <div
          className="relative px-8 py-10 flex flex-col items-center text-center"
          style={{
            background: 'linear-gradient(145deg, #0f0f12 0%, #0d1a2e 100%)',
            border: '1px solid rgba(77,162,255,0.2)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: '#4da2ff' }}
          />

          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6 relative z-10">
            StreakSui
          </p>

          <p className="text-8xl font-black text-white relative z-10 leading-none mb-1">
            {streak}
          </p>
          <p className="text-sm text-gray-400 relative z-10 mb-6">day streak 🔥</p>

          {earned.length > 0 && (
            <div className="flex gap-3 mb-6 relative z-10">
              {earned.map((id) => {
                const badge = ALL_BADGES.find((b) => b.id === id)
                return badge ? (
                  <span key={id} className="text-2xl" title={badge.name}>
                    {badge.emoji}
                  </span>
                ) : null
              })}
            </div>
          )}

          <div className="flex gap-6 mb-6 relative z-10">
            <div>
              <p className="text-white font-black text-xl">{winRate}%</p>
              <p className="text-gray-600 text-xs">win rate</p>
            </div>
            <div
              className="w-px bg-white/10"
            />
            <div>
              <p className="text-white font-black text-xl">{bestStreak}</p>
              <p className="text-gray-600 text-xs">best streak</p>
            </div>
          </div>

          <p
            className="text-xs font-mono relative z-10"
            style={{ color: '#4da2ff' }}
          >
            {truncated}
          </p>
        </div>

        {/* Actions */}
        <div className="bg-zinc-900 border-t border-white/5 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:border-white/20 transition-colors"
          >
            Close
          </button>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl text-black font-black text-sm text-center transition-all active:scale-95"
            style={{ background: '#4da2ff' }}
          >
            Share on X →
          </a>
        </div>
      </div>
    </div>
  )
}
