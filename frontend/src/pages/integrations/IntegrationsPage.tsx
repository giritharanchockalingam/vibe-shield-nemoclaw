import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { GitBranch, GitCommit, Database, Activity, Shield, Bot, Code, FileText, Wrench, AlertTriangle, CheckCircle2, Globe } from 'lucide-react'
import { getDoraMetrics, getGitCommits, getConnectedRepos } from '@/lib/api'

export default function IntegrationsPage() {
  const { data: dora } = useQuery({
    queryKey: ['dora-metrics'],
    queryFn: getDoraMetrics,
    refetchInterval: 10000,
  })
  const { data: commitsData } = useQuery({
    queryKey: ['git-commits'],
    queryFn: () => getGitCommits(undefined, 20),
    refetchInterval: 15000,
  })
  const { data: reposData } = useQuery({
    queryKey: ['connected-repos'],
    queryFn: getConnectedRepos,
  })

  const summary = dora?.summary || {}
  const commitTypes = dora?.commit_types || {}
  const repos = dora?.repos || []
  const methodology = dora?.methodology || {}
  const commits = commitsData?.commits || []
  const connectedRepos = reposData?.repos || []

  const typeChartData = [
    { name: 'feat', count: commitTypes.feat || 0, fill: '#4ade80' },
    { name: 'fix', count: commitTypes.fix || 0, fill: '#ef4444' },
    { name: 'docs', count: commitTypes.docs || 0, fill: '#06b6d4' },
    { name: 'refactor', count: commitTypes.refactor || 0, fill: '#f59e0b' },
    { name: 'security', count: commitTypes.security || 0, fill: '#8b5cf6' },
  ].filter(d => d.count > 0)

  const agentPieData = [
    { name: 'Agent-Assisted', value: summary.agent_commits || 0, fill: '#4f5eff' },
    { name: 'Human Only', value: (summary.total_commits || 0) - (summary.agent_commits || 0), fill: '#1e2035' },
  ]

  const langColors: Record<string, string> = { TypeScript: '#3178c6', Python: '#3572A5', Swift: '#F05138' }

  function timeAgo(ts: string): string {
    const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const th: React.CSSProperties = {
    padding: '10px 14px', fontSize: 11, color: '#8b8fa8', fontWeight: 500,
    textAlign: 'left', borderBottom: '1px solid #1e2035', textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const td: React.CSSProperties = {
    padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #1e2035', color: '#c8cae0',
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0' }}>
            Live Integrations
          </div>
          <div style={{ fontSize: 12, color: '#8b8fa8', marginTop: 2 }}>
            Real DORA metrics from {summary.active_repos || 0} connected GitHub repositories
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6,
          background: dora?.data_source === 'supabase' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${dora?.data_source === 'supabase' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <Database size={11} style={{ color: dora?.data_source === 'supabase' ? '#4ade80' : '#ef4444' }} />
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
            color: dora?.data_source === 'supabase' ? '#4ade80' : '#ef4444',
          }}>
            {dora?.data_source === 'supabase' ? 'LIVE DATA · GitHub' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      {/* Top KPIs — real numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Commits', value: summary.total_commits || 0, icon: GitCommit, color: '#e2e4f0' },
          { label: 'Agent-Assisted', value: `${summary.agent_commit_ratio_pct || 0}%`, icon: Bot, color: '#4f5eff' },
          { label: 'Active Repos', value: summary.active_repos || 0, icon: GitBranch, color: '#4ade80' },
          { label: 'Commits/Day', value: summary.commits_per_day || 0, icon: Activity, color: '#06b6d4' },
          { label: 'Fix Ratio', value: `${dora?.dora?.fix_ratio_pct || 0}%`, icon: AlertTriangle, color: '#ef4444' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ padding: 16, borderRadius: 10, background: '#111224', border: '1px solid #1e2035' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={12} style={{ color: kpi.color }} />
                <span style={{ fontSize: 10, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{kpi.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row: Agent vs Human + Commit Types */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Agent vs Human Pie */}
        <div style={{ borderRadius: 10, background: '#111224', border: '1px solid #1e2035', padding: 16 }}>
          <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={12} /> Agent vs Human Commits
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width="50%" height={120}>
              <PieChart>
                <Pie data={agentPieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} strokeWidth={0}>
                  {agentPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#4f5eff' }}>{summary.agent_commit_ratio_pct || 0}%</span>
                <span style={{ fontSize: 11, color: '#8b8fa8', marginLeft: 6 }}>agent-assisted</span>
              </div>
              <div style={{ fontSize: 11, color: '#5a5e78' }}>
                {summary.agent_commits || 0} of {summary.total_commits || 0} commits co-authored with Claude
              </div>
              <div style={{ fontSize: 10, color: '#4f5eff', fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>
                Detection: {methodology.agent_detection || 'Co-Author header'}
              </div>
            </div>
          </div>
        </div>

        {/* Commit Types Bar Chart */}
        <div style={{ borderRadius: 10, background: '#111224', border: '1px solid #1e2035', padding: 16 }}>
          <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Code size={12} /> Commit Type Distribution
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={typeChartData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fill: '#8b8fa8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b8fa8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111224', border: '1px solid #1e2035', borderRadius: 8, fontSize: 11, color: '#e2e4f0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {typeChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Repo Breakdown */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <GitBranch size={12} /> Connected Repositories — Per-Repo DORA
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {repos.map((repo: any, i: number) => (
            <motion.div key={repo.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
              style={{ padding: 14, borderRadius: 10, background: '#111224', border: '1px solid #1e2035' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Globe size={12} style={{ color: langColors[repo.language] || '#8b8fa8' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e4f0' }}>{repo.name}</span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 3, marginLeft: 'auto',
                  background: `${langColors[repo.language] || '#8b8fa8'}20`,
                  color: langColors[repo.language] || '#8b8fa8',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{repo.language}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#5a5e78', textTransform: 'uppercase' }}>Commits</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#e2e4f0' }}>{repo.commits}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#5a5e78', textTransform: 'uppercase' }}>Agent %</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#4f5eff' }}>{repo.agent_ratio}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#5a5e78', textTransform: 'uppercase' }}>Fix Ratio</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: repo.fix_ratio > 60 ? '#ef4444' : '#f59e0b' }}>{repo.fix_ratio}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#5a5e78', textTransform: 'uppercase' }}>Fixes</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#c8cae0' }}>{repo.fixes}</div>
                </div>
              </div>
              {/* Agent ratio bar */}
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: '#1e2035', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${repo.agent_ratio}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  style={{ height: '100%', background: '#4f5eff', borderRadius: 2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Commits Feed — real git history */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <GitCommit size={12} /> Live Commit Feed
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginLeft: 4 }}
          />
        </div>
        <div style={{ borderRadius: 10, border: '1px solid #1e2035', overflow: 'hidden', background: '#111224' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0e1a' }}>
                {['Time', 'Repo', 'Type', 'Agent', 'Message'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commits.slice(0, 15).map((c: any, i: number) => {
                const repoName = c.github_repos?.name || '—'
                const typeColors: Record<string, string> = { feat: '#4ade80', fix: '#ef4444', docs: '#06b6d4', refactor: '#f59e0b', security: '#8b5cf6', chore: '#8b8fa8' }
                return (
                  <motion.tr key={c.sha || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5a5e78', whiteSpace: 'nowrap', width: 70 }}>
                      {timeAgo(c.committed_at)}
                    </td>
                    <td style={{ ...td, fontSize: 11 }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 3, fontSize: 10,
                        background: `${langColors[c.github_repos?.language] || '#8b8fa8'}15`,
                        color: langColors[c.github_repos?.language] || '#8b8fa8',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>{repoName}</span>
                    </td>
                    <td style={td}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                        color: typeColors[c.commit_type] || '#8b8fa8',
                      }}>{c.commit_type}</span>
                    </td>
                    <td style={td}>
                      {c.is_agent_assisted ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Bot size={11} style={{ color: '#4f5eff' }} />
                          <span style={{ fontSize: 10, color: '#4f5eff', fontWeight: 600 }}>Claude</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#5a5e78' }}>human</span>
                      )}
                    </td>
                    <td style={{ ...td, fontSize: 11, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.message}
                    </td>
                  </motion.tr>
                )
              })}
              {commits.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#5a5e78', padding: 32 }}>
                    Waiting for GitHub data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Transparency — the anti-bluff section */}
      <div style={{ padding: 14, borderRadius: 10, background: 'rgba(79,94,255,0.05)', border: '1px solid rgba(79,94,255,0.2)' }}>
        <div style={{ fontSize: 10, color: '#4f5eff', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, fontWeight: 600 }}>DATA PROVENANCE — HOW THESE METRICS ARE COMPUTED</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Agent Detection', value: methodology.agent_detection || 'Co-Author-By header containing Claude', icon: Bot },
            { label: 'Fix Ratio (CFR Proxy)', value: methodology.fix_ratio || 'Commits prefixed "fix:" / total commits', icon: AlertTriangle },
            { label: 'Commit Velocity', value: methodology.commit_velocity || 'Total commits / active development days', icon: Activity },
            { label: 'Data Range', value: methodology.data_range || 'Real git history', icon: Database },
          ].map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                <Icon size={12} style={{ color: '#4f5eff', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#8b8fa8', fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#c8cae0', fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
