import { FAUCET_URL, SUI_FAUCET_URL } from '../lib/config'

export function FaucetBanner() {
  return (
    <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex flex-col gap-3">
      <div>
        <p className="text-amber-400 text-sm font-semibold">Need testnet funds</p>
        <p className="text-amber-300/70 text-xs mt-0.5">
          Picks spend DeepBook test USDC (shown as DUSDC). Gas is paid in SUI.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={SUI_FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 transition-colors"
        >
          Get SUI
        </a>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-amber-400/40 text-amber-200 hover:bg-amber-500/10 text-xs font-bold px-3 py-1.5 transition-colors"
        >
          Get dUSDC
        </a>
      </div>
    </div>
  )
}
