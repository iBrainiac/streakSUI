import { INDEXER_URL } from './config'

export type OracleMeta = {
  oracleId: string
  predictId: string
  expiry: number
  minStrike: number
  tickSize: number
  status: string
}

export type OracleData = {
  oracleId: string
  btcPrice: number
  expiryTimestamp: number
  atmStrike: number
}

export type LeaderboardEntry = {
  address: string
  streak: number
  winRate: number
  totalPicks: number
}

// Fetches the nearest active BTC oracle from the predict indexer.
export async function fetchActiveOracle(): Promise<OracleMeta> {
  const res = await fetch(
    `${INDEXER_URL}/oracles?status=active&limit=1`,
  )
  if (!res.ok) throw new Error(`Indexer error ${res.status}`)
  const data: Array<Record<string, unknown>> = await res.json()
  if (!data.length) throw new Error('No active oracle found')
  const o = data[0]
  return {
    oracleId: String(o.oracle_id),
    predictId: String(o.predict_id),
    expiry: Number(o.expiry),
    minStrike: Number(o.min_strike),
    tickSize: Number(o.tick_size),
    status: String(o.status),
  }
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${INDEXER_URL}/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error(`Indexer error ${res.status}`)
  const raw: Array<Record<string, unknown>> = await res.json()
  return raw.map((e) => ({
    address: String(e.address),
    streak: Number(e.streak ?? 0),
    winRate: Number(e.win_rate ?? e.winRate ?? 0),
    totalPicks: Number(e.total_picks ?? e.totalPicks ?? 0),
  }))
}
