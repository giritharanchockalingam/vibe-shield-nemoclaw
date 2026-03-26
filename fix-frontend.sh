#!/bin/bash
# Run this from inside your acl-vibe-demo directory
# Usage: bash fix-frontend.sh

SRC="frontend/src"

mkdir -p $SRC/{components/{shared,demo,security,roi},pages/{demo,admin},store,lib,types,styles}

# ── globals.css ──────────────────────────────────────────────────────────────
cat > $SRC/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&display=swap');
@layer base {
  * { box-sizing: border-box; }
  body { background-color: #0a0b14; color: #e5e7eb; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2c45; border-radius: 2px; }
}
EOF

# ── types/index.ts ────────────────────────────────────────────────────────────
cat > $SRC/types/index.ts << 'EOF'
export type Vertical = 'edtech' | 'retail' | 'manufacturing' | 'travel'
export const VERTICALS: Record<Vertical, { label: string; icon: string; color: string }> = {
  edtech:        { label: 'EdTech',       icon: '🎓', color: '#7085ff' },
  retail:        { label: 'Retail',        icon: '🛍️', color: '#4fc87a' },
  manufacturing: { label: 'Manufacturing', icon: '🏭', color: '#f59e0b' },
  travel:        { label: 'Travel',        icon: '✈️', color: '#06b6d4' },
}
export type AgentType = 'coding' | 'research' | 'planning'
export type DemoSessionStatus = 'idle' | 'running' | 'complete' | 'error'
export interface DemoSession { id: string; client_id?: string; vertical: Vertical; agent_type: AgentType; prompt: string; output: string; status: DemoSessionStatus; tokens_used?: number; duration_ms?: number; created_at: string }
export interface DemoPrompt { id: string; vertical: Vertical; agent_type: AgentType; title: string; prompt: string; expected_wow_moment: string; tags: string[] }
export interface Client { id: string; name: string; vertical: Vertical; contact_name?: string; contact_email?: string; created_at: string }
export interface StreamChunk { type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error'; content: string; metadata?: Record<string, unknown> }
export interface PolicyRule { host: string; port: number; action: 'allow' | 'deny'; triggered?: boolean }
export interface SandboxStatus { name: string; status: 'running' | 'stopped' | 'error'; model: string; policies: PolicyRule[]; active_sessions: number }
export interface DemoStore { selectedVertical: Vertical; selectedPrompt: DemoPrompt | null; currentSession: DemoSession | null; streamBuffer: string; isStreaming: boolean; sandboxStatus: SandboxStatus | null; setVertical: (v: Vertical) => void; setPrompt: (p: DemoPrompt) => void; setSession: (s: DemoSession | null) => void; appendStream: (c: string) => void; resetStream: () => void; setStreaming: (b: boolean) => void; setSandboxStatus: (s: SandboxStatus | null) => void }
EOF

# ── store/demoStore.ts ────────────────────────────────────────────────────────
cat > $SRC/store/demoStore.ts << 'EOF'
import { create } from 'zustand'
import type { DemoStore, Vertical, DemoPrompt, DemoSession, SandboxStatus } from '@/types'
export const useDemoStore = create<DemoStore>((set) => ({
  selectedVertical: 'edtech', selectedPrompt: null, currentSession: null,
  streamBuffer: '', isStreaming: false, sandboxStatus: null,
  setVertical: (v: Vertical) => set({ selectedVertical: v, selectedPrompt: null }),
  setPrompt: (p: DemoPrompt) => set({ selectedPrompt: p }),
  setSession: (s: DemoSession | null) => set({ currentSession: s }),
  appendStream: (c: string) => set((st) => ({ streamBuffer: st.streamBuffer + c })),
  resetStream: () => set({ streamBuffer: '', isStreaming: false }),
  setStreaming: (b: boolean) => set({ isStreaming: b }),
  setSandboxStatus: (s: SandboxStatus | null) => set({ sandboxStatus: s }),
}))
EOF

# ── lib/supabase.ts ───────────────────────────────────────────────────────────
cat > $SRC/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(url, key)
export const db = { demoSessions: () => supabase.from('demo_sessions'), clients: () => supabase.from('clients'), promptLibrary: () => supabase.from('prompt_library') }
EOF

# ── lib/api.ts ────────────────────────────────────────────────────────────────
cat > $SRC/lib/api.ts << 'EOF'
import type { StreamChunk, Vertical, AgentType, SandboxStatus } from '@/types'
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export async function startDemoSession(p: { vertical: Vertical; agent_type: AgentType; prompt: string; client_id?: string }): Promise<{ session_id: string }> {
  const r = await fetch(`${BASE}/api/demo/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
  if (!r.ok) throw new Error('Failed to start session')
  return r.json()
}
export function streamSession(id: string, onChunk: (c: StreamChunk) => void, onDone: () => void, onError: (e: Error) => void): () => void {
  const es = new EventSource(`${BASE}/api/demo/sessions/${id}/stream`)
  es.onmessage = (e) => { try { const c: StreamChunk = JSON.parse(e.data); onChunk(c); if (c.type === 'done') { es.close(); onDone() } } catch { onError(new Error('Parse error')) } }
  es.onerror = () => { es.close(); onError(new Error('Stream failed')) }
  return () => es.close()
}
export async function getPrompts(v: Vertical) { const r = await fetch(`${BASE}/api/prompts?vertical=${v}`); if (!r.ok) throw new Error('Failed'); return r.json() }
export async function getSandboxStatus(): Promise<SandboxStatus> { const r = await fetch(`${BASE}/api/sandbox/status`); if (!r.ok) throw new Error('Failed'); return r.json() }
export async function calculateRoi(p: { vertical: Vertical; dev_team_size: number; avg_hourly_rate: number; productivity_multiplier: number }) { const r = await fetch(`${BASE}/api/roi/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); if (!r.ok) throw new Error('Failed'); return r.json() }
EOF

# ── App.tsx ───────────────────────────────────────────────────────────────────
cat > $SRC/App.tsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DemoPage from '@/pages/demo/DemoPage'
import AdminPage from '@/pages/admin/AdminPage'
import Layout from '@/components/shared/Layout'
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } })
export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/demo" replace />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
EOF

# ── main.tsx ──────────────────────────────────────────────────────────────────
cat > $SRC/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
EOF

# ── Layout.tsx ────────────────────────────────────────────────────────────────
cat > $SRC/components/shared/Layout.tsx << 'EOF'
import { Outlet, NavLink } from 'react-router-dom'
import { Terminal, Settings } from 'lucide-react'
import SandboxStatusBadge from './SandboxStatusBadge'
const NAV = [{ to: '/demo', icon: Terminal, label: 'Demo Console' }, { to: '/admin', icon: Settings, label: 'Admin' }]
export default function Layout() {
  return (
    <div className="min-h-screen flex" style={{background:'#0a0b14',color:'#e5e7eb',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <aside style={{width:224,background:'#111224',borderRight:'1px solid #1e2035',display:'flex',flexDirection:'column',padding:'24px 16px',gap:8,flexShrink:0}}>
        <div style={{marginBottom:24,paddingLeft:8}}>
          <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:20,color:'#7085ff'}}>acl</span>
          <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:20,color:'#fff'}}> vibe</span>
          <div style={{fontSize:11,color:'#6b7280',marginTop:2}}>demo platform</div>
        </div>
        {NAV.map(({to,icon:Icon,label})=>(
          <NavLink key={to} to={to} style={({isActive})=>({display:'flex',alignItems:'center',gap:12,padding:'8px 12px',borderRadius:8,fontSize:14,textDecoration:'none',color:isActive?'#a5b4fc':'#9ca3af',background:isActive?'rgba(79,94,255,0.15)':'transparent',border:isActive?'1px solid rgba(79,94,255,0.4)':'1px solid transparent'})}>
            <Icon size={16}/>{label}
          </NavLink>
        ))}
        <div style={{marginTop:'auto'}}><SandboxStatusBadge/></div>
      </aside>
      <main style={{flex:1,overflow:'hidden'}}><Outlet/></main>
    </div>
  )
}
EOF

# ── SandboxStatusBadge.tsx ────────────────────────────────────────────────────
cat > $SRC/components/shared/SandboxStatusBadge.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { getSandboxStatus } from '@/lib/api'
export default function SandboxStatusBadge() {
  const { data, isError } = useQuery({ queryKey: ['sandbox-status'], queryFn: getSandboxStatus, refetchInterval: 10000 })
  const status = isError ? 'error' : data?.status ?? 'stopped'
  return (
    <div style={{padding:'8px 12px',borderRadius:8,background:'#1e2035',border:'1px solid #2a2c45',fontSize:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:status==='running'?'#4ade80':status==='error'?'#f87171':'#6b7280',display:'inline-block'}}/>
        <span style={{color:'#d1d5db',fontFamily:'JetBrains Mono,monospace'}}>NemoClaw</span>
      </div>
      <div style={{color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{data?.model??'not connected'}</div>
    </div>
  )
}
EOF

# ── VerticalSelector.tsx ──────────────────────────────────────────────────────
cat > $SRC/components/demo/VerticalSelector.tsx << 'EOF'
import { VERTICALS, type Vertical } from '@/types'
import { useDemoStore } from '@/store/demoStore'
export default function VerticalSelector() {
  const { selectedVertical, setVertical } = useDemoStore()
  return (
    <div style={{display:'flex',gap:8}}>
      {(Object.entries(VERTICALS) as [Vertical,typeof VERTICALS[Vertical]][]).map(([key,{label,icon,color}])=>(
        <button key={key} onClick={()=>setVertical(key)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:8,fontSize:14,cursor:'pointer',border:`1px solid ${selectedVertical===key?color:'#1e2035'}`,background:selectedVertical===key?`${color}18`:'transparent',color:selectedVertical===key?'#fff':'#9ca3af',transition:'all 0.15s'}}>
          <span style={{fontSize:14}}>{icon}</span>{label}
        </button>
      ))}
    </div>
  )
}
EOF

# ── PromptLibrary.tsx ─────────────────────────────────────────────────────────
cat > $SRC/components/demo/PromptLibrary.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { getPrompts } from '@/lib/api'
import { useDemoStore } from '@/store/demoStore'
import type { Vertical, DemoPrompt } from '@/types'
export default function PromptLibrary({ vertical }: { vertical: Vertical }) {
  const { selectedPrompt, setPrompt } = useDemoStore()
  const { data: prompts = [], isLoading } = useQuery<DemoPrompt[]>({ queryKey: ['prompts', vertical], queryFn: () => getPrompts(vertical) })
  if (isLoading) return <div style={{padding:16}}>{[...Array(4)].map((_,i)=><div key={i} style={{height:64,borderRadius:8,background:'#1e2035',marginBottom:8}}/>)}</div>
  return (
    <div style={{padding:16}}>
      <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'JetBrains Mono,monospace'}}>Scenarios</div>
      {prompts.map(p=>{
        const sel = selectedPrompt?.id===p.id
        return (
          <button key={p.id} onClick={()=>setPrompt(p)} style={{width:'100%',textAlign:'left',padding:12,borderRadius:8,border:`1px solid ${sel?'rgba(79,94,255,0.5)':'#1e2035'}`,background:sel?'rgba(79,94,255,0.1)':'transparent',color:sel?'#fff':'#9ca3af',marginBottom:8,cursor:'pointer',transition:'all 0.15s'}}>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4,fontFamily:'JetBrains Mono,monospace'}}>{p.agent_type}</div>
            <div style={{fontSize:14,fontWeight:500,lineHeight:1.3}}>{p.title}</div>
            {p.tags.length>0&&<div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>{p.tags.slice(0,2).map(t=><span key={t} style={{fontSize:11,padding:'2px 6px',borderRadius:4,background:'#1e2035',color:'#6b7280'}}>{t}</span>)}</div>}
          </button>
        )
      })}
      {prompts.length===0&&<div style={{fontSize:13,color:'#4b5563'}}>No scenarios loaded — run DB seed</div>}
    </div>
  )
}
EOF

# ── AgentConsole.tsx ──────────────────────────────────────────────────────────
cat > $SRC/components/demo/AgentConsole.tsx << 'EOF'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useDemoStore } from '@/store/demoStore'
import { startDemoSession, streamSession } from '@/lib/api'
import type { StreamChunk } from '@/types'
export default function AgentConsole() {
  const { selectedPrompt, selectedVertical, streamBuffer, isStreaming, appendStream, resetStream, setStreaming } = useDemoStore()
  const [error, setError] = useState<string|null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const stopRef = useRef<(()=>void)|null>(null)
  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight }, [streamBuffer])
  const handleRun = useCallback(async () => {
    if (!selectedPrompt || isStreaming) return
    setError(null); resetStream(); setStreaming(true)
    try {
      const { session_id } = await startDemoSession({ vertical: selectedVertical, agent_type: selectedPrompt.agent_type, prompt: selectedPrompt.prompt })
      stopRef.current = streamSession(session_id, (c: StreamChunk) => { if (c.type==='token') appendStream(c.content) }, () => setStreaming(false), (e) => { setError(e.message); setStreaming(false) })
    } catch(e) { setError(e instanceof Error?e.message:'Failed'); setStreaming(false) }
  }, [selectedPrompt, selectedVertical, isStreaming, appendStream, resetStream, setStreaming])
  const handleStop = () => { stopRef.current?.(); setStreaming(false) }
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#0a0b14'}}>
      <div style={{borderBottom:'1px solid #1e2035',padding:16,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexShrink:0}}>
        {selectedPrompt ? (
          <>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:'#fff',marginBottom:4}}>{selectedPrompt.title}</div>
              <div style={{fontSize:12,color:'#6b7280',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{selectedPrompt.prompt}</div>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              {isStreaming
                ? <button onClick={handleStop} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.4)',color:'#f87171',fontSize:14,cursor:'pointer'}}>■ Stop</button>
                : <button onClick={handleRun} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,background:'#4f5eff',border:'none',color:'#fff',fontSize:14,cursor:'pointer',opacity:selectedPrompt?1:0.4}}>▶ Run Demo</button>
              }
              {streamBuffer&&!isStreaming&&<button onClick={resetStream} style={{padding:'8px 12px',borderRadius:8,background:'transparent',border:'1px solid #1e2035',color:'#6b7280',fontSize:14,cursor:'pointer'}}>↺</button>}
            </div>
          </>
        ) : <div style={{fontSize:14,color:'#4b5563'}}>← Select a scenario from the library</div>}
      </div>
      <div ref={outputRef} style={{flex:1,overflowY:'auto',padding:24,fontFamily:'JetBrains Mono,monospace',fontSize:13}}>
        {error&&<div style={{padding:'12px 16px',borderRadius:8,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171',marginBottom:16}}>{error}</div>}
        {!streamBuffer&&!isStreaming&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#374151',gap:12}}><div style={{fontSize:40}}>🦞</div><div style={{fontSize:14}}>Agent ready. Select a scenario and run.</div></div>}
        {streamBuffer&&<div style={{color:'#e5e7eb',whiteSpace:'pre-wrap',lineHeight:1.7}}>{streamBuffer}{isStreaming&&<span style={{display:'inline-block',width:8,height:16,background:'#7085ff',marginLeft:2,animation:'blink 1s infinite'}}/>}</div>}
      </div>
      <div style={{borderTop:'1px solid #1e2035',padding:'8px 16px',display:'flex',gap:16,fontSize:12,color:'#4b5563',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>
        <span>acl-demo</span><span>·</span><span>claude-sonnet-4-6</span><span>·</span>
        <span style={{color:isStreaming?'#7085ff':'#4b5563'}}>{isStreaming?'● streaming':'idle'}</span>
        {streamBuffer&&<><span>·</span><span>{streamBuffer.length.toLocaleString()} chars</span></>}
      </div>
    </div>
  )
}
EOF

# ── SecurityPanel.tsx ─────────────────────────────────────────────────────────
cat > $SRC/components/security/SecurityPanel.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { getSandboxStatus } from '@/lib/api'
const LAYERS = [
  { name: 'Landlock', desc: 'Filesystem isolation — agent writes only to /sandbox and /tmp' },
  { name: 'seccomp', desc: 'Syscall filter — blocks dangerous kernel calls (ptrace, mount)' },
  { name: 'netns', desc: 'Network namespace — all egress routed through OpenShell gateway' },
  { name: 'OpenShell', desc: 'Policy engine — every outbound request evaluated against YAML rules' },
]
export default function SecurityPanel() {
  const { data: sb, isLoading } = useQuery({ queryKey: ['sandbox-status'], queryFn: getSandboxStatus, refetchInterval: 5000 })
  return (
    <div style={{height:'100%',overflowY:'auto',padding:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
        <div style={{padding:8,borderRadius:8,background:'rgba(79,94,255,0.1)',border:'1px solid rgba(79,94,255,0.3)',fontSize:20}}>🛡️</div>
        <div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:18,color:'#fff'}}>Security governance</div>
          <div style={{fontSize:12,color:'#6b7280'}}>NemoClaw OpenShell — 4-layer kernel isolation</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,fontSize:13}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:sb?.status==='running'?'#4ade80':'#6b7280',display:'inline-block'}}/>
          <span style={{color:'#9ca3af',fontFamily:'JetBrains Mono,monospace'}}>{sb?.name??'acl-demo'}</span>
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'JetBrains Mono,monospace'}}>Isolation layers</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {LAYERS.map(l=>(
            <div key={l.name} style={{padding:16,borderRadius:8,background:'#111224',border:'1px solid #1e2035'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:'#7085ff',fontFamily:'JetBrains Mono,monospace'}}>🔒 {l.name}</span>
                <span style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
              </div>
              <div style={{fontSize:12,color:'#6b7280',lineHeight:1.6}}>{l.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'JetBrains Mono,monospace'}}>Network egress policy</div>
        {isLoading ? [...Array(4)].map((_,i)=><div key={i} style={{height:40,borderRadius:8,background:'#1e2035',marginBottom:8}}/>) :
          sb?.policies?.length ? sb.policies.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderRadius:8,border:`1px solid ${r.action==='allow'?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'}`,background:r.action==='allow'?'rgba(74,222,128,0.05)':'rgba(248,113,113,0.05)',marginBottom:8,fontSize:13,fontFamily:'JetBrains Mono,monospace',color:r.action==='allow'?'#4ade80':'#f87171'}}>
              <span>{r.action==='allow'?'✓':'✗'}</span>
              <span style={{flex:1}}>{r.host}:{r.port}</span>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:r.action==='allow'?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)'}}>{r.action}</span>
            </div>
          )) : <div style={{fontSize:13,color:'#4b5563',fontFamily:'JetBrains Mono,monospace'}}>Sandbox not connected</div>
        }
      </div>
      <div style={{padding:16,borderRadius:8,background:'rgba(79,94,255,0.05)',border:'1px solid rgba(79,94,255,0.2)'}}>
        <div style={{fontSize:11,color:'#7085ff',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>DEMO TALKING POINT</div>
        <div style={{fontSize:13,color:'#d1d5db',lineHeight:1.7}}>"Every network call the AI agent makes passes through this policy engine. The guardrails live <em>outside</em> the agent — even a compromised agent cannot override them. Your IT team owns this YAML file, versioned in Git, reviewed like code."</div>
      </div>
    </div>
  )
}
EOF

# ── RoiPanel.tsx ──────────────────────────────────────────────────────────────
cat > $SRC/components/roi/RoiPanel.tsx << 'EOF'
import { useState } from 'react'
import { useDemoStore } from '@/store/demoStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Vertical } from '@/types'
const MULT: Record<Vertical,number> = { edtech:3.2, retail:3.8, manufacturing:4.1, travel:3.5 }
const VLABEL: Record<Vertical,string> = { edtech:'EdTech', retail:'Retail', manufacturing:'Manufacturing', travel:'Travel' }
export default function RoiPanel() {
  const { selectedVertical } = useDemoStore()
  const [devs, setDevs] = useState(10)
  const [rate, setRate] = useState(85)
  const mult = MULT[selectedVertical]
  const saved = devs * rate * 12 * 48
  const payback = Math.ceil(180000 / (saved / 12))
  const chartData = [{ name:'Without AI', hours:40, fill:'#374151' }, { name:'With Vibe Coding', hours:Math.round(40/mult*10)/10, fill:'#4f5eff' }]
  const benchData = (Object.entries(MULT) as [Vertical,number][]).map(([v,m])=>({ name:VLABEL[v], multiplier:m, fill:v===selectedVertical?'#4f5eff':'#1e2035' }))
  return (
    <div style={{height:'100%',overflowY:'auto',padding:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
        <div style={{padding:8,borderRadius:8,background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.2)',fontSize:20}}>📈</div>
        <div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:18,color:'#fff'}}>ROI calculator</div>
          <div style={{fontSize:12,color:'#6b7280'}}>{VLABEL[selectedVertical]} · {mult}x productivity multiplier</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        {[{label:'Dev team size',min:3,max:100,val:devs,set:setDevs,display:`${devs} devs`},{label:'Avg hourly rate (USD)',min:40,max:200,step:5,val:rate,set:setRate,display:`$${rate}/hr`}].map(({label,min,max,val,set,display,step})=>(
          <div key={label} style={{padding:16,borderRadius:8,background:'#111224',border:'1px solid #1e2035'}}>
            <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>{label}</div>
            <input type="range" min={min} max={max} step={step??1} value={val} onChange={e=>set(Number(e.target.value))} style={{width:'100%',marginBottom:8,accentColor:'#4f5eff'}}/>
            <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:24,color:'#fff'}}>{display}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
        {[
          {label:'Annual savings', value:`$${(saved/1e6).toFixed(2)}M`, sub:`$${saved.toLocaleString()} / year`},
          {label:'Payback period', value:`${payback} months`, sub:'Based on $180K implementation'},
          {label:'Productivity gain', value:`${mult}x`, sub:'12 hrs saved per dev/week'},
          {label:'Hours reclaimed', value:(devs*12*48).toLocaleString(), sub:'developer hours per year'},
        ].map(({label,value,sub})=>(
          <div key={label} style={{padding:16,borderRadius:8,background:'#111224',border:'1px solid #1e2035'}}>
            <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{label}</div>
            <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:24,color:'#fff',marginBottom:4}}>{value}</div>
            <div style={{fontSize:12,color:'#6b7280'}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        {[{title:'Hours per task',data:chartData,key:'hours'},{title:'Multiplier by vertical',data:benchData,key:'multiplier'}].map(({title,data,key})=>(
          <div key={title} style={{padding:16,borderRadius:8,background:'#111224',border:'1px solid #1e2035'}}>
            <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>{title}</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#111224',border:'1px solid #1e2035',borderRadius:8,fontSize:12}} labelStyle={{color:'#9ca3af'}} itemStyle={{color:'#fff'}}/>
                <Bar dataKey={key} radius={[4,4,0,0]}>{data.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
      <div style={{padding:16,borderRadius:8,background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.2)'}}>
        <div style={{fontSize:11,color:'#4ade80',fontFamily:'JetBrains Mono,monospace',marginBottom:8}}>DEMO TALKING POINT</div>
        <div style={{fontSize:13,color:'#d1d5db',lineHeight:1.7}}>
          "A {devs}-person {VLABEL[selectedVertical]} dev team saves <strong style={{color:'#fff'}}>${(saved/1e6).toFixed(1)}M annually</strong> with a <strong style={{color:'#fff'}}>{payback}-month payback</strong>. These numbers come from your own inputs — not our estimates."
        </div>
      </div>
    </div>
  )
}
EOF

# ── DemoPage.tsx ──────────────────────────────────────────────────────────────
cat > $SRC/pages/demo/DemoPage.tsx << 'EOF'
import { useState } from 'react'
import VerticalSelector from '@/components/demo/VerticalSelector'
import PromptLibrary from '@/components/demo/PromptLibrary'
import AgentConsole from '@/components/demo/AgentConsole'
import SecurityPanel from '@/components/security/SecurityPanel'
import RoiPanel from '@/components/roi/RoiPanel'
import { useDemoStore } from '@/store/demoStore'
type Panel = 'console' | 'security' | 'roi'
const PANEL_LABELS: Record<Panel,string> = { console:'Agent Console', security:'Security Story', roi:'ROI Calculator' }
export default function DemoPage() {
  const [panel, setPanel] = useState<Panel>('console')
  const { selectedVertical } = useDemoStore()
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{borderBottom:'1px solid #1e2035',background:'#111224',padding:'12px 24px',display:'flex',alignItems:'center',gap:24,flexShrink:0}}>
        <VerticalSelector/>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {(['console','security','roi'] as Panel[]).map(p=>(
            <button key={p} onClick={()=>setPanel(p)} style={{padding:'6px 16px',borderRadius:6,fontSize:14,cursor:'pointer',border:'none',background:panel===p?'#4f5eff':'transparent',color:panel===p?'#fff':'#9ca3af',transition:'all 0.15s'}}>
              {PANEL_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{width:280,borderRight:'1px solid #1e2035',overflowY:'auto',flexShrink:0}}>
          <PromptLibrary vertical={selectedVertical}/>
        </div>
        <div style={{flex:1,overflow:'hidden'}}>
          {panel==='console'&&<AgentConsole/>}
          {panel==='security'&&<SecurityPanel/>}
          {panel==='roi'&&<RoiPanel/>}
        </div>
      </div>
    </div>
  )
}
EOF

# ── AdminPage.tsx ─────────────────────────────────────────────────────────────
cat > $SRC/pages/admin/AdminPage.tsx << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/supabase'
import type { Client, DemoSession } from '@/types'
import { VERTICALS } from '@/types'
export default function AdminPage() {
  const { data: clients=[] } = useQuery<Client[]>({ queryKey:['clients'], queryFn: async()=>{ const {data}=await db.clients().select('*').order('created_at',{ascending:false}); return data??[] } })
  const { data: sessions=[] } = useQuery<DemoSession[]>({ queryKey:['sessions'], queryFn: async()=>{ const {data}=await db.demoSessions().select('*').order('created_at',{ascending:false}).limit(20); return data??[] } })
  const th = {padding:'10px 16px',fontSize:12,color:'#6b7280',fontWeight:400,textAlign:'left' as const,borderBottom:'1px solid #1e2035'}
  const td = {padding:'10px 16px',fontSize:13,borderBottom:'1px solid #1e2035',color:'#d1d5db'}
  return (
    <div style={{height:'100%',overflowY:'auto',padding:24}}>
      <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:20,color:'#fff',marginBottom:24}}>Admin dashboard</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:32}}>
        {[{l:'Total clients',v:clients.length},{l:'Total sessions',v:sessions.length},{l:'Verticals',v:4},{l:'Complete',v:sessions.filter(s=>s.status==='complete').length}].map(({l,v})=>(
          <div key={l} style={{padding:16,borderRadius:8,background:'#111224',border:'1px solid #1e2035'}}>
            <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{l}</div>
            <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:28,color:'#fff'}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'JetBrains Mono,monospace'}}>Recent sessions</div>
        <div style={{borderRadius:8,border:'1px solid #1e2035',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#111224'}}>
              {['Vertical','Agent','Status','Duration','Date'].map(h=><th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sessions.map(s=>(
                <tr key={s.id}>
                  <td style={td}>{VERTICALS[s.vertical]?.icon} {VERTICALS[s.vertical]?.label}</td>
                  <td style={{...td,fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{s.agent_type}</td>
                  <td style={td}><span style={{padding:'2px 8px',borderRadius:4,fontSize:12,fontFamily:'JetBrains Mono,monospace',background:s.status==='complete'?'rgba(74,222,128,0.1)':s.status==='error'?'rgba(248,113,113,0.1)':'rgba(79,94,255,0.1)',color:s.status==='complete'?'#4ade80':s.status==='error'?'#f87171':'#7085ff'}}>{s.status}</span></td>
                  <td style={{...td,fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{s.duration_ms?`${(s.duration_ms/1000).toFixed(1)}s`:'—'}</td>
                  <td style={{...td,color:'#6b7280',fontSize:12}}>{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {sessions.length===0&&<tr><td colSpan={5} style={{...td,textAlign:'center',color:'#4b5563',padding:32}}>No sessions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
EOF

echo ""
echo "✅ All files written. Now run: cd frontend && npm run dev"
