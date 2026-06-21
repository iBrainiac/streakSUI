import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { PriceDisplay } from '../components/PriceDisplay'
import { Countdown } from '../components/Countdown'
import { StreakDisplay } from '../components/StreakDisplay'
import { FaucetBanner } from '../components/FaucetBanner'
import { useBTCPrice } from '../hooks/useBTCPrice'
import { usedUSDCBalance } from '../hooks/usedUSDCBalance'
import { useStreak } from '../hooks/useStreak'

export function Dashboard() {
  const navigate = useNavigate()
  const account = useCurrentAccount()
  const { data: oracle } = useBTCPrice()
  const { data: balance } = usedUSDCBalance()
  const { streak, todayPick, hasPickedToday } = useStreak()

  const showFaucetBanner = !!account && balance?.total === BigInt(0)
  const canPick = !!account && !hasPickedToday && !!oracle

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <h1 className="text-white font-black text-xl tracking-tight">StreakSui</h1>
          <p className="text-gray-600 text-xs">Daily BTC Predict</p>
        </div>
        <ConnectButton />
      </header>

      <main className="flex-1 flex flex-col gap-5 px-4 py-4 max-w-md mx-auto w-full">
        {showFaucetBanner && <FaucetBanner />}

        <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-8 flex flex-col items-center gap-6">
          <PriceDisplay />
          {oracle && <Countdown expiryTimestamp={oracle.expiryTimestamp} />}
        </div>

        {account && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-8 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Current Streak
            </p>
            <StreakDisplay streak={streak} />
          </div>
        )}

        {account && todayPick && (
          <div
            className={`rounded-xl border px-4 py-3 text-center ${
              todayPick.status === 'pending'
                ? 'bg-blue-500/10 border-blue-500/30'
                : todayPick.status === 'won'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
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
            <p className="text-xs text-gray-500 mt-1 capitalize">{todayPick.status}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/pick')}
          disabled={!canPick}
          className={`w-full rounded-2xl py-5 text-lg font-black transition-all ${
            canPick
              ? 'bg-white text-black active:scale-95 hover:bg-gray-100'
              : hasPickedToday
                ? 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {!account
            ? 'Connect wallet to play'
            : hasPickedToday
              ? "Pick made — come back tomorrow"
              : "Make today's pick"}
        </button>

        {account && (
          <div className="flex justify-between text-xs text-gray-600 px-1">
            <span>
              Balance:{' '}
              {balance
                ? `${(Number(balance.total) / 1_000_000).toFixed(2)} dUSDC`
                : '...'}
            </span>
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-gray-500 hover:text-white transition-colors"
            >
              Leaderboard →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
