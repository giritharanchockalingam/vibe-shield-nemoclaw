import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Zap, Shield, Brain, Code2, FileSearch, BarChart3, GitPullRequest,
  ChevronRight, ArrowRight, Lock, Cpu, Network, Terminal, Eye,
  CheckCircle2, Activity, Layers, Globe, Server, ShieldCheck,
  Play, ExternalLink, Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — Public marketing page for VibeShield
   ═══════════════════════════════════════════════════════════ */

// ── Animated counter hook ──
function useCounter(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(!startOnView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnView) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!started) return
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setCount(Math.floor(eased * end))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, end, duration])

  return { count, ref }
}

// ── Isolation layers for the architecture viz ──
const isolationLayers = [
  { name: 'Landlock', desc: 'Filesystem isolation', icon: Lock, color: '#f59e0b', detail: 'Confines writes to /sandbox/ and /tmp/' },
  { name: 'Seccomp', desc: 'Syscall filtering', icon: Shield, color: '#8b5cf6', detail: 'Blocks ptrace, mount, unshare, setns' },
  { name: 'NetNS', desc: 'Network namespacing', icon: Network, color: '#06b6d4', detail: 'Deny-all egress, allowlist only' },
  { name: 'OpenShell', desc: 'Policy engine', icon: Terminal, color: '#3b82f6', detail: 'Prompt injection detection & rate limiting' },
]

// ── Features ──
const features = [
  {
    icon: Brain, title: 'Governance Agent',
    desc: 'Conversational AI with 14 built-in tools — query audit trails, security posture, and DORA metrics in natural language.',
    color: '#8b5cf6',
  },
  {
    icon: Code2, title: 'SDLC Agents',
    desc: '5 governed agents: code completion, security scan, quality review, test generation, and reverse engineering.',
    color: '#6366f1',
  },
  {
    icon: FileSearch, title: 'Immutable Audit Trail',
    desc: 'Every action logged with isolation layer, severity, and SOC 2 compliance mapping. Export-ready for auditors.',
    color: '#06b6d4',
  },
  {
    icon: BarChart3, title: 'Citation-Backed ROI',
    desc: 'Productivity projections grounded in McKinsey, DORA, and Forrester research — transparent formulas, not vanity metrics.',
    color: '#22c55e',
  },
  {
    icon: GitPullRequest, title: 'Live DORA Metrics',
    desc: 'Real deployment frequency, lead time, MTTR, and change failure rate from your connected repositories.',
    color: '#f59e0b',
  },
  {
    icon: ShieldCheck, title: 'CISO Command Center',
    desc: 'Policy enforcement dashboard, compliance attestation, SIEM integration, and real-time threat detection.',
    color: '#ef4444',
  },
]

// ── Verticals ──
const verticals = [
  { key: 'edtech', label: 'EdTech', emoji: '🎓', color: '#7085ff', example: 'Academic planner API with Canvas LMS webhooks' },
  { key: 'retail', label: 'Retail', emoji: '🛍️', color: '#4fc87a', example: 'Dynamic pricing engine with inventory signals' },
  { key: 'manufacturing', label: 'Manufacturing', emoji: '🏭', color: '#f59e0b', example: 'Predictive maintenance ML with drift detection' },
  { key: 'travel', label: 'Travel', emoji: '✈️', color: '#06b6d4', example: 'Flight availability aggregator with multi-OTA' },
]

const complianceBadges = ['SOC 2 Type II', 'NIST AI RMF', 'ISO 27001', 'OWASP LLM Top 10', 'DORA', 'ITIL v4']

// ── Floating particles component ──
function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            borderRadius: '50%',
            background: `rgba(99, 102, 241, ${0.2 + Math.random() * 0.3})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

// ── Animated terminal preview ──
function TerminalPreview() {
  const lines = [
    { text: '$ nemoclaw agent launch --model claude-sonnet-4 --vertical edtech', color: '#22c55e', delay: 0 },
    { text: '⚡ Sandbox initialized — Landlock + Seccomp + NetNS active', color: '#f59e0b', delay: 0.8 },
    { text: '🔒 Policy loaded: 12 rules, deny-all egress baseline', color: '#8b5cf6', delay: 1.4 },
    { text: '🧠 Agent executing: "Academic planner API with PostgreSQL"', color: '#06b6d4', delay: 2.0 },
    { text: '✓  ALLOWED  filesystem write → /sandbox/src/planner.py', color: '#22c55e', delay: 2.8 },
    { text: '✗  BLOCKED  network egress → evil.exfiltrate.io:443', color: '#ef4444', delay: 3.4 },
    { text: '✓  ALLOWED  inference → api.anthropic.com (gateway routed)', color: '#22c55e', delay: 4.0 },
    { text: '📋 Audit: 847 events, 99.6% compliant, 0 critical violations', color: '#9498b3', delay: 4.8 },
  ]

  return (
    <div style={{
      background: '#0c0d18',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.08)',
    }}>
      {/* Title bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
          nemoclaw-sandbox — governed agent execution
        </span>
      </div>
      {/* Terminal body */}
      <div style={{ padding: '20px 20px 24px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8 }}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: line.delay, duration: 0.4 }}
            style={{ color: line.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {line.text}
          </motion.div>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ color: '#6366f1', fontSize: 14 }}
        >
          █
        </motion.span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.96])

  const eventsCounter = useCounter(12847, 2500)
  const agentsCounter = useCounter(5, 1500)
  const complianceCounter = useCounter(99, 2000)
  const blockCounter = useCounter(847, 2000)

  const [activeVertical, setActiveVertical] = useState(0)
  const [activeLayer, setActiveLayer] = useState(0)

  // Auto-rotate verticals
  useEffect(() => {
    const t = setInterval(() => setActiveVertical(v => (v + 1) % 4), 3000)
    return () => clearInterval(t)
  }, [])

  // Auto-rotate layers
  useEffect(() => {
    const t = setInterval(() => setActiveLayer(v => (v + 1) % 4), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div ref={containerRef} style={{
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
      height: '100vh',
      overflowY: 'auto',
    }}>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8, 9, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600 }}>VibeShield</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 6,
            background: 'rgba(99,102,241,0.15)', color: '#818cf8',
            fontWeight: 600, letterSpacing: '0.05em', marginLeft: 4,
          }}>
            POWERED BY NEMOCLAW
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(user ? '/demo' : '/login')}
            style={{
              padding: '8px 20px', borderRadius: 10,
              background: 'var(--accent-gradient)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 16px rgba(99,102,241,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(99,102,241,0.3)' }}
          >
            {user ? 'Open Console' : 'Get Started'} <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale, position: 'relative', padding: '80px 24px 60px', textAlign: 'center', overflow: 'hidden' }}>
        <FloatingParticles />
        {/* Radial gradient backdrop */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px 6px 8px', borderRadius: 100,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              marginBottom: 28, fontSize: 13, color: '#818cf8', fontWeight: 500,
            }}
          >
            <Sparkles size={14} />
            NVIDIA NemoClaw Agentic Runtime
          </motion.div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f0f1f7 30%, #818cf8 70%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Vibe Code Fearlessly.<br />We Guard the Gates.
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 640,
            margin: '0 auto 36px',
          }}>
            Enterprise AI agents for your entire SDLC — governed by kernel-level isolation,
            immutable audit trails, and real-time compliance mapping. Built on NemoClaw.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(user ? '/demo' : '/login')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'var(--accent-gradient)',
                border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
              }}
            >
              <Play size={18} /> Launch Demo Console
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                fontSize: 16, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Eye size={18} /> Explore Architecture
            </motion.button>
          </div>

          {/* Terminal Preview */}
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <TerminalPreview />
          </div>
        </motion.div>
      </motion.section>

      {/* ═══ LIVE STATS BAR ═══ */}
      <section style={{
        padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24,
          textAlign: 'center',
        }}>
          {[
            { label: 'Governance Events', value: eventsCounter.count, suffix: '+', ref: eventsCounter.ref, color: '#6366f1' },
            { label: 'SDLC Agents', value: agentsCounter.count, suffix: '', ref: agentsCounter.ref, color: '#8b5cf6' },
            { label: 'Threats Blocked', value: blockCounter.count, suffix: '', ref: blockCounter.ref, color: '#ef4444' },
            { label: 'Compliance Score', value: complianceCounter.count, suffix: '%', ref: complianceCounter.ref, color: '#22c55e' },
          ].map((stat, i) => (
            <div key={i} ref={stat.ref}>
              <div style={{
                fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: stat.color, lineHeight: 1,
              }}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 52 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 400, marginBottom: 12,
          }}>
            Everything You Need to Govern AI Agents
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            From code generation to compliance reporting — every capability governed by NemoClaw's
            kernel-level isolation and immutable audit trails.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{
                  padding: 28,
                  borderRadius: 16,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'default',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${feat.color}33`
                  e.currentTarget.style.boxShadow = `0 8px 32px ${feat.color}10`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${feat.color}12`,
                  border: `1px solid ${feat.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={20} style={{ color: feat.color }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feat.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═══ ARCHITECTURE / ISOLATION SECTION ═══ */}
      <section id="architecture" style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(99,102,241,0.03) 50%, var(--bg-primary) 100%)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3.5vw, 40px)',
              fontWeight: 400, marginBottom: 12,
            }}>
              4-Layer Kernel Isolation
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
              Not application-level wrappers. Not monitoring sidecars. Real kernel-enforced
              isolation that agents cannot bypass — even with root intent.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {isolationLayers.map((layer, i) => {
              const Icon = layer.icon
              const isActive = activeLayer === i
              return (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setActiveLayer(i)}
                  style={{
                    padding: 24,
                    borderRadius: 14,
                    background: isActive ? `${layer.color}08` : 'var(--bg-surface)',
                    border: `1px solid ${isActive ? `${layer.color}30` : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="layer-glow"
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, transparent, ${layer.color}, transparent)`,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${layer.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <Icon size={18} style={{ color: layer.color }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: isActive ? layer.color : 'var(--text-primary)' }}>
                    {layer.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{layer.desc}</p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}
                      >
                        {layer.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ VERTICALS SHOWCASE ═══ */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 44 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3.5vw, 40px)',
            fontWeight: 400, marginBottom: 12,
          }}>
            Built for Every Vertical
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            20 real-world scenarios across 4 industries — each governed by NemoClaw.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {verticals.map((v, i) => {
            const isActive = activeVertical === i
            return (
              <motion.div
                key={v.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setActiveVertical(i)}
                style={{
                  padding: 24,
                  borderRadius: 14,
                  background: isActive ? `${v.color}08` : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? `${v.color}35` : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{v.emoji}</div>
                <h3 style={{
                  fontSize: 18, fontWeight: 600, marginBottom: 6,
                  color: isActive ? v.color : 'var(--text-primary)',
                }}>
                  {v.label}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{v.example}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ═══ COMPLIANCE / TRUST ═══ */}
      <section style={{
        padding: '60px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 24,
            fontWeight: 400, marginBottom: 20,
          }}>
            Aligned with Industry Frameworks
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {complianceBadges.map(badge => (
              <motion.span
                key={badge}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.12)',
                  color: 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
                }}
              >
                {badge}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, marginBottom: 16,
          }}>
            Ready to Govern Your AI Agents?
          </h2>
          <p style={{
            fontSize: 17, color: 'var(--text-secondary)',
            maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6,
          }}>
            Experience enterprise-grade agent security with a live demo — 20 scenarios,
            4 verticals, full audit trail.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(user ? '/demo' : '/login')}
            style={{
              padding: '16px 40px', borderRadius: 14,
              background: 'var(--accent-gradient)',
              border: 'none', color: '#fff', fontSize: 17, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 6px 32px rgba(99,102,241,0.35)',
            }}
          >
            Launch the Console <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={12} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>VibeShield</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Secure AI-Powered SDLC &middot; Powered by NemoClaw &middot; Built by ACL Digital
        </p>
      </footer>
    </div>
  )
}
