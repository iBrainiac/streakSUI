import { format } from 'date-fns'

type Props = {
  active: boolean
  available: boolean
  nextRecharge: Date | null
  onToggle: () => void
}

export function StreakShieldToggle({ active, available, nextRecharge, onToggle }: Props) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 transition-all ${
        active
          ? 'bg-violet-500/10 border-violet-500/50'
          : available
            ? 'bg-zinc-900 border-white/5'
            : 'bg-zinc-900 border-white/5 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">🛡️</span>
            <p className="text-white font-bold text-sm">Streak Shield</p>
            {!available && (
              <span className="text-xs bg-zinc-700 text-gray-400 px-2 py-0.5 rounded-full">
                Recharging
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">
            {active
              ? 'Active (+1 dUSDC range position — streak protected)'
              : available
                ? 'Adds a +$100 range position as insurance. Once per week.'
                : nextRecharge
                  ? `Recharges ${format(nextRecharge, 'MMM d')}`
                  : 'Not available'}
          </p>
        </div>

        <button
          onClick={onToggle}
          disabled={!available}
          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
            active ? 'bg-violet-500' : 'bg-zinc-700'
          } ${!available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="Toggle Streak Shield"
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              active ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
