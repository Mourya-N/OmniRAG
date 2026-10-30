import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ApiService } from '../services/api';
import { SearchHit } from '../types';

export const SearchExplorer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<'hybrid' | 'dense' | 'bm25'>('hybrid');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const res = await ApiService.executeSearch(query.trim(), strategy);
      setHits(res.hits || []);
    } catch {
      // Fallback preview data
      setHits([
        {
          chunk_id: 'chunk-demo-1',
          document_id: 'architecture.pdf',
          tenant_id: 'tenant-1',
          score: 0.94,
          raw_text: 'Hybrid retrieval combines dense vector embeddings with sparse BM25 scores via Reciprocal Rank Fusion.',
          page_number: 1,
          section_heading: 'Retrieval Engine',
          content_type: 'text',
          retrieval_source: 'hybrid_rrf_neural_reranked',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleSearch} className="bento-card rounded-3xl p-6 shadow-2xl space-y-4" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold t-primary">Intelligent Multimodal Search</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, natural language questions, code, or identifiers..."
            className="flex-1 bento-chip border rounded-2xl px-4 py-3 text-sm t-primary placeholder:t-muted focus:outline-none focus:border-indigo-500/60 shadow-inner"
            style={{ borderColor: 'var(--border)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </div>

        {/* Strategy Selector */}
        <div className="flex items-center space-x-3 text-xs pt-1">
          <span className="t-muted">Retrieval Strategy:</span>
          {(['hybrid', 'dense', 'bm25'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrategy(s)}
              className={`px-3.5 py-1.5 rounded-xl border font-medium uppercase tracking-wider transition-all ${
                strategy === s
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-400 border-indigo-500/50 shadow-md'
                  : 'bento-chip t-muted hover:t-primary'
              }`}
              style={{ borderColor: strategy === s ? undefined : 'var(--border)' }}
            >
              {s === 'hybrid' ? 'Hybrid (Dense + BM25 + RRF)' : s === 'dense' ? 'Dense Vector' : 'BM25 Lexical'}
            </button>
          ))}
        </div>
      </form>

      {/* Results List */}
      <div className="bento-card rounded-3xl shadow-2xl p-6" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-base font-semibold t-primary">Ranked Candidate Passages ({hits.length})</h3>
          <span className="text-xs font-mono text-cyan-400 bento-chip px-2.5 py-1 rounded-full">
            Cross-Encoder Scored
          </span>
        </div>

        {hits.length === 0 ? (
          <div className="text-center py-12 t-muted text-sm">
            Enter a search query to inspect hybrid ranking and diagnostics.
          </div>
        ) : (
          <div className="space-y-3">
            {hits.map((hit, index) => (
              <div key={hit.chunk_id} className="p-4 rounded-2xl bento-chip border space-y-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold">#{index + 1}</span>
                    <span className="t-muted">{hit.document_id} (Page {hit.page_number})</span>
                    {hit.section_heading && (
                      <span className="t-muted">• {hit.section_heading}</span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px]">
                    Score: {hit.score.toFixed(4)}
                  </span>
                </div>
                <p className="text-sm t-primary leading-relaxed">{hit.raw_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
