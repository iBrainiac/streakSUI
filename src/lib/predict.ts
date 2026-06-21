import { Transaction } from '@mysten/sui/transactions'
import { PREDICT_PACKAGE, BTC_ORACLE_ID } from './config'

type MintParams = {
  managerObjectId: string
  oracleObjectId?: string
  isAbove: boolean
  strike: bigint
  dusdcCoinObjectId: string
  amount: bigint
  senderAddress: string
}

type RedeemParams = {
  managerObjectId: string
  oracleObjectId: string
  positionObjectId: string
  senderAddress: string
}

type CreateManagerParams = {
  senderAddress: string
}

// Builds a transaction that opens a binary prediction position.
// If predict::mint returns a Position object, it is transferred to the sender.
// TODO: verify the Move function signature matches predict-testnet-4-16.
export function buildMintTx(params: MintParams): Transaction {
  const tx = new Transaction()

  const oracleId = params.oracleObjectId ?? BTC_ORACLE_ID

  const [payment] = tx.splitCoins(tx.object(params.dusdcCoinObjectId), [
    tx.pure.u64(params.amount),
  ])

  const callResult = tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict::mint`,
    arguments: [
      tx.object(params.managerObjectId),
      tx.object(oracleId),
      tx.pure.bool(params.isAbove),
      tx.pure.u64(params.strike),
      payment,
    ],
  })

  // predict::mint likely returns a Position object — transfer it to the user.
  // If the function is entry (void return), remove this line.
  if (callResult) {
    tx.transferObjects([callResult], tx.pure.address(params.senderAddress))
  }

  return tx
}

// Builds a transaction to redeem a settled position on behalf of its owner.
export function buildRedeemTx(params: RedeemParams): Transaction {
  const tx = new Transaction()

  const callResult = tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict::redeem_permissionless`,
    arguments: [
      tx.object(params.managerObjectId),
      tx.object(params.oracleObjectId),
      tx.object(params.positionObjectId),
    ],
  })

  // redeem_permissionless likely returns a Coin<DUSDC> payout — transfer to owner.
  if (callResult) {
    tx.transferObjects([callResult], tx.pure.address(params.senderAddress))
  }

  return tx
}

// Builds a transaction that creates a new PredictManager for the user.
// TODO: verify the create manager function name and signature.
export function buildCreateManagerTx(params: CreateManagerParams): Transaction {
  const tx = new Transaction()

  const manager = tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict::create_manager`,
    arguments: [],
  })

  tx.transferObjects([manager], tx.pure.address(params.senderAddress))

  return tx
}
