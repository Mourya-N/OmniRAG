import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const QueryAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const daysData = [
    { date: 'Jan 8', factual: 140, analytical: 60, multimodal: 25, unanswerable: 8 },
    { date: 'Jan 9', factual: 165, analytical: 75, multimodal: 30, unanswerable: 10 },
    { date: 'Jan 10', factual: 180, analytical: 85, multimodal: 38, unanswerable: 12 },
    { date: 'Jan 11', factual: 195, analytical: 90, multimodal: 42, unanswerable: 9 },
    { date: 'Jan 12', factual: 175, analytical: 80, multimodal: 35, unanswerable: 11 },
    { date: 'Jan 13', factual: 210, analytical: 98, multimodal: 48, unanswerable: 14 },
    { date: 'Jan 14', factual: 230, analytical: 105, multimodal: 52, unanswerable: 12 },
  ];

  const topQueries = [
    { text: 'Q3 Financial ARR growth & net expansion', hits: 342, latency: '1.2s', accuracy: '99.1%' },
    { text: 'SOC 2 Type II KMS envelope encryption rules', hits: 289, latency: '1.4s', accuracy: '98.4%' },
    { text: 'Kubernetes cluster autoscaling and worker quotas', hits: 215, latency: '1.1s', accuracy: '97.2%' },
    { text: 'Reciprocal rank fusion BM25 alpha tuning parameters', hits: 184, latency: '0.9s', accuracy: '96.8%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Range Controls */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Query Analytics & Telemetry</h2>
            <p className="text-xs t-muted">Real-time latency distributions, retrieval accuracy, and cost tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            {(['24h', '7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`text-xs px-3 py-1 rounded-lg uppercase font-mono transition-colors ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 't-muted hover:t-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Exporting telemetry metrics as CSV report...')}
            className="p-2 rounded-xl bento-chip hover:t-primary t-muted"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics matching the screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card rounded-2xl p-5 shadow-lg space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs t-muted font-medium">Total Queries</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24%
            </span>
          </div>
          <div className="text-3xl font-extrabold t-primary font-mono">4,892</div>
          <div className="text-[11px] t-muted">Across all multimodal models</div>
        </div>

        <div className="bento-card rounded-2xl p-5 shadow-lg space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs t-muted font-medium">Avg Response Time</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> -32%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 font-mono">1.8s</div>
          <div className="text-[11px] t-muted">P50: 1.2s • P99: 2.6s</div>
        </div>

        <div className="bento-card rounded-2xl p-5 shadow-lg space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs t-muted font-medium">Citation Accuracy</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 99.7% Uptime
            </span>
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono">96.4%</div>
          <div className="text-[11px] t-muted">Zero phantom citations detected</div>
        </div>

        <div className="bento-card rounded-2xl p-5 shadow-lg space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs t-muted font-medium">Total Cost</span>
            <span className="text-xs font-semibold badge-amber px-1.5 py-0.5 rounded text-[10px]">
              Tokens: 1.2M
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">$24.80</div>
          <div className="text-[11px] t-muted">Avg $0.0051 per query execution</div>
        </div>
      </div>

      {/* Stacked Query Volume Chart */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold t-primary">Query Volume by Intent Category</h3>
            <p className="text-xs t-muted">Daily breakdown across semantic categories and multimodal inputs</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Factual (62%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Analytical (24%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Multimodal (10%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Unanswerable (4%)
            </span>
          </div>
        </div>

        {/* Visual Stacked Bar Chart */}
        <div className="pt-4 h-64 flex items-end justify-between gap-3 sm:gap-6 border-b pb-2 select-none" style={{ borderColor: 'var(--border)' }}>
          {daysData.map((d, i) => {
            const factH = (d.factual / 400) * 100;
            const analH = (d.analytical / 400) * 100;
            const multiH = (d.multimodal / 400) * 100;
            const unansH = (d.unanswerable / 400) * 100;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[42px] flex flex-col justify-end h-full rounded-t-xl overflow-hidden transition-all duration-300 group-hover:scale-105">
                  <div
                    style={{ height: `${unansH}%` }}
                    className="w-full bg-rose-400"
                    title={`Unanswerable: ${d.unanswerable}`}
                  />
                  <div
                    style={{ height: `${multiH}%` }}
                    className="w-full bg-cyan-400"
                    title={`Multimodal: ${d.multimodal}`}
                  />
                  <div
                    style={{ height: `${analH}%` }}
                    className="w-full bg-purple-500"
                    title={`Analytical: ${d.analytical}`}
                  />
                  <div
                    style={{ height: `${factH}%` }}
                    className="w-full bg-blue-500"
                    title={`Factual: ${d.factual}`}
                  />
                </div>
                <span className="text-[11px] font-mono t-muted whitespace-nowrap">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Queries Table */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold t-primary">Top Executed Queries & Grounding Performance</h3>
        <div className="divide-y text-xs" style={{ borderColor: 'var(--border)' }}>
          {topQueries.map((q, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <span className="w-5 text-center font-mono t-muted">{idx + 1}</span>
                <span className="t-primary font-medium truncate">{q.text}</span>
              </div>
              <div className="flex items-center gap-6 shrink-0 font-mono">
                <span className="t-muted">{q.hits} hits</span>
                <span className="badge-indigo px-2 py-0.5 rounded">{q.latency}</span>
                <span className="text-emerald-400 font-semibold">{q.accuracy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
