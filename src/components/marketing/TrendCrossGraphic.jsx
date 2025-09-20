import React from "react";

export default function TrendCrossGraphic({ className = "" }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <svg
        viewBox="0 0 800 540"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="title desc"
        className="w-full h-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] rounded-xl border border-white/10"
      >
        <title id="title">LLMs rising while traditional SEO declines</title>
        <desc id="desc">
          A chart with two crossing trend lines: LLMs rising upward and SEO trending
          downward over time.
        </desc>

        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="100%" stopColor="#0b1220" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="llmGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="seoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <marker id="arrowUp" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <path d="M0,0 L12,6 L0,12 z" fill="#10b981" />
          </marker>
          <marker id="arrowDown" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <path d="M0,0 L12,6 L0,12 z" fill="#ef4444" />
          </marker>
        </defs>

        <rect x="0" y="0" width="800" height="540" fill="url(#bgGrad)" rx="16" />

        {/* Grid */}
        <g opacity="0.18">
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={80 + i * 80}
              y1="60"
              x2={80 + i * 80}
              y2="480"
              stroke="white"
              strokeOpacity="0.15"
            />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="80"
              y1={60 + i * 70}
              x2="720"
              y2={60 + i * 70}
              stroke="white"
              strokeOpacity="0.15"
            />
          ))}
        </g>

        {/* Axes */}
        <line x1="80" y1="480" x2="720" y2="480" stroke="white" strokeOpacity="0.35" />
        <line x1="80" y1="480" x2="80" y2="60" stroke="white" strokeOpacity="0.35" />

        {/* LLMs up-trend */}
        <path
          d="M100,430 C200,400 260,360 330,320 C420,265 510,220 620,160"
          fill="none"
          stroke="url(#llmGrad)"
          strokeWidth="5"
          markerEnd="url(#arrowUp)"
          filter="url(#shadow)"
        />
        {/* SEO down-trend */}
        <path
          d="M100,150 C210,200 290,245 380,300 C470,350 560,390 700,430"
          fill="none"
          stroke="url(#seoGrad)"
          strokeWidth="5"
          markerEnd="url(#arrowDown)"
        />

        {/* Labels */}
        <text x="640" y="150" fill="#86efac" fontSize="18" fontWeight="700">
          LLMs
        </text>
        <text x="710" y="450" fill="#fca5a5" fontSize="18" fontWeight="700" textAnchor="end">
          SEO
        </text>
        <text x="720" y="508" fill="white" opacity="0.6" fontSize="12" textAnchor="end">
          Time
        </text>
        <text
          x="46"
          y="76"
          fill="white"
          opacity="0.6"
          fontSize="12"
          textAnchor="start"
          transform="rotate(-90 46,76)"
        >
          Visibility
        </text>
      </svg>
    </div>
  );
}