import { useEffect } from 'react'

// Settlement is user-confirmed via claimPick. This hook is kept so Dashboard
// can keep importing it without auto-popping the wallet every 30s.
export function useAutoRedeem() {
  useEffect(() => {
    return undefined
  }, [])
}
