import { useQuery } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import { createPredict, tradeableMarkets } from '../lib/predict'
import type { ActiveMarket } from '@mysten/deepbook-v3/predict'

export type LeaderboardRow = {
  marketId: string
  expiryMs: number
  referencePrice: number | null
  mintPaused: boolean
  rank: number
}

export function useLeaderboard() {
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['live-markets'],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const markets: ActiveMarket[] = await createPredict(client).read.markets()
      return tradeableMarkets(markets).map((m, i) => ({
        marketId: m.id,
        expiryMs: Number(m.expiryMs),
        referencePrice: m.referencePrice,
        mintPaused: m.mintPaused,
        rank: i + 1,
      }))
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}
