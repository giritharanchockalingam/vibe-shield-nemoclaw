import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(url, key)
export const db = { demoSessions: () => supabase.from('demo_sessions'), clients: () => supabase.from('clients'), promptLibrary: () => supabase.from('prompt_library') }

// Direct Supabase queries for GitHub / DORA data (no backend needed)
export async function fetchGitRepos() {
  const { data, error } = await supabase.from('github_repos').select('*').order('last_synced_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchGitCommits(repo?: string, limit = 50) {
  let q = supabase.from('git_commits').select('*, github_repos(name, language)').order('committed_at', { ascending: false }).limit(limit)
  if (repo) q = q.eq('repo_id', repo)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchDoraRealtime() {
  const { data, error } = await supabase.from('dora_realtime').select('*')
  if (error) throw error
  return data?.[0] || null
}

export async function fetchGovernanceStats() {
  const { data, error } = await supabase.from('nemoclaw_dashboard_stats').select('*')
  if (error) throw error
  return data?.[0] || null
}

export async function fetchAuditEvents(limit = 50) {
  const { data, error } = await supabase.from('nemoclaw_audit_events').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}
