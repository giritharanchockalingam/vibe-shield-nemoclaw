import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/lib/auth'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import DemoPage from '@/pages/demo/DemoPage'
import AdminPage from '@/pages/admin/AdminPage'
import IntegrationsPage from '@/pages/integrations/IntegrationsPage'
import AiAgentPage from '@/pages/ai/AiAgentPage'
import AuditTrailPage from '@/pages/audit/AuditTrailPage'
import SdlcAgentsPage from '@/pages/sdlc/SdlcAgentsPage'
import LoginPage from '@/pages/auth/LoginPage'
import Layout from '@/components/shared/Layout'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } })

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ height: '100%' }}
      >
        <Routes location={location}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/sdlc" element={<SdlcAgentsPage />} />
          <Route path="/ai" element={<AiAgentPage />} />
          <Route path="/audit" element={<AuditTrailPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Login page — no sidebar layout, public */}
            <Route path="/login" element={<LoginPage />} />
            {/* All other routes — protected with auth + sidebar layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="*" element={<AnimatedRoutes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
