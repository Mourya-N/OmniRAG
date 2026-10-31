import React, { useState } from 'react';
import {
  Share2,
  Search,
  ZoomIn,
  ZoomOut,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface GraphNode {
  id: string;
  label: string;
  category: 'document' | 'entity' | 'concept' | 'tech';
  x: number;
  y: number;
  connections: number;
  summary: string;
  sourceDoc?: string;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export const KnowledgeGraph: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);

  const initialNodes: GraphNode[] = [
    {
      id: 'doc-q3',
      label: 'Q3 Financial Report',
      category: 'document',
      x: 320,
      y: 180,
      connections: 4,
      summary: 'Executive earnings and revenue metrics covering subscription ARR and net retention.',
      sourceDoc: 'Q3_Financial_Report_2024.pdf',
    },
    {
      id: 'ent-arr',
      label: 'Cloud ARR ($42.3M)',
      category: 'entity',
      x: 210,
      y: 290,
      connections: 3,
      summary: 'Annual Recurring Revenue metric demonstrating 14.8% YoY expansion.',
      sourceDoc: 'Q3_Financial_Report_2024.pdf',
    },
    {
      id: 'ent-qdrant',
      label: 'Qdrant Vector DB',
      category: 'tech',
      x: 520,
      y: 190,
      connections: 5,
      summary: 'High-performance vector database hosting dense HNSW embeddings with FP8 quantization.',
      sourceDoc: 'System_Design_Diagrams.pdf',
    },
    {
      id: 'doc-arch',
      label: 'System Architecture',
      category: 'document',
      x: 480,
      y: 330,
      connections: 4,
      summary: 'Microservices, message queues, and zero-trust authentication boundary specs.',
      sourceDoc: 'Product_Architecture_Guide.docx',
    },
    {
      id: 'con-rrf',
      label: 'Reciprocal Rank Fusion',
      category: 'concept',
      x: 650,
      y: 270,
      connections: 3,
      summary: 'Rank fusion algorithm combining dense vector distances with sparse BM25 token frequencies.',
      sourceDoc: 'Product_Architecture_Guide.docx',
    },
    {
      id: 'ent-bm25',
      label: 'BM25 Sparse Engine',
      category: 'tech',
      x: 690,
      y: 140,
      connections: 2,
      summary: 'Exact lexical keyword search engine with BM25 Okapi scoring.',
      sourceDoc: 'Product_Architecture_Guide.docx',
    },
    {
      id: 'con-soc2',
      label: 'SOC 2 Type II',
      category: 'concept',
      x: 370,
      y: 430,
      connections: 2,
      summary: 'Enterprise security certification validating access control, encryption, and auditability.',
      sourceDoc: 'Enterprise_Security_Whitepaper.pdf',
    },
    {
      id: 'ent-gemini',
      label: 'Gemini 1.5 Pro',
      category: 'tech',
      x: 180,
      y: 130,
      connections: 3,
      summary: 'Multimodal LLM orchestrating image, audio, and cross-document reasoning.',
      sourceDoc: 'Model_Catalog.md',
    },
  ];

  const links: GraphLink[] = [
    { source: 'doc-q3', target: 'ent-arr', relation: 'reports' },
    { source: 'doc-q3', target: 'ent-gemini', relation: 'analyzed_by' },
    { source: 'doc-arch', target: 'ent-qdrant', relation: 'indexes_with' },
    { source: 'doc-arch', target: 'con-soc2', relation: 'certified_under' },
    { source: 'ent-qdrant', target: 'con-rrf', relation: 'hybrid_retrieval' },
    { source: 'ent-bm25', target: 'con-rrf', relation: 'fused_with' },
    { source: 'ent-qdrant', target: 'doc-q3', relation: 'vectorizes' },
    { source: 'doc-arch', target: 'con-rrf', relation: 'implements' },
  ];

  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    document: { bg: '#3b82f6', border: '#60a5fa', text: '#ffffff' },
    entity: { bg: '#10b981', border: '#34d399', text: '#ffffff' },
    concept: { bg: '#8b5cf6', border: '#a78bfa', text: '#ffffff' },
    tech: { bg: '#f59e0b', border: '#fbbf24', text: '#ffffff' },
  };

  const filteredNodes = initialNodes.filter((node) => {
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    const matchesSearch =
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Bar */}
      <div
        className="bento-card rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold t-primary">Enterprise Knowledge Graph</h2>
            <p className="text-xs t-muted">Cross-document entity relations, ontology links, and concept clusters</p>
          </div>
        </div>

        {/* Filter categories & search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 t-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entities or topics..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl glass-input w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            {['all', 'document', 'entity', 'concept', 'tech'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 't-muted hover:t-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
              className="p-1.5 rounded-lg bento-chip hover:t-primary t-muted"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.7))}
              className="p-1.5 rounded-lg bento-chip hover:t-primary t-muted"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg bento-chip hover:t-primary t-muted text-xs font-mono"
              title="Reset"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Graph Canvas (8 cols) */}
        <div
          className="lg:col-span-8 bento-card rounded-3xl p-4 shadow-2xl relative overflow-hidden h-[540px] flex items-center justify-center select-none"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox="0 0 850 500"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Draw Links */}
            {links.map((link, idx) => {
              const srcNode = initialNodes.find((n) => n.id === link.source);
              const tgtNode = initialNodes.find((n) => n.id === link.target);
              if (!srcNode || !tgtNode) return null;

              const isHighlighted =
                selectedNode && (selectedNode.id === srcNode.id || selectedNode.id === tgtNode.id);

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isHighlighted ? '#6366f1' : dark ? '#334155' : '#cbd5e1'}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    opacity={isHighlighted ? 0.9 : 0.6}
                  />
                  {/* Relation label */}
                  <text
                    x={(srcNode.x + tgtNode.x) / 2}
                    y={(srcNode.y + tgtNode.y) / 2 - 4}
                    fill={isHighlighted ? '#818cf8' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {link.relation}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const col = categoryColors[node.category] || categoryColors.entity;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse circle for selected */}
                  {isSelected && (
                    <circle r="34" fill={col.bg} opacity="0.25" className="animate-ping" />
                  )}
                  {/* Main Node circle */}
                  <circle
                    r={isSelected ? 26 : 22}
                    fill={dark ? '#111827' : '#ffffff'}
                    stroke={isSelected ? '#6366f1' : col.border}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200 group-hover:scale-110"
                  />
                  {/* Center pip */}
                  <circle r="6" fill={col.bg} />
                  {/* Node Label */}
                  <text
                    y="36"
                    textAnchor="middle"
                    fill={dark ? '#e2e8f0' : '#1e293b'}
                    fontSize="11"
                    fontWeight={isSelected ? 'bold' : '500'}
                  >
                    {node.label}
                  </text>
                  <text
                    y="47"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {node.category.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating hint */}
          <div className="absolute bottom-3 left-4 text-[11px] t-muted">
            Click any node to inspect relationship graph and source citations
          </div>
        </div>

        {/* Node Inspector Drawer (4 cols) */}
        <div
          className="lg:col-span-4 bento-card rounded-3xl p-6 shadow-xl flex flex-col justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full badge-indigo">
                  {selectedNode.category}
                </span>
                <span className="text-xs t-muted font-mono">{selectedNode.connections} Connections</span>
              </div>

              <div>
                <h3 className="text-lg font-bold t-primary">{selectedNode.label}</h3>
                <p className="text-xs t-secondary mt-1.5 leading-relaxed">{selectedNode.summary}</p>
              </div>

              {selectedNode.sourceDoc && (
                <div className="p-3 rounded-2xl bento-chip space-y-1">
                  <div className="text-[11px] t-muted flex items-center gap-1 font-semibold">
                    <FileText className="w-3.5 h-3.5 icon-indigo" /> Source Document
                  </div>
                  <div className="text-xs font-mono t-primary truncate">{selectedNode.sourceDoc}</div>
                </div>
              )}

              {/* Connected Neighbors */}
              <div>
                <div className="text-xs font-semibold t-muted uppercase tracking-wider mb-2">Connected Entities</div>
                <div className="space-y-1.5">
                  {links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l, i) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const otherNode = initialNodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={i}
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className="p-2 rounded-xl border border-transparent hover:border-indigo-500/30 bento-chip text-xs flex items-center justify-between cursor-pointer"
                        >
                          <span className="t-primary font-medium">{otherNode?.label || otherId}</span>
                          <span className="text-[10px] font-mono badge-cyan px-1.5 py-0.5 rounded">
                            {l.relation}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="font-semibold text-sm t-primary">Select a Node to Inspect</div>
              <p className="text-xs t-muted max-w-xs">
                Explore cross-document relationships, semantic linkages, and authoritative evidence sources.
              </p>
            </div>
          )}

          <div className="pt-4 border-t text-xs t-muted flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span>Graph Entities: 8</span>
            <span>Active Relations: 8</span>
          </div>
        </div>
      </div>
    </div>
  );
};
