import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { dAppKit } from './lib/sui'
import { Dashboard } from './pages/Dashboard'
import { Pick } from './pages/Pick'
import { Leaderboard } from './pages/Leaderboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pick" element={<Pick />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </BrowserRouter>
      </DAppKitProvider>
    </QueryClientProvider>
  )
}
