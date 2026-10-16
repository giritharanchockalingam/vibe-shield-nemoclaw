import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ShieldCheck, Wrench, Activity } from 'lucide-react'
import { useSessionMetrics } from '@/store/sessionMetrics'

export default function SessionMetricsBar() {
  const { threatsBlocked, checksPassed, autoRemediations, scenariosRun } = useSessionMetrics()

  if (scenariosRun === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '10px 12px',
          margin: '0 12px 12px',
          borderRadius: 10,
          background: 'rgba(79,94,255,0.04)',
          border: '1px solid rgba(79,94,255,0.12)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontSize: 9, fontWeight: 700, color: '#8b8fa8',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <Activity size={10} />
          SESSION METRICS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <MetricItem icon={<ShieldAlert size={11} />} value={threatsBlocked} label="Blocked" color="#ef4444" />
          <MetricItem icon={<ShieldCheck size={11} />} value={checksPassed} label="Verified" color="#4ade80" />
          <MetricItem icon={<Wrench size={11} />} value={autoRemediations} label="Auto-fixed" color="#f59e0b" />
          <MetricItem icon={<Activity size={11} />} value={scenariosRun} label="Scenarios" color="#818cf8" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function MetricItem({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 6,
      background: `${color}08`,
    }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </span>
      <span style={{ fontSize: 9, color: '#5a5e78' }}>{label}</span>
    </div>
  )
}
