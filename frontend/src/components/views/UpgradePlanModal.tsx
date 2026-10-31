import React from 'react';
import {
  HardDrive,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="bento-card rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full space-y-6 relative overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bento-chip t-muted hover:t-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold t-primary">Enterprise Storage & Capacity</h2>
            <p className="text-xs t-muted">Scale multimodal vector storage, dedicated Qdrant clusters, and concurrent QPS</p>
          </div>
        </div>

        {/* Storage Bar Breakdown */}
        <div className="p-4 rounded-2xl bento-chip space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold t-primary">Active Quota: 128 GB / 500 GB</span>
            <span className="text-indigo-400 font-bold">25% Utilized</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden flex">
            <div style={{ width: '14.4%' }} className="bg-blue-500 h-full" title="Raw Documents: 72 GB" />
            <div style={{ width: '6.8%' }} className="bg-purple-500 h-full" title="Vector Embeddings: 34 GB" />
            <div style={{ width: '4.4%' }} className="bg-cyan-400 h-full" title="Caches & Indexes: 22 GB" />
          </div>

          <div className="flex items-center justify-between text-[11px] t-muted pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Documents (72 GB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Vector HNSW (34 GB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Cache & Logs (22 GB)
            </span>
          </div>
        </div>

        {/* Plan Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl border-2 border-indigo-500/50 bento-card space-y-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="badge-indigo text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  Current Tier
                </span>
                <h4 className="text-base font-bold t-primary mt-1">Enterprise Standard</h4>
              </div>
              <span className="text-lg font-bold t-primary font-mono">$99<span className="text-xs t-muted font-normal">/mo</span></span>
            </div>
            <ul className="space-y-1.5 t-secondary text-[11px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 500 GB Multimodal Storage
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Up to 50,000 queries/day
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SOC 2 Type II Compliance
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl border border-purple-500/30 bento-card space-y-3 hover:border-purple-500 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="badge-purple text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  Recommended
                </span>
                <h4 className="text-base font-bold t-primary mt-1">Dedicated Scale</h4>
              </div>
              <span className="text-lg font-bold t-primary font-mono">$299<span className="text-xs t-muted font-normal">/mo</span></span>
            </div>
            <ul className="space-y-1.5 t-secondary text-[11px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> 2 TB Dedicated VPC Cluster
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Unlimited concurrent QPS
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Custom fine-tuned reranker
              </li>
            </ul>
            <button
              onClick={() => {
                alert('Storage upgrade request received! Your workspace quota has been expanded to 2 TB.');
                onClose();
              }}
              className="w-full py-2 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md flex items-center justify-center gap-1"
            >
              Upgrade to Scale <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
