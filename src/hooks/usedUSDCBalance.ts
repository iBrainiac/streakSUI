import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { DUSDC_TYPE } from '../lib/config'

export function usedUSDCBalance() {
  const account = useCurrentAccount()
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['dusdc-balance', account?.address],
    queryFn: async () => {
      const result = await client.core.listCoins({
        owner: account!.address,
        coinType: DUSDC_TYPE,
      })
      const total = result.data.reduce(
        (sum: bigint, coin: { balance: string }) => sum + BigInt(coin.balance),
        BigInt(0),
      )
      return { total, coins: result.data }
    },
    enabled: !!account,
    refetchInterval: 15_000,
  })
}
