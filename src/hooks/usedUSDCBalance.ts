import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { DUSDC_DECIMALS, DUSDC_TYPE } from '../lib/config'
import { createPredict } from '../lib/predict'

export function useDUSDCBalance() {
  const account = useCurrentAccount()
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['dusdc-balance', account?.address],
    queryFn: async () => {
      const owner = account!.address
      const coins = await client.core.listCoins({
        owner,
        coinType: DUSDC_TYPE,
      })
      const walletRaw = coins.objects.reduce(
        (sum: bigint, coin: { balance: string }) => sum + BigInt(coin.balance),
        BigInt(0),
      )

      const accountUsd = await createPredict(client)
        .read.balance(owner)
        .catch(() => 0)

      const accountRaw = BigInt(Math.round(accountUsd * 10 ** DUSDC_DECIMALS))
      return {
        wallet: walletRaw,
        account: accountRaw,
        total: walletRaw + accountRaw,
        accountUsd,
        coins: coins.objects,
      }
    },
    enabled: !!account,
    refetchInterval: 15_000,
  })
}
