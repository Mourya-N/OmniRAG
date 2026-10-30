import React, { useState } from 'react';
import {
  Home,
  MessageSquare,
  Search,
  Layers,
  BarChart3,
  ShieldCheck,
  Settings,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BentoDashboard } from './components/BentoDashboard';
import { ChatExplorer } from './components/ChatExplorer';
import { SearchExplorer } from './components/SearchExplorer';
import { DocumentManager } from './components/DocumentManager';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { ApiService } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'search' | 'documents' | 'evaluation'>('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const navItems = [
    { id: 'home', label: 'Bento Dashboard', icon: Home },
    { id: 'chat', label: 'RAG Chat Explorer', icon: MessageSquare },
    { id: 'search', label: 'Intelligent Search', icon: Search },
    { id: 'documents', label: 'Knowledge Ingestion', icon: Layers },
    { id: 'evaluation', label: 'Evaluation & Benchmarks', icon: BarChart3 },
  ];

  const handleModalUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus('Validating MIME magic bytes and calculating SHA-256...');

    try {
      await ApiService.uploadDocument(uploadFile);
      setUploadStatus('Document successfully uploaded! Asynchronous parsing pipeline triggered.');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadStatus(null);
      }, 1500);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message || 'Check file format'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090c1a] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* =========================================================================
          AMBIENT BACKGROUND GLOWS (MATCHING SCREENSHOT)
          ========================================================================= */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-b from-purple-600/15 via-indigo-600/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[550px] h-[550px] bg-pink-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* TOP NAVBAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onQuickSearch={(_q) => setActiveTab('search')}
      />

      {/* MAIN CONTAINER: LEFT DOCK + MAIN CONTENT */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 flex gap-6 items-start">
        {/* =========================================================================
            LEFT VERTICAL FLOATING DOCK
            ========================================================================= */}
        <aside className="sticky top-24 z-40 hidden md:flex flex-col items-center gap-3 p-2 rounded-2xl bento-card border border-white/[0.08] shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                title={item.label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip on hover */}
                <div className="absolute left-14 px-2.5 py-1 bg-[#13162b] text-slate-200 text-xs font-medium rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}

          <div className="w-6 h-[1px] bg-white/[0.08] my-1" />

          {/* Security Indicator */}
          <button
            title="Tenant Security & ACL Active"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            title="Enterprise Settings"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </aside>

        {/* =========================================================================
            CENTER / MAIN CONTENT VIEW
            ========================================================================= */}
        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <BentoDashboard
              onNavigateTab={(t) => setActiveTab(t as any)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          )}

          {activeTab === 'chat' && <ChatExplorer />}
          {activeTab === 'search' && <SearchExplorer />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'evaluation' && <EvaluationDashboard />}
        </main>
      </div>

      {/* =========================================================================
          UPLOAD MODAL OVERLAY
          ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bento-card rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Upload Knowledge Documents</h3>
                <p className="text-xs text-slate-400">Multi-format enterprise document ingestion</p>
              </div>
            </div>

            <form onSubmit={handleModalUpload} className="space-y-4">
              <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#0d1024]/60 group">
                <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  {uploadFile ? uploadFile.name : 'Click to select or drag and drop files'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  PDF, DOCX, PPTX, XLSX, CSV, Markdown, Code (Max 100MB)
                </span>
                <input
                  type="file"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.xlsx,.csv,.md,.txt,.py"
                />
              </label>

              {uploadStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    uploadStatus.includes('failed')
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {uploadStatus.includes('failed') ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  )}
                  <span>{uploadStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bento-chip text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30"
                >
                  {isUploading ? 'Uploading...' : 'Ingest Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
