import {
  BTC_SPOT_STORE,
  GRAPHQL_URL,
  INDEXER_URL,
  POOL_VAULT_ID,
  PRICE_SCALE,
  TICK_SIZE,
} from './config'

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

type GraphQLObjectJson = {
  data?: {
    object?: {
      asMoveObject?: {
        contents?: { json?: unknown }
      }
    }
  }
  errors?: Array<{ message: string }>
}

type SpotRead = {
  source_timestamp_ms: string
  value: string
}

type ActiveExpiryMarket = {
  expiry_market_id: string
  expiry_ms: string
}

async function readMoveObjectJson(objectId: string): Promise<unknown> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query ($id: SuiAddress!) {
        object(address: $id) {
          asMoveObject { contents { json } }
        }
      }`,
      variables: { id: objectId },
    }),
  })
  if (!res.ok) throw new Error(`GraphQL error ${res.status}`)
  const payload = (await res.json()) as GraphQLObjectJson
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL query failed')
  }
  const json = payload.data?.object?.asMoveObject?.contents?.json
  if (!json) throw new Error(`Object ${objectId} not found`)
  return json
}

function latestSpotUsd(json: unknown): { priceUsd: number; raw: number } {
  const store = json as { spot_reads?: SpotRead[] }
  const reads = store.spot_reads ?? []
  if (!reads.length) throw new Error('No Block Scholes spot reads')

  const latest = reads.reduce((best, read) =>
    Number(read.source_timestamp_ms) > Number(best.source_timestamp_ms)
      ? read
      : best,
  )
  const raw = Number(latest.value)
  if (!Number.isFinite(raw) || raw <= 0) throw new Error('Invalid spot value')
  return { priceUsd: raw / PRICE_SCALE, raw }
}

function nearestOpenMarket(json: unknown): ActiveExpiryMarket | null {
  const vault = json as {
    expiry_accounting?: { active_expiry_markets?: ActiveExpiryMarket[] }
  }
  const markets = vault.expiry_accounting?.active_expiry_markets ?? []
  const now = Date.now()
  const open = markets
    .filter((m) => Number(m.expiry_ms) > now)
    .sort((a, b) => Number(a.expiry_ms) - Number(b.expiry_ms))
  return open[0] ?? null
}

async function fetchSpotUsdFallback(): Promise<number> {
  const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
  if (!res.ok) throw new Error(`Coinbase error ${res.status}`)
  const body = (await res.json()) as { data?: { amount?: string } }
  const price = Number(body.data?.amount)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid Coinbase spot')
  }
  return price
}

// Live BTC oracle from the current deepbook-predict-testnet objects.
// The old /oracles indexer host is gone, and public JSON-RPC is deprecated.
export async function fetchLiveOracle(): Promise<OracleData> {
  let priceUsd: number
  let rawSpot = 0

  try {
    const spotJson = await readMoveObjectJson(BTC_SPOT_STORE)
    const spot = latestSpotUsd(spotJson)
    priceUsd = spot.priceUsd
    rawSpot = spot.raw
  } catch {
    priceUsd = await fetchSpotUsdFallback()
    rawSpot = Math.round(priceUsd * PRICE_SCALE)
  }

  let marketId = BTC_SPOT_STORE
  let expiry = Date.now() + 5 * 60_000

  try {
    const vaultJson = await readMoveObjectJson(POOL_VAULT_ID)
    const market = nearestOpenMarket(vaultJson)
    if (market) {
      marketId = market.expiry_market_id
      expiry = Number(market.expiry_ms)
    }
  } catch {
    // Price still displays if vault lookup fails.
  }

  return {
    oracleId: marketId,
    btcPrice: priceUsd,
    expiryTimestamp: expiry,
    atmStrike: Math.round(rawSpot / TICK_SIZE) * TICK_SIZE,
  }
}

// Legacy helper kept for any callers that still expect OracleMeta.
export async function fetchActiveOracle(): Promise<OracleMeta> {
  const live = await fetchLiveOracle()
  return {
    oracleId: live.oracleId,
    predictId: POOL_VAULT_ID,
    expiry: live.expiryTimestamp,
    minStrike: live.atmStrike,
    tickSize: TICK_SIZE,
    status: 'active',
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
