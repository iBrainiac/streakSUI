import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react'
import { UNDERLYING } from '../lib/config'
import {
  asDecodable,
  binaryDescriptor,
  createPredict,
  nearestTradeableMarket,
  quoteSpend,
  rangeDescriptor,
  roundUsdc,
} from '../lib/predict'
import { SHIELD_COST_RAW } from './useStreakShield'
import type { Pick as StreakPick } from './useStreak'

export type SubmittedPick = {
  digest: string
  orderId: string
  marketId: string
  expiryMs: number
  strikeUsd: number
}

const SHIELD_HALF_WIDTH_USD = 100

export function usePredict() {
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const { signAndExecuteTransaction } = useDAppKit()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function wait(digest: string) {
    await client.core.waitForTransaction({ digest })
    if (account) {
      await queryClient.invalidateQueries({ queryKey: ['dusdc-balance', account.address] })
    }
  }

  async function execute(tx: Parameters<typeof signAndExecuteTransaction>[0]['transaction']) {
    const result = await signAndExecuteTransaction({ transaction: tx })
    if (result.$kind === 'FailedTransaction') {
      throw new Error(
        result.FailedTransaction.status.error?.message ?? 'Transaction failed on-chain',
      )
    }
    const digest = result.Transaction.digest
    await wait(digest)
    return { digest, result }
  }

  async function ensureFunded(spendUsdc: number) {
    if (!account) throw new Error('Connect a wallet first')
    const predict = createPredict(client)
    const owner = account.address

    let accountUsd = 0
    let exists = true
    try {
      accountUsd = await predict.read.balance(owner)
    } catch {
      exists = false
    }

    const shortfall = roundUsdc(Math.max(0, spendUsdc - accountUsd))
    if (!exists) {
      const { digest } = await execute(
        predict.tx.deposit(owner, Math.max(shortfall, spendUsdc), { create: true }),
      )
      return { predict, created: true, digest }
    }
    if (shortfall > 0) {
      await execute(predict.tx.deposit(owner, shortfall))
    }
    return { predict, created: false }
  }

  async function submitPick(params: {
    direction: 'UP' | 'DOWN'
    spendUsdc: number
    withShield?: boolean
  }): Promise<SubmittedPick | null> {
    if (!account) return null
    setIsPending(true)
    setError(null)
    try {
      const shieldUsd = params.withShield ? Number(SHIELD_COST_RAW) / 1_000_000 : 0
      const { predict } = await ensureFunded(params.spendUsdc + shieldUsd)

      const market = nearestTradeableMarket(await predict.read.markets())
      if (!market) throw new Error('No open BTC market to trade')

      const descriptor = binaryDescriptor(market, params.direction === 'UP' ? 'up' : 'down')
      const quote = await quoteSpend(predict, account.address, descriptor, params.spendUsdc)
      const minQuantity = roundUsdc(quote.quantity * 0.9)
      const { digest, result } = await execute(
        await predict.tx.mintCost(account.address, descriptor, {
          spend: params.spendUsdc,
          minQuantity,
        }),
      )

      let orderId = ''
      try {
        orderId = predict.decode.mint(asDecodable(result)).orderId.toString()
      } catch {
        const open = await predict.read.positions(account.address)
        const match = open.find((p) => p.marketId === market.id)
        orderId = match?.orderId.toString() ?? digest
      }

      if (params.withShield && market.referencePrice !== null) {
        try {
          const range = rangeDescriptor(market, SHIELD_HALF_WIDTH_USD)
          const shieldQuote = await quoteSpend(predict, account.address, range, shieldUsd)
          await execute(
            await predict.tx.mintCost(account.address, range, {
              spend: shieldUsd,
              minQuantity: roundUsdc(shieldQuote.quantity * 0.9),
            }),
          )
        } catch {
          // Directional pick still stands if the shield mint is rejected.
        }
      }

      return {
        digest,
        orderId,
        marketId: market.id,
        expiryMs: Number(market.expiryMs),
        strikeUsd: market.referencePrice ?? 0,
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
      return null
    } finally {
      setIsPending(false)
    }
  }

  async function claimPick(pick: StreakPick): Promise<{ payout: number } | null> {
    if (!account || !pick.orderId || !pick.marketId) return null
    setIsPending(true)
    setError(null)
    try {
      const predict = createPredict(client)
      const { result } = await execute(
        await predict.tx.claimSettled(
          account.address,
          {
            underlying: UNDERLYING,
            expiryMs: pick.expiryTimestamp,
            marketId: pick.marketId,
          },
          { orderId: BigInt(pick.orderId) },
        ),
      )
      try {
        return { payout: predict.decode.claim(asDecodable(result)).payout }
      } catch {
        return { payout: 0 }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed')
      return null
    } finally {
      setIsPending(false)
    }
  }

  return { submitPick, claimPick, isPending, error }
}
