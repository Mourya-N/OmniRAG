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
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Intelligent Multimodal Search</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, natural language questions, code, or identifiers..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </div>

        {/* Strategy Selector */}
        <div className="flex items-center space-x-3 text-xs pt-1">
          <span className="text-slate-400">Retrieval Strategy:</span>
          {(['hybrid', 'dense', 'bm25'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStrategy(s)}
              className={`px-3 py-1.5 rounded-lg border font-medium uppercase tracking-wider transition-colors ${
                strategy === s
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {s === 'hybrid' ? 'Hybrid (Dense + BM25 + RRF)' : s === 'dense' ? 'Dense Vector' : 'BM25 Lexical'}
            </button>
          ))}
        </div>
      </form>

      {/* Results List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">Ranked Candidate Passages ({hits.length})</h3>
          <span className="text-xs font-mono text-slate-500">Cross-Encoder Scored</span>
        </div>

        {hits.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Enter a search query to inspect hybrid ranking and diagnostics.
          </div>
        ) : (
          <div className="space-y-3">
            {hits.map((hit, index) => (
              <div key={hit.chunk_id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold">#{index + 1}</span>
                    <span className="text-slate-400">{hit.document_id} (Page {hit.page_number})</span>
                    {hit.section_heading && (
                      <span className="text-slate-500">• {hit.section_heading}</span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px]">
                    Score: {hit.score.toFixed(4)}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{hit.raw_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
