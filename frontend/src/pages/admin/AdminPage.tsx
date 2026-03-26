import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, Activity, Layers, CheckCircle2, Shield, AlertTriangle, Lock, Globe,
  Database, Clock, Zap, TrendingUp, Server, Key, FileText, AlertCircle
} from 'lucide-react'
import { getGovernanceStats, getGovernanceAudit, getClients, getDemoSessions } from '@/lib/api'

// Design system constants
const THEME = {
  bg: '#0a0b14',
  card: '#111224',
  border: '#1e2035',
  text: '#e2e4f0',
  textSecondary: '#8b8fa8',
  textMuted: '#6b7089',
  accent: '#4f5eff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

// Agent definitions
const AGENTS = [
  { id: 'AGT-CC-001', name: 'Code Assistant', role: 'Code Generation', scope: 'Code Repos, CI/CD', riskLevel: 'low' },
  { id: 'AGT-SS-002', name: 'Security Scanner', role: 'Vulnerability Detection', scope: 'Code Analysis Only', riskLevel: 'low' },
  { id: 'AGT-QA-003', name: 'QA Reviewer', role: 'Test Management', scope: 'Test Environments', riskLevel: 'low' },
  { id: 'AGT-TG-004', name: 'Test Generator', role: 'Test Creation', scope: 'Test Environments', riskLevel: 'medium' },
  { id: 'AGT-RE-005', name: 'Reverse Engineer', role: 'Analysis & Learning', scope: 'Read-Only Archives', riskLevel: 'medium' },
  { id: 'AGT-GOV-006', name: 'Governance Agent', role: 'Compliance Monitoring', scope: 'All Audit Trails', riskLevel: 'low' },
]

// Simulated change records
const CHANGE_RECORDS = [
  { id: 'CHG-001', agent: 'AGT-CC-001', action: 'Deploy feature-auth', ticket: 'ITSM-2841', approver: 'Sarah Chen', status: 'Approved', timestamp: 1711530000 },
  { id: 'CHG-002', agent: 'AGT-SS-002', action: 'Run security scan', ticket: 'ITSM-2842', approver: 'Mike Torres', status: 'Executed', timestamp: 1711526400 },
  { id: 'CHG-003', agent: 'AGT-QA-003', action: 'Execute test suite', ticket: 'ITSM-2843', approver: 'Sarah Chen', status: 'Executed', timestamp: 1711522800 },
  { id: 'CHG-004', agent: 'AGT-TG-004', action: 'Generate unit tests', ticket: 'ITSM-2844', approver: 'James Park', status: 'Pending', timestamp: 1711519200 },
  { id: 'CHG-005', agent: 'AGT-RE-005', action: 'Analyze legacy code', ticket: 'ITSM-2845', approver: 'Sarah Chen', status: 'Approved', timestamp: 1711515600 },
]

// Compliance frameworks
const COMPLIANCE_FRAMEWORKS = [
  { name: 'SOC 2 Type II', coverage: 94, evidence: 157, lastAudit: '2025-03-15', status: 'Aligned' },
  { name: 'NIST AI RMF', coverage: 88, evidence: 124, lastAudit: '2025-03-10', status: 'In Progress' },
  { name: 'ISO 27001', coverage: 92, evidence: 143, lastAudit: '2025-02-28', status: 'Aligned' },
  { name: 'OWASP LLM Top 10', coverage: 91, evidence: 139, lastAudit: '2025-03-12', status: 'Aligned' },
]

// SIEM integrations
const SIEM_TARGETS = [
  { name: 'Splunk', status: 'Connected', eventsPerHour: 2847, lastSync: '2m ago', color: '#06b6d4' },
  { name: 'Datadog', status: 'Connected', eventsPerHour: 3142, lastSync: '1m ago', color: '#7c3aed' },
  { name: 'AWS CloudTrail', status: 'Connected', eventsPerHour: 1928, lastSync: '3m ago', color: '#f59e0b' },
  { name: 'Azure Sentinel', status: 'Pending', eventsPerHour: 0, lastSync: 'Never', color: '#ef4444' },
]

// Separation of duties matrix data
const SOD_MATRIX = [
  { agent: 'Code Assistant', canExecute: true, canApprovOwn: false, canDeploy: false, canAccessProd: false, requiresReview: true },
  { agent: 'Security Scanner', canExecute: true, canApprovOwn: false, canDeploy: false, canAccessProd: false, requiresReview: true },
  { agent: 'QA Reviewer', canExecute: true, canApprovOwn: false, canDeploy: false, canAccessProd: false, requiresReview: true },
  { agent: 'Test Generator', canExecute: true, canApprovOwn: false, canDeploy: false, canAccessProd: false, requiresReview: true },
  { agent: 'Reverse Engineer', canExecute: false, canApprovOwn: false, canDeploy: false, canAccessProd: false, requiresReview: true },
]

// Scope boundaries
const SCOPE_ALLOWED = ['Code repositories', 'CI/CD pipelines', 'Test environments', 'Dev databases', 'Staging systems']
const SCOPE_DENIED = ['Production databases', 'IAM & identity systems', 'Financial systems', 'PII data stores', 'Customer payment data']

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
    padding: '10px 16px',
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: 500,
    textAlign: 'left',
    borderBottom: `1px solid ${THEME.border}`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const td: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 12,
    borderBottom: `1px solid ${THEME.border}`,
    color: '#c8cae0',
  }

  function timeAgo(ts: number | string): string {
    let seconds: number
    if (typeof ts === 'string') {
      seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    } else {
      seconds = Math.floor(Date.now() / 1000 - ts)
    }
    if (seconds < 0) seconds = 0
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // KPI calculations
  const totalBlocked = govStats?.total_blocked ?? 0
  const totalAllowed = govStats?.total_allowed ?? 0
  const totalEvents = totalBlocked + totalAllowed || 1
  const policyEnforcementRate = Math.round((totalBlocked / totalEvents) * 100)
  const activeAgents = AGENTS.length
  const changeTicketsLinked = CHANGE_RECORDS.length
  const mttd = 4.2 // minutes - simulated
  const auditCoverage = 98
  const complianceScore = 91

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px', background: THEME.bg }}>
      {/* ===== SECTION 1: HEADER ===== */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: THEME.text,
            marginBottom: 6,
          }}>
            CISO Command Center
          </div>
          <div style={{
            fontSize: 14,
            color: THEME.textSecondary,
            marginBottom: 16,
          }}>
            Enterprise Governance & Compliance Overview
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            width: 'fit-content',
          }}>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: THEME.success }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: THEME.success }}>
              All Systems Nominal
            </span>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 2: TOP KPI STRIP (6 cards) ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Policy Enforcement Rate', value: `${policyEnforcementRate}%`, icon: Shield, color: THEME.success },
            { label: 'Active Agent Identities', value: activeAgents, icon: Users, color: THEME.accent },
            { label: 'Change Tickets Linked', value: changeTicketsLinked, icon: FileText, color: THEME.info },
            { label: 'Mean Time to Detect', value: `${mttd}m`, icon: Clock, color: THEME.warning },
            { label: 'Audit Coverage', value: `${auditCoverage}%`, icon: TrendingUp, color: THEME.success },
            { label: 'Compliance Score', value: complianceScore, icon: CheckCircle2, color: THEME.accent },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={14} style={{ color: stat.color }} />
                  </div>
                  <span style={{ fontSize: 10, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: THEME.text }}>
                  {stat.value}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ===== SECTION 3: AGENT IDENTITY & ACCOUNTABILITY MATRIX ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Users size={14} style={{ color: THEME.accent }} />
            Agent Identity & Accountability Matrix
          </div>
          <div style={{
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden',
            background: THEME.card,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0e1a' }}>
                  {['Agent ID', 'Name', 'Role', 'Scope Boundary', 'Last Action', 'Actions Today', 'Approval Req.', 'SoD Status', 'Risk Level'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((agent, i) => (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.03 }}
                  >
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.accent }}>
                      {agent.id}
                    </td>
                    <td style={td}>{agent.name}</td>
                    <td style={{ ...td, fontSize: 11, color: THEME.textSecondary }}>{agent.role}</td>
                    <td style={{ ...td, fontSize: 11, color: THEME.textSecondary }}>{agent.scope}</td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a5e78' }}>
                      {timeAgo(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600))}
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.text }}>
                      {Math.floor(Math.random() * 15)}
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: THEME.success,
                      }}>
                        Yes
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: THEME.success,
                      }}>
                        Enforced
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: agent.riskLevel === 'high'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : agent.riskLevel === 'medium'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color: agent.riskLevel === 'high'
                          ? THEME.danger
                          : agent.riskLevel === 'medium'
                            ? THEME.warning
                            : THEME.success,
                      }}>
                        {agent.riskLevel.charAt(0).toUpperCase() + agent.riskLevel.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 4: POLICY ENFORCEMENT DASHBOARD ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Lock size={14} style={{ color: THEME.accent }} />
            Policy Enforcement Dashboard
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { name: 'Filesystem Access (Landlock)', status: 'ENFORCING', detail: 'Deny-All Default' },
              { name: 'Syscall Filtering (seccomp)', status: 'ENFORCING', detail: '312 syscalls blocked' },
              { name: 'Network Egress (netns)', status: 'ENFORCING', detail: 'Allowlist-only' },
              { name: 'Runtime Policy (OpenShell)', status: 'ENFORCING', detail: 'Agent sandbox active' },
            ].map((policy, i) => (
              <motion.div
                key={policy.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
                      {policy.name}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.textSecondary }}>
                      {policy.detail}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: THEME.success,
                  }}>
                    ✓ {policy.status}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: THEME.textMuted, marginBottom: 12 }}>
                  Verified {timeAgo(Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 600))}
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                  background: 'transparent',
                  color: THEME.accent,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  Test Policy
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 5: CHANGE MANAGEMENT & ITSM INTEGRATION ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FileText size={14} style={{ color: THEME.accent }} />
            Change Management & ITSM Integration
          </div>
          <div style={{
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden',
            background: THEME.card,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0e1a' }}>
                  {['Change ID', 'Agent', 'Action', 'ITSM Ticket', 'Approver', 'Status', 'Timestamp'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHANGE_RECORDS.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.03 }}
                  >
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.accent, fontWeight: 600 }}>
                      {record.id}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: THEME.textSecondary }}>{record.agent}</td>
                    <td style={td}>{record.action}</td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.info }}>
                      {record.ticket}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: THEME.text }}>{record.approver}</td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: record.status === 'Approved'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : record.status === 'Executed'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: record.status === 'Approved'
                          ? THEME.success
                          : record.status === 'Executed'
                            ? THEME.info
                            : THEME.warning,
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a5e78' }}>
                      {timeAgo(record.timestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 6: SEPARATION OF DUTIES MATRIX ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Key size={14} style={{ color: THEME.accent }} />
            Separation of Duties Matrix
          </div>
          <div style={{
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden',
            background: THEME.card,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0e1a' }}>
                  {['Agent', 'Can Execute', 'Can Approve Own', 'Can Deploy', 'Can Access Prod', 'Requires Human Review'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOD_MATRIX.map((row, i) => (
                  <tr key={row.agent} style={i % 2 === 1 ? { background: 'rgba(17, 18, 36, 0.5)' } : {}}>
                    <td style={{ ...td, fontWeight: 600, color: THEME.text }}>{row.agent}</td>
                    <td style={td}>
                      <span style={{ color: row.canExecute ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 14 }}>
                        {row.canExecute ? '✓' : '✕'}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ color: row.canApprovOwn ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 14 }}>
                        {row.canApprovOwn ? '✓' : '✕'}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ color: row.canDeploy ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 14 }}>
                        {row.canDeploy ? '✓' : '✕'}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ color: row.canAccessProd ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 14 }}>
                        {row.canAccessProd ? '✓' : '✕'}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ color: row.requiresReview ? THEME.success : THEME.danger, fontWeight: 700, fontSize: 14 }}>
                        {row.requiresReview ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 7: COMPLIANCE FRAMEWORK ALIGNMENT ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 size={14} style={{ color: THEME.accent }} />
            Compliance Framework Alignment
          </div>
          <div style={{
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden',
            background: THEME.card,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0e1a' }}>
                  {['Framework', 'Coverage', 'Evidence', 'Last Audit', 'Status'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE_FRAMEWORKS.map((fw, i) => (
                  <motion.tr
                    key={fw.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.03 }}
                  >
                    <td style={{ ...td, fontWeight: 600, color: THEME.text }}>{fw.name}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 4, width: 100, borderRadius: 2, background: THEME.border, overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fw.coverage}%` }}
                            transition={{ duration: 0.8, delay: 0.45 + i * 0.03 }}
                            style={{ height: '100%', background: THEME.success, borderRadius: 2 }}
                          />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.success, fontWeight: 600 }}>
                          {fw.coverage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: THEME.text }}>
                      {fw.evidence}
                    </td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: THEME.textMuted }}>
                      {fw.lastAudit}
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        background: fw.status === 'Aligned'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                        color: fw.status === 'Aligned' ? THEME.success : THEME.warning,
                      }}>
                        {fw.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 8: SIEM INTEGRATION STATUS ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Server size={14} style={{ color: THEME.accent }} />
            SIEM Integration Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {SIEM_TARGETS.map((siem, i) => (
              <motion.div
                key={siem.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, color: THEME.text, fontSize: 13 }}>{siem.name}</div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    background: siem.status === 'Connected'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: siem.status === 'Connected' ? THEME.success : THEME.danger,
                  }}>
                    {siem.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, marginBottom: 4 }}>Events/Hour</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: siem.color }}>
                      {siem.eventsPerHour.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, marginBottom: 4 }}>Last Sync</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: THEME.text }}>
                      {siem.lastSync}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 9: AGENT SCOPE BOUNDARIES ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12,
            color: THEME.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Globe size={14} style={{ color: THEME.accent }} />
            Agent Scope Boundaries
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Allowed */}
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: THEME.card,
              border: `1px solid rgba(16, 185, 129, 0.3)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.success,
                  fontWeight: 700,
                }}>
                  ✓
                </span>
                <span style={{ fontWeight: 600, color: THEME.success, fontSize: 13 }}>Allowed Access</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCOPE_ALLOWED.map(item => (
                  <div key={item} style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid rgba(16, 185, 129, 0.2)`,
                    fontSize: 12,
                    color: THEME.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ color: THEME.success, fontWeight: 700 }}>+</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Denied */}
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: THEME.card,
              border: `1px solid rgba(239, 68, 68, 0.3)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.danger,
                  fontWeight: 700,
                }}>
                  ✕
                </span>
                <span style={{ fontWeight: 600, color: THEME.danger, fontSize: 13 }}>Denied Access</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCOPE_DENIED.map(item => (
                  <div key={item} style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid rgba(239, 68, 68, 0.2)`,
                    fontSize: 12,
                    color: THEME.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ color: THEME.danger, fontWeight: 700 }}>−</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Spacer */}
      <div style={{ height: 20 }} />
    </div>
  )
}
