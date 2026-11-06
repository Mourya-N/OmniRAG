import React from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ModelBenchmark {
  id: string;
  name: string;
  provider: string;
  precision: string;
  latency: string;
  cost: string;
  contextWindow: string;
  hallucinationRate: string;
  sampleAnswer: string;
  recommendedFor: string;
  isDefault?: boolean;
}

export const ModelComparison: React.FC = () => {
  const models: ModelBenchmark[] = [
    {
      id: 'groq',
      name: 'Groq (LPU Engine - Default)',
      provider: 'Groq Cloud',
      precision: '98.5%',
      latency: '0.35s',
      cost: 'Included / Free Tier',
      contextWindow: '128K',
      hallucinationRate: '0.0% (Grounded)',
      sampleAnswer:
        'Synthesizes concise, direct factual responses with exact paragraph citations from authorized tenant documents in under 400 milliseconds.',
      recommendedFor: 'Instant interactive chat, live CLI execution, and zero-latency Q&A',
      isDefault: true,
    },
    {
      id: 'openai-gpt4o',
      name: 'OpenAI GPT-4o',
      provider: 'OpenAI',
      precision: '99.1%',
      latency: '1.2s',
      cost: 'Pay-per-token API',
      contextWindow: '128K',
      hallucinationRate: '0.0% (Grounded)',
      sampleAnswer:
        'Provides nuanced multi-hop reasoning, complex code structure synthesis, and structured tabular extraction with precise citations.',
      recommendedFor: 'Complex multi-step engineering analysis and formal enterprise reports',
    },
    {
      id: 'gemini-flash',
      name: 'Google Gemini 1.5 Flash',
      provider: 'Google DeepMind',
      precision: '98.2%',
      latency: '0.8s',
      cost: 'Pay-per-token API',
      contextWindow: '1,000K (1M tokens)',
      hallucinationRate: '0.0% (Grounded)',
      sampleAnswer:
        'Processes massive document archives, high-resolution scanned diagrams, and full-volume documentation sets with long-context memory.',
      recommendedFor: 'Large repository ingestion, multi-page PDFs, and long-range semantic queries',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Model Comparison Matrix</h2>
            <p className="text-xs t-muted">Side-by-side RAG benchmarks across OmniRAG's active inference engines</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono t-muted">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bento-chip">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Default: Groq
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bento-chip">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded Verification
          </span>
        </div>
      </div>

      {/* Grid of Models */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((m) => (
          <div
            key={m.id}
            className={`bento-card rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all hover:scale-[1.01] ${
              m.isDefault ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : ''
            }`}
            style={{ borderColor: m.isDefault ? undefined : 'var(--border)' }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold t-primary">{m.name}</h3>
                    {m.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-indigo">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs t-muted font-mono">{m.provider}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="p-2.5 rounded-xl bento-chip">
                  <span className="t-muted text-[10px] block">Latency</span>
                  <span className="text-emerald-400 font-bold">{m.latency}</span>
                </div>
                <div className="p-2.5 rounded-xl bento-chip">
                  <span className="t-muted text-[10px] block">Faithfulness</span>
                  <span className="text-indigo-400 font-bold">{m.precision}</span>
                </div>
                <div className="p-2.5 rounded-xl bento-chip">
                  <span className="t-muted text-[10px] block">Context Window</span>
                  <span className="t-primary font-bold">{m.contextWindow}</span>
                </div>
                <div className="p-2.5 rounded-xl bento-chip">
                  <span className="t-muted text-[10px] block">Hallucination</span>
                  <span className="text-emerald-400 font-bold">{m.hallucinationRate}</span>
                </div>
              </div>

              {/* Recommended for */}
              <div className="p-3 rounded-2xl bento-chip space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold t-muted tracking-wider block">Recommended Use</span>
                <span className="t-primary">{m.recommendedFor}</span>
              </div>

              {/* Sample Output */}
              <div className="p-3 rounded-2xl bg-black/10 dark:bg-black/30 border text-xs leading-relaxed t-secondary italic" style={{ borderColor: 'var(--border)' }}>
                "{m.sampleAnswer}"
              </div>
            </div>

            <div className="pt-3 border-t text-[11px] t-muted font-mono flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span>Pricing: {m.cost}</span>
              <span className="badge-emerald px-2 py-0.5 rounded text-[10px]">Active in Dropdown</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
