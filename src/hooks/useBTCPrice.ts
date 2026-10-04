import { useQuery } from '@tanstack/react-query'
import { fetchLiveOracle } from '../lib/indexer'
import type { OracleData } from '../lib/indexer'

export function useBTCPrice() {
  return useQuery({
    queryKey: ['oracle', 'current'],
    queryFn: fetchLiveOracle,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}

export type { OracleData }
