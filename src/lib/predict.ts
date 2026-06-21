import { Transaction } from '@mysten/sui/transactions'
import {
  PREDICT_PACKAGE,
  PREDICT_SHARED_OBJECT_ID,
  DUSDC_TYPE,
  CLOCK_ID,
} from './config'

// Verified against predict module on testnet:
//   predict::mint(&mut Predict, &mut PredictManager, &OracleSVI, MarketKey, U64, &Clock, ctx)
//   predict::redeem_permissionless(&mut Predict, &mut PredictManager, &OracleSVI, MarketKey, U64, &Clock, ctx)
//   predict::create_manager(ctx) -> ID
//   predict_manager::deposit<T>(&mut PredictManager, Coin<T>)
//   predict_manager::withdraw<T>(&mut PredictManager, U64, ctx) -> Coin<T>
//   market_key::up(oracle_id: ID, expiry: U64, strike: U64) -> MarketKey
//   market_key::down(oracle_id: ID, expiry: U64, strike: U64) -> MarketKey

export type MintParams = {
  managerObjectId: string
  oracleObjectId: string
  direction: 'UP' | 'DOWN'
  expiry: number
  atmStrike: number
  dusdcCoinObjectId: string
  amount: bigint
  senderAddress: string
}

export type RedeemParams = {
  managerObjectId: string
  oracleObjectId: string
  direction: 'UP' | 'DOWN'
  expiry: number
  strike: number
  amount: bigint
  senderAddress: string
}

function buildMarketKey(
  tx: Transaction,
  direction: 'UP' | 'DOWN',
  oracleId: string,
  expiry: number,
  strike: number,
) {
  const fn = direction === 'UP' ? 'up' : 'down'
  return tx.moveCall({
    target: `${PREDICT_PACKAGE}::market_key::${fn}`,
    arguments: [
      tx.pure.address(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(strike),
    ],
  })
}

export type ShieldParams = {
  oracleObjectId: string
  expiry: number
  lowerStrike: number
  upperStrike: number
  amount: bigint
}

// Builds the PTB that deposits dUSDC into the manager then opens a binary position.
// When shieldParams is provided the same PTB also opens a range position (Streak Shield).
export function buildMintTx(params: MintParams, shield?: ShieldParams): Transaction {
  const tx = new Transaction()

  const [payment] = tx.splitCoins(tx.object(params.dusdcCoinObjectId), [
    tx.pure.u64(params.amount),
  ])

  tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict_manager::deposit`,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(params.managerObjectId), payment],
  })

  const marketKey = buildMarketKey(
    tx,
    params.direction,
    params.oracleObjectId,
    params.expiry,
    params.atmStrike,
  )

  tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict::mint`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_SHARED_OBJECT_ID),
      tx.object(params.managerObjectId),
      tx.object(params.oracleObjectId),
      marketKey,
      tx.pure.u64(params.amount),
      tx.object(CLOCK_ID),
    ],
  })

  if (shield) {
    const [shieldPayment] = tx.splitCoins(tx.object(params.dusdcCoinObjectId), [
      tx.pure.u64(shield.amount),
    ])
    tx.moveCall({
      target: `${PREDICT_PACKAGE}::predict_manager::deposit`,
      typeArguments: [DUSDC_TYPE],
      arguments: [tx.object(params.managerObjectId), shieldPayment],
    })
    const rangeKey = tx.moveCall({
      target: `${PREDICT_PACKAGE}::range_key::new`,
      arguments: [
        tx.pure.address(shield.oracleObjectId),
        tx.pure.u64(shield.expiry),
        tx.pure.u64(shield.lowerStrike),
        tx.pure.u64(shield.upperStrike),
      ],
    })
    tx.moveCall({
      target: `${PREDICT_PACKAGE}::predict::mint_range`,
      typeArguments: [DUSDC_TYPE],
      arguments: [
        tx.object(PREDICT_SHARED_OBJECT_ID),
        tx.object(params.managerObjectId),
        tx.object(shield.oracleObjectId),
        rangeKey,
        tx.pure.u64(shield.amount),
        tx.object(CLOCK_ID),
      ],
    })
  }

  return tx
}

// Builds the PTB that redeems a settled position and withdraws proceeds to the user's wallet.
export function buildRedeemTx(params: RedeemParams): Transaction {
  const tx = new Transaction()

  const marketKey = buildMarketKey(
    tx,
    params.direction,
    params.oracleObjectId,
    params.expiry,
    params.strike,
  )

  tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict::redeem_permissionless`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_SHARED_OBJECT_ID),
      tx.object(params.managerObjectId),
      tx.object(params.oracleObjectId),
      marketKey,
      tx.pure.u64(params.amount),
      tx.object(CLOCK_ID),
    ],
  })

  const [payout] = tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict_manager::withdraw`,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(params.managerObjectId),
      tx.pure.u64(params.amount),
    ],
  })

  tx.transferObjects([payout], tx.pure.address(params.senderAddress))

  return tx
}

// Creates a PredictManager. The object is transferred to the sender automatically.
// Query listOwnedObjects after this tx to get the manager's objectId.
export function buildCreateManagerTx(): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PREDICT_PACKAGE}::predict_manager::new`,
    arguments: [],
  })
  return tx
}
