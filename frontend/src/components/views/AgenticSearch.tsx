import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  RefreshCw,
  FileText,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AgentStep {
  step: number;
  title: string;
  subquery: string;
  source: string;
  findings: string;
  status: 'complete' | 'running' | 'pending';
  latency: string;
}

export const AgenticSearch: React.FC = () => {
  const [query, setQuery] = useState(
    'Evaluate financial impact of Q3 cloud subscription growth on ARR and identify associated infrastructure churn risks.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const [steps, setSteps] = useState<AgentStep[]>([
    {
      step: 1,
      title: 'Decomposition & Retrieval: Q3 Cloud Subscription Growth',
      subquery: 'What was the Q3 ARR growth and net expansion rate from cloud subscriptions?',
      source: 'Q3_Financial_Report_2024.pdf (Pages 4-6)',
      findings:
        'Cloud subscription ARR increased by 14.8% YoY to $42.3M, driven by multimodal AI additions. Net revenue retention was 128%.',
      status: 'complete',
      latency: '340ms',
    },
    {
      step: 2,
      title: 'Decomposition & Retrieval: Infrastructure Churn & Cost Drivers',
      subquery: 'What infrastructure churn or SLA degradation risks were reported in Q3?',
      source: 'System_Design_Diagrams.pdf & Incident_Postmortem_Aug.docx',
      findings:
        'GPU cluster contention during peak vector embedding caused a 1.2% transient spike in latency; no enterprise contract churn occurred.',
      status: 'complete',
      latency: '410ms',
    },
    {
      step: 3,
      title: 'Cross-Document Synthesis & Verification',
      subquery: 'Correlate subscription ARR expansion against infrastructure provisioning cost metrics.',
      source: 'Multi-modal Cross-Encoder Reranker (Score: 0.94)',
      findings:
        'Net margin improved from 72% to 76.5% as quantized embeddings decreased vector database memory costs by 38%.',
      status: 'complete',
      latency: '290ms',
    },
  ]);

  const presetQueries = [
    'Analyze security compliance differences between SOC 2 Type II and ISO 27001 in our architecture',
    'Evaluate financial impact of Q3 cloud subscription growth on ARR and identify churn risks',
    'Synthesize API deprecation schedule across backend microservices and client SDKs',
    'Extract all database indexing bottlenecks mentioned across engineering post-mortems',
  ];

  const handleRunAgent = () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setHasRun(false);

    // Simulate multi-step bounded agentic search loop
    setTimeout(() => {
      setSteps([
        {
          step: 1,
          title: `Query Decomposition: "${query.slice(0, 40)}..."`,
          subquery: `Target sub-intent 1: ${query.split(' ')[0]} ${query.split(' ')[1] || 'analysis'} core metrics`,
          source: 'Dense Qdrant Vector Search + BM25 Sparse Inverted Index',
          findings: `Identified 18 high-confidence candidate chunks across primary indexed documents with mean cosine similarity 0.91.`,
          status: 'complete',
          latency: '280ms',
        },
        {
          step: 2,
          title: 'Evidence Filtering & Reciprocal Rank Fusion (RRF)',
          subquery: 'Synthesizing evidence across top 5 reranked chunks',
          source: 'BGE-Reranker-Large cross-attention scoring',
          findings: `Filtered out 8 redundant snippets. Retained 10 authoritative passages with citation confidence > 0.88.`,
          status: 'complete',
          latency: '350ms',
        },
        {
          step: 3,
          title: 'Grounded Reasoning & Factual Verification',
          subquery: 'Validating unsupported claims and phantom citations',
          source: 'Zero-hallucination verification matrix (Score: 0.98)',
          findings: `All extracted claims are 100% grounded in verified source passages without extrapolation.`,
          status: 'complete',
          latency: '210ms',
        },
      ]);
      setIsRunning(false);
      setHasRun(true);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div
        className="bento-card rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold t-primary">Agentic Multi-Hop Search</h2>
              <p className="text-xs t-muted">
                Bounded multi-step reasoning, query decomposition, parallel retrieval, and verifiable citation synthesis
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold badge-purple flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Bounded Agentic Graph Active
          </span>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAgent()}
              placeholder="Ask a complex enterprise question requiring multi-step investigation..."
              className="w-full px-5 py-4 pr-32 rounded-2xl glass-input text-sm"
            />
            <button
              onClick={handleRunAgent}
              disabled={isRunning || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Decomposing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Run Agentic Search
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs t-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sample questions:
            </span>
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(preset)}
                className="text-xs px-3 py-1 rounded-lg bento-chip hover:border-indigo-500/40 transition-colors truncate max-w-xs"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Trace & Results */}
      {hasRun && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Multi-step Reasoning Trace (7 cols) */}
          <div
            className="lg:col-span-7 bento-card rounded-3xl p-6 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 icon-indigo" />
                <h3 className="text-sm font-semibold t-primary">Reasoning & Decomposition Trace</h3>
              </div>
              <span className="text-xs t-muted">3 sub-queries executed • 1.04s total</span>
            </div>

            <div className="space-y-3">
              {steps.map((st) => {
                const isExpanded = expandedStep === st.step;
                return (
                  <div
                    key={st.step}
                    className="rounded-2xl border transition-all"
                    style={{
                      borderColor: isExpanded ? 'var(--accent-indigo-border)' : 'var(--border)',
                      background: isExpanded ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      onClick={() => setExpandedStep(isExpanded ? null : st.step)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                          {st.step}
                        </div>
                        <div>
                          <div className="text-sm font-medium t-primary">{st.title}</div>
                          <div className="text-xs t-muted">{st.source}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs badge-emerald px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {st.latency}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 t-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 t-muted" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <div className="text-xs font-semibold t-muted uppercase tracking-wider">Sub-Query Formulation</div>
                          <div className="text-xs font-mono t-accent mt-0.5 p-2 rounded-lg bg-black/20">
                            {st.subquery}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold t-muted uppercase tracking-wider">Discovered Evidence</div>
                          <div className="text-xs t-secondary mt-0.5 leading-relaxed">{st.findings}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Synthesized Agent Answer & Evidence Citations (5 cols) */}
          <div
            className="lg:col-span-5 bento-card rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 icon-emerald" />
                  <h3 className="text-sm font-semibold t-primary">Synthesized Agent Response</h3>
                </div>
                <span className="text-xs badge-emerald px-2 py-0.5 rounded-full">Grounded 98.4%</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-sm leading-relaxed t-primary">
                Q3 cloud subscription ARR expanded <strong className="text-emerald-400">14.8% YoY to $42.3M</strong> with an enterprise net retention rate of 128%. The infrastructure evaluation detected no enterprise contract churn; transient vector latency spikes were resolved through FP8 quantization, improving gross margins to 76.5%.
              </div>

              {/* Citations */}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold t-muted uppercase tracking-wider">Grounded Citations</div>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bento-chip text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 icon-indigo shrink-0" />
                      <span className="truncate t-primary font-medium">Q3_Financial_Report_2024.pdf</span>
                      <span className="t-muted">p. 5</span>
                    </div>
                    <span className="text-[10px] badge-cyan px-1.5 py-0.5 rounded font-mono">Conf: 0.98</span>
                  </div>
                  <div className="p-2.5 rounded-xl bento-chip text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 icon-indigo shrink-0" />
                      <span className="truncate t-primary font-medium">System_Design_Diagrams.pdf</span>
                      <span className="t-muted">p. 12</span>
                    </div>
                    <span className="text-[10px] badge-cyan px-1.5 py-0.5 rounded font-mono">Conf: 0.94</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t text-xs t-muted flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span>Security: Zero-Trust Tenant Isolation</span>
              <span>Model: Claude 3.5 Sonnet + BM25 RRF</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
