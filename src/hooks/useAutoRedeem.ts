import { useEffect, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useStreak } from './useStreak'
import { usePredict } from './usePredict'
import { INDEXER_URL, PRICE_SCALE } from '../lib/config'
import type { Pick } from './useStreak'

async function fetchSettlementPrice(oracleId: string): Promise<number | null> {
  try {
    const res = await fetch(`${INDEXER_URL}/oracles?oracle_id=${oracleId}&limit=1`)
    if (!res.ok) return null
    const data: Array<Record<string, unknown>> = await res.json()
    const oracle = data[0]
    if (!oracle || oracle.status !== 'settled' || !oracle.settlement_price) return null
    return Number(oracle.settlement_price) / PRICE_SCALE
  } catch {
    return null
  }
}

function didWin(pick: Pick, settlementPriceUSD: number): boolean {
  const strikePriceUSD = pick.strike / PRICE_SCALE
  return pick.direction === 'UP'
    ? settlementPriceUSD > strikePriceUSD
    : settlementPriceUSD < strikePriceUSD
}

export function useAutoRedeem() {
  const account = useCurrentAccount()
  const { pendingPicks, resolvePick } = useStreak()
  const { redeemPosition } = usePredict()

  const pendingRef = useRef(pendingPicks)
  const redeemRef = useRef(redeemPosition)
  const resolveRef = useRef(resolvePick)
  const accountRef = useRef(account)

  pendingRef.current = pendingPicks
  redeemRef.current = redeemPosition
  resolveRef.current = resolvePick
  accountRef.current = account

  useEffect(() => {
    let cancelled = false

    async function processExpiredPicks() {
      if (!accountRef.current || cancelled) return

      const expired = pendingRef.current.filter((p) => p.expiryTimestamp < Date.now())
      if (!expired.length) return

      for (const pick of expired) {
        if (cancelled) break

        const settlementPrice = await fetchSettlementPrice(pick.oracleId)
        if (settlementPrice === null) continue

        const won = didWin(pick, settlementPrice)

        if (won) {
          const success = await redeemRef.current({
            oracleObjectId: pick.oracleId,
            direction: pick.direction,
            expiry: pick.expiryTimestamp,
            strike: pick.strike,
            amount: BigInt(pick.amountRaw),
          })
          if (success) {
            resolveRef.current(pick.positionId, true, pick.amount)
          }
        } else {
          resolveRef.current(pick.positionId, false, -pick.amount)
        }
      }
    }

    processExpiredPicks()
    const interval = setInterval(processExpiredPicks, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])
}
