import { useState, useEffect } from 'react'

export type BadgeId = 'on_fire' | 'electric' | 'diamond' | 'sharpshooter' | 'insured' | 'champion'

export type Badge = {
  id: BadgeId
  emoji: string
  name: string
  desc: string
}

export const ALL_BADGES: Badge[] = [
  { id: 'on_fire', emoji: '🔥', name: 'On Fire', desc: '3-day streak' },
  { id: 'electric', emoji: '⚡', name: 'Electric', desc: '7-day streak' },
  { id: 'diamond', emoji: '💎', name: 'Diamond Hands', desc: '14-day streak' },
  { id: 'sharpshooter', emoji: '🎯', name: 'Sharpshooter', desc: '5 wins in a row' },
  { id: 'insured', emoji: '🛡️', name: 'Insured', desc: 'Used Streak Shield' },
  { id: 'champion', emoji: '🏆', name: 'Top 10', desc: 'Ranked in the top 10' },
]

function badgeStorageKey(address: string) {
  return `streaksui_badges_${address}`
}

function loadEarned(address: string): BadgeId[] {
  try {
    const raw = localStorage.getItem(badgeStorageKey(address))
    return raw ? (JSON.parse(raw) as BadgeId[]) : []
  } catch {
    return []
  }
}

function saveEarned(address: string, earned: BadgeId[]) {
  localStorage.setItem(badgeStorageKey(address), JSON.stringify(earned))
}

type BadgeInput = {
  address: string | undefined
  streak: number
  picks: Array<{ status: string }>
  shieldUsed: boolean
  rank?: number
}

export function useBadges({ address, streak, picks, shieldUsed, rank }: BadgeInput) {
  const [earned, setEarned] = useState<BadgeId[]>([])
  const [newlyUnlocked, setNewlyUnlocked] = useState<BadgeId[]>([])

  useEffect(() => {
    if (!address) {
      setEarned([])
      return
    }
    setEarned(loadEarned(address))
  }, [address])

  useEffect(() => {
    if (!address) return

    const current = loadEarned(address)
    // shielded_loss is neutral for badge checks — skip it when counting win runs
    const relevant = picks.filter((p) => p.status === 'won' || p.status === 'lost')
    const lastFive = relevant.slice(-5)
    const fiveInARow = lastFive.length === 5 && lastFive.every((p) => p.status === 'won')

    const checks: Array<{ id: BadgeId; pass: boolean }> = [
      { id: 'on_fire', pass: streak >= 3 },
      { id: 'electric', pass: streak >= 7 },
      { id: 'diamond', pass: streak >= 14 },
      { id: 'sharpshooter', pass: fiveInARow },
      { id: 'insured', pass: shieldUsed },
      { id: 'champion', pass: rank !== undefined && rank <= 10 },
    ]

    const toAdd = checks
      .filter((c) => c.pass && !current.includes(c.id))
      .map((c) => c.id)

    if (toAdd.length) {
      const updated = [...current, ...toAdd]
      saveEarned(address, updated)
      setEarned(updated)
      setNewlyUnlocked(toAdd)
    }
  }, [address, streak, picks, shieldUsed, rank])

  function dismissUnlock() {
    setNewlyUnlocked([])
  }

  return { earned, newlyUnlocked, dismissUnlock }
}
