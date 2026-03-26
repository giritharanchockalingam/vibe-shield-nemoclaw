import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { getPrompts } from '@/lib/api'
import { useDemoStore } from '@/store/demoStore'
import { VERTICALS } from '@/types'
import type { Vertical, DemoPrompt } from '@/types'

export default function PromptLibrary({ vertical }: { vertical: Vertical }) {
  const { selectedPrompt, setPrompt } = useDemoStore()
  const verticalColor = VERTICALS[vertical]?.color || '#4f5eff'

  const { data: prompts = [], isLoading } = useQuery<DemoPrompt[]>({
    queryKey: ['prompts', vertical],
    queryFn: () => getPrompts(vertical),
  })

  if (isLoading) return (
    <div style={{ padding: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 10, background: '#111224', marginBottom: 8, opacity: 0.5 }} />
      ))}
    </div>
  )

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
        Scenarios ({prompts.length})
      </div>
      <AnimatePresence mode="popLayout">
        {prompts.map((p, index) => {
          const sel = selectedPrompt?.id === p.id
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              onClick={() => setPrompt(p)}
              whileHover={{ borderColor: `${verticalColor}40`, boxShadow: `0 0 20px ${verticalColor}10` }}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                border: `1px solid ${sel ? verticalColor + '60' : '#1e2035'}`,
                background: sel ? `linear-gradient(135deg, ${verticalColor}10, ${verticalColor}05)` : '#111224',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Agent type badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: verticalColor, background: `${verticalColor}15`, padding: '2px 8px', borderRadius: 4 }}>
                  {p.agent_type}
                </span>
                <ChevronRight size={12} style={{ color: '#5a5e78', transform: sel ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </div>

              {/* Title */}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e4f0', lineHeight: 1.3, marginBottom: 4 }}>{p.title}</div>

              {/* Tags */}
              {p.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {p.tags.slice(0, 2).map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e2035', color: '#8b8fa8' }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Wow moment on select */}
              <AnimatePresence>
                {sel && p.expected_wow_moment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: verticalColor, fontWeight: 500, paddingTop: 8, marginTop: 8, borderTop: '1px solid #1e2035' }}>
                      <Sparkles size={12} />
                      <span>{p.expected_wow_moment}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {prompts.length === 0 && (
        <div style={{ fontSize: 13, color: '#5a5e78', textAlign: 'center', padding: 32 }}>No scenarios — run DB seed</div>
      )}
    </div>
  )
}
