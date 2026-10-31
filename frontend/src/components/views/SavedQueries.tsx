import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Play,
  Trash2,
  Copy,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface SavedQueryItem {
  id: string;
  title: string;
  query: string;
  tag: string;
  executions: number;
  avgLatency: string;
  lastRun: string;
  isPinned: boolean;
}

interface SavedQueriesProps {
  onRunQuery?: (query: string) => void;
}

export const SavedQueries: React.FC<SavedQueriesProps> = ({ onRunQuery }) => {
  const [queries, setQueries] = useState<SavedQueryItem[]>([
    {
      id: 'q-1',
      title: 'Q3 Enterprise Revenue & Net Retention Breakdown',
      query: 'What was the Q3 subscription ARR growth and net expansion rate across enterprise contracts?',
      tag: 'Finance',
      executions: 142,
      avgLatency: '1.2s',
      lastRun: '10 mins ago',
      isPinned: true,
    },
    {
      id: 'q-2',
      title: 'SOC 2 Type II Encryption at Rest & in Transit',
      query: 'List all encryption protocols, KMS envelope keys, and access controls mandated by our SOC 2 Type II audit.',
      tag: 'Security',
      executions: 89,
      avgLatency: '1.4s',
      lastRun: '2 hours ago',
      isPinned: true,
    },
    {
      id: 'q-3',
      title: 'Hybrid RAG Reciprocal Rank Fusion Formula',
      query: 'Explain how dense vector distance and BM25 sparse rankings are fused using reciprocal rank fusion.',
      tag: 'Architecture',
      executions: 64,
      avgLatency: '0.9s',
      lastRun: 'Yesterday',
      isPinned: false,
    },
    {
      id: 'q-4',
      title: 'Database Sharding & Connection Pool Limits',
      query: 'What are the maximum connection pool parameters and read-replica replication lag thresholds?',
      tag: 'Engineering',
      executions: 31,
      avgLatency: '1.1s',
      lastRun: '3 days ago',
      isPinned: false,
    },
  ]);

  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [newTag, setNewTag] = useState('General');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tags = ['All', 'Finance', 'Security', 'Architecture', 'Engineering', 'General'];

  const filteredQueries = queries.filter((q) => {
    const matchesTag = selectedTag === 'All' || q.tag === selectedTag;
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.query.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleAddQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuery.trim()) return;

    const created: SavedQueryItem = {
      id: `q-${Date.now()}`,
      title: newTitle.trim(),
      query: newQuery.trim(),
      tag: newTag,
      executions: 1,
      avgLatency: '1.2s',
      lastRun: 'Just now',
      isPinned: false,
    };
    setQueries([created, ...queries]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewQuery('');
    setNewTag('General');
  };

  const handleDelete = (id: string) => {
    setQueries(queries.filter((q) => q.id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExecute = (qText: string) => {
    if (onRunQuery) {
      onRunQuery(qText);
    } else {
      alert(`Executing query in RAG engine:\n"${qText}"`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Saved & Pinned Queries</h2>
            <p className="text-xs t-muted">Reusable enterprise prompts, automated investigation queries, and team benchmarks</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Save New Query
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                selectedTag === t
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bento-chip t-muted hover:t-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 t-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved queries..."
            className="pl-8 pr-3 py-2 text-xs rounded-xl glass-input w-full sm:w-64"
          />
        </div>
      </div>

      {/* Query Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQueries.map((item) => (
          <div
            key={item.id}
            className="bento-card rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md badge-amber">
                  #{item.tag}
                </span>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(item.id, item.query)}
                    className="p-1.5 rounded-lg hover:bg-white/10 t-muted hover:t-primary"
                    title="Copy query text"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 t-muted hover:text-rose-400"
                    title="Delete saved query"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold t-primary group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs t-secondary line-clamp-2 leading-relaxed bg-black/10 p-2.5 rounded-xl border border-white/5 font-mono">
                "{item.query}"
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs t-muted" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <Play className="w-3 h-3 text-indigo-400" /> {item.executions} runs
                </span>
                <span>• Avg {item.avgLatency}</span>
              </div>

              <button
                onClick={() => handleExecute(item.query)}
                className="px-3 py-1 rounded-lg text-xs font-semibold badge-indigo hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
              >
                Run <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Save New Query */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="bento-card rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 icon-amber" />
                <h3 className="text-base font-bold t-primary">Save New Enterprise Query</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg t-muted hover:t-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold t-muted mb-1">Query Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 ARR Growth Comparison"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold t-muted mb-1">Full Query Formulation</label>
                <textarea
                  required
                  rows={3}
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  placeholder="Enter the complete prompt/query to execute..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold t-muted mb-1">Category Tag</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                >
                  <option value="Finance">Finance</option>
                  <option value="Security">Security</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Engineering">Engineering</option>
                  <option value="General">General</option>
                </select>
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
                  className="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md"
                >
                  Save Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
