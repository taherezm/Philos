// Taxonomy Roadmap — visual winding trail from easiest to hardest philosophy texts

import { useState, useRef, useMemo } from "react";
import { ROADMAP_TIERS, type RoadmapStop } from "./roadmapData";

interface RoadmapProps {
  completedTextIds: Set<string>;
  currentTextId: string | null;
  onSelectText: (catalogId: string) => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}

type NodeState = "completed" | "current" | "available" | "locked";

function getNodeState(stop: RoadmapStop, completedTextIds: Set<string>, currentTextId: string | null, allStops: RoadmapStop[]): NodeState {
  if (completedTextIds.has(stop.catalogId)) return "completed";
  if (stop.catalogId === currentTextId) return "current";
  // First stop is always available
  const idx = allStops.findIndex((s) => s.id === stop.id);
  if (idx === 0) return "available";
  // Available if previous stop is completed
  const prev = allStops[idx - 1];
  if (prev && completedTextIds.has(prev.catalogId)) return "available";
  return "locked";
}

export function TaxonomyRoadmap({ completedTextIds, currentTextId, onSelectText, darkMode, text, textMuted, textFaint, cardBg, border }: RoadmapProps) {
  const [selectedStop, setSelectedStop] = useState<RoadmapStop | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allStops = useMemo(() => ROADMAP_TIERS.flatMap((t) => t.stops), []);
  const completedCount = allStops.filter((s) => completedTextIds.has(s.catalogId)).length;

  return (
    <div ref={containerRef} className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
      {/* Header */}
      <h1 className={`text-2xl font-semibold ${text} mb-2`} style={{ fontFamily: "var(--font-serif)" }}>
        Philosophy Roadmap
      </h1>
      <p className={`text-sm ${textMuted} mb-2`}>
        A guided journey from accessible entry points to advanced explorations.
      </p>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-10">
        <div className={`flex-1 h-2 rounded-full ${darkMode ? "bg-[#333]" : "bg-cream-darker/40"}`}>
          <div
            className="h-2 rounded-full bg-terracotta transition-[width] duration-700 ease-out"
            style={{ width: `${(completedCount / allStops.length) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${textMuted}`}>{completedCount}/{allStops.length}</span>
      </div>

      {/* Tiers */}
      {ROADMAP_TIERS.map((tier, tierIdx) => (
        <div key={tier.tier}>
          {/* Tier header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-terracotta">Tier {tier.tier}</span>
              <div className={`flex-1 h-px ${darkMode ? "bg-[#333]" : "bg-cream-darker"}`} />
            </div>
            <h2 className={`text-lg font-semibold ${text}`} style={{ fontFamily: "var(--font-serif)" }}>
              {tier.name}
            </h2>
            <p className={`text-xs ${textFaint}`}>{tier.subtitle}</p>
          </div>

          {/* Stops — winding trail */}
          <div className="relative pl-8 pb-4">
            {/* Vertical trail line */}
            <div
              className={`absolute left-[15px] top-0 bottom-0 w-[2px] ${darkMode ? "bg-[#333]" : "bg-cream-darker"}`}
            />

            {tier.stops.map((stop, stopIdx) => {
              const state = getNodeState(stop, completedTextIds, currentTextId, allStops);
              return (
                <div
                  key={stop.id}
                  data-stop-id={stop.id}
                  className="relative mb-8 last:mb-0"
                >
                  {/* Node dot */}
                  <div className="absolute -left-8 top-3 flex items-center justify-center">
                    <div
                      className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        state === "completed"
                          ? "bg-terracotta border-terracotta"
                          : state === "current"
                            ? "bg-terracotta/20 border-terracotta roadmap-pulse"
                            : state === "available"
                              ? `${darkMode ? "bg-[#2a2a2a]" : "bg-white"} border-terracotta/50`
                              : `${darkMode ? "bg-[#222]" : "bg-cream-dark"} ${darkMode ? "border-[#444]" : "border-cream-darker"}`
                      }`}
                    >
                      {state === "completed" ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
                          <path d="M3.5 8l3 3 6-6" />
                        </svg>
                      ) : state === "current" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                      ) : state === "available" ? (
                        <div className="w-2 h-2 rounded-full bg-terracotta/50" />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={darkMode ? "#555" : "#aaa"} strokeWidth="1.5">
                          <rect x="4" y="2" width="8" height="11" rx="1.5" />
                          <path d="M6 2V1a2 2 0 0 1 4 0v1" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => {
                      if (state === "locked") return;
                      setSelectedStop(selectedStop?.id === stop.id ? null : stop);
                    }}
                    disabled={state === "locked"}
                    className={`w-full text-left rounded-xl p-4 border ${
                      state === "locked"
                        ? `${darkMode ? "bg-[#1e1e1e] border-[#2a2a2a]" : "bg-cream-dark/20 border-cream-darker/30"} opacity-50 cursor-not-allowed`
                        : selectedStop?.id === stop.id
                          ? `${darkMode ? "bg-[#2a2725]" : "bg-white"} border-terracotta/40 shadow-sm cursor-pointer`
                          : `card-interactive ${cardBg} ${border} cursor-pointer`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${state === "locked" ? textFaint : text} mb-0.5`} style={{ fontFamily: "var(--font-serif)" }}>
                          {stop.title}
                        </p>
                        <p className={`text-xs ${textFaint}`}>{stop.author}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <span className={`text-xs ${textFaint}`}>{stop.estimatedMinutes}m</span>
                        {state === "completed" && (
                          <span className="text-xs font-medium text-terracotta">Done</span>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs ${state === "locked" ? textFaint : textMuted} mt-2 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
                      {stop.hook}
                    </p>
                  </button>

                  {/* Expanded detail card */}
                  {selectedStop?.id === stop.id && state !== "locked" && (
                    <div className={`mt-2 rounded-xl p-4 border ${border} ${darkMode ? "bg-[#242424]" : "bg-white"} animate-[expandDown_220ms_var(--ease-out)]`}>
                      <p className={`text-sm ${text} leading-relaxed mb-4`} style={{ fontFamily: "var(--font-serif)" }}>
                        {stop.why}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectText(stop.catalogId);
                        }}
                        className="btn-primary px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors"
                      >
                        {state === "completed" ? "Read Again" : state === "current" ? "Continue Reading" : "Start Reading"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tier transition text */}
          {tier.transitionText && tierIdx < ROADMAP_TIERS.length - 1 && (
            <div className="flex items-center gap-4 my-10">
              <div className={`flex-1 h-px ${darkMode ? "bg-[#333]" : "bg-cream-darker"}`} />
              <p className={`text-xs ${textFaint} text-center max-w-xs italic`} style={{ fontFamily: "var(--font-serif)" }}>
                {tier.transitionText}
              </p>
              <div className={`flex-1 h-px ${darkMode ? "bg-[#333]" : "bg-cream-darker"}`} />
            </div>
          )}
        </div>
      ))}

      {/* Completion message */}
      {completedCount === allStops.length && (
        <div className={`mt-10 text-center p-6 ${cardBg} rounded-2xl border ${border}`}>
          <div className="text-3xl mb-3">🏛️</div>
          <h3 className={`text-lg font-semibold ${text} mb-2`} style={{ fontFamily: "var(--font-serif)" }}>
            Journey Complete
          </h3>
          <p className={`text-sm ${textMuted}`}>
            You've explored the full roadmap — from first questions to the deepest inquiries. The library is always open for revisiting.
          </p>
        </div>
      )}
    </div>
  );
}
