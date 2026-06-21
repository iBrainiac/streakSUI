import { useCallback } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { format } from 'date-fns'

export type PickStatus = 'pending' | 'won' | 'lost'

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

function computeStreak(picks: Pick[]): number {
  const settled = picks
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  for (const pick of settled) {
    if (pick.status === 'won') streak++
    else break
  }
  return streak
}

export function useStreak() {
  const account = useCurrentAccount()
  const address = account?.address ?? ''

  const picks = address ? loadPicks(address) : []
  const streak = computeStreak(picks)
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
      const updated = existing.map((p) =>
        p.positionId === positionId
          ? { ...p, status: (won ? 'won' : 'lost') as PickStatus, pnl }
          : p,
      )
      savePicks(address, updated)
    },
    [address],
  )

  const hasPickedToday = !!todayPick

  return { picks, streak, todayPick, pendingPicks, hasPickedToday, addPick, resolvePick }
}
