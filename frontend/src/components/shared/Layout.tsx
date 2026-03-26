import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Shield, Zap, GitBranch, Brain, FileSearch, Code2, LogOut, User } from 'lucide-react'
import SandboxStatusBadge from './SandboxStatusBadge'
import { useDemoStore } from '@/store/demoStore'
import { useAuth } from '@/lib/auth'
import { VERTICALS } from '@/types'
import type { Vertical } from '@/types'

const navItems = [
  { path: '/demo', label: 'Demo Console', icon: Play },
  { path: '/sdlc', label: 'SDLC Agents', icon: Code2 },
  { path: '/ai', label: 'Governance Agent', icon: Brain },
  { path: '/audit', label: 'Audit Trail', icon: FileSearch },
  { path: '/integrations', label: 'Integrations', icon: GitBranch },
  { path: '/admin', label: 'CISO Command Center', icon: Shield },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedVertical } = useDemoStore()
  const { user, signOut } = useAuth()
  const verticalColor = VERTICALS[selectedVertical as Vertical]?.color || '#4f5eff'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const userEmail = user?.email || 'User'
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0b14', color: '#e2e4f0', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 232, background: '#111224', borderRight: '1px solid #1e2035', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e2035' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${verticalColor}, #4f5eff)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.4s ease',
            }}>
              <Zap size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: '#e2e4f0', lineHeight: 1.2 }}>
                VibeShield
              </div>
              <div style={{ fontSize: 11, color: '#8b8fa8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Secure AI-Powered SDLC
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: 2 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                    background: isActive ? 'rgba(79, 94, 255, 0.1)' : 'transparent',
                    color: isActive ? '#4f5eff' : '#8b8fa8',
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
                        width: 3, height: 20, borderRadius: 2, background: '#4f5eff',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={18} />
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            )
          })}
        </nav>

        {/* User + Logout at bottom */}
        <div style={{ borderTop: '1px solid #1e2035', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, transparent, #111224)', pointerEvents: 'none' }} />

          {/* User info */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f5eff, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#e2e4f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
              <div style={{ fontSize: 10, color: '#8b8fa8' }}>Authenticated</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#8b8fa8', padding: 4, borderRadius: 4,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8b8fa8' }}
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Sandbox badge */}
          <div style={{ padding: '8px 12px 12px' }}>
            <SandboxStatusBadge />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  )
}
