import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ShieldCheck, Eye, ChevronRight, X } from 'lucide-react'

const steps = [
  {
    icon: <Eye size={28} style={{ color: '#818cf8' }} />,
    title: "You're about to watch an AI agent work",
    description: "Select a scenario and hit Run. Claude will generate production-grade code in real-time — just like your developers would use it.",
    accent: '#818cf8',
  },
  {
    icon: <ShieldAlert size={28} style={{ color: '#ef4444' }} />,
    title: "Watch what happens when it breaks the rules",
    description: "Mid-execution, the agent will attempt something dangerous — an unauthorized API call, a file access outside its sandbox, or a data exfiltration attempt. NemoClaw will catch it live.",
    accent: '#ef4444',
  },
  {
    icon: <ShieldCheck size={28} style={{ color: '#4ade80' }} />,
    title: "See the output verified before it ships",
    description: "After the code is generated, NemoClaw validates it for security vulnerabilities, compliance violations, and credential leaks. You'll see exactly what was caught and auto-fixed.",
    accent: '#4ade80',
  },
]

export default function FirstRunOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10, 11, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          width: 440, maxWidth: '90vw',
          borderRadius: 16,
          border: `1px solid ${current.accent}30`,
          background: '#111224',
          overflow: 'hidden',
        }}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          <button onClick={onDismiss}
            style={{
              background: 'transparent', border: 'none', color: '#5a5e78', cursor: 'pointer',
              padding: 4, borderRadius: 6, display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0 32px 24px', textAlign: 'center' }}
          >
            <div style={{ marginBottom: 16 }}>{current.icon}</div>
            <h3 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 20, fontWeight: 400, color: '#e2e4f0',
              marginBottom: 10, lineHeight: 1.3,
            }}>
              {current.title}
            </h3>
            <p style={{
              fontSize: 14, color: '#8b8fa8', lineHeight: 1.7,
              maxWidth: 360, margin: '0 auto',
            }}>
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots + action */}
        <div style={{
          padding: '16px 32px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? current.accent : '#2a2d4a',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 8,
              border: 'none',
              background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)`,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxShadow: `0 4px 16px ${current.accent}30`,
            }}
          >
            {isLast ? "Let's go" : 'Next'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
