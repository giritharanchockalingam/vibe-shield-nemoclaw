import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, Cpu, Cloud, ShieldAlert, AlertTriangle } from 'lucide-react'
import { askAssistant } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import Markdown from '@/components/shared/Markdown'

const CONCISE_SYSTEM =
  'You are a concise enterprise assistant. Answer directly and briefly — a few ' +
  'sentences or a short list. Do not pad, repeat the question, or add filler. ' +
  'Use light markdown only when it genuinely helps readability.'

type Turn = {
  role: 'user' | 'assistant'
  text: string
  route?: { target?: string; model?: string; cost_usd?: number; escalated?: boolean; reason?: string; note?: string }
  error?: boolean
}

const PRIVACY = [
  { v: 'public', label: 'Public' },
  { v: 'internal', label: 'Internal' },
  { v: 'sensitive', label: 'Sensitive' },
  { v: 'confidential', label: 'Confidential — never leaves device' },
]

function RouteBadge({ route }: { route: Turn['route'] }) {
  if (!route) return null
  const cloud = route.target === 'cloud'
  return (
    <div title={route.reason} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: cloud ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
      color: cloud ? '#fbbf24' : '#34d399',
      border: `1px solid ${cloud ? '#fbbf2455' : '#34d39955'}`,
    }}>
      {cloud ? <Cloud size={12} /> : <Cpu size={12} />}
      {cloud ? 'CLOUD' : 'LOCAL'} · {route.model}
      {route.cost_usd ? ` · $${route.cost_usd}` : ' · $0.00'}
      {route.escalated ? ' · escalated' : ''}
    </div>
  )
}

export default function AssistantPage() {
  const { user } = useAuth()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [privacy, setPrivacy] = useState('internal')
  const [allowCloud, setAllowCloud] = useState(true)
  const [task, setTask] = useState<'chat' | 'governance' | 'code'>('chat')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns, loading])

  const send = async () => {
    const prompt = input.trim()
    if (!prompt || loading) return
    setTurns(t => [...t, { role: 'user', text: prompt }])
    setInput('')
    setLoading(true)
    try {
      const r = await askAssistant({
        prompt, task, privacy, allow_cloud: allowCloud, system: CONCISE_SYSTEM,
        user_id: user?.email || 'anonymous', project_id: 'vibeshield',
      })
      setTurns(t => [...t, { role: 'assistant', text: r.text, route: r.route }])
    } catch (e: any) {
      setTurns(t => [...t, { role: 'assistant', text: e.message || 'Request failed', error: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <div style={{ padding: '20px 24px 8px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Assistant</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          Governed conversational AI. Routes local-first (Gemma) through the Edge-First gateway;
          cloud only when policy and your cloud opt-in allow. Every turn shows its route + cost.
        </p>
      </div>

      {/* Controls */}
      <div className="glass" style={{ margin: '8px 24px', padding: 12, borderRadius: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Privacy
          <select value={privacy} onChange={e => setPrivacy(e.target.value)}
            style={{ background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 8, padding: '6px 8px', fontSize: 13 }}>
            {PRIVACY.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Task
          <select value={task} onChange={e => setTask(e.target.value as any)}
            style={{ background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 8, padding: '6px 8px', fontSize: 13 }}>
            <option value="chat">Chat (Gemma)</option>
            <option value="governance">Governance</option>
            <option value="code">Code (Qwen-Coder)</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <input type="checkbox" checked={allowCloud} onChange={e => setAllowCloud(e.target.checked)} />
          Allow cloud egress
        </label>
        {privacy === 'confidential' && (
          <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
            <ShieldAlert size={13} /> pinned local — cannot reach cloud
          </span>
        )}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 24px' }}>
        {turns.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Ask anything. Confidential questions stay on-device; others route local-first.
          </div>
        )}
        {turns.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 16, display: 'flex', justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className="glass" style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
              background: t.role === 'user' ? 'rgba(99,102,241,0.15)' : t.error ? 'rgba(248,113,113,0.12)' : undefined,
              border: t.error ? '1px solid #f8717155' : undefined,
            }}>
              {t.error && <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#f87171', fontSize: 12, marginBottom: 4 }}><AlertTriangle size={13} /> Error</div>}
              {t.role === 'user' || t.error
                ? <div style={{ whiteSpace: 'pre-wrap', color: t.error ? '#f87171' : 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>{t.text}</div>
                : <div style={{ color: 'var(--text-primary)', fontSize: 14 }}><Markdown text={t.text} /></div>}
              {t.role === 'assistant' && !t.error && <RouteBadge route={t.route} />}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 24px 20px', display: 'flex', gap: 8 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask the assistant… (Enter to send, Shift+Enter for newline)"
          rows={2}
          style={{ flex: 1, resize: 'none', background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ background: 'var(--accent-gradient, #2E75B6)', color: '#fff', border: 0, borderRadius: 10, padding: '0 16px', cursor: loading ? 'default' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
