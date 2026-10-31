import React from 'react';
import {
  Cpu,
  ShieldCheck,
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
}

export const ModelComparison: React.FC = () => {
  const models: ModelBenchmark[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o (Multimodal)',
      provider: 'OpenAI',
      precision: '98.2%',
      latency: '1.4s',
      cost: '$0.0050 / 1K tok',
      contextWindow: '128K',
      hallucinationRate: '0.4%',
      sampleAnswer:
        'Q3 subscription ARR expanded 14.8% YoY to $42.3M, supported by a 128% net retention rate [Doc 1, p. 4]. Infrastructure analysis shows zero contract churn with GPU latency transients mitigating in Aug.',
      recommendedFor: 'Complex multimodal visual tables & charts',
    },
    {
      id: 'claude-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      precision: '98.8%',
      latency: '1.2s',
      cost: '$0.0030 / 1K tok',
      contextWindow: '200K',
      hallucinationRate: '0.2%',
      sampleAnswer:
        'Financial statements verify Q3 ARR reached $42.3M (+14.8% YoY). Contract retention stood strong at 128%. The transient GPU memory pressure was fully absorbed with no customer SLA breach.',
      recommendedFor: 'Analytical depth & legal citation precision',
    },
    {
      id: 'gemini-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'Google DeepMind',
      precision: '97.9%',
      latency: '1.1s',
      cost: '$0.0035 / 1K tok',
      contextWindow: '2,000K',
      hallucinationRate: '0.5%',
      sampleAnswer:
        'Correlating financial logs with infrastructure metrics confirms $42.3M subscription ARR and 128% NRR. Churn was 0%, and vector database memory footprint decreased 38% after FP8 quantization.',
      recommendedFor: 'Massive multi-document repositories & 1M+ context',
    },
    {
      id: 'llama-3',
      name: 'Llama 3.3 70B (Self-Hosted)',
      provider: 'Meta / vLLM Local',
      precision: '96.5%',
      latency: '0.8s',
      cost: '$0.0006 / 1K tok',
      contextWindow: '128K',
      hallucinationRate: '1.1%',
      sampleAnswer:
        'Q3 subscription revenue reached $42.3M with 14.8% annual expansion. Net retention remained at 128% and no contract churn occurred despite temporary GPU cluster contention in August.',
      recommendedFor: 'Air-gapped on-premise zero-data-leakage deployments',
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
            <p className="text-xs t-muted">Side-by-side RAG benchmarks across frontier commercial & self-hosted open-weights models</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs t-muted font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Same grounding context applied</span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((m) => (
          <div
            key={m.id}
            className="bento-card rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md badge-purple">
                    {m.provider}
                  </span>
                  <h3 className="text-base font-bold t-primary mt-1">{m.name}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 badge-emerald px-2 py-0.5 rounded-full">
                  {m.precision} Accuracy
                </span>
              </div>

              {/* Sample Grounded Answer */}
              <div className="p-3.5 rounded-2xl bg-black/10 border border-white/5 text-xs leading-relaxed t-secondary">
                <span className="text-[10px] uppercase font-mono font-bold t-muted block mb-1">
                  Synthesized RAG Response:
                </span>
                "{m.sampleAnswer}"
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
                <div className="p-2 rounded-xl bento-chip">
                  <span className="text-[10px] t-muted block">Latency</span>
                  <span className="font-bold text-indigo-400">{m.latency}</span>
                </div>
                <div className="p-2 rounded-xl bento-chip">
                  <span className="text-[10px] t-muted block">Cost / 1K</span>
                  <span className="font-bold text-amber-400">{m.cost}</span>
                </div>
                <div className="p-2 rounded-xl bento-chip">
                  <span className="text-[10px] t-muted block">Context</span>
                  <span className="font-bold t-primary">{m.contextWindow}</span>
                </div>
                <div className="p-2 rounded-xl bento-chip">
                  <span className="text-[10px] t-muted block">Hallucination</span>
                  <span className="font-bold text-emerald-400">{m.hallucinationRate}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t text-[11px] t-muted flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span>Best for: <strong className="t-primary">{m.recommendedFor}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
