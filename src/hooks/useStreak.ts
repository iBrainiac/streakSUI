import { useCallback, useSyncExternalStore } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { format } from 'date-fns'

export type PickStatus = 'pending' | 'won' | 'lost' | 'shielded_loss'

export type Pick = {
  id: string
  date: string
  direction: 'UP' | 'DOWN'
  amount: number
  amountRaw: string
  positionId: string
  orderId?: string
  marketId?: string
  oracleId: string
  strike: number
  expiryTimestamp: number
  status: PickStatus
  pnl: number
  shielded?: boolean
}

const EVENT = 'streaksui-picks'

function storageKey(address: string) {
  return `streaksui_picks_${address}`
}

let snapshot: { key: string; picks: Pick[] } | null = null

function loadPicks(address: string): Pick[] {
  try {
    const raw = localStorage.getItem(storageKey(address)) ?? '[]'
    const key = `${address}:${raw}`
    if (snapshot?.key === key) return snapshot.picks
    const picks = JSON.parse(raw) as Pick[]
    snapshot = { key, picks }
    return picks
  } catch {
    snapshot = { key: address, picks: [] }
    return snapshot.picks
  }
}

function savePicks(address: string, picks: Pick[]) {
  const raw = JSON.stringify(picks)
  localStorage.setItem(storageKey(address), raw)
  snapshot = { key: `${address}:${raw}`, picks }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange)
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener(EVENT, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function computeStreak(picks: Pick[]): number {
  const settled = picks
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  for (const pick of settled) {
    if (pick.status === 'won') streak++
    else if (pick.status === 'shielded_loss') continue
    else break
  }
  return streak
}

function computeBestStreak(picks: Pick[]): number {
  const settled = picks
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => a.date.localeCompare(b.date))

  let best = 0
  let current = 0
  for (const pick of settled) {
    if (pick.status === 'won') {
      current++
      if (current > best) best = current
    } else if (pick.status === 'shielded_loss') {
      // neutral
    } else {
      current = 0
    }
  }
  return best
}

export function useStreak() {
  const account = useCurrentAccount()
  const address = account?.address ?? ''

  const picks = useSyncExternalStore(
    subscribe,
    () => (address ? loadPicks(address) : []),
    () => [],
  )
  const streak = computeStreak(picks)
  const bestStreak = computeBestStreak(picks)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayPick = picks.find((p) => p.date === today)
  const pendingPicks = picks.filter((p) => p.status === 'pending')

  const addPick = useCallback(
    (pick: Omit<Pick, 'status' | 'pnl'>) => {
      if (!address) return
      savePicks(address, [...loadPicks(address), { ...pick, status: 'pending', pnl: 0 }])
    },
    [address],
  )

  const resolvePick = useCallback(
    (positionId: string, won: boolean, pnl: number) => {
      if (!address) return
      savePicks(
        address,
        loadPicks(address).map((p) => {
          if (p.positionId !== positionId) return p
          const newStatus: PickStatus = won ? 'won' : p.shielded ? 'shielded_loss' : 'lost'
          return { ...p, status: newStatus, pnl }
        }),
      )
    },
    [address],
  )

  return {
    picks,
    streak,
    bestStreak,
    todayPick,
    pendingPicks,
    hasPickedToday: !!todayPick,
    addPick,
    resolvePick,
  }
}
