import { useQuery } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import { fetchLiveOracle } from '../lib/indexer'
import type { OracleData } from '../lib/indexer'

export function useBTCPrice() {
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['oracle', 'current'],
    queryFn: () => fetchLiveOracle(client),
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 2,
  })
}

export type { OracleData }
