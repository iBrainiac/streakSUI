import { useState, useCallback } from 'react'

export const SHIELD_COST_RAW = BigInt(1_000_000)

const RECHARGE_MS = 7 * 24 * 60 * 60 * 1000

function shieldKey(address: string) {
  return `streaksui_shield_${address}`
}

function getLastUsed(address: string): Date | null {
  const raw = localStorage.getItem(shieldKey(address))
  return raw ? new Date(raw) : null
}

function isAvailableFor(address: string): boolean {
  const lastUsed = getLastUsed(address)
  if (!lastUsed) return true
  return Date.now() - lastUsed.getTime() > RECHARGE_MS
}

function rechargeDate(address: string): Date | null {
  const lastUsed = getLastUsed(address)
  if (!lastUsed) return null
  return new Date(lastUsed.getTime() + RECHARGE_MS)
}

function shieldEverUsed(address: string): boolean {
  return localStorage.getItem(shieldKey(address)) !== null
}

export function useStreakShield(address: string | undefined) {
  const [active, setActive] = useState(false)

  const available = address ? isAvailableFor(address) : false
  const nextRecharge = address ? rechargeDate(address) : null
  const everUsed = address ? shieldEverUsed(address) : false

  const toggle = useCallback(() => {
    if (!available) return
    setActive((prev) => !prev)
  }, [available])

  const consume = useCallback(() => {
    if (!address) return
    localStorage.setItem(shieldKey(address), new Date().toISOString())
    setActive(false)
  }, [address])

  const cancel = useCallback(() => setActive(false), [])

  return { active, available, toggle, cancel, consume, nextRecharge, everUsed, costRaw: SHIELD_COST_RAW }
}
