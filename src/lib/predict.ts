import {
  PredictClient,
  type ActiveMarket,
  type DecodableTransactionResult,
  type MarketDescriptor,
  type MintQuote,
} from '@mysten/deepbook-v3/predict'
import type { ClientWithCoreApi } from '@mysten/sui/client'
import { NETWORK, UNDERLYING } from './config'

export function createPredict(client: ClientWithCoreApi) {
  return new PredictClient({ network: NETWORK, client })
}

export function tradeableMarkets(markets: ActiveMarket[]): ActiveMarket[] {
  const cutoff = Date.now() + 30_000
  return [...markets]
    .filter((m) => Number(m.expiryMs) > cutoff && !m.mintPaused)
    .sort((a, b) => (a.expiryMs < b.expiryMs ? -1 : a.expiryMs > b.expiryMs ? 1 : 0))
}

export function nearestTradeableMarket(markets: ActiveMarket[]): ActiveMarket | null {
  const open = tradeableMarkets(markets)
  return open.find((m) => m.referencePrice !== null) ?? open[0] ?? null
}

export function binaryDescriptor(
  market: ActiveMarket,
  side: 'up' | 'down',
): MarketDescriptor {
  return {
    underlying: UNDERLYING,
    expiryMs: market.expiryMs,
    marketId: market.id,
    side,
    strike: market.referencePrice === null ? market.tickSize : 'reference',
  }
}

export function rangeDescriptor(
  market: ActiveMarket,
  halfWidthUsd: number,
): MarketDescriptor {
  const step = market.admissionTickSize
  const anchor = market.referencePrice ?? 0
  const snap = (n: number) => Number((Math.round(n / step) * step).toFixed(9))
  const lower = snap(anchor - halfWidthUsd)
  const upper = Math.max(snap(anchor + halfWidthUsd), lower + step)
  return {
    underlying: UNDERLYING,
    expiryMs: market.expiryMs,
    marketId: market.id,
    side: 'range',
    lower,
    upper,
  }
}

export function roundUsdc(n: number) {
  return Math.ceil(n * 1e6) / 1e6
}

export async function quoteSpend(
  predict: PredictClient,
  owner: string,
  descriptor: MarketDescriptor,
  spend: number,
): Promise<MintQuote> {
  return predict.read.quoteMintCost(owner, descriptor, {
    spend,
    minQuantity: 0,
  })
}

export function asDecodable(
  result: unknown,
): DecodableTransactionResult {
  return result as DecodableTransactionResult
}
