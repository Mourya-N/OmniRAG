import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Play,
  RefreshCw,
} from 'lucide-react';

interface BenchmarkSuite {
  id: string;
  name: string;
  category: string;
  p50: string;
  p95: string;
  p99: string;
  qps: number;
  status: 'optimal' | 'warning';
}

export const BenchmarksView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [suites, setSuites] = useState<BenchmarkSuite[]>([
    {
      id: 'b-1',
      name: 'Qdrant Dense HNSW Vector Retrieval (1536-dim)',
      category: 'Vector DB',
      p50: '6.4ms',
      p95: '12.8ms',
      p99: '18.2ms',
      qps: 4250,
      status: 'optimal',
    },
    {
      id: 'b-2',
      name: 'BGE-Reranker-Large Cross-Attention Scoring',
      category: 'Reranker',
      p50: '118ms',
      p95: '164ms',
      p99: '210ms',
      qps: 850,
      status: 'optimal',
    },
    {
      id: 'b-3',
      name: 'BM25 Sparse Okapi Index Inversion & Scoring',
      category: 'Sparse Search',
      p50: '1.8ms',
      p95: '4.2ms',
      p99: '7.1ms',
      qps: 8900,
      status: 'optimal',
    },
    {
      id: 'b-4',
      name: 'Multimodal Vision OCR & PDF Layout Chunking',
      category: 'Ingestion Pipeline',
      p50: '820ms',
      p95: '1420ms',
      p99: '1980ms',
      qps: 180,
      status: 'warning',
    },
  ]);

  const handleRunStressTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setSuites([
        {
          id: 'b-1',
          name: 'Qdrant Dense HNSW Vector Retrieval (1536-dim)',
          category: 'Vector DB',
          p50: '5.9ms',
          p95: '11.4ms',
          p99: '16.8ms',
          qps: 4620,
          status: 'optimal',
        },
        {
          id: 'b-2',
          name: 'BGE-Reranker-Large Cross-Attention Scoring',
          category: 'Reranker',
          p50: '109ms',
          p95: '152ms',
          p99: '195ms',
          qps: 920,
          status: 'optimal',
        },
        {
          id: 'b-3',
          name: 'BM25 Sparse Okapi Index Inversion & Scoring',
          category: 'Sparse Search',
          p50: '1.6ms',
          p95: '3.9ms',
          p99: '6.5ms',
          qps: 9400,
          status: 'optimal',
        },
        {
          id: 'b-4',
          name: 'Multimodal Vision OCR & PDF Layout Chunking',
          category: 'Ingestion Pipeline',
          p50: '780ms',
          p95: '1350ms',
          p99: '1840ms',
          qps: 195,
          status: 'optimal',
        },
      ]);
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">System Benchmarks & Stress Testing</h2>
            <p className="text-xs t-muted">Sub-millisecond retrieval benchmarks, throughput ceilings, and load profiles</p>
          </div>
        </div>

        <button
          onClick={handleRunStressTest}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Running Load Profile...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Run Live Benchmark
            </>
          )}
        </button>
      </div>

      {/* Benchmark Suites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suites.map((s) => (
          <div
            key={s.id}
            className="bento-card rounded-3xl p-6 shadow-xl space-y-4 hover:border-indigo-500/40 transition-all"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md badge-indigo">
                  {s.category}
                </span>
                <h3 className="text-sm font-bold t-primary mt-2">{s.name}</h3>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  s.status === 'optimal' ? 'badge-emerald' : 'badge-amber'
                }`}
              >
                {s.status === 'optimal' ? 'Optimal' : 'Investigate'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bento-chip">
                <span className="t-muted text-[10px] block">P50</span>
                <span className="font-bold t-primary">{s.p50}</span>
              </div>
              <div className="p-2.5 rounded-xl bento-chip">
                <span className="t-muted text-[10px] block">P95</span>
                <span className="font-bold text-indigo-400">{s.p95}</span>
              </div>
              <div className="p-2.5 rounded-xl bento-chip">
                <span className="t-muted text-[10px] block">P99</span>
                <span className="font-bold text-purple-400">{s.p99}</span>
              </div>
              <div className="p-2.5 rounded-xl bento-chip">
                <span className="t-muted text-[10px] block">Throughput</span>
                <span className="font-bold text-emerald-400">{s.qps} QPS</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
