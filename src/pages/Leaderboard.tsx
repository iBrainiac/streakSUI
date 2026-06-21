import { useNavigate } from 'react-router-dom'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useStreak } from '../hooks/useStreak'
import { useBTCPrice } from '../hooks/useBTCPrice'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { ALL_BADGES } from '../hooks/useBadges'
import { useBadges } from '../hooks/useBadges'
import { useStreakShield } from '../hooks/useStreakShield'

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function AtRiskBadge() {
  return (
    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
      at risk
    </span>
  )
}

export function Leaderboard() {
  const navigate = useNavigate()
  const account = useCurrentAccount()
  const { streak, hasPickedToday } = useStreak()
  const { data: oracle } = useBTCPrice()
  const { data: rows, isLoading } = useLeaderboard(account?.address, streak)
  const { picks } = useStreak()
  const { everUsed } = useStreakShield(account?.address)

  const currentRank = rows?.find((r) => r.isCurrentUser)?.rank
  const { earned } = useBadges({
    address: account?.address,
    streak,
    picks,
    shieldUsed: everUsed,
    rank: currentRank,
  })

  const minutesToExpiry = oracle
    ? Math.max(0, (oracle.expiryTimestamp - Date.now()) / 60_000)
    : null

  const streakAtRisk =
    account &&
    streak > 0 &&
    !hasPickedToday &&
    minutesToExpiry !== null &&
    minutesToExpiry < 60

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors text-lg"
        >
          ←
        </button>
        <h2 className="text-white font-black text-lg">Live Players</h2>
        {rows && (
          <span className="ml-auto text-xs text-gray-600">
            {rows.length} on-chain
          </span>
        )}
      </header>

      <main className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-md mx-auto w-full">
        {account && (
          <div className="rounded-2xl bg-zinc-900 border border-violet-500/30 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Your stats</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-black text-3xl">{streak}</p>
                <p className="text-gray-500 text-xs">day streak</p>
              </div>
              {currentRank && (
                <div className="text-right">
                  <p className="text-white font-black text-xl">#{currentRank}</p>
                  <p className="text-gray-500 text-xs">rank</p>
                </div>
              )}
            </div>

            {earned.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {earned.map((id) => {
                  const badge = ALL_BADGES.find((b) => b.id === id)
                  return badge ? (
                    <span
                      key={id}
                      title={badge.desc}
                      className="text-lg"
                    >
                      {badge.emoji}
                    </span>
                  ) : null
                })}
              </div>
            )}

            {streakAtRisk && (
              <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                <span className="text-amber-400 text-sm">⚠️</span>
                <p className="text-amber-300 text-xs">
                  Your {streak}-day streak expires in {Math.round(minutesToExpiry!)} min — pick now
                </p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-600 uppercase tracking-widest px-1">
          Protocol participants
        </p>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />
            ))}
          </div>
        )}

        {rows && (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.managerId}
                className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
                  row.isCurrentUser
                    ? 'bg-violet-500/10 border border-violet-500/20'
                    : 'bg-zinc-900 border border-white/5'
                }`}
              >
                <span className="text-xs font-mono text-gray-500 w-6 text-right">
                  {row.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-mono font-bold truncate ${
                        row.isCurrentUser ? 'text-violet-300' : 'text-gray-300'
                      }`}
                    >
                      {row.isCurrentUser ? 'You' : truncate(row.address)}
                    </p>
                    {row.isCurrentUser && streakAtRisk && <AtRiskBadge />}
                  </div>
                  <p className="text-xs text-gray-600">
                    joined{' '}
                    {new Date(row.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {row.streak !== undefined && (
                  <div className="text-right">
                    <p className="text-white font-black text-lg">{row.streak}</p>
                    <p className="text-gray-600 text-xs">streak</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!account && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-8 text-center">
            <p className="text-gray-400 text-sm">Connect your wallet to see your rank</p>
          </div>
        )}
      </main>
    </div>
  )
}
