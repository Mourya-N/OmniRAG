import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface AuditLogEntry {
  id: string;
  timestamp?: string;
  created_at?: string;
  actor?: string;
  action: string;
  resource?: string;
  resource_type?: string;
  ipAddress?: string;
  ip_address?: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  details?: string;
}

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const loadLogs = async () => {
    try {
      const data = await ApiService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const status = l.status || 'SUCCESS';
    const matchesFilter = selectedFilter === 'ALL' || status === selectedFilter;
    const actorStr = l.actor || 'system';
    const actionStr = l.action || '';
    const resStr = l.resource || l.resource_type || l.details || '';
    const ipStr = l.ipAddress || l.ip_address || '';

    const matchesSearch =
      actorStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actionStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipStr.includes(searchTerm);
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
