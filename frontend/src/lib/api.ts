import type { StreamChunk, Vertical, AgentType, SandboxStatus } from '@/types'
import { fetchGitRepos, fetchGitCommits, fetchDoraRealtime, fetchGovernanceStats, fetchAuditEvents } from './supabase'
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

// NemoClaw Governance APIs
export async function getGovernancePolicy() { const r = await fetch(`${BASE}/api/governance/policy`); if (!r.ok) throw new Error('Failed'); return r.json() }
export async function getGovernanceRules() { const r = await fetch(`${BASE}/api/governance/rules`); if (!r.ok) throw new Error('Failed'); return r.json() }
export async function getGovernanceAudit(limit: number = 50) {
  try { return await fetchAuditEvents(limit) }
  catch { const r = await fetch(`${BASE}/api/governance/audit?limit=${limit}`); if (!r.ok) throw new Error('Failed'); return r.json() }
}
export async function getGovernanceStats() {
  try {
    const s = await fetchGovernanceStats()
    if (s) return {
      total_events: s.total_events || 0,
      total_blocked: s.total_blocked || 0,
      total_allowed: s.total_allowed || 0,
      critical_blocked: s.critical_blocked || 0,
      high_blocked: s.high_blocked || 0,
      by_layer: {
        netns: s.netns_events || 0,
        seccomp: s.seccomp_events || 0,
        landlock: s.landlock_events || 0,
        openshell: s.openshell_events || 0,
        gateway: s.gateway_events || 0,
      },
      by_severity: {
        critical: s.critical_blocked || 0,
        high: s.high_blocked || 0,
        medium: s.medium_blocked || 0,
        low: s.low_blocked || 0,
      },
      data_source: 'supabase',
    }
    throw new Error('No data')
  } catch {
    const r = await fetch(`${BASE}/api/governance/stats`); if (!r.ok) throw new Error('Failed'); return r.json()
  }
}

// Governance Agent — LLM chat via backend
export async function chatWithGovernanceAgent(message: string, context: { governanceStats?: unknown; auditEvents?: unknown; doraMetrics?: unknown }): Promise<string> {
  const r = await fetch(`${BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  if (!r.ok) {
    const err = await r.text().catch(() => 'Agent request failed')
    throw new Error(err)
  }
  const data = await r.json()
  return data.response
}

// Admin telemetry — comprehensive real data from Supabase
export async function getAdminTelemetry() { const r = await fetch(`${BASE}/api/admin/telemetry`); if (!r.ok) throw new Error('Failed'); return r.json() }

// Demo sessions — Supabase-first
export async function getDemoSessions(limit: number = 50) {
  try {
    const { data, error } = await (await import('./supabase')).supabase.from('demo_sessions').select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return data
  } catch { const r = await fetch(`${BASE}/api/demo/sessions?limit=${limit}`); if (!r.ok) throw new Error('Failed'); return r.json() }
}

// Clients — Supabase-first
export async function getClients() {
  try {
    const { data, error } = await (await import('./supabase')).supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch { const r = await fetch(`${BASE}/api/clients`); if (!r.ok) throw new Error('Failed'); return r.json() }
}

// GitHub Integration — Real DORA Metrics (Supabase-first, backend fallback)
export async function getConnectedRepos() {
  try {
    const repos = await fetchGitRepos()
    return { repos }
  } catch { const r = await fetch(`${BASE}/api/integrations/github/repos`); if (!r.ok) throw new Error('Failed'); return r.json() }
}
export async function getGitCommits(repo?: string, limit: number = 30) {
  try {
    const commits = await fetchGitCommits(repo, limit)
    return { commits }
  } catch { const q = repo ? `?repo=${repo}&limit=${limit}` : `?limit=${limit}`; const r = await fetch(`${BASE}/api/integrations/github/commits${q}`); if (!r.ok) throw new Error('Failed'); return r.json() }
}
export async function getDoraMetrics() {
  try {
    const d = await fetchDoraRealtime()
    if (!d) throw new Error('No data')
    // Reshape flat Supabase view into the nested structure the UI expects
    return {
      summary: {
        total_commits: d.total_commits,
        agent_commits: d.agent_commits,
        agent_commit_ratio_pct: d.agent_commit_ratio_pct,
        active_repos: d.active_repos,
        active_days: d.active_days,
        commits_per_day: d.commits_per_day,
      },
      commit_types: {
        feat: d.feat_count,
        fix: d.fix_count,
        security: d.security_count,
        refactor: d.refactor_count,
        docs: d.docs_count,
      },
      dora: {
        fix_ratio_pct: d.fix_ratio_pct,
        first_commit: d.first_commit,
        last_commit: d.last_commit,
      },
      repos: d.repos_breakdown || [],
      data_source: 'supabase',
      methodology: {
        lead_time: 'Median hours from first commit to production merge per feature branch',
        change_failure_rate: 'Ratio of fix: prefixed commits to total commits (proxy)',
        deployment_frequency: 'Commits per active day across all connected repositories',
        mttr: 'Median time between a bug-introducing commit and its corresponding fix: commit',
        agent_assisted_ratio: 'Percentage of commits containing Co-Authored-By: Claude header',
        agent_detection: 'Co-Author header',
      },
    }
  } catch {
    const r = await fetch(`${BASE}/api/integrations/dora`); if (!r.ok) throw new Error('Failed'); return r.json()
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CISO Command Center APIs — Live Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getCisoAgents() {
  const r = await fetch(`${BASE}/api/ciso/agents`)
  if (!r.ok) throw new Error('Failed to fetch agents')
  return r.json()
}

export async function getCisoChanges(limit: number = 20) {
  const r = await fetch(`${BASE}/api/ciso/changes?limit=${limit}`)
  if (!r.ok) throw new Error('Failed to fetch changes')
  return r.json()
}

export async function createCisoChange(data: { agent_id: string; action: string; approver?: string; risk_classification?: string; business_owner?: string }) {
  const r = await fetch(`${BASE}/api/ciso/changes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!r.ok) throw new Error('Failed to create change')
  return r.json()
}

export async function getCisoPolicyEnforcement() {
  const r = await fetch(`${BASE}/api/ciso/policy-enforcement`)
  if (!r.ok) throw new Error('Failed to fetch policy enforcement')
  return r.json()
}

export async function getCisoSiem() {
  const r = await fetch(`${BASE}/api/ciso/siem`)
  if (!r.ok) throw new Error('Failed to fetch SIEM')
  return r.json()
}

export async function getCisoIncidents(limit: number = 10) {
  const r = await fetch(`${BASE}/api/ciso/incidents?limit=${limit}`)
  if (!r.ok) throw new Error('Failed to fetch incidents')
  return r.json()
}

export async function getCisoCompliance() {
  const r = await fetch(`${BASE}/api/ciso/compliance`)
  if (!r.ok) throw new Error('Failed to fetch compliance')
  return r.json()
}

export async function getCisoKpis() {
  const r = await fetch(`${BASE}/api/ciso/kpis`)
  if (!r.ok) throw new Error('Failed to fetch KPIs')
  return r.json()
}

export async function getGithubRepos() {
  const r = await fetch(`${BASE}/api/github/repos`)
  if (!r.ok) throw new Error('Failed to fetch repos')
  return r.json()
}

export async function getGithubTree(org: string, repo: string) {
  const r = await fetch(`${BASE}/api/github/tree/${org}/${repo}`)
  if (!r.ok) throw new Error('Failed to fetch tree')
  return r.json()
}

export async function getGithubFile(org: string, repo: string, path: string) {
  const r = await fetch(`${BASE}/api/github/file/${org}/${repo}/${path}`)
  if (!r.ok) throw new Error('Failed to fetch file')
  return r.json()
}

export async function getJiraIssues() {
  const r = await fetch(`${BASE}/api/jira/issues`)
  if (!r.ok) throw new Error('Failed to fetch issues')
  return r.json()
}

export async function runTests(repo: string, files?: string[]) {
  const r = await fetch(`${BASE}/api/tests/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo, files }) })
  if (!r.ok) throw new Error('Failed to run tests')
  return r.json()
}
