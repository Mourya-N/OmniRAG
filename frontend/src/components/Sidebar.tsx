import React, { useEffect } from 'react';
import {
  Home,
  MessageSquare,
  Sparkles,
  Search,
  Share2,
  Bookmark,
  BarChart2,
  Folder,
  UploadCloud,
  RefreshCw,
  Layers,
  Users,
  Trash2,
  Award,
  SlidersHorizontal,
  Cpu,
  Lightbulb,
  Settings,
  X,
} from 'lucide-react';
import { OmniRAGLogo } from './OmniRAGLogo';
import { useTheme } from '../contexts/ThemeContext';

export type DashTab =
  | 'home'
  | 'chat'
  | 'agentic-search'
  | 'search'
  | 'graph'
  | 'saved-queries'
  | 'analytics'
  | 'documents'
  | 'upload'
  | 'processing'
  | 'collections'
  | 'shared'
  | 'trash'
  | 'evaluation'
  | 'benchmarks'
  | 'model-comparison'
  | 'insights'
  | 'settings';

interface SidebarProps {
  activeTab: DashTab;
  setActiveTab: (tab: DashTab) => void;
  onOpenUpload: () => void;
  onOpenUpgradePlan?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title?: string;
  items: {
    id: DashTab;
    label: string;
    icon: any;
    badge?: string | number;
    badgeColor?: string;
    action?: 'tab' | 'upload';
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Regular user navigation items (Zero admin exposure)
  const sections: NavSection[] = [
    {
      items: [{ id: 'home', label: 'Home', icon: Home }],
    },
    {
      title: 'DISCOVER',
      items: [
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        { id: 'agentic-search', label: 'Agentic Search', icon: Sparkles },
        { id: 'search', label: 'Global Search', icon: Search },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'saved-queries', label: 'Saved Queries', icon: Bookmark },
        { id: 'analytics', label: 'Query Analytics', icon: BarChart2 },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [
        { id: 'documents', label: 'My Documents', icon: Folder },
        { id: 'upload', label: 'Upload', icon: UploadCloud, action: 'upload' },
        {
          id: 'processing',
          label: 'Processing',
          icon: RefreshCw,
          badge: 3,
          badgeColor: 'bg-indigo-600 text-white',
        },
        { id: 'collections', label: 'Collections', icon: Layers },
        { id: 'shared', label: 'Shared with Me', icon: Users },
        { id: 'trash', label: 'Trash', icon: Trash2 },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'evaluation', label: 'Evaluation', icon: Award },
        { id: 'benchmarks', label: 'Benchmarks', icon: SlidersHorizontal },
        { id: 'model-comparison', label: 'Model Comparison', icon: Cpu },
        { id: 'insights', label: 'Insights', icon: Lightbulb },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (item: NavSection['items'][0]) => {
    if (item.action === 'upload') {
      onOpenUpload();
    } else {
      setActiveTab(item.id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  // Prevent body scroll when mobile drawer is open on phones
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  return (
    <>
      {/* Mobile Backdrop with high z-index and touch dismissal */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] lg:hidden animate-fade-in"
        />
      )}

      {/* Floating Hover Expandable Sidebar (Desktop) / Native Drawer (Mobile) */}
      <aside
        className={`fixed z-[100] flex flex-col justify-between shrink-0 select-none shadow-2xl transition-all duration-300 ease-in-out group ${
          isOpenMobile
            ? 'inset-y-0 left-0 w-72 max-w-[85vw] h-full rounded-r-3xl rounded-l-none translate-x-0'
            : 'top-[74px] left-3 h-[calc(100vh-86px)] rounded-3xl -translate-x-full lg:translate-x-0 w-[64px] hover:w-60'
        }`}
        style={{
          background: dark ? 'rgba(10, 14, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          border: `1px solid var(--border)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Mobile Drawer Header with Branding and Close Button */}
        {isOpenMobile && (
          <div
            className="p-4 flex items-center justify-between border-b lg:hidden shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <OmniRAGLogo size={32} showText={false} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                    OmniRAG
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full badge-indigo">
                    Enterprise
                  </span>
                </div>
                <p className="text-[10px] t-muted">Knowledge Intelligence</p>
              </div>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl bento-chip t-muted hover:t-primary active:scale-95 transition-transform"
                title="Close Navigation Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Navigation Sections — WITHOUT visible scrollbar thumb/slider */}
        <div className="flex-1 overflow-y-auto px-2 group-hover:px-2.5 py-3 space-y-3 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sec.title && (
                <div
                  className={`px-2 pb-0.5 text-[8.5px] font-mono font-bold tracking-wider uppercase t-muted transition-opacity duration-200 overflow-hidden whitespace-nowrap ${
                    isOpenMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sec.title}
                </div>
              )}

              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      title={item.label}
                      className={`w-full p-1.5 group-hover:px-2 rounded-xl flex items-center transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-white font-semibold shadow-sm'
                          : dark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                      }`}
                    >
                      {/* Refined Prominent Icon */}
                      <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all ${
                        isActive ? 'bg-indigo-500/20 text-cyan-400' : ''
                      }`}>
                        <Icon
                          className={`w-[18px] h-[18px] transition-colors ${
                            isActive
                              ? 'text-cyan-400'
                              : dark
                              ? 'text-slate-300 group-hover:text-white'
                              : 'text-slate-600 group-hover:text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Label - visible on mobile drawer and reveals on hover on desktop */}
                      <span
                        className={`ml-2.5 truncate transition-opacity duration-200 whitespace-nowrap flex-1 font-medium text-xs ${
                          isOpenMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`transition-opacity duration-200 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold shrink-0 ml-1 ${
                            item.badgeColor || 'bg-indigo-600 text-white'
                          } ${isOpenMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 
          ========================================================================
          STORAGE CODE PART (Commented out per user request - not using it yet)
          ========================================================================
          <div className="p-2.5 group-hover:p-3 border-t overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="flex group-hover:hidden flex-col items-center justify-center py-1">
              <div className="w-8 h-8 rounded-xl bento-chip flex items-center justify-center text-[10px] font-mono font-bold t-accent" title="Storage 25% (128GB/500GB)">
                25%
              </div>
            </div>

            <div
              className="hidden group-hover:block p-3 rounded-2xl border transition-all"
              style={{
                background: dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                <span className="font-semibold t-primary">Storage Usage</span>
                <span className="t-muted">25%</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: '25%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2.5">
                <span>128 GB / 500 GB</span>
              </div>

              <button
                onClick={_onOpenUpgradePlan}
                className="w-full py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all flex items-center justify-center gap-1"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
          ========================================================================
        */}
      </aside>
    </>
  );
};
