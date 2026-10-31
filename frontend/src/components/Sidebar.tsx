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
  ShieldCheck,
  FileText,
  Activity,
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
  | 'users'
  | 'permissions'
  | 'audit-logs'
  | 'health'
  | 'settings';

interface SidebarProps {
  activeTab: DashTab;
  setActiveTab: (tab: DashTab) => void;
  onOpenUpload: () => void;
  onOpenUpgradePlan: () => void;
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
  onOpenUpgradePlan,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

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
      title: 'ADMIN',
      items: [
        { id: 'users', label: 'Users & Teams', icon: Users },
        { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
        { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        { id: 'health', label: 'System Health', icon: Activity },
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

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col justify-between shrink-0 transition-transform duration-300 select-none overflow-hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: dark ? 'rgba(10, 14, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRight: `1px solid var(--border)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top Header / Brand Logo */}
        <div
          className="p-5 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <OmniRAGLogo size={36} className="shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                OmniRAG
              </span>
              <span className="text-[10px] tracking-wider uppercase font-medium t-muted -mt-0.5">
                Enterprise Knowledge
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg bento-chip t-muted hover:t-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sec.title && (
                <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase t-muted">
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
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-all duration-200 group text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-white font-semibold shadow-sm'
                          : dark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-cyan-400'
                              : dark
                              ? 'text-slate-400 group-hover:text-slate-200'
                              : 'text-slate-500 group-hover:text-slate-800'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
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

        {/* Bottom Storage Usage Card (Matching Screenshot) */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div
            className="p-3.5 rounded-2xl border transition-all"
            style={{
              background: dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
              <span className="font-semibold t-primary">Storage Usage</span>
              <span className="t-muted">25%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-black/20 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                style={{ width: '25%' }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-3">
              <span>128 GB / 500 GB</span>
            </div>

            <button
              onClick={onOpenUpgradePlan}
              className="w-full py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all flex items-center justify-center gap-1"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
