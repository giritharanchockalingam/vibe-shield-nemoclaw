import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Shield, Zap, GitBranch, Brain, FileSearch, Code2, LogOut, Menu, X, ChevronRight, Plug } from 'lucide-react'
import SandboxStatusBadge from './SandboxStatusBadge'
import { useDemoStore } from '@/store/demoStore'
import { useAuth } from '@/lib/auth'
import { VERTICALS } from '@/types'
import { useResponsive } from '@/hooks/useMediaQuery'
import type { Vertical } from '@/types'

const navItems = [
  { path: '/demo', label: 'Demo Console', shortLabel: 'Demo', icon: Play },
  { path: '/sdlc', label: 'SDLC Agents', shortLabel: 'SDLC', icon: Code2 },
  { path: '/ai', label: 'Governance Agent', shortLabel: 'Agent', icon: Brain },
  { path: '/audit', label: 'Audit Trail', shortLabel: 'Audit', icon: FileSearch },
  { path: '/integrations', label: 'Integrations', shortLabel: 'Integ', icon: Plug },
  { path: '/admin', label: 'CISO Command Center', shortLabel: 'CISO', icon: Shield },
]

// Bottom nav shows 4 primary items on mobile, rest in drawer
const bottomNavItems = navItems.slice(0, 4)
const drawerExtraItems = navItems.slice(4)

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedVertical } = useDemoStore()
  const { user, signOut } = useAuth()
  const { isMobile, isTablet } = useResponsive()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const verticalColor = VERTICALS[selectedVertical as Vertical]?.color || '#6366f1'

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const userEmail = user?.email || 'User'
  const userInitial = userEmail.charAt(0).toUpperCase()

  // ─── Mobile Layout ───
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {/* Mobile Header */}
        <header className="glass-strong" style={{
          padding: '0 16px', height: 'var(--header-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, zIndex: 40,
          paddingTop: 'var(--safe-top)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
              VibeShield
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 10,
            }}
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'auto', paddingBottom: 'calc(var(--mobile-nav-height) + var(--safe-bottom))' }}>
          <Outlet />
        </main>

        {/* Bottom Tab Bar */}
        <nav className="glass-strong" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          height: 'calc(var(--mobile-nav-height) + var(--safe-bottom))',
          paddingBottom: 'var(--safe-bottom)',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none', flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 0', minWidth: 56, position: 'relative',
                }}>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab"
                      style={{
                        position: 'absolute', top: -1, width: 24, height: 2,
                        borderRadius: 2, background: verticalColor,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon size={20} style={{
                    color: isActive ? verticalColor : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}>
                    {item.shortLabel}
                  </span>
                </div>
              </NavLink>
            )
          })}
          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <Menu size={20} style={{ color: drawerOpen ? verticalColor : 'var(--text-muted)' }} />
            <span style={{ fontSize: 10, color: drawerOpen ? 'var(--text-primary)' : 'var(--text-muted)' }}>More</span>
          </button>
        </nav>

        {/* Slide-up Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="glass-strong"
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
                  borderRadius: '20px 20px 0 0',
                  paddingBottom: 'calc(16px + var(--safe-bottom))',
                  maxHeight: '80vh', overflow: 'auto',
                }}
              >
                {/* Drawer handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--border-strong)' }} />
                </div>

                {/* User card */}
                <div style={{
                  margin: '4px 16px 12px', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>
                    {userInitial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{userEmail}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Authenticated</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                      color: '#ef4444', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>

                {/* Extra nav items */}
                <div style={{ padding: '4px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 0 8px' }}>
                    More Pages
                  </div>
                  {drawerExtraItems.map(item => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon
                    return (
                      <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                          borderRadius: 'var(--radius-sm)', marginBottom: 2,
                          background: isActive ? 'var(--accent-glow)' : 'transparent',
                        }}>
                          <Icon size={20} style={{ color: isActive ? verticalColor : 'var(--text-secondary)' }} />
                          <span style={{ fontSize: 15, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>
                            {item.label}
                          </span>
                          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </NavLink>
                    )
                  })}
                </div>

                {/* Sandbox status */}
                <div style={{ padding: '12px 16px' }}>
                  <SandboxStatusBadge />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ─── Desktop / Tablet Layout ───
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside style={{
        width: isTablet ? 72 : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: isTablet ? '20px 0' : '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: isTablet ? 'center' : 'flex-start', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Zap size={16} color="#fff" />
          </div>
          {!isTablet && (
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.2 }}>VibeShield</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Secure AI-Powered SDLC</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: isTablet ? '12px 8px' : '12px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: isTablet ? 0 : 2 }}
                  title={isTablet ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: isTablet ? '12px 0' : '10px 12px',
                    justifyContent: isTablet ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-sm)', marginBottom: 2,
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: isActive ? verticalColor : 'var(--text-secondary)',
                    fontSize: 14, fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: 3, height: 20, borderRadius: 2, background: verticalColor,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={18} />
                  {!isTablet && <span>{item.label}</span>}
                </motion.div>
              </NavLink>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {isTablet ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>
                {userInitial}
              </div>
              <button onClick={handleLogout} title="Sign out"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, borderRadius: 6, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {userInitial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userEmail}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Authenticated</div>
                </div>
                <button onClick={handleLogout} title="Sign out"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
              <div style={{ padding: '4px 12px 12px' }}>
                <SandboxStatusBadge />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  )
}
