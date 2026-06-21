import { useBTCPrice } from '../hooks/useBTCPrice'

export function PriceDisplay() {
  const { data, isPending, isError } = useBTCPrice()

  if (isPending) {
    return (
      <div className="text-center">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mx-auto" />
        <div className="h-4 w-24 bg-white/5 animate-pulse rounded mt-2 mx-auto" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-white/30">--,---</p>
        <p className="text-xs text-red-400 mt-1">Price feed unavailable</p>
      </div>
    )
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(data.btcPrice)

  return (
    <div className="text-center">
      <p className="text-4xl font-black text-white tracking-tight">{formatted}</p>
      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">BTC / USD</p>
    </div>
  )
}
