import { useQuery } from '@tanstack/react-query'
import { Shield, Wifi, WifiOff } from 'lucide-react'
import { getSandboxStatus, getGovernanceStats } from '@/lib/api'

export default function SandboxStatusBadge() {
  // Try backend sandbox status first (local dev)
  const { data, isError } = useQuery({ queryKey: ['sandbox-status'], queryFn: getSandboxStatus, refetchInterval: 10000, retry: 1 })
  // Also check Supabase governance data (production)
  const { data: govStats } = useQuery({ queryKey: ['gov-stats-badge'], queryFn: getGovernanceStats, refetchInterval: 30000, retry: 1 })

  const hasBackend = !isError && data?.status === 'running'
  const hasSupabaseGov = govStats?.data_source === 'supabase' || (govStats && !govStats.error)
  const isConnected = hasBackend || hasSupabaseGov

  const statusColor = isConnected ? '#4ade80' : '#6b7280'
  const StatusIcon = isConnected ? Wifi : WifiOff
  const label = hasBackend ? (data?.model ?? 'NemoClaw v3') : hasSupabaseGov ? 'Supabase · Live' : 'not connected'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(79, 94, 255, 0.05)', border: '1px solid #1e2035' }}>
      <Shield size={16} style={{ color: '#4f5eff' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#e2e4f0', lineHeight: 1.3 }}>NemoClaw</div>
        <div style={{ fontSize: 11, color: '#8b8fa8' }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}60` }} />
        <StatusIcon size={12} style={{ color: statusColor }} />
      </div>
    </div>
  )
}
