import React, { useState } from 'react';
import {
  Share2,
  FileText,
  Search,
} from 'lucide-react';

interface SharedDoc {
  id: string;
  filename: string;
  sharedBy: string;
  role: string;
  department: string;
  dateShared: string;
  size: string;
  access: 'Viewer' | 'Editor' | 'Admin';
}

export const SharedWithMe: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docs] = useState<SharedDoc[]>([
    {
      id: 'sd-1',
      filename: 'Q3 Financial Master Audit & Tax Accruals.xlsx',
      sharedBy: 'Sarah Jenkins (VP Finance)',
      role: 'Finance Admin',
      department: 'Finance',
      dateShared: 'Today at 09:30 AM',
      size: '4.8 MB',
      access: 'Editor',
    },
    {
      id: 'sd-2',
      filename: 'Zero-Trust SOC 2 Type II Final Auditor Signoff.pdf',
      sharedBy: 'Marcus Brody (Head of Security)',
      role: 'Security Officer',
      department: 'Security & Compliance',
      dateShared: 'Yesterday',
      size: '12.4 MB',
      access: 'Viewer',
    },
    {
      id: 'sd-3',
      filename: 'Distributed Vector Index Partitioning Spec.md',
      sharedBy: 'Elena Rostova (Principal Architect)',
      role: 'Staff Architect',
      department: 'Infrastructure',
      dateShared: '3 days ago',
      size: '840 KB',
      access: 'Admin',
    },
    {
      id: 'sd-4',
      filename: '2025 Enterprise Product Strategy Deck.pptx',
      sharedBy: 'David Kim (Chief Product Officer)',
      role: 'Executive',
      department: 'Product',
      dateShared: 'Oct 24, 2026',
      size: '28.1 MB',
      access: 'Viewer',
    },
  ]);

  const filtered = docs.filter(
    (d) =>
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.sharedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Shared with Me</h2>
            <p className="text-xs t-muted">Cross-departmental documents, shared knowledge collections, and team access credentials</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 t-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search shared documents..."
            className="pl-8 pr-3 py-2 text-xs rounded-xl glass-input w-full sm:w-64"
          />
        </div>
      </div>

      {/* Shared documents table */}
      <div className="bento-card rounded-3xl p-6 shadow-xl overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b t-muted uppercase font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-3 font-semibold">Document Asset</th>
              <th className="pb-3 font-semibold">Shared By</th>
              <th className="pb-3 font-semibold">Department</th>
              <th className="pb-3 font-semibold">Access Level</th>
              <th className="pb-3 font-semibold">Date Shared</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((doc) => (
              <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 font-medium t-primary flex items-center gap-2.5">
                  <FileText className="w-4 h-4 icon-indigo shrink-0" />
                  <div>
                    <div className="truncate max-w-xs">{doc.filename}</div>
                    <div className="text-[10px] t-muted font-mono">{doc.size}</div>
                  </div>
                </td>
                <td className="py-3.5 t-secondary">{doc.sharedBy}</td>
                <td className="py-3.5 t-muted font-mono">{doc.department}</td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      doc.access === 'Admin'
                        ? 'badge-purple'
                        : doc.access === 'Editor'
                        ? 'badge-emerald'
                        : 'badge-cyan'
                    }`}
                  >
                    {doc.access}
                  </span>
                </td>
                <td className="py-3.5 t-muted font-mono">{doc.dateShared}</td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => alert(`Opening ${doc.filename} in RAG query explorer`)}
                    className="px-2.5 py-1 rounded-lg bento-chip text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors font-medium text-[11px]"
                  >
                    Open in RAG
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
