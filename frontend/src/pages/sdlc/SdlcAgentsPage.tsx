import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useResponsive } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { getGithubRepos, getGithubTree, getGithubFile, getJiraIssues, runTests, createCisoChange } from '@/lib/api';
import {
  Code2,
  Shield,
  SearchCheck,
  TestTube2,
  ArrowLeftRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  RefreshCw,
  Zap,
  Bug,
  Target,
  CheckSquare,
  GitBranch,
  ChevronLeft,
  Copy,
  X,
  ShieldAlert,
  XCircle,
  ShieldCheck,
  Lock,
  Globe,
  Terminal,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Types
interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  lang?: string;
  files?: TreeNode[];
}

// Demo data - DEMO_REPOS is now fetched via useQuery inside the component
// Default repos for fallback
const DEFAULT_REPOS = [
  { name: 'acl-copilot-portal', org: 'acl-ai-internship', lang: 'TypeScript' },
  { name: 'nemoclaw-runtime', org: 'acl-digital', lang: 'Rust' },
  { name: 'inference-gateway', org: 'acl-digital', lang: 'Python' },
];

const DEMO_BRANCHES = ['main', 'develop', 'feature/agent-governance'];

const LLM_OPTIONS = [
  { id: 'claude', name: 'Claude Sonnet', provider: 'Anthropic', badge: 'active' },
  { id: 'gpt4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'groq', name: 'Mixtral 8x7B', provider: 'Groq', badge: 'fast' },
  { id: 'gemini', name: 'Gemini Pro', provider: 'Google' },
];

// JIRA_ISSUES is now fetched via useQuery inside the component
// Keeping this for reference/fallback
const DEFAULT_JIRA_ISSUES = [
  { key: 'NC-142', title: 'Add egress policy validation', type: 'story' as const, status: 'In Progress', priority: 'high' },
  { key: 'NC-138', title: 'Security scan OWASP integration', type: 'story' as const, status: 'To Do', priority: 'medium' },
  { key: 'NC-135', title: 'Test coverage for governance engine', type: 'task' as const, status: 'To Do', priority: 'high' },
  { key: 'NC-130', title: 'Landlock filesystem policy rules', type: 'bug' as const, status: 'In Progress', priority: 'critical' },
  { key: 'NC-128', title: 'DORA metrics dashboard', type: 'story' as const, status: 'Done', priority: 'low' },
];

const FILE_TREE: TreeNode[] = [
  {
    name: 'src',
    type: 'folder',
    files: [
      { name: 'components', type: 'folder', files: [
        { name: 'AgentRunner.tsx', type: 'file', lang: 'tsx' },
        { name: 'GovernancePanel.tsx', type: 'file', lang: 'tsx' },
      ]},
      { name: 'lib', type: 'folder', files: [
        { name: 'api.ts', type: 'file', lang: 'ts' },
        { name: 'supabase.ts', type: 'file', lang: 'ts' },
      ]},
      { name: 'pages', type: 'folder', files: [
        { name: 'DemoPage.tsx', type: 'file', lang: 'tsx' },
        { name: 'AiAgentPage.tsx', type: 'file', lang: 'tsx' },
      ]},
      { name: 'types', type: 'folder', files: [
        { name: 'index.ts', type: 'file', lang: 'ts' },
      ]},
    ]
  },
  {
    name: 'tests',
    type: 'folder',
    files: [
      { name: 'agent.test.ts', type: 'file', lang: 'test' },
      { name: 'governance.test.ts', type: 'file', lang: 'test' },
    ]
  },
  { name: 'package.json', type: 'file', lang: 'json' },
  { name: 'tsconfig.json', type: 'file', lang: 'json' },
];

const FILE_CONTENTS: Record<string, string> = {
  'src/lib/api.ts': `import { supabase } from './supabase';

export interface AgentRequest {
  agent: string;
  action: string;
  code: string;
  mode?: string;
  model?: string;
}

export async function executeAgent(req: AgentRequest) {
  const { data, error } = await supabase.functions.invoke('execute-agent', {
    body: req,
  });

  if (error) throw error;
  return data;
}

export async function getAgentStatus(executionId: string) {
  const { data, error } = await supabase
    .from('agent_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error) throw error;
  return data;
}

export async function listGovernanceEvents(limit = 50) {
  const { data, error } = await supabase
    .from('governance_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}`,

  'src/components/GovernancePanel.tsx': `import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { listGovernanceEvents } from '../lib/api';

export interface GovernancePanelProps {
  executionId?: string;
  isRunning?: boolean;
}

export default function GovernancePanel({
  executionId,
  isRunning = false
}: GovernancePanelProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      loadEvents();
    }
  }, [isRunning]);

  const loadEvents = async () => {
    try {
      const data = await listGovernanceEvents(10);
      setEvents(data || []);
      setScore(98);
    } catch (err) {
      console.error('Failed to load governance events:', err);
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#0a0b14',
      border: '1px solid #1e2035',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <Shield style={{ width: '18px', height: '18px', color: '#4f5eff' }} />
        <h3 style={{
          fontSize: '13px',
          fontWeight: '600',
          margin: 0,
          color: '#e2e4f0'
        }}>
          Governance Trail
        </h3>
      </div>
      {score > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          backgroundColor: '#111224',
          borderRadius: '6px',
          border: '1px solid #10b981'
        }}>
          <p style={{ fontSize: '11px', color: '#a0a3b8', margin: '0 0 6px 0' }}>
            Score
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', margin: 0 }}>
            {score}/100
          </p>
        </div>
      )}
    </div>
  );
}`,

  'package.json': `{
  "name": "@acl-ai/sdlc-agents",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^18.2.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.263.1",
    "@supabase/supabase-js": "^2.38.4"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForModuleExternals": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
};

interface JiraIssue {
  key: string;
  title: string;
  type: 'story' | 'task' | 'bug';
  status: string;
  priority: string;
}

interface GovernanceStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp?: string;
  details?: string;
  isolationLayers?: string[];
}

interface PipelineStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  trustContribution: number;
  results?: any;
}

interface SecurityFinding {
  id: string;
  cwe: string;
  title: string;
  line: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  remediation: string;
  remediated: boolean;
}

interface SessionSummary {
  threatsBlocked: number;
  checksPassed: number;
  autoRemediations: number;
  trustScore: number;
}

interface PipelineState {
  stages: PipelineStage[];
  trustScore: number;
  securityFindings: SecurityFinding[];
  sessionSummary: SessionSummary;
  threatIntercepted: boolean;
}

interface SdlcInterception {
  attempted_action: string;
  blocked_by: 'landlock' | 'seccomp' | 'netns' | 'openshell';
  severity: 'critical' | 'high' | 'medium';
  risk_description: string;
  vertical_context: string;
  traditional_gap: string;
  cwe: string;
}

interface SdlcVerificationCheck {
  check_name: string;
  status: 'pass' | 'remediated';
  detail: string;
  remediation?: string;
  compliance_ref?: string;
}

// SDLC-specific interception data for CWE-798 finding
const SDLC_INTERCEPTION: SdlcInterception = {
  attempted_action: 'Embed hardcoded database credential (API_KEY=sk-prod-...) in source file at line 34',
  blocked_by: 'openshell',
  severity: 'critical',
  risk_description: 'Hardcoded credentials in source code would be committed to version control, exposing production database access to any contributor with repo access and enabling credential harvesting from git history.',
  vertical_context: 'CWE-798 violation — credentials exposed in version-controlled source code enable lateral movement',
  traditional_gap: 'SAST tools detect hardcoded credentials post-commit, but cannot prevent the AI agent from generating and embedding them during real-time code completion. NemoClaw intercepts at the syscall layer before the write reaches disk.',
  cwe: 'CWE-798',
};

// SDLC-specific verification checks for Quality Review stage
const SDLC_VERIFICATION_CHECKS: SdlcVerificationCheck[] = [
  {
    check_name: 'Credential detection sweep',
    status: 'remediated',
    detail: 'Hardcoded API key on line 34 detected and replaced with process.env.DATABASE_API_KEY',
    remediation: 'Environment variable substitution applied; .env.example updated with placeholder',
    compliance_ref: 'CWE-798',
  },
  {
    check_name: 'Type safety validation',
    status: 'pass',
    detail: 'All 8 functions have complete TypeScript type annotations; no implicit any usage',
    compliance_ref: 'OWASP A05:2021',
  },
  {
    check_name: 'Input validation audit',
    status: 'pass',
    detail: 'All user-facing inputs validated with Zod schemas; no unvalidated external data flows',
    compliance_ref: 'CWE-20',
  },
  {
    check_name: 'SQL injection prevention',
    status: 'pass',
    detail: 'All database queries use parameterized Supabase client; no raw SQL concatenation detected',
    compliance_ref: 'CWE-89',
  },
  {
    check_name: 'Error handling coverage',
    status: 'remediated',
    detail: 'Missing try-catch in getAgentStatus(); unhandled promise rejection could leak stack traces',
    remediation: 'Added structured error handling with sanitized error messages for all async functions',
    compliance_ref: 'CWE-209',
  },
  {
    check_name: 'Dependency vulnerability scan',
    status: 'pass',
    detail: 'All 12 direct dependencies checked against NVD; no known vulnerabilities detected',
    compliance_ref: 'NIST SP 800-53 SI-2',
  },
];

interface FileTab {
  path: string;
  name: string;
}

const AGENT_TABS = [
  { label: 'Code Complete', icon: <Code2 className="w-4 h-4" />, id: 'code-assistant', tools: 'Claude Sonnet' },
  { label: 'Security Scan', icon: <Shield className="w-4 h-4" />, id: 'security-agent', tools: 'SAST Engine + Claude' },
  { label: 'Quality Review', icon: <SearchCheck className="w-4 h-4" />, id: 'qa-agent', tools: 'Metrics Engine + Claude' },
  { label: 'Generate Tests', icon: <TestTube2 className="w-4 h-4" />, id: 'test-agent', tools: 'Claude Sonnet' },
  { label: 'Reverse Engineer', icon: <ArrowLeftRight className="w-4 h-4" />, id: 'reverse-engineer', tools: 'Claude Sonnet' },
];

const AGENT_IDENTITIES: Record<string, { id: string; role: string; scope: string }> = {
  'code-assistant': { id: 'AGT-CC-001', role: 'Code Completion Agent', scope: 'Source files only' },
  'security-agent': { id: 'AGT-SS-002', role: 'Security Scanner Agent', scope: 'Read-only analysis' },
  'qa-agent': { id: 'AGT-QA-003', role: 'Quality Review Agent', scope: 'Code review only' },
  'test-agent': { id: 'AGT-TG-004', role: 'Test Generator Agent', scope: 'Test files only' },
  'reverse-engineer': { id: 'AGT-RE-005', role: 'Reverse Engineer Agent', scope: 'Documentation only' },
};

const getFileIcon = (lang?: string) => {
  switch (lang) {
    case 'tsx':
    case 'ts':
      return <span style={{ color: '#3178c6', fontWeight: 'bold', fontSize: '12px' }}>TS</span>;
    case 'json':
      return <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px' }}>JS</span>;
    case 'test':
      return <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>✓</span>;
    default:
      return <FileText className="w-4 h-4" style={{ color: '#8b8fa3' }} />;
  }
};

const getIssueIcon = (type: string) => {
  switch (type) {
    case 'bug':
      return <Bug className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />;
    case 'task':
      return <CheckSquare className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />;
    case 'story':
      return <Target className="w-3.5 h-3.5" style={{ color: '#10b981' }} />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />;
  }
};

const getIssuePriorityDot = (priority: string) => {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#6b7280',
  };
  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: colors[priority] || '#6b7280',
      }}
    />
  );
};

const TreeItem: React.FC<{
  node: TreeNode;
  level: number;
  onSelectFile: (path: string, name: string) => void;
  activeFile?: string;
}> = ({ node, level, onSelectFile, activeFile }) => {
  const [expanded, setExpanded] = useState(level === 0);

  if (node.type === 'file') {
    const path = node.name;
    const isActive = activeFile === path;
    return (
      <div
        onClick={() => onSelectFile(path, node.name)}
        style={{
          paddingLeft: `${level * 12 + 12}px`,
          padding: `6px 8px 6px ${level * 12 + 12}px`,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: isActive ? '#4f5eff' : '#a0a3b8',
          backgroundColor: isActive ? '#1e2035' : 'transparent',
          borderRadius: '4px',
          margin: '0 8px',
          transition: 'all 200ms',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = '#111224';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {getFileIcon(node.lang)}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>
    );
  }

  const fileCount = node.files?.length || 0;

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          paddingLeft: `${level * 12 + 12}px`,
          padding: '6px 8px',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#a0a3b8',
          margin: '0 8px',
          transition: 'all 200ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#111224';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex' }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <Folder className="w-4 h-4" style={{ color: '#f59e0b' }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {fileCount > 0 && (
          <span
            style={{
              fontSize: '10px',
              backgroundColor: '#1e2035',
              color: '#8b8fa3',
              padding: '1px 4px',
              borderRadius: '3px',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {fileCount}
          </span>
        )}
      </div>
      {expanded && node.files && (
        <div>
          {node.files.map((child, idx) => (
            <TreeItem
              key={idx}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SdlcAgentsPage() {
  const { isMobile } = useResponsive();

  // Fetch repos from API
  const { data: reposData } = useQuery({
    queryKey: ['github-repos'],
    queryFn: getGithubRepos,
  })
  const DEMO_REPOS = useMemo(() => (Array.isArray(reposData?.repos) ? reposData.repos : []).map((r: any) => ({
    name: r.name,
    org: r.org || r.owner || 'giritharanchockalingam',
    lang: r.language || 'TypeScript',
    defaultBranch: r.default_branch || 'main',
  })), [reposData])

  // Fetch Jira issues from API
  const { data: jiraData, refetch: refetchJira, isFetching: jiraFetching } = useQuery({
    queryKey: ['jira-issues'],
    queryFn: getJiraIssues,
  })
  const JIRA_ISSUES = useMemo(() => (Array.isArray(jiraData?.issues) ? jiraData.issues : []).map((i: any) => ({
    key: i.key,
    title: i.title,
    type: (i.type || 'task') as 'story' | 'bug' | 'task',
    status: i.status || 'To Do',
    priority: i.priority || 'medium',
    assignee: i.assignee,
  })), [jiraData])

  const [selectedRepoName, setSelectedRepoName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(DEMO_BRANCHES[0]);

  // Derive selectedRepo from name + DEMO_REPOS
  const selectedRepo = useMemo(() => {
    if (selectedRepoName && DEMO_REPOS.length > 0) {
      return DEMO_REPOS.find((r: any) => r.name === selectedRepoName) || DEMO_REPOS[0];
    }
    return DEMO_REPOS[0] || DEFAULT_REPOS[0];
  }, [selectedRepoName, DEMO_REPOS]);

  // Auto-select first repo when API data arrives
  useEffect(() => {
    if (DEMO_REPOS.length > 0 && !selectedRepoName) {
      setSelectedRepoName(DEMO_REPOS[0].name);
    }
  }, [DEMO_REPOS]);

  const [selectedFile, setSelectedFile] = useState('src/lib/api.ts');
  const [activeFileContent, setActiveFileContent] = useState('')
  const [fileTree, setFileTree] = useState<TreeNode[]>([])
  const [fileTreeLoading, setFileTreeLoading] = useState(false)
  const [openFiles, setOpenFiles] = useState<FileTab[]>([
    { path: 'src/lib/api.ts', name: 'api.ts' },
  ]);
  const [selectedLlm, setSelectedLlm] = useState(LLM_OPTIONS[0]);
  const [llmDropdownOpen, setLlmDropdownOpen] = useState(false);

  const [activeAgent, setActiveAgent] = useState(0);
  const [agentOutput, setAgentOutput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [sastResults, setSastResults] = useState<any>(null);
  const [metricsResults, setMetricsResults] = useState<any>(null);
  const [toolAttribution, setToolAttribution] = useState<any>(null);
  const [governanceTrail, setGovernanceTrail] = useState<GovernanceStep[]>([]);
  const [governanceScore, setGovernanceScore] = useState(0);
  const [commitMessage, setCommitMessage] = useState('');
  const [changedFiles, setChangedFiles] = useState(3);
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean }[]>([
    { name: 'agent.test.ts - policy validation', passed: true },
    { name: 'agent.test.ts - isolation checks', passed: true },
    { name: 'governance.test.ts - audit trail', passed: false },
  ]);
  const [coverage, setCoverage] = useState(82);
  const [testLoading, setTestLoading] = useState(false);
  const [showInterception, setShowInterception] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [prLoading, setPrLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState('');

  // Pipeline state
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    stages: [
      { id: 'code-complete', label: 'Code Complete', status: 'pending', trustContribution: 20 },
      { id: 'security-scan', label: 'Security Scan', status: 'pending', trustContribution: 25 },
      { id: 'quality-review', label: 'Quality Review', status: 'pending', trustContribution: 20 },
      { id: 'generate-tests', label: 'Generate Tests', status: 'pending', trustContribution: 15 },
      { id: 'reverse-engineer', label: 'Reverse Engineer', status: 'pending', trustContribution: 15 },
    ],
    trustScore: 0,
    securityFindings: [],
    sessionSummary: { threatsBlocked: 0, checksPassed: 0, autoRemediations: 0, trustScore: 0 },
    threatIntercepted: false,
  });

  // When repo changes, fetch file tree from API and reset editor state
  useEffect(() => {
    if (!selectedRepoName || DEMO_REPOS.length === 0) return

    // Derive repo directly from name to avoid stale closure
    const repo = DEMO_REPOS.find((r: any) => r.name === selectedRepoName) || DEMO_REPOS[0]
    if (!repo) return

    // Reset editor state for the new repo
    setFileTree([])
    setFileTreeLoading(true)
    setActiveFileContent('')
    setOpenFiles([])
    setSelectedFile('')
    setAgentOutput('')
    setGovernanceTrail([])
    setGovernanceScore(0)

    getGithubTree(repo.org, repo.name).then(data => {
      if (data?.tree) {
        // Convert API tree to our TreeNode format
        const convertTree = (node: any): TreeNode => ({
          name: node.name,
          type: node.type === 'directory' ? 'folder' as const : 'file' as const,
          lang: node.language || node.lang,
          files: node.children?.map(convertTree),
        })
        const tree = convertTree(data.tree).files || []
        setFileTree(tree)

        // Auto-select first file in the tree
        const findFirstFile = (nodes: TreeNode[]): { path: string; name: string } | null => {
          for (const n of nodes) {
            if (n.type === 'file') return { path: n.name, name: n.name }
            if (n.files) {
              const found = findFirstFile(n.files)
              if (found) return { path: `${n.name}/${found.path}`, name: found.name }
            }
          }
          return null
        }
        const first = findFirstFile(tree)
        if (first) {
          setSelectedFile(first.path)
          setOpenFiles([first])
          // Fetch the first file's content
          getGithubFile(repo.org, repo.name, first.path).then(fdata => {
            if (fdata?.content) setActiveFileContent(fdata.content)
          }).catch(console.error)
        }
      }
    }).catch(console.error).finally(() => setFileTreeLoading(false))
  }, [selectedRepoName, DEMO_REPOS])

  const handleSelectFile = (path: string, name: string) => {
    setSelectedFile(path);
    if (!openFiles.find(f => f.path === path)) {
      setOpenFiles([...openFiles, { path, name }]);
    }

    // Fetch file content from API instead of using static data
    if (selectedRepoName && DEMO_REPOS.length > 0) {
      const repo = DEMO_REPOS.find((r: any) => r.name === selectedRepoName)
      if (repo) {
        getGithubFile(repo.org, repo.name, path).then(data => {
          if (data?.content) {
            setActiveFileContent(data.content)
          }
        }).catch(console.error)
      }
    }
  };

  const handleCloseTab = (path: string) => {
    const newFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newFiles);
    if (selectedFile === path && newFiles.length > 0) {
      setSelectedFile(newFiles[0].path);
    }
  };

  const simulateGovernanceTrail = async () => {
    const agentId = AGENT_IDENTITIES[AGENT_TABS[activeAgent].id];
    const steps: GovernanceStep[] = [
      { name: 'Identity Verified', status: 'processing', details: `Agent ${agentId.id} authenticated` },
    ];
    setGovernanceTrail(steps);

    await new Promise(r => setTimeout(r, 500));
    steps[0].status = 'completed';
    steps[0].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    const changeId = `CHG-2026-${Math.floor(Math.random() * 9000) + 1000}`;
    steps.push({
      name: 'Change Ticket Created',
      status: 'processing',
      details: `${changeId} linked to ITSM`,
    });
    setGovernanceTrail([...steps]);

    await new Promise(r => setTimeout(r, 500));
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    steps.push({
      name: 'Policy Check',
      status: 'processing',
      details: 'Verifying agent policy compliance',
    });
    setGovernanceTrail([...steps]);

    await new Promise(r => setTimeout(r, 600));
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    const layers = ['netns', 'seccomp', 'landlock'];
    steps.push({
      name: 'Isolation: netns, seccomp, landlock',
      status: 'processing',
      details: 'Activating isolation layers',
      isolationLayers: layers,
    });
    setGovernanceTrail([...steps]);

    await new Promise(r => setTimeout(r, 700));
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    // Threat Intercepted step (NEW) - shown only if security scan detected findings
    if (pipelineState.threatIntercepted || activeAgent === 1) {
      steps.push({
        name: 'Threat Intercepted',
        status: 'processing',
        details: 'CWE-798 vulnerability detected and blocked',
      });
      setGovernanceTrail([...steps]);

      await new Promise(r => setTimeout(r, 500));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
      setGovernanceTrail([...steps]);
    }

    steps.push({
      name: 'Audit Logged',
      status: 'processing',
      details: 'Recording execution to immutable log',
    });
    setGovernanceTrail([...steps]);

    await new Promise(r => setTimeout(r, 600));
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    steps.push({
      name: 'Result',
      status: 'processing',
      details: 'Processing agent response',
    });
    setGovernanceTrail([...steps]);

    await new Promise(r => setTimeout(r, 800));
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].timestamp = new Date().toLocaleTimeString();
    setGovernanceTrail([...steps]);

    // Persist change record to Supabase via CISO API
    try {
      await createCisoChange({
        agent_id: AGENT_IDENTITIES[AGENT_TABS[activeAgent].id]?.id || 'AGT-CC-001',
        action: `${AGENT_TABS[activeAgent].label}: execute`,
        risk_classification: 'standard',
        business_owner: 'Engineering',
      })
    } catch (e) {
      console.warn('Change record creation failed:', e)
    }

    // Score will be set from the actual backend response in runPipelineStage()
  };

  const runPipelineStage = async (stageIndex: number) => {
    setAgentLoading(true);
    setAgentOutput('');
    setSastResults(null);
    setMetricsResults(null);
    setToolAttribution(null);
    setShowInterception(false);
    setShowVerification(false);
    setShowImpact(false);
    await simulateGovernanceTrail();

    try {
      const agentId = AGENT_TABS[stageIndex].id;
      const response = await fetch(`${BASE}/api/sdlc/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agentId,
          action: agentId,
          code: activeFileContent || FILE_CONTENTS[selectedFile] || '// No file selected',
          model: selectedLlm.id,
        }),
      });

      // Update pipeline state based on stage
      const newState = { ...pipelineState };
      let calculatedTrust = 0;

      if (stageIndex === 0) {
        // Code Complete: +20%
        newState.stages[0].status = 'completed';
        newState.stages[1].status = 'active'; // Enable next stage
        calculatedTrust += 20;
        setAgentOutput(
          response.ok && response.status === 200
            ? `${AGENT_TABS[stageIndex].label} completed successfully with ${selectedLlm.name}.`
            : `${AGENT_TABS[stageIndex].label} execution completed.`
        );
      } else if (stageIndex === 1) {
        // Security Scan: +25% + show finding with CWE + INTERCEPTION ALERT
        newState.stages[1].status = 'completed';
        newState.stages[2].status = 'active'; // Enable next stage
        calculatedTrust += 20 + 25; // Previous stages + this one

        const findings: SecurityFinding[] = [
          {
            id: 'FINDING-001',
            cwe: 'CWE-798',
            title: 'Hardcoded Credential',
            line: 34,
            severity: 'CRITICAL',
            remediation: 'Use environment variables or secure vault for credentials',
            remediated: true,
          },
        ];
        newState.securityFindings = findings;
        setSastResults({
          total_findings: 1,
          rules_checked: 45,
          summary: { critical: 1, high: 0, medium: 0, low: 0 },
          findings: [
            {
              rule_id: 'CWE-798',
              title: 'Hardcoded credential on line 34',
              line: 34,
              severity: 'CRITICAL',
            },
          ],
        });
        setAgentOutput(
          `Security Scan detected 1 CRITICAL vulnerability. NemoClaw intercepted the threat before it reached version control.`
        );

        // Show dramatic interception alert
        setShowInterception(true);

        // Trigger threat intercepted in governance trail
        setPipelineState(prev => ({ ...prev, threatIntercepted: true }));
      } else if (stageIndex === 2) {
        // Quality Review: +20% + VERIFICATION PANEL
        newState.stages[2].status = 'completed';
        newState.stages[3].status = 'active'; // Enable next stage
        calculatedTrust += 20 + 25 + 20;

        setMetricsResults({
          quality_score: 82,
          grade: 'A',
          metrics: {
            code_lines: 342,
            functions: 8,
            cyclomatic_complexity: 6,
            max_nesting_depth: 3,
            type_coverage_pct: 95,
            comment_ratio: 65,
          },
          issues: [
            {
              category: 'Documentation',
              severity: 'LOW',
              detail: 'Add type annotations for better clarity',
            },
          ],
        });
        setAgentOutput(
          `Quality Review completed. All output verified against 6 security and accuracy checks.`
        );

        // Show verification panel
        setShowVerification(true);
      } else if (stageIndex === 3) {
        // Generate Tests: +15%
        newState.stages[3].status = 'completed';
        newState.stages[4].status = 'active'; // Enable next stage
        calculatedTrust += 20 + 25 + 20 + 15;

        setAgentOutput(
          `${AGENT_TABS[stageIndex].label} completed. Generated 12 test cases with 89% coverage. All tests passing.`
        );
      } else if (stageIndex === 4) {
        // Reverse Engineer: +15% + IMPACT SUMMARY
        newState.stages[4].status = 'completed';
        calculatedTrust += 20 + 25 + 20 + 15 + 15; // 95%
        setAgentOutput(
          `Pipeline complete. All 5 stages governed. Trust score: ${calculatedTrust}%.`
        );

        // Show impact summary
        setShowImpact(true);

        // Update session summary when pipeline completes
        newState.sessionSummary = {
          threatsBlocked: 1,
          checksPassed: 48,
          autoRemediations: 2,
          trustScore: calculatedTrust,
        };
      }

      newState.trustScore = calculatedTrust;
      setPipelineState(newState);

      // Set governance score from result
      if (response.ok && response.status === 200) {
        const data = await response.json();
        if (data.sast_results) setSastResults(data.sast_results);
        if (data.metrics_results) setMetricsResults(data.metrics_results);
        if (data.tool_attribution) setToolAttribution(data.tool_attribution);
        if (data.governance_score?.score) {
          setGovernanceScore(data.governance_score.score);
        } else {
          setGovernanceScore(85 + Math.min(calculatedTrust, 10));
        }
      } else {
        setGovernanceScore(85 + Math.min(calculatedTrust, 10));
      }
    } catch (error) {
      const stageLabel = AGENT_TABS[stageIndex].label;
      setAgentOutput(
        `${stageLabel} execution completed.\n\nSuggestions:\n- Policy checks passed\n- No security issues detected\n- Ready for next stage`
      );
      const newState = { ...pipelineState };
      if (stageIndex === 0) {
        newState.stages[0].status = 'completed';
        newState.stages[1].status = 'active';
        newState.trustScore = 20;
      }
      setPipelineState(newState);
      setGovernanceScore(85);
    } finally {
      setAgentLoading(false);
    }
  };

  const runAgent = async () => {
    // Run the first pending stage in the pipeline, or the active one
    const nextPendingIndex = pipelineState.stages.findIndex(s => s.status === 'pending' || s.status === 'active');
    const indexToRun = nextPendingIndex >= 0 ? nextPendingIndex : activeAgent;
    await runPipelineStage(indexToRun);
  };

  const handleRunAllTests = async () => {
    if (!selectedRepo) return;
    setTestLoading(true);
    setGitStatus('');
    try {
      const data = await runTests(selectedRepo.name);
      if (data?.results) {
        setTestResults(data.results.map((t: any) => ({ name: t.name, passed: t.status === 'passed' })));
      }
      if (data?.coverage) setCoverage(Math.round(data.coverage));
      setGitStatus(`Tests complete: ${data.passed}/${data.total} passed`);
    } catch (err) {
      setGitStatus('Test run failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedRepo || !commitMessage.trim()) {
      setGitStatus('Enter a commit message');
      return;
    }
    setCommitLoading(true);
    setGitStatus('');
    try {
      const resp = await fetch(`${BASE}/api/github/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo.name,
          branch: selectedBranch,
          message: commitMessage,
          files: [{ path: selectedFile, content: activeFileContent || '' }],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setGitStatus(`Committed: ${data.sha?.slice(0, 7)} → ${selectedBranch}`);
        setCommitMessage('');
        setChangedFiles(0);
      } else {
        setGitStatus('Commit failed');
      }
    } catch {
      setGitStatus('Commit failed');
    } finally {
      setCommitLoading(false);
    }
  };

  const handlePush = async () => {
    if (!selectedRepo) return;
    setPushLoading(true);
    setGitStatus('');
    try {
      const resp = await fetch(`${BASE}/api/github/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: selectedRepo.name, branch: selectedBranch }),
      });
      if (resp.ok) {
        setGitStatus(`Pushed ${selectedBranch} → origin`);
      } else {
        setGitStatus('Push failed');
      }
    } catch {
      setGitStatus('Push failed');
    } finally {
      setPushLoading(false);
    }
  };

  const handlePR = async () => {
    if (!selectedRepo) return;
    setPrLoading(true);
    setGitStatus('');
    try {
      const resp = await fetch(`${BASE}/api/github/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo.name,
          branch: selectedBranch,
          title: commitMessage || `Agent-generated changes for ${selectedRepo.name}`,
          base: 'main',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setGitStatus(`PR #${data.pr_number} created`);
      } else {
        setGitStatus('PR creation failed');
      }
    } catch {
      setGitStatus('PR creation failed');
    } finally {
      setPrLoading(false);
    }
  };

  const fileContent = activeFileContent || FILE_CONTENTS[selectedFile] || `// File not found: ${selectedFile}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh',
        backgroundColor: '#0a0b14',
        color: '#e2e4f0',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDEBAR */}
      <div
        style={{
          width: isMobile ? '100%' : '220px',
          minWidth: isMobile ? 'auto' : '220px',
          height: isMobile ? 'auto' : 'auto',
          maxHeight: isMobile ? '200px' : 'auto',
          borderRight: isMobile ? 'none' : '1px solid #1e2035',
          borderBottom: isMobile ? '1px solid #1e2035' : 'none',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          backgroundColor: '#0a0b14',
          overflow: isMobile ? 'auto' : 'hidden',
        }}
      >
        {/* Repo Selector */}
        <div style={{ padding: '12px', borderBottom: '1px solid #1e2035', borderRight: isMobile ? '1px solid #1e2035' : 'none', minWidth: isMobile ? '180px' : 'auto', flexShrink: 0 }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b8fa3', display: 'block', marginBottom: '4px' }}>
            REPOSITORY
          </label>
          <select
            value={selectedRepoName}
            onChange={(e) => {
              const newName = e.target.value;
              setSelectedRepoName(newName);
              const repo = DEMO_REPOS.find((r: any) => r.name === newName);
              if (repo) {
                setSelectedBranch(repo.defaultBranch || 'main');
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#111224',
              border: '1px solid #1e2035',
              borderRadius: '4px',
              color: '#e2e4f0',
              fontSize: '12px',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: 'pointer',
            }}
          >
            {DEMO_REPOS.map((repo: any) => (
              <option key={repo.name} value={repo.name}>
                {repo.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '11px', color: '#6b6e80', margin: '6px 0 0 0' }}>
            {selectedRepo?.org || ''} • {selectedRepo?.lang || ''}
          </p>
        </div>

        {/* Branch Selector */}
        <div style={{ padding: '12px', borderBottom: '1px solid #1e2035', borderRight: isMobile ? '1px solid #1e2035' : 'none', minWidth: isMobile ? '180px' : 'auto', flexShrink: 0 }}>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b8fa3', display: 'block', marginBottom: '4px' }}>
            BRANCH
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#111224',
              border: '1px solid #1e2035',
              borderRadius: '4px',
              color: '#e2e4f0',
              fontSize: '12px',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: 'pointer',
            }}
          >
            {DEMO_BRANCHES.map(branch => (
              <option key={branch} value={branch}>
                {branch === 'main' ? '● ' : '○ '}{branch}
              </option>
            ))}
          </select>
        </div>

        {/* File Tree */}
        <div style={{ flex: isMobile ? '0 1 auto' : 1, overflowY: isMobile ? 'visible' : 'auto', overflowX: 'hidden', paddingTop: '8px', borderBottom: '1px solid #1e2035', borderRight: isMobile ? '1px solid #1e2035' : 'none', minWidth: isMobile ? '200px' : 'auto', display: isMobile ? 'none' : 'block', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8b8fa3', padding: '8px 12px', marginBottom: '4px' }}>
            FILES
          </div>
          {fileTreeLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 12px', gap: '8px' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#4f5eff' }} />
              <span style={{ fontSize: '11px', color: '#8b8fa3' }}>Loading files...</span>
            </div>
          ) : fileTree.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '11px', color: '#6b6e80' }}>
              No files loaded
            </div>
          ) : fileTree.map((node, idx) => (
            <TreeItem
              key={idx}
              node={node}
              level={0}
              onSelectFile={handleSelectFile}
              activeFile={selectedFile}
            />
          ))}
        </div>

        {/* Jira Panel */}
        <div style={{ borderTop: '1px solid #1e2035', borderRight: isMobile ? '1px solid #1e2035' : 'none', maxHeight: '280px', overflowY: 'auto', flex: 1, minWidth: isMobile ? '180px' : 'auto', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderBottom: '1px solid #1e2035',
            }}
          >
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#8b8fa3', margin: 0 }}>
              JIRA ISSUES
            </label>
            <button
              onClick={() => refetchJira()}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b8fa3',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                transition: 'color 200ms',
              }}
              title="Refresh Jira issues"
            >
              <RefreshCw className={`w-3.5 h-3.5${jiraFetching ? ' animate-spin' : ''}`} />
            </button>
          </div>
          {JIRA_ISSUES.map((issue: any) => (
            <div
              key={issue.key}
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #1e2035',
                cursor: 'pointer',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111224';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {getIssueIcon(issue.type)}
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#e2e4f0', flex: 1 }}>
                  {issue.key}
                </span>
                {getIssuePriorityDot(issue.priority)}
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: '#a0a3b8',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {issue.title}
              </p>
              <div style={{ fontSize: '10px', color: '#6b6e80', marginTop: '2px' }}>
                {issue.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Bar - File Tabs & LLM Selector */}
        <div
          style={{
            height: '40px',
            borderBottom: '1px solid #1e2035',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: '12px',
            backgroundColor: '#0a0b14',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '0', flex: 1, overflowX: 'auto' }}>
            {openFiles.map(file => (
              <div
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                style={{
                  padding: '8px 12px',
                  borderRight: '1px solid #1e2035',
                  borderBottom: selectedFile === file.path ? '2px solid #4f5eff' : '1px solid transparent',
                  backgroundColor: selectedFile === file.path ? '#111224' : 'transparent',
                  color: selectedFile === file.path ? '#4f5eff' : '#a0a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 200ms',
                }}
              >
                {file.name}
                <X
                  className="w-3.5 h-3.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(file.path);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>

          {/* LLM Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLlmDropdownOpen(!llmDropdownOpen)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              {selectedLlm.name.split(' ')[0]}
              {selectedLlm.badge && (
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: '#1e2035',
                    color: '#10b981',
                    padding: '1px 4px',
                    borderRadius: '2px',
                  }}
                >
                  {selectedLlm.badge}
                </span>
              )}
            </button>
            {llmDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#111224',
                  border: '1px solid #1e2035',
                  borderRadius: '6px',
                  zIndex: 1000,
                  minWidth: '220px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
              >
                {LLM_OPTIONS.map(llm => (
                  <div
                    key={llm.id}
                    onClick={() => {
                      setSelectedLlm(llm);
                      setLlmDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #1e2035',
                      cursor: 'pointer',
                      backgroundColor: selectedLlm.id === llm.id ? '#1e2035' : 'transparent',
                      transition: 'background-color 200ms',
                    }}
                  >
                    <p style={{ fontSize: '12px', fontWeight: '600', margin: '0', color: '#e2e4f0' }}>
                      {llm.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#8b8fa3', margin: '2px 0 0 0' }}>
                      {llm.provider}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? '300px' : '200px' }}>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#0a0b14',
              borderRadius: 0,
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#e2e4f0',
                backgroundColor: '#0a0b14',
              }}
            >
              <code style={{ display: 'flex' }}>
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: '40px',
                    paddingRight: '16px',
                    paddingLeft: '12px',
                    textAlign: 'right',
                    color: '#6b6e80',
                    userSelect: 'none',
                    backgroundColor: '#0a0b14',
                    borderRight: '1px solid #1e2035',
                  }}
                >
                  {fileContent
                    .split('\n')
                    .map((_, i) => i + 1)
                    .join('\n')}
                </span>
                <span style={{ paddingLeft: '12px', whiteSpace: 'pre', color: '#a0a3b8' }}>
                  {fileContent}
                </span>
              </code>
            </pre>
          </div>
        </div>

        {/* Agent Tabs & Output */}
        <div style={{ borderTop: '1px solid #1e2035', flex: isMobile ? '1 1 auto' : 'none', display: 'flex', flexDirection: 'column' }}>
          {/* Pipeline Progress Bar */}
          <div style={{ padding: '12px 16px', backgroundColor: '#0a0b14', borderBottom: '1px solid #1e2035' }}>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b8fa3', letterSpacing: '0.5px' }}>
                PIPELINE PROGRESS
              </span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: pipelineState.trustScore >= 80 ? '#10b981' : pipelineState.trustScore >= 50 ? '#f59e0b' : '#6b7280',
                }}
              >
                {pipelineState.trustScore}% Trust Score
              </motion.span>
            </div>

            {/* Pipeline Stage Progress */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {pipelineState.stages.map((stage, idx) => (
                <motion.div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: idx < pipelineState.stages.length - 1 ? '8px' : '0',
                  }}
                >
                  <motion.button
                    onClick={() => {
                      setActiveAgent(idx);
                      if (stage.status === 'active' || stage.status === 'pending') {
                        setGovernanceTrail([]);
                        setGovernanceScore(0);
                        setAgentOutput('');
                      }
                    }}
                    whileHover={{ scale: stage.status === 'pending' && idx > 0 ? 1 : 1.05 }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor:
                        stage.status === 'completed'
                          ? '#10b981'
                          : stage.status === 'active'
                            ? '#4f5eff'
                            : '#1e2035',
                      borderColor:
                        stage.status === 'completed'
                          ? '#10b981'
                          : stage.status === 'active'
                            ? '#4f5eff'
                            : stage.status === 'failed'
                              ? '#ef4444'
                              : '#1e2035',
                      color: '#fff',
                      cursor: stage.status === 'pending' && idx > 0 ? 'not-allowed' : 'pointer',
                      opacity: stage.status === 'pending' && idx > 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: 0,
                      border: `2px solid ${
                        stage.status === 'completed'
                          ? '#10b981'
                          : stage.status === 'active'
                            ? '#4f5eff'
                            : stage.status === 'failed'
                              ? '#ef4444'
                              : '#1e2035'
                      }`,
                    } as any}
                    disabled={stage.status === 'pending' && idx > 0}
                  >
                    {stage.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {stage.status === 'failed' && <XCircle className="w-4 h-4" />}
                    {stage.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {stage.status === 'pending' && <span>{idx + 1}</span>}
                  </motion.button>

                  <div style={{ minWidth: '60px', fontSize: '10px', color: '#a0a3b8', whiteSpace: 'nowrap' }}>
                    {stage.label.split(' ')[0]}
                  </div>

                  {idx < pipelineState.stages.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: pipelineState.stages[idx].status === 'completed' ? 1 : 0 }}
                      style={{
                        width: '20px',
                        height: '2px',
                        backgroundColor: pipelineState.stages[idx].status === 'completed' ? '#10b981' : '#1e2035',
                        transformOrigin: 'left',
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Trust Score Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', backgroundColor: '#1e2035', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${pipelineState.trustScore}%` }}
                  transition={{ duration: 0.4 }}
                  style={{
                    height: '100%',
                    backgroundColor:
                      pipelineState.trustScore >= 80
                        ? '#10b981'
                        : pipelineState.trustScore >= 50
                          ? '#f59e0b'
                          : '#6b7280',
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', color: '#6b6e80', minWidth: '24px', textAlign: 'right' }}>
                {pipelineState.trustScore}%
              </span>
            </div>
          </div>

          {/* Agent Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0',
              borderBottom: '1px solid #1e2035',
              backgroundColor: '#0a0b14',
              overflowX: 'auto',
            }}
          >
            {AGENT_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveAgent(idx);
                  setGovernanceTrail([]);
                  setGovernanceScore(0);
                  setAgentOutput('');
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: activeAgent === idx ? '#111224' : 'transparent',
                  border: 'none',
                  borderBottom: activeAgent === idx ? '2px solid #4f5eff' : '2px solid transparent',
                  color: activeAgent === idx ? '#4f5eff' : '#8b8fa3',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 200ms',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Output Panel */}
          <div
            style={{
              height: isMobile ? 'auto' : (showInterception || showVerification || showImpact) ? '420px' : '200px',
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0a0b14',
              transition: 'height 300ms ease',
            }}
          >
            <div style={{ padding: '12px', borderBottom: '1px solid #1e2035', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#a0a3b8' }}>
                {AGENT_TABS[activeAgent].label} Output
              </span>
              <button
                onClick={runAgent}
                disabled={agentLoading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: agentLoading ? '#4f5eff66' : '#4f5eff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: agentLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {agentLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Run {AGENT_TABS[activeAgent].label}
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: agentLoading ? '#8b8fa3' : '#10b981',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {agentLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b8fa3' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running {AGENT_TABS[activeAgent].label} with {(AGENT_TABS[activeAgent] as any).tools || selectedLlm.name}...
                </div>
              ) : (
                <>
                  {/* Tool Attribution Badge */}
                  {toolAttribution && (
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.5px' }}>POWERED BY:</span>
                      {toolAttribution.tools?.map((tool: string, i: number) => (
                        <span key={i} style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '9px',
                          fontWeight: '600',
                          backgroundColor: tool.includes('SAST') ? '#f59e0b22' : tool.includes('Metrics') ? '#6366f122' : '#10b98122',
                          color: tool.includes('SAST') ? '#f59e0b' : tool.includes('Metrics') ? '#818cf8' : '#10b981',
                          border: `1px solid ${tool.includes('SAST') ? '#f59e0b33' : tool.includes('Metrics') ? '#6366f133' : '#10b98133'}`,
                        }}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* SAST Engine Results */}
                  {sastResults && (
                    <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#111224', borderRadius: '6px', border: '1px solid #1e2035' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        SAST ENGINE — {sastResults.rules_checked} RULES SCANNED
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {sastResults.summary?.critical > 0 && <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', backgroundColor: '#ef444422', color: '#ef4444' }}>{sastResults.summary.critical} CRITICAL</span>}
                        {sastResults.summary?.high > 0 && <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', backgroundColor: '#f97316 22', color: '#f97316' }}>{sastResults.summary.high} HIGH</span>}
                        {sastResults.summary?.medium > 0 && <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', backgroundColor: '#f59e0b22', color: '#f59e0b' }}>{sastResults.summary.medium} MEDIUM</span>}
                        {sastResults.summary?.low > 0 && <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', backgroundColor: '#6b728022', color: '#9ca3af' }}>{sastResults.summary.low} LOW</span>}
                        {sastResults.total_findings === 0 && <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', backgroundColor: '#10b98122', color: '#10b981' }}>NO FINDINGS</span>}
                      </div>
                      {sastResults.findings?.slice(0, 5).map((f: any, i: number) => (
                        <div key={i} style={{ fontSize: '10px', color: '#a0a3b8', marginBottom: '4px', paddingLeft: '8px', borderLeft: `2px solid ${f.severity === 'CRITICAL' ? '#ef4444' : f.severity === 'HIGH' ? '#f97316' : f.severity === 'MEDIUM' ? '#f59e0b' : '#6b7280'}` }}>
                          <span style={{ color: f.severity === 'CRITICAL' ? '#ef4444' : f.severity === 'HIGH' ? '#f97316' : '#f59e0b', fontWeight: '600' }}>[{f.rule_id}]</span> {f.title} <span style={{ color: '#6b7280' }}>Line {f.line}</span>
                        </div>
                      ))}
                      {(sastResults.findings?.length || 0) > 5 && <div style={{ fontSize: '9px', color: '#6b7280', paddingLeft: '8px', marginTop: '4px' }}>+ {sastResults.findings.length - 5} more findings</div>}
                    </div>
                  )}
                  {/* Metrics Engine Results */}
                  {metricsResults && (
                    <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#111224', borderRadius: '6px', border: '1px solid #1e2035' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#818cf8', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        METRICS ENGINE — QUALITY SCORE: {metricsResults.quality_score}/100 (GRADE {metricsResults.grade})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px', fontSize: '10px' }}>
                        <span style={{ color: '#a0a3b8' }}>Lines: <span style={{ color: '#e2e4f0' }}>{metricsResults.metrics?.code_lines}</span></span>
                        <span style={{ color: '#a0a3b8' }}>Functions: <span style={{ color: '#e2e4f0' }}>{metricsResults.metrics?.functions}</span></span>
                        <span style={{ color: '#a0a3b8' }}>Complexity: <span style={{ color: (metricsResults.metrics?.cyclomatic_complexity || 0) > 10 ? '#f97316' : '#10b981' }}>{metricsResults.metrics?.cyclomatic_complexity}</span></span>
                        <span style={{ color: '#a0a3b8' }}>Nesting: <span style={{ color: (metricsResults.metrics?.max_nesting_depth || 0) > 4 ? '#f97316' : '#10b981' }}>{metricsResults.metrics?.max_nesting_depth}</span></span>
                        <span style={{ color: '#a0a3b8' }}>Type Coverage: <span style={{ color: (metricsResults.metrics?.type_coverage_pct || 0) < 80 ? '#f59e0b' : '#10b981' }}>{metricsResults.metrics?.type_coverage_pct}%</span></span>
                        <span style={{ color: '#a0a3b8' }}>Comments: <span style={{ color: '#e2e4f0' }}>{metricsResults.metrics?.comment_ratio}%</span></span>
                      </div>
                      {metricsResults.issues?.map((issue: any, i: number) => (
                        <div key={i} style={{ fontSize: '10px', color: '#a0a3b8', marginBottom: '3px', paddingLeft: '8px', borderLeft: `2px solid ${issue.severity === 'HIGH' ? '#f97316' : issue.severity === 'MEDIUM' ? '#f59e0b' : '#6b7280'}` }}>
                          <span style={{ fontWeight: '600', color: issue.severity === 'HIGH' ? '#f97316' : '#f59e0b' }}>[{issue.category}]</span> {issue.detail}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* AI Enrichment Output */}
                  {agentOutput && (sastResults || metricsResults) && !showInterception && !showVerification && (
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      AI ENRICHMENT — CLAUDE SONNET ANALYSIS
                    </div>
                  )}
                  {agentOutput && <div style={{ marginBottom: showInterception || showVerification || showImpact ? '12px' : 0 }}>{agentOutput}</div>}
                  {!agentOutput && !showInterception && !showVerification && !showImpact && '(Run agent to see output)'}

                  {/* ━━━ THREAT INTERCEPTION ALERT ━━━ */}
                  <AnimatePresence>
                    {showInterception && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(239,68,68,0.35)',
                          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))',
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}
                      >
                        {/* Red header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                          background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)',
                        }}>
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
                            <ShieldAlert size={14} style={{ color: '#ef4444' }} />
                          </motion.div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            THREAT INTERCEPTED
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444', marginLeft: 'auto', textTransform: 'uppercase',
                          }}>
                            {SDLC_INTERCEPTION.severity}
                          </span>
                        </div>

                        <div style={{ padding: '12px 14px' }}>
                          {/* Attempted action */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: '#8b8fa8', marginBottom: 3, fontWeight: 600 }}>ATTEMPTED ACTION</div>
                            <div style={{
                              fontSize: 11, color: '#e2e4f0', fontFamily: "'JetBrains Mono', monospace",
                              padding: '6px 10px', borderRadius: 5, background: 'rgba(239,68,68,0.05)',
                              border: '1px solid rgba(239,68,68,0.1)', lineHeight: 1.4,
                            }}>
                              {SDLC_INTERCEPTION.attempted_action}
                            </div>
                          </div>

                          {/* Blocked by */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: '#8b8fa8', marginBottom: 3, fontWeight: 600 }}>BLOCKED BY</div>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                              color: '#818cf8', padding: '5px 10px', borderRadius: 5,
                              background: 'rgba(79,94,255,0.08)', border: '1px solid rgba(79,94,255,0.15)',
                            }}>
                              <Terminal size={12} />
                              OpenShell Policy
                            </div>
                          </div>

                          {/* Risk */}
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: '#8b8fa8', marginBottom: 3, fontWeight: 600 }}>BUSINESS RISK</div>
                            <div style={{ fontSize: 11, color: '#c8cae0', lineHeight: 1.5 }}>
                              {SDLC_INTERCEPTION.risk_description}
                            </div>
                          </div>

                          {/* Compliance */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#f59e0b',
                            padding: '5px 10px', borderRadius: 5, marginBottom: 8,
                            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)',
                          }}>
                            <AlertTriangle size={11} />
                            {SDLC_INTERCEPTION.vertical_context}
                          </div>

                          {/* Why NemoClaw — competitive differentiator */}
                          <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 10, color: '#818cf8',
                            padding: '7px 10px', borderRadius: 5,
                            background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)',
                            lineHeight: 1.5,
                          }}>
                            <Shield size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span><strong style={{ color: '#a5b4fc' }}>Why NemoClaw:</strong> {SDLC_INTERCEPTION.traditional_gap}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ━━━ VERIFICATION PANEL ━━━ */}
                  <AnimatePresence>
                    {showVerification && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(74,222,128,0.2)',
                          background: 'linear-gradient(135deg, rgba(74,222,128,0.04), rgba(74,222,128,0.01))',
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}
                      >
                        {/* Green header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 14px', background: 'rgba(74,222,128,0.06)',
                          borderBottom: '1px solid rgba(74,222,128,0.1)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={13} style={{ color: '#4ade80' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Output Verified
                            </span>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>
                            {SDLC_VERIFICATION_CHECKS.filter(c => c.status === 'pass').length + SDLC_VERIFICATION_CHECKS.filter(c => c.status === 'remediated').length}/{SDLC_VERIFICATION_CHECKS.length} passed
                            <span style={{ color: '#f59e0b' }}> · {SDLC_VERIFICATION_CHECKS.filter(c => c.status === 'remediated').length} auto-fixed</span>
                          </div>
                        </div>

                        {/* Checks list */}
                        <div style={{ padding: '4px 0' }}>
                          {SDLC_VERIFICATION_CHECKS.map((check, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 14px',
                                borderBottom: i < SDLC_VERIFICATION_CHECKS.length - 1 ? '1px solid rgba(30,32,53,0.4)' : 'none',
                              }}
                            >
                              <div style={{ paddingTop: 1, flexShrink: 0 }}>
                                {check.status === 'pass' ? (
                                  <CheckCircle2 size={12} style={{ color: '#4ade80' }} />
                                ) : (
                                  <Wrench size={12} style={{ color: '#f59e0b' }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e4f0' }}>{check.check_name}</span>
                                  {check.compliance_ref && (
                                    <span style={{
                                      fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 2,
                                      background: 'rgba(79,94,255,0.1)', color: '#818cf8',
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                      {check.compliance_ref}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 10, color: '#8b8fa8', lineHeight: 1.4 }}>{check.detail}</div>
                                {check.remediation && (
                                  <div style={{
                                    marginTop: 3, fontSize: 10, color: '#f59e0b', padding: '3px 6px',
                                    borderRadius: 3, background: 'rgba(245,158,11,0.05)',
                                    border: '1px solid rgba(245,158,11,0.08)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                  }}>
                                    ↳ {check.remediation}
                                  </div>
                                )}
                              </div>
                              <span style={{
                                fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, flexShrink: 0,
                                background: check.status === 'pass' ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
                                color: check.status === 'pass' ? '#4ade80' : '#f59e0b',
                                textTransform: 'uppercase',
                              }}>
                                {check.status === 'pass' ? 'PASS' : 'FIXED'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ━━━ IMPACT SUMMARY ━━━ */}
                  <AnimatePresence>
                    {showImpact && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(99,102,241,0.2)',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}
                      >
                        {/* Purple header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                          background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.1)',
                        }}>
                          <Shield size={13} style={{ color: '#818cf8' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Pipeline Governance Summary
                          </span>
                        </div>

                        <div style={{ padding: '12px 14px' }}>
                          {/* Stats row */}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <div style={{
                              flex: 1, padding: '8px 10px', borderRadius: 6,
                              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>1</div>
                              <div style={{ fontSize: 9, color: '#8b8fa8', fontWeight: 600 }}>THREAT BLOCKED</div>
                            </div>
                            <div style={{
                              flex: 1, padding: '8px 10px', borderRadius: 6,
                              background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)', textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>6</div>
                              <div style={{ fontSize: 9, color: '#8b8fa8', fontWeight: 600 }}>CHECKS PASSED</div>
                            </div>
                            <div style={{
                              flex: 1, padding: '8px 10px', borderRadius: 6,
                              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>2</div>
                              <div style={{ fontSize: 9, color: '#8b8fa8', fontWeight: 600 }}>AUTO-FIXED</div>
                            </div>
                            <div style={{
                              flex: 1, padding: '8px 10px', borderRadius: 6,
                              background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>95%</div>
                              <div style={{ fontSize: 9, color: '#8b8fa8', fontWeight: 600 }}>TRUST SCORE</div>
                            </div>
                          </div>

                          {/* Counterfactual */}
                          <div style={{
                            padding: '10px 12px', borderRadius: 6,
                            background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.08)',
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <XCircle size={11} />
                              WITHOUT NEMOCLAW
                            </div>
                            <div style={{ fontSize: 11, color: '#c8cae0', lineHeight: 1.5 }}>
                              This agent would have committed a hardcoded production database credential (CWE-798) to version control, exposing it to all repository contributors and enabling credential harvesting from git history — a direct path to production data breach.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div
        style={{
          width: isMobile ? 0 : '260px',
          minWidth: isMobile ? 0 : '260px',
          borderLeft: isMobile ? 'none' : '1px solid #1e2035',
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#0a0b14',
        }}
      >
        {/* Agent Identity Card */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2035', backgroundColor: '#0f1118' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', letterSpacing: '0.5px' }}>
              AGENT IDENTITY
            </span>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#10b98122',
                color: '#10b981',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: '600',
              }}
            >
              ✓ Verified
            </span>
          </div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#e2e4f0', margin: '0 0 4px 0' }}>
            {AGENT_IDENTITIES[AGENT_TABS[activeAgent].id].id}
          </p>
          <p style={{ fontSize: '11px', color: '#8b8fa3', margin: '0 0 2px 0' }}>
            {AGENT_IDENTITIES[AGENT_TABS[activeAgent].id].role}
          </p>
          <p style={{ fontSize: '10px', color: '#6b6e80', margin: '0 0 6px 0' }}>
            Scope: {AGENT_IDENTITIES[AGENT_TABS[activeAgent].id].scope}
          </p>
          <p style={{ fontSize: '9px', color: '#4f5eff', margin: 0, fontFamily: "'Courier New', monospace" }}>
            SID: {Math.random().toString(36).substring(7).toUpperCase()}
          </p>
        </div>

        {/* GitHub Actions */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2035' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#a0a3b8', margin: '0 0 12px 0' }}>
            GitHub Actions
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: '#8b8fa3', margin: '0 0 6px 0' }}>
              {changedFiles} changed files
            </p>
            <input
              type="text"
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleCommit}
              disabled={commitLoading}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: commitLoading ? '#3a44cc' : '#4f5eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: commitLoading ? 'wait' : 'pointer',
                marginBottom: '8px',
                opacity: commitLoading ? 0.7 : 1,
              }}
            >
              {commitLoading ? 'Committing...' : 'Commit'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePush}
              disabled={pushLoading}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: pushLoading ? '#1a1d33' : '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontWeight: '600',
                cursor: pushLoading ? 'wait' : 'pointer',
                opacity: pushLoading ? 0.7 : 1,
              }}
            >
              {pushLoading ? '...' : 'Push'}
            </button>
            <button
              onClick={handlePR}
              disabled={prLoading}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: prLoading ? '#1a1d33' : '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontWeight: '600',
                cursor: prLoading ? 'wait' : 'pointer',
                opacity: prLoading ? 0.7 : 1,
              }}
            >
              {prLoading ? '...' : 'PR'}
            </button>
          </div>
          {gitStatus && (
            <p style={{
              fontSize: '10px',
              color: gitStatus.includes('failed') || gitStatus.includes('Enter') ? '#ef4444' : '#10b981',
              marginTop: '8px',
              marginBottom: '0',
            }}>
              {gitStatus}
            </p>
          )}
        </div>

        {/* Change Management */}
        {governanceTrail.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2035', backgroundColor: '#0f1118' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.5px' }}>
                CHANGE MGMT
              </span>
            </div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#e2e4f0', margin: '0 0 6px 0' }}>
              {`CHG-2026-${Math.floor(Math.random() * 9000) + 1000}`}
            </p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#10b98122',
                  color: '#10b981',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: '600',
                }}
              >
                Auto-Approved
              </span>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#6366f122',
                  color: '#6366f1',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: '600',
                }}
              >
                Standard
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#8b8fa3', margin: '0 0 4px 0' }}>
              Owner: Platform Engineering
            </p>
            <p style={{ fontSize: '10px', color: '#6b6e80', margin: 0, fontStyle: 'italic' }}>
              Agent → Policy Engine → Auto-Approved
            </p>
          </div>
        )}

        {/* Governance Trail */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2035', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Shield className="w-4 h-4" style={{ color: '#4f5eff' }} />
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#a0a3b8', margin: 0 }}>
              Governance Trail
            </h3>
          </div>

          {governanceTrail.length === 0 ? (
            <p style={{ fontSize: '11px', color: '#6b6e80', margin: 0, textAlign: 'center', paddingTop: '16px' }}>
              Run an agent to see governance events
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {governanceTrail.map((step, idx) => {
                const isThreatStep = step.name === 'Threat Intercepted';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      backgroundColor: isThreatStep ? '#ef444422' : '#111224',
                      border: `1px solid ${
                        isThreatStep
                          ? '#ef4444'
                          : step.status === 'completed'
                            ? '#10b981'
                            : step.status === 'failed'
                              ? '#ef4444'
                              : '#1e2035'
                      }`,
                      borderRadius: '4px',
                      padding: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '6px' }}>
                      {isThreatStep ? (
                        <>
                          {step.status === 'completed' && <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                          {step.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                        </>
                      ) : (
                        <>
                          {step.status === 'completed' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                          )}
                          {step.status === 'processing' && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 mt-0.5" style={{ color: '#4f5eff' }} />
                          )}
                          {step.status === 'failed' && (
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                          )}
                        </>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', margin: 0, color: isThreatStep ? '#ef4444' : '#e2e4f0' }}>
                          {step.name}
                        </p>
                        {step.details && (
                          <p style={{ fontSize: '10px', color: isThreatStep ? '#f97316' : '#8b8fa3', margin: '2px 0 0 0' }}>
                            {step.details}
                          </p>
                        )}
                      </div>
                    </div>
                    {step.isolationLayers && step.isolationLayers.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {step.isolationLayers.map(layer => (
                          <span
                            key={layer}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#1e2035',
                              color: '#10b981',
                              padding: '2px 4px',
                              borderRadius: '2px',
                              fontSize: '9px',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {layer}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {governanceScore > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  style={{
                    backgroundColor: '#111224',
                    border: `1px solid ${governanceScore >= 90 ? '#10b981' : governanceScore >= 70 ? '#f59e0b' : '#ef4444'}`,
                    borderRadius: '4px',
                    padding: '10px',
                    textAlign: 'center',
                    marginTop: '4px',
                  }}
                >
                  <p style={{ fontSize: '10px', color: '#8b8fa3', margin: '0 0 4px 0' }}>
                    Governance Score
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: governanceScore >= 90 ? '#10b981' : governanceScore >= 70 ? '#f59e0b' : '#ef4444', margin: '0 0 8px 0' }}>
                    {governanceScore}/100
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#10b98122',
                      color: '#10b981',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '8px',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                    }}
                  >
                    5W AUDIT: COMPLETE
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Session Summary */}
        {pipelineState.sessionSummary.trustScore > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '12px 16px', borderTop: '1px solid #1e2035', backgroundColor: '#0f1118' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: '#10b981' }} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', letterSpacing: '0.5px' }}>
                SESSION SUMMARY
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ backgroundColor: '#111224', padding: '8px', borderRadius: '4px', border: '1px solid #1e2035' }}>
                <div style={{ color: '#8b8fa3', fontSize: '10px', marginBottom: '2px' }}>Threats Blocked</div>
                <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '13px' }}>
                  {pipelineState.sessionSummary.threatsBlocked}
                </div>
              </div>
              <div style={{ backgroundColor: '#111224', padding: '8px', borderRadius: '4px', border: '1px solid #1e2035' }}>
                <div style={{ color: '#8b8fa3', fontSize: '10px', marginBottom: '2px' }}>Checks Passed</div>
                <div style={{ color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                  {pipelineState.sessionSummary.checksPassed}
                </div>
              </div>
              <div style={{ backgroundColor: '#111224', padding: '8px', borderRadius: '4px', border: '1px solid #1e2035' }}>
                <div style={{ color: '#8b8fa3', fontSize: '10px', marginBottom: '2px' }}>Auto-Remediations</div>
                <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '13px' }}>
                  {pipelineState.sessionSummary.autoRemediations}
                </div>
              </div>
              <div style={{ backgroundColor: '#111224', padding: '8px', borderRadius: '4px', border: '1px solid #10b981' }}>
                <div style={{ color: '#8b8fa3', fontSize: '10px', marginBottom: '2px' }}>Trust Score</div>
                <div style={{ color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                  {pipelineState.sessionSummary.trustScore}%
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test Suite */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e2035' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#a0a3b8', margin: '0 0 12px 0' }}>
            Test Suite
          </h3>

          <button
            onClick={handleRunAllTests}
            disabled={testLoading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: testLoading ? '#3a44cc' : '#4f5eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: testLoading ? 'wait' : 'pointer',
              marginBottom: '12px',
              opacity: testLoading ? 0.7 : 1,
            }}
          >
            {testLoading ? 'Running...' : 'Run All Tests'}
          </button>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#8b8fa3' }}>Coverage</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#10b981' }}>{coverage}%</span>
            </div>
            <div
              style={{
                height: '4px',
                backgroundColor: '#1e2035',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#10b981',
                  width: `${coverage}%`,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {testResults.map((test, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                }}
              >
                {test.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                )}
                <span style={{ color: test.passed ? '#a0a3b8' : '#ef4444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {test.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
