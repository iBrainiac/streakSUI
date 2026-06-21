import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useBTCPrice } from '../hooks/useBTCPrice'
import { usedUSDCBalance } from '../hooks/usedUSDCBalance'
import { useStreak } from '../hooks/useStreak'
import { usePredict } from '../hooks/usePredict'
import { useStreakShield } from '../hooks/useStreakShield'
import { StreakShieldToggle } from '../components/StreakShieldToggle'
import { format } from 'date-fns'

type Direction = 'UP' | 'DOWN'

const DUSDC_DECIMALS = 6

export function Pick() {
  const navigate = useNavigate()
  const account = useCurrentAccount()
  const { data: oracle } = useBTCPrice()
  const { data: balance } = usedUSDCBalance()
  const { hasPickedToday, addPick } = useStreak()
  const { submitPick, isPending, error } = usePredict()
  const shield = useStreakShield(account?.address)

  const [direction, setDirection] = useState<Direction | null>(null)
  const [amountInput, setAmountInput] = useState('10')

  const maxAmount = balance ? Number(balance.total) / 10 ** DUSDC_DECIMALS : 0

  const shieldCostDUSDC = shield.active ? Number(shield.costRaw) / 10 ** DUSDC_DECIMALS : 0
  const totalCost = parseFloat(amountInput) + shieldCostDUSDC

  async function handleConfirm() {
    if (!account || !oracle || !direction || !balance?.coins.length) return

    const amount = parseFloat(amountInput)
    if (isNaN(amount) || amount <= 0 || totalCost > maxAmount) return

    const amountMist = BigInt(Math.round(amount * 10 ** DUSDC_DECIMALS))
    const bestCoin = balance.coins.sort(
      (a: { balance: string }, b: { balance: string }) =>
        Number(BigInt(b.balance) - BigInt(a.balance)),
    )[0]

    const digest = await submitPick({
      direction,
      oracle,
      dusdcCoinObjectId: bestCoin.objectId,
      amount: amountMist,
      withShield: shield.active,
    })

    if (digest) {
      if (shield.active) shield.consume()

      addPick({
        id: digest,
        date: format(new Date(), 'yyyy-MM-dd'),
        direction,
        amount,
        amountRaw: amountMist.toString(),
        positionId: digest,
        oracleId: oracle.oracleId,
        strike: oracle.atmStrike,
        expiryTimestamp: oracle.expiryTimestamp,
      })
      navigate('/')
    }
  }

  if (hasPickedToday) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors text-lg"
        >
          ←
        </button>
        <h2 className="text-white font-black text-lg">Make your pick</h2>
      </header>

      <main className="flex-1 flex flex-col gap-5 px-4 py-4 max-w-md mx-auto w-full">
        {oracle && (
          <div className="rounded-2xl bg-zinc-900 border border-white/5 px-6 py-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              Current BTC price
            </p>
            <p className="text-3xl font-black text-white">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(oracle.btcPrice)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Strike:{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(oracle.atmStrike)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDirection('UP')}
            className={`rounded-2xl py-8 font-black text-xl transition-all active:scale-95 ${
              direction === 'UP'
                ? 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-900 border border-white/5 text-emerald-400 hover:border-emerald-500/50'
            }`}
          >
            ▲ UP
          </button>
          <button
            onClick={() => setDirection('DOWN')}
            className={`rounded-2xl py-8 font-black text-xl transition-all active:scale-95 ${
              direction === 'DOWN'
                ? 'bg-rose-500 text-white scale-105 shadow-lg shadow-rose-500/20'
                : 'bg-zinc-900 border border-white/5 text-red-400 hover:border-red-500/50'
            }`}
          >
            ▼ DOWN
          </button>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/5 px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 uppercase tracking-widest">
              Amount
            </label>
            <button
              onClick={() =>
                setAmountInput(
                  Math.max(0, maxAmount - shieldCostDUSDC).toFixed(2),
                )
              }
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Max: {maxAmount.toFixed(2)} dUSDC
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={maxAmount}
              step="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-2xl font-black outline-none"
              placeholder="0"
            />
            <span className="text-gray-500 font-semibold">dUSDC</span>
          </div>
          {shield.active && (
            <p className="text-xs text-violet-400 mt-2">
              + 1 dUSDC shield = {totalCost.toFixed(2)} dUSDC total
            </p>
          )}
        </div>

        <StreakShieldToggle
          active={shield.active}
          available={shield.available}
          nextRecharge={shield.nextRecharge}
          onToggle={shield.toggle}
        />

        {error && (
          <p className="text-red-400 text-sm text-center px-2">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!direction || !oracle || isPending || parseFloat(amountInput) <= 0 || totalCost > maxAmount}
          className={`w-full rounded-2xl py-5 text-lg font-black transition-all ${
            direction && !isPending
              ? direction === 'UP'
                ? 'bg-emerald-500 text-white active:scale-95 hover:bg-emerald-400'
                : 'bg-rose-500 text-white active:scale-95 hover:bg-rose-400'
              : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isPending
            ? 'Confirming...'
            : direction
              ? `Confirm ${direction}${shield.active ? ' + Shield' : ''}`
              : 'Select UP or DOWN'}
        </button>

        <p className="text-xs text-gray-600 text-center">
          One pick per day. Results settle at expiry.
        </p>
      </main>
    </div>
  )
}
