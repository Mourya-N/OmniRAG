import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface TrashItem {
  id: string;
  filename: string;
  deletedBy: string;
  deletedAt: string;
  daysRemaining: number;
  size: string;
}

export const TrashView: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRestore = (id: string, name: string) => {
    setItems(items.filter((item) => item.id !== id));
    setStatusMessage(`Restored "${name}" back to active document index.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handlePermanentDelete = (id: string, name: string) => {
    if (confirm(`Permanently purge "${name}" and all associated Qdrant vector chunks? This cannot be undone.`)) {
      setItems(items.filter((item) => item.id !== id));
      setStatusMessage(`Permanently purged "${name}". Vector embeddings destroyed.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Permanently purge ALL items in Trash? All associated embeddings and text chunks will be deleted.')) {
      setItems([]);
      setStatusMessage('Trash emptied successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="bento-card rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold t-primary">Trash & Retention Management</h2>
            <p className="text-xs t-muted">Soft-deleted enterprise documents. Items are permanently purged after 30 days retention.</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Empty Trash
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl badge-emerald text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {statusMessage}
        </div>
      )}

      {/* Trash list */}
      <div className="bento-card rounded-3xl p-6 shadow-xl overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {items.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Trash2 className="w-10 h-10 t-muted mx-auto opacity-50" />
            <div className="text-sm font-semibold t-primary">Trash is completely empty</div>
            <div className="text-xs t-muted">No deleted documents pending permanent purging.</div>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-muted uppercase font-mono text-[10px]" style={{ borderColor: 'var(--border)' }}>
                <th className="pb-3 font-semibold">Document Asset</th>
                <th className="pb-3 font-semibold">Deleted By</th>
                <th className="pb-3 font-semibold">Deleted When</th>
                <th className="pb-3 font-semibold">Retention Left</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-medium t-primary flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="truncate max-w-xs">{item.filename}</div>
                      <div className="text-[10px] t-muted font-mono">{item.size}</div>
                    </div>
                  </td>
                  <td className="py-3.5 t-secondary">{item.deletedBy}</td>
                  <td className="py-3.5 t-muted font-mono">{item.deletedAt}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold badge-amber flex items-center gap-1 w-fit">
                      <Clock className="w-3 h-3" /> {item.daysRemaining} days left
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleRestore(item.id, item.filename)}
                      className="px-2.5 py-1 rounded-lg bento-chip text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors font-medium text-[11px] inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id, item.filename)}
                      className="px-2.5 py-1 rounded-lg bento-chip text-rose-400 hover:text-white hover:bg-rose-600 transition-colors font-medium text-[11px] inline-flex items-center gap-1"
                    >
                      Purge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
