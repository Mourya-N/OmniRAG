import React, { useState } from 'react';
import {
  Layers,
  FolderPlus,
  FileText,
  Users,
  ArrowRight,
} from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  description: string;
  docCount: number;
  collaborators: number;
  lastUpdated: string;
  color: string;
}

export const CollectionsView: React.FC = () => {
  const [collections, setCollections] = useState<CollectionItem[]>([
    {
      id: 'c-1',
      name: 'Financial Reports & SEC Filings',
      description: 'Quarterly 10-Q, 10-K filings, investor presentations, and auditor letters.',
      docCount: 42,
      collaborators: 8,
      lastUpdated: '2 hours ago',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'c-2',
      name: 'Engineering System Design & RFCs',
      description: 'Architecture blueprints, microservices APIs, database schemas, and postmortems.',
      docCount: 128,
      collaborators: 24,
      lastUpdated: '5 hours ago',
      color: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'c-3',
      name: 'Legal, Compliance & SOC 2 Audits',
      description: 'Security policies, pen-testing logs, GDPR data maps, and NDA templates.',
      docCount: 56,
      collaborators: 5,
      lastUpdated: '1 day ago',
      color: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'c-4',
      name: 'Product Roadmaps & User Research',
      description: 'Feature specs, customer interview transcripts, churn analyses, and Figma handoffs.',
      docCount: 89,
      collaborators: 18,
      lastUpdated: '3 days ago',
      color: 'from-pink-600 to-rose-600',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: CollectionItem = {
      id: `c-${Date.now()}`,
      name: newTitle.trim(),
      description: newDesc.trim() || 'Custom enterprise knowledge collection.',
      docCount: 0,
      collaborators: 1,
      lastUpdated: 'Just now',
      color: 'from-indigo-600 to-purple-600',
    };
    setCollections([created, ...collections]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Knowledge Collections</h2>
            <p className="text-xs t-muted">Segmented team workspaces, compartmentalized retrieval indices, and role-based ACLs</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
        >
          <FolderPlus className="w-4 h-4" /> Create Collection
        </button>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bento-card rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${col.color} flex items-center justify-center text-white shadow-md`}>
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs t-muted flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {col.collaborators} members
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold t-primary group-hover:text-indigo-400 transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs t-secondary mt-1 leading-relaxed">{col.description}</p>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between text-xs t-muted" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 icon-indigo" />
                <span className="font-mono font-semibold t-primary">{col.docCount} Documents</span>
                <span>• Updated {col.lastUpdated}</span>
              </div>

              <span className="flex items-center gap-1 font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bento-card rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-bold t-primary">Create New Knowledge Collection</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg t-muted hover:t-primary">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold t-muted mb-1">Collection Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Growth & Investor Relations"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold t-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Scope of documents and team access rules..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bento-chip t-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
