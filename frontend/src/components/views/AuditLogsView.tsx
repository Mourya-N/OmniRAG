import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
}

export const AuditLogsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const logs: AuditLogEntry[] = [
    {
      id: 'log-1',
      timestamp: '2026-10-31 02:28:14 UTC',
      actor: 'sarah.jenkins@enterprise.ai',
      action: 'DOCUMENT_INGESTED',
      resource: 'Q3_Financial_Report_2024.pdf (SHA: 8f92a1c4)',
      ipAddress: '198.51.100.45',
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      timestamp: '2026-10-31 02:15:32 UTC',
      actor: 'marcus.brody@enterprise.ai',
      action: 'RBAC_POLICY_UPDATED',
      resource: 'Tenant Security Matrix / Analyst Scope',
      ipAddress: '203.0.113.88',
      status: 'SUCCESS',
    },
    {
      id: 'log-3',
      timestamp: '2026-10-31 01:54:10 UTC',
      actor: 'anonymous_probe_attempt',
      action: 'UNAUTHORIZED_CROSS_TENANT_ACCESS',
      resource: 'qdrant://tenant_00000000_collections',
      ipAddress: '185.220.101.5',
      status: 'DENIED',
    },
    {
      id: 'log-4',
      timestamp: '2026-10-31 01:42:05 UTC',
      actor: 'alex.chen@enterprise.ai',
      action: 'AGENTIC_QUERY_EXECUTED',
      resource: 'rag_query://cloud_arr_expansion_multi_hop',
      ipAddress: '198.51.100.12',
      status: 'SUCCESS',
    },
    {
      id: 'log-5',
      timestamp: '2026-10-30 23:19:40 UTC',
      actor: 'system_cron_worker',
      action: 'STRESS_BENCHMARK_PROFILED',
      resource: 'bge_reranker_large_throughput_suite',
      ipAddress: '10.0.4.18 (VPC Internal)',
      status: 'SUCCESS',
    },
  ];

  const filtered = logs.filter((l) => {
    const matchesFilter = selectedFilter === 'ALL' || l.status === selectedFilter;
    const matchesSearch =
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-indigo-900 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">SOC 2 / GDPR Compliance Audit Logs</h2>
            <p className="text-xs t-muted">Immutable tamper-evident event stream capturing authentication, document access, and system mutations</p>
          </div>
        </div>

        <button
          onClick={() => alert('Exporting signed immutable audit stream (CSV / JSON)...')}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Audit Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          {['ALL', 'SUCCESS', 'DENIED', 'FLAGGED'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors ${
                selectedFilter === f
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 't-muted hover:t-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 t-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actor, action, IP, resource..."
            className="pl-8 pr-3 py-2 text-xs rounded-xl glass-input w-full sm:w-72"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bento-card rounded-3xl p-6 shadow-xl overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b t-muted uppercase text-[10px]" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-3 font-semibold">Timestamp</th>
              <th className="pb-3 font-semibold">Actor Identity</th>
              <th className="pb-3 font-semibold">Event Action</th>
              <th className="pb-3 font-semibold">Target Resource</th>
              <th className="pb-3 font-semibold">Client IP</th>
              <th className="pb-3 font-semibold text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 t-muted whitespace-nowrap text-[11px]">{log.timestamp}</td>
                <td className="py-3.5 font-medium t-primary max-w-xs truncate">{log.actor}</td>
                <td className="py-3.5 text-indigo-400 font-bold text-[11px]">{log.action}</td>
                <td className="py-3.5 t-secondary max-w-xs truncate">{log.resource}</td>
                <td className="py-3.5 t-muted text-[11px]">{log.ipAddress}</td>
                <td className="py-3.5 text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'badge-emerald'
                        : log.status === 'DENIED'
                        ? 'badge-pink'
                        : 'badge-amber'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
