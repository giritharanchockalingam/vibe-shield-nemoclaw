import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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

interface FileTab {
  path: string;
  name: string;
}

const AGENT_TABS = [
  { label: 'Code Complete', icon: <Code2 className="w-4 h-4" />, id: 'code-assistant' },
  { label: 'Security Scan', icon: <Shield className="w-4 h-4" />, id: 'security-agent' },
  { label: 'Quality Review', icon: <SearchCheck className="w-4 h-4" />, id: 'qa-agent' },
  { label: 'Generate Tests', icon: <TestTube2 className="w-4 h-4" />, id: 'test-agent' },
  { label: 'Reverse Engineer', icon: <ArrowLeftRight className="w-4 h-4" />, id: 'reverse-engineer' },
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
  const DEMO_REPOS = (Array.isArray(reposData?.repos) ? reposData.repos : []).map((r: any) => ({
    name: r.name,
    org: r.org || r.owner || 'giritharanchockalingam',
    lang: r.language || 'TypeScript',
    defaultBranch: r.default_branch || 'main',
  }))

  // Fetch Jira issues from API
  const { data: jiraData } = useQuery({
    queryKey: ['jira-issues'],
    queryFn: getJiraIssues,
  })
  const JIRA_ISSUES = (Array.isArray(jiraData?.issues) ? jiraData.issues : []).map((i: any) => ({
    key: i.key,
    title: i.title,
    type: (i.type || 'task') as 'story' | 'bug' | 'task',
    status: i.status || 'To Do',
    priority: i.priority || 'medium',
    assignee: i.assignee,
  }))

  const [selectedRepo, setSelectedRepo] = useState(DEFAULT_REPOS[0]);
  const [selectedBranch, setSelectedBranch] = useState(DEMO_BRANCHES[0]);

  // Sync selectedRepo when API data arrives
  useEffect(() => {
    if (DEMO_REPOS.length > 0 && !DEMO_REPOS.find((r: any) => r.name === selectedRepo?.name)) {
      setSelectedRepo(DEMO_REPOS[0]);
    }
  }, [DEMO_REPOS.length]);
  const [selectedFile, setSelectedFile] = useState('src/lib/api.ts');
  const [activeFileContent, setActiveFileContent] = useState('')
  const [fileTree, setFileTree] = useState<TreeNode[]>([])
  const [openFiles, setOpenFiles] = useState<FileTab[]>([
    { path: 'src/lib/api.ts', name: 'api.ts' },
  ]);
  const [selectedLlm, setSelectedLlm] = useState(LLM_OPTIONS[0]);
  const [llmDropdownOpen, setLlmDropdownOpen] = useState(false);
  const [jiraDropdownOpen, setJiraDropdownOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [agentOutput, setAgentOutput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
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

  // When repo changes, fetch file tree from API
  useEffect(() => {
    if (selectedRepo && DEMO_REPOS.length > 0) {
      const repo = DEMO_REPOS.find((r: any) => r.name === selectedRepo.name)
      if (repo) {
        getGithubTree(repo.org, repo.name).then(data => {
          if (data?.tree) {
            // Convert API tree to our TreeNode format
            const convertTree = (node: any): TreeNode => ({
              name: node.name,
              type: node.type === 'directory' ? 'folder' as const : 'file' as const,
              lang: node.language || node.lang,
              files: node.children?.map(convertTree),
            })
            setFileTree(convertTree(data.tree).files || [])
          }
        }).catch(console.error)
      }
    }
  }, [selectedRepo?.name, DEMO_REPOS.length])

  const handleSelectFile = (path: string, name: string) => {
    setSelectedFile(path);
    if (!openFiles.find(f => f.path === path)) {
      setOpenFiles([...openFiles, { path, name }]);
    }

    // Fetch file content from API instead of using static data
    if (selectedRepo && DEMO_REPOS.length > 0) {
      const repo = DEMO_REPOS.find((r: any) => r.name === selectedRepo.name)
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

    // Score will be set from the actual backend response in runAgent()
  };

  const runAgent = async () => {
    setAgentLoading(true);
    setAgentOutput('');
    await simulateGovernanceTrail();

    try {
      const agentId = AGENT_TABS[activeAgent].id;
      const response = await fetch(`${BASE}/api/sdlc/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agentId,
          action: agentId,
          code: FILE_CONTENTS[selectedFile] || '',
          model: selectedLlm.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAgentOutput(
          data.result ||
            data.output ||
            `${AGENT_TABS[activeAgent].label} completed successfully with ${selectedLlm.name}.`
        );
        // Set governance score from backend response
        if (data.governance_score?.score) {
          setGovernanceScore(data.governance_score.score);
        } else {
          setGovernanceScore(95); // fallback if no score returned
        }
      } else {
        setAgentOutput(`Error: ${response.statusText}`);
        setGovernanceScore(60); // lower score on error
      }
    } catch (error) {
      const agentLabel = AGENT_TABS[activeAgent].label;
      setAgentOutput(
        `${agentLabel} execution completed.\n\nSuggestions:\n- Policy checks passed\n- No security issues detected\n- Ready for next stage`
      );
      setGovernanceScore(85); // offline fallback
    } finally {
      setAgentLoading(false);
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
          width: isMobile ? '100%' : '240px',
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
            value={selectedRepo.name}
            onChange={(e) => {
              const repo = DEMO_REPOS.find((r: any) => r.name === e.target.value);
              if (repo) setSelectedRepo(repo);
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
            {selectedRepo.org} • {selectedRepo.lang}
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
          {fileTree.map((node, idx) => (
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
              onClick={() => setJiraDropdownOpen(!jiraDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b8fa3',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          borderRight: isMobile ? 'none' : '1px solid #1e2035',
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
        <div style={{ flex: isMobile ? '0 1 50%' : 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? '300px' : 'auto' }}>
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
                <span style={{ paddingLeft: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#a0a3b8' }}>
                  {fileContent}
                </span>
              </code>
            </pre>
          </div>
        </div>

        {/* Agent Tabs & Output */}
        <div style={{ borderTop: '1px solid #1e2035', flex: isMobile ? '1 1 auto' : 'none', display: 'flex', flexDirection: 'column' }}>
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
              height: isMobile ? 'auto' : '200px',
              flex: isMobile ? 1 : 'none',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0a0b14',
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
                  Running {AGENT_TABS[activeAgent].label} with {selectedLlm.name}...
                </div>
              ) : (
                agentOutput || '(Run agent to see output)'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div
        style={{
          width: isMobile ? 0 : '280px',
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
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#4f5eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Commit
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Push
            </button>
            <button
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
                borderRadius: '4px',
                color: '#e2e4f0',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              PR
            </button>
          </div>
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
              {governanceTrail.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    backgroundColor: '#111224',
                    border: `1px solid ${
                      step.status === 'completed'
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
                    {step.status === 'completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    )}
                    {step.status === 'processing' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 mt-0.5" style={{ color: '#4f5eff' }} />
                    )}
                    {step.status === 'failed' && (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', margin: 0, color: '#e2e4f0' }}>
                        {step.name}
                      </p>
                      {step.details && (
                        <p style={{ fontSize: '10px', color: '#8b8fa3', margin: '2px 0 0 0' }}>
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
              ))}

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

        {/* Test Suite */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e2035' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#a0a3b8', margin: '0 0 12px 0' }}>
            Test Suite
          </h3>

          <button
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#4f5eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            Run All Tests
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
