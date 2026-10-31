import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, DashTab } from './components/Sidebar';
import { BentoDashboard } from './components/BentoDashboard';
import { ChatExplorer } from './components/ChatExplorer';
import { SearchExplorer } from './components/SearchExplorer';
import { DocumentManager } from './components/DocumentManager';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { AgenticSearch } from './components/views/AgenticSearch';
import { KnowledgeGraph } from './components/views/KnowledgeGraph';
import { SavedQueries } from './components/views/SavedQueries';
import { QueryAnalytics } from './components/views/QueryAnalytics';
import { ProcessingQueue } from './components/views/ProcessingQueue';
import { CollectionsView } from './components/views/CollectionsView';
import { SharedWithMe } from './components/views/SharedWithMe';
import { TrashView } from './components/views/TrashView';
import { BenchmarksView } from './components/views/BenchmarksView';
import { ModelComparison } from './components/views/ModelComparison';
import { InsightsView } from './components/views/InsightsView';
import { UsersTeamsView } from './components/views/UsersTeamsView';
import { PermissionsView } from './components/views/PermissionsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemHealthView } from './components/views/SystemHealthView';
import { SettingsView } from './components/views/SettingsView';
import { UpgradePlanModal } from './components/views/UpgradePlanModal';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { LandingPage } from './pages/LandingPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { AdminPortal } from './pages/AdminPortal';
import { ApiService } from './services/api';
import { useTheme } from './contexts/ThemeContext';
import { UserProfile } from './types';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'google-callback';

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
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);
  const [currentLayer, setCurrentLayer] = useState<'workspace' | 'admin'>('workspace');
  const [activeTab, setActiveTab] = useState<DashTab>('home');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUpgradePlanOpen, setIsUpgradePlanOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
      className="min-h-screen flex relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Nebula background atmospheric blobs — theme-aware */}
      <div className="nebula-blob-1 fixed -bottom-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="nebula-blob-2 fixed -top-32 left-1/3 w-[800px] h-[800px] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="nebula-blob-3 fixed top-1/3 -right-24 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="nebula-blob-4 fixed -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* FULL ENTERPRISE SIDEBAR MATCHING SCREENSHOT */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenUpgradePlan={() => setIsUpgradePlanOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN VIEW AREA (NAVBAR + VIEW CONTENT) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
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
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          currentLayer={currentLayer}
          onToggleLayer={() => setCurrentLayer((l) => (l === 'workspace' ? 'admin' : 'workspace'))}
        />

        {/* ACTIVE MAIN CONTENT VIEW (Workspace or Admin Portal) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 min-w-0">
          {currentLayer === 'admin' ? (
            <AdminPortal
              currentUser={currentUser}
              onReturnToWorkspace={() => setCurrentLayer('workspace')}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <BentoDashboard
                  onNavigateTab={(t) => setActiveTab(t as DashTab)}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                />
              )}
              {activeTab === 'chat' && <ChatExplorer />}
              {activeTab === 'agentic-search' && <AgenticSearch />}
              {activeTab === 'search' && <SearchExplorer />}
              {activeTab === 'graph' && <KnowledgeGraph />}
              {activeTab === 'saved-queries' && (
                <SavedQueries
                  onRunQuery={(_q) => {
                    setActiveTab('chat');
                  }}
                />
              )}
              {activeTab === 'analytics' && <QueryAnalytics />}
              {activeTab === 'documents' && <DocumentManager />}
              {activeTab === 'processing' && <ProcessingQueue />}
              {activeTab === 'collections' && <CollectionsView />}
              {activeTab === 'shared' && <SharedWithMe />}
              {activeTab === 'trash' && <TrashView />}
              {activeTab === 'evaluation' && <EvaluationDashboard />}
              {activeTab === 'benchmarks' && <BenchmarksView />}
              {activeTab === 'model-comparison' && <ModelComparison />}
              {activeTab === 'insights' && <InsightsView />}
              {activeTab === 'users' && <UsersTeamsView />}
              {activeTab === 'permissions' && <PermissionsView />}
              {activeTab === 'audit-logs' && <AuditLogsView />}
              {activeTab === 'health' && <SystemHealthView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* UPGRADE PLAN & STORAGE MODAL */}
      <UpgradePlanModal
        isOpen={isUpgradePlanOpen}
        onClose={() => setIsUpgradePlanOpen(false)}
      />

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
