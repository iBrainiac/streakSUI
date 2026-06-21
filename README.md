# StreakSui

A mobile-first Progressive Web App where you make a daily BTC Up/Down prediction that resolves as a real on-chain position via DeepBook Predict on Sui testnet. Correct calls build your streak. Top streaks hit the leaderboard.

Built for **Sui Overflow 2026 — DeepBook Predict Track**.

---

## What it does

Every pick is a live `predict::mint` transaction on Sui testnet. No fake points, no simulated results — real DeFi under a game layer.

The full flow:

1. Connect your Sui testnet wallet
2. Get dUSDC from the faucet if your balance is zero
3. Pick BTC UP or DOWN before the sub-hour oracle expires
4. The app submits a `predict::mint` PTB that deposits your dUSDC into your PredictManager and opens a binary position
5. When the oracle settles, the app automatically calls `predict::redeem_permissionless` for winning positions
6. Your streak grows with each correct daily call

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Sui SDK | `@mysten/sui` v2 |
| Wallet | `@mysten/dapp-kit-react` |
| State | TanStack Query + Zustand |
| Data | DeepBook Predict indexer API |

---

## DeepBook Predict integration

| Resource | Value |
|---|---|
| Predict package | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| Predict shared object | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| dUSDC coin type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| Indexer API | `https://predict-server.testnet.mystenlabs.com` |
| Network | Sui testnet |

---

## Contract calls used

```ts
// Create a PredictManager on first use
predict_manager::new(ctx)

// Deposit dUSDC into the manager, build the market key, open a position
predict_manager::deposit<DUSDC>(manager, coin)
market_key::up(oracle_id, expiry, strike)   // or market_key::down(...)
predict::mint<DUSDC>(predict, manager, oracle, market_key, amount, clock)

// Redeem after the oracle settles
predict::redeem_permissionless<DUSDC>(predict, manager, oracle, market_key, amount, clock)
predict_manager::withdraw<DUSDC>(manager, amount, ctx)
```

---

## Project structure

```
src/
  lib/
    config.ts        # Contract addresses and constants
    sui.ts           # dAppKit + SuiJsonRpcClient setup
    indexer.ts       # DeepBook Predict indexer API calls
    predict.ts       # PTB builders for mint and redeem
  hooks/
    useBTCPrice.ts   # Live BTC price from the active oracle object
    usedUSDCBalance.ts
    useStreak.ts     # Per-wallet streak tracking in localStorage
    usePredict.ts    # submitPick and redeemPosition wrappers
    useAutoRedeem.ts # Polls settled oracles and redeems winning positions
  components/
    PriceDisplay.tsx
    Countdown.tsx
    StreakDisplay.tsx
    FaucetBanner.tsx
  pages/
    Dashboard.tsx
    Pick.tsx
```

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, connect a Sui testnet wallet, and request dUSDC from the faucet at `https://tally.so/r/Xx102L`.

---

## Roadmap

**Phase 1 (current)** — Core pick flow, streak tracking, countdown, faucet onboarding, auto-redeem

**Phase 2** — Live leaderboard with streak-at-risk warnings, badge system, Streak Shield (range position as weekly insurance)

**Phase 3** — Shareable streak card for X/Twitter, season stats profile, PWA install manifest
