import { motion } from 'framer-motion'
import { VERTICALS, type Vertical } from '@/types'
import { useDemoStore } from '@/store/demoStore'

const verticals: Vertical[] = ['edtech', 'retail', 'manufacturing', 'travel']

export default function VerticalSelector() {
  const { selectedVertical, setVertical } = useDemoStore()

  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: '#111224', border: '1px solid #1e2035' }}>
      {verticals.map((v) => {
        const config = VERTICALS[v]
        const isActive = selectedVertical === v
        return (
          <button
            key={v}
            onClick={() => setVertical(v)}
            style={{
              position: 'relative',
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : '#8b8fa8',
              transition: 'color 0.2s ease',
              zIndex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="vertical-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: config.color,
                  boxShadow: `0 0 20px ${config.color}30`,
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {config.icon} {config.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
