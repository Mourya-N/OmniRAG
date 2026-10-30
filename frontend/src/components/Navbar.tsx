import React from 'react';
import { Database, Search, MessageSquare, BarChart3, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'chat', label: 'Grounded RAG Chat', icon: MessageSquare },
    { id: 'search', label: 'Intelligent Search', icon: Search },
    { id: 'documents', label: 'Knowledge Ingestion', icon: Database },
    { id: 'evaluation', label: 'Evaluation & Benchmarks', icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            Ω
          </div>
          <div>
            <div className="font-semibold tracking-tight text-white flex items-center gap-2">
              OmniRAG
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Enterprise v0.1
              </span>
            </div>
            <p className="text-xs text-slate-400">Multimodal Knowledge Intelligence</p>
          </div>
        </div>

        <nav className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Tenant Isolated (ABAC/RBAC)</span>
        </div>
      </div>
    </header>
  );
};

