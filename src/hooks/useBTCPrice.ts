import { useQuery } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import { fetchActiveOracle } from '../lib/indexer'
import { PRICE_SCALE, TICK_SIZE } from '../lib/config'
import type { OracleData } from '../lib/indexer'

type PriceData = { fields: { spot: string; forward: string } }
type OracleSVIJson = { prices: PriceData }

export function useBTCPrice() {
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['oracle', 'current'],
    queryFn: async (): Promise<OracleData> => {
      const meta = await fetchActiveOracle()

      const obj = await client.core.getObject({
        objectId: meta.oracleId,
        include: { json: true },
      })

      // JSON-RPC encodes nested Move structs as { fields: { ... } }
      const json = obj.object.json as OracleSVIJson | null | undefined
      const spot = Number(json?.prices?.fields?.spot ?? 0) / PRICE_SCALE
      const forward = Number(json?.prices?.fields?.forward ?? 0)
      const atmStrike = Math.round(forward / TICK_SIZE) * TICK_SIZE

      return {
        oracleId: meta.oracleId,
        btcPrice: spot,
        expiryTimestamp: meta.expiry,
        atmStrike,
      }
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
