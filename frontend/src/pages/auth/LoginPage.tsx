import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Mail, Lock, Eye, EyeOff, ChevronRight, Cpu, CheckCircle,
  GitPullRequest, ShieldCheck, FileSearch, BarChart3, Brain, Network, Code2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useResponsive } from '@/hooks/useMediaQuery'

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
  const { isMobile, isTablet, isDesktop } = useResponsive()
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
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
      background: 'var(--bg-primary, #08090f)',
      color: 'var(--text-primary, #f0f1f7)',
    }}>
      {/* ───── Left Panel — Brand, Features & Compliance (hidden on mobile) ───── */}
      {!isMobile && (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isTablet ? '32px 24px' : '48px 52px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #0d0e1a 0%, #111224 40%, #0a0b14 100%)',
        borderRight: '1px solid var(--border-default, #1e2035)',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--accent-primary, #6366f1) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* Gradient orb */}
        <div style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 40,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md, 12px)',
              background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(99, 102, 241, 0.3)',
            }}>
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 28,
                color: 'var(--text-primary, #f0f1f7)',
                lineHeight: 1.1,
              }}>
                VibeShield
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-secondary, #9498b3)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}>
                Secure AI-Powered SDLC
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.3,
            color: 'var(--text-primary, #f0f1f7)',
            marginBottom: 8,
            maxWidth: 460,
          }}>
            Vibe Code Fearlessly. We Guard the Gates.
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary, #9498b3)',
            lineHeight: 1.6,
            maxWidth: 460,
            marginBottom: 36,
          }}>
            Gen AI agents for your entire SDLC — code completion, security scanning, quality review, testing, and reverse engineering — all governed by kernel-level isolation and immutable audit trails.
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
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-sm, 8px)',
                    flexShrink: 0,
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary, #f0f1f7)',
                      marginBottom: 2,
                    }}>
                      {feat.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-muted, #5c6080)',
                      lineHeight: 1.55,
                    }}>
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
              marginTop: 36,
              paddingTop: 24,
              borderTop: '1px solid var(--border-default, #1e2035)',
            }}
          >
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted, #5c6080)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>
              Aligned Frameworks
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {complianceBadges.map(badge => (
                <span
                  key={badge}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                    color: 'var(--text-secondary, #9498b3)',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      )}

      {/* ───── Mobile Header (shown only on mobile) ───── */}
      {isMobile && (
      <div style={{
        padding: '20px 20px 16px',
        background: 'linear-gradient(165deg, #0d0e1a 0%, #111224 40%, #0a0b14 100%)',
        borderBottom: '1px solid var(--border-default, #1e2035)',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(99, 102, 241, 0.3)',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20,
              color: 'var(--text-primary, #f0f1f7)',
              lineHeight: 1,
            }}>
              VibeShield
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--text-secondary, #9498b3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}>
              Secure SDLC
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ───── Right Panel — Auth Form ───── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '24px 20px' : isTablet ? '40px 32px' : '60px 56px',
        background: 'var(--bg-primary, #08090f)',
        minHeight: isMobile ? 'auto' : '100vh',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 420,
          }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            borderRadius: 'var(--radius-md, 12px)',
            background: 'var(--bg-surface, #13151f)',
            border: '1px solid var(--border-default, #1e2035)',
            padding: 4,
            marginBottom: isMobile ? 24 : 32,
            gap: 4,
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
                    flex: 1,
                    padding: isMobile ? '12px 12px' : '10px 16px',
                    borderRadius: 'var(--radius-sm, 8px)',
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    background: isActive ? 'var(--accent-primary, #6366f1)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary, #9498b3)',
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
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 24,
              }}>
                <OAuthButton
                  icon={<GoogleIcon />}
                  label={tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                  isMobile={isMobile}
                />
                <OAuthButton
                  icon={<MicrosoftIcon />}
                  label={tab === 'signup' ? 'Sign up with Microsoft' : 'Sign in with Microsoft'}
                  isMobile={isMobile}
                />
                {!isMobile && (
                <button
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <Lock size={16} />
                  Enterprise SSO (Okta / SAML)
                </button>
                )}
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
              }}>
                <div style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--border-default, #1e2035)',
                }} />
                <span style={{
                  fontSize: 12,
                  color: 'var(--text-muted, #5c6080)',
                }}>
                  or continue with email
                </span>
                <div style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--border-default, #1e2035)',
                }} />
              </div>

              {/* Sign-up success message */}
              {signUpSuccess && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md, 12px)',
                  marginBottom: 16,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: 13,
                }}>
                  <CheckCircle size={16} />
                  <span>Account created! Check your email to confirm, then sign in.</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={tab === 'signup' ? handleSignUp : handleSignIn}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? 14 : 16,
                }}>
                <div>
                  <label style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary, #9498b3)',
                    marginBottom: 8,
                    display: 'block',
                  }}>
                    Email
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--bg-surface, #13151f)',
                    border: '1px solid var(--border-default, #1e2035)',
                    borderRadius: 'var(--radius-md, 12px)',
                    padding: '0 14px',
                    height: isMobile ? 48 : 'auto',
                  }}>
                    <Mail size={16} style={{
                      color: 'var(--text-muted, #5c6080)',
                      flexShrink: 0,
                    }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{
                        flex: 1,
                        padding: isMobile ? '14px 0' : '12px 0',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary, #f0f1f7)',
                        fontSize: isMobile ? 15 : 14,
                        fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary, #9498b3)',
                    marginBottom: 8,
                    display: 'block',
                  }}>
                    Password
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--bg-surface, #13151f)',
                    border: '1px solid var(--border-default, #1e2035)',
                    borderRadius: 'var(--radius-md, 12px)',
                    padding: '0 14px',
                    height: isMobile ? 48 : 'auto',
                  }}>
                    <Lock size={16} style={{
                      color: 'var(--text-muted, #5c6080)',
                      flexShrink: 0,
                    }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        flex: 1,
                        padding: isMobile ? '14px 0' : '12px 0',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary, #f0f1f7)',
                        fontSize: isMobile ? 15 : 14,
                        fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted, #5c6080)',
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    fontSize: 13,
                    color: '#ef4444',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                  }}>
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: isMobile ? 1 : 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '16px 16px' : '13px 16px',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    background: loading
                      ? 'rgba(99, 102, 241, 0.5)'
                      : 'var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
                    color: '#fff',
                    fontSize: isMobile ? 15 : 15,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
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
              <div style={{
                marginTop: 20,
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--text-muted, #5c6080)',
              }}>
                {tab === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => setTab('signup')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent-primary, #6366f1)',
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
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
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent-primary, #6366f1)',
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
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
            marginTop: isMobile ? 28 : 40,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted, #5c6080)',
          }}>
            VibeShield v1.0.0 &middot; Secure AI-Powered SDLC &middot; by ACL Digital
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── OAuth Button ── */
function OAuthButton({
  icon,
  label,
  isMobile = false,
}: {
  icon: React.ReactNode
  label: string
  isMobile?: boolean
}) {
  return (
    <button
      style={{
        width: '100%',
        padding: isMobile ? '14px 16px' : '12px 16px',
        borderRadius: 'var(--radius-md, 12px)',
        background: 'var(--bg-surface, #13151f)',
        border: '1px solid var(--border-default, #1e2035)',
        color: 'var(--text-primary, #f0f1f7)',
        fontSize: isMobile ? 14 : 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        height: isMobile ? 48 : 'auto',
      }}
      onMouseEnter={e => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = 'var(--border-subtle, #2d2f48)'
          e.currentTarget.style.background = 'var(--bg-elevated, #191c2a)'
        }
      }}
      onMouseLeave={e => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = 'var(--border-default, #1e2035)'
          e.currentTarget.style.background = 'var(--bg-surface, #13151f)'
        }
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
