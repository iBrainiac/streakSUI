import { FAUCET_URL } from '../lib/config'

export function FaucetBanner() {
  return (
    <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-amber-400 text-sm font-semibold">No dUSDC detected</p>
        <p className="text-amber-300/70 text-xs mt-0.5">
          You need testnet dUSDC to make picks. It is not the same as regular USDC.
        </p>
      </div>
      <a
        href={FAUCET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 transition-colors"
      >
        Get dUSDC
      </a>
    </div>
  )
}
