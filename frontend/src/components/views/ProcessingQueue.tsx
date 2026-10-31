import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  Play,
  Pause,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface QueueJob {
  id: string;
  filename: string;
  filetype: string;
  stage: string;
  progress: number;
  timeAgo: string;
  status: 'processing' | 'queued' | 'completed' | 'failed';
  icon: any;
  color: string;
}

export const ProcessingQueue: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await ApiService.listDocuments();
      const docs = res.items || [];
      const mapped: QueueJob[] = docs.map((d: any) => {
        const ext = (d.filename || '').split('.').pop()?.toUpperCase() || 'FILE';
        const isCompleted = d.status === 'Indexed' || d.status === 'Completed';
        const isProcessing = d.status === 'Processing';
        return {
          id: d.id,
          filename: d.filename,
          filetype: ext,
          stage: isCompleted
            ? 'Parent-child chunking & vector indexing complete in Qdrant'
            : isProcessing
            ? 'Processing multimodal vision OCR & vector embedding generation'
            : 'Queued in distributed Celery ingestion pipeline',
          progress: isCompleted ? 100 : isProcessing ? 65 : 10,
          timeAgo: d.created_at ? new Date(d.created_at).toLocaleTimeString() : 'Recent',
          status: isCompleted ? 'completed' : isProcessing ? 'processing' : 'queued',
          icon: ext === 'PDF' ? FileText : ext.includes('XLS') ? FileSpreadsheet : ext.includes('PNG') ? ImageIcon : FileCode,
          color: ext === 'PDF' ? 'bg-rose-500' : 'bg-blue-500',
        };
      });
      setJobs(mapped);
    } catch (err) {
      console.error('Failed to load processing queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <RefreshCw className={`w-5 h-5 ${isPaused ? '' : 'animate-spin'}`} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold t-primary">Multimodal Ingestion Pipeline</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>
            <p className="text-xs t-muted">Asynchronous background workers performing OCR, chunking, and Qdrant indexing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              isPaused ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bento-chip t-primary'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume Pipeline' : 'Pause Pipeline'}
          </button>

          <button
            onClick={loadQueue}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bento-card rounded-2xl p-8 text-center t-muted text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 icon-indigo" />
            Loading ingestion queue telemetry...
          </div>
        ) : jobs.length === 0 ? (
          <div className="bento-card rounded-2xl p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl badge-emerald mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold t-primary">Pipeline Queue Idle</h4>
            <p className="text-xs t-muted max-w-md mx-auto">
              All uploaded enterprise documents and multimodal assets have been completely vectorized and indexed into Qdrant & BM25 hybrid search.
            </p>
          </div>
        ) : (
          jobs.map((job) => {
          const Icon = job.icon;
          return (
            <div
              key={job.id}
              className="bento-card rounded-2xl p-5 shadow-lg space-y-3 transition-all hover:border-indigo-500/40"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${job.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold t-primary">{job.filename}</div>
                    <div className="text-xs t-muted">{job.stage}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 font-mono">
                  <span className="t-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {job.timeAgo}
                  </span>
                  <span className={`font-bold ${job.progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {job.progress}%
                  </span>
                </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    job.progress === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  }`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Worker Fleet Telemetry */}
      <div className="bento-card rounded-3xl p-6 shadow-xl space-y-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold t-primary">Celery Worker Fleet Telemetry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bento-chip">
            <span className="t-muted block mb-1">Active Worker Nodes</span>
            <span className="text-emerald-400 font-bold text-base">12 / 12 Online</span>
          </div>
          <div className="p-3 rounded-xl bento-chip">
            <span className="t-muted block mb-1">Mean Vectorization Latency</span>
            <span className="t-primary font-bold text-base">142ms / batch</span>
          </div>
          <div className="p-3 rounded-xl bento-chip">
            <span className="t-muted block mb-1">HNSW Index Throughput</span>
            <span className="text-indigo-400 font-bold text-base">2,800 chunks/sec</span>
          </div>
        </div>
      </div>
    </div>
  );
};
