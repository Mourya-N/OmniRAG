import React from 'react';
import { Search, Bell, Upload } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUpload: () => void;
  onQuickSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  onOpenUpload,
  onQuickSearch,
}) => {
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onQuickSearch(searchValue);
      setActiveTab('search');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-3.5 backdrop-blur-xl bg-[#090c1a]/70 border-b border-white/[0.07]">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">
        {/* Left: Brand & Tagline */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3.5 cursor-pointer group shrink-0"
        >
          {/* Glowing Multi-color Petal Icon */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 transition-all">
            <div className="w-full h-full bg-[#0d1024] rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-400 to-cyan-300 animate-pulse-slow" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">OmniRAG</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Knowledge Intelligence</p>
          </div>
        </div>

        {/* Center: Global Search Capsule */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="flex items-center bg-[#131733]/80 border border-white/[0.08] hover:border-indigo-500/40 focus-within:border-indigo-500/60 rounded-full px-4 py-2 transition-all shadow-inner">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search across your knowledge base..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 shrink-0">
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
            <button className="w-9 h-9 rounded-full bento-chip flex items-center justify-center text-slate-300 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/30">
              AK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">Amit Kumar</p>
              <p className="text-[10px] text-slate-400 leading-tight">Engineering</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
