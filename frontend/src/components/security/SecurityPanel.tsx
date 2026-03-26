import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Globe, Code, AlertTriangle, CheckCircle, Activity, Server, Key, Eye } from 'lucide-react'
import { getSandboxStatus, getGovernanceRules, getGovernanceAudit, getGovernancePolicy } from '@/lib/api'
import { useDemoStore } from '@/store/demoStore'
import { VERTICALS } from '@/types'
import type { Vertical } from '@/types'

const LAYER_META: Record<string, { icon: any; color: string; desc: string }> = {
  landlock: { icon: Lock, color: '#f59e0b', desc: 'Filesystem isolation — agent writes only to /sandbox/ and /tmp/. Kernel-enforced via Landlock LSM. Immutable at runtime.' },
  seccomp: { icon: Shield, color: '#ef4444', desc: 'Syscall filtering — blocks ptrace, mount, unshare, setns, pivot_root. Prevents privilege escalation at kernel level.' },
  netns: { icon: Globe, color: '#06b6d4', desc: 'Network namespace — deny-all egress by default. Only allowlisted endpoints reachable. DNS queries filtered.' },
  openshell: { icon: Code, color: '#8b5cf6', desc: 'Policy engine — evaluates every action against YAML rules. Unlisted requests escalate to operator TUI.' },
}

const COMPONENT_META: Record<string, { icon: any; label: string; color: string }> = {
  plugin: { icon: Code, label: 'Plugin (CLI)', color: '#7085ff' },
  blueprint: { icon: Server, label: 'Blueprint (Orchestrator)', color: '#4fc87a' },
  sandbox: { icon: Shield, label: 'Sandbox (OpenShell)', color: '#f59e0b' },
  gateway: { icon: Key, label: 'Inference Gateway', color: '#06b6d4' },
}

function timeAgo(ts: number): string {
  const s = Math.floor(Date.now() / 1000 - ts)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function severityColor(sev: string): string {
  switch (sev) {
    case 'critical': return '#ef4444'
    case 'high': return '#f59e0b'
    case 'medium': return '#06b6d4'
    default: return '#4ade80'
  }
}

export default function SecurityPanel() {
  const { data: sb } = useQuery({ queryKey: ['sandbox-status'], queryFn: getSandboxStatus, refetchInterval: 5000 })
  const { data: policy } = useQuery({ queryKey: ['governance-policy'], queryFn: getGovernancePolicy, refetchInterval: 8000 })
  const { data: rules } = useQuery({ queryKey: ['governance-rules'], queryFn: getGovernanceRules })
  const { data: auditEntries } = useQuery({ queryKey: ['governance-audit'], queryFn: () => getGovernanceAudit(20), refetchInterval: 3000 })
  const { selectedVertical } = useDemoStore()
  const verticalColor = VERTICALS[selectedVertical as Vertical]?.color || '#4f5eff'

  const blocked = sb?.stats?.blocked ?? 0
  const allowed = sb?.stats?.allowed ?? 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Header with live stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 8, borderRadius: 8, background: `${verticalColor}15`, border: `1px solid ${verticalColor}30`, fontSize: 20 }}>🛡️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0' }}>NemoClaw Governance</div>
          <div style={{ fontSize: 12, color: '#8b8fa8' }}>4-layer kernel isolation · real-time policy enforcement · immutable audit trail</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{blocked}</div>
            <div style={{ fontSize: 9, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blocked</div>
          </div>
          <div style={{ width: 1, height: 28, background: '#1e2035' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>{allowed}</div>
            <div style={{ fontSize: 9, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allowed</div>
          </div>
          <div style={{ width: 1, height: 28, background: '#1e2035' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sb?.status === 'running' ? '#4ade80' : '#6b7280', display: 'inline-block', boxShadow: sb?.status === 'running' ? '0 0 8px #4ade8060' : 'none' }} />
            <span style={{ color: '#8b8fa8', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{sb?.nemoclaw_version ?? 'alpha'}</span>
          </div>
        </div>
      </div>

      {/* NemoClaw 4-Component Architecture */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>NemoClaw Architecture (4 Components)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {sb?.components && Object.entries(sb.components).map(([key, comp]: [string, any], i: number) => {
            const meta = COMPONENT_META[key]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ padding: '12px 10px', borderRadius: 8, background: '#111224', border: '1px solid #1e2035', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: meta.color }} />
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <Icon size={14} style={{ color: meta.color }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e4f0', marginBottom: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: comp.status === 'active' ? '#4ade80' : '#8b8fa8', letterSpacing: '0.05em' }}>{comp.status}</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Kernel Isolation Layers */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>Kernel Isolation Layers</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.entries(LAYER_META).map(([key, meta], i) => {
            const Icon = meta.icon
            const layerData = policy?.isolation?.[key]
            const count = key === 'landlock' ? layerData?.denied_writes_count :
                         key === 'seccomp' ? layerData?.blocked_count :
                         key === 'netns' ? layerData?.denied_egress_count :
                         layerData?.policy_evaluations
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                style={{ padding: '14px 14px', borderRadius: 10, background: '#111224', border: '1px solid #1e2035', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: meta.color, opacity: 0.7 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e4f0' }}>{key}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#4ade80', letterSpacing: '0.05em' }}>active</div>
                  </div>
                  {count !== undefined && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}>{count}</div>
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#8b8fa8', lineHeight: 1.45, margin: 0 }}>{meta.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Credential Isolation — Jensen's principle */}
      <div style={{ padding: 14, borderRadius: 10, background: '#111224', border: '1px solid #1e2035', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#06b6d4' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Key size={14} style={{ color: '#06b6d4' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e4f0' }}>Inference Gateway — Credentials Never Enter Sandbox</span>
        </div>
        <div style={{ fontSize: 11, color: '#8b8fa8', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
          {policy?.inference_gateway?.routing ?? 'agent → inference.local → OpenShell → provider'}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10, color: '#5a5e78' }}>
          <span>Provider: <span style={{ color: '#06b6d4' }}>{policy?.inference_gateway?.provider ?? 'anthropic'}</span></span>
          <span>Model: <span style={{ color: '#06b6d4' }}>{policy?.inference_gateway?.model ?? 'claude-sonnet-4.6'}</span></span>
          <span>Calls: <span style={{ color: '#06b6d4' }}>{policy?.inference_gateway?.total_calls ?? 0}</span></span>
        </div>
      </div>

      {/* Network Egress Policy */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>Network Egress Policy (deny-all default)</div>
        {sb?.policies?.map((r: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, border: `1px solid ${r.action === 'allow' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, background: r.action === 'allow' ? 'rgba(74,222,128,0.04)' : 'rgba(248,113,113,0.04)', marginBottom: 6, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: r.action === 'allow' ? '#4ade80' : '#f87171' }}
          >
            <span>{r.action === 'allow' ? '✓' : '✗'}</span>
            <span style={{ flex: 1 }}>{r.host}:{r.port}</span>
            <span style={{ fontSize: 10, color: '#5a5e78', fontFamily: "'DM Sans', system-ui" }}>{r.purpose}</span>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: r.action === 'allow' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>{r.action}</span>
          </motion.div>
        ))}
      </div>

      {/* Active Policy Rules — from backend */}
      <div style={{ background: '#111224', borderRadius: 10, border: '1px solid #1e2035', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} style={{ color: verticalColor }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0' }}>Active Policy Rules</span>
          <span style={{ fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 4, marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{rules?.length ?? 0} enforced</span>
        </div>
        <div style={{ padding: '4px 0', maxHeight: 220, overflowY: 'auto' }}>
          {(rules ?? []).map((rule: any, i: number) => (
            <motion.div key={rule.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04, duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px' }}
            >
              <CheckCircle size={11} style={{ color: '#4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#5a5e78', width: 52, flexShrink: 0 }}>{rule.id}</span>
              <span style={{ fontSize: 12, color: '#c8cae0', flex: 1 }}>{rule.rule}</span>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: severityColor(rule.severity), textTransform: 'uppercase', padding: '1px 5px', borderRadius: 3, background: `${severityColor(rule.severity)}10` }}>{rule.severity}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Audit Feed — from backend */}
      <div style={{ background: '#111224', borderRadius: 10, border: '1px solid #1e2035', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0' }}>Live Audit Trail</span>
          <span style={{ fontSize: 10, color: '#8b8fa8', marginLeft: 4 }}>OpenShell → SIEM forward</span>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginLeft: 'auto' }}
          />
        </div>
        <div style={{ padding: '2px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, maxHeight: 260, overflowY: 'auto' }}>
          <AnimatePresence>
            {(auditEntries ?? []).map((entry: any, i: number) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 16px', borderBottom: '1px solid #1e203520' }}
              >
                <span style={{ color: '#5a5e78', fontSize: 10, whiteSpace: 'nowrap', marginTop: 1, width: 50, flexShrink: 0 }}>{timeAgo(entry.timestamp)}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, flexShrink: 0, marginTop: 1,
                  background: entry.action === 'BLOCKED' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.12)',
                  color: entry.action === 'BLOCKED' ? '#ef4444' : '#4ade80'
                }}>{entry.action}</span>
                <span style={{ fontSize: 9, color: severityColor(entry.severity), textTransform: 'uppercase', flexShrink: 0, marginTop: 2, width: 18 }}>
                  {entry.isolation_layer?.slice(0, 3)}
                </span>
                <span style={{ color: '#8b8fa8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10.5 }}>{entry.detail}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Jensen's Thesis — talking point */}
      <div style={{ padding: 14, borderRadius: 10, background: `${verticalColor}08`, border: `1px solid ${verticalColor}20` }}>
        <div style={{ fontSize: 10, color: verticalColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, fontWeight: 600 }}>JENSEN'S THESIS — DEMO TALKING POINT</div>
        <div style={{ fontSize: 12, color: '#c8cae0', lineHeight: 1.65 }}>
          "The gap between 'agent works on my laptop' and 'agent runs in production' is not model quality — it is <em style={{ color: '#e2e4f0' }}>runtime governance</em>. NemoClaw provides kernel-level isolation: Landlock for filesystem, seccomp for syscalls, netns for network. API credentials <em style={{ color: '#e2e4f0' }}>never enter the sandbox</em> — they route through the inference gateway on the host. Your security team owns the YAML policy file, versioned in Git, reviewed like code."
        </div>
      </div>
    </div>
  )
}
