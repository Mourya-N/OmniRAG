import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const knowledgeGaps = [
    {
      query: 'What is the disaster recovery failover SLA for European multi-region replicas?',
      occurrences: 48,
      status: 'No Grounded Evidence Found',
      urgency: 'high',
      suggestedAction: 'Upload or author DR Runbook & Multi-Region Topology doc',
    },
    {
      query: 'What are the employee stock option vesting acceleration rules on acquisition?',
      occurrences: 31,
      status: 'Partial Context (Score 0.42)',
      urgency: 'medium',
      suggestedAction: 'Ingest 2024 Equity Incentive Plan & Board Resolutions',
    },
    {
      query: 'How to rotate PostgreSQL SSL client certificates in Kubernetes without downtime?',
      occurrences: 26,
      status: 'No Grounded Evidence Found',
      urgency: 'medium',
      suggestedAction: 'Ingest DevOps Infrastructure Certificate Rotation Runbook',
    },
  ];

  const topCited = [
    { name: 'Q3 Financial Report 2024.pdf', citations: 1240, reliability: '99.4%' },
    { name: 'Product Architecture Guide.docx', citations: 890, reliability: '98.8%' },
    { name: 'Zero-Trust SOC 2 Type II Whitepaper.pdf', citations: 615, reliability: '99.1%' },
    { name: 'System Design Diagrams & Specs.md', citations: 480, reliability: '97.6%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex items-center gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold t-primary">Knowledge Corpus Insights & Blindspots</h2>
          <p className="text-xs t-muted">Automated detection of unanswerable employee queries, missing documentation, and authority rankings</p>
        </div>
      </div>

      {/* Uncovered Queries / Knowledge Gaps */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold t-primary">Critical Knowledge Gaps (Unanswerable Queries)</h3>
          </div>
          <span className="text-xs badge-amber px-2.5 py-0.5 rounded-full font-mono">
            3 High-Priority Gaps
          </span>
        </div>

        <div className="space-y-3">
          {knowledgeGaps.map((gap, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border transition-all bento-chip space-y-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="font-semibold text-xs t-primary font-mono">
                  "{gap.query}"
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full badge-pink shrink-0">
                  {gap.occurrences} Unanswered Queries
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs t-muted gap-2 pt-1 border-t border-white/5">
                <span>Recommended: <strong className="t-accent">{gap.suggestedAction}</strong></span>
                <button
                  onClick={() => alert(`Opening ingestion upload for: ${gap.suggestedAction}`)}
                  className="px-2.5 py-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors text-[11px] font-semibold"
                >
                  Upload Missing Doc →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Authoritative Documents */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold t-primary">Most Authoritative Knowledge Assets</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topCited.map((doc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bento-chip flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold t-primary truncate max-w-xs">{doc.name}</div>
                <div className="text-[11px] t-muted mt-0.5 font-mono">{doc.citations} citations across RAG sessions</div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 badge-emerald px-2 py-1 rounded-lg">
                {doc.reliability}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
