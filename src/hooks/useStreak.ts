import { useCallback } from 'react'
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
  oracleId: string
  strike: number
  expiryTimestamp: number
  status: PickStatus
  pnl: number
  shielded?: boolean
}

function storageKey(address: string) {
  return `streaksui_picks_${address}`
}

function loadPicks(address: string): Pick[] {
  try {
    const raw = localStorage.getItem(storageKey(address))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePicks(address: string, picks: Pick[]) {
  localStorage.setItem(storageKey(address), JSON.stringify(picks))
}

// shielded_loss is neutral — it does not extend or break the streak
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

  const picks = address ? loadPicks(address) : []
  const streak = computeStreak(picks)
  const bestStreak = computeBestStreak(picks)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayPick = picks.find((p) => p.date === today)
  const pendingPicks = picks.filter((p) => p.status === 'pending')

  const addPick = useCallback(
    (pick: Omit<Pick, 'status' | 'pnl'>) => {
      if (!address) return
      const existing = loadPicks(address)
      const updated = [...existing, { ...pick, status: 'pending' as PickStatus, pnl: 0 }]
      savePicks(address, updated)
    },
    [address],
  )

  const resolvePick = useCallback(
    (positionId: string, won: boolean, pnl: number) => {
      if (!address) return
      const existing = loadPicks(address)
      const updated = existing.map((p) => {
        if (p.positionId !== positionId) return p
        const newStatus: PickStatus = won ? 'won' : p.shielded ? 'shielded_loss' : 'lost'
        return { ...p, status: newStatus, pnl }
      })
      savePicks(address, updated)
    },
    [address],
  )

  const hasPickedToday = !!todayPick

  return { picks, streak, bestStreak, todayPick, pendingPicks, hasPickedToday, addPick, resolvePick }
}
