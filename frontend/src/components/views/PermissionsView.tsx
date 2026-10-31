import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Save,
} from 'lucide-react';

export const PermissionsView: React.FC = () => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Matrix state
  const [matrix, setMatrix] = useState([
    { capability: 'Query Multimodal RAG AI Chat', admin: true, analyst: true, member: true, guest: false },
    { capability: 'Agentic Multi-Hop Search & Decomposition', admin: true, analyst: true, member: true, guest: false },
    { capability: 'Upload & Ingest New Documents (PDF, Office, Code)', admin: true, analyst: true, member: false, guest: false },
    { capability: 'Manage Collections & Re-partitioning', admin: true, analyst: true, member: false, guest: false },
    { capability: 'Trigger Benchmarks & Load Stress Profiling', admin: true, analyst: true, member: false, guest: false },
    { capability: 'Export Query Telemetry & Financial Cost Reports', admin: true, analyst: true, member: false, guest: false },
    { capability: 'Delete / Purge Documents from Vector Store', admin: true, analyst: false, member: false, guest: false },
    { capability: 'Manage Organization Users, Teams & Invites', admin: true, analyst: false, member: false, guest: false },
    { capability: 'Inspect SOC 2 Audit Logs & Auth Access Records', admin: true, analyst: false, member: false, guest: false },
    { capability: 'Update System Reranker & Vector Alpha Parameters', admin: true, analyst: false, member: false, guest: false },
  ]);

  const togglePermission = (index: number, role: 'admin' | 'analyst' | 'member' | 'guest') => {
    if (role === 'admin') return; // Admin always holds root privilege
    const copy = [...matrix];
    copy[index][role] = !copy[index][role];
    setMatrix(copy);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Role-Based Access Control (RBAC) Matrix</h2>
            <p className="text-xs t-muted">Zero-Trust tenant authorization, document-level security gates, and capability mapping</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save RBAC Policy
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl badge-emerald text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>RBAC Security Policy successfully synced to JWT authentication claims.</span>
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="bento-card rounded-3xl p-6 shadow-xl overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b t-muted uppercase font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-3 font-semibold">Capability / Action Scope</th>
              <th className="pb-3 font-semibold text-center w-28">Admin</th>
              <th className="pb-3 font-semibold text-center w-28">Analyst</th>
              <th className="pb-3 font-semibold text-center w-28">Member</th>
              <th className="pb-3 font-semibold text-center w-28">Guest</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {matrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 font-medium t-primary">{row.capability}</td>
                <td className="py-3.5 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </span>
                </td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={() => togglePermission(idx, 'analyst')}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                      row.analyst ? 'bg-indigo-500/20 text-indigo-400' : 'bg-black/20 t-muted hover:text-white'
                    }`}
                  >
                    {row.analyst ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={() => togglePermission(idx, 'member')}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                      row.member ? 'bg-indigo-500/20 text-indigo-400' : 'bg-black/20 t-muted hover:text-white'
                    }`}
                  >
                    {row.member ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={() => togglePermission(idx, 'guest')}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                      row.guest ? 'bg-indigo-500/20 text-indigo-400' : 'bg-black/20 t-muted hover:text-white'
                    }`}
                  >
                    {row.guest ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
