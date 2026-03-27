import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Shield, BarChart3, ChevronDown } from 'lucide-react'
import VerticalSelector from '@/components/demo/VerticalSelector'
import PromptLibrary from '@/components/demo/PromptLibrary'
import AgentConsole from '@/components/demo/AgentConsole'
import SecurityPanel from '@/components/security/SecurityPanel'
import RoiPanel from '@/components/roi/RoiPanel'
import { useDemoStore } from '@/store/demoStore'
import { useResponsive } from '@/hooks/useMediaQuery'

type Panel = 'console' | 'security' | 'roi'
const panels: { key: Panel; label: string; shortLabel: string; icon: typeof Cpu }[] = [
  { key: 'console', label: 'Agent Console', shortLabel: 'Console', icon: Cpu },
  { key: 'security', label: 'Security Story', shortLabel: 'Security', icon: Shield },
  { key: 'roi', label: 'ROI Calculator', shortLabel: 'ROI', icon: BarChart3 },
]

export default function DemoPage() {
  const [panel, setPanel] = useState<Panel>('console')
  const [showPrompts, setShowPrompts] = useState(false)
  const { selectedVertical, selectedPrompt } = useDemoStore()
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {/* Mobile Top: Vertical + Panel Tabs */}
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <VerticalSelector />
          {/* Panel Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', marginTop: 12 }}>
            {panels.map(p => {
              const isActive = panel === p.key
              const Icon = p.icon
              return (
                <button key={p.key} onClick={() => setPanel(p.key)}
                  style={{
                    flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '10px 8px', borderRadius: 'calc(var(--radius-md) - 3px)', border: 'none',
                    background: 'transparent', color: isActive ? '#fff' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: isActive ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', zIndex: 1,
                  }}
                >
                  {isActive && (
                    <motion.div layoutId="panel-pill-m"
                      style={{ position: 'absolute', inset: 0, borderRadius: 'calc(var(--radius-md) - 3px)', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={13} />
                  {p.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Prompt Selector (collapsible) */}
        <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
          <button onClick={() => setShowPrompts(!showPrompts)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: selectedPrompt ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedPrompt ? 'rgba(99,102,241,0.2)' : 'var(--border-subtle)'}`,
              color: selectedPrompt ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}
          >
            <span>{selectedPrompt ? selectedPrompt.prompt.slice(0, 50) + '...' : 'Select a scenario...'}</span>
            <motion.div animate={{ rotate: showPrompts ? 180 : 0 }}><ChevronDown size={16} /></motion.div>
          </button>
          <AnimatePresence>
            {showPrompts && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderTop: 'none', maxHeight: 300, overflowY: 'auto' }}
              >
                <PromptLibrary vertical={selectedVertical} onSelect={() => setShowPrompts(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Content */}
        <div style={{ flex: 1, minHeight: 0, padding: '8px 0 0', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {panel === 'console' && (
              <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                <AgentConsole />
              </motion.div>
            )}
            {panel === 'security' && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', overflow: 'auto' }}>
                <SecurityPanel />
              </motion.div>
            )}
            {panel === 'roi' && (
              <motion.div key="roi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', overflow: 'auto' }}>
                <RoiPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ─── Desktop ───
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
      }}>
        <VerticalSelector />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, padding: 3, borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
          {panels.map(p => {
            const isActive = panel === p.key
            const Icon = p.icon
            return (
              <button key={p.key} onClick={() => setPanel(p.key)}
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 'calc(var(--radius-md) - 3px)', border: 'none',
                  background: 'transparent', color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', zIndex: 1,
                }}
              >
                {isActive && (
                  <motion.div layoutId="panel-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 'calc(var(--radius-md) - 3px)', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-sm)', zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={14} />
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Prompt library */}
        <div style={{ width: 300, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', flexShrink: 0 }}>
          <PromptLibrary vertical={selectedVertical} />
        </div>

        {/* Right: Panel content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {panel === 'console' && (
              <motion.div key="console" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <AgentConsole />
              </motion.div>
            )}
            {panel === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <SecurityPanel />
              </motion.div>
            )}
            {panel === 'roi' && (
              <motion.div key="roi" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <RoiPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
