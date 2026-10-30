import React from 'react';

interface OmniRAGLogoProps {
  /** Size variant or explicit pixel dimension */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to render the brand wordmark alongside the logo mark */
  showText?: boolean;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional badge text (e.g. 'Enterprise') */
  badge?: string;
  /** Extra container CSS classes */
  className?: string;
  /** Extra icon CSS classes */
  iconClassName?: string;
  /** Hover animation state */
  interactive?: boolean;
}

/**
 * OmniRAG Innovative Brand Mark
 * 
 * Concept:
 * - Four Multimodal Convergent Petals: Dense Vector Search, Sparse BM25, Multimodal Ingestion, Agentic Reasoning
 * - Quantum Vector Matrix (Hexagonal/Orbital Nexus)
 * - Radiant Core: Grounded Factual Synthesis (Zero Hallucination)
 */
export const OmniRAGIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
    >
      <defs>
        {/* Primary Radiant Gradient */}
        <linearGradient id="omni-primary-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="35%" stopColor="#6366F1" />
          <stop offset="70%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Secondary Cross Gradient */}
        <linearGradient id="omni-cross-grad" x1="44" y1="4" x2="4" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Central Core Radiant Spark */}
        <linearGradient id="omni-core-grad" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Soft Radial Ambient Glow */}
        <radialGradient id="omni-ambient-glow" cx="24" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>

        {/* High-fidelity drop glow filter */}
        <filter id="omni-glow-filter" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Glow */}
      <circle cx="24" cy="24" r="21" fill="url(#omni-ambient-glow)" />

      {/* Outer Orbital Vector Rings */}
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="url(#omni-primary-grad)"
        strokeWidth="1.25"
        strokeDasharray="2.5 3.5"
        strokeOpacity="0.55"
      />

      {/* Multimodal Cardinal Petal Nodes (Top: Ingestion, Right: Dense Vector, Bottom: Hybrid Fusion, Left: Grounded Reasoning) */}
      <g filter="url(#omni-glow-filter)">
        {/* Top-Bottom Resonant Petals */}
        <path
          d="M 24 5 C 19 5 15.5 10 15.5 16 C 15.5 21 19.5 24 24 24 C 28.5 24 32.5 21 32.5 16 C 32.5 10 29 5 24 5 Z"
          fill="url(#omni-primary-grad)"
          fillOpacity="0.78"
        />
        <path
          d="M 24 43 C 19 43 15.5 38 15.5 32 C 15.5 27 19.5 24 24 24 C 28.5 24 32.5 27 32.5 32 C 32.5 38 29 43 24 43 Z"
          fill="url(#omni-primary-grad)"
          fillOpacity="0.78"
        />

        {/* Left-Right Cross Petals */}
        <path
          d="M 5 24 C 5 19 10 15.5 16 15.5 C 21 15.5 24 19.5 24 24 C 24 28.5 21 32.5 16 32.5 C 10 32.5 5 29 5 24 Z"
          fill="url(#omni-cross-grad)"
          fillOpacity="0.78"
        />
        <path
          d="M 43 24 C 43 19 38 15.5 32 15.5 C 27 15.5 24 19.5 24 24 C 24 28.5 27 32.5 32 32.5 C 38 32.5 43 29 43 24 Z"
          fill="url(#omni-cross-grad)"
          fillOpacity="0.78"
        />
      </g>

      {/* Inner Geometric Lattice & Vector Bridges */}
      <polygon
        points="24,9 34.5,13.5 39,24 34.5,34.5 24,39 13.5,34.5 9,24 13.5,13.5"
        stroke="#FFFFFF"
        strokeOpacity="0.25"
        strokeWidth="1"
        fill="none"
      />

      {/* Diagonal Neural Crosslinks */}
      <line x1="13.5" y1="13.5" x2="34.5" y2="34.5" stroke="url(#omni-primary-grad)" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="34.5" y1="13.5" x2="13.5" y2="34.5" stroke="url(#omni-cross-grad)" strokeWidth="1" strokeOpacity="0.4" />

      {/* Central Radiant AI Nexus Star (Faceted 8-Point Grounding Spark) */}
      <path
        d="M 24 14 L 26.2 21.8 L 34 24 L 26.2 26.2 L 24 34 L 21.8 26.2 L 14 24 L 21.8 21.8 Z"
        fill="url(#omni-core-grad)"
        filter="url(#omni-glow-filter)"
      />

      {/* High-Luminance Micro Core Diamond */}
      <polygon
        points="24,19.5 27,24 24,28.5 21,24"
        fill="#FFFFFF"
      />

      {/* Outer Constellation Satellite Vector Nodes */}
      <circle cx="24" cy="5" r="2.2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="43" cy="24" r="2.2" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="24" cy="43" r="2.2" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="5" cy="24" r="2.2" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="0.8" />
    </svg>
  );
};

export const OmniRAGLogo: React.FC<OmniRAGLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  badge = 'Enterprise',
  className = '',
  iconClassName = '',
  interactive = true,
}) => {
  // Determine pixel size based on token or number
  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 60,
  };
  const iconPixel = typeof size === 'number' ? size : pixelSizes[size] || 40;

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Outer Bento Glass Capsule with Gradient Border */}
      <div
        className={`relative rounded-2xl bg-gradient-to-tr from-indigo-500/80 via-purple-500/70 to-cyan-400/80 p-[1.5px] shadow-lg shadow-indigo-600/25 ${
          interactive ? 'group-hover:shadow-indigo-500/50 group-hover:scale-105' : ''
        } transition-all duration-300`}
        style={{
          width: iconPixel + 8,
          height: iconPixel + 8,
        }}
      >
        <div
          className="w-full h-full rounded-[14px] flex items-center justify-center relative overflow-hidden backdrop-blur-md"
          style={{ background: 'var(--bg-card-solid, #0d1024)' }}
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/15 via-transparent to-cyan-400/15 pointer-events-none" />
          
          {/* Innovative SVG Logo */}
          <OmniRAGIcon size={iconPixel} className={iconClassName} />
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight t-primary flex items-center">
              <span>Omni</span>
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent ml-0.5">
                RAG
              </span>
            </span>
            {badge && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] t-muted font-medium tracking-normal mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OmniRAGLogo;
