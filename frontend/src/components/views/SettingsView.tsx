import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-small');
  const [hybridAlpha, setHybridAlpha] = useState(0.65);
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [rerankerThreshold, setRerankerThreshold] = useState(0.60);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">System & Engine Settings</h2>
            <p className="text-xs t-muted">Configure vector similarity metrics, hybrid alpha weights, chunking boundaries, and API integrations</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save System Settings
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl badge-emerald text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Engine parameters successfully applied to Qdrant Vector DB & RAG runtime.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* RAG Engine Tuning */}
        <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Sliders className="w-4 h-4 icon-indigo" />
            <h3 className="text-sm font-bold t-primary">Hybrid Retrieval Tuning</h3>
          </div>

          <div>
            <label className="block font-semibold t-muted mb-1">Active Dense Embedding Model</label>
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            >
              <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536-dim)</option>
              <option value="bge-m3">BAAI / BGE-M3 Multilingual (1024-dim)</option>
              <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 Local CPU (384-dim)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between font-semibold t-muted mb-1">
              <span>Hybrid Fusion Alpha (Dense vs Sparse)</span>
              <span className="font-mono t-accent">{hybridAlpha}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={hybridAlpha}
              onChange={(e) => setHybridAlpha(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] t-muted font-mono mt-1">
              <span>0.0 (BM25 Lexical Only)</span>
              <span>1.0 (Dense Vector Only)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold t-muted mb-1">Chunk Size (Tokens)</label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value) || 512)}
                className="w-full px-3 py-2 rounded-xl glass-input font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold t-muted mb-1">Overlap (Tokens)</label>
              <input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 64)}
                className="w-full px-3 py-2 rounded-xl glass-input font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Security & Appearance */}
        <div className="bento-card rounded-3xl p-6 shadow-xl space-y-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <ShieldCheck className="w-4 h-4 icon-emerald" />
            <h3 className="text-sm font-bold t-primary">Security & Appearance</h3>
          </div>

          <div>
            <label className="block font-semibold t-muted mb-1">Theme Mode</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl bento-chip text-xs font-semibold flex items-center gap-2"
              >
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>Active: {dark ? 'Dark Mode' : 'High Contrast Light Mode'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold t-muted mb-1">Cross-Encoder Reranker Cutoff Threshold</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.95"
              value={rerankerThreshold}
              onChange={(e) => setRerankerThreshold(parseFloat(e.target.value) || 0.6)}
              className="w-full px-3 py-2 rounded-xl glass-input font-mono text-xs"
            />
            <span className="text-[10px] t-muted mt-1 block">Chunks scoring below this threshold are discarded prior to context injection.</span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold t-muted uppercase tracking-wider block mb-2">Connected API Providers</span>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bento-chip flex items-center justify-between">
                <span>Google Gemini API</span>
                <span className="badge-emerald px-1.5 py-0.5 rounded text-[10px]">Connected</span>
              </div>
              <div className="p-2.5 rounded-xl bento-chip flex items-center justify-between">
                <span>Qdrant HNSW Cluster</span>
                <span className="badge-emerald px-1.5 py-0.5 rounded text-[10px]">Connected (Local)</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
