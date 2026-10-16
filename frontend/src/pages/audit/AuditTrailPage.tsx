'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useResponsive } from '@/hooks/useMediaQuery';
import { motion } from 'framer-motion';
import { Shield, Download, Zap, Search, ChevronDown, User, Clock, MapPin, FileText, HelpCircle, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { getGovernanceAudit, getGovernanceStats, getCisoIncidents, getCisoSiem, getAppConfig } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuditEvent {
  id: string;
  action: 'BLOCKED' | 'ALLOWED';
  isolation_layer: 'landlock' | 'seccomp' | 'netns' | 'openshell' | 'gateway';
  severity: 'critical' | 'high' | 'info' | 'low';
  detail: string;
  created_at: string;
}

interface GovernanceStats {
  total_events: number;
  total_blocked: number;
  total_allowed: number;
  critical_blocked: number;
  high_blocked: number;
}

type ActionFilter = 'all' | 'blocked' | 'allowed';
type SeverityFilter = 'all' | 'critical' | 'high' | 'info' | 'low';

interface SOC2Mapping {
  id: string;
  criteria: string;
  layers: string[];
  description: string;
}

const soc2Mappings: SOC2Mapping[] = [
  {
    id: 'CC6.1',
    criteria: 'Logical Access Controls',
    layers: ['landlock', 'openshell'],
    description: 'Process isolation and capability restrictions prevent unauthorized access'
  },
  {
    id: 'CC6.2',
    criteria: 'System Operations & Monitoring',
    layers: ['seccomp'],
    description: 'Syscall filtering provides real-time system call monitoring'
  },
  {
    id: 'CC6.6',
    criteria: 'External Threat Detection',
    layers: ['netns'],
    description: 'Network namespace isolation blocks unauthorized egress'
  },
  {
    id: 'CC7.2',
    criteria: 'Continuous Monitoring',
    layers: ['landlock', 'seccomp', 'netns', 'openshell', 'gateway'],
    description: 'All events logged to append-only storage with tamper-evident hashing'
  },
  {
    id: 'CC8.1',
    criteria: 'Change Management',
    layers: ['gateway'],
    description: 'Policy evaluations and gateway decisions tracked for compliance'
  }
];

const layerColors: Record<string, { bg: string; text: string; label: string }> = {
  landlock: { bg: '#b45309', text: '#fef3c7', label: 'Landlock' },
  seccomp: { bg: '#7c3aed', text: '#ede9fe', label: 'Seccomp' },
  netns: { bg: '#0891b2', text: '#cffafe', label: 'NetNS' },
  openshell: { bg: '#2563eb', text: '#dbeafe', label: 'OpenShell' },
  gateway: { bg: '#16a34a', text: '#dcfce7', label: 'Gateway' }
};

const severityColors: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#dc2626', text: '#fee2e2' },
  high: { bg: '#ea580c', text: '#fed7aa' },
  info: { bg: '#0284c7', text: '#e0f2fe' },
  low: { bg: '#6b7280', text: '#f3f4f6' }
};

export default function AuditTrailPage() {
  const { isMobile } = useResponsive();
  const { data: appCfg } = useQuery({ queryKey: ['app-config'], queryFn: getAppConfig, retry: 0 });
  const demoMode = !!appCfg?.demo_mode;
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);

  // Fetch audit events
  const { data: auditEvents = [], isLoading: eventsLoading } = useQuery<AuditEvent[]>({
    queryKey: ['governanceAudit'],
    queryFn: () => getGovernanceAudit(100),
    refetchInterval: 5000
  });

  // Fetch statistics
  const { data: stats } = useQuery<GovernanceStats>({
    queryKey: ['governanceStats'],
    queryFn: () => getGovernanceStats(),
    refetchInterval: 5000
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['ciso-incidents-audit'],
    queryFn: () => getCisoIncidents(5),
    refetchInterval: 15000,
  })

  const { data: siemData } = useQuery({
    queryKey: ['ciso-siem-audit'],
    queryFn: getCisoSiem,
    refetchInterval: 15000,
  })

  // Compute filtered events
  const filteredEvents = useMemo(() => {
    return auditEvents.filter(event => {
      // Action filter
      if (actionFilter === 'blocked' && event.action !== 'BLOCKED') return false;
      if (actionFilter === 'allowed' && event.action !== 'ALLOWED') return false;

      // Layer filter
      if (layerFilter !== 'all' && event.isolation_layer !== layerFilter) return false;

      // Severity filter
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;

      // Search filter
      if (searchQuery && !event.detail.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [auditEvents, actionFilter, layerFilter, severityFilter, searchQuery]);

  // Calculate block rate (guard divide-by-zero so we never render NaN%)
  const blockRate = stats && stats.total_events > 0
    ? ((stats.total_blocked / stats.total_events) * 100).toFixed(1)
    : '0.0';

  // Count events per SOC 2 mapping
  const countEventsByLayers = (layers: string[]) => {
    return auditEvents.filter(event => layers.includes(event.isolation_layer)).length;
  };

  // Handle export — generate a real CSV from the events on screen
  const handleExport = () => {
    const rows = filteredEvents;
    if (rows.length === 0) { toast.error('No events to export'); return; }
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['timestamp', 'action', 'severity', 'layer', 'detail'];
    const csv = [
      header.join(','),
      ...rows.map(e => [
        e.created_at || (e as any).timestamp || '',
        e.action || '', e.severity || '',
        e.isolation_layer || (e as any).event_type || 'gateway',
        e.detail || '',
      ].map(esc).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} events to CSV`);
  };

  const handleScheduleSIEM = () => {
    toast.success('SIEM forward scheduled — events will stream to your SIEM');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', height: '100%', overflow: 'auto', color: 'var(--text-primary)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ padding: isMobile ? '1rem 1rem 0.5rem' : '2rem 2rem 1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Shield size={32} style={{ color: '#4f5eff' }} />
          <h1 style={{ fontSize: '2rem', fontFamily: "'DM Serif Display'", margin: 0 }}>
            Immutable Audit Trail
          </h1>
          <span style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: 8,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', fontSize: 12, fontWeight: 600,
          }}>
            5W Format: WHO · WHAT · WHEN · WHERE · WHY
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, marginLeft: '3rem' }}>
          Full chain-of-custody for SOC 2 Type II evidence collection — every event traceable with agent identity, action detail, timestamp, isolation layer, and policy rationale
        </p>
      </motion.div>

      {/* KPI Strip */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: isMobile ? '1rem 1rem 0' : '2rem 2rem 0',
          marginBottom: '2rem'
        }}
      >
        {[
          { label: 'Total Events', value: stats?.total_events ?? 0, color: '#4f5eff' },
          { label: 'Blocked', value: stats?.total_blocked ?? 0, color: '#ef4444' },
          { label: 'Allowed', value: stats?.total_allowed ?? 0, color: '#4ade80' },
          { label: 'Block Rate', value: `${blockRate}%`, color: '#f59e0b' }
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <p style={{ color: 'var(--text-secondary)', margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                {kpi.label}
              </p>
              <p
                style={{
                  fontSize: '2rem',
                  fontFamily: "'JetBrains Mono'",
                  fontWeight: 'bold',
                  margin: 0,
                  color: kpi.color
                }}
              >
                {kpi.value}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '0.75rem',
          padding: isMobile ? '1rem' : '1.5rem',
          margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem',
          display: 'grid',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Action Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Action
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['all', 'blocked', 'allowed'] as const).map(value => (
                <button
                  key={value}
                  onClick={() => setActionFilter(value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: actionFilter === value ? '#4f5eff' : '#1e2035',
                    color: actionFilter === value ? '#ffffff' : '#8b8fa8',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: actionFilter === value ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Filter — isolation layers are a demo-only dimension; real
              gateway events don't carry one, so hide the filter in real mode. */}
          {demoMode && (
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Layer
            </label>
            <button
              onClick={() => setShowLayerDropdown(!showLayerDropdown)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {layerFilter === 'all' ? 'All Layers' : (layerColors[layerFilter]?.label || layerFilter)}
              <ChevronDown size={16} />
            </button>
            {showLayerDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0.375rem',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
              >
                {['all', 'landlock', 'seccomp', 'netns', 'openshell', 'gateway'].map(layer => (
                  <button
                    key={layer}
                    onClick={() => {
                      setLayerFilter(layer);
                      setShowLayerDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--border-default)'
                    }}
                  >
                    {layer === 'all' ? 'All Layers' : (layerColors[layer]?.label || layer)}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Severity Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Severity
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['all', 'critical', 'high', 'info', 'low'] as const).map(value => (
                <button
                  key={value}
                  onClick={() => setSeverityFilter(value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: severityFilter === value ? '#4f5eff' : '#1e2035',
                    color: severityFilter === value ? '#ffffff' : '#8b8fa8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: severityFilter === value ? '600' : '400',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {value === 'all' ? 'All' : value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Search Details
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search audit details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Audit Events Table */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '0.75rem',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> WHEN</span>
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> WHO</span>
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12} /> WHAT</span>
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> WHERE</span>
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Severity
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HelpCircle size={12} /> WHY</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {eventsLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No events match your filters
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event, idx) => (
                  <motion.tr
                    key={event.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)'
                    }}
                  >
                    {/* WHEN */}
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono'", fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(event.created_at || (event as any).timestamp).toLocaleString()}
                    </td>
                    {/* WHO */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {demoMode
                            ? (event.isolation_layer === 'gateway' ? 'AGT-GW-006' :
                               event.isolation_layer === 'landlock' ? 'AGT-CC-001' :
                               event.isolation_layer === 'seccomp' ? 'AGT-SS-002' :
                               event.isolation_layer === 'netns' ? 'AGT-QA-003' : 'AGT-TG-004')
                            : ((event as any).actor || (event as any).user_id || (event as any).event_type || 'gateway')}
                        </span>
                        <span style={{
                          display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                          backgroundColor: event.action === 'BLOCKED' ? '#dc2626' : '#16a34a',
                          color: '#fff', fontSize: '0.625rem', fontWeight: 700, width: 'fit-content'
                        }}>
                          {event.action}
                        </span>
                      </div>
                    </td>
                    {/* WHAT */}
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={event.detail}>
                      {event.detail}
                    </td>
                    {/* WHERE */}
                    <td style={{ padding: '1rem' }}>
                      {(() => {
                        const where = event.isolation_layer || 'gateway';
                        const c = layerColors[where] || layerColors.gateway;
                        return (
                          <span style={{
                            display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '0.375rem',
                            backgroundColor: c.bg, color: c.text,
                            fontSize: '0.7rem', fontWeight: '600'
                          }}>
                            {c.label || where}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Severity */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '0.375rem',
                        backgroundColor: severityColors[event.severity]?.bg,
                        color: severityColors[event.severity]?.text,
                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'capitalize'
                      }}>
                        {event.severity}
                      </span>
                    </td>
                    {/* WHY */}
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {event.action === 'BLOCKED' ? 'Policy violation — deny-all default' : 'Passed all governance checks'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Demo-only governance theater: SOC 2 mapping, incident timeline, and
          SIEM status are seeded illustrative data, shown only in DEMO_MODE. */}
      {demoMode && (<>
      {/* SOC 2 Compliance Mapping */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontFamily: "'DM Serif Display'",
            marginBottom: '1.5rem',
            color: 'var(--text-primary)'
          }}
        >
          SOC 2 Trust Services Criteria Mapping
        </h2>
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'
          }}
        >
          {soc2Mappings.map((mapping, idx) => (
            <motion.div
              key={mapping.id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: idx * 0.1 }}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '0.75rem',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#4f5eff',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono'",
                    whiteSpace: 'nowrap'
                  }}
                >
                  {mapping.id}
                </span>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600' }}>
                  {mapping.criteria}
                </p>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {mapping.description}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {mapping.layers.map(layer => (
                  <span
                    key={layer}
                    style={{
                      display: 'inline-block',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: layerColors[layer]?.bg,
                      color: layerColors[layer]?.text,
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    {layerColors[layer]?.label || layer}
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <strong style={{ color: '#4f5eff' }}>{countEventsByLayers(mapping.layers)}</strong> relevant events
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Incident Response Timeline */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{ margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem' }}
      >
        <h2 style={{ fontSize: '1.25rem', fontFamily: "'DM Serif Display'", marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
          Incident Response Timeline
        </h2>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '1.5rem' }}>
          {(incidentsData?.incidents || []).map((incident: any, idx: number) => (
  <div key={incident.id || idx} style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <AlertTriangle size={14} style={{ color: incident.severity === 'critical' ? '#ef4444' : incident.severity === 'high' ? '#f59e0b' : '#06b6d4' }} />
      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{incident.title}</span>
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: incident.status === 'resolved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: incident.status === 'resolved' ? '#10b981' : '#ef4444' }}>{incident.status?.toUpperCase()}</span>
    </div>
    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{incident.description}</div>
    <div style={{ borderLeft: '2px solid #1e2035', paddingLeft: 16, marginLeft: 6 }}>
      {(incident.timeline || []).map((step: any, si: number) => (
        <div key={si} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
          <span style={{ color: '#6b7089', minWidth: 48, fontFamily: 'monospace' }}>{step.time}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{step.event}</span>
          <span style={{ color: '#4f5eff', fontSize: 10 }}>[{step.actor}]</span>
        </div>
      ))}
    </div>
  </div>
))}
        </div>
      </motion.div>

      {/* SIEM Integration Status */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{ margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem' }}
      >
        <h2 style={{ fontSize: '1.25rem', fontFamily: "'DM Serif Display'", marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          SIEM & Log Integration
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {(siemData?.integrations || []).map((siem: any, idx: number) => {
            const statusColor = siem.status === 'connected' ? '#10b981' : siem.status === 'degraded' ? '#f59e0b' : '#ef4444';
            return (
              <div key={idx} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{siem.name}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ textTransform: 'capitalize' }}>{siem.status}</span>
                  <span>{siem.events_per_hour}/hr</span>
                </div>
                <div style={{ fontSize: 10, color: '#6b7089', marginTop: 6 }}>Format: {siem.format}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
      </>)}

      {/* Evidence Export Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: isMobile ? '0 1rem 2rem' : '0 2rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '0.75rem',
          padding: isMobile ? '1.5rem 1rem' : '2rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontFamily: "'DM Serif Display'",
            marginBottom: '1.5rem',
            color: 'var(--text-primary)'
          }}
        >
          Export Audit Evidence
        </h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#4f5eff',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} />
            Export as CSV
          </button>
          {demoMode && (
          <button
            onClick={handleScheduleSIEM}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={16} />
            Schedule SIEM Forward
          </button>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: '0.875rem' }}>
          All events persisted to append-only storage. Tamper-evident hashing ensures chain-of-custody integrity.
        </p>
      </motion.div>

      {/* Footer spacing */}
      <div style={{ height: '2rem' }} />
    </div>
  );
}
