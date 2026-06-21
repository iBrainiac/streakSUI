import { INDEXER_URL } from './config'

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

// Fetches the current active BTC oracle with price and expiry info.
// TODO: verify the exact endpoint path against the predict-server API docs.
export async function fetchCurrentOracle(): Promise<OracleData> {
  const res = await fetch(`${INDEXER_URL}/v1/oracle/current`)
  if (!res.ok) throw new Error(`Indexer error ${res.status}`)
  const raw = await res.json()
  return {
    oracleId: raw.oracle_id ?? raw.oracleId,
    btcPrice: Number(raw.btc_price ?? raw.price),
    expiryTimestamp: Number(raw.expiry_timestamp ?? raw.expiryTimestamp),
    atmStrike: Number(raw.atm_strike ?? raw.atmStrike ?? raw.btc_price ?? raw.price),
  }
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${INDEXER_URL}/v1/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error(`Indexer error ${res.status}`)
  const raw: Array<Record<string, unknown>> = await res.json()
  return raw.map((e) => ({
    address: String(e.address),
    streak: Number(e.streak),
    winRate: Number(e.win_rate ?? e.winRate ?? 0),
    totalPicks: Number(e.total_picks ?? e.totalPicks ?? 0),
  }))
}
