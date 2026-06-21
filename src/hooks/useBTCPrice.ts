import { useQuery } from '@tanstack/react-query'
import { fetchCurrentOracle } from '../lib/indexer'

export function useBTCPrice() {
  return useQuery({
    queryKey: ['oracle', 'current'],
    queryFn: fetchCurrentOracle,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
