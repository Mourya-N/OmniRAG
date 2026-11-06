import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Upload,
  LogOut,
  Shield,
  ChevronDown,
  LogIn,
  Menu,
  Sun,
  Moon,
  FileText,
  MessageSquare,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { OmniRAGLogo } from './OmniRAGLogo';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  onQuickSearch: (query: string) => void;
  onNavigateAuth?: () => void;
  onNavigateLanding?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  currentLayer?: 'workspace' | 'admin';
  onToggleLayer?: () => void;
}

const getInitials = (name?: string, email?: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'U';
};

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  onOpenUpload,
  onQuickSearch,
  onNavigateAuth,
  onNavigateLanding,
  currentUser,
  onLogout,
  onToggleMobileMenu,
  currentLayer = 'workspace',
  onToggleLayer,
}) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const [searchValue, setSearchValue] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [matchingPassages, setMatchingPassages] = useState<any[]>([]);
  const [isSearchingPassages, setIsSearchingPassages] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Navigation targets
  const navTargets = [
    { key: 'home', label: 'Dashboard Overview', desc: 'Main telemetry & quick assistant', icon: Layers },
    { key: 'chat', label: 'AI Chat Console', desc: 'Evidence-grounded conversation with verifiable citations', icon: MessageSquare },
    { key: 'search', label: 'Hybrid & BM25 Search', desc: 'Dense vector and sparse lexical passage retrieval', icon: Search },
    { key: 'documents', label: 'Document Manager', desc: 'Uploaded files and multimodal assets', icon: FileText },
    { key: 'processing', label: 'Ingestion Pipeline', desc: 'Background queue & vector indexer', icon: RefreshCw },
    { key: 'collections', label: 'Knowledge Collections', desc: 'Document categories and partitions', icon: Layers },
    { key: 'settings', label: 'Settings & Security', desc: 'Account and API configuration', icon: Sliders },
  ];

  // Load real documents and conversations for instantaneous search matching
  const loadSearchIndices = async () => {
    try {
      const [docsRes, convsRes] = await Promise.all([
        ApiService.listDocuments().catch(() => ({ items: [] })),
        ApiService.getRAGConversations().catch(() => []),
      ]);
      setDocs(docsRes.items || []);
      setConversations(convsRes || []);
    } catch (err) {
      console.warn('Failed to pre-fetch search indices:', err);
    }
  };

  useEffect(() => {
    loadSearchIndices();
  }, []);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for profile and search dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for passage evidence
  useEffect(() => {
    const q = searchValue.trim();
    if (!q || q.length < 2) {
      setMatchingPassages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPassages(true);
      try {
        const res = await ApiService.executeSearch(q, 'hybrid');
        setMatchingPassages(res.hits || []);
      } catch {
        setMatchingPassages([]);
      } finally {
        setIsSearchingPassages(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setIsSearchOpen(false);
      onQuickSearch(searchValue.trim());
      setActiveTab('search');
    }
  };

  const handleNavigateTo = (tab: string, queryForSearch?: string) => {
    setIsSearchOpen(false);
    if (queryForSearch) {
      onQuickSearch(queryForSearch);
    }
    setActiveTab(tab);
  };

  const queryLower = searchValue.toLowerCase().trim();
  const matchingDocs = docs.filter((d) => (d.filename || '').toLowerCase().includes(queryLower));
  const matchingConvs = conversations.filter((c) => (c.title || '').toLowerCase().includes(queryLower));
  const matchingNavs = navTargets.filter(
    (n) => n.label.toLowerCase().includes(queryLower) || n.desc.toLowerCase().includes(queryLower)
  );

  const totalMatches = matchingDocs.length + matchingPassages.length + matchingConvs.length + (queryLower ? matchingNavs.length : 0);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await ApiService.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('omnirag_user');
    if (onNavigateAuth) {
      onNavigateAuth();
    } else {
      window.location.hash = '#/login';
    }
  };

  const displayName = currentUser?.full_name?.trim() || (currentUser?.email ? currentUser.email.split('@')[0] : 'Enterprise User');
  const displayEmail = currentUser?.email?.trim() || 'user@enterprise.ai';
  const initials = getInitials(currentUser?.full_name, currentUser?.email);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 py-3.5 backdrop-blur-xl"
      style={{
        background: dark ? 'rgba(9,12,26,0.85)' : 'rgba(255,255,255,0.90)',
        borderBottom: `1px solid var(--border)`,
      }}
    >
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand Logo & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-3xl">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bento-chip t-muted hover:t-primary shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* OmniRAG Logo & Name in Navbar */}
          <div
            onClick={onNavigateLanding}
            className="flex items-center gap-3 cursor-pointer select-none group pr-4 border-r"
            style={{ borderColor: 'var(--border)' }}
            title="OmniRAG — Back to Landing / Home"
          >
            <OmniRAGLogo size={40} showText={false} className="group-hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                  OmniRAG
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-indigo">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] font-semibold t-muted -mt-0.5 tracking-wide">
                Knowledge Intelligence
              </span>
            </div>
          </div>

          {/* Global Search Capsule */}
          <div ref={searchContainerRef} className="relative w-full">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div
                className="flex items-center rounded-xl px-4 py-2.5 transition-all shadow-inner"
                style={{
                  background: dark ? 'rgba(19,23,51,0.80)' : 'rgba(238,240,255,0.90)',
                  border: isSearchOpen ? '1px solid rgba(99,102,241,0.8)' : '1px solid var(--border)',
                }}
              >
                <Search className="w-4 h-4 shrink-0 mr-2.5 t-muted" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onFocus={() => {
                    setIsSearchOpen(true);
                    loadSearchIndices();
                  }}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  placeholder="Search across documents, evidence, conversations, views..."
                  className="w-full bg-transparent text-xs focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0 cursor-pointer"
                  onClick={() => {
                    searchInputRef.current?.focus();
                    setIsSearchOpen(true);
                  }}
                  style={{ background: 'var(--bg-chip)', border: `1px solid var(--border)`, color: 'var(--text-muted)' }}
                >
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </div>
            </form>

            {/* Global Search Dropdown Results Popover */}
            {isSearchOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl max-h-[75vh] overflow-y-auto space-y-3"
                style={{
                  background: dark ? 'rgba(15,18,37,0.97)' : 'rgba(255,255,255,0.98)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between pb-2 border-b text-[11px]" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-semibold t-muted flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {searchValue.trim() ? (
                      <>Matches for <span className="t-primary font-bold">"{searchValue}"</span></>
                    ) : (
                      'Quick Navigation & Search'
                    )}
                  </span>
                  <span className="font-mono text-[10px] t-muted">
                    {searchValue.trim() ? `${totalMatches} found` : 'Cmd+K to toggle'}
                  </span>
                </div>

                {/* Section 1: Matching Navigation Views */}
                {matchingNavs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider t-muted px-2 py-1">
                      Views & Workspaces
                    </div>
                    <div className="space-y-1">
                      {matchingNavs.slice(0, 4).map((nav) => {
                        const Icon = nav.icon;
                        return (
                          <div
                            key={nav.key}
                            onClick={() => handleNavigateTo(nav.key)}
                            className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-indigo-500/10 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold t-primary group-hover:text-indigo-400 transition-colors">
                                  {nav.label}
                                </p>
                                <p className="text-[10px] t-muted truncate">{nav.desc}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 t-muted opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Matching Documents */}
                {matchingDocs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider t-muted px-2 py-1">
                      Documents ({matchingDocs.length})
                    </div>
                    <div className="space-y-1">
                      {matchingDocs.slice(0, 5).map((doc: any) => (
                        <div
                          key={doc.id || doc.filename}
                          onClick={() => handleNavigateTo('documents')}
                          className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-emerald-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold t-primary group-hover:text-emerald-400 transition-colors truncate">
                                {doc.filename}
                              </p>
                              <p className="text-[10px] t-muted">
                                {doc.page_count ? `${doc.page_count} pages • ` : ''}
                                {doc.chunk_count ? `${doc.chunk_count} chunks • ` : ''}
                                Status: <span className="text-emerald-400">{doc.status || 'INDEXED'}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-emerald shrink-0">
                            View File
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Matching Passages & Retrieval Chunks */}
                {searchValue.trim().length >= 2 && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider t-muted px-2 py-1">
                      <span>Passage & Evidence Matches</span>
                      {isSearchingPassages && <span className="text-indigo-400 animate-pulse">Searching...</span>}
                    </div>
                    {matchingPassages.length > 0 ? (
                      <div className="space-y-1.5">
                        {matchingPassages.slice(0, 4).map((hit: any, i: number) => {
                          const snippet = (hit.raw_text || hit.content || '').slice(0, 160);
                          const docName = hit.metadata?.filename || hit.document_id || 'Document Chunk';
                          return (
                            <div
                              key={hit.id || i}
                              onClick={() => handleNavigateTo('search', searchValue.trim())}
                              className="p-2.5 rounded-xl cursor-pointer hover:bg-blue-500/10 transition-colors group border"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-bold text-blue-400 truncate">
                                  {docName}
                                </span>
                                {hit.score !== undefined && (
                                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                    {(hit.score * 100).toFixed(0)}% match
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] t-secondary line-clamp-2 leading-relaxed italic">
                                "{snippet}..."
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : !isSearchingPassages ? (
                      <p className="text-xs t-muted italic px-2 py-1">
                        No direct passage matches. Press Enter to perform comprehensive dense vector retrieval.
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Section 4: Matching Conversations */}
                {matchingConvs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider t-muted px-2 py-1">
                      Recent Conversations ({matchingConvs.length})
                    </div>
                    <div className="space-y-1">
                      {matchingConvs.slice(0, 3).map((conv: any) => (
                        <div
                          key={conv.id}
                          onClick={() => handleNavigateTo('chat')}
                          className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold t-primary group-hover:text-purple-400 transition-colors truncate">
                                {conv.title || 'Conversation'}
                              </p>
                              <p className="text-[10px] t-muted">
                                {conv.message_count ? `${conv.message_count} messages` : 'Chat session'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono t-muted shrink-0">Resume</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero State if searching and nothing matched */}
                {searchValue.trim() && totalMatches === 0 && !isSearchingPassages && (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs t-muted">No items found matching "{searchValue}".</p>
                    <button
                      type="button"
                      onClick={() => handleNavigateTo('search', searchValue.trim())}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                    >
                      Run Hybrid Search in Explorer
                    </button>
                  </div>
                )}

                {/* Popover Footer */}
                <div
                  className="pt-2 border-t flex items-center justify-between text-[10px] t-muted font-mono"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span>Press <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-indigo-300">Enter ↵</kbd> to search</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-black/20">Esc</kbd> to dismiss</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Admin Switcher & User Capsule */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Admin Layer Toggle (Visible only for Founder / Superuser Admin) */}
          {Boolean(currentUser?.is_superuser || currentUser?.roles?.includes('Admin')) && onToggleLayer && (
            <button
              onClick={onToggleLayer}
              title={currentLayer === 'admin' ? 'Switch back to User Workspace' : 'Switch to Enterprise Admin Portal'}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                currentLayer === 'admin'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/30 ring-2 ring-pink-400/50'
                  : 'bento-chip t-accent hover:border-indigo-500/40 text-indigo-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{currentLayer === 'admin' ? 'User Workspace' : 'Admin Portal'}</span>
              <span className="md:hidden">{currentLayer === 'admin' ? 'Workspace' : 'Admin'}</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Upload</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => alert('No new enterprise security alerts')}
              className="w-9 h-9 rounded-xl bento-chip flex items-center justify-center t-secondary hover:t-primary transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
          </div>

          {/* Theme Switcher Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="w-9 h-9 rounded-xl bento-chip flex items-center justify-center transition-colors"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* User Profile Capsule with Interactive Dropdown */}
          <div
            ref={dropdownRef}
            className="relative flex items-center pl-2"
            style={{ borderLeft: `1px solid var(--border)` }}
          >
            {currentUser ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all"
              >
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/30"
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left max-w-[130px]">
                  <p className="text-xs font-semibold leading-tight t-primary truncate">{displayName}</p>
                  <p className="text-[10px] leading-tight t-muted truncate">Enterprise Plan</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 t-muted" />
              </button>
            ) : (
              <button
                onClick={onNavigateAuth}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bento-chip text-xs font-medium t-primary hover:opacity-90 transition-all border"
                style={{ borderColor: 'var(--border)' }}
              >
                <LogIn className="w-3.5 h-3.5 icon-indigo" />
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileOpen && currentUser && (
              <div
                className="absolute right-0 top-12 w-64 rounded-2xl bento-card p-2 shadow-2xl z-50 animate-fade-in"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-bold t-primary truncate">{displayName}</p>
                  <p className="text-[11px] t-muted truncate">{displayEmail}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] badge-emerald px-2 py-0.5 rounded-md w-fit">
                    <Shield className="w-3 h-3 icon-emerald" />
                    <span>Role: Enterprise User</span>
                  </div>
                </div>

                <div className="py-1">
                  {onNavigateLanding && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigateLanding();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs t-secondary hover:t-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                    >
                      View Platform Overview
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigateAuth && onNavigateAuth();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs t-secondary hover:t-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Switch Account / Sign In
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out (Clear Session)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
