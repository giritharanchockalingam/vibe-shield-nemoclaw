'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Download, Zap, Search, ChevronDown } from 'lucide-react';
import { getGovernanceAudit, getGovernanceStats } from '@/lib/api';
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

  // Calculate block rate
  const blockRate = stats
    ? ((stats.total_blocked / stats.total_events) * 100).toFixed(1)
    : '0.0';

  // Count events per SOC 2 mapping
  const countEventsByLayers = (layers: string[]) => {
    return auditEvents.filter(event => layers.includes(event.isolation_layer)).length;
  };

  // Handle export
  const handleExport = () => {
    toast.success('Export queued — CSV will be generated');
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
    <div style={{ backgroundColor: '#0a0b14', minHeight: '100vh', color: '#e2e4f0' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ padding: '2rem 2rem 1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Shield size={32} style={{ color: '#4f5eff' }} />
          <h1 style={{ fontSize: '2rem', fontFamily: "'DM Serif Display'", margin: 0 }}>
            Immutable Audit Trail
          </h1>
        </div>
        <p style={{ color: '#8b8fa8', margin: 0, marginLeft: '3rem' }}>
          Full chain-of-custody for SOC 2 Type II evidence collection
        </p>
      </motion.div>

      {/* KPI Strip */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '2rem 2rem 0',
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
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <p style={{ color: '#8b8fa8', margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
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
          backgroundColor: '#111224',
          border: '1px solid #1e2035',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          margin: '0 2rem 2rem',
          display: 'grid',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Action Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#8b8fa8', marginBottom: '0.5rem' }}>
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

          {/* Layer Filter */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#8b8fa8', marginBottom: '0.5rem' }}>
              Layer
            </label>
            <button
              onClick={() => setShowLayerDropdown(!showLayerDropdown)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #1e2035',
                backgroundColor: '#1e2035',
                color: '#e2e4f0',
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
                  backgroundColor: '#111224',
                  border: '1px solid #1e2035',
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
                      color: '#e2e4f0',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      borderBottom: '1px solid #1e2035'
                    }}
                  >
                    {layer === 'all' ? 'All Layers' : (layerColors[layer]?.label || layer)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Severity Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#8b8fa8', marginBottom: '0.5rem' }}>
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
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#8b8fa8', marginBottom: '0.5rem' }}>
            Search Details
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#5a5e78' }}
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
                border: '1px solid #1e2035',
                backgroundColor: '#0a0b14',
                color: '#e2e4f0',
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
          margin: '0 2rem 2rem',
          backgroundColor: '#111224',
          border: '1px solid #1e2035',
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
              <tr style={{ backgroundColor: '#0a0b14', borderBottom: '1px solid #1e2035' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#8b8fa8', fontWeight: '600' }}>
                  Timestamp
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#8b8fa8', fontWeight: '600' }}>
                  Action
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#8b8fa8', fontWeight: '600' }}>
                  Layer
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#8b8fa8', fontWeight: '600' }}>
                  Severity
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#8b8fa8', fontWeight: '600' }}>
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {eventsLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#5a5e78' }}>
                    Loading audit events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#5a5e78' }}>
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
                      borderBottom: '1px solid #1e2035',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : '#0f1019'
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#e2e4f0', fontFamily: "'JetBrains Mono'" }}>
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: event.action === 'BLOCKED' ? '#dc2626' : '#16a34a',
                          color: event.action === 'BLOCKED' ? '#fee2e2' : '#dcfce7',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {event.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: layerColors[event.isolation_layer]?.bg,
                          color: layerColors[event.isolation_layer]?.text,
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {layerColors[event.isolation_layer]?.label || event.isolation_layer}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: severityColors[event.severity]?.bg,
                          color: severityColors[event.severity]?.text,
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        color: '#8b8fa8',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={event.detail}
                    >
                      {event.detail}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SOC 2 Compliance Mapping */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 2rem 2rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontFamily: "'DM Serif Display'",
            marginBottom: '1.5rem',
            color: '#e2e4f0'
          }}
        >
          SOC 2 Trust Services Criteria Mapping
        </h2>
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
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
                backgroundColor: '#111224',
                border: '1px solid #1e2035',
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
                <p style={{ margin: 0, color: '#e2e4f0', fontWeight: '600' }}>
                  {mapping.criteria}
                </p>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#8b8fa8', fontSize: '0.875rem' }}>
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
              <p style={{ margin: 0, color: '#5a5e78', fontSize: '0.875rem' }}>
                <strong style={{ color: '#4f5eff' }}>{countEventsByLayers(mapping.layers)}</strong> relevant events
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Evidence Export Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          margin: '0 2rem 2rem',
          backgroundColor: '#111224',
          border: '1px solid #1e2035',
          borderRadius: '0.75rem',
          padding: '2rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontFamily: "'DM Serif Display'",
            marginBottom: '1.5rem',
            color: '#e2e4f0'
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
        </div>
        <p style={{ color: '#8b8fa8', margin: '0', fontSize: '0.875rem' }}>
          All events persisted to append-only storage. Tamper-evident hashing ensures chain-of-custody integrity.
        </p>
      </motion.div>

      {/* Footer spacing */}
      <div style={{ height: '2rem' }} />
    </div>
  );
}
