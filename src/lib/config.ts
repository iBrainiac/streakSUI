import { getConfig, getUnits } from '@mysten/deepbook-v3/predict'

export const NETWORK = 'testnet' as const
export const UNDERLYING = 'BTC' as const

export const CONFIG = getConfig(NETWORK)
export const UNITS = getUnits(NETWORK)

export const DUSDC_TYPE = CONFIG.quoteCoinType
export const DUSDC_DECIMALS = UNITS.quoteCoinDecimals
export const PRICE_SCALE = Number(UNITS.fixedPointScale)
export const TICK_SIZE = PRICE_SCALE

export const GRAPHQL_URL = 'https://graphql.testnet.sui.io/graphql'

export const BTC_SPOT_STORE =
  CONFIG.underlyings.BTC?.blockScholesValueStore ??
  '0x1e5142471311505a7428b072230c9ffe8a747b3b9392720e39246af4aea08216'
export const POOL_VAULT_ID = CONFIG.objects.poolVault

export const FAUCET_URL = 'https://tally.so/r/Xx102L'
export const SUI_FAUCET_URL = 'https://faucet.sui.io/?network=testnet'
