import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Send, Loader2, Cpu, Cloud, ShieldCheck, AlertTriangle, Database } from 'lucide-react'
import { knowledgeStats, knowledgeIngest, knowledgeIndexText, knowledgeAsk } from '@/lib/api'
import { useAuth } from '@/lib/auth'

type Source = { n: number; source: string; chunk_id: number; score: number }
type Answer = { question: string; answer: string; sources: Source[]; route?: any; confidence?: number; error?: boolean }

export default function KnowledgePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ documents?: number; chunks?: number; enabled?: boolean }>({})
  const [pasteText, setPasteText] = useState('')
  const [docId, setDocId] = useState('')
  const [question, setQuestion] = useState('')
  const [privacy, setPrivacy] = useState('confidential')
  const [allowCloud, setAllowCloud] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [busy, setBusy] = useState<string>('')
  const [toast, setToast] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const refreshStats = async () => { try { setStats(await knowledgeStats()) } catch { setStats({ enabled: false }) } }
  useEffect(() => { refreshStats() }, [])

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const proj = 'vibeshield'
  const uid = user?.email || 'anonymous'

  const onUpload = async (f: File) => {
    setBusy('upload')
    try { const o = await knowledgeIngest(f, proj, uid); flash(`Indexed "${f.name}" — ${o.chunks_added} chunks`); refreshStats() }
    catch (e: any) { flash(`Upload failed: ${e.message}`) } finally { setBusy('') }
  }
  const onIndexText = async () => {
    if (!pasteText.trim() || !docId.trim()) { flash('Need a doc name and text'); return }
    setBusy('text')
    try { const o = await knowledgeIndexText({ doc_id: docId, text: pasteText, user_id: uid, project_id: proj }); flash(`Indexed "${docId}" — ${o.chunks_added} chunks`); setPasteText(''); setDocId(''); refreshStats() }
    catch (e: any) { flash(`Index failed: ${e.message}`) } finally { setBusy('') }
  }
  const onAsk = async () => {
    const q = question.trim(); if (!q || busy) return
    setBusy('ask'); setQuestion('')
    try {
      const r = await knowledgeAsk({ question: q, privacy, allow_cloud: allowCloud, user_id: uid, project_id: proj })
      setAnswers(a => [{ question: q, answer: r.answer, sources: r.sources || [], route: r.route, confidence: r.confidence }, ...a])
    } catch (e: any) {
      setAnswers(a => [{ question: q, answer: e.message, sources: [], error: true }, ...a])
    } finally { setBusy('') }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Knowledge</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          Ask questions over your documents. Files are embedded and searched <b>on-device</b> —
          they never reach a public AI provider. Answers are grounded and cited, generated local-first.
        </p>
      </div>

      <div className="glass" style={{ padding: '8px 14px', borderRadius: 10, display: 'inline-flex', gap: 16, alignItems: 'center', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Database size={14} style={{ color: '#818cf8' }} /> {stats.documents ?? 0} docs · {stats.chunks ?? 0} chunks</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#34d399' }}><ShieldCheck size={14} /> on-device corpus</span>
      </div>

      {/* Ingest */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="glass" style={{ flex: 1, minWidth: 280, padding: 16, borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-primary)' }}>Upload a document</h3>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy === 'upload'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--chip, #22344a)', color: 'var(--text-primary)', border: '1px dashed var(--border-subtle, #27384c)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            {busy === 'upload' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
            {busy === 'upload' ? 'Indexing…' : 'Choose PDF / text / markdown'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Max 10MB · extracted & embedded on-device</p>
        </div>
        <div className="glass" style={{ flex: 1, minWidth: 280, padding: 16, borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-primary)' }}>Paste text</h3>
          <input value={docId} onChange={e => setDocId(e.target.value)} placeholder="document name"
            style={{ width: '100%', background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginBottom: 8 }} />
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={3} placeholder="paste notes, a spec, meeting minutes…"
            style={{ width: '100%', resize: 'vertical', background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <button onClick={onIndexText} disabled={busy === 'text'}
            style={{ marginTop: 8, background: 'var(--accent-gradient, #2E75B6)', color: '#fff', border: 0, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {busy === 'text' ? 'Indexing…' : 'Index text'}
          </button>
        </div>
      </div>

      {/* Ask */}
      <div className="glass" style={{ padding: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAsk() }}
            placeholder="Ask a question about your documents…"
            style={{ flex: 1, background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 10, padding: '10px 12px', fontSize: 14 }} />
          <button onClick={onAsk} disabled={busy === 'ask' || !question.trim()}
            style={{ background: 'var(--accent-gradient, #2E75B6)', color: '#fff', border: 0, borderRadius: 10, padding: '0 16px', cursor: 'pointer', opacity: busy === 'ask' || !question.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
            {busy === 'ask' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>Privacy
            <select value={privacy} onChange={e => setPrivacy(e.target.value)}
              style={{ background: '#0c131c', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 8, padding: '4px 6px', fontSize: 12 }}>
              <option value="confidential">Confidential (local only)</option>
              <option value="internal">Internal</option>
              <option value="public">Public</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <input type="checkbox" checked={allowCloud} onChange={e => setAllowCloud(e.target.checked)} /> Allow cloud escalation
          </label>
        </div>
      </div>

      {/* Answers */}
      <div style={{ marginTop: 20 }}>
        {answers.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass"
            style={{ padding: 16, borderRadius: 12, marginBottom: 12, border: a.error ? '1px solid #f8717155' : undefined }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Q: {a.question}</div>
            {a.error
              ? <div style={{ color: '#f87171', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={14} /> {a.answer}</div>
              : <>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.55 }}>{a.answer}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    {a.route?.target && (
                      <span title={a.route.reason} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: a.route.target === 'cloud' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)', color: a.route.target === 'cloud' ? '#fbbf24' : '#34d399', border: `1px solid ${a.route.target === 'cloud' ? '#fbbf2455' : '#34d39955'}` }}>
                        {a.route.target === 'cloud' ? <Cloud size={11} /> : <Cpu size={11} />}{a.route.target === 'cloud' ? 'CLOUD' : 'LOCAL'} · {a.route.model}
                      </span>
                    )}
                    {typeof a.confidence === 'number' && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>confidence {a.confidence}</span>}
                    {a.sources.map(s => (
                      <span key={s.n} title={`score ${s.score}`} style={{ fontSize: 11, background: 'var(--chip, #22344a)', border: '1px solid var(--border-subtle, #27384c)', borderRadius: 6, padding: '2px 7px', color: 'var(--text-secondary)', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <FileText size={10} />[{s.n}] {s.source}
                      </span>
                    ))}
                  </div>
                </>}
          </motion.div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--panel2, #1d2a3a)', border: '1px solid var(--border-subtle, #27384c)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 10, fontSize: 13, zIndex: 9999 }}>{toast}</div>
      )}
    </div>
  )
}
