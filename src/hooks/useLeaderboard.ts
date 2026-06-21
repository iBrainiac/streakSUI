import { useQuery } from '@tanstack/react-query'
import { fetchActivePlayers } from '../lib/indexer'
import type { ActivePlayer } from '../lib/indexer'

export type LeaderboardRow = ActivePlayer & {
  rank: number
  isCurrentUser: boolean
  streak?: number
}

export function useLeaderboard(currentAddress?: string, currentStreak?: number) {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const players = await fetchActivePlayers(50)
      return players
        .sort((a, b) => b.joinedAt - a.joinedAt)
        .map((p, i) => ({
          ...p,
          rank: i + 1,
          isCurrentUser: p.address === currentAddress,
          streak: p.address === currentAddress ? currentStreak : undefined,
        }))
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
