import React from 'react';
import { Search, Bell, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  onQuickSearch: (query: string) => void;
  onNavigateAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  onOpenUpload,
  onQuickSearch,
  onNavigateAuth,
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onQuickSearch(searchValue);
      setActiveTab('search');
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full px-6 py-3.5 backdrop-blur-xl"
      style={{
        background: dark ? 'rgba(9,12,26,0.75)' : 'rgba(255,255,255,0.80)',
        borderBottom: `1px solid var(--border)`,
      }}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">
        {/* Left: Brand & Tagline */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3.5 cursor-pointer group shrink-0"
        >
          {/* Glowing Multi-color Petal Icon */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 transition-all">
            <div
              className="w-full h-full rounded-[14px] flex items-center justify-center relative overflow-hidden"
              style={{ background: dark ? '#0d1024' : '#f5f3ff' }}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-400 to-cyan-300 animate-pulse-slow" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight t-primary">OmniRAG</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] t-muted font-medium">Enterprise Knowledge Intelligence</p>
          </div>
        </div>

        {/* Center: Global Search Capsule */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div
              className="flex items-center rounded-full px-4 py-2 transition-all shadow-inner"
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
                placeholder="Search across your knowledge base..."
                className="w-full bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0"
                style={{ background: 'var(--bg-chip)', border: `1px solid var(--border)`, color: 'var(--text-muted)' }}
              >
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Actions & User Capsule */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Upload</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button className="w-9 h-9 rounded-full bento-chip flex items-center justify-center t-secondary hover:t-primary transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
          </div>

          {/* User Profile Capsule */}
          <div
            className="flex items-center gap-2.5 pl-2"
            style={{ borderLeft: `1px solid var(--border)` }}
          >
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/30 cursor-pointer"
              onClick={onNavigateAuth}
              title="Account"
            >
              AK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight t-primary">Amit Kumar</p>
              <p className="text-[10px] leading-tight t-muted">Engineering</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
