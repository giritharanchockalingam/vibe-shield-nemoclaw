import { useState, useMemo } from 'react'
import { useResponsive } from '@/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Shield, Bot, Code, Wrench, CheckCircle2, ExternalLink,
  Search, RefreshCw, Plug, Eye, Clock, Zap, Bug, TestTube2,
  MessageSquare, BarChart3, FileText, Palette, Server, Lock, Cloud,
  Activity, Layers, ArrowRight, ChevronDown, ChevronUp, X
} from 'lucide-react'

// ── Integration Data Model ─────────────────────────────────────────
interface Integration {
  id: string
  name: string
  category: Category
  tier: 'Free' | 'Freemium' | 'Paid' | 'Enterprise'
  status: 'connected' | 'available' | 'coming_soon'
  description: string
  features: string[]
  url?: string
  docsUrl?: string
  icon: string       // emoji or short label for colored avatar
  iconBg: string     // background color
  iconColor: string  // text/icon color
}

type Category =
  | 'Source Control'
  | 'Project Management'
  | 'Communication'
  | 'CI/CD'
  | 'Code Quality'
  | 'Security'
  | 'Monitoring & Observability'
  | 'Documentation'
  | 'Design'
  | 'AI Assistants'

const CATEGORY_ICONS: Record<Category, any> = {
  'Source Control': GitBranch,
  'Project Management': Layers,
  'Communication': MessageSquare,
  'CI/CD': Server,
  'Code Quality': Code,
  'Security': Shield,
  'Monitoring & Observability': BarChart3,
  'Documentation': FileText,
  'Design': Palette,
  'AI Assistants': Bot,
}

// ── All 30 Integrations ────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  // Source Control
  {
    id: 'github', name: 'GitHub', category: 'Source Control', tier: 'Free', status: 'connected',
    description: 'Source control, pull requests, issues, and GitHub Actions CI/CD. Free for public and private repos.',
    features: ['Repositories', 'Pull Requests', 'Issues', 'Commits'],
    url: 'https://github.com', docsUrl: 'https://docs.github.com/en/rest',
    icon: 'GH', iconBg: '#1e1e2e', iconColor: '#e2e4f0',
  },
  {
    id: 'gitlab', name: 'GitLab', category: 'Source Control', tier: 'Freemium', status: 'coming_soon',
    description: 'GitLab for source control, merge requests, CI/CD pipelines, and container registry.',
    features: ['Repositories', 'Merge Requests', 'CI/CD Pipelines', 'Issues'],
    url: 'https://gitlab.com',
    icon: 'GL', iconBg: '#1e1430', iconColor: '#fc6d26',
  },
  {
    id: 'bitbucket', name: 'Bitbucket', category: 'Source Control', tier: 'Free', status: 'coming_soon',
    description: 'Atlassian Bitbucket for Git hosting, pull requests, and Bitbucket Pipelines.',
    features: ['Repositories', 'Pull Requests', 'Pipelines', 'Code Search'],
    url: 'https://bitbucket.org',
    icon: 'BB', iconBg: '#0e1a33', iconColor: '#2684ff',
  },

  // Project Management
  {
    id: 'jira', name: 'Jira Cloud', category: 'Project Management', tier: 'Free', status: 'available',
    description: 'Atlassian Jira Cloud for sprint planning, issue tracking, and agile boards. Free tier for up to 10 users.',
    features: ['Sprint Boards', 'Backlog', 'Epics', 'Velocity'],
    url: 'https://www.atlassian.com/software/jira/free', docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    icon: 'JR', iconBg: '#0e1a33', iconColor: '#2684ff',
  },
  {
    id: 'azure-devops', name: 'Azure DevOps', category: 'Project Management', tier: 'Freemium', status: 'coming_soon',
    description: 'Microsoft Azure DevOps for repos, boards, pipelines, and artifacts.',
    features: ['Repos', 'Boards', 'Pipelines', 'Test Plans'],
    url: 'https://azure.microsoft.com/en-us/products/devops',
    icon: 'AZ', iconBg: '#0e1a33', iconColor: '#0078d4',
  },
  {
    id: 'linear', name: 'Linear', category: 'Project Management', tier: 'Freemium', status: 'coming_soon',
    description: 'Linear for streamlined issue tracking, project management, and roadmaps.',
    features: ['Issues', 'Projects', 'Cycles', 'Roadmaps'],
    url: 'https://linear.app',
    icon: 'LN', iconBg: '#1a1530', iconColor: '#5e6ad2',
  },
  {
    id: 'servicenow', name: 'ServiceNow', category: 'Project Management', tier: 'Enterprise', status: 'coming_soon',
    description: 'ServiceNow for IT service management, incident tracking, and change management.',
    features: ['Incidents', 'Changes', 'Problems', 'CMDB'],
    url: 'https://www.servicenow.com',
    icon: 'SN', iconBg: '#1a2e1a', iconColor: '#81b532',
  },

  // Communication
  {
    id: 'activity-feed', name: 'Activity Feed', category: 'Communication', tier: 'Free', status: 'connected',
    description: 'Built-in real-time activity notifications from GitHub, CI/CD, and SDLC agents. Always available.',
    features: ['Commit Notifications', 'PR Updates', 'Build Status', 'Agent Activity'],
    icon: 'AF', iconBg: '#0e2820', iconColor: '#4ade80',
  },
  {
    id: 'slack', name: 'Slack', category: 'Communication', tier: 'Freemium', status: 'available',
    description: 'Slack for team messaging, channels, threads, and notifications.',
    features: ['Channels', 'Messages', 'Threads', 'Search'],
    url: 'https://slack.com',
    icon: 'SK', iconBg: '#2a1530', iconColor: '#e01e5a',
  },
  {
    id: 'ms-teams', name: 'Microsoft Teams', category: 'Communication', tier: 'Paid', status: 'coming_soon',
    description: 'Microsoft Teams for enterprise communication, channels, and meetings.',
    features: ['Channels', 'Chat', 'Meetings', 'Files'],
    url: 'https://www.microsoft.com/en-us/microsoft-teams/',
    icon: 'MT', iconBg: '#1a1540', iconColor: '#6264a7',
  },

  // CI/CD
  {
    id: 'github-actions', name: 'GitHub Actions', category: 'CI/CD', tier: 'Free', status: 'connected',
    description: 'GitHub-native CI/CD workflows. Automatically available when GitHub is connected.',
    features: ['Workflow Runs', 'Build Status', 'Deployment Checks', 'Auto-Triggers'],
    url: 'https://github.com/features/actions', docsUrl: 'https://docs.github.com/en/actions',
    icon: 'GA', iconBg: '#1e1e2e', iconColor: '#e2e4f0',
  },
  {
    id: 'vercel', name: 'Vercel', category: 'CI/CD', tier: 'Free', status: 'connected',
    description: 'Vercel for frontend and serverless deployment, preview environments, and edge functions.',
    features: ['Auto-Deploy', 'Preview URLs', 'Serverless Functions', 'Edge Network'],
    url: 'https://vercel.com', docsUrl: 'https://vercel.com/docs',
    icon: 'VC', iconBg: '#1e1e2e', iconColor: '#e2e4f0',
  },
  {
    id: 'jenkins', name: 'Jenkins', category: 'CI/CD', tier: 'Free', status: 'available',
    description: 'Jenkins for build automation, CI/CD pipelines, and deployment.',
    features: ['Build Jobs', 'Pipelines', 'Build History', 'Test Results'],
    url: 'https://www.jenkins.io',
    icon: 'JK', iconBg: '#1e1a1a', iconColor: '#d33833',
  },
  {
    id: 'circleci', name: 'CircleCI', category: 'CI/CD', tier: 'Freemium', status: 'coming_soon',
    description: 'CircleCI for continuous integration and delivery pipelines.',
    features: ['Pipelines', 'Workflows', 'Jobs', 'Insights'],
    url: 'https://circleci.com',
    icon: 'CI', iconBg: '#1e1e2e', iconColor: '#e2e4f0',
  },

  // Code Quality
  {
    id: 'metrics-engine', name: 'Code Metrics Engine', category: 'Code Quality', tier: 'Free', status: 'connected',
    description: 'Built-in Radon/Pylint-style code metrics: cyclomatic complexity, duplication, nesting depth, quality scores.',
    features: ['Cyclomatic Complexity', 'Duplication Detection', 'Naming Conventions', 'Quality Score'],
    icon: 'ME', iconBg: '#0e2820', iconColor: '#4ade80',
  },
  {
    id: 'sonarcloud', name: 'SonarCloud', category: 'Code Quality', tier: 'Free', status: 'available',
    description: 'Cloud-based code quality and security analysis. Free for open-source projects.',
    features: ['Quality Gates', 'Bug Detection', 'Vulnerability Scan', 'Code Smells'],
    url: 'https://sonarcloud.io',
    icon: 'SQ', iconBg: '#1a2a3a', iconColor: '#549dd0',
  },
  {
    id: 'sonarqube', name: 'SonarQube', category: 'Code Quality', tier: 'Enterprise', status: 'coming_soon',
    description: 'Self-hosted SonarQube for enterprise code quality and security analysis.',
    features: ['Quality Gates', 'Security Hotspots', 'Custom Rules', 'Branch Analysis'],
    url: 'https://www.sonarsource.com/products/sonarqube/',
    icon: 'SQ', iconBg: '#1a2a3a', iconColor: '#549dd0',
  },

  // Security
  {
    id: 'sast-engine', name: 'SAST Engine', category: 'Security', tier: 'Free', status: 'connected',
    description: 'Built-in 20-rule Semgrep-style SAST scanner. OWASP Top 10 coverage with CWE mapping.',
    features: ['OWASP Top 10', 'CWE Mapping', 'Severity Scoring', 'Fix Suggestions'],
    icon: 'SA', iconBg: '#1a0e28', iconColor: '#a855f7',
  },
  {
    id: 'snyk', name: 'Snyk', category: 'Security', tier: 'Freemium', status: 'available',
    description: 'Snyk for dependency vulnerability scanning and license compliance.',
    features: ['Dependency Scan', 'Container Scan', 'IaC Scan', 'License Compliance'],
    url: 'https://snyk.io',
    icon: 'SY', iconBg: '#1a1530', iconColor: '#8b5cf6',
  },
  {
    id: 'veracode', name: 'Veracode', category: 'Security', tier: 'Enterprise', status: 'coming_soon',
    description: 'Veracode for SAST, DAST, SCA, and application security testing.',
    features: ['Static Analysis', 'Dynamic Analysis', 'SCA', 'Policy Compliance'],
    url: 'https://www.veracode.com',
    icon: 'VR', iconBg: '#0e1a33', iconColor: '#00a5e0',
  },

  // Monitoring & Observability
  {
    id: 'datadog', name: 'Datadog', category: 'Monitoring & Observability', tier: 'Paid', status: 'coming_soon',
    description: 'Datadog for infrastructure monitoring, APM, log management, and alerting.',
    features: ['Dashboards', 'APM', 'Logs', 'Alerts'],
    url: 'https://www.datadoghq.com',
    icon: 'DD', iconBg: '#2a1a30', iconColor: '#632ca6',
  },
  {
    id: 'grafana', name: 'Grafana', category: 'Monitoring & Observability', tier: 'Freemium', status: 'available',
    description: 'Grafana for dashboards, alerting, and observability. Free self-hosted or Grafana Cloud free tier.',
    features: ['Dashboards', 'Alerts', 'Explore', 'Annotations'],
    url: 'https://grafana.com',
    icon: 'GF', iconBg: '#2a1a0e', iconColor: '#f46800',
  },
  {
    id: 'pagerduty', name: 'PagerDuty', category: 'Monitoring & Observability', tier: 'Paid', status: 'coming_soon',
    description: 'PagerDuty for incident management, on-call scheduling, and alerting.',
    features: ['Incidents', 'On-Call', 'Escalation Policies', 'Services'],
    url: 'https://www.pagerduty.com',
    icon: 'PD', iconBg: '#0e2a1a', iconColor: '#06ac38',
  },
  {
    id: 'newrelic', name: 'New Relic', category: 'Monitoring & Observability', tier: 'Freemium', status: 'coming_soon',
    description: 'New Relic for full-stack observability, APM, and error tracking. Generous free tier.',
    features: ['APM', 'Infrastructure', 'Logs', 'Browser'],
    url: 'https://newrelic.com',
    icon: 'NR', iconBg: '#0e1a28', iconColor: '#1ce783',
  },

  // Documentation
  {
    id: 'confluence', name: 'Confluence', category: 'Documentation', tier: 'Freemium', status: 'available',
    description: 'Atlassian Confluence for team documentation, knowledge base, and wikis.',
    features: ['Pages', 'Spaces', 'Search', 'Templates'],
    url: 'https://www.atlassian.com/software/confluence', docsUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/',
    icon: 'CF', iconBg: '#0e1a33', iconColor: '#2684ff',
  },
  {
    id: 'notion', name: 'Notion', category: 'Documentation', tier: 'Freemium', status: 'coming_soon',
    description: 'Notion for team wikis, project docs, and knowledge management.',
    features: ['Pages', 'Databases', 'Templates', 'API'],
    url: 'https://www.notion.so',
    icon: 'NT', iconBg: '#1e1e2e', iconColor: '#e2e4f0',
  },

  // Design
  {
    id: 'figma', name: 'Figma', category: 'Design', tier: 'Freemium', status: 'available',
    description: 'Figma for design files, components, and developer handoff.',
    features: ['Design Files', 'Components', 'Comments', 'Dev Mode'],
    url: 'https://www.figma.com',
    icon: 'FG', iconBg: '#1a1530', iconColor: '#a259ff',
  },

  // AI Assistants
  {
    id: 'claude', name: 'Claude AI', category: 'AI Assistants', tier: 'Freemium', status: 'connected',
    description: 'Anthropic Claude for intelligent code assistance, reviews, security analysis, and test generation.',
    features: ['Code Completion', 'Code Review', 'Test Generation', 'Security Analysis'],
    url: 'https://www.anthropic.com', docsUrl: 'https://docs.anthropic.com',
    icon: 'CL', iconBg: '#1a1530', iconColor: '#d4a574',
  },
  {
    id: 'openai', name: 'OpenAI', category: 'AI Assistants', tier: 'Freemium', status: 'available',
    description: 'GPT-4o and o1 models for code assistance. Pay-per-use API with free trial credits.',
    features: ['Code Completion', 'Code Review', 'Test Generation', 'Chat'],
    url: 'https://openai.com', docsUrl: 'https://platform.openai.com/docs',
    icon: 'OA', iconBg: '#0e2a1a', iconColor: '#10a37f',
  },
  {
    id: 'gemini', name: 'Google Gemini', category: 'AI Assistants', tier: 'Free', status: 'available',
    description: 'Google Gemini AI models. Free tier with 15 RPM. Excellent for code generation and multimodal tasks.',
    features: ['Code Completion', 'Code Review', 'Test Generation', 'Security Analysis'],
    url: 'https://ai.google.dev', docsUrl: 'https://ai.google.dev/gemini-api/docs',
    icon: 'GM', iconBg: '#0e1a33', iconColor: '#4285f4',
  },
]

const ALL_CATEGORIES: Category[] = [
  'Source Control', 'Project Management', 'Communication', 'CI/CD',
  'Code Quality', 'Security', 'Monitoring & Observability', 'Documentation',
  'Design', 'AI Assistants',
]

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  Free:       { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
  Freemium:   { bg: 'rgba(79,94,255,0.1)', color: '#4f5eff' },
  Paid:       { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  Enterprise: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
}

const STATUS_CONFIG = {
  connected:   { label: 'Connected', bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.3)' },
  available:   { label: 'Available', bg: 'rgba(79,94,255,0.1)', color: '#4f5eff', border: 'rgba(79,94,255,0.3)' },
  coming_soon: { label: 'Coming Soon', bg: 'rgba(139,143,168,0.08)', color: '#5a5e78', border: 'rgba(139,143,168,0.2)' },
}

// ── Component ──────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const { isMobile } = useResponsive()
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | 'connected' | 'available' | 'coming_soon'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Derived counts
  const counts = useMemo(() => ({
    total: INTEGRATIONS.length,
    connected: INTEGRATIONS.filter(i => i.status === 'connected').length,
    available: INTEGRATIONS.filter(i => i.status === 'available').length,
    coming_soon: INTEGRATIONS.filter(i => i.status === 'coming_soon').length,
  }), [])

  // Filtered integrations
  const filtered = useMemo(() => {
    return INTEGRATIONS.filter(i => {
      if (activeCategory !== 'all' && i.category !== activeCategory) return false
      if (activeStatus !== 'all' && i.status !== activeStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return i.name.toLowerCase().includes(q)
          || i.description.toLowerCase().includes(q)
          || i.features.some(f => f.toLowerCase().includes(q))
          || i.category.toLowerCase().includes(q)
      }
      return true
    })
  }, [activeCategory, activeStatus, searchQuery])

  // Group filtered by category
  const grouped = useMemo(() => {
    const map: Partial<Record<Category, Integration[]>> = {}
    for (const i of filtered) {
      if (!map[i.category]) map[i.category] = []
      map[i.category]!.push(i)
    }
    return map
  }, [filtered])

  const coveragePct = Math.round((counts.connected / counts.total) * 100)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: isMobile ? 12 : 24 }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, color: '#e2e4f0' }}>
            Integrations
          </div>
          <div style={{ fontSize: 12, color: '#8b8fa8', marginTop: 2 }}>
            Connect your SDLC toolchain for real-time DevSecOps intelligence
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            background: 'rgba(79,94,255,0.15)', border: '1px solid rgba(79,94,255,0.3)',
            color: '#4f5eff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Sync
        </motion.button>
      </div>

      {/* ─── Summary KPIs ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: counts.total, color: '#e2e4f0', icon: Plug },
          { label: 'Connected', value: counts.connected, color: '#4ade80', icon: CheckCircle2 },
          { label: 'Available', value: counts.available, color: '#4f5eff', icon: Zap },
          { label: 'Coming Soon', value: counts.coming_soon, color: '#5a5e78', icon: Clock },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 16, borderRadius: 10, background: '#111224', border: '1px solid #1e2035' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={12} style={{ color: kpi.color }} />
                <span style={{ fontSize: 10, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{kpi.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Search + Status Filters ─── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8,
          background: '#111224', border: '1px solid #1e2035', flex: isMobile ? '1 1 100%' : '1 1 280px', maxWidth: 360,
        }}>
          <Search size={14} style={{ color: '#5a5e78' }} />
          <input
            type="text" placeholder="Search integrations..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none', color: '#e2e4f0',
              fontSize: 12, width: '100%', fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={12} style={{ color: '#5a5e78' }} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'connected', 'available', 'coming_soon'] as const).map(s => {
            const active = activeStatus === s
            const label = s === 'all' ? 'All' : s === 'coming_soon' ? 'Coming Soon' : s.charAt(0).toUpperCase() + s.slice(1)
            return (
              <button key={s} onClick={() => setActiveStatus(s)}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: active ? 'rgba(79,94,255,0.15)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(79,94,255,0.3)' : '#1e2035'}`,
                  color: active ? '#4f5eff' : '#8b8fa8',
                  transition: 'all 0.15s ease',
                }}
              >{label}</button>
            )
          })}
        </div>
      </div>

      {/* ─── Main Content: Sidebar + Cards ─── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Category Sidebar */}
        {!isMobile && (
          <div style={{
            width: 200, flexShrink: 0, borderRadius: 10, background: '#111224', border: '1px solid #1e2035',
            padding: 12, position: 'sticky', top: 24,
          }}>
            <div style={{ fontSize: 10, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 10 }}>
              Categories
            </div>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6,
                background: activeCategory === 'all' ? 'rgba(79,94,255,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                color: activeCategory === 'all' ? '#4f5eff' : '#8b8fa8', fontSize: 11, fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={12} /> All Categories
            </button>
            {ALL_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat]
              const active = activeCategory === cat
              const count = INTEGRATIONS.filter(i => i.category === cat).length
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6,
                    background: active ? 'rgba(79,94,255,0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    color: active ? '#4f5eff' : '#8b8fa8', fontSize: 11, fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={12} />
                  <span style={{ flex: 1 }}>{cat}</span>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }}>{count}</span>
                </button>
              )
            })}

            {/* Health Overview */}
            <div style={{ marginTop: 16, padding: '12px 10px', borderTop: '1px solid #1e2035' }}>
              <div style={{ fontSize: 10, color: '#5a5e78', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 10 }}>
                Health Overview
              </div>
              <div style={{ fontSize: 10, color: '#8b8fa8', marginBottom: 6 }}>Coverage</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: '#4f5eff' }}>{coveragePct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#1e2035', overflow: 'hidden', marginBottom: 6 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${coveragePct}%` }} transition={{ duration: 1 }}
                  style={{ height: '100%', background: '#4f5eff', borderRadius: 2 }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#5a5e78' }}>
                {counts.connected} of {counts.total} integrations active
              </div>
            </div>
          </div>
        )}

        {/* Mobile Category Chips */}
        {isMobile && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8, width: '100%' }}>
            <button onClick={() => setActiveCategory('all')} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeCategory === 'all' ? 'rgba(79,94,255,0.15)' : '#111224',
              border: `1px solid ${activeCategory === 'all' ? 'rgba(79,94,255,0.3)' : '#1e2035'}`,
              color: activeCategory === 'all' ? '#4f5eff' : '#8b8fa8',
            }}>All</button>
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: activeCategory === cat ? 'rgba(79,94,255,0.15)' : '#111224',
                border: `1px solid ${activeCategory === cat ? 'rgba(79,94,255,0.3)' : '#1e2035'}`,
                color: activeCategory === cat ? '#4f5eff' : '#8b8fa8',
              }}>{cat}</button>
            ))}
          </div>
        )}

        {/* ─── Integration Cards Grid ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#5a5e78', fontSize: 13 }}>
              No integrations match your filters.
            </div>
          )}
          <AnimatePresence mode="wait">
            {ALL_CATEGORIES.filter(cat => grouped[cat]).map((cat) => (
              <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 24 }}
              >
                {/* Category Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  fontSize: 13, fontWeight: 700, color: '#e2e4f0', letterSpacing: '0.02em',
                }}>
                  {(() => { const Icon = CATEGORY_ICONS[cat]; return <Icon size={14} style={{ color: '#4f5eff' }} /> })()}
                  {cat}
                  <span style={{ fontSize: 10, color: '#5a5e78', fontWeight: 500 }}>({grouped[cat]!.length})</span>
                </div>

                {/* Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 12,
                }}>
                  {grouped[cat]!.map((intg, idx) => {
                    const sc = STATUS_CONFIG[intg.status]
                    const tc = TIER_COLORS[intg.tier]
                    const isExpanded = expandedCard === intg.id
                    return (
                      <motion.div key={intg.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{
                          borderRadius: 10, background: '#111224',
                          border: `1px solid ${intg.status === 'connected' ? 'rgba(74,222,128,0.2)' : '#1e2035'}`,
                          overflow: 'hidden', transition: 'border-color 0.2s ease',
                        }}
                      >
                        {/* Card Header */}
                        <div style={{ padding: 16, paddingBottom: isExpanded ? 0 : 16 }}>
                          {/* Top row: icon + name + badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            {/* Icon Avatar */}
                            <div style={{
                              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: intg.iconBg, border: `1px solid ${intg.iconColor}30`,
                              fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: intg.iconColor,
                            }}>
                              {intg.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e4f0' }}>{intg.name}</span>
                                {/* Tier Badge */}
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                                  background: tc.bg, color: tc.color, fontFamily: "'JetBrains Mono', monospace",
                                  textTransform: 'uppercase', letterSpacing: '0.04em',
                                }}>{intg.tier}</span>
                                {/* Status Badge */}
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                  fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                                }}>{intg.status === 'connected' ? 'Live' : intg.status === 'coming_soon' ? 'Soon' : ''}</span>
                              </div>
                            </div>
                            {intg.url && (
                              <a href={intg.url} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#5a5e78', display: 'flex' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>

                          {/* Description */}
                          <div style={{ fontSize: 11, color: '#8b8fa8', lineHeight: 1.5, marginBottom: 10 }}>
                            {intg.description}
                          </div>

                          {/* Feature Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                            {intg.features.map(f => (
                              <span key={f} style={{
                                fontSize: 9, padding: '3px 8px', borderRadius: 4,
                                background: 'rgba(139,143,168,0.08)', color: '#8b8fa8',
                                fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                              }}>{f}</span>
                            ))}
                          </div>

                          {/* Action Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                            {intg.status === 'connected' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
                                  background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                                  fontSize: 10, fontWeight: 600, color: '#4ade80',
                                }}>
                                  <CheckCircle2 size={11} /> Connected
                                </div>
                                <button
                                  onClick={() => setExpandedCard(isExpanded ? null : intg.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
                                    background: 'transparent', border: '1px solid #1e2035',
                                    color: '#8b8fa8', fontSize: 10, fontWeight: 500, cursor: 'pointer',
                                  }}
                                >
                                  <Eye size={10} /> {isExpanded ? 'Less' : 'Details'}
                                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                                {intg.docsUrl && (
                                  <a href={intg.docsUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
                                      background: 'transparent', border: '1px solid #1e2035',
                                      color: '#8b8fa8', fontSize: 10, fontWeight: 500, textDecoration: 'none',
                                    }}
                                  >
                                    <FileText size={10} /> Docs
                                  </a>
                                )}
                              </div>
                            )}
                            {intg.status === 'available' && (
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 6,
                                  background: 'rgba(79,94,255,0.15)', border: '1px solid rgba(79,94,255,0.3)',
                                  color: '#4f5eff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                }}
                              >
                                <Wrench size={11} /> Configure & Connect
                              </motion.button>
                            )}
                            {intg.status === 'coming_soon' && (
                              <div style={{
                                padding: '6px 14px', borderRadius: 6,
                                background: 'rgba(139,143,168,0.06)', border: '1px solid rgba(139,143,168,0.15)',
                                fontSize: 10, color: '#5a5e78', fontWeight: 500,
                              }}>
                                Coming in a future release
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details Panel */}
                        <AnimatePresence>
                          {isExpanded && intg.status === 'connected' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{
                                margin: '0 16px 16px', padding: 12, borderRadius: 8,
                                background: 'rgba(79,94,255,0.04)', border: '1px solid rgba(79,94,255,0.1)',
                              }}>
                                <div style={{ fontSize: 9, color: '#4f5eff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                  Connection Details
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 9, color: '#5a5e78', marginBottom: 2 }}>Status</div>
                                    <div style={{ fontSize: 11, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                                      Active
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: '#5a5e78', marginBottom: 2 }}>Auth</div>
                                    <div style={{ fontSize: 11, color: '#c8cae0', fontFamily: "'JetBrains Mono', monospace" }}>
                                      {intg.id === 'github' ? 'OAuth Token' :
                                       intg.id === 'claude' ? 'API Key' :
                                       intg.id === 'vercel' ? 'Team Token' :
                                       intg.id === 'github-actions' ? 'Via GitHub' :
                                       intg.id === 'sast-engine' || intg.id === 'metrics-engine' || intg.id === 'activity-feed' ? 'Built-in' :
                                       'Configured'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: '#5a5e78', marginBottom: 2 }}>Last Sync</div>
                                    <div style={{ fontSize: 11, color: '#c8cae0', fontFamily: "'JetBrains Mono', monospace" }}>
                                      {intg.id === 'sast-engine' || intg.id === 'metrics-engine' || intg.id === 'activity-feed'
                                        ? 'Real-time' : 'Just now'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: '#5a5e78', marginBottom: 2 }}>Used By</div>
                                    <div style={{ fontSize: 11, color: '#c8cae0', fontFamily: "'JetBrains Mono', monospace" }}>
                                      {intg.id === 'github' ? 'SDLC, Audit' :
                                       intg.id === 'claude' ? 'All SDLC Agents' :
                                       intg.id === 'vercel' ? 'CI/CD Pipeline' :
                                       intg.id === 'github-actions' ? 'CI/CD Pipeline' :
                                       intg.id === 'sast-engine' ? 'Security Scan' :
                                       intg.id === 'metrics-engine' ? 'Quality Review' :
                                       intg.id === 'activity-feed' ? 'Dashboard' :
                                       'Pipeline'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div style={{
        marginTop: 32, padding: 20, borderRadius: 10, textAlign: 'center',
        background: 'rgba(79,94,255,0.04)', border: '1px solid rgba(79,94,255,0.15)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e4f0', marginBottom: 4 }}>
          Need a custom integration?
        </div>
        <div style={{ fontSize: 12, color: '#8b8fa8', marginBottom: 14 }}>
          Request new integrations or contribute adapters via the project's GitHub repo
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
              background: 'rgba(79,94,255,0.15)', border: '1px solid rgba(79,94,255,0.3)',
              color: '#4f5eff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <FileText size={13} /> Integration Guide
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
              background: 'transparent', border: '1px solid #1e2035',
              color: '#8b8fa8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <ArrowRight size={13} /> Contribute
          </motion.button>
        </div>
      </div>
    </div>
  )
}
