import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Mail, Lock, Eye, EyeOff, ChevronRight, Cpu, CheckCircle,
  GitPullRequest, ShieldCheck, FileSearch, BarChart3, Brain, Network, Code2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

type AuthTab = 'signin' | 'signup' | 'demo'

/* ── Left-panel feature pillars — each maps to a real page in the app ── */
const features = [
  {
    icon: Brain,
    title: 'NemoClaw Governance Agent',
    description:
      'AI-powered runtime intelligence — query audit trails, security posture, and DORA metrics through a conversational agent backed by 14 governance tools',
    page: '/ai',
  },
  {
    icon: ShieldCheck,
    title: 'Kernel-Level Security Isolation',
    description:
      '4-layer enforcement — Landlock filesystem, seccomp syscall filtering, network namespace egress control, and OpenShell policy engine with deny-all defaults',
    page: '/demo',
  },
  {
    icon: FileSearch,
    title: 'Immutable Audit Trail',
    description:
      'Every agent action logged with timestamp, isolation layer, and severity — persisted to append-only storage with SOC 2 compliance mapping and evidence export',
    page: '/audit',
  },
  {
    icon: BarChart3,
    title: 'Citation-Backed ROI Analytics',
    description:
      'Productivity projections grounded in McKinsey, DORA State of DevOps, Forrester TEI, and GitHub Copilot research — transparent formulas, not vanity metrics',
    page: '/demo',
  },
  {
    icon: GitPullRequest,
    title: 'Live DORA Metrics',
    description:
      'Real deployment frequency, lead time, MTTR, and change failure rate from connected GitHub repositories — 48 commits across 5 repos tracked in real time',
    page: '/integrations',
  },
  {
    icon: Code2,
    title: 'Governed SDLC Agents',
    description:
      '5 AI agents — Code Completion, Security Scan, Quality Review, Test Generation, and Reverse Engineering — all executing inside NemoClaw\'s isolation boundary with full audit trails',
    page: '/sdlc',
  },
]

/* ── Compliance badges ── */
const complianceBadges = [
  'SOC 2 Type II',
  'NIST AI RMF',
  'ISO 27001',
  'OWASP LLM Top 10',
  'DORA',
  'ITIL v4',
]

const DEMO_CREDENTIALS = {
  email: 'demo@aclvibe.dev',
  password: 'demo2024',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, signIn, signUp } = useAuth()
  const [tab, setTab] = useState<AuthTab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/demo', { replace: true })
  }, [user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    const { error: authError } = await signIn(email, password)
    setLoading(false)
    if (authError) {
      setError(authError)
    } else {
      navigate('/demo')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const { error: authError } = await signUp(email, password)
    setLoading(false)
    if (authError) {
      setError(authError)
    } else {
      setSignUpSuccess(true)
    }
  }

  const handleDemoAccess = async () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setTab('signin')
    setLoading(true)
    setError('')
    const { error: authError } = await signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
    setLoading(false)
    if (authError) {
      setError('Demo account not available. Please sign up or use your own credentials.')
    } else {
      navigate('/demo')
    }
  }

  const tabs: { key: AuthTab; label: string }[] = [
    { key: 'signin', label: 'Sign In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'demo', label: 'Demo Access' },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#0a0b14', color: '#e2e4f0',
    }}>
      {/* ───── Left Panel — Brand, Features & Compliance ───── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(165deg, #0d0e1a 0%, #111224 40%, #0a0b14 100%)',
        borderRight: '1px solid #1e2035',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #4f5eff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* Gradient orb */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,94,255,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #4f5eff, #7c6bff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(79,94,255,0.3)',
            }}>
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 28, color: '#e2e4f0', lineHeight: 1.1,
              }}>
                ACL Vibe
              </div>
              <div style={{
                fontSize: 12, color: '#8b8fa8', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginTop: 2,
              }}>
                Demo Platform
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 30, fontWeight: 400, lineHeight: 1.3,
            color: '#e2e4f0', marginBottom: 8, maxWidth: 460,
          }}>
            Enterprise AI Governance Platform
          </h1>
          <p style={{
            fontSize: 14, color: '#8b8fa8', lineHeight: 1.6,
            maxWidth: 460, marginBottom: 36,
          }}>
            Agent orchestration with kernel-level security isolation, ITIL change management, and immutable audit trails — built for regulated industries.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {features.map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(79,94,255,0.08)',
                    border: '1px solid rgba(79,94,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} style={{ color: '#4f5eff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0', marginBottom: 2 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7089', lineHeight: 1.55 }}>
                      {feat.description}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Compliance badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            style={{
              marginTop: 36, paddingTop: 24,
              borderTop: '1px solid #1e2035',
            }}
          >
            <div style={{ fontSize: 11, color: '#4d4f64', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Aligned Frameworks
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {complianceBadges.map(badge => (
                <span
                  key={badge}
                  style={{
                    padding: '5px 12px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                    background: 'rgba(79,94,255,0.06)',
                    border: '1px solid rgba(79,94,255,0.12)',
                    color: '#7b83b5',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ───── Right Panel — Auth Form ───── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 56px',
        background: '#0a0b14',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex', borderRadius: 12,
            background: '#111224', border: '1px solid #1e2035',
            padding: 4, marginBottom: 32,
          }}>
            {tabs.map(t => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === 'demo') {
                      handleDemoAccess()
                    } else {
                      setTab(t.key)
                      setError('')
                    }
                  }}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    border: 'none', outline: 'none',
                    background: isActive ? '#4f5eff' : 'transparent',
                    color: isActive ? '#fff' : '#8b8fa8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* OAuth */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <OAuthButton
                  icon={<GoogleIcon />}
                  label={tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                />
                <OAuthButton
                  icon={<MicrosoftIcon />}
                  label={tab === 'signup' ? 'Sign up with Microsoft' : 'Sign in with Microsoft'}
                />
                <button
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <Lock size={16} />
                  Enterprise SSO (Okta / SAML)
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: '#1e2035' }} />
                <span style={{ fontSize: 12, color: '#6b7089' }}>or continue with email</span>
                <div style={{ flex: 1, height: 1, background: '#1e2035' }} />
              </div>

              {/* Sign-up success message */}
              {signUpSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981', fontSize: 13,
                }}>
                  <CheckCircle size={16} />
                  <span>Account created! Check your email to confirm, then sign in.</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={tab === 'signup' ? handleSignUp : handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#8b8fa8', marginBottom: 6, display: 'block' }}>
                    Email
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#111224', border: '1px solid #1e2035',
                    borderRadius: 10, padding: '0 14px',
                  }}>
                    <Mail size={16} style={{ color: '#6b7089', flexShrink: 0 }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{
                        flex: 1, padding: '12px 0', border: 'none', outline: 'none',
                        background: 'transparent', color: '#e2e4f0', fontSize: 14,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#8b8fa8', marginBottom: 6, display: 'block' }}>
                    Password
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#111224', border: '1px solid #1e2035',
                    borderRadius: 10, padding: '0 14px',
                  }}>
                    <Lock size={16} style={{ color: '#6b7089', flexShrink: 0 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        flex: 1, padding: '12px 0', border: 'none', outline: 'none',
                        background: 'transparent', color: '#e2e4f0', fontSize: 14,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6b7089', display: 'flex', padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    fontSize: 13, color: '#ef4444', padding: '8px 12px',
                    background: 'rgba(239,68,68,0.08)', borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: 'none', cursor: loading ? 'wait' : 'pointer',
                    background: loading
                      ? 'rgba(79,94,255,0.5)'
                      : 'linear-gradient(135deg, #4f5eff, #6366f1)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(79,94,255,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Cpu size={16} />
                    </motion.div>
                  ) : (
                    <>
                      {tab === 'signup' ? 'Create Account' : 'Sign In'}
                      <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer link */}
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7089' }}>
                {tab === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setTab('signup')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#4f5eff', fontWeight: 600, fontSize: 13,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setTab('signin')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#4f5eff', fontWeight: 600, fontSize: 13,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Version footer */}
          <div style={{
            marginTop: 40, textAlign: 'center',
            fontSize: 12, color: '#3d3f52',
          }}>
            ACL Vibe v1.0.0 &middot; Prototype &middot; Enterprise AI Governance Platform
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── OAuth Button ── */
function OAuthButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 10,
        background: '#111224', border: '1px solid #1e2035',
        color: '#e2e4f0', fontSize: 14, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#2d2f48'
        e.currentTarget.style.background = '#151630'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1e2035'
        e.currentTarget.style.background = '#111224'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── SVG Icons ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
