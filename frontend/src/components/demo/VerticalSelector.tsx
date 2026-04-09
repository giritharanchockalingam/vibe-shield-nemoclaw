import { motion } from 'framer-motion'
import { VERTICALS, type Vertical } from '@/types'
import { useDemoStore } from '@/store/demoStore'

const verticals = Object.keys(VERTICALS) as Vertical[]

export default function VerticalSelector() {
  const { selectedVertical, setVertical } = useDemoStore()

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 6,
        borderRadius: 14,
        background: '#111224',
        border: '1px solid #1e2035',
        justifyContent: 'center',
      }}
    >
      {verticals.map((v) => {
        const config = VERTICALS[v]
        const isActive = selectedVertical === v
        return (
          <button
            key={v}
            onClick={() => setVertical(v)}
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: 8,
              border: isActive ? 'none' : '1px solid transparent',
              background: isActive ? 'transparent' : 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : '#8b8fa8',
              transition: 'color 0.2s ease, background 0.2s ease',
              zIndex: 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#c8cce0'
                e.currentTarget.style.background = '#1a1c33'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#8b8fa8'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {isActive && (
              <motion.div
                layoutId="vertical-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                  boxShadow: `0 0 24px ${config.color}25`,
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
