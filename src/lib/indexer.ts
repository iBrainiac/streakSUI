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

export type ActivePlayer = {
  address: string
  managerId: string
  joinedAt: number
}

// Fetches wallets that have created a PredictManager — real on-chain protocol participants.
// The /leaderboard endpoint is not exposed; /managers gives us the same ground truth.
export async function fetchActivePlayers(limit = 50): Promise<ActivePlayer[]> {
  const res = await fetch(`${INDEXER_URL}/managers?limit=${limit}`)
  if (!res.ok) throw new Error(`Indexer error ${res.status}`)
  const raw: Array<Record<string, unknown>> = await res.json()
  const seen = new Set<string>()
  const players: ActivePlayer[] = []
  for (const e of raw) {
    const addr = String(e.owner)
    if (!seen.has(addr)) {
      seen.add(addr)
      players.push({
        address: addr,
        managerId: String(e.manager_id),
        joinedAt: Number(e.checkpoint_timestamp_ms),
      })
    }
  }
  return players
}
