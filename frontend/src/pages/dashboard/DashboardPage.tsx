import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, BookOpen, Code2, DollarSign, Cpu, Activity,
  ShieldCheck, ArrowRight, PiggyBank, AlertTriangle,
} from 'lucide-react'
import { getFinops, getAppConfig, knowledgeStats, getGovernanceAudit } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useResponsive } from '@/hooks/useMediaQuery'

const money = (n: number) => `$${(n ?? 0).toFixed((n ?? 0) >= 1 ? 2 : 4)}`

function Stat({ icon: Icon, label, value, sub, color }: { icon: typeof Cpu; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass" style={{ padding: 18, borderRadius: 14, flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
        <Icon size={15} style={{ color }} /> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function QuickCard({ icon: Icon, title, desc, to, color }: { icon: typeof Cpu; title: string; desc: string; to: string; color: string }) {
  const nav = useNavigate()
  return (
    <div className="glass hover-border" onClick={() => nav(to)}
      style={{ padding: 18, borderRadius: 14, flex: 1, minWidth: 210, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }} />
        </div>
        <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { isMobile } = useResponsive()
  const { data: cfg } = useQuery({ queryKey: ['app-config'], queryFn: getAppConfig, retry: 0 })
  const { data: finops } = useQuery({ queryKey: ['dash-finops'], queryFn: getFinops, retry: 0, refetchInterval: 20000 })
  const { data: kb } = useQuery({ queryKey: ['dash-kb'], queryFn: knowledgeStats, retry: 0 })
  const { data: audit } = useQuery({ queryKey: ['dash-audit'], queryFn: () => getGovernanceAudit(8), retry: 0, refetchInterval: 10000 })

  const fo = finops?.enabled ? finops : null
  const events: any[] = Array.isArray(audit) ? audit : (audit?.events || [])
  const name = (user?.email || 'there').split('@')[0]
  const gatewayOn = !!cfg?.gateway_enabled

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: isMobile ? 18 : 28, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: isMobile ? 22 : 26 }}>Welcome back, {name}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Your governed AI platform — every request routed local-first, attributed, and audited.
          </p>
        </div>

        {/* Platform status strip */}
        <div className="glass" style={{ padding: '10px 16px', borderRadius: 10, display: 'flex', gap: 18, alignItems: 'center', marginBottom: 18, fontSize: 13, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: gatewayOn ? '#34d399' : '#fbbf24' }}>
            <ShieldCheck size={15} /> Gateway {gatewayOn ? 'connected' : 'not configured'}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>Router model: <b style={{ color: 'var(--text-primary)' }}>{cfg?.model || '—'}</b></span>
          <span style={{ color: 'var(--text-secondary)' }}>Knowledge base: <b style={{ color: 'var(--text-primary)' }}>{kb?.documents ?? 0} docs</b></span>
          {cfg?.demo_mode && <span style={{ color: '#fbbf24', display: 'flex', gap: 4, alignItems: 'center' }}><AlertTriangle size={13} /> demo mode</span>}
        </div>

        {!gatewayOn && (
          <div className="glass" style={{ padding: 14, borderRadius: 12, marginBottom: 18, fontSize: 13, color: 'var(--text-secondary)', borderLeft: '3px solid #fbbf24' }}>
            The inference gateway isn't configured, so live cost telemetry is unavailable. Set <code>EDGE_GATEWAY_URL</code> to connect the private-GPU tier.
          </div>
        )}

        {/* FinOps headline */}
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.6 }}>Inference economics</h3>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <Stat icon={Activity} label="Requests" value={String(fo?.requests ?? 0)} color="#818cf8" sub={`escalation ${fo?.escalation_rate_pct ?? 0}%`} />
          <Stat icon={Cpu} label="Ran local" value={`${fo?.local_pct ?? 0}%`} color="#34d399" sub={`${fo?.route_mix?.local ?? 0} local / ${fo?.route_mix?.cloud ?? 0} cloud`} />
          <Stat icon={DollarSign} label="Cloud spend" value={money(fo?.est_spend_usd ?? 0)} color="#fbbf24" />
          <Stat icon={PiggyBank} label="Cost avoided" value={money(fo?.cloud_cost_avoided_usd ?? 0)} color="#34d399" sub="local tokens at cloud rates" />
        </div>

        {/* Quick actions */}
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.6 }}>Get started</h3>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <QuickCard icon={Sparkles} title="Assistant" desc="Governed chat, local-first on Gemma. Confidential stays on-device." to="/assistant" color="#818cf8" />
          <QuickCard icon={BookOpen} title="Knowledge" desc="Ask questions over your docs — embedded & searched on-device." to="/knowledge" color="#34d399" />
          <QuickCard icon={Code2} title="SDLC Agents" desc="Code, security & QA routed through the governed gateway." to="/sdlc" color="#fbbf24" />
          <QuickCard icon={DollarSign} title="FinOps" desc="Spend & savings per user and project, with budget caps." to="/finops" color="#34d399" />
        </div>

        {/* Recent activity */}
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.6 }}>Recent activity</h3>
        <div className="glass" style={{ padding: 8, borderRadius: 14 }}>
          {events.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
              No activity yet — try the Assistant or index a document in Knowledge.
            </div>
          )}
          {events.slice(0, 8).map((e, i) => {
            const blocked = e.action === 'BLOCKED'
            const shown = Math.min(events.length, 8)
            return (
              <div key={e.id || i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 12px', borderBottom: i < shown - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.04, background: blocked ? 'rgba(248,113,113,.15)' : 'rgba(52,211,153,.15)', color: blocked ? '#f87171' : '#34d399' }}>{e.action || 'info'}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail || e.event_type || '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.timestamp || e.created_at ? new Date(e.timestamp || e.created_at).toLocaleTimeString() : ''}</span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
