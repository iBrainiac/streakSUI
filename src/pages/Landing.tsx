import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useBTCPrice } from '../hooks/useBTCPrice'
import { fetchActivePlayers } from '../lib/indexer'

const SUI_BLUE = '#4da2ff'

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function Landing() {
  const navigate = useNavigate()
  const { data: oracle } = useBTCPrice()

  const { data: playerCount } = useQuery({
    queryKey: ['player-count'],
    queryFn: () => fetchActivePlayers(50).then((p) => p.length),
    staleTime: 120_000,
  })

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Hero ambient glow */}
      <div
        className="fixed top-[-100px] left-1/2 w-[900px] h-[600px] rounded-full pointer-events-none animate-glow-drift"
        style={{ background: SUI_BLUE, filter: 'blur(140px)' }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">🔥</span>
          <span className="font-black text-lg tracking-tight">StreakSui</span>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/25 rounded-full px-4 py-2 transition-all"
        >
          Open App
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-14 pb-24 max-w-3xl mx-auto">
        {oracle && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10 text-sm border"
            style={{
              background: 'rgba(77,162,255,0.08)',
              borderColor: 'rgba(77,162,255,0.25)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ background: SUI_BLUE }}
            />
            <span className="font-semibold" style={{ color: SUI_BLUE }}>
              BTC {formatUSD(oracle.btcPrice)}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400">Live on Sui testnet</span>
          </div>
        )}

        <h1 className="text-[clamp(2.6rem,9vw,5.5rem)] font-black leading-[1.03] tracking-tight mb-7">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, #ffffff 40%, ${SUI_BLUE})` }}
          >
            Predict BTC.
          </span>
          <br />
          <span className="text-white">Build your streak.</span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-11">
          One call per day. Every prediction opens a live position on{' '}
          <span className="text-white font-semibold">DeepBook Predict</span>.
          Correct calls grow your streak — wrong ones reset it.
        </p>

        <button
          onClick={() => navigate('/app')}
          className="text-black font-black text-lg px-10 py-4 rounded-2xl transition-all active:scale-95"
          style={{
            background: SUI_BLUE,
            boxShadow: `0 0 50px rgba(77,162,255,0.35)`,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 0 70px rgba(77,162,255,0.5)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 0 50px rgba(77,162,255,0.35)'
          }}
        >
          Start Predicting →
        </button>

      </section>

      {/* Stats strip */}
      <div className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] py-6">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/[0.06] text-center">
          <div className="px-4">
            <p className="font-black text-2xl text-white">{playerCount ?? '—'}</p>
            <p className="text-gray-600 text-xs mt-0.5">players on-chain</p>
          </div>
          <div className="px-4">
            <p className="font-black text-2xl text-white">Sub-hour</p>
            <p className="text-gray-600 text-xs mt-0.5">oracle expiry</p>
          </div>
          <div className="px-4">
            <p className="font-black text-2xl" style={{ color: SUI_BLUE }}>
              DeepBook
            </p>
            <p className="text-gray-600 text-xs mt-0.5">Predict protocol</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <p className="text-xs text-gray-600 uppercase tracking-[0.2em] text-center mb-12">
          How it works
        </p>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              n: '01',
              title: 'Connect your wallet',
              body: 'Link a Sui testnet wallet and request dUSDC from our faucet. No real funds needed to start.',
            },
            {
              n: '02',
              title: 'Pick UP or DOWN',
              body: 'Call BTC direction before the oracle expires. Every pick mints a real on-chain position via DeepBook Predict.',
            },
            {
              n: '03',
              title: 'Protect your streak',
              body: 'Correct picks grow your streak. Earn badges at milestones. Use the Streak Shield once a week as insurance.',
            },
          ].map(({ n, title, body }) => (
            <div
              key={n}
              className="rounded-2xl p-6 border transition-colors group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(77,162,255,0.2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(255,255,255,0.06)'
              }}
            >
              <p className="font-black text-sm mb-4" style={{ color: SUI_BLUE }}>
                {n}
              </p>
              <p className="text-white font-bold text-base mb-2">{title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 text-center px-4 py-20 border-t border-white/[0.06]">
        <p className="text-gray-600 text-sm mb-8">
          Built on DeepBook on Sui
        </p>
        <button
          onClick={() => navigate('/app')}
          className="border border-white/10 hover:border-white/20 text-white font-bold px-8 py-3 rounded-2xl transition-all text-sm hover:bg-white/[0.03]"
        >
          Open the App →
        </button>
      </section>
    </div>
  )
}
