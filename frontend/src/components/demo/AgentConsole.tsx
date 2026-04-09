import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'
import {
  Copy, RotateCcw, Play, Square, Terminal, Clock, Zap, Hash,
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Lock, Globe, FileText, Activity, Wrench, ChevronRight
} from 'lucide-react'
import { useDemoStore } from '@/store/demoStore'
import { startDemoSession, streamSession } from '@/lib/api'
import { VERTICALS } from '@/types'
import type { StreamChunk, Vertical } from '@/types'
import { SCENARIO_GOVERNANCE } from '@/data/governanceEvents'
import type { GovernanceInterception, VerificationCheck } from '@/data/governanceEvents'
import { useSessionMetrics } from '@/store/sessionMetrics'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Execution phases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type ExecutionPhase = 'idle' | 'streaming' | 'interception' | 'resuming' | 'verifying' | 'complete'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Parse output into text + code blocks (handles unclosed blocks during streaming)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function parseOutput(text: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
  const blocks: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
  const re = /```(\w*)\n([\s\S]*?)(?:```|$)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const t = text.slice(last, m.index).trim()
      if (t) blocks.push({ type: 'text', content: t })
    }
    const code = m[2].trim()
    if (code) blocks.push({ type: 'code', content: code, language: m[1] || 'python' })
    last = m.index + m[0].length
  }
  const remaining = text.slice(last).trim()
  if (remaining) blocks.push({ type: 'text', content: remaining })
  return blocks
}

/** Render markdown text with headers, bold, lists */
function renderTextBlock(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: '#e2e4f0', margin: '16px 0 8px' }}>{line.slice(4)}</h4>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: '#e2e4f0', margin: '20px 0 10px' }}>{line.slice(3)}</h3>
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0', margin: '24px 0 12px' }}>{line.slice(2)}</h2>
    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g)
      return <p key={i} style={{ color: '#c8cae0', lineHeight: 1.7, margin: '4px 0' }}>
        {parts.map((part, j) => part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} style={{ color: '#e2e4f0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
          : part
        )}
      </p>
    }
    if (line.startsWith('- ') || line.startsWith('* '))
      return <div key={i} style={{ color: '#c8cae0', lineHeight: 1.7, paddingLeft: 16, margin: '2px 0', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 4, color: '#4f5eff' }}>•</span>{line.slice(2)}
      </div>
    const numMatch = line.match(/^(\d+)\.\s/)
    if (numMatch)
      return <div key={i} style={{ color: '#c8cae0', lineHeight: 1.7, paddingLeft: 24, margin: '2px 0', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, color: '#4f5eff', fontWeight: 600, fontSize: 13 }}>{numMatch[1]}.</span>
        {line.slice(numMatch[0].length)}
      </div>
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />
    return <p key={i} style={{ color: '#c8cae0', lineHeight: 1.7, margin: '4px 0' }}>{line}</p>
  })
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 0' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f5eff' }}
        />
      ))}
      <span style={{ color: '#8b8fa8', fontSize: 13, marginLeft: 8 }}>Agent thinking...</span>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Governance Interception Alert — the "threat → catch" moment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function InterceptionAlert({
  interception,
  onContinue,
}: {
  interception: GovernanceInterception
  onContinue: () => void
}) {
  const layerLabels: Record<string, string> = {
    landlock: 'Landlock FS Isolation',
    seccomp: 'Seccomp Syscall Filter',
    netns: 'Network Namespace',
    openshell: 'OpenShell Policy',
  }
  const layerIcons: Record<string, React.ReactNode> = {
    landlock: <Lock size={14} />,
    seccomp: <Shield size={14} />,
    netns: <Globe size={14} />,
    openshell: <Terminal size={14} />,
  }
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
  }
  const sevColor = severityColors[interception.severity] || '#f59e0b'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        margin: '16px 0',
        borderRadius: 12,
        border: `1px solid ${sevColor}40`,
        background: `linear-gradient(135deg, ${sevColor}08, ${sevColor}04)`,
        overflow: 'hidden',
      }}
    >
      {/* Red header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        background: `${sevColor}12`, borderBottom: `1px solid ${sevColor}20`,
      }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: 2 }}
        >
          <ShieldAlert size={16} style={{ color: sevColor }} />
        </motion.div>
        <span style={{ fontSize: 11, fontWeight: 700, color: sevColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          THREAT INTERCEPTED
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: `${sevColor}20`, color: sevColor, marginLeft: 'auto',
          textTransform: 'uppercase',
        }}>
          {interception.severity}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {/* What was attempted */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#8b8fa8', marginBottom: 4, fontWeight: 600 }}>ATTEMPTED ACTION</div>
          <div style={{
            fontSize: 13, color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace",
            padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.12)',
          }}>
            {interception.attempted_action}
          </div>
        </div>

        {/* Blocked by */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#8b8fa8', marginBottom: 4, fontWeight: 600 }}>BLOCKED BY</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
              color: '#818cf8', padding: '6px 10px', borderRadius: 6,
              background: 'rgba(79,94,255,0.08)', border: '1px solid rgba(79,94,255,0.15)',
            }}>
              {layerIcons[interception.blocked_by]}
              {layerLabels[interception.blocked_by]}
            </div>
          </div>
        </div>

        {/* Risk explanation */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#8b8fa8', marginBottom: 4, fontWeight: 600 }}>BUSINESS RISK</div>
          <div style={{ fontSize: 13, color: '#c8cae0', lineHeight: 1.6 }}>
            {interception.risk_description}
          </div>
        </div>

        {/* Compliance context */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f59e0b',
          padding: '6px 10px', borderRadius: 6,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
        }}>
          <AlertTriangle size={12} />
          {interception.vertical_context}
        </div>
      </div>

      {/* Continue button */}
      <div style={{ padding: '0 16px 14px' }}>
        <button
          onClick={onContinue}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)',
            background: 'rgba(74,222,128,0.08)', color: '#4ade80',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <ShieldCheck size={14} />
          Threat Blocked — Continue Governed Execution
        </button>
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Verification Panel — the "accuracy" moment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function VerificationPanel({
  checks,
  verticalColor,
}: {
  checks: VerificationCheck[]
  verticalColor: string
}) {
  const passed = checks.filter(c => c.status === 'pass').length
  const remediated = checks.filter(c => c.status === 'remediated').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        margin: '20px 0',
        borderRadius: 12,
        border: '1px solid rgba(74,222,128,0.2)',
        background: 'linear-gradient(135deg, rgba(74,222,128,0.04), rgba(74,222,128,0.01))',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'rgba(74,222,128,0.06)',
        borderBottom: '1px solid rgba(74,222,128,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={14} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Output Verified
          </span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#4ade80',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {passed + remediated}/{checks.length} checks passed
          {remediated > 0 && <span style={{ color: '#f59e0b' }}> · {remediated} auto-remediated</span>}
        </div>
      </div>

      {/* Checks */}
      <div style={{ padding: '8px 0' }}>
        {checks.map((check, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 16px',
              borderBottom: i < checks.length - 1 ? '1px solid #1e203540' : 'none',
            }}
          >
            {/* Icon */}
            <div style={{ paddingTop: 2, flexShrink: 0 }}>
              {check.status === 'pass' ? (
                <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
              ) : (
                <Wrench size={14} style={{ color: '#f59e0b' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e4f0' }}>{check.check_name}</span>
                {check.compliance_ref && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                    background: `${verticalColor}15`, color: verticalColor,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {check.compliance_ref}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8b8fa8', lineHeight: 1.5 }}>{check.detail}</div>
              {check.remediation && (
                <div style={{
                  marginTop: 4, fontSize: 11, color: '#f59e0b', padding: '4px 8px',
                  borderRadius: 4, background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ↳ {check.remediation}
                </div>
              )}
            </div>

            {/* Status badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, flexShrink: 0,
              background: check.status === 'pass' ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
              color: check.status === 'pass' ? '#4ade80' : '#f59e0b',
              textTransform: 'uppercase',
            }}>
              {check.status === 'pass' ? 'PASS' : 'FIXED'}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Impact Summary — the "what could have gone wrong" moment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ImpactSummary({
  interception,
  checksCount,
  remediatedCount,
  impactText,
}: {
  interception: GovernanceInterception
  checksCount: number
  remediatedCount: number
  impactText: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        margin: '16px 0',
        borderRadius: 12,
        border: '1px solid rgba(99,102,241,0.2)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <Shield size={14} style={{ color: '#818cf8' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Session Governance Summary
        </span>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{
            flex: 1, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>1</div>
            <div style={{ fontSize: 10, color: '#8b8fa8', fontWeight: 600 }}>THREAT BLOCKED</div>
          </div>
          <div style={{
            flex: 1, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>{checksCount}</div>
            <div style={{ fontSize: 10, color: '#8b8fa8', fontWeight: 600 }}>CHECKS PASSED</div>
          </div>
          <div style={{
            flex: 1, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{remediatedCount}</div>
            <div style={{ fontSize: 10, color: '#8b8fa8', fontWeight: 600 }}>AUTO-FIXED</div>
          </div>
        </div>

        {/* Counterfactual */}
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={12} />
            WITHOUT NEMOCLAW
          </div>
          <div style={{ fontSize: 13, color: '#c8cae0', lineHeight: 1.6 }}>
            {impactText}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Agent Console
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AgentConsole() {
  const { selectedPrompt, selectedVertical, streamBuffer, isStreaming, appendStream, resetStream, setStreaming } = useDemoStore()
  const { addThreat, addChecks, addRemediation, addScenario } = useSessionMetrics()
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<ExecutionPhase>('idle')
  const [activeInterception, setActiveInterception] = useState<GovernanceInterception | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [showImpact, setShowImpact] = useState(false)
  const [verificationChecks, setVerificationChecks] = useState<VerificationCheck[]>([])
  const [impactText, setImpactText] = useState('')

  // Governance trail
  const [govTrailSteps, setGovTrailSteps] = useState<Array<{ name: string; status: 'pending' | 'processing' | 'completed' | 'blocked'; details?: string; icon: string; layers?: string[]; isInterception?: boolean }>>([])
  const [govScore, setGovScore] = useState<number | null>(null)

  const outputRef = useRef<HTMLDivElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenCountRef = useRef(0)
  const interceptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const verticalColor = VERTICALS[selectedVertical as Vertical]?.color || '#4f5eff'

  // Get governance data for current scenario
  const scenarioGov = selectedPrompt ? SCENARIO_GOVERNANCE[selectedPrompt.id] : null

  useEffect(() => {
    if (outputRef.current && (phase === 'streaming' || phase === 'resuming'))
      outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [streamBuffer, phase])

  // Sync token count
  useEffect(() => {
    if (phase === 'streaming' || phase === 'resuming') {
      const sync = setInterval(() => setTokenCount(tokenCountRef.current), 250)
      return () => clearInterval(sync)
    }
  }, [phase])

  // Elapsed timer
  useEffect(() => {
    if ((phase === 'streaming' || phase === 'resuming') && startTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, startTime])

  const tokensPerSecond = elapsed > 0 ? Math.round((tokenCount / elapsed) * 1000) : 0

  // ── Governance trail with interception step ──
  const runGovernanceTrail = useCallback(async (hasInterception: boolean, interception?: GovernanceInterception) => {
    const steps: Array<{ name: string; status: 'pending' | 'processing' | 'completed' | 'blocked'; details?: string; icon: string; layers?: string[]; isInterception?: boolean }> = [
      { name: 'Identity Verified', details: 'Agent AGT-CC-001 authenticated via Supabase Auth', icon: 'shield', status: 'pending' },
      { name: 'Policy Evaluation', details: 'NemoClaw policy engine — 12 rules active', icon: 'lock', status: 'pending' },
      { name: 'Isolation Activated', details: 'Kernel-level sandbox enforced', icon: 'layers', layers: ['netns', 'seccomp', 'landlock'], status: 'pending' },
    ]
    if (hasInterception && interception) {
      steps.push({
        name: 'Threat Intercepted',
        details: `${interception.attempted_action}`,
        icon: 'alert',
        status: 'pending',
        isInterception: true,
      })
    }
    steps.push(
      { name: 'Audit Logged', details: 'All events persisted to immutable audit trail', icon: 'file', status: 'pending' },
      { name: 'Output Verified', details: 'Response scanned for vulnerabilities and credential leaks', icon: 'activity', status: 'pending' },
    )

    setGovTrailSteps(steps)
    setGovScore(null)

    // Animate steps 0-2 (pre-interception)
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 350 + Math.random() * 200))
      setGovTrailSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'processing' } : s))
      await new Promise(r => setTimeout(r, 250 + Math.random() * 150))
      setGovTrailSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'completed' } : s))
    }
  }, [])

  // Continue governance trail after interception
  const continueGovernanceTrail = useCallback(async () => {
    const interceptionIdx = govTrailSteps.findIndex(s => s.isInterception)
    if (interceptionIdx >= 0) {
      // Mark interception as blocked (red)
      setGovTrailSteps(prev => prev.map((s, j) => j === interceptionIdx ? { ...s, status: 'blocked' } : s))
      await new Promise(r => setTimeout(r, 400))
    }
    // Continue remaining steps
    const startIdx = interceptionIdx >= 0 ? interceptionIdx + 1 : 3
    for (let i = startIdx; i < govTrailSteps.length; i++) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200))
      setGovTrailSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'processing' } : s))
      await new Promise(r => setTimeout(r, 250 + Math.random() * 150))
      setGovTrailSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'completed' } : s))
    }
    setGovScore(97.4)
  }, [govTrailSteps])

  // ── Interception trigger ──
  const scheduleInterception = useCallback(() => {
    if (!scenarioGov) return
    const ms = scenarioGov.interception.trigger_after_ms
    interceptionTimerRef.current = setTimeout(() => {
      setPhase('interception')
      setActiveInterception(scenarioGov.interception)
    }, ms)
  }, [scenarioGov])

  const handleInterceptionContinue = useCallback(() => {
    setActiveInterception(null)
    setPhase('resuming')
    continueGovernanceTrail()
  }, [continueGovernanceTrail])

  // ── After streaming completes: show verification then impact ──
  const showPostExecutionPanels = useCallback(async () => {
    if (!scenarioGov) { setPhase('complete'); return }
    setPhase('verifying')
    await new Promise(r => setTimeout(r, 600))
    setVerificationChecks(scenarioGov.verification)
    setShowVerification(true)
    // Update session metrics
    addThreat()
    addChecks(scenarioGov.verification.length)
    addRemediation(scenarioGov.verification.filter(c => c.status === 'remediated').length)
    addScenario()
    await new Promise(r => setTimeout(r, 1200))
    setImpactText(scenarioGov.impact_summary)
    setShowImpact(true)
    setPhase('complete')
  }, [scenarioGov, addThreat, addChecks, addRemediation, addScenario])

  // ── Main run handler ──
  const handleRun = useCallback(async () => {
    if (!selectedPrompt || isStreaming) return
    setError(null); resetStream(); setStreaming(true); setPhase('streaming')
    setActiveInterception(null); setShowVerification(false); setShowImpact(false)
    setVerificationChecks([]); setImpactText('')
    setGovTrailSteps([]); setGovScore(null)
    tokenCountRef.current = 0; setTokenCount(0); setStartTime(Date.now()); setElapsed(0)

    // Start governance trail + schedule interception
    runGovernanceTrail(!!scenarioGov, scenarioGov?.interception)
    scheduleInterception()

    try {
      const { session_id } = await startDemoSession({
        vertical: selectedVertical,
        agent_type: selectedPrompt.agent_type,
        prompt: selectedPrompt.prompt,
      })
      stopRef.current = streamSession(
        session_id,
        (c: StreamChunk) => {
          if (c.type === 'token') {
            tokenCountRef.current += 1
            appendStream(c.content)
          }
        },
        () => {
          setTokenCount(tokenCountRef.current)
          setStreaming(false)
          if (timerRef.current) clearInterval(timerRef.current)
          showPostExecutionPanels()
        },
        (e) => {
          setTokenCount(tokenCountRef.current)
          setError(e.message)
          setStreaming(false)
          setPhase('complete')
          if (timerRef.current) clearInterval(timerRef.current)
        },
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setStreaming(false)
      setPhase('complete')
    }
  }, [selectedPrompt, selectedVertical, isStreaming, appendStream, resetStream, setStreaming, runGovernanceTrail, scheduleInterception, showPostExecutionPanels, scenarioGov])

  const handleStop = () => {
    stopRef.current?.()
    setStreaming(false)
    setPhase('complete')
    if (timerRef.current) clearInterval(timerRef.current)
    if (interceptionTimerRef.current) clearTimeout(interceptionTimerRef.current)
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(streamBuffer)
    toast.success('Output copied to clipboard')
  }, [streamBuffer])

  const handleReset = useCallback(() => {
    resetStream(); tokenCountRef.current = 0; setTokenCount(0); setElapsed(0); setStartTime(null)
    setError(null); setPhase('idle'); setActiveInterception(null)
    setShowVerification(false); setShowImpact(false); setGovTrailSteps([]); setGovScore(null)
  }, [resetStream])

  const blocks = useMemo(() => parseOutput(streamBuffer), [streamBuffer])
  const formatTime = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  // ── Render ──
  return (
    <div style={{ height: '100%', display: 'flex', background: '#0a0b14' }}>
      {/* ── Main output panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid #1e2035', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #1e2035', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0, background: '#0d0e1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={14} style={{ color: verticalColor }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0' }}>Agent Console</span>
            {phase === 'streaming' && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: 11, color: verticalColor, background: `${verticalColor}15`, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                STREAMING
              </motion.div>
            )}
            {phase === 'interception' && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity }}
                style={{ fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                THREAT DETECTED
              </motion.div>
            )}
            {phase === 'verifying' && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}
                style={{ fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                VERIFYING OUTPUT
              </motion.div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {streamBuffer && phase === 'complete' && (
              <>
                <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #1e2035', background: 'transparent', color: '#8b8fa8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  <Copy size={12} /> Copy
                </button>
                <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #1e2035', background: 'transparent', color: '#8b8fa8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  <RotateCcw size={12} /> Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status bar */}
        {phase !== 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #1e2035', background: '#0d0e1a', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
              <Hash size={12} />
              <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{tokenCount.toLocaleString()}</span>
              <span>tokens</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
              <Clock size={12} />
              <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(elapsed)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
              <Zap size={12} />
              <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{tokensPerSecond}</span>
              <span>tok/s</span>
            </div>
          </div>
        )}

        {/* Output area */}
        <div ref={outputRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontSize: 14 }}>
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '16px 20px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#ef4444', fontSize: 14 }}>Stream Error</div>
                <div style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.6 }}>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {phase === 'idle' && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.6 }}>
              <Terminal size={40} style={{ color: '#1e2035' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: '#8b8fa8', marginBottom: 4 }}>Select a scenario & run</div>
                <div style={{ fontSize: 13, color: '#5a5e78' }}>Watch the AI agent work — and watch NemoClaw govern it</div>
              </div>
            </div>
          )}

          {/* Thinking dots */}
          {(phase === 'streaming' || phase === 'resuming') && !streamBuffer && <ThinkingDots />}

          {/* Rendered output */}
          {blocks.map((block, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              {block.type === 'code' ? (
                <div style={{ margin: '12px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid #1e2035' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#0d0e1a', borderBottom: '1px solid #1e2035' }}>
                    <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: verticalColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.language}</span>
                    <button onClick={() => { navigator.clipboard.writeText(block.content); toast.success('Code copied') }}
                      style={{ background: 'transparent', border: 'none', color: '#8b8fa8', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Copy size={10} /> Copy
                    </button>
                  </div>
                  <SyntaxHighlighter language={block.language || 'text'} style={oneDark}
                    customStyle={{ margin: 0, padding: '16px', background: '#0a0b14', fontSize: 13, lineHeight: 1.6 }}
                    showLineNumbers lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#2a2d4a', fontSize: 12 }}>
                    {block.content}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div>{renderTextBlock(block.content)}</div>
              )}
            </motion.div>
          ))}

          {/* Blinking cursor */}
          {(phase === 'streaming' || phase === 'resuming') && streamBuffer && (
            <span className="cursor-blink" style={{ display: 'inline-block', width: 8, height: 18, background: verticalColor, marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1 }} />
          )}

          {/* ── INTERCEPTION ALERT ── */}
          <AnimatePresence>
            {phase === 'interception' && activeInterception && (
              <InterceptionAlert
                interception={activeInterception}
                onContinue={handleInterceptionContinue}
              />
            )}
          </AnimatePresence>

          {/* ── VERIFICATION PANEL ── */}
          <AnimatePresence>
            {showVerification && verificationChecks.length > 0 && (
              <VerificationPanel checks={verificationChecks} verticalColor={verticalColor} />
            )}
          </AnimatePresence>

          {/* ── IMPACT SUMMARY ── */}
          <AnimatePresence>
            {showImpact && activeInterception === null && scenarioGov && (
              <ImpactSummary
                interception={scenarioGov.interception}
                checksCount={verificationChecks.length}
                remediatedCount={verificationChecks.filter(c => c.status === 'remediated').length}
                impactText={impactText}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Run button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2035', background: '#0d0e1a' }}>
          {phase === 'streaming' || phase === 'resuming' || phase === 'interception' ? (
            <button onClick={handleStop} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}>
              <Square size={14} /> Stop
            </button>
          ) : (
            <button onClick={handleRun} disabled={!selectedPrompt || phase === 'verifying'}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 8, border: 'none',
                background: selectedPrompt ? `linear-gradient(135deg, ${verticalColor}, #4f5eff)` : '#1e2035',
                color: selectedPrompt ? '#fff' : '#5a5e78',
                fontSize: 14, fontWeight: 600, cursor: selectedPrompt ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', system-ui",
                boxShadow: selectedPrompt ? `0 4px 20px ${verticalColor}30` : 'none',
                transition: 'all 0.2s ease',
              }}>
              <Play size={16} /> Run Demo
            </button>
          )}
        </div>
      </div>

      {/* ── Governance Trail Sidebar ── */}
      <div style={{
        width: 280, flexShrink: 0, borderLeft: '1px solid #1e2035',
        background: '#0d0e1a', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} style={{ color: '#4f5eff' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Governance Trail</span>
          </div>
          {govScore !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)',
                borderRadius: 6, padding: '3px 8px',
              }}>
              <CheckCircle2 size={10} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>{govScore}%</span>
            </motion.div>
          )}
        </div>

        {/* Trail steps */}
        <div style={{ padding: '12px 16px', flex: 1 }}>
          {govTrailSteps.length === 0 && (
            <div style={{ fontSize: 12, color: '#5a5e78', textAlign: 'center', padding: 24 }}>
              Run a scenario to see the governance trail
            </div>
          )}
          {govTrailSteps.map((step, i) => {
            const iconMap: Record<string, React.ReactNode> = {
              shield: <Shield size={12} />,
              lock: <Lock size={12} />,
              layers: <Shield size={12} />,
              globe: <Globe size={12} />,
              file: <FileText size={12} />,
              activity: <Activity size={12} />,
              alert: <ShieldAlert size={12} />,
            }
            const statusColor = step.status === 'completed' ? '#4ade80'
              : step.status === 'blocked' ? '#ef4444'
              : step.status === 'processing' ? '#f59e0b' : '#2a2d4a'
            const statusLabel = step.status === 'blocked' ? 'BLOCKED' : step.status === 'completed' ? 'PASS' : step.status === 'processing' ? 'CHECKING' : ''

            return (
              <motion.div key={step.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
                {i < govTrailSteps.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 11, top: 22, width: 1, height: 'calc(100% - 4px)',
                    background: step.status === 'completed' ? 'rgba(74,222,128,0.25)'
                      : step.status === 'blocked' ? 'rgba(239,68,68,0.25)' : '#1e2035',
                    transition: 'background 0.3s ease',
                  }} />
                )}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: step.status === 'completed' ? 'rgba(74,222,128,0.12)'
                    : step.status === 'blocked' ? 'rgba(239,68,68,0.12)'
                    : step.status === 'processing' ? 'rgba(245,158,11,0.12)' : '#12131f',
                  border: `1.5px solid ${statusColor}`, color: statusColor, transition: 'all 0.3s ease',
                }}>
                  {step.status === 'completed' ? <CheckCircle2 size={11} />
                    : step.status === 'blocked' ? <XCircle size={11} />
                    : step.status === 'processing' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        {iconMap[step.icon]}
                      </motion.div>
                    ) : iconMap[step.icon]}
                </div>
                <div style={{ padding: '2px 0 12px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: step.status === 'completed' ? '#e2e4f0'
                        : step.status === 'blocked' ? '#ef4444'
                        : step.status === 'processing' ? '#f59e0b' : '#5a5e78',
                      transition: 'color 0.3s ease',
                    }}>{step.name}</span>
                    {statusLabel && (
                      <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                          fontSize: 9, fontWeight: 700,
                          color: step.status === 'blocked' ? '#ef4444' : step.status === 'processing' ? '#f59e0b' : '#4ade80',
                        }}>
                        {statusLabel}
                      </motion.span>
                    )}
                  </div>
                  {step.details && step.status !== 'pending' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ fontSize: 10, color: '#5a5e78', marginTop: 1, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-word' }}>
                      {step.details}
                    </motion.div>
                  )}
                  {step.layers && step.status === 'completed' && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {step.layers.map((l: string) => (
                        <span key={l} style={{
                          fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                          background: 'rgba(79,94,255,0.1)', border: '1px solid rgba(79,94,255,0.2)', color: '#818cf8',
                          fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                        }}>{l}</span>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
