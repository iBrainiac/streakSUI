import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

// TODO: migrate to SuiGrpcClient once the testnet gRPC endpoint is confirmed.
// The gRPC client requires a baseUrl (e.g. https://rpc.testnet.sui.io) which
// is not yet documented for testnet. SuiJsonRpcClient works identically for
// all dApp Kit operations and satisfies DAppKitCompatibleClient in the meantime.
const TESTNET_RPC_URL = 'https://fullnode.testnet.sui.io:443'

export const dAppKit = createDAppKit({
  networks: ['testnet'],
  createClient: (network) =>
    new SuiJsonRpcClient({
      network,
      url: TESTNET_RPC_URL,
    }),
})

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}
