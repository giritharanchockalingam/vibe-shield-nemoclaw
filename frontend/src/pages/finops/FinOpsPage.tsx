import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { DollarSign, Cpu, Cloud, PiggyBank, Activity, AlertTriangle } from 'lucide-react'
import { getFinops } from '@/lib/api'

type AccountRow = { requests: number; local: number; cloud: number; spend_usd: number; cost_avoided_usd: number }

const fmt = (n: number) => `$${(n ?? 0).toFixed(n >= 1 ? 2 : 4)}`

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof DollarSign; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="glass" style={{ padding: 20, borderRadius: 14, flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
        <Icon size={16} style={{ color }} /> {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function AccountTable({ title, rows, caps, capSpent }: {
  title: string
  rows: Record<string, AccountRow>
  caps?: Record<string, number>
  capSpent?: Record<string, number>
}) {
  const entries = Object.entries(rows || {}).sort((a, b) => b[1].spend_usd - a[1].spend_usd)
  return (
    <div className="glass" style={{ padding: 20, borderRadius: 14, flex: 1, minWidth: 360 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--text-primary)' }}>{title}</h3>
      {entries.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No usage yet.</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {entries.length > 0 && (
          <thead>
            <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Account</th>
              <th style={{ padding: '6px 8px' }}>Requests</th>
              <th style={{ padding: '6px 8px' }}>Local / Cloud</th>
              <th style={{ padding: '6px 8px' }}>Spend</th>
              <th style={{ padding: '6px 8px' }}>Avoided</th>
              {caps && <th style={{ padding: '6px 8px' }}>Budget</th>}
            </tr>
          </thead>
        )}
        <tbody>
          {entries.map(([name, r]) => {
            const cap = caps?.[name]
            const spentForCap = capSpent?.[name] ?? r.spend_usd
            const pct = cap ? Math.min(100, (spentForCap / cap) * 100) : 0
            return (
              <tr key={name} style={{ borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
                <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</td>
                <td style={{ padding: '8px' }}>{r.requests}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ color: '#34d399' }}>{r.local}</span>
                  {' / '}
                  <span style={{ color: '#fbbf24' }}>{r.cloud}</span>
                </td>
                <td style={{ padding: '8px' }}>{fmt(r.spend_usd)}</td>
                <td style={{ padding: '8px', color: '#34d399' }}>{fmt(r.cost_avoided_usd)}</td>
                {caps && (
                  <td style={{ padding: '8px', minWidth: 120 }}>
                    {cap ? (
                      <div title={`${fmt(spentForCap)} of $${cap}`}>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8 }}>
                          <div style={{
                            width: `${pct}%`, height: 8, borderRadius: 6,
                            background: pct >= 100 ? '#f87171' : pct > 75 ? '#fbbf24' : '#34d399',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {pct >= 100 ? 'cap hit — pinned local' : `${pct.toFixed(0)}% of $${cap}`}
                        </div>
                      </div>
                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>no cap</span>}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function FinOpsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['finops'],
    queryFn: getFinops,
    refetchInterval: 15000,
  })

  if (isLoading) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Loading FinOps telemetry…</div>

  if (error || !data) return (
    <div className="glass" style={{ margin: 32, padding: 24, borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
      <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
      <div style={{ color: 'var(--text-secondary)' }}>FinOps telemetry unavailable — is the backend up?</div>
    </div>
  )

  if (!data.enabled) return (
    <div className="glass" style={{ margin: 32, padding: 24, borderRadius: 14 }}>
      <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>FinOps</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        The Edge-First gateway is not configured (<code>EDGE_GATEWAY_URL</code> unset) —
        inference goes direct to the cloud provider with no routing or cost attribution.
        Point the backend at an Edge-First runtime to enable hybrid routing + FinOps.
      </p>
    </div>
  )

  const mix = data.route_mix || { local: 0, cloud: 0 }
  const budget = data.budget || {}

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>FinOps — Hybrid Inference Costs</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
          Live from the Edge-First gateway: every request attributed to a user and project.
          Local inference is free; cloud egress is policy-gated, metered, and capped.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard icon={Activity} label="Requests" value={String(data.requests)} color="#818cf8"
          sub={`escalation rate ${data.escalation_rate_pct ?? 0}%`} />
        <StatCard icon={Cpu} label="Ran Local" value={`${data.local_pct ?? 0}%`} color="#34d399"
          sub={`${mix.local} local / ${mix.cloud} cloud`} />
        <StatCard icon={DollarSign} label="Cloud Spend" value={fmt(data.est_spend_usd)} color="#fbbf24"
          sub={budget.cap_usd ? `org cap $${budget.cap_usd} · ${fmt(budget.remaining_usd ?? 0)} left` : undefined} />
        <StatCard icon={PiggyBank} label="Cloud Cost Avoided" value={fmt(data.cloud_cost_avoided_usd)} color="#34d399"
          sub="local tokens priced at cloud rates" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <AccountTable title="By Project" rows={data.by_project}
          caps={budget.project_caps} capSpent={budget.by_project} />
        <AccountTable title="By User" rows={data.by_user} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
        <Cloud size={14} /> When a project hits its budget cap the router pins it LOCAL —
        agents keep working at zero marginal cost; cloud spend stops.
      </div>
    </motion.div>
  )
}
