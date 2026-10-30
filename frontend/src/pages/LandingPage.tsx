import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  BarChart3,
  ExternalLink,
  Sun,
  Moon,
  LogIn,
  UserCheck,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OmniRAGLogo } from '../components/OmniRAGLogo';
import { UserProfile } from '../types';

interface LandingPageProps {
  onNavigate: (page: 'login' | 'signup' | 'dashboard') => void;
  currentUser?: UserProfile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, currentUser }) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-indigo-500 selection:text-white"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ─────────────────────────────────────────────────────────
         AMBIENT NEBULA BACKGROUND GLOWS
         ───────────────────────────────────────────────────────── */}
      <div className="nebula-blob-1 fixed -bottom-40 -left-40 w-[750px] h-[750px] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="nebula-blob-2 fixed -top-32 left-1/3 w-[850px] h-[850px] rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="nebula-blob-3 fixed top-1/3 -right-24 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="nebula-blob-4 fixed -bottom-20 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ─────────────────────────────────────────────────────────
         STICKY HEADER & NAVIGATION
         ───────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-xl border-b transition-colors"
        style={{
          background: dark ? 'rgba(9,12,26,0.80)' : 'rgba(255,255,255,0.85)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
          {/* Logo & Brand */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer group flex items-center gap-3"
          >
            <OmniRAGLogo
              size="md"
              showText={true}
              subtitle="Enterprise Knowledge Intelligence"
              badge="Enterprise"
              interactive={true}
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold t-secondary">
            <a href="#features" className="hover:t-primary transition-colors">Features</a>
            <a href="#architecture" className="hover:t-primary transition-colors">Architecture</a>
            <a href="#hybrid" className="hover:t-primary transition-colors">Hybrid Retrieval</a>
            <a href="#security" className="hover:t-primary transition-colors">Zero-Trust Security</a>
            <a href="#benchmarks" className="hover:t-primary transition-colors">Benchmarks</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="w-10 h-10 rounded-xl bento-chip flex items-center justify-center t-secondary hover:t-primary transition-all border"
              style={{ borderColor: 'var(--border)' }}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {currentUser ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Go to Workspace ({currentUser.full_name?.split(' ')[0] || 'Dashboard'})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bento-chip text-xs font-semibold t-primary hover:opacity-90 transition-all border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <LogIn className="w-3.5 h-3.5 icon-indigo" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onNavigate('signup')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
         HERO SECTION: INNOVATIVE BENTO SHOWCASE
         ───────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center text-center">
          {/* Top Floating Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bento-chip border mb-8 animate-fade-in shadow-lg"
               style={{ borderColor: 'var(--border)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold t-primary">OmniRAG 2.0 Engine Live</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/30">
              Qdrant + BM25 + RRF
            </span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
            Turn enterprise knowledge into{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              instant, verifiable intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg t-secondary max-w-2xl leading-relaxed mb-10">
            Unify multi-format PDFs, scanned contracts, images, codebases, and tabular sheets into high-precision vectors.
            Ground every AI response with cross-encoder reranked citations and zero hallucinations.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onNavigate(currentUser ? 'dashboard' : 'signup')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/35 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <span>{currentUser ? 'Launch My Workspace' : 'Start Enterprise Free Trial'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="px-7 py-3.5 rounded-2xl bento-chip font-bold text-sm t-primary hover:opacity-90 transition-all border flex items-center gap-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <span>Sign In with Corporate Email</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────
             HERO INTERACTIVE BENTO CARD: MULTIMODAL INTELLIGENCE
             ───────────────────────────────────────────────────── */}
          <div className="w-full max-w-5xl rounded-3xl bento-card p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left border"
               style={{ borderColor: 'var(--border)' }}>
            
            {/* Top Bar of Bento Terminal */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono t-muted pl-2">omnirag-orchestrator://query-execution</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] badge-emerald px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Grounded 99.4%
                </span>
                <span className="text-[11px] badge-indigo px-2.5 py-0.5 rounded-full font-mono">
                  Latency 1.2s
                </span>
              </div>
            </div>

            {/* Simulated Live Multimodal Query & Citation Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Query & Claim Verification */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.03] border" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[11px] uppercase font-mono tracking-wider t-muted mb-1 flex items-center gap-1.5">
                    <Search className="w-3 h-3 icon-indigo" /> User Query
                  </p>
                  <p className="text-sm font-semibold t-primary">
                    "Extract the Q3 Cloud ARR growth rate and contrast it with the on-prem margins from the financial PDF and table."
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase font-mono">Synthesized Evidence Answer</span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 3 Inline Sources Verified
                    </span>
                  </div>
                  <p className="text-xs t-primary leading-relaxed">
                    According to the Q3 Financial Overview, Cloud ARR expanded by <strong className="text-indigo-400 font-semibold">38.4% YoY</strong> reaching \$128.4M{' '}
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                      [Doc: Q3-Report.pdf p.14]
                    </span>
                    . Concurrently, legacy on-prem license gross margins retracted by <strong className="text-purple-400 font-semibold">4.2%</strong>{' '}
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
                      [Sheet: Margins-Breakdown.xlsx]
                    </span>
                    .
                  </p>
                </div>

                {/* Evidence Citation Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono t-muted">Verified Chunks:</span>
                  <span className="text-[10px] font-mono badge-cyan px-2 py-0.5 rounded-md">chunk-981 (Qdrant Dense 0.94)</span>
                  <span className="text-[10px] font-mono badge-purple px-2 py-0.5 rounded-md">chunk-412 (BM25 Sparse 18.2)</span>
                  <span className="text-[10px] font-mono badge-emerald px-2 py-0.5 rounded-md">RRF Score 0.0328</span>
                </div>
              </div>

              {/* Right Column: Holographic Multimodal Vector Core Visual */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-indigo-950/40 via-purple-950/30 to-black/20 border overflow-hidden relative group"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="w-full h-56 rounded-xl overflow-hidden relative shadow-inner">
                  <img
                    src="/images/multimodal-rag-hero.jpg"
                    alt="OmniRAG Holographic Multimodal Vector Matrix"
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090c1a] via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Telemetry Badges */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-[9px] font-mono">
                    Multimodal Matrix Active
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[9px] font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 99.4% Evidence Grounded
                  </div>
                </div>

                <div className="w-full px-2 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold t-primary tracking-tight">Multimodal Knowledge Nexus</p>
                    <p className="text-[10px] t-muted">Docling + PyMuPDF + Qdrant Dense Vectors</p>
                  </div>
                  <OmniRAGLogo size="sm" showText={false} interactive={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Live Benchmark Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mt-8">
            <div className="bento-card rounded-2xl p-4 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">99.4%</p>
              <p className="text-xs t-secondary mt-1 font-medium">Claim Verification Accuracy</p>
            </div>
            <div className="bento-card rounded-2xl p-4 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">&lt; 1.2s</p>
              <p className="text-xs t-secondary mt-1 font-medium">Median Hybrid RAG Latency</p>
            </div>
            <div className="bento-card rounded-2xl p-4 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">10M+</p>
              <p className="text-xs t-secondary mt-1 font-medium">Vectors per Tenant Capacity</p>
            </div>
            <div className="bento-card rounded-2xl p-4 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">0%</p>
              <p className="text-xs t-secondary mt-1 font-medium">Fabricated Answers (Abstention)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
         FEATURES SECTION: DETAILED ELABORATED BENTO GRID
         ───────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1440px] mx-auto">
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase font-mono tracking-widest text-indigo-400 mb-2 block">
              Architectural Advantages
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Engineered for Enterprise-Scale Precision
            </h2>
            <p className="text-sm sm:text-base t-secondary leading-relaxed">
              Standard vector databases suffer from high false positives and out-of-context retrieval.
              OmniRAG pairs dense vector embeddings with sparse keyword inverted indices, reciprocal rank fusion, and bounded agentic planning.
            </p>
          </div>

          {/* Bento Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card 1: Multimodal Ingestion Engine */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-5 icon-indigo shadow-lg shadow-indigo-500/15">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Multimodal Document Ingestion</h3>
                <p className="text-xs t-secondary leading-relaxed mb-6">
                  Extract and parse structured text, multi-column research layouts, charts, and scanned images using PyMuPDF and Docling.
                  Preserves semantic tables and hierarchical headings.
                </p>
              </div>
              {/* Feature Visual */}
              <div className="p-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px] space-y-1.5"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-indigo-400">
                  <span>PDF, DOCX, XLSX, OCR</span>
                  <span className="text-[10px] badge-indigo px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="t-muted text-[10px]">Hierarchical & Semantic Chunking (512 tokens + 64 overlap)</p>
              </div>
            </div>

            {/* Card 2: Hybrid Retrieval (Dense + Sparse BM25 + RRF) */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-cyan-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 icon-cyan shadow-lg shadow-cyan-500/15">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Hybrid Retrieval Matrix</h3>
                <p className="text-xs t-secondary leading-relaxed mb-4">
                  Combines high-dimensional dense embeddings in Qdrant with BM25 inverted sparse indices.
                  Reciprocal Rank Fusion eliminates score calibration discrepancies across modalities.
                </p>
              </div>

              {/* Generated Image Showcase */}
              <div className="rounded-2xl overflow-hidden border mb-3 relative group/img h-36"
                   style={{ borderColor: 'var(--border)' }}>
                <img
                  src="/images/hybrid-retrieval.jpg"
                  alt="Hybrid Retrieval Architecture"
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold">Qdrant HNSW + BM25 Lexical + RRF</span>
                </div>
              </div>

              {/* Feature Stats */}
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px]"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-cyan-400">
                  <span>Dense HNSW + BM25</span>
                  <span className="text-[10px] badge-cyan px-1.5 py-0.5 rounded">RRF Merged</span>
                </div>
              </div>
            </div>

            {/* Card 3: Bounded Agentic Multi-Hop Reasoning */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-purple-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5 icon-purple shadow-lg shadow-purple-500/15">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Bounded Agentic Graph</h3>
                <p className="text-xs t-secondary leading-relaxed mb-4">
                  Dynamic query formulation and multi-hop reasoning for complex comparative research questions.
                  Strictly bounded step execution prevents infinite loops and uncontrolled LLM latency.
                </p>
              </div>

              {/* Generated Image Showcase */}
              <div className="rounded-2xl overflow-hidden border mb-3 relative group/img h-36"
                   style={{ borderColor: 'var(--border)' }}>
                <img
                  src="/images/agentic-reasoning.jpg"
                  alt="Bounded Agentic Graph Reasoning"
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-mono text-purple-300 font-semibold">Autonomous Sub-Query Formulation</span>
                </div>
              </div>

              {/* Feature Stats */}
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px]"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-purple-400">
                  <span>Sub-Query Graph Plan</span>
                  <span className="text-[10px] badge-purple px-1.5 py-0.5 rounded">Max 3 Hops</span>
                </div>
              </div>
            </div>

            {/* Card 4: Zero-Hallucination Claim Extraction */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 icon-emerald shadow-lg shadow-emerald-500/15">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Citation & Evidence Grounding</h3>
                <p className="text-xs t-secondary leading-relaxed mb-6">
                  Every response claim is decomposed into factual propositions and verified against retrieved chunk text.
                  Unanswerable queries trigger deterministic abstentions rather than hallucinations.
                </p>
              </div>
              {/* Feature Visual */}
              <div className="p-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px] space-y-1.5"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>NLI Claim Verification</span>
                  <span className="text-[10px] badge-emerald px-1.5 py-0.5 rounded">Verified 99.4%</span>
                </div>
                <p className="t-muted text-[10px]">Deterministic Abstention if Faithfulness &lt; 0.85</p>
              </div>
            </div>

            {/* Card 5: Zero-Trust Multi-Tenant Security */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-pink-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-5 icon-pink shadow-lg shadow-pink-500/15">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Zero-Trust Enterprise Security</h3>
                <p className="text-xs t-secondary leading-relaxed mb-4">
                  Argon2id cryptographic password hashing, HttpOnly session cookies, AES-256-GCM encryption at rest,
                  and strict tenant isolation enforced at the vector collection and database schema layers.
                </p>
              </div>

              {/* Generated Image Showcase */}
              <div className="rounded-2xl overflow-hidden border mb-3 relative group/img h-36"
                   style={{ borderColor: 'var(--border)' }}>
                <img
                  src="/images/enterprise-security.jpg"
                  alt="Zero-Trust Security & Multi-Tenancy Vault"
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-mono text-pink-300 font-semibold">Argon2id + AES-256-GCM + HttpOnly</span>
                </div>
              </div>

              {/* Feature Stats */}
              <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px]"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-pink-400">
                  <span>Tenant Isolation & RBAC</span>
                  <span className="text-[10px] badge-pink px-1.5 py-0.5 rounded">SOC 2 Ready</span>
                </div>
              </div>
            </div>

            {/* Card 6: Real-Time Vector Telemetry & Analytics */}
            <div className="bento-card rounded-3xl p-7 flex flex-col justify-between group hover:border-amber-500/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 icon-amber shadow-lg shadow-amber-500/15">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold t-primary mb-2">Evaluation & Telemetry Benchmarks</h3>
                <p className="text-xs t-secondary leading-relaxed mb-6">
                  Comprehensive dashboard monitoring retrieval recall@k, mean reciprocal rank (MRR), LLM token economics,
                  and semantic cache hit rates across all organizational knowledge assets.
                </p>
              </div>
              {/* Feature Visual */}
              <div className="p-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.02] border font-mono text-[11px] space-y-1.5"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-amber-400">
                  <span>Recall@5: 96.8% · MRR: 0.89</span>
                  <span className="text-[10px] badge-amber px-1.5 py-0.5 rounded">Real-time</span>
                </div>
                <p className="t-muted text-[10px]">Audit Logs & Latency Traces Streamed</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
         INTERACTIVE ARCHITECTURE SHOWCASE
         ───────────────────────────────────────────────────────── */}
      <section id="architecture" className="px-6 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase font-mono tracking-widest text-indigo-400 mb-2 block">
              End-to-End Lineage
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              How OmniRAG Processes Enterprise Data
            </h2>
            <p className="text-sm t-secondary">
              From raw binary ingestion to verified LLM generation in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bento-card rounded-3xl p-6 relative">
              <div className="text-2xl font-black text-indigo-500/30 mb-3 font-mono">01</div>
              <h4 className="text-sm font-bold t-primary mb-1">Async Parsing Engine</h4>
              <p className="text-xs t-secondary leading-relaxed">
                PyMuPDF & Docling workers extract raw text, tables, and images. SHA-256 hashes deduplicate content.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bento-card rounded-3xl p-6 relative">
              <div className="text-2xl font-black text-cyan-500/30 mb-3 font-mono">02</div>
              <h4 className="text-sm font-bold t-primary mb-1">Dual Vector Indexing</h4>
              <p className="text-xs t-secondary leading-relaxed">
                High-dimensional dense vectors stored in Qdrant with HNSW graph indexing while BM25 builds inverted lexical terms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bento-card rounded-3xl p-6 relative">
              <div className="text-2xl font-black text-purple-500/30 mb-3 font-mono">03</div>
              <h4 className="text-sm font-bold t-primary mb-1">Reciprocal Rank Fusion</h4>
              <p className="text-xs t-secondary leading-relaxed">
                RRF merges candidate pools with zero score calibration skew, followed by a cross-encoder reranker.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bento-card rounded-3xl p-6 relative">
              <div className="text-2xl font-black text-emerald-500/30 mb-3 font-mono">04</div>
              <h4 className="text-sm font-bold t-primary mb-1">Grounded Generation</h4>
              <p className="text-xs t-secondary leading-relaxed">
                LLM generates answer constrained strictly by retrieved evidence; NLI validator checks every claim before release.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
         ENTERPRISE CALL TO ACTION BANNER
         ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1200px] mx-auto rounded-3xl bento-card p-10 sm:p-14 text-center relative overflow-hidden shadow-2xl border"
             style={{ borderColor: 'var(--border)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight t-primary mb-4">
              Deploy OmniRAG for your organization today
            </h2>
            <p className="text-sm t-secondary mb-8 leading-relaxed">
              Experience zero-hallucination enterprise search with multi-modal document understanding.
              Sign up with your corporate work email for instant access.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate(currentUser ? 'dashboard' : 'signup')}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                {currentUser ? 'Open My Workspace' : 'Get Started Free'}
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-8 py-3.5 rounded-2xl bento-chip text-sm font-semibold t-primary hover:opacity-90 transition-all border"
                style={{ borderColor: 'var(--border)' }}
              >
                Sign In to Workspace
              </button>
            </div>

            <p className="text-xs t-muted mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 icon-emerald" />
              <span>Restricted to corporate work emails · No credit card required</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
         COMPREHENSIVE ENTERPRISE FOOTER
         ───────────────────────────────────────────────────────── */}
      <footer className="w-full px-6 py-14 border-t mt-auto" style={{ borderColor: 'var(--border)', background: 'var(--bg-card-solid)' }}>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Col 1: Brand & Overview */}
          <div className="md:col-span-2 space-y-4">
            <OmniRAGLogo
              size="md"
              showText={true}
              subtitle="Enterprise Knowledge Intelligence"
              badge="Enterprise"
              interactive={false}
            />
            <p className="text-xs t-secondary max-w-sm leading-relaxed">
              OmniRAG is the next-generation enterprise retrieval-augmented generation platform combining hybrid dense/sparse vector search, multimodal parsing, and bounded agentic reasoning.
            </p>
            <div className="flex items-center gap-2 text-[11px] t-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All Systems Operational · SOC 2 Type II Certified</span>
            </div>
          </div>

          {/* Col 2: Platform Features */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase font-mono tracking-wider t-primary">Platform</p>
            <ul className="space-y-2 text-xs t-secondary">
              <li><a href="#features" className="hover:t-primary transition-colors">Multimodal Parsing</a></li>
              <li><a href="#hybrid" className="hover:t-primary transition-colors">Hybrid Search (Qdrant + BM25)</a></li>
              <li><a href="#architecture" className="hover:t-primary transition-colors">Reciprocal Rank Fusion</a></li>
              <li><a href="#features" className="hover:t-primary transition-colors">Agentic Reasoning Graph</a></li>
              <li><a href="#benchmarks" className="hover:t-primary transition-colors">Evaluation Benchmarks</a></li>
            </ul>
          </div>

          {/* Col 3: Security & Governance */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase font-mono tracking-wider t-primary">Security & Trust</p>
            <ul className="space-y-2 text-xs t-secondary">
              <li><a href="#security" className="hover:t-primary transition-colors">Zero-Trust Architecture</a></li>
              <li><a href="#security" className="hover:t-primary transition-colors">Tenant Isolation</a></li>
              <li><a href="#security" className="hover:t-primary transition-colors">Argon2id & AES-256-GCM</a></li>
              <li><a href="#security" className="hover:t-primary transition-colors">HttpOnly Secure Sessions</a></li>
              <li><a href="#security" className="hover:t-primary transition-colors">Audit & Compliance Logs</a></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase font-mono tracking-wider t-primary">Resources</p>
            <ul className="space-y-2 text-xs t-secondary">
              <li><a href="https://github.com/Mourya-N/OmniRAG" target="_blank" rel="noreferrer" className="hover:t-primary transition-colors flex items-center gap-1">GitHub Repository <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="/api/docs" target="_blank" rel="noreferrer" className="hover:t-primary transition-colors flex items-center gap-1">FastAPI Swagger Docs <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="#features" className="hover:t-primary transition-colors">System Architecture</a></li>
              <li><a href="#features" className="hover:t-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#features" className="hover:t-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="max-w-[1440px] mx-auto pt-10 mt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs t-muted"
             style={{ borderColor: 'var(--border)' }}>
          <p>© {new Date().getFullYear()} OmniRAG Inc. All rights reserved. Enterprise Multimodal Knowledge Intelligence.</p>
          <div className="flex items-center gap-6">
            <span>Security</span>
            <span>Privacy</span>
            <span>Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
