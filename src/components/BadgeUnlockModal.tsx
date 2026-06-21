import { ALL_BADGES } from '../hooks/useBadges'
import type { BadgeId } from '../hooks/useBadges'

type Props = {
  badgeId: BadgeId
  onDismiss: () => void
}

export function BadgeUnlockModal({ badgeId, onDismiss }: Props) {
  const badge = ALL_BADGES.find((b) => b.id === badgeId)
  if (!badge) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-xs w-full text-center animate-badge-pop shadow-2xl">
        <p className="text-5xl mb-4">{badge.emoji}</p>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Badge unlocked</p>
        <p className="text-white font-black text-2xl mb-1">{badge.name}</p>
        <p className="text-gray-400 text-sm mb-6">{badge.desc}</p>
        <button
          onClick={onDismiss}
          className="w-full bg-white text-black font-black py-3 rounded-xl active:scale-95 transition-transform"
        >
          Awesome
        </button>
      </div>
    </div>
  )
}
