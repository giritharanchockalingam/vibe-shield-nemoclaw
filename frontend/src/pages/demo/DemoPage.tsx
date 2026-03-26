import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Shield, BarChart3 } from 'lucide-react'
import VerticalSelector from '@/components/demo/VerticalSelector'
import PromptLibrary from '@/components/demo/PromptLibrary'
import AgentConsole from '@/components/demo/AgentConsole'
import SecurityPanel from '@/components/security/SecurityPanel'
import RoiPanel from '@/components/roi/RoiPanel'
import { useDemoStore } from '@/store/demoStore'

type Panel = 'console' | 'security' | 'roi'
const panels: { key: Panel; label: string; icon: typeof Cpu }[] = [
  { key: 'console', label: 'Agent Console', icon: Cpu },
  { key: 'security', label: 'Security Story', icon: Shield },
  { key: 'roi', label: 'ROI Calculator', icon: BarChart3 },
]

export default function DemoPage() {
  const [panel, setPanel] = useState<Panel>('console')
  const { selectedVertical } = useDemoStore()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #1e2035', background: '#111224', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <VerticalSelector />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: '#0d0e1a', border: '1px solid #1e2035' }}>
          {panels.map(p => {
            const isActive = panel === p.key
            const Icon = p.icon
            return (
              <button
                key={p.key}
                onClick={() => setPanel(p.key)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 7, border: 'none',
                  background: 'transparent',
                  color: isActive ? '#fff' : '#8b8fa8',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="panel-pill"
                    style={{ position: 'absolute', inset: 0, borderRadius: 7, background: '#1e2035', zIndex: -1 }}
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
        {/* Left: Prompt library (always visible) */}
        <div style={{ width: 300, borderRight: '1px solid #1e2035', overflowY: 'auto', flexShrink: 0 }}>
          <PromptLibrary vertical={selectedVertical} />
        </div>

        {/* Right: Panel content with transitions */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {panel === 'console' && (
              <motion.div key="console" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <AgentConsole />
              </motion.div>
            )}
            {panel === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <SecurityPanel />
              </motion.div>
            )}
            {panel === 'roi' && (
              <motion.div key="roi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                <RoiPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
