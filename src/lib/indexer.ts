import type { ClientWithCoreApi } from '@mysten/sui/client'
import {
  BTC_SPOT_STORE,
  GRAPHQL_URL,
  POOL_VAULT_ID,
  PRICE_SCALE,
  UNDERLYING,
} from './config'
import { createPredict, nearestTradeableMarket, tradeableMarkets } from './predict'

export type OracleData = {
  oracleId: string
  btcPrice: number
  expiryTimestamp: number
  atmStrike: number
  openMarketCount: number
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

function latestSpotUsd(json: unknown): number {
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
  return raw / PRICE_SCALE
}

function openMarkets(json: unknown): ActiveExpiryMarket[] {
  const vault = json as {
    expiry_accounting?: { active_expiry_markets?: ActiveExpiryMarket[] }
  }
  const now = Date.now()
  return (vault.expiry_accounting?.active_expiry_markets ?? [])
    .filter((m) => Number(m.expiry_ms) > now)
    .sort((a, b) => Number(a.expiry_ms) - Number(b.expiry_ms))
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

async function fetchFromPredict(client: ClientWithCoreApi): Promise<OracleData> {
  const predict = createPredict(client)
  const markets = await predict.read.markets()
  const open = tradeableMarkets(markets)
  const market = nearestTradeableMarket(markets)
  if (!market) throw new Error('No open BTC market')

  let priceUsd = market.referencePrice ?? 0
  try {
    const pricer = await predict.read.pricer({
      underlying: UNDERLYING,
      expiryMs: market.expiryMs,
    })
    if (pricer.forward > 0) priceUsd = pricer.forward
  } catch {
    // Reference tick is enough to render if the live pricer is briefly stale.
  }
  if (!(priceUsd > 0)) throw new Error('Predict oracle has no spot yet')

  return {
    oracleId: market.id,
    btcPrice: priceUsd,
    expiryTimestamp: Number(market.expiryMs),
    atmStrike: Math.round(priceUsd),
    openMarketCount: open.length,
  }
}

export async function fetchLiveOracle(
  client?: ClientWithCoreApi,
): Promise<OracleData> {
  if (client) {
    try {
      return await fetchFromPredict(client)
    } catch {
      // Fall through to GraphQL / Coinbase so the UI still shows a price.
    }
  }

  let priceUsd: number
  try {
    priceUsd = latestSpotUsd(await readMoveObjectJson(BTC_SPOT_STORE))
  } catch {
    priceUsd = await fetchSpotUsdFallback()
  }

  let marketId = BTC_SPOT_STORE
  let expiry = Date.now() + 5 * 60_000
  let openMarketCount = 0

  try {
    const markets = openMarkets(await readMoveObjectJson(POOL_VAULT_ID))
    openMarketCount = markets.length
    if (markets[0]) {
      marketId = markets[0].expiry_market_id
      expiry = Number(markets[0].expiry_ms)
    }
  } catch {
    // Price still displays if vault lookup fails.
  }

  return {
    oracleId: marketId,
    btcPrice: priceUsd,
    expiryTimestamp: expiry,
    atmStrike: Math.round(priceUsd),
    openMarketCount,
  }
}
