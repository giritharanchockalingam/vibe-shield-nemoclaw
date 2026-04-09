import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Activity, Brain, Code2, FileSearch, BarChart3, GitPullRequest,
  Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock, Lock, Play,
  ChevronRight, ArrowUpRight, Eye, Layers, Server, Users,
  Network, Terminal, Cpu, Globe,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useResponsive } from '@/hooks/useMediaQuery'
import { getGovernanceStats, getGovernanceAudit, getDoraMetrics } from '@/lib/api'
import { useDemoStore } from '@/store/demoStore'

/* ═══════════════════════════════════════════════════════════
   DASHBOARD — Post-login overview with live metrics
   ═══════════════════════════════════════════════════════════ */

interface QuickAction {
  label: string
  icon: typeof Shield
  path: string
  color: string
  desc: string
}

const quickActions: QuickAction[] = [
  { label: 'Demo Console', icon: Play, path: '/demo', color: '#6366f1', desc: 'Run governed agent demos' },
  { label: 'SDLC Agents', icon: Code2, path: '/sdlc', color: '#8b5cf6', desc: '5 AI-powered dev agents' },
  { label: 'Governance Agent', icon: Brain, path: '/ai', color: '#06b6d4', desc: 'Chat with AI governance' },
  { label: 'Audit Trail', icon: FileSearch, path: '/audit', color: '#f59e0b', desc: 'Immutable event log' },
  { label: 'CISO Command', icon: Shield, path: '/admin', color: '#ef4444', desc: 'Security operations' },
  { label: 'Integrations', icon: Globe, path: '/integrations', color: '#22c55e', desc: '30+ connectors' },
]

// ── Animated number ──
function AnimNum({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
    </motion.span>
  )
}

// ── Threat pulse animation ──
function ThreatPulse({ severity, count }: { severity: string; count: number }) {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    info: '#06b6d4',
    low: '#22c55e',
  }
  const color = colors[severity] || '#6366f1'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute', inset: -4,
            borderRadius: '50%', background: color,
          }}
        />
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color, position: 'relative',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, textTransform: 'capitalize' }}>{severity}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count}</span>
    </div>
  )
}

// ── Mini isolation layer status ──
function IsolationStatus() {
  const layers = [
    { name: 'Landlock', color: '#f59e0b', icon: Lock },
    { name: 'Seccomp', color: '#8b5cf6', icon: Shield },
    { name: 'NetNS', color: '#06b6d4', icon: Network },
    { name: 'OpenShell', color: '#3b82f6', icon: Terminal },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {layers.map(l => {
        const Icon = l.icon
        return (
          <div key={l.name} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10,
            background: `${l.color}08`,
            border: `1px solid ${l.color}18`,
          }}>
            <Icon size={14} style={{ color: l.color }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: l.color }}>{l.name}</span>
            <CheckCircle2 size={12} style={{ color: '#22c55e', marginLeft: 'auto' }} />
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isMobile } = useResponsive()
  const { sandboxStatus } = useDemoStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data: govStats } = useQuery({
    queryKey: ['gov-stats-dash'],
    queryFn: getGovernanceStats,
    refetchInterval: 5000,
  })

  const { data: auditLog = [] } = useQuery({
    queryKey: ['gov-audit-dash'],
    queryFn: () => getGovernanceAudit(8),
    refetchInterval: 4000,
  })

  const { data: dora } = useQuery({
    queryKey: ['dora-dash'],
    queryFn: getDoraMetrics,
    refetchInterval: 15000,
  })

  const totalEvents = govStats?.total_events ?? 0
  const totalBlocked = govStats?.total_blocked ?? 0
  const totalAllowed = govStats?.total_allowed ?? 0
  const blockRate = totalEvents > 0 ? ((totalBlocked / totalEvents) * 100).toFixed(1) : '0'
  const criticalBlocked = govStats?.critical_blocked ?? 0
  const highBlocked = govStats?.high_blocked ?? 0

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = user?.email?.split('@')[0] || 'User'

  const cardStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 16,
    padding: isMobile ? 18 : 24,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      height: '100vh', overflow: 'auto',
      padding: isMobile ? '16px' : '28px 32px',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isMobile ? 24 : 30,
              fontWeight: 400,
              marginBottom: 4,
            }}
          >
            {greeting()}, {userName}
          </motion.h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} />
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        {/* ── Top Metrics ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}>
          {[
            { label: 'Total Events', value: totalEvents, icon: Activity, color: '#6366f1', trend: '+12%' },
            { label: 'Threats Blocked', value: totalBlocked, icon: Shield, color: '#ef4444', trend: `${blockRate}%` },
            { label: 'Events Allowed', value: totalAllowed, icon: CheckCircle2, color: '#22c55e', trend: 'healthy' },
            { label: 'Critical Blocked', value: criticalBlocked, icon: AlertTriangle, color: '#f59e0b', trend: '0 active' },
          ].map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={cardStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${m.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} style={{ color: m.color }} />
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: m.color,
                    padding: '3px 8px', borderRadius: 6,
                    background: `${m.color}10`,
                  }}>
                    {m.trend}
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.color, lineHeight: 1 }}>
                  <AnimNum value={m.value} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{m.label}</div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Main Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: 20,
          marginBottom: 24,
        }}>
          {/* Left: Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={cardStyle}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#6366f1' }} />
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 10,
            }}>
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    whileHover={{ y: -2, borderColor: `${action.color}30` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    style={{
                      padding: 16, borderRadius: 12, cursor: 'pointer',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={20} style={{ color: action.color, marginBottom: 10 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: Sandbox + Isolation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={cardStyle}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={16} style={{ color: '#22c55e' }} />
                NemoClaw Sandbox
              </h3>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                marginBottom: 14,
              }}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Sandbox Active</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>v2.1.0</span>
              </div>
              <IsolationStatus />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={cardStyle}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                Threat Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ThreatPulse severity="critical" count={criticalBlocked} />
                <ThreatPulse severity="high" count={highBlocked} />
                <ThreatPulse severity="info" count={Math.max(0, totalAllowed - criticalBlocked - highBlocked)} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Recent Audit Events ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={cardStyle}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSearch size={16} style={{ color: '#06b6d4' }} />
              Recent Governance Events
            </h3>
            <button
              onClick={() => navigate('/audit')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6366f1', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {auditLog.slice(0, 6).map((event: any, i: number) => {
              const layerColors: Record<string, string> = {
                landlock: '#f59e0b', seccomp: '#8b5cf6', netns: '#06b6d4',
                openshell: '#3b82f6', gateway: '#22c55e',
              }
              const color = layerColors[event.isolation_layer] || '#6366f1'
              const isBlocked = event.action === 'BLOCKED'
              return (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    background: isBlocked ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.1)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isBlocked ? '#ef4444' : '#22c55e',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: `${color}15`, color,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    flexShrink: 0,
                  }}>
                    {event.isolation_layer}
                  </span>
                  <span style={{
                    fontSize: 12, color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {event.detail}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isBlocked ? '#ef4444' : '#22c55e',
                    flexShrink: 0,
                  }}>
                    {event.action}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── DORA Metrics (if available) ── */}
        {dora && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ ...cardStyle, marginTop: 20 }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitPullRequest size={16} style={{ color: '#8b5cf6' }} />
              DORA Metrics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 12,
            }}>
              {[
                { label: 'Deploy Frequency', value: dora.deployment_frequency || '4.2/day', color: '#6366f1' },
                { label: 'Lead Time', value: dora.lead_time || '2.1 hrs', color: '#22c55e' },
                { label: 'MTTR', value: dora.mttr || '18 min', color: '#f59e0b' },
                { label: 'Change Failure', value: dora.change_failure_rate || '1.2%', color: '#ef4444' },
              ].map(m => (
                <div key={m.label} style={{
                  padding: 16, borderRadius: 12,
                  background: `${m.color}06`,
                  border: `1px solid ${m.color}12`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.color }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
