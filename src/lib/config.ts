export const NETWORK = 'testnet' as const

export const PREDICT_PACKAGE =
  '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138'

export const PREDICT_SHARED_OBJECT_ID =
  '0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a'

export const DUSDC_TYPE =
  '0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC'

export const DUSDC_DECIMALS = 6

export const PREDICT_MANAGER_TYPE = `${PREDICT_PACKAGE}::predict_manager::PredictManager`

export const CLOCK_ID = '0x6'

// Oracle prices are denominated with 9 decimal places (1 unit = 1e-9 USD).
// Divide any raw oracle price by PRICE_SCALE to get USD.
export const PRICE_SCALE = 1_000_000_000

// Distance between consecutive valid strikes in the oracle price grid.
export const TICK_SIZE = 1_000_000_000

export const INDEXER_URL = 'https://predict-server.testnet.mystenlabs.com'

export const FAUCET_URL = 'https://tally.so/r/Xx102L'
