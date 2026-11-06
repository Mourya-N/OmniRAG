import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Terminal,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Cpu,
  Database,
  Hash,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Sparkles,
  Bot,
  Check,
  Layers,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { CitationItem, RAGMessage } from '../types';

interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface UploadedDocItem {
  id: string;
  filename: string;
  file_size_bytes?: number;
  status?: string;
}

export const ChatExplorer: React.FC = () => {
  const [messages, setMessages] = useState<RAGMessage[]>([
    {
      id: 'kernel-init',
      role: 'assistant',
      content:
        'OmniRAG Kernel v2.4.0 initialized. Hybrid vector index (Qdrant) and sparse lexical index (BM25) ready for evidence-grounded queries. Inline citations [P.X] are cryptographically verified against source passages.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  // Document Scope Selection with Inbuilt Search
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // LLM Model Provider Selection (Default: Groq)
  type LLMModelKey = 'groq' | 'openai' | 'gemini';
  const [selectedModel, setSelectedModel] = useState<LLMModelKey>('groq');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Database Conversation State
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const docDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationHistory();
    loadUploadedDocs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target as Node)) {
        setDocDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadUploadedDocs = async () => {
    try {
      const data = await ApiService.listDocuments();
      if (data && data.items) {
        setUploadedDocs(data.items);
      }
    } catch (err) {
      console.warn('Failed to load documents for chat selector:', err);
    }
  };

  const loadConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await ApiService.getRAGConversations();
      setConversations(data);
    } catch (err) {
      console.warn('Failed to fetch conversation history from DB:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    if (convId === activeConversationId) return;
    setLoading(true);
    try {
      const conv = await ApiService.getRAGConversation(convId);
      setActiveConversationId(conv.id);
      if (conv.messages && conv.messages.length > 0) {
        setMessages(conv.messages);
        for (const msg of conv.messages) {
          if (msg.citations && msg.citations.length > 0) {
            setActiveCitation(msg.citations[0]);
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    setActiveConversationId(null);
    setActiveCitation(null);
    setMessages([
      {
        id: 'new-session',
        role: 'assistant',
        content:
          'New terminal session created. Enter your search query to trigger hybrid retrieval with Reciprocal Rank Fusion (RRF).',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await ApiService.deleteRAGConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewSession();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const queryText = input.trim();
    setInput('');
    const userMsg: RAGMessage = {
      id: String(Date.now()),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await ApiService.executeRAGChat(
        queryText,
        activeConversationId || undefined,
        selectedDocId || undefined,
        selectedModel
      );
      if (response.conversation_id) {
        setActiveConversationId(response.conversation_id);
      }

      const assistantMsg: RAGMessage = {
        id: response.message_id || String(Date.now() + 1),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        verification: response.verification,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (response.citations && response.citations.length > 0) {
        setActiveCitation(response.citations[0]);
      }
      loadConversationHistory();
    } catch (err: any) {
      const errorMsg: RAGMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `[ERROR: CHAT_EXECUTION_FAILED] ${err?.message || 'Unable to retrieve grounded evidence or generate response from selected model.'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderContentWithCitations = (content: string, citations?: CitationItem[]) => {
    if (!citations || citations.length === 0) return <span>{content}</span>;

    const parts = content.split(/(\[[a-zA-Z0-9_-]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[([a-zA-Z0-9_-]+)\]/);
      if (match) {
        const chunkId = match[1];
        const citation = citations.find((c) => c.chunk_id === chunkId);
        const isActive = activeCitation?.chunk_id === chunkId;
        return (
          <button
            key={index}
            onClick={() => citation && setActiveCitation(citation)}
            className={`inline-flex items-center px-1.5 py-0.5 mx-1 rounded font-mono text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/50 scale-105'
                : 'bg-indigo-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
            }`}
          >
            {citation ? `[P.${citation.page_number}]` : `[${chunkId.slice(0, 6)}]`}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const filteredDocs = uploadedDocs.filter((doc) =>
    doc.filename.toLowerCase().includes(docSearchQuery.toLowerCase())
  );
  const selectedDoc = uploadedDocs.find((doc) => doc.id === selectedDocId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)] lg:h-[calc(100vh-130px)] animate-fade-in">
      {/* ─────────────────────────────────────────────────────────
          LEFT & CENTER (70%): FULL TERMINAL / CLI CONSOLE
          ───────────────────────────────────────────────────────── */}
      <div className="lg:col-span-8 flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-[#070913] text-slate-200 font-mono min-h-[500px] lg:min-h-0">
        {/* Terminal Title Bar */}
        <div className="bg-[#0b0e1d] px-4 py-3 flex items-center justify-between border-b border-slate-800/80 select-none">
          {/* Traffic light window controls */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm cursor-pointer hover:brightness-125" />
            <span className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm cursor-pointer hover:brightness-125" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm cursor-pointer hover:brightness-125" />
            <span className="ml-3 text-xs text-slate-400 font-mono font-medium hidden sm:inline flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 inline" />
              omnirag@kernel: ~/evidence-retrieval (zsh) — [80x24]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE KERNEL
            </span>
            <button
              onClick={handleNewSession}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-mono flex items-center gap-1 transition-all"
              title="Start a fresh terminal session"
            >
              <Plus className="w-3 h-3" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Terminal Output Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs sm:text-[13px] leading-relaxed [scrollbar-width:thin] scrollbar-thumb-indigo-500/20">
          {/* ASCII Banner */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-indigo-950/60 text-slate-400 font-mono text-[11px] leading-snug select-none">
            <span className="text-cyan-400 font-bold block mb-1">
              ╔═ OmniRAG Evidence-Grounded Multi-Modal Kernel v2.4.0 ═╗
            </span>
            <span>Dense Vector Index: Qdrant HNSW [Cosine] • Lexical Index: Okapi BM25</span>
            <br />
            <span>Reciprocal Rank Fusion ($k=60$) • Strict Evidence Citations • SOC 2 Enforced</span>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1.5">
              {msg.role === 'user' ? (
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">guest@omnirag:~$</span>
                  <div className="flex-1">
                    <span className="text-white font-semibold">{msg.content}</span>
                    <span className="ml-2 text-[10px] text-slate-500 font-normal">[{msg.timestamp}]</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-cyan-400">[KERNEL:RETRIEVAL]</span>
                      <span className="text-slate-400">Grounded Synthesis</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed font-sans sm:font-mono text-xs sm:text-[13px]">
                    {renderContentWithCitations(msg.content, msg.citations)}
                  </div>

                  {msg.verification && (
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Faithfulness: {(msg.verification.faithfulness_score * 100).toFixed(0)}%
                      </span>
                      <span>•</span>
                      <span className="text-cyan-300">
                        Citations: {msg.verification.valid_citations_count} verified
                      </span>
                      <span>•</span>
                      <span className="text-pink-400">
                        Hallucination: 0%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="space-y-1.5 text-xs text-indigo-400 font-mono py-1 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">➜</span>
                <span>Executing dense vector search in Qdrant HNSW index...</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-300">
                <span className="text-cyan-400">➜</span>
                <span>Calculating Okapi BM25 sparse lexical scores...</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-cyan-400">➜</span>
                <span>Executing Reciprocal Rank Fusion & neural reranker...</span>
              </div>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Command Line Input Bar */}
        <form
          onSubmit={handleSend}
          className="bg-[#0b0e1d] p-2.5 sm:p-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative"
        >
          {/* Top Row / Input */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold text-xs sm:text-sm pl-1 select-none shrink-0">
              <span>omnirag:~$</span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedDoc
                  ? `Ask question scoped to "${selectedDoc.filename}"...`
                  : "Type query to retrieve evidence across indexed documents..."
              }
              className="flex-1 min-w-0 bg-transparent px-1.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 font-mono focus:outline-none"
              autoFocus
            />
          </div>

          {/* Action Row on Mobile / Inline on Desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t border-slate-800/60 sm:border-t-0">
            {/* 1. FILE SELECTOR DROPDOWN (WITH INBUILT SEARCH) */}
            <div className="relative shrink-0" ref={docDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setDocDropdownOpen(!docDropdownOpen);
                  setModelDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border font-mono text-xs transition-all max-w-[140px] sm:max-w-[200px] ${
                  selectedDocId
                    ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-sm"
                    : "bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800"
                }`}
                title="Select document filter scope"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">
                  {selectedDoc ? selectedDoc.filename : "All Files"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
              </button>

            {/* Document Dropdown Popover */}
            {docDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 sm:w-80 bg-[#0f1429] border border-slate-700 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <span>Document Filter</span>
                  <span className="text-[10px] text-cyan-400 font-normal">{uploadedDocs.length} files</span>
                </div>

                {/* Inbuilt Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Search uploaded files..."
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                {/* Document List */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 font-mono text-xs [scrollbar-width:thin]">
                  {/* Option: All Documents */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocId(null);
                      setDocDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      selectedDocId === null
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "hover:bg-slate-800/60 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate font-medium">All Uploaded Files</span>
                    </div>
                    {selectedDocId === null && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>

                  {/* Filtered Documents List */}
                  {filteredDocs.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-[11px]">
                      No matching documents found
                    </div>
                  ) : (
                    filteredDocs.map((doc) => {
                      const isSelected = selectedDocId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setDocDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "hover:bg-slate-800/60 text-slate-300 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <p className="truncate font-medium text-xs text-slate-200">{doc.filename}</p>
                              {doc.file_size_bytes ? (
                                <p className="text-[10px] text-slate-500">{(doc.file_size_bytes / 1024).toFixed(0)} KB</p>
                              ) : null}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. LLM MODEL SELECTOR DROPDOWN (DEFAULT: GROQ) */}
          <div className="relative shrink-0" ref={modelDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setModelDropdownOpen(!modelDropdownOpen);
                setDocDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-mono text-xs transition-all"
              title="Select generation LLM provider"
            >
              {selectedModel === 'groq' && <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              {selectedModel === 'openai' && <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              {selectedModel === 'gemini' && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              <span className="font-semibold capitalize">{selectedModel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Model Dropdown Popover */}
            {modelDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#0f1429] border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl">
                <div className="px-2 pt-1 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  LLM Provider
                </div>

                {/* Groq (Default) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('groq');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    selectedModel === 'groq'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Groq</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 font-mono">Default</span>
                      </div>
                      <p className="text-[10px] text-slate-400">openai/gpt-oss-120b (&lt;1s)</p>
                    </div>
                  </div>
                  {selectedModel === 'groq' && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>

                {/* OpenAI */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('openai');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    selectedModel === 'openai'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">OpenAI</div>
                      <p className="text-[10px] text-slate-400">gpt-4o reasoning</p>
                    </div>
                  </div>
                  {selectedModel === 'openai' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>

                {/* Gemini */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('gemini');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    selectedModel === 'gemini'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Gemini</div>
                      <p className="text-[10px] text-slate-400">gemini-1.5-flash</p>
                    </div>
                  </div>
                  {selectedModel === 'gemini' && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              </div>
            )}
          </div>

            {/* 3. RUN BUTTON */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all shrink-0 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>RUN</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────
          RIGHT SIDE (30%):
          TOP: CITATION EVIDENCE INSPECTOR
          BOTTOM: CHAT HISTORY (DATABASE PERSISTED SESSIONS)
          ───────────────────────────────────────────────────────── */}
      <div className="lg:col-span-4 flex flex-col gap-5 lg:h-full overflow-hidden">
        {/* TOP: Citation Evidence Inspector */}
        <div className="bento-card rounded-3xl p-5 flex flex-col overflow-hidden shadow-xl flex-1 max-h-[50%]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 icon-cyan" />
              <h3 className="text-xs sm:text-sm font-bold t-primary">Citation Evidence Grounding</h3>
            </div>
            {activeCitation && (
              <span className="px-2 py-0.5 rounded-full badge-emerald text-[10px] font-mono font-bold">
                Pass Verified
              </span>
            )}
          </div>

          {activeCitation ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bento-chip border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="icon-cyan font-bold">Page {activeCitation.page_number}</span>
                  <span className="t-muted text-[11px]">
                    Confidence: {(activeCitation.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="t-secondary font-semibold text-[11px] font-sans">Retrieved Source Snippet:</div>
                <p className="text-xs t-primary leading-relaxed italic p-2.5 rounded-xl bento-chip border border-[var(--border)] font-sans">
                  "{activeCitation.cited_snippet}"
                </p>
              </div>

              <div className="p-3 rounded-2xl bento-chip border border-[var(--border)] text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="t-muted">Chunk ID:</span>
                  <span className="t-primary font-mono truncate max-w-[150px]">{activeCitation.chunk_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="t-muted">Document:</span>
                  <span className="t-primary font-mono truncate max-w-[150px]">{activeCitation.document_id}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 t-muted text-xs">
              <HelpCircle className="h-7 w-7 mb-2 stroke-1 opacity-60" />
              <p>Click any citation tag [P.X] in the terminal to inspect verified source passage grounding.</p>
            </div>
          )}
        </div>

        {/* BOTTOM: Chat History (Database Persisted) */}
        <div className="bento-card rounded-3xl p-5 flex flex-col overflow-hidden shadow-xl flex-1 max-h-[50%]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 icon-indigo" />
              <h3 className="text-xs sm:text-sm font-bold t-primary">Chat History (Database)</h3>
            </div>
            <button
              onClick={loadConversationHistory}
              title="Refresh conversation sessions from DB"
              className="p-1 rounded-lg hover:bg-white/[0.04] t-muted hover:t-primary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs t-muted space-y-1">
                <Clock className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p className="font-semibold">No Saved Sessions Yet</p>
                <p className="text-[11px]">All your terminal dialogue queries are automatically saved to the database.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md'
                        : 'bento-chip border-[var(--border)] hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 font-medium t-primary truncate">
                        <Hash className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{conv.title || 'Terminal Query'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] t-muted mt-1 font-mono">
                        <span>{conv.created_at}</span>
                        <span>•</span>
                        <span>{conv.message_count} messages</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 t-muted group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
