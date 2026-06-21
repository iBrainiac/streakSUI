import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react'
import { buildMintTx, buildRedeemTx, buildCreateManagerTx } from '../lib/predict'
import { PREDICT_PACKAGE } from '../lib/config'
import type { OracleData } from '../lib/indexer'

const PREDICT_MANAGER_TYPE = `${PREDICT_PACKAGE}::predict::PredictManager`

export function usePredict() {
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const { signAndExecuteTransaction } = useDAppKit()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getManagerObjectId(): Promise<string | null> {
    if (!account) return null
    const result = await client.core.listOwnedObjects({
      owner: account.address,
      filter: { StructType: PREDICT_MANAGER_TYPE },
    })
    return result.data[0]?.objectId ?? null
  }

  async function createManager(): Promise<string | null> {
    if (!account) return null
    setIsPending(true)
    setError(null)
    try {
      const tx = buildCreateManagerTx({ senderAddress: account.address })
      const result = await signAndExecuteTransaction({ transaction: tx })
      if (result.$kind === 'FailedTransaction') {
        setError('Failed to create prediction account')
        return null
      }
      await client.waitForTransaction({ digest: result.Transaction.digest })
      await queryClient.invalidateQueries({ queryKey: ['manager', account.address] })
      return await getManagerObjectId()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
      return null
    } finally {
      setIsPending(false)
    }
  }

  async function submitPick(params: {
    direction: 'UP' | 'DOWN'
    oracle: OracleData
    dusdcCoinObjectId: string
    amount: bigint
  }): Promise<string | null> {
    if (!account) return null
    setIsPending(true)
    setError(null)
    try {
      let managerObjectId = await getManagerObjectId()
      if (!managerObjectId) {
        managerObjectId = await createManager()
        if (!managerObjectId) return null
      }

      const tx = buildMintTx({
        managerObjectId,
        oracleObjectId: params.oracle.oracleId,
        isAbove: params.direction === 'UP',
        strike: BigInt(Math.round(params.oracle.atmStrike)),
        dusdcCoinObjectId: params.dusdcCoinObjectId,
        amount: params.amount,
        senderAddress: account.address,
      })

      const result = await signAndExecuteTransaction({ transaction: tx })
      if (result.$kind === 'FailedTransaction') {
        setError('Pick transaction failed on-chain')
        return null
      }

      const digest = result.Transaction.digest
      await client.waitForTransaction({ digest })
      await queryClient.invalidateQueries({ queryKey: ['dusdc-balance', account.address] })

      return digest
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
      return null
    } finally {
      setIsPending(false)
    }
  }

  async function redeemPosition(params: {
    positionObjectId: string
    oracleObjectId: string
  }): Promise<boolean> {
    if (!account) return false
    setIsPending(true)
    setError(null)
    try {
      const managerObjectId = await getManagerObjectId()
      if (!managerObjectId) return false

      const tx = buildRedeemTx({
        managerObjectId,
        oracleObjectId: params.oracleObjectId,
        positionObjectId: params.positionObjectId,
        senderAddress: account.address,
      })

      const result = await signAndExecuteTransaction({ transaction: tx })
      if (result.$kind === 'FailedTransaction') return false

      await client.waitForTransaction({ digest: result.Transaction.digest })
      await queryClient.invalidateQueries({ queryKey: ['dusdc-balance', account.address] })
      return true
    } catch {
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { submitPick, redeemPosition, createManager, getManagerObjectId, isPending, error }
}
