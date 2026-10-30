import React, { useState, useEffect } from 'react';
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
  Sun,
  Moon,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BentoDashboard } from './components/BentoDashboard';
import { ChatExplorer } from './components/ChatExplorer';
import { SearchExplorer } from './components/SearchExplorer';
import { DocumentManager } from './components/DocumentManager';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { LandingPage } from './pages/LandingPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { ApiService } from './services/api';
import { useTheme } from './contexts/ThemeContext';
import { UserProfile } from './types';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'google-callback';
type DashTab = 'home' | 'chat' | 'search' | 'documents' | 'evaluation';

const isGoogleCallback = (): boolean => {
  return (
    window.location.pathname.startsWith('/auth/google/callback') ||
    window.location.hash.startsWith('#/auth/google/callback') ||
    (window.location.search.includes('code=') && (window.location.pathname.includes('callback') || window.location.hash.includes('callback')))
  );
};

const getInitialPage = (): Page => {
  if (isGoogleCallback()) return 'google-callback';
  const h = window.location.hash;
  if (h === '#/signup') return 'signup';
  if (h === '#/login') return 'login';
  if (h === '#/dashboard') {
    const hasUser = localStorage.getItem('omnirag_user');
    return hasUser ? 'dashboard' : 'login';
  }
  // Default on http://localhost:3000/ or #/ or #/landing
  return 'landing';
};

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [activeTab, setActiveTab] = useState<DashTab>('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('omnirag_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen to browser hash changes (e.g. back/forward navigation or manual URL entry)
  useEffect(() => {
    const handleHashChange = () => {
      const page = getInitialPage();
      setCurrentPage(page);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Verify and sync authenticated user from backend on mount and navigation
  useEffect(() => {
    ApiService.getMe()
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('omnirag_user', JSON.stringify(user));
      })
      .catch(() => {
        // Unauthenticated session
      });
  }, [currentPage]);

  const navigate = (page: Page) => {
    if (page === 'landing') {
      window.location.hash = '#/';
    } else if (page === 'dashboard') {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = `#/${page}`;
    }
    setCurrentPage(page);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch {}
    localStorage.removeItem('omnirag_user');
    setCurrentUser(null);
    navigate('landing');
  };

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

  const dark = theme === 'dark';

  // ---- Landing Page (Default for http://localhost:3000/ and #/ ) ----
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onNavigate={(p) => navigate(p)}
        currentUser={currentUser}
      />
    );
  }

  // ---- Auth pages ----
  if (currentPage === 'google-callback') {
    return (
      <GoogleCallbackPage
        onSuccess={() => {
          ApiService.getMe()
            .then((me) => setCurrentUser(me))
            .catch(() => {});
          navigate('dashboard');
        }}
        onNavigate={(p) => navigate(p)}
      />
    );
  }
  if (currentPage === 'login') {
    return (
      <LoginPage
        onNavigate={(p) => navigate(p === 'signup' ? 'signup' : p === 'landing' ? 'landing' : 'dashboard')}
      />
    );
  }
  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onNavigate={(p) => navigate(p === 'login' ? 'login' : p === 'landing' ? 'landing' : 'dashboard')}
      />
    );
  }

  // Protected Route Guard: If dashboard requested but no authenticated session, redirect to login
  if (currentPage === 'dashboard' && !currentUser) {
    return (
      <LoginPage
        onNavigate={(p) => navigate(p === 'signup' ? 'signup' : p === 'landing' ? 'landing' : 'dashboard')}
      />
    );
  }

  // ---- Dashboard ----
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Nebula blobs — theme-aware via CSS vars */}
      <div className="nebula-blob-1 fixed -bottom-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="nebula-blob-2 fixed -top-32 left-1/3 w-[800px] h-[800px] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="nebula-blob-3 fixed top-1/3 -right-24 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="nebula-blob-4 fixed -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* TOP NAVBAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as DashTab)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onQuickSearch={(_q) => setActiveTab('search')}
        onNavigateAuth={() => navigate('login')}
        onNavigateLanding={() => navigate('landing')}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* MAIN CONTAINER: LEFT DOCK + MAIN CONTENT */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 flex gap-6 items-start">
        {/* LEFT VERTICAL FLOATING DOCK */}
        <aside
          className="sticky top-24 z-40 hidden md:flex flex-col items-center gap-3 p-2 rounded-2xl bento-card shadow-2xl"
          style={{ borderColor: 'var(--border)' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as DashTab)}
                title={item.label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                    : dark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-black/[0.05]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <div
                  className="absolute left-14 px-2.5 py-1 text-xs font-medium rounded-lg shadow-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 bento-card"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  {item.label}
                </div>
              </button>
            );
          })}

          <div className="w-6 h-[1px] my-1" style={{ background: 'var(--border)' }} />

          {/* Theme toggle in dock */}
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
              dark ? 'text-amber-300 hover:bg-amber-400/10' : 'text-indigo-600 hover:bg-indigo-500/10'
            }`}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Security */}
          <button
            title="Tenant Security & ACL Active"
            className="w-11 h-11 rounded-xl flex items-center justify-center icon-emerald hover:bg-emerald-500/10 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            title="Enterprise Settings"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              dark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]' : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.05]'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </aside>

        {/* CENTER / MAIN CONTENT VIEW */}
        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <BentoDashboard
              onNavigateTab={(t) => setActiveTab(t as DashTab)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          )}
          {activeTab === 'chat' && <ChatExplorer />}
          {activeTab === 'search' && <SearchExplorer />}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'evaluation' && <EvaluationDashboard />}
        </main>
      </div>

      {/* UPLOAD MODAL OVERLAY */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bento-card rounded-3xl p-6 shadow-2xl relative" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 t-muted hover:t-primary p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl badge-indigo flex items-center justify-center">
                <Upload className="w-5 h-5 icon-indigo" />
              </div>
              <div>
                <h3 className="text-base font-semibold t-primary">Upload Knowledge Documents</h3>
                <p className="text-xs t-muted">Multi-format enterprise document ingestion</p>
              </div>
            </div>

            <form onSubmit={handleModalUpload} className="space-y-4">
              <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group" style={{ background: dark ? 'rgba(13,16,36,0.6)' : 'rgba(238,240,255,0.6)' }}>
                <Upload className="w-8 h-8 icon-indigo group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-semibold t-primary">
                  {uploadFile ? uploadFile.name : 'Click to select or drag and drop files'}
                </span>
                <span className="text-[10px] t-muted mt-1">
                  PDF, DOCX, PPTX, XLSX, CSV, Markdown, Code (Max 100MB)
                </span>
                <input
                  type="file"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]);
                  }}
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.xlsx,.csv,.md,.txt,.py"
                />
              </label>

              {uploadStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    uploadStatus.includes('failed')
                      ? 'badge-amber'
                      : 'badge-emerald'
                  }`}
                >
                  {uploadStatus.includes('failed') ? (
                    <AlertCircle className="w-4 h-4 shrink-0 icon-amber" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 icon-emerald" />
                  )}
                  <span>{uploadStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bento-chip text-xs t-secondary hover:t-primary"
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
