import React from 'react';
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Floating Hover Expandable Sidebar (Fixed dock on left — zero layout shift) */}
      <aside
        className={`fixed top-[74px] left-3 z-40 h-[calc(100vh-86px)] flex flex-col justify-between shrink-0 select-none rounded-3xl bento-card shadow-2xl transition-all duration-300 ease-in-out group ${
          isOpenMobile
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0 w-[74px] hover:w-64'
        }`}
        style={{
          background: dark ? 'rgba(10, 14, 30, 0.94)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid var(--border)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Mobile close button (if drawer opened on small screens) */}
        {isOpenMobile && onCloseMobile && (
          <div
            className="p-3 flex items-center justify-end border-b lg:hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bento-chip t-muted hover:t-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Sections — WITHOUT visible scrollbar thumb/slider */}
        <div className="flex-1 overflow-y-auto px-2 group-hover:px-3 py-3 space-y-3 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sec.title && (
                <div className="px-2.5 pb-0.5 text-[9px] font-mono font-bold tracking-wider uppercase t-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden whitespace-nowrap">
                  {sec.title}
                </div>
              )}

              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      title={item.label}
                      className={`w-full p-1.5 group-hover:px-2.5 rounded-2xl flex items-center transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-white font-semibold shadow-sm'
                          : dark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                      }`}
                    >
                      {/* Enlarged Prominent Icon */}
                      <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all ${
                        isActive ? 'bg-indigo-500/20 text-cyan-400' : ''
                      }`}>
                        <Icon
                          className={`w-[22px] h-[22px] transition-colors ${
                            isActive
                              ? 'text-cyan-400'
                              : dark
                              ? 'text-slate-300 group-hover:text-white'
                              : 'text-slate-600 group-hover:text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Label - smoothly reveals on hover */}
                      <span className="ml-3 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap flex-1 font-medium text-xs">
                        {item.label}
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ml-1.5 ${
                            item.badgeColor || 'bg-indigo-600 text-white'
                          }`}
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
