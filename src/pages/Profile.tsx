import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useStreak } from '../hooks/useStreak'
import { useBadges, ALL_BADGES } from '../hooks/useBadges'
import { useStreakShield } from '../hooks/useStreakShield'
import { ShareCardModal } from '../components/ShareCardModal'

function truncate(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

export function Profile() {
  const navigate = useNavigate()
  const account = useCurrentAccount()
  const { picks, streak, bestStreak } = useStreak()
  const { everUsed } = useStreakShield(account?.address)
  const [showShare, setShowShare] = useState(false)

  const settled = picks.filter((p) => p.status !== 'pending')
  const wins = settled.filter((p) => p.status === 'won').length
  const losses = settled.filter((p) => p.status === 'lost').length
  const shielded = settled.filter((p) => p.status === 'shielded_loss').length
  const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0
  const totalPnl = settled.reduce((sum, p) => sum + p.pnl, 0)

  const { earned } = useBadges({
    address: account?.address,
    streak,
    picks,
    shieldUsed: everUsed,
  })

  if (!account) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-400 text-center">Connect your wallet to view your profile</p>
        <button
          onClick={() => navigate('/app')}
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {showShare && (
        <ShareCardModal
          address={account.address}
          streak={streak}
          bestStreak={bestStreak}
          earned={earned}
          winRate={winRate}
          onClose={() => setShowShare(false)}
        />
      )}

      <header className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={() => navigate('/app')}
          className="text-gray-400 hover:text-white transition-colors text-lg"
        >
          ←
        </button>
        <h2 className="text-white font-black text-lg">Profile</h2>
        <button
          onClick={() => setShowShare(true)}
          className="ml-auto text-sm font-semibold px-4 py-1.5 rounded-full border border-[#4da2ff]/30 text-[#4da2ff] hover:bg-[#4da2ff]/10 transition-colors"
        >
          Share →
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-md mx-auto w-full">
        {/* Identity */}
        <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
          <p className="text-xs text-gray-600 font-mono mb-1">{truncate(account.address)}</p>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-white font-black text-5xl leading-none">{streak}</p>
              <p className="text-gray-500 text-xs mt-1">current streak</p>
            </div>
            {bestStreak > streak && (
              <div className="mb-1">
                <p className="text-gray-400 font-bold text-lg">{bestStreak}</p>
                <p className="text-gray-600 text-xs">best ever</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <p className="text-white font-black text-3xl">{winRate}%</p>
            <p className="text-gray-500 text-xs mt-1">win rate</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <p
              className={`font-black text-3xl ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </p>
            <p className="text-gray-500 text-xs mt-1">total PnL (dUSDC)</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <p className="text-white font-black text-3xl">{wins}</p>
            <p className="text-gray-500 text-xs mt-1">wins</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <div className="flex items-end gap-2">
              <p className="text-white font-black text-3xl">{losses}</p>
              {shielded > 0 && (
                <p className="text-amber-400 text-sm mb-0.5 font-semibold">+{shielded} 🛡️</p>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">losses{shielded > 0 ? ' (shielded)' : ''}</p>
          </div>
        </div>

        {/* Badges */}
        {earned.length > 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Badges</p>
            <div className="grid grid-cols-3 gap-3">
              {ALL_BADGES.map((badge) => {
                const unlocked = earned.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-3 text-center border transition-colors ${
                      unlocked
                        ? 'bg-[#4da2ff]/5 border-[#4da2ff]/20'
                        : 'bg-zinc-800/50 border-white/5 opacity-40'
                    }`}
                  >
                    <p className="text-2xl mb-1">{badge.emoji}</p>
                    <p className="text-xs text-white font-semibold leading-tight">{badge.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-tight">{badge.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pick history */}
        {picks.length > 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Pick history</p>
            <div className="flex flex-col gap-2">
              {[...picks]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((pick) => (
                  <div
                    key={pick.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-black ${
                          pick.direction === 'UP' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {pick.direction === 'UP' ? '▲' : '▼'}
                      </span>
                      <span className="text-gray-400 text-xs">{pick.date}</span>
                      {pick.shielded && (
                        <span className="text-xs">🛡️</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{pick.amount} dUSDC</span>
                      <span
                        className={`text-xs font-bold capitalize ${
                          pick.status === 'won'
                            ? 'text-emerald-400'
                            : pick.status === 'shielded_loss'
                              ? 'text-amber-400'
                              : pick.status === 'lost'
                                ? 'text-red-400'
                                : 'text-gray-500'
                        }`}
                      >
                        {pick.status === 'shielded_loss' ? 'shielded' : pick.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {picks.length === 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">No picks yet — make your first call</p>
            <button
              onClick={() => navigate('/pick')}
              className="mt-4 text-sm font-bold px-6 py-2.5 rounded-xl text-black transition-all active:scale-95"
              style={{ background: '#4da2ff' }}
            >
              Make a Pick
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
