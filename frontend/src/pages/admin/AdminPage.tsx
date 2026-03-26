import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Activity, Layers, CheckCircle2, Shield, AlertTriangle, Lock, Globe, Database, Clock, Zap } from 'lucide-react'
import { getGovernanceStats, getGovernanceAudit, getClients, getDemoSessions } from '@/lib/api'
import { VERTICALS } from '@/types'

export default function AdminPage() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getDemoSessions(50),
  })
  const { data: govStats } = useQuery({
    queryKey: ['gov-stats'],
    queryFn: getGovernanceStats,
    refetchInterval: 5000,
  })
  const { data: auditLog = [] } = useQuery({
    queryKey: ['gov-audit-admin'],
    queryFn: () => getGovernanceAudit(15),
    refetchInterval: 4000,
  })

  const th: React.CSSProperties = {
    padding: '10px 16px', fontSize: 11, color: '#8b8fa8', fontWeight: 500,
    textAlign: 'left', borderBottom: '1px solid #1e2035', textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const td: React.CSSProperties = {
    padding: '10px 16px', fontSize: 12, borderBottom: '1px solid #1e2035', color: '#c8cae0',
  }

  function timeAgo(ts: number | string): string {
    let seconds: number
    if (typeof ts === 'string') {
      // ISO 8601 timestamp from Supabase
      seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    } else {
      // Unix timestamp
      seconds = Math.floor(Date.now() / 1000 - ts)
    }
    if (seconds < 0) seconds = 0
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const dataSource = govStats?.data_source || 'loading'
  const completedSessions = sessions.filter((s: any) => s.status === 'completed' || s.status === 'complete')
  const totalTokens = sessions.reduce((sum: number, s: any) => sum + (s.tokens_used || 0), 0)
  const avgDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum: number, s: any) => sum + (s.duration_ms || 0), 0) / completedSessions.length)
    : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Header with data source badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0' }}>
          Admin Dashboard
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6,
          background: dataSource === 'supabase' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${dataSource === 'supabase' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <Database size={11} style={{ color: dataSource === 'supabase' ? '#4ade80' : '#ef4444' }} />
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
            color: dataSource === 'supabase' ? '#4ade80' : '#ef4444',
          }}>
            {dataSource === 'supabase' ? 'LIVE DATA · Supabase' : dataSource === 'in-memory' ? 'LOCAL ONLY' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* NemoClaw Governance Stats — top row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Violations Blocked', value: govStats?.total_blocked ?? 0, icon: Shield, color: '#ef4444' },
          { label: 'Events Allowed', value: govStats?.total_allowed ?? 0, icon: CheckCircle2, color: '#4ade80' },
          { label: 'Critical Blocked', value: govStats?.critical_blocked ?? 0, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Policy Rules', value: govStats?.policy_rules_enforced ?? 0, icon: Lock, color: '#7085ff' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}
              style={{ padding: 16, borderRadius: 10, background: '#111224', border: '1px solid #1e2035' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} style={{ color: stat.color }} />
                </div>
                <span style={{ fontSize: 10, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{stat.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: '#e2e4f0' }}>{stat.value}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Enforcement by Isolation Layer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* By Layer */}
        <div style={{ borderRadius: 10, background: '#111224', border: '1px solid #1e2035', padding: 16 }}>
          <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={12} /> Events by Isolation Layer
          </div>
          {govStats?.by_layer && Object.entries(govStats.by_layer).map(([layer, count]: [string, any]) => {
            const total = govStats.total_events || 1
            const pct = Math.round((count / total) * 100)
            const colors: Record<string, string> = { netns: '#06b6d4', seccomp: '#ef4444', landlock: '#f59e0b', openshell: '#8b5cf6', gateway: '#4ade80' }
            const color = colors[layer] ?? '#8b8fa8'
            return (
              <div key={layer} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#c8cae0', fontFamily: "'JetBrains Mono', monospace" }}>{layer}</span>
                  <span style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#1e2035', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ height: '100%', background: color, borderRadius: 2 }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* By Severity */}
        <div style={{ borderRadius: 10, background: '#111224', border: '1px solid #1e2035', padding: 16 }}>
          <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} /> Blocked by Severity
          </div>
          {govStats?.by_severity && Object.entries(govStats.by_severity).map(([sev, count]: [string, any]) => {
            const sevColors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#06b6d4', low: '#4ade80' }
            const color = sevColors[sev] ?? '#8b8fa8'
            return (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", width: 55 }}>{sev}</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1e2035', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: color, borderRadius: 2, width: `${Math.min(100, count * 15)}%` }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace", width: 20, textAlign: 'right' }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Audit Log */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} />
          Live Audit Trail
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginLeft: 4 }}
          />
          {dataSource === 'supabase' && (
            <span style={{ fontSize: 9, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", marginLeft: 8 }}>PERSISTED</span>
          )}
        </div>
        <div style={{ borderRadius: 10, border: '1px solid #1e2035', overflow: 'hidden', background: '#111224' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0e1a' }}>
                {['Time', 'Action', 'Layer', 'Severity', 'Detail'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry: any, i: number) => (
                <motion.tr key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a5e78', whiteSpace: 'nowrap', width: 60 }}>
                    {timeAgo(entry.timestamp || entry.created_at)}
                  </td>
                  <td style={td}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                      background: entry.action === 'BLOCKED' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.12)',
                      color: entry.action === 'BLOCKED' ? '#ef4444' : '#4ade80',
                    }}>{entry.action}</span>
                  </td>
                  <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#8b8fa8' }}>{entry.isolation_layer}</td>
                  <td style={td}>
                    <span style={{
                      fontSize: 9, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
                      color: entry.severity === 'critical' ? '#ef4444' : entry.severity === 'high' ? '#f59e0b' : '#4ade80',
                    }}>{entry.severity}</span>
                  </td>
                  <td style={{ ...td, fontSize: 11, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.detail}</td>
                </motion.tr>
              ))}
              {auditLog.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#5a5e78', padding: 32, borderBottom: 'none' }}>
                    No governance events yet — run a demo session to generate real telemetry
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Stats — real data from Supabase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Demo Sessions', value: sessions.length, icon: Activity, color: '#4fc87a' },
          { label: 'Completed', value: completedSessions.length, icon: CheckCircle2, color: '#06b6d4' },
          { label: 'Total Tokens', value: totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens, icon: Zap, color: '#f59e0b' },
          { label: 'Avg Duration', value: avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : '—', icon: Clock, color: '#7085ff' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
              style={{ padding: 16, borderRadius: 10, background: '#111224', border: '1px solid #1e2035' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={12} style={{ color: stat.color }} />
                <span style={{ fontSize: 10, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{stat.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: '#e2e4f0' }}>{stat.value}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Sessions Table */}
      {sessions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>
            Recent Demo Sessions
          </div>
          <div style={{ borderRadius: 10, border: '1px solid #1e2035', overflow: 'hidden', background: '#111224' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0e1a' }}>
                  {['Time', 'Vertical', 'Agent', 'Status', 'Tokens', 'Duration', 'Violations'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((sess: any, i: number) => (
                  <tr key={sess.id}>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a5e78' }}>
                      {timeAgo(sess.created_at)}
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                        background: `${(VERTICALS as any)[sess.vertical]?.color || '#7085ff'}20`,
                        color: (VERTICALS as any)[sess.vertical]?.color || '#7085ff',
                      }}>{sess.vertical}</span>
                    </td>
                    <td style={{ ...td, fontSize: 11, color: '#8b8fa8' }}>{sess.agent_type}</td>
                    <td style={td}>
                      <span style={{
                        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                        color: sess.status === 'completed' ? '#4ade80' : sess.status === 'error' ? '#ef4444' : '#f59e0b',
                      }}>{sess.status}</span>
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c8cae0' }}>
                      {sess.tokens_used || '—'}
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c8cae0' }}>
                      {sess.duration_ms ? `${(sess.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td style={td}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                        color: (sess.governance_violations_blocked || 0) > 0 ? '#ef4444' : '#4ade80',
                      }}>
                        {sess.governance_violations_blocked || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
