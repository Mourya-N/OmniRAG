import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Upload, LogOut, Shield, ChevronDown, LogIn, Menu, Sun, Moon } from 'lucide-react';
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onQuickSearch(searchValue);
      setActiveTab('search');
    }
  };

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
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div
              className="flex items-center rounded-xl px-4 py-2.5 transition-all shadow-inner"
              style={{
                background: dark ? 'rgba(19,23,51,0.80)' : 'rgba(238,240,255,0.90)',
                border: `1px solid var(--border)`,
              }}
            >
              <Search className="w-4 h-4 shrink-0 mr-2.5 t-muted" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search across documents, people, code, tables, images..."
                className="w-full bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0"
                style={{ background: 'var(--bg-chip)', border: `1px solid var(--border)`, color: 'var(--text-muted)' }}
              >
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </form>
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
