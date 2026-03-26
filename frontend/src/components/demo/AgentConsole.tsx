import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'
import { Copy, RotateCcw, Play, Square, Terminal, Clock, Zap, Hash, Shield, AlertTriangle } from 'lucide-react'
import { useDemoStore } from '@/store/demoStore'
import { startDemoSession, streamSession } from '@/lib/api'
import { VERTICALS } from '@/types'
import type { StreamChunk, Vertical } from '@/types'

interface GovernanceEvent {
  detail: string
  action: string
  event_type: string
  severity: string
  layer: string
  timestamp: number
}

/** Parse output into text + code blocks (handles unclosed blocks during streaming) */
function parseOutput(text: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
  const blocks: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
  // Match both closed (```lang\n...```) and unclosed (```lang\n... to end) code blocks
  const re = /```(\w*)\n([\s\S]*?)(?:```|$)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const t = text.slice(last, m.index).trim()
      if (t) blocks.push({ type: 'text', content: t })
    }
    const code = m[2].trim()
    if (code) blocks.push({ type: 'code', content: code, language: m[1] || 'python' })
    last = m.index + m[0].length
  }
  const remaining = text.slice(last).trim()
  if (remaining) blocks.push({ type: 'text', content: remaining })
  return blocks
}

/** Render markdown text with headers, bold, lists */
function renderTextBlock(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: '#e2e4f0', margin: '16px 0 8px' }}>{line.slice(4)}</h4>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: '#e2e4f0', margin: '20px 0 10px' }}>{line.slice(3)}</h3>
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0', margin: '24px 0 12px' }}>{line.slice(2)}</h2>
    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g)
      return <p key={i} style={{ color: '#c8cae0', lineHeight: 1.7, margin: '4px 0' }}>
        {parts.map((part, j) => part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} style={{ color: '#e2e4f0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
          : part
        )}
      </p>
    }
    if (line.startsWith('- ') || line.startsWith('* '))
      return <div key={i} style={{ color: '#c8cae0', lineHeight: 1.7, paddingLeft: 16, margin: '2px 0', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 4, color: '#4f5eff' }}>•</span>{line.slice(2)}
      </div>
    const numMatch = line.match(/^(\d+)\.\s/)
    if (numMatch)
      return <div key={i} style={{ color: '#c8cae0', lineHeight: 1.7, paddingLeft: 24, margin: '2px 0', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, color: '#4f5eff', fontWeight: 600, fontSize: 13 }}>{numMatch[1]}.</span>
        {line.slice(numMatch[0].length)}
      </div>
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />
    return <p key={i} style={{ color: '#c8cae0', lineHeight: 1.7, margin: '4px 0' }}>{line}</p>
  })
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 0' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f5eff' }}
        />
      ))}
      <span style={{ color: '#8b8fa8', fontSize: 13, marginLeft: 8 }}>Agent thinking...</span>
    </div>
  )
}

export default function AgentConsole() {
  const { selectedPrompt, selectedVertical, streamBuffer, isStreaming, appendStream, resetStream, setStreaming } = useDemoStore()
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [govEvents, setGovEvents] = useState<GovernanceEvent[]>([])
  const outputRef = useRef<HTMLDivElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenCountRef = useRef(0)

  const verticalColor = VERTICALS[selectedVertical as Vertical]?.color || '#4f5eff'

  useEffect(() => {
    if (outputRef.current && isStreaming) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [streamBuffer, isStreaming])

  // Sync token count ref to state periodically (ref is updated from SSE callback to avoid React batching loss)
  useEffect(() => {
    if (isStreaming) {
      const sync = setInterval(() => setTokenCount(tokenCountRef.current), 250)
      return () => clearInterval(sync)
    }
  }, [isStreaming])

  // Elapsed timer
  useEffect(() => {
    if (isStreaming && startTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isStreaming, startTime])

  const tokensPerSecond = elapsed > 0 ? Math.round((tokenCount / elapsed) * 1000) : 0

  const handleRun = useCallback(async () => {
    if (!selectedPrompt || isStreaming) return
    setError(null); resetStream(); setStreaming(true); setGovEvents([])
    tokenCountRef.current = 0; setTokenCount(0); setStartTime(Date.now()); setElapsed(0)
    try {
      const { session_id } = await startDemoSession({ vertical: selectedVertical, agent_type: selectedPrompt.agent_type, prompt: selectedPrompt.prompt })
      stopRef.current = streamSession(session_id,
        (c: StreamChunk) => {
          if (c.type === 'token') { tokenCountRef.current += 1; appendStream(c.content) }
          else if (c.type === 'governance' as any && c.metadata) {
            const ge: GovernanceEvent = {
              detail: c.content,
              action: (c.metadata as any).action ?? 'UNKNOWN',
              event_type: (c.metadata as any).event_type ?? '',
              severity: (c.metadata as any).severity ?? 'info',
              layer: (c.metadata as any).layer ?? '',
              timestamp: Date.now(),
            }
            setGovEvents(prev => [ge, ...prev].slice(0, 10))
          }
        },
        () => { setTokenCount(tokenCountRef.current); setStreaming(false); if (timerRef.current) clearInterval(timerRef.current) },
        (e) => { setTokenCount(tokenCountRef.current); setError(e.message); setStreaming(false); if (timerRef.current) clearInterval(timerRef.current) }
      )
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setStreaming(false) }
  }, [selectedPrompt, selectedVertical, isStreaming, appendStream, resetStream, setStreaming])

  const handleStop = () => { stopRef.current?.(); setStreaming(false); if (timerRef.current) clearInterval(timerRef.current) }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(streamBuffer)
    toast.success('Output copied to clipboard')
  }, [streamBuffer])

  const handleReset = useCallback(() => {
    resetStream(); tokenCountRef.current = 0; setTokenCount(0); setElapsed(0); setStartTime(null); setError(null); setGovEvents([])
  }, [resetStream])

  const blocks = useMemo(() => parseOutput(streamBuffer), [streamBuffer])

  const formatTime = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0b14', borderRadius: 12, border: '1px solid #1e2035', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e2035', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0, background: '#0d0e1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={14} style={{ color: verticalColor }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0' }}>Agent Console</span>
          {isStreaming && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: 11, color: verticalColor, background: `${verticalColor}15`, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}
            >
              STREAMING
            </motion.div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {streamBuffer && !isStreaming && (
            <>
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #1e2035', background: 'transparent', color: '#8b8fa8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <Copy size={12} /> Copy
              </button>
              <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #1e2035', background: 'transparent', color: '#8b8fa8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <RotateCcw size={12} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      {(isStreaming || streamBuffer) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderBottom: '1px solid #1e2035', background: '#0d0e1a', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
            <Hash size={12} />
            <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{tokenCount.toLocaleString()}</span>
            <span>tokens</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
            <Clock size={12} />
            <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(elapsed)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b8fa8' }}>
            <Zap size={12} />
            <span style={{ color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace" }}>{tokensPerSecond}</span>
            <span>tok/s</span>
          </div>
        </div>
      )}

      {/* Governance overlay — live policy enforcement events */}
      <AnimatePresence>
        {govEvents.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderBottom: '1px solid #1e2035', background: '#0d0e1a', overflow: 'hidden' }}
          >
            <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #1e203540' }}>
              <Shield size={11} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NemoClaw Policy Events</span>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', marginLeft: 'auto' }}
              />
            </div>
            {govEvents.slice(0, 4).map((ge, i) => (
              <motion.div
                key={`${ge.timestamp}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {ge.action === 'BLOCKED' ? <AlertTriangle size={10} style={{ color: '#ef4444' }} /> : <Shield size={10} style={{ color: '#4ade80' }} />}
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '0px 5px', borderRadius: 3,
                  background: ge.action === 'BLOCKED' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.12)',
                  color: ge.action === 'BLOCKED' ? '#ef4444' : '#4ade80'
                }}>{ge.action}</span>
                <span style={{ fontSize: 9, color: '#5a5e78', textTransform: 'uppercase' }}>{ge.layer}</span>
                <span style={{ color: '#8b8fa8', fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ge.detail}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output area */}
      <div ref={outputRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontSize: 14 }}>
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '16px 20px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 16 }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#ef4444', fontSize: 14 }}>Stream Error</div>
              <div style={{ color: '#fca5a5', fontSize: 13, lineHeight: 1.6 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!streamBuffer && !isStreaming && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.6 }}>
            <Terminal size={40} style={{ color: '#1e2035' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: '#8b8fa8', marginBottom: 4 }}>Select a scenario & run</div>
              <div style={{ fontSize: 13, color: '#5a5e78' }}>Claude will stream production-grade output in real-time</div>
            </div>
          </div>
        )}

        {/* Thinking dots before first token */}
        {isStreaming && !streamBuffer && <ThinkingDots />}

        {/* Rendered output with syntax highlighting */}
        {blocks.map((block, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            {block.type === 'code' ? (
              <div style={{ margin: '12px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid #1e2035' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#0d0e1a', borderBottom: '1px solid #1e2035' }}>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: verticalColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.language}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(block.content); toast.success('Code copied') }}
                    style={{ background: 'transparent', border: 'none', color: '#8b8fa8', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Sans', system-ui", display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language={block.language || 'text'}
                  style={oneDark}
                  customStyle={{ margin: 0, padding: '16px', background: '#0a0b14', fontSize: 13, lineHeight: 1.6 }}
                  showLineNumbers
                  lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#2a2d4a', fontSize: 12 }}
                >
                  {block.content}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div>{renderTextBlock(block.content)}</div>
            )}
          </motion.div>
        ))}

        {/* Blinking cursor during stream */}
        {isStreaming && streamBuffer && (
          <span className="cursor-blink" style={{ display: 'inline-block', width: 8, height: 18, background: verticalColor, marginLeft: 2, verticalAlign: 'text-bottom', borderRadius: 1 }} />
        )}
      </div>

      {/* Run button bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2035', background: '#0d0e1a' }}>
        {isStreaming ? (
          <button onClick={handleStop} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}>
            <Square size={14} /> Stop
          </button>
        ) : (
          <button onClick={handleRun} disabled={!selectedPrompt}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 8, border: 'none',
              background: selectedPrompt ? `linear-gradient(135deg, ${verticalColor}, #4f5eff)` : '#1e2035',
              color: selectedPrompt ? '#fff' : '#5a5e78',
              fontSize: 14, fontWeight: 600, cursor: selectedPrompt ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', system-ui",
              boxShadow: selectedPrompt ? `0 4px 20px ${verticalColor}30` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Play size={16} /> Run Demo
          </button>
        )}
      </div>
    </div>
  )
}
