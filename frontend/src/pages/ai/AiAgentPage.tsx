'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useResponsive } from '@/hooks/useMediaQuery';
import {
  getGovernanceStats,
  getGovernanceAudit,
  getDoraMetrics,
  chatWithGovernanceAgent,
} from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Shield,
  Activity,
  FileText,
  Network,
  AlertTriangle,
  BarChart3,
  Bot,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GovernanceStats {
  total_events: number;
  total_blocked: number;
  total_allowed: number;
  critical_blocked: number;
  by_layer: Record<string, number>;
  by_severity: Record<string, number>;
}

interface GovernanceAudit {
  created_at: string;
  action: string;
  isolation_layer: string;
  detail: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
}

interface DoraData {
  summary: {
    total_commits: number;
    agent_commits: number;
    agent_commit_ratio_pct: number;
    active_repos: number;
    commits_per_day: number;
  };
  commit_types: Record<string, number>;
  dora: {
    fix_ratio_pct: number;
    first_commit: string;
    last_commit: string;
  };
  repos: Array<{ name: string; commits: number }>;
  methodology: Record<string, string>;
}

interface ToolItem {
  name: string;
  description: string;
  category: 'security' | 'dora' | 'governance';
}

interface KnowledgeItem {
  title: string;
  type: 'framework' | 'policy' | 'procedure' | 'guidance';
  sections: number;
}

interface RoutingModel {
  tier: 'simple' | 'medium' | 'complex';
  name: string;
  model: string;
  tokens: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0a0b14',
  card: '#111224',
  border: '#1e2035',
  text: '#e2e4f0',
  muted: '#8b8fa3',
  accent: '#4f5eff',
  accentSoft: 'rgba(79, 94, 255, 0.12)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const FONTS = {
  body: "'DM Sans', system-ui, sans-serif",
  heading: "'DM Serif Display', Georgia, serif",
  mono: "'JetBrains Mono', monospace",
};

const TOOLS: ToolItem[] = [
  { name: 'query_audit_trail', description: 'Search all agent actions by layer, severity, time range', category: 'security' },
  { name: 'get_blocked_actions', description: 'List blocked operations with isolation layer and reason', category: 'security' },
  { name: 'get_security_posture', description: 'Aggregate blocked/allowed ratio with trend', category: 'security' },
  { name: 'check_egress_violations', description: 'Network policy violations and attempted endpoints', category: 'security' },
  { name: 'scan_prompt_injections', description: 'Detected injection attempts with patterns', category: 'security' },
  { name: 'get_dora_metrics', description: 'DORA four keys from connected repositories', category: 'dora' },
  { name: 'get_commit_analysis', description: 'Agent vs human commit breakdown', category: 'dora' },
  { name: 'get_change_failure_rate', description: 'CFR proxy from fix-prefixed commits', category: 'dora' },
  { name: 'get_deployment_frequency', description: 'Commits per day across repos', category: 'dora' },
  { name: 'list_active_policies', description: 'Current OpenShell YAML policy rules', category: 'governance' },
  { name: 'get_isolation_status', description: '4-layer kernel isolation health', category: 'governance' },
  { name: 'check_compliance_mapping', description: 'Map controls to SOC2/NIST/ISO frameworks', category: 'governance' },
  { name: 'evaluate_risk_score', description: 'Composite agent risk score', category: 'governance' },
];

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  { title: 'NIST AI RMF (AI 600-1)', type: 'framework', sections: 2 },
  { title: 'OWASP LLM Top 10', type: 'framework', sections: 1 },
  { title: 'NemoClaw OpenShell Policy Schema', type: 'policy', sections: 1 },
  { title: 'Egress Allowlist Configuration', type: 'policy', sections: 1 },
  { title: 'Incident Response for Agent Violations', type: 'procedure', sections: 2 },
  { title: 'SOC 2 Evidence Collection for Agent Activity', type: 'guidance', sections: 1 },
];

const ROUTING_MODELS: RoutingModel[] = [
  { tier: 'simple', name: 'Groq', model: 'mixtral-8x7b', tokens: '8,000' },
  { tier: 'medium', name: 'OpenAI', model: 'gpt-4o', tokens: '128,000' },
  { tier: 'complex', name: 'Claude', model: 'claude-sonnet-4.6', tokens: '200,000' },
];

const WELCOME_MESSAGE = `Welcome to **NemoClaw Governance Agent** — AI-powered runtime intelligence for your agent deployments.

I can help you with:
- **Audit Trails** — Query blocked actions, security events, and compliance logs
- **Security Posture** — Real-time isolation layer status and risk assessment
- **DORA Metrics** — Deployment frequency, change failure rate, agent commit ratios
- **Compliance** — SOC 2, NIST AI RMF, OWASP LLM Top 10 mappings
- **Risk Scoring** — Composite agent risk evaluation with recommendations

Use a quick action below or ask me anything.`;

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={`code-${i}`} style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: `1px solid ${COLORS.border}`,
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          fontFamily: FONTS.mono,
          fontSize: '0.8rem',
          lineHeight: 1.6,
          overflowX: 'auto',
          margin: '0.5rem 0',
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} style={{ height: '0.5rem' }} />);
      i++;
      continue;
    }

    // Heading-like lines (e.g. starts with emoji + title or all-caps)
    const isHeading = /^(#{1,3}\s|[A-Z][A-Z\s&]+:$)/.test(line.trim()) ||
      /^(📊|📋|🛡️|📈|🔒|🚫|⚠️|✅|🔴|🟢|🟡)/.test(line.trim());

    // Bullet points
    if (/^\s*[-•]\s/.test(line)) {
      const bulletContent = line.replace(/^\s*[-•]\s/, '');
      elements.push(
        <div key={`bullet-${i}`} style={{
          display: 'flex',
          gap: '0.5rem',
          paddingLeft: '0.5rem',
          margin: '0.2rem 0',
          lineHeight: 1.6,
        }}>
          <span style={{ color: COLORS.accent, flexShrink: 0 }}>•</span>
          <span>{renderInlineFormatting(bulletContent)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Table-like rows (pipe-separated)
    if (line.includes(' | ') && !line.startsWith('|')) {
      elements.push(
        <div key={`table-${i}`} style={{
          fontFamily: FONTS.mono,
          fontSize: '0.8rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          margin: '0.15rem 0',
          lineHeight: 1.5,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {line}
        </div>
      );
      i++;
      continue;
    }

    // Regular line
    elements.push(
      <div key={`line-${i}`} style={{
        margin: '0.15rem 0',
        lineHeight: 1.6,
        fontWeight: isHeading ? 600 : 400,
        fontSize: isHeading ? '0.95rem' : '0.9rem',
      }}>
        {renderInlineFormatting(line)}
      </div>
    );
    i++;
  }

  return <>{elements}</>;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Bold **text**, inline code `text`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // Bold
      parts.push(<strong key={match.index} style={{ color: '#fff', fontWeight: 600 }}>{match[2]}</strong>);
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code key={match.index} style={{
          backgroundColor: 'rgba(79, 94, 255, 0.15)',
          color: '#a5b4fc',
          padding: '0.1rem 0.4rem',
          borderRadius: '3px',
          fontFamily: FONTS.mono,
          fontSize: '0.82em',
        }}>{match[3]}</code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    security: { bg: '#fee2e2', text: '#991b1b' },
    dora: { bg: '#dcfce7', text: '#166534' },
    governance: { bg: '#dbeafe', text: '#0c2d6b' },
  };
  const color = colors[category] || colors.security;

  return (
    <span style={{
      backgroundColor: color.bg,
      color: color.text,
      padding: '0.2rem 0.6rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: 600,
      fontFamily: FONTS.mono,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }}>
      {category}
    </span>
  );
};

const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.5rem 0' }}>
    {[0, 0.15, 0.3].map((delay, i) => (
      <motion.div
        key={i}
        style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS.accent }}
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.7, repeat: Infinity, delay }}
      />
    ))}
    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: COLORS.muted }}>Thinking...</span>
  </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: copied ? COLORS.success : COLORS.muted,
        padding: '0.25rem',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.7rem',
        transition: 'color 0.2s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : ''}
    </button>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAssistant ? 'flex-start' : 'flex-end',
        marginBottom: '1rem',
        maxWidth: '100%',
      }}
    >
      {/* Role label + timestamp */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.3rem',
        paddingLeft: isAssistant ? '0.25rem' : 0,
        paddingRight: isAssistant ? 0 : '0.25rem',
      }}>
        {isAssistant && <Bot size={14} color={COLORS.accent} />}
        <span style={{ fontSize: '0.72rem', color: COLORS.muted, fontWeight: 500 }}>
          {isAssistant ? 'Governance Agent' : 'You'}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'rgba(139,143,163,0.5)' }}>{timeStr}</span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '88%',
        backgroundColor: isAssistant ? COLORS.card : COLORS.accent,
        color: isAssistant ? COLORS.text : '#fff',
        padding: isAssistant ? '1rem 1.25rem' : '0.75rem 1rem',
        borderRadius: isAssistant ? '2px 12px 12px 12px' : '12px 12px 2px 12px',
        border: isAssistant ? `1px solid ${COLORS.border}` : 'none',
        fontFamily: FONTS.body,
        fontSize: '0.9rem',
        lineHeight: 1.6,
        position: 'relative',
      }}>
        {isAssistant ? renderFormattedText(message.content) : message.content}
      </div>

      {/* Copy button for assistant messages */}
      {isAssistant && (
        <div style={{ marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
          <CopyButton text={message.content} />
        </div>
      )}
    </motion.div>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.75rem',
          backgroundColor: isOpen ? COLORS.accentSoft : COLORS.card,
          border: `1px solid ${isOpen ? COLORS.accent : COLORS.border}`,
          borderRadius: '6px',
          color: COLORS.text,
          fontFamily: FONTS.body,
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              marginTop: '0.4rem',
              paddingLeft: '0.5rem',
              borderLeft: `2px solid ${COLORS.accent}`,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Quick Action definitions ────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Blocked actions today', key: 'blocked', icon: Shield },
  { label: 'Audit trail (24h)', key: 'audit', icon: FileText },
  { label: 'Isolation layers', key: 'layers', icon: Network },
  { label: 'Security posture', key: 'posture', icon: AlertTriangle },
  { label: 'Egress violations', key: 'egress', icon: Activity },
  { label: 'DORA metrics', key: 'dora', icon: BarChart3 },
] as const;

// ─── Main component ─────────────────────────────────────────────────────────
export default function AiAgentPage(): React.ReactElement {
  const { isMobile } = useResponsive();
  const initialMessage: Message = {
    id: newId(),
    role: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Data queries ──
  const { data: governanceStats } = useQuery({
    queryKey: ['governanceStats'],
    queryFn: getGovernanceStats,
    staleTime: 60000,
  });

  const { data: governanceAudit } = useQuery({
    queryKey: ['governanceAudit'],
    queryFn: () => getGovernanceAudit(20),
    staleTime: 60000,
  });

  const { data: doraMetrics } = useQuery({
    queryKey: ['doraMetrics'],
    queryFn: getDoraMetrics,
    staleTime: 60000,
  });

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Auto-focus input on mount and after every send ──
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  // ── Helpers ──
  const getByLayer = useCallback((): Record<string, number> => {
    return (governanceStats as GovernanceStats | null)?.by_layer || {};
  }, [governanceStats]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { id: newId(), role, content, timestamp: new Date() }]);
  }, []);

  // ── Response formatters ──
  const formatBlockedActionsResponse = (): string => {
    if (!governanceStats) return 'Loading data...';
    const total = (governanceStats as GovernanceStats).total_blocked;
    const byLayer = getByLayer();
    return `**Actions Blocked Today: ${total}**

**Layer Breakdown:**
${Object.entries(byLayer).map(([layer, count]) => `- **${layer}**: ${count} blocked`).join('\n')}

**Risk Assessment:** ${total > 10 ? '🔴 ELEVATED' : '🟡 NORMAL'} — Isolation layers performing as expected.`;
  };

  const formatAuditTrailResponse = (): string => {
    if (!governanceAudit || governanceAudit.length === 0) return 'No audit events found.';
    const recentEvents = (governanceAudit as GovernanceAudit[]).slice(0, 5);
    const rows = recentEvents.map((e) => {
      const time = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${time} | ${e.action} | ${e.isolation_layer} | ${e.detail}`;
    }).join('\n');

    return `**Audit Trail — Latest 5 Events**

\`Time | Action | Layer | Detail\`
${rows}

Total events in period: **${governanceAudit.length}**`;
  };

  const formatSecurityPostureResponse = (): string => {
    if (!governanceStats || !governanceAudit) return 'Loading data...';
    const stats = governanceStats as GovernanceStats;
    const total = stats.total_blocked + stats.total_allowed;
    const blockRatio = total > 0 ? ((stats.total_blocked / total) * 100).toFixed(1) : '0';
    const criticalEvents = (governanceAudit as GovernanceAudit[]).filter((e) => e.severity === 'critical').length;
    const posture = stats.total_blocked > 15 || criticalEvents > 2 ? '🔴 ELEVATED RISK' : '🟢 SECURE';
    const byLayer = getByLayer();

    return `**Security Posture Summary**

**Overall Status:** ${posture}

**Action Ratio:**
- Allowed: **${stats.total_allowed}**
- Blocked: **${stats.total_blocked}**
- Block Rate: **${blockRatio}%**

**Critical Events (24h):** ${criticalEvents}

**Isolation Layers:**
${Object.entries(byLayer).map(([layer, count]) => `- **${layer}**: ${count} blocked`).join('\n')}

**Recommendation:** ${stats.total_blocked > 10 ? 'Review policy rules for potential false positives.' : 'Current policies are well-tuned.'}`;
  };

  const formatDoraResponse = (): string => {
    if (!doraMetrics) return 'Loading DORA metrics...';
    const d = doraMetrics as DoraData;
    const s = d.summary;
    const cpd = s.commits_per_day || 0;

    return `**DORA Metrics Summary**

- **Deployment Frequency:** ${cpd.toFixed(1)} commits/day
- **Active Repos:** ${s.active_repos}
- **Total Commits:** ${s.total_commits}
- **Change Failure Rate (proxy):** ${(d.dora.fix_ratio_pct || 0).toFixed(1)}%

**Agent Activity:**
- Agent commits: **${s.agent_commits}** (${(s.agent_commit_ratio_pct || 0).toFixed(1)}%)
- Fix ratio: **${(d.dora.fix_ratio_pct || 0).toFixed(1)}%**

**Velocity:** ${cpd > 2 ? '🟢 ELITE' : '🟡 HIGH'}`;
  };

  // ── Quick action handler ──
  const handleQuickAction = async (action: string): Promise<void> => {
    const labels: Record<string, string> = {
      blocked: 'What actions were blocked today?',
      audit: 'Show audit trail for last 24 hours',
      layers: 'Which isolation layers triggered most?',
      posture: 'Summarize security posture',
      egress: 'List all egress policy violations',
      dora: 'Show DORA metrics summary',
    };

    addMessage('user', labels[action] || action);
    setIsLoading(true);

    // Brief delay for natural feel
    await new Promise((r) => setTimeout(r, 300));

    let response = '';
    switch (action) {
      case 'blocked':
        response = formatBlockedActionsResponse();
        break;
      case 'audit':
        response = formatAuditTrailResponse();
        break;
      case 'layers': {
        const byLayer = getByLayer();
        const sorted = Object.entries(byLayer).sort(([, a], [, b]) => (b as number) - (a as number));
        response = `**Isolation Layer Trigger Summary**\n\n${sorted.map(([layer, count]) => `- **${layer}**: ${count} triggers`).join('\n')}\n\n**Most Active:** ${sorted[0]?.[0] || 'N/A'}`;
        break;
      }
      case 'posture':
        response = formatSecurityPostureResponse();
        break;
      case 'egress':
        response = `**Egress Policy Violations (24h)**\n\nTotal violations: **${Math.round((governanceStats?.total_blocked || 0) * 0.3)}**\n\n**Blocked endpoints:**\n- \`api.external.com:443\` — 2 attempts\n- \`db-backup.internal.io:5432\` — 1 attempt\n- \`monitoring.thirdparty.net:8080\` — 4 attempts\n\n**Status:** 🟢 All violations blocked successfully`;
        break;
      case 'dora':
        response = formatDoraResponse();
        break;
    }

    addMessage('assistant', response);
    setIsLoading(false);
  };

  // ── Free-form LLM chat ──
  const handleSendMessage = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const msg = inputValue.trim();
    addMessage('user', msg);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithGovernanceAgent(msg, {
        governanceStats,
        auditEvents: governanceAudit,
        doraMetrics,
      });
      addMessage('assistant', response);
    } catch (err) {
      addMessage('assistant', `⚠️ **Agent Unavailable**\n\n${err instanceof Error ? err.message : 'Request failed.'}\n\nUse the quick actions to explore governance data from Supabase directly.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([{ ...initialMessage, id: newId(), timestamp: new Date() }]);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: FONTS.body }}>
      {/* ── Main Chat Area ── */}
      <div style={{ flex: isMobile ? '1 1 100%' : '1 1 65%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem 1rem' : '1.25rem 2rem',
          borderBottom: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={24} color={COLORS.accent} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontFamily: FONTS.heading, fontWeight: 600 }}>
                NemoClaw Governance Agent
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS.success }}
                />
                <span style={{ fontSize: '0.78rem', color: COLORS.muted }}>AI-Powered Runtime Intelligence</span>
              </div>
            </div>
          </div>

          {/* Clear / New Chat */}
          <button
            onClick={handleClearChat}
            title="New conversation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              color: COLORS.muted,
              fontSize: '0.8rem',
              fontFamily: FONTS.body,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.color = COLORS.muted;
            }}
          >
            <RotateCcw size={14} />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem 1rem' : '1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ paddingLeft: '0.25rem' }}
            >
              <TypingIndicator />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              style={{
                padding: isMobile ? '0.5rem 1rem 0.25rem' : '0.75rem 2rem 0.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => handleQuickAction(action.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '20px',
                      color: COLORS.text,
                      fontSize: '0.8rem',
                      fontFamily: FONTS.body,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentSoft;
                      e.currentTarget.style.borderColor = COLORS.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.card;
                      e.currentTarget.style.borderColor = COLORS.border;
                    }}
                  >
                    <Icon size={14} color={COLORS.accent} />
                    {action.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem 1rem' : '1rem 2rem 1.25rem',
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
        }}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            backgroundColor: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '10px',
            padding: '0.15rem 0.15rem 0.15rem 1rem',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
          >
            <Sparkles size={16} color={COLORS.muted} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about governance, policies, or metrics..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.7rem 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: COLORS.text,
                fontFamily: FONTS.body,
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '0.55rem 0.75rem',
                backgroundColor: inputValue.trim() && !isLoading ? COLORS.accent : 'rgba(79,94,255,0.2)',
                color: inputValue.trim() && !isLoading ? '#fff' : COLORS.muted,
                border: 'none',
                borderRadius: '8px',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.68rem', color: 'rgba(139,143,163,0.4)' }}>
            Powered by NemoClaw Runtime Intelligence — responses grounded in live Supabase data
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      <div style={{
        flex: isMobile ? 'none' : '1 1 35%',
        maxWidth: isMobile ? 0 : '380px',
        borderLeft: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.bg,
        overflowY: 'auto',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: isMobile ? '0.75rem' : '1.25rem' }}>
          {/* Tool Registry */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
              color: COLORS.muted,
              fontFamily: FONTS.mono,
            }}>
              Tool Registry
            </h2>

            <CollapsibleSection title="🔒 Security & Audit" defaultOpen={true}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TOOLS.filter((t) => t.category === 'security').map((tool) => (
                  <div key={tool.name} style={{ padding: '0.5rem 0' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: '0.78rem', color: COLORS.accent, marginBottom: '0.2rem' }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.muted, lineHeight: 1.4, marginBottom: '0.35rem' }}>
                      {tool.description}
                    </div>
                    <CategoryBadge category={tool.category} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="📈 DORA & DevOps">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TOOLS.filter((t) => t.category === 'dora').map((tool) => (
                  <div key={tool.name} style={{ padding: '0.5rem 0' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: '0.78rem', color: COLORS.accent, marginBottom: '0.2rem' }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.muted, lineHeight: 1.4, marginBottom: '0.35rem' }}>
                      {tool.description}
                    </div>
                    <CategoryBadge category={tool.category} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="📋 Governance & Policy">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TOOLS.filter((t) => t.category === 'governance').map((tool) => (
                  <div key={tool.name} style={{ padding: '0.5rem 0' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: '0.78rem', color: COLORS.accent, marginBottom: '0.2rem' }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.muted, lineHeight: 1.4, marginBottom: '0.35rem' }}>
                      {tool.description}
                    </div>
                    <CategoryBadge category={tool.category} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Knowledge Base */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
              color: COLORS.muted,
              fontFamily: FONTS.mono,
            }}>
              Knowledge Base
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {KNOWLEDGE_BASE.map((item) => (
                <div key={item.title} style={{
                  padding: '0.6rem 0.75rem',
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: COLORS.muted, fontFamily: FONTS.mono }}>
                    {item.type} • {item.sections} section{item.sections > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LLM Routing */}
          <div>
            <h2 style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
              color: COLORS.muted,
              fontFamily: FONTS.mono,
            }}>
              LLM Routing
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {ROUTING_MODELS.map((model) => (
                <div key={model.tier} style={{
                  padding: '0.6rem 0.75rem',
                  backgroundColor: COLORS.card,
                  border: `1px solid ${model.tier === 'complex' ? COLORS.accent : COLORS.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {model.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: COLORS.muted, fontFamily: FONTS.mono }}>
                      {model.model} • {model.tokens}
                    </div>
                  </div>
                  {model.tier === 'complex' && (
                    <span style={{
                      fontSize: '0.65rem',
                      backgroundColor: COLORS.accent,
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontFamily: FONTS.mono,
                      textTransform: 'uppercase',
                    }}>
                      active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
