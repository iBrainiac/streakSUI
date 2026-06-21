import { useEffect, useState } from 'react'

type Props = {
  expiryTimestamp: number
}

function getTimeLeft(expiryMs: number) {
  const diff = expiryMs - Date.now()
  if (diff <= 0) return { minutes: 0, seconds: 0, total: 0 }
  const minutes = Math.floor(diff / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { minutes, seconds, total: diff }
}

export function Countdown({ expiryTimestamp }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(expiryTimestamp))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expiryTimestamp))
    }, 1000)
    return () => clearInterval(interval)
  }, [expiryTimestamp])

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 5 * 60_000
  const isExpired = timeLeft.total <= 0

  if (isExpired) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400 uppercase tracking-widest">Settling</p>
        <p className="text-2xl font-bold text-yellow-400 animate-pulse mt-1">00:00</p>
      </div>
    )
  }

  const mm = String(timeLeft.minutes).padStart(2, '0')
  const ss = String(timeLeft.seconds).padStart(2, '0')

  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Expires in</p>
      <p
        className={`text-2xl font-black tabular-nums transition-colors ${
          isUrgent ? 'text-red-400 animate-pulse' : 'text-white'
        }`}
      >
        {mm}:{ss}
      </p>
    </div>
  )
}
