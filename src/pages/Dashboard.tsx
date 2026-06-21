import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { PriceDisplay } from '../components/PriceDisplay'
import { Countdown } from '../components/Countdown'
import { StreakDisplay } from '../components/StreakDisplay'
import { FaucetBanner } from '../components/FaucetBanner'
import { BadgeUnlockModal } from '../components/BadgeUnlockModal'
import { ShareCardModal } from '../components/ShareCardModal'
import { useBTCPrice } from '../hooks/useBTCPrice'
import { usedUSDCBalance } from '../hooks/usedUSDCBalance'
import { useStreak } from '../hooks/useStreak'
import { useAutoRedeem } from '../hooks/useAutoRedeem'
import { useBadges, ALL_BADGES } from '../hooks/useBadges'
import { useStreakShield } from '../hooks/useStreakShield'

export function Dashboard() {
  const navigate = useNavigate()
  const account = useCurrentAccount()
  const { data: oracle } = useBTCPrice()
  const { data: balance } = usedUSDCBalance()
  const { streak, bestStreak, picks, todayPick, hasPickedToday } = useStreak()
  const [showShare, setShowShare] = useState(false)
  const { everUsed } = useStreakShield(account?.address)

  const { earned, newlyUnlocked, dismissUnlock } = useBadges({
    address: account?.address,
    streak,
    picks,
    shieldUsed: everUsed,
  })

  useAutoRedeem()

  const showFaucetBanner = !!account && balance?.total === BigInt(0)
  const canPick = !!account && !hasPickedToday && !!oracle

  const minutesToExpiry = oracle
    ? Math.max(0, (oracle.expiryTimestamp - Date.now()) / 60_000)
    : null

  const streakAtRisk =
    account &&
    streak > 0 &&
    !hasPickedToday &&
    minutesToExpiry !== null &&
    minutesToExpiry < 60

  const settledPicks = picks.filter((p) => p.status !== 'pending')
  const wins = settledPicks.filter((p) => p.status === 'won').length
  const winRate = settledPicks.length > 0 ? Math.round((wins / settledPicks.length) * 100) : 0

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {showShare && account && (
        <ShareCardModal
          address={account.address}
          streak={streak}
          bestStreak={bestStreak}
          earned={earned}
          winRate={winRate}
          onClose={() => setShowShare(false)}
        />
      )}
      {newlyUnlocked.length > 0 && (
        <BadgeUnlockModal
          badgeId={newlyUnlocked[0]}
          onDismiss={dismissUnlock}
        />
      )}

      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <h1 className="text-white font-black text-xl tracking-tight">StreakSui</h1>
          <p className="text-gray-600 text-xs">Daily BTC Predict</p>
        </div>
        <ConnectButton />
      </header>

      <main className="flex-1 flex flex-col gap-5 px-4 py-4 max-w-md mx-auto w-full">
        {showFaucetBanner && <FaucetBanner />}

        {streakAtRisk && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-amber-300 font-bold text-sm">Streak at risk</p>
              <p className="text-amber-400/70 text-xs">
                {streak}-day streak expires in {Math.round(minutesToExpiry!)} min — pick now
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-8 flex flex-col items-center gap-6">
          <PriceDisplay />
          {oracle && <Countdown expiryTimestamp={oracle.expiryTimestamp} />}
        </div>

        {account && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-6 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Current Streak
            </p>
            <StreakDisplay streak={streak} />

            {earned.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-white/5 w-full">
                {earned.map((id) => {
                  const badge = ALL_BADGES.find((b) => b.id === id)
                  return badge ? (
                    <span key={id} title={`${badge.name}: ${badge.desc}`} className="text-2xl">
                      {badge.emoji}
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}

        {account && todayPick && (
          <div
            className={`rounded-xl border px-4 py-3 text-center ${
              todayPick.status === 'pending'
                ? 'bg-blue-500/10 border-blue-500/30'
                : todayPick.status === 'won'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : todayPick.status === 'shielded_loss'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <p className="text-xs text-gray-400 mb-1">Today's pick</p>
            <p
              className={`text-lg font-bold ${
                todayPick.direction === 'UP' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {todayPick.direction === 'UP' ? '▲ UP' : '▼ DOWN'}
            </p>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {todayPick.status === 'shielded_loss' ? '🛡️ Shielded — streak kept' : todayPick.status}
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/pick')}
          disabled={!canPick}
          className={`w-full rounded-2xl py-5 text-lg font-black transition-all ${
            canPick
              ? 'bg-white text-black active:scale-95 hover:bg-gray-100'
              : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {!account
            ? 'Connect wallet to play'
            : hasPickedToday
              ? 'Pick made — come back tomorrow'
              : "Make today's pick"}
        </button>

        {account && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowShare(true)}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-900 border border-white/5 py-4 hover:border-[#4da2ff]/30 hover:bg-[#4da2ff]/5 transition-all active:scale-95"
              >
                <span className="text-xl">🔗</span>
                <span className="text-xs font-semibold text-gray-300">Share</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-900 border border-white/5 py-4 hover:border-[#4da2ff]/30 hover:bg-[#4da2ff]/5 transition-all active:scale-95"
              >
                <span className="text-xl">👤</span>
                <span className="text-xs font-semibold text-gray-300">Profile</span>
              </button>
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-900 border border-white/5 py-4 hover:border-[#4da2ff]/30 hover:bg-[#4da2ff]/5 transition-all active:scale-95"
              >
                <span className="text-xl">🏆</span>
                <span className="text-xs font-semibold text-gray-300">Leaderboard</span>
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Balance:{' '}
              {balance
                ? `${(Number(balance.total) / 1_000_000).toFixed(2)} dUSDC`
                : '...'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
