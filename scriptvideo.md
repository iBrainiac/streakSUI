# StreakSui — 3 Minute Demo Script

---

## SCENE 1 — Hook (0:00 to 0:25)

**[Open on the landing page. Sui blue glow visible. Live BTC price chip showing.]**

> "Every day, millions of people have an opinion on where Bitcoin is going.
> Up or down. That's it.
> But right now, there's nowhere on Sui to put that opinion on-chain — simply, daily, with real stakes.
> That's the gap StreakSui fills."

**[Click 'Start Predicting'. App loads.]**

> "StreakSui is a daily BTC prediction app where every pick is a live position on DeepBook Predict.
> Not points. Not a simulation. A real on-chain trade — settled by a decentralized oracle."

---

## SCENE 2 — Connect and Orient (0:25 to 0:50)

**[Show the Dashboard with wallet connected. BTC price displayed. Countdown ticking.]**

> "When you connect your Sui wallet, you see the live BTC price pulled directly from DeepBook Predict's
> on-chain SVI oracle. That countdown is real — it's the time left before this sub-hour oracle expires
> and positions settle."

**[Point to the streak counter showing 0 or any number.]**

> "Your streak lives here. Every correct daily call adds one. A wrong call resets you to zero.
> Simple, brutal, addictive."

---

## SCENE 3 — Making a Pick (0:50 to 1:30)

**[Navigate to the Pick page.]**

> "Let's make a pick. I'll go UP on BTC."

**[Select UP. Amount field shows. Expected payout appears.]**

> "I put in 10 dUSDC. The app immediately shows my estimated return — roughly 2x if correct —
> because DeepBook Predict prices binary options using an SVI volatility model, where an at-the-money
> binary has approximately 50% implied probability. That's real DeFi pricing, not a random multiplier."

**[Toggle the Streak Shield on.]**

> "Now here's something special — the Streak Shield. Toggle it on and the same transaction also opens
> a range position using DeepBook Predict's mint_range function. If my binary pick loses today,
> my streak stays alive. One transaction. Two positions. Full protocol composability."

**[Hit Confirm. Wallet popup appears.]**

> "One wallet signature. The programmable transaction block deposits dUSDC into my PredictManager,
> builds the market key, and calls predict::mint — all atomically on Sui."

---

## SCENE 4 — Architecture (1:30 to 2:00)

**[Show the config.ts package ID briefly or the README on screen.]**

> "A word on architecture — because this matters for judges.
> StreakSui deployed zero smart contracts.
> The package ID you see in our codebase —
> 0xf5ea...5138 — that is DeepBook Predict's package. Not ours.
> We compose on top of it entirely from the frontend."

> "Fund custody, position settlement, oracle pricing, payout calculation — all handled by DeepBook
> Predict's existing contracts. Our users' dUSDC never touches code we wrote.
> This is what real DeFi composability looks like on Sui."

---

## SCENE 5 — Leaderboard, Badges, Profile (2:00 to 2:25)

**[Show the Leaderboard page — real player addresses visible.]**

> "The leaderboard pulls live from DeepBook Predict's own indexer — every wallet that's ever created
> a PredictManager on testnet. Real participants, real data."

**[Navigate to Profile page.]**

> "Your profile tracks win rate, total PnL, pick history, and six badges that unlock at milestones —
> a 3-day streak, a 7-day streak, 5 wins in a row, using the shield, and more."

**[Open the Share Card.]**

> "Hit share and you get a card ready to post on X — streak, badges, win rate.
> That's the viral loop that grows the community."

---

## SCENE 6 — Why This Wins (2:25 to 3:00)

**[Return to landing page. Glow animation playing.]**

> "Let me leave you with why this matters beyond the hackathon."

> "Sui needs consumer apps. Real ones. Not another DEX. Not another lending protocol.
> Something a person with zero DeFi experience can open, understand in ten seconds, and come back
> to tomorrow. StreakSui does that."

> "The daily streak mechanic is one of the most powerful retention loops in consumer products —
> Duolingo built a billion dollar company on it. We've applied that mechanic to a real financial
> product where every action touches the blockchain."

> "For the Sui community, this is an onramp. Someone joins to chase a streak, stays to learn DeFi,
> discovers DeepBook Predict, and eventually becomes a serious participant in the ecosystem."

> "StreakSui. One pick a day. Build your streak on Sui."

---

## Timing Breakdown

| Scene | Content | Duration |
|---|---|---|
| 1 | Hook and overview | 0:25 |
| 2 | Dashboard walkthrough | 0:25 |
| 3 | Making a pick and shield | 0:40 |
| 4 | Architecture — no custom contracts | 0:30 |
| 5 | Leaderboard, profile, share | 0:25 |
| 6 | Why this wins | 0:35 |

**Total: 3:00**

---

## Key lines to memorize

- "Not points. Not a simulation. A real on-chain trade."
- "The package ID in our codebase is DeepBook Predict's — not ours. We compose on top of it entirely."
- "Fund custody, settlement, oracle pricing — DeepBook handles all of it. Our users' money never touches code we wrote."
- "Duolingo built a billion dollar company on the streak mechanic. We applied it to real DeFi."
- "One pick a day. Build your streak on Sui."
