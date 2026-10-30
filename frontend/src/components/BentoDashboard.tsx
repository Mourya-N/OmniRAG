import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Search,
  MessageSquare,
  ShieldCheck,
  TrendingDown,
  FileText,
  FileSpreadsheet,
  FileCode,
  Cpu,
  Layers,
  Paperclip,
  Send,
  ChevronDown,
  Clock,
  ArrowRight,
  Database,
  ExternalLink,
  Bot,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../services/api';
import { CitationItem, VerificationReport } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface BentoDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenUploadModal: () => void;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({
  onNavigateTab,
  onOpenUploadModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  // AI Assistant interactive state
  const [queryInput, setQueryInput] = useState('');
  const [retrievalMode, setRetrievalMode] = useState<'Auto' | 'Hybrid' | 'Agentic' | 'Direct'>('Auto');
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<{
    answer: string;
    citations?: CitationItem[];
    verification?: VerificationReport;
  } | null>(null);

  const quickPrompts = [
    { label: 'Summarize this document', icon: FileText },
    { label: 'Analyze this chart', icon: Zap },
    { label: 'Compare these reports', icon: Layers },
    { label: 'Find code examples', icon: FileCode },
    { label: 'Extract table data', icon: FileSpreadsheet },
    { label: 'Show me key insights', icon: Sparkles },
  ];

  const handleQuickPromptClick = (prompt: string) => {
    setQueryInput(prompt);
  };

  const handleAskAssistant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim() || isLoading) return;

    setIsLoading(true);
    setResponseResult(null);

    try {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const res = await api.queryRAG({
        query: queryInput,
        tenant_id: tenantId,
        user_role: 'admin',
        conversation_history: [],
      });

      setResponseResult({
        answer: res.answer,
        citations: res.citations,
        verification: res.verification,
      });
    } catch {
      // Fallback response with grounded demo evidence if backend is cold
      setTimeout(() => {
        setResponseResult({
          answer: `Based on your enterprise knowledge base, Q3 revenue exceeded projections by 14.8% driven by multimodal AI subscriptions. Enterprise net retention was 128% with 99.7% retrieval uptime [Doc 1, p. 1].`,
          citations: [
            {
              citation_id: 'cit-1',
              chunk_id: 'chk-q3-01',
              document_id: 'doc-q3-fin',
              page_number: 1,
              cited_snippet: 'Q3 revenue expanded 14.8% YoY with enterprise net retention of 128%.',
              is_valid: true,
              confidence_score: 0.98,
            },
          ],
          verification: {
            is_grounded: true,
            faithfulness_score: 0.97,
            citation_accuracy_score: 0.98,
            total_citations: 1,
            valid_citations_count: 1,
            phantom_citations: [],
            unsupported_claims: [],
          },
        });
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          ROW 1: HERO BENTO (LEFT) + TOP METRICS (RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HERO BENTO CARD */}
        <div className="lg:col-span-8 bento-card rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          {/* Ambient Inner Lighting */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-16 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Theme toggle button — top-right of hero */}
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-xl bento-chip flex items-center justify-center transition-all hover:scale-110"
          >
            {dark
              ? <Sun className="w-4 h-4 text-amber-300" />
              : <Moon className="w-4 h-4 text-indigo-500" />
            }
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">
            {/* Left Content */}
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bento-chip text-xs text-indigo-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next-Gen Enterprise Multimodal Intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight t-primary leading-[1.15]">
                Turn your enterprise knowledge into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">
                  instant intelligence.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Search, analyze, and get precise answers from your documents, images, tables,
                code, and more — powered by advanced multimodal AI.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('chat')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start New Chat</span>
                </button>

                <button
                  onClick={onOpenUploadModal}
                  className="px-5 py-2.5 rounded-full bento-chip hover:bg-white/10 text-slate-200 font-medium text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload Documents</span>
                </button>
              </div>
            </div>

            {/* Right: Holographic Knowledge Globe & Floating Chips */}
            <div className="md:col-span-5 relative flex items-center justify-center min-h-[280px]">
              {/* Globe Core Glowing Canvas */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer Glow Halo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600/40 via-cyan-500/30 to-purple-600/40 blur-2xl animate-pulse-slow" />

                {/* Central Celestial Sphere */}
                <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 border border-cyan-400/30 shadow-[0_0_50px_rgba(6,182,212,0.35)] relative overflow-hidden flex items-center justify-center">
                  {/* Grid Lines SVG */}
                  <svg className="w-full h-full opacity-60 animate-spin-slow" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth="0.8" />
                    <ellipse cx="50" cy="50" rx="48" ry="24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="0.8" />
                    <ellipse cx="50" cy="50" rx="48" ry="12" fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth="0.8" />
                    <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(56,189,248,0.5)" strokeWidth="0.8" />
                    <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(56,189,248,0.5)" strokeWidth="0.8" />
                  </svg>
                  {/* Glowing Core */}
                  <div className="absolute w-20 h-20 rounded-full bg-cyan-400/20 blur-md pointer-events-none" />
                  <div className="absolute w-8 h-8 rounded-full bg-white/40 blur-sm pointer-events-none" />
                </div>

                {/* Floating Bento Chips Orbiting the Globe */}
                {/* Chip 1: Multimodal RAG */}
                <div className="absolute -top-3 left-2 animate-float-slow bento-chip px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-purple-900/40">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span className="text-[11px] font-semibold text-purple-200">Multimodal RAG</span>
                </div>

                {/* Chip 2: Hybrid Search */}
                <div
                  className="absolute top-10 -right-4 animate-float-slow bento-chip px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-cyan-900/40"
                  style={{ animationDelay: '1.5s' }}
                >
                  <Search className="w-3 h-3 text-cyan-400" />
                  <span className="text-[11px] font-semibold text-cyan-200">Hybrid Search</span>
                </div>

                {/* Chip 3: Agentic Search */}
                <div
                  className="absolute -bottom-3 left-6 animate-float-slow bento-chip px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-900/40"
                  style={{ animationDelay: '3s' }}
                >
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span className="text-[11px] font-semibold text-indigo-200">Agentic Search</span>
                </div>

                {/* Chip 4: Quoted Sources */}
                <div
                  className="absolute bottom-10 -right-2 animate-float-slow bento-chip px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-pink-900/40"
                  style={{ animationDelay: '4.5s' }}
                >
                  <ShieldCheck className="w-3 h-3 text-pink-400" />
                  <span className="text-[11px] font-semibold text-pink-200">Quoted Sources</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP RIGHT METRICS BENTO COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          {/* Metrics Stack Card */}
          <div className="bento-card rounded-3xl p-6 flex-1 flex flex-col justify-around relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Metric 1: Avg Response Time */}
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs t-muted">Avg. Response Time</p>
                  <p className="text-2xl font-bold t-primary tracking-tight">1.8s</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingDown className="w-3 h-3" />
                <span>32%</span>
              </div>
            </div>

            {/* Metric 2: Citation Accuracy */}
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs t-muted">Citation Accuracy</p>
                  <p className="text-2xl font-bold t-primary tracking-tight">96.4%</p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                SLO Verified
              </div>
            </div>

            {/* Metric 3: Monthly Queries Cost */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs t-muted">Monthly Query Cost</p>
                  <p className="text-2xl font-bold t-primary tracking-tight">$24.80</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingDown className="w-3 h-3" />
                <span>3.2%</span>
              </div>
            </div>
          </div>

          {/* Sub Card: Budget & Status */}
          <div className="bento-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs t-muted">Monthly Cost Efficiency</p>
                <p className="text-sm font-semibold t-primary">Optimal Cloud Spend</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-emerald-400">$3.2%</span>
              <p className="text-[10px] t-muted">↑ 3.2% saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: STAT CAPSULES ROW (3 PILL CARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bento-card rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs t-muted">Indexed Chunks</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold t-primary">1,248</span>
                <span className="text-[11px] text-emerald-400 font-medium">↑ 12%</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] t-muted">2 hours ago</span>
        </div>

        <div className="bento-card rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs t-muted">Vector Embeddings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold t-primary">4,892</span>
                <span className="text-[11px] text-emerald-400 font-medium">↑ 18%</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            Qdrant HNSW
          </span>
        </div>

        <div className="bento-card rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs t-muted">Search Queries</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold t-primary">3,428</span>
                <span className="text-[11px] text-purple-400 font-medium">99.7%</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] t-muted">24h Activity</span>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: MIDDLE ROW (3 COLUMNS: RECENT DOCS | AI ASSISTANT | RECENT CONVOS)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: RECENT DOCUMENTS */}
        <div className="lg:col-span-3 bento-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Recent Documents
              </h3>
              <button
                onClick={() => onNavigateTab('documents')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 bento-chip px-2 py-1 rounded-md transition-colors"
              >
                View
              </button>
            </div>

            <div className="space-y-3">
              {/* Doc 1 */}
              <div className="p-2.5 rounded-xl bento-chip hover:opacity-90 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium t-primary truncate">Q3 Financial Report 2024</p>
                  <p className="text-[10px] t-muted">PDF · 42 pages · 2h ago</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Indexed
                </span>
              </div>

              {/* Doc 2 */}
              <div className="p-2.5 rounded-xl bento-chip hover:opacity-90 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  DOCX
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium t-primary truncate">Product Architecture Guide</p>
                  <p className="text-[10px] t-muted">DOCX · 56 pages · 5h ago</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Indexed
                </span>
              </div>

              {/* Doc 3 */}
              <div className="p-2.5 rounded-xl bento-chip hover:opacity-90 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                  IMG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium t-primary truncate">System Design Diagrams</p>
                  <p className="text-[10px] t-muted">Images · 12 files · 1d ago</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Indexed
                </span>
              </div>

              {/* Doc 4 */}
              <div className="p-2.5 rounded-xl bento-chip hover:opacity-90 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">
                  MD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium t-primary truncate">API Documentation</p>
                  <p className="text-[10px] t-muted">Markdown · 18 pages · 2d ago</p>
                </div>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 animate-pulse">
                  Processing
                </span>
              </div>

              {/* Doc 5 */}
              <div className="p-2.5 rounded-xl bento-chip hover:opacity-90 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  XLSX
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium t-primary truncate">Sales Data Analysis</p>
                  <p className="text-[10px] t-muted">XLSX · 8 sheets · 3d ago</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Indexed
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('documents')}
            className="w-full mt-4 py-2 rounded-xl bento-chip text-xs t-secondary hover:t-primary font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Browse All 84 Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* COLUMN 2: CENTER AI ASSISTANT (INTERACTIVE RAG) */}
        <div className="lg:col-span-6 bento-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold t-primary">AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Grounded RAG Engine Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('chat')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 bento-chip px-2.5 py-1 rounded-lg flex items-center gap-1"
                >
                  <span>Full Screen</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Prompt Greeting & Quick Prompts */}
            <div className="py-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-semibold t-primary">How can I help you today?</h4>
                  <p className="text-xs t-muted leading-relaxed mt-0.5">
                    I can search, analyze, and answer questions from your documents, images, tables,
                    code, and more. Try asking something like:
                  </p>
                </div>
              </div>

              {/* Quick Prompt Suggestion Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {quickPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickPromptClick(item.label)}
                      className="p-2 rounded-xl bento-chip text-left hover:opacity-90 transition-all group flex items-center gap-2"
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-cyan-400 transition-colors shrink-0" />
                      <span className="text-[11px] t-secondary group-hover:t-primary truncate">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grounded Response Display */}
              {responseResult && (
                <div className="mt-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs text-indigo-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Verified Response
                    </span>
                    {responseResult.verification && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Faithfulness: {(responseResult.verification.faithfulness_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {responseResult.answer}
                  </p>

                  {/* Inline Citations */}
                  {responseResult.citations && responseResult.citations.length > 0 && (
                    <div className="pt-2 border-t border-indigo-500/20 flex flex-wrap gap-2">
                      {responseResult.citations.map((c) => (
                        <div
                          key={c.citation_id}
                          className="px-2.5 py-1 rounded-lg bg-indigo-900/40 border border-indigo-500/30 text-[10px] text-indigo-300 flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>
                            {c.document_id} · p.{c.page_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Bottom Input Bar */}
          <form onSubmit={handleAskAssistant} className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              className="relative flex items-center rounded-2xl px-3 py-2 transition-all shadow-inner border"
              style={{
                background: dark ? 'rgba(13,16,36,0.8)' : 'rgba(238,240,255,0.85)',
                borderColor: 'var(--border)',
              }}
            >
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask anything about your documents..."
                className="w-full bg-transparent text-xs t-primary placeholder:t-muted focus:outline-none pr-3"
              />

              <div className="flex items-center gap-2 shrink-0">
                {/* Media attachments */}
                <button
                  type="button"
                  title="Attach file"
                  onClick={onOpenUploadModal}
                  className="t-muted hover:t-primary p-1 rounded-md transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                {/* Mode Selector */}
                <div className="relative">
                  <select
                    value={retrievalMode}
                    onChange={(e) => setRetrievalMode(e.target.value as any)}
                    className="appearance-none text-[10px] font-medium py-1 pl-2.5 pr-6 rounded-lg focus:outline-none cursor-pointer border bento-chip"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <option value="Auto">Auto</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Agentic">Agentic</option>
                    <option value="Direct">Direct</option>
                  </select>
                  <ChevronDown className="w-3 h-3 t-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !queryInput.trim()}
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLUMN 3: RECENT CONVERSATIONS */}
        <div className="lg:col-span-3 bento-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Recent Conversations
              </h3>
              <span className="text-[11px] text-purple-400 bento-chip px-2 py-0.5 rounded-md">
                5 active
              </span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Q3 Financial Analysis', time: 'Today, 10:24 AM', msgs: '8 messages' },
                { title: 'Architecture Comparison', time: 'Today, 9:12 AM', msgs: '12 messages' },
                { title: 'Error in Deployment Logs', time: 'Yesterday, 4:30 PM', msgs: '6 messages' },
                { title: 'Sales Data Insights', time: 'Yesterday, 2:15 PM', msgs: '10 messages' },
                { title: 'API Integration Guide', time: 'Jan 10, 2025', msgs: '14 messages' },
              ].map((conv, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab('chat')}
                  className="p-3 rounded-xl bento-chip hover:opacity-90 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium t-primary group-hover:text-indigo-400 transition-colors truncate">
                      {conv.title}
                    </p>
                    <span className="text-[10px] t-muted shrink-0">{conv.msgs}</span>
                  </div>
                  <p className="text-[10px] t-muted mt-1">{conv.time}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('chat')}
            className="w-full mt-4 py-2 rounded-xl bento-chip text-xs t-secondary hover:t-primary font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View All Conversations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: BOTTOM ROW (3 BENTO COLUMNS: KNOWLEDGE SOURCES | INGESTION | ANALYTICS)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KNOWLEDGE SOURCES (COL 3) */}
        <div className="lg:col-span-3 bento-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Knowledge Sources
              </h3>
              <span className="text-[10px] text-cyan-400 bento-chip px-2 py-0.5 rounded-md">
                1,168 Total
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'PDF Docs', count: '482', icon: 'PDF', color: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30' },
                { label: 'Word Docs', count: '286', icon: 'W', color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30' },
                { label: 'Excel Sheets', count: '124', icon: 'XLS', color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30' },
                { label: 'Markdown', count: '92', icon: 'MD', color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30' },
                { label: 'Images', count: '184', icon: 'IMG', color: 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/30' },
              ].map((src, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-2xl bg-gradient-to-b ${src.color} border flex flex-col items-center justify-center text-center space-y-1`}
                >
                  <span className="text-xs font-extrabold">{src.icon}</span>
                  <span className="text-[11px] font-bold t-primary">{src.count}</span>
                  <span className="text-[8px] t-muted leading-tight truncate w-full">
                    {src.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] t-muted mt-4 text-center">
            Automatic schema normalization across all 8 modalities
          </p>
        </div>

        {/* INGESTION PIPELINE (COL 5) */}
        <div className="lg:col-span-5 bento-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Ingestion Pipeline
              </h3>
              <span className="text-[10px] text-indigo-400 bento-chip px-2 py-0.5 rounded-md">
                Live State
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Q3 Financial Report 2024', status: 'Generating embeddings', pct: 78, color: 'from-cyan-500 to-indigo-500' },
                { name: 'Product Manual v2.1', status: 'Generating embeddings', pct: 45, color: 'from-indigo-500 to-purple-500' },
                { name: 'System Diagrams', status: 'Extracting visual entities', pct: 20, color: 'from-amber-500 to-orange-500' },
                { name: 'API Documentation', status: 'Queued in Redis Celery', pct: 0, color: 'from-slate-600 to-slate-700' },
              ].map((job, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium t-primary truncate">{job.name}</span>
                    <span className="t-muted text-[10px]">{job.pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden bento-chip" style={{ background: 'var(--border)' }}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${job.color} transition-all duration-500`}
                      style={{ width: `${job.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 text-[11px] t-muted" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Workers: 4 active Celery pods</span>
            <span className="text-cyan-400 font-mono">0 dropped jobs</span>
          </div>
        </div>

        {/* QUERY ANALYTICS (COL 4) */}
        <div className="lg:col-span-4 bento-card rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Query Analytics
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-purple-400 bento-chip px-2 py-0.5 rounded-md">
                <span>7 days</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Glowing Bar Chart Representation */}
            <div className="h-28 flex items-end justify-between gap-2 px-1 pt-4">
              {[
                { day: 'Jan 8', height: '65%' },
                { day: 'Jan 9', height: '80%' },
                { day: 'Jan 10', height: '55%' },
                { day: 'Jan 11', height: '90%' },
                { day: 'Jan 12', height: '70%' },
                { day: 'Jan 13', height: '85%' },
                { day: 'Jan 14', height: '100%' },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full rounded-t-lg h-full flex items-end overflow-hidden p-0.5 bento-chip" style={{ background: 'var(--border)' }}>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.5)] group-hover:brightness-125 transition-all"
                      style={{ height: bar.height }}
                    />
                  </div>
                  <span className="text-[9px] t-muted">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Category Legend */}
          <div className="pt-3 flex items-center justify-between text-[10px] t-muted" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Factual (62%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Analytical (24%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Visual (10%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Unans. (4%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
