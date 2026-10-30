import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { DocumentItem } from '../types';

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const data = await ApiService.listDocuments();
      setDocuments(data.items || []);
    } catch {
      // Fallback local state if backend not running in browser preview
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatusMessage('Uploading and validating MIME magic bytes...');

    try {
      await ApiService.uploadDocument(files[0]);
      setStatusMessage('Document uploaded. Asynchronous parsing and chunking queued.');
      await fetchDocs();
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bento-card rounded-3xl p-6 shadow-2xl" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold t-primary mb-1">Multimodal Document Ingestion</h2>
        <p className="text-xs t-muted mb-6">
          Upload PDF, DOCX, PPTX, XLSX, CSV, Markdown, or Code documents. All files are verified with SHA-256 deduplication and segmented into hierarchical parent-child vector chunks.
        </p>

        <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bento-chip group">
          <Upload className="h-9 w-9 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold t-primary">Click to upload or drag and drop</span>
          <span className="text-xs t-muted mt-1">PDF, DOCX, PPTX, XLSX, CSV, MD up to 100MB</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.docx,.pptx,.xlsx,.csv,.md,.txt,.py"
          />
        </label>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      <div className="bento-card rounded-3xl p-6 shadow-2xl" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium t-primary">Ingested Document Assets</h3>
          <button
            onClick={fetchDocs}
            className="text-xs t-muted hover:t-primary flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 t-muted text-sm">
            No documents ingested yet. Upload files above to index into Qdrant & BM25.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {documents.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <div>
                    <div className="font-medium text-slate-200">{doc.filename}</div>
                    <div className="text-xs text-slate-500">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB • SHA-256: {doc.sha256_checksum.slice(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

