// Inline Visual Aids — embedded between reading paragraphs

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  VisualPlacement,
  SpectrumData,
  ArgumentMapData,
  AnalogyData,
  ArgMapNode,
} from "./visualPlacements";

// ============================================================
//  InlineVisualWrapper — collapse/expand container
// ============================================================

interface WrapperProps {
  visual: VisualPlacement;
  darkMode: boolean;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  argument_map: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v6m0 6v6M6 9h12M6 15h12" />
      <circle cx="12" cy="3" r="2" /><circle cx="12" cy="21" r="2" />
      <circle cx="6" cy="9" r="2" /><circle cx="18" cy="9" r="2" />
      <circle cx="6" cy="15" r="2" /><circle cx="18" cy="15" r="2" />
    </svg>
  ),
  spectrum: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="12" x2="21" y2="12" />
      <circle cx="7" cy="12" r="2" /><circle cx="17" cy="12" r="2" />
      <line x1="3" y1="8" x2="3" y2="16" /><line x1="21" y1="8" x2="21" y2="16" />
    </svg>
  ),
  analogy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z" />
      <line x1="9" y1="17" x2="15" y2="17" /><line x1="10" y1="20" x2="14" y2="20" />
    </svg>
  ),
};

export function InlineVisualWrapper({ visual, darkMode, textMuted, textFaint, cardBg, border, onExpand, onCollapse }: WrapperProps) {
  const [expanded, setExpanded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    if (expanded) {
      setContentVisible(false);
      setTimeout(() => {
        setExpanded(false);
        onCollapse?.();
      }, 200);
    } else {
      setExpanded(true);
      onExpand?.();
      // Fade in content after height starts animating
      setTimeout(() => setContentVisible(true), 100);
      // Scroll into view if needed
      setTimeout(() => {
        wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [expanded, onExpand, onCollapse]);

  const barBg = darkMode ? "bg-[#242424]" : "bg-cream-dark/50";
  const barHover = darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-cream-dark/70";

  return (
    <div ref={wrapperRef} className="my-6">
      {/* Collapsed bar / Header */}
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-3 px-4 py-3 ${barBg} ${barHover} border-l-[3px] border-l-terracotta/60 rounded-r-lg transition-colors duration-200 text-left group`}
      >
        <span className={`${textFaint} shrink-0`}>{TYPE_ICONS[visual.type]}</span>
        <span className={`flex-1 text-xs font-medium ${textMuted}`} style={{ fontFamily: "var(--font-sans)" }}>
          {visual.label}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`${textFaint} shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          ref={contentRef}
          className={`overflow-hidden border-l-[3px] border-l-terracotta/30 rounded-br-lg ${darkMode ? "bg-[#1e1e1e]" : "bg-white"} border ${darkMode ? "border-[#333]" : "border-cream-darker/40"} border-t-0`}
          style={{
            animation: "visualExpand 350ms ease-out forwards",
            maxHeight: window.innerWidth < 640 ? 350 : 450,
            overflowY: "auto",
          }}
        >
          <div
            className="p-4 sm:p-5"
            style={{
              opacity: contentVisible ? 1 : 0,
              transition: "opacity 200ms ease",
            }}
          >
            {visual.type === "spectrum" && (
              <InlineSpectrum data={visual.data as SpectrumData} darkMode={darkMode} textMuted={textMuted} textFaint={textFaint} />
            )}
            {visual.type === "argument_map" && (
              <InlineArgumentMap data={visual.data as ArgumentMapData} darkMode={darkMode} textMuted={textMuted} textFaint={textFaint} cardBg={cardBg} border={border} />
            )}
            {visual.type === "analogy" && (
              <InlineAnalogy data={visual.data as AnalogyData} darkMode={darkMode} textMuted={textMuted} textFaint={textFaint} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  InlineSpectrum — horizontal scale diagram
// ============================================================

function InlineSpectrum({ data, darkMode, textMuted, textFaint }: {
  data: SpectrumData; darkMode: boolean; textMuted: string; textFaint: string;
}) {
  return (
    <div className="py-4">
      {/* Endpoints row */}
      <div className="flex justify-between items-start mb-8 gap-4">
        <p className={`text-[10px] sm:text-xs ${textFaint} max-w-[140px] sm:max-w-[180px] leading-snug`}>{data.leftEndpoint}</p>
        <p className={`text-[10px] sm:text-xs ${textFaint} max-w-[140px] sm:max-w-[180px] leading-snug text-right`}>{data.rightEndpoint}</p>
      </div>

      {/* Scale */}
      <div className="relative mx-4 sm:mx-8">
        {/* Gradient track */}
        <div
          className="h-[2px] w-full rounded-full"
          style={{
            background: darkMode
              ? "linear-gradient(to right, rgba(255,255,255,0.15), rgba(193,124,90,0.3), rgba(255,255,255,0.15))"
              : "linear-gradient(to right, rgba(44,44,44,0.15), rgba(193,124,90,0.25), rgba(44,44,44,0.15))",
          }}
        />

        {/* Position markers */}
        {data.positions.map((pos) => (
          <div
            key={pos.name}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos.position * 100}%`, top: "-6px", transform: "translateX(-50%)" }}
          >
            {/* Dot */}
            <div
              className={`rounded-full ${pos.highlighted ? "w-3 h-3" : "w-2 h-2"}`}
              style={{
                backgroundColor: pos.highlighted
                  ? "var(--color-terracotta)"
                  : darkMode ? "rgba(255,255,255,0.35)" : "rgba(44,44,44,0.35)",
                border: pos.highlighted
                  ? "2px solid var(--color-terracotta)"
                  : darkMode ? "1.5px solid rgba(255,255,255,0.25)" : "1.5px solid rgba(44,44,44,0.25)",
              }}
            />
            {/* Name */}
            <span
              className={`mt-3 text-[10px] sm:text-xs whitespace-nowrap ${
                pos.highlighted ? "text-terracotta font-semibold" : textFaint
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {pos.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  InlineArgumentMap — React Flow based
// ============================================================

// Custom node component
function PhilosNode({ data }: { data: { label: string; nodeType: ArgMapNode["type"]; moveNumber?: number; darkMode?: boolean } }) {
  const styles: Record<string, { bg: string; border: string; labelColor: string; labelText: string }> = {
    question: {
      bg: data.darkMode ? "#2a2725" : "#FFFDF9",
      border: data.darkMode ? "1.5px solid #555" : "1.5px solid #2C2C2C",
      labelColor: data.darkMode ? "#888" : "#888",
      labelText: "Central Question",
    },
    move: {
      bg: data.darkMode ? "#2a2725" : "#FFFDF9",
      border: data.darkMode ? "1.5px solid #555" : "1.5px solid #2C2C2C",
      labelColor: data.darkMode ? "#888" : "#888",
      labelText: `Key Move ${data.moveNumber || ""}`,
    },
    thesis: {
      bg: data.darkMode ? "rgba(193,124,90,0.12)" : "rgba(193,124,90,0.08)",
      border: "2.5px solid #C17C5A",
      labelColor: "#C17C5A",
      labelText: "Thesis",
    },
    objection: {
      bg: data.darkMode ? "#252525" : "#FFFDF9",
      border: data.darkMode ? "1.5px dashed #777" : "1.5px dashed #999",
      labelColor: data.darkMode ? "#999" : "#999",
      labelText: "Strongest Objection",
    },
  };

  const s = styles[data.nodeType] || styles.move;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        className="rounded-lg shadow-sm"
        style={{
          background: s.bg,
          border: s.border,
          padding: "12px 14px",
          maxWidth: 260,
          fontFamily: "var(--font-sans)",
        }}
      >
        <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: s.labelColor }}>
          {s.labelText}
        </span>
        <p className="text-xs leading-relaxed" style={{ color: data.darkMode ? "#d5d0cb" : "#2C2C2C" }}>
          {data.label}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

const nodeTypes = { philos: PhilosNode };

function InlineArgumentMap({ data, darkMode, textMuted, textFaint, cardBg, border }: {
  data: ArgumentMapData; darkMode: boolean; textMuted: string; textFaint: string; cardBg: string; border: string;
}) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Build React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const centerX = 200;
    let moveNumber = 0;
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Separate by type
    const question = data.nodes.find((n) => n.type === "question");
    const moves = data.nodes.filter((n) => n.type === "move");
    const thesis = data.nodes.find((n) => n.type === "thesis");
    const objection = data.nodes.find((n) => n.type === "objection");

    let y = 0;
    if (question) {
      flowNodes.push({
        id: question.id,
        type: "philos",
        position: { x: centerX, y },
        data: { label: question.label, nodeType: "question", darkMode },
      });
      y += 140;
    }

    for (const m of moves) {
      moveNumber++;
      flowNodes.push({
        id: m.id,
        type: "philos",
        position: { x: centerX, y },
        data: { label: m.label, nodeType: "move", moveNumber, darkMode },
      });
      y += 140;
    }

    if (thesis) {
      flowNodes.push({
        id: thesis.id,
        type: "philos",
        position: { x: centerX, y },
        data: { label: thesis.label, nodeType: "thesis", darkMode },
      });
    }

    if (objection) {
      flowNodes.push({
        id: objection.id,
        type: "philos",
        position: { x: centerX + 300, y: y },
        data: { label: objection.label, nodeType: "objection", darkMode },
      });
    }

    for (const e of data.edges) {
      const isDashed = e.style === "dashed";
      flowEdges.push({
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        markerEnd: { type: MarkerType.ArrowClosed, color: isDashed ? "#C17C5A" : (darkMode ? "#888" : "#2C2C2C") },
        style: {
          stroke: isDashed ? "#C17C5A" : (darkMode ? "rgba(255,255,255,0.4)" : "rgba(44,44,44,0.5)"),
          strokeWidth: 1.5,
          ...(isDashed ? { strokeDasharray: "6 4" } : {}),
        },
        className: isDashed ? "objection-edge" : "",
        label: e.label,
        labelStyle: { fontFamily: "var(--font-sans)", fontSize: 10, fill: darkMode ? "#888" : "#999" },
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [data, darkMode]);

  const flowBg = darkMode ? "#1e1e1e" : "#FAF8F5";
  const totalHeight = Math.max(400, (data.nodes.filter(n => n.type !== "objection").length) * 140 + 60);

  return (
    <>
      <div className="relative" style={{ height: Math.min(totalHeight, 430) }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={1}
          style={{ background: flowBg }}
        />
        {/* Expand button */}
        <button
          onClick={(e) => { e.stopPropagation(); setOverlayOpen(true); }}
          className={`absolute top-2 right-2 p-1.5 rounded-md ${darkMode ? "bg-[#333] hover:bg-[#3a3a3a]" : "bg-cream-dark hover:bg-cream-darker"} transition-colors`}
          title="Expand to full view"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#aaa" : "#666"} strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      {/* Full overlay */}
      {overlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOverlayOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: "85vw", height: "85vh", background: flowBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              preventScrolling={true}
              proOptions={{ hideAttribution: true }}
              style={{ background: flowBg }}
            >
              <Controls position="bottom-right" />
              <MiniMap
                nodeColor={(node: Node) => {
                  const nt = (node.data as any)?.nodeType;
                  if (nt === "thesis") return "#C17C5A";
                  if (nt === "objection") return "#9E9E9E";
                  return darkMode ? "#555" : "#2C2C2C";
                }}
                maskColor={darkMode ? "rgba(30,30,30,0.8)" : "rgba(250,248,245,0.8)"}
                style={{ background: flowBg, border: darkMode ? "1px solid #333" : "1px solid #E8E4DF", borderRadius: 4 }}
              />
            </ReactFlow>
            {/* Close button */}
            <button
              onClick={() => setOverlayOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${darkMode ? "bg-[#333] hover:bg-[#444] text-[#ccc]" : "bg-cream-dark hover:bg-cream-darker text-charcoal"} transition-colors shadow-sm`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
//  InlineAnalogy — SVG illustration + caption
// ============================================================

const ANALOGY_SVGS: Record<string, React.ComponentType<{ darkMode: boolean }>> = {
  forced_choice_fork: ForcedChoiceForkSVG,
  scales_of_justice: ScalesOfJusticeSVG,
  circles_of_control: CirclesOfControlSVG,
  magnet_chain: MagnetChainSVG,
  water_flow: WaterFlowSVG,
  wheel_emptiness: WheelEmptinessSVG,
  soul_ascent: SoulAscentSVG,
  gravedigger: GravediggerSVG,
  crystal_palace: CrystalPalaceSVG,
  living_belief: LivingBeliefSVG,
  sublime_mountain: SublimeMountainSVG,
};

function InlineAnalogy({ data, darkMode, textMuted, textFaint }: {
  data: AnalogyData; darkMode: boolean; textMuted: string; textFaint: string;
}) {
  const SvgComponent = ANALOGY_SVGS[data.illustrationId] ?? ForcedChoiceForkSVG;
  return (
    <div className="flex flex-col items-center py-4">
      <SvgComponent darkMode={darkMode} />
      <p className={`mt-4 text-sm ${textMuted} italic leading-relaxed text-center max-w-lg`} style={{ fontFamily: "var(--font-serif)" }}>
        {data.caption}
      </p>
    </div>
  );
}

// ─── Hand-drawn-style fork illustration ───────────────────
function ForcedChoiceForkSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const faint = darkMode ? "rgba(255,255,255,0.15)" : "rgba(44,44,44,0.12)";
  const terra = darkMode ? "rgba(193,124,90,0.5)" : "rgba(193,124,90,0.4)";
  const textColor = darkMode ? "#9a9590" : "#5A5A5A";

  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground crumbling under feet */}
      <path d="M110 140 Q115 142 120 139 Q125 141 130 138 Q135 140 140 137 Q145 139 150 136 Q155 138 160 135 Q165 137 170 140" stroke={terra} strokeWidth="2" strokeLinecap="round" />
      <path d="M115 145 Q120 143 125 146 Q130 142 135 145" stroke={terra} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M145 144 Q150 142 155 145 Q160 141 165 144" stroke={terra} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Falling debris */}
      <circle cx="125" cy="152" r="1.5" fill={terra} opacity="0.5" />
      <circle cx="140" cy="155" r="1" fill={terra} opacity="0.4" />
      <circle cx="155" cy="153" r="1.5" fill={terra} opacity="0.5" />
      <circle cx="132" cy="158" r="1" fill={terra} opacity="0.3" />
      <circle cx="148" cy="160" r="1" fill={terra} opacity="0.3" />

      {/* Left path */}
      <path d="M130 130 Q100 110 60 60" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Right path */}
      <path d="M150 130 Q180 110 220 60" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Figure (simple stick person) */}
      <circle cx="140" cy="110" r="6" stroke={stroke} strokeWidth="1.5" fill="none" />
      <line x1="140" y1="116" x2="140" y2="133" stroke={stroke} strokeWidth="1.5" />
      <line x1="140" y1="122" x2="132" y2="128" stroke={stroke} strokeWidth="1.5" />
      <line x1="140" y1="122" x2="148" y2="128" stroke={stroke} strokeWidth="1.5" />

      {/* Path labels */}
      <text x="42" y="50" fill={textColor} fontSize="11" fontFamily="var(--font-serif)" fontStyle="italic">Believe</text>
      <text x="206" y="50" fill={textColor} fontSize="11" fontFamily="var(--font-serif)" fontStyle="italic">Don't believe</text>

      {/* Subtle path shading */}
      <path d="M130 130 Q100 110 60 60" stroke={faint} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M150 130 Q180 110 220 60" stroke={faint} strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Scales of Justice ────────────────────────────────────
function ScalesOfJusticeSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.5)" : "rgba(193,124,90,0.35)";
  const faint = darkMode ? "rgba(255,255,255,0.08)" : "rgba(44,44,44,0.06)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central pillar */}
      <line x1="140" y1="30" x2="140" y2="150" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx="140" cy="30" r="4" fill={stroke} />
      {/* Beam — slightly tilted (law vs conscience) */}
      <line x1="60" y1="65" x2="220" y2="58" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      {/* Left pan strings */}
      <line x1="70" y1="67" x2="55" y2="100" stroke={stroke} strokeWidth="1.2" />
      <line x1="60" y1="67" x2="55" y2="100" stroke={stroke} strokeWidth="1.2" />
      <line x1="50" y1="67" x2="55" y2="100" stroke={stroke} strokeWidth="1.2" />
      {/* Left pan */}
      <path d="M38 100 Q55 112 72 100" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill={faint} />
      <text x="55" y="130" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">The Law</text>
      {/* Right pan strings */}
      <line x1="210" y1="61" x2="225" y2="94" stroke={stroke} strokeWidth="1.2" />
      <line x1="220" y1="60" x2="225" y2="94" stroke={stroke} strokeWidth="1.2" />
      <line x1="230" y1="60" x2="225" y2="94" stroke={stroke} strokeWidth="1.2" />
      {/* Right pan */}
      <path d="M208 94 Q225 106 242 94" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill={faint} />
      <text x="225" y="122" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Conscience</text>
      {/* Base */}
      <line x1="115" y1="150" x2="165" y2="150" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      {/* Accent dot on beam */}
      <circle cx="140" cy="62" r="2.5" fill={terra} />
    </svg>
  );
}

// ─── Circles of Control (Stoic dichotomy) ─────────────────
function CirclesOfControlSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.4)" : "rgba(193,124,90,0.25)";
  const outerFill = darkMode ? "rgba(255,255,255,0.03)" : "rgba(44,44,44,0.04)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="190" viewBox="0 0 280 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle — not in our power */}
      <circle cx="140" cy="95" r="80" stroke={stroke} strokeWidth="1.5" strokeDasharray="6 4" fill={outerFill} />
      {/* Inner circle — in our power */}
      <circle cx="140" cy="95" r="42" stroke="#C17C5A" strokeWidth="2" fill={terra} />
      {/* Inner labels */}
      <text x="140" y="88" textAnchor="middle" fill={darkMode ? "#e0ddd8" : "#2C2C2C"} fontSize="10" fontFamily="var(--font-sans)" fontWeight="600">IN OUR POWER</text>
      <text x="140" y="102" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)">opinions · desires</text>
      <text x="140" y="114" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)">intentions · responses</text>
      {/* Outer labels */}
      <text x="140" y="20" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)" fontStyle="italic">health · wealth</text>
      <text x="140" y="178" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)" fontStyle="italic">reputation · others' actions</text>
      <text x="30" y="100" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)" fontStyle="italic">outcomes</text>
      <text x="248" y="100" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)" fontStyle="italic">fortune</text>
    </svg>
  );
}

// ─── Magnet Chain (Ion's divine inspiration) ──────────────
function MagnetChainSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.6)" : "rgba(193,124,90,0.5)";
  const fill = darkMode ? "#2a2725" : "#FFFDF9";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  const nodes = [
    { x: 30, label: "The Muse" },
    { x: 95, label: "The Poet" },
    { x: 160, label: "Rhapsode" },
    { x: 225, label: "Audience" },
  ];
  return (
    <svg width="280" height="140" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connections */}
      {nodes.slice(0, -1).map((n, i) => (
        <g key={i}>
          <line x1={n.x + 20} y1="65" x2={nodes[i + 1].x - 20} y2="65" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 3" />
          <polygon points={`${nodes[i+1].x - 22},61 ${nodes[i+1].x - 14},65 ${nodes[i+1].x - 22},69`} fill={stroke} opacity="0.5" />
        </g>
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy="65" r="20" fill={i === 0 ? terra : fill} stroke={i === 0 ? "#C17C5A" : stroke} strokeWidth={i === 0 ? "2" : "1.5"} />
          <text x={n.x} y="69" textAnchor="middle" fill={i === 0 ? (darkMode ? "#e0ddd8" : "#2C2C2C") : tc} fontSize="8" fontFamily="var(--font-sans)" fontWeight={i === 0 ? "600" : "400"}>{n.label}</text>
        </g>
      ))}
      {/* Label */}
      <text x="140" y="110" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Each ring transmits the divine power — none of them 'knows' anything.</text>
    </svg>
  );
}

// ─── Water Flow (Tao Te Ching ch. 8) ─────────────────────
function WaterFlowSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const water = darkMode ? "rgba(100,160,210,0.35)" : "rgba(100,160,210,0.25)";
  const waterStroke = darkMode ? "rgba(100,160,210,0.7)" : "rgba(80,140,190,0.6)";
  const terra = darkMode ? "rgba(193,124,90,0.4)" : "rgba(193,124,90,0.3)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="160" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground */}
      <path d="M10 130 Q50 125 90 130 Q130 135 170 128 Q210 122 260 130" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Rocks / obstacles */}
      <ellipse cx="100" cy="115" rx="18" ry="12" fill={terra} stroke={stroke} strokeWidth="1.2" />
      <ellipse cx="175" cy="118" rx="14" ry="10" fill={terra} stroke={stroke} strokeWidth="1.2" />
      {/* Water path — flows around obstacles */}
      <path d="M20 105 Q55 100 80 108 Q90 113 90 108 Q95 90 115 95 Q140 100 160 110 Q165 117 170 112 Q180 95 205 100 Q240 108 265 105"
        stroke={waterStroke} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Water fill suggestion */}
      <path d="M20 110 Q55 105 80 113 Q90 118 92 112 Q97 93 117 98 Q142 103 162 113 Q167 120 172 115 Q182 98 207 103 Q242 110 265 108 L265 135 Q240 130 205 135 Q182 132 172 138 Q167 143 162 140 Q142 135 117 130 Q97 130 92 135 Q90 140 80 135 Q55 132 20 135 Z"
        fill={water} />
      {/* Arrow showing direction */}
      <polygon points="255,100 265,105 255,110" fill={waterStroke} opacity="0.8" />
      {/* Labels */}
      <text x="35" y="92" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">seeks the low</text>
      <text x="35" y="103" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">yields around obstacles</text>
      <text x="185" y="148" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">and carves canyons</text>
    </svg>
  );
}

// ─── Wheel Emptiness (Tao Te Ching ch. 11) ───────────────
function WheelEmptinessSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.25)" : "rgba(193,124,90,0.15)";
  const emptyFill = darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  const spokes = 8;
  const cx = 100, cy = 90, r = 62, hubR = 16;
  const spokeAngles = Array.from({ length: spokes }, (_, i) => (i * Math.PI * 2) / spokes);
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rim */}
      <circle cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth="2.5" fill={terra} />
      {/* Spokes */}
      {spokeAngles.map((a, i) => (
        <line key={i}
          x1={cx + Math.cos(a) * hubR} y1={cy + Math.sin(a) * hubR}
          x2={cx + Math.cos(a) * (r - 4)} y2={cy + Math.sin(a) * (r - 4)}
          stroke={stroke} strokeWidth="1.5" />
      ))}
      {/* Hub (empty space) */}
      <circle cx={cx} cy={cy} r={hubR} stroke={stroke} strokeWidth="2" fill={emptyFill} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={tc} fontSize="7" fontFamily="var(--font-sans)">empty</text>
      {/* Arrow pointing to hub */}
      <line x1="170" y1="65" x2={cx + hubR + 4} y2={cy - 5} stroke={tc} strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="170" cy="65" r="2" fill={tc} />
      <text x="175" y="60" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">The empty space</text>
      <text x="175" y="72" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">is what makes it work</text>
      {/* Caption below */}
      <text x="140" y="160" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)">Thirty spokes — but it is the emptiness of the hub that makes the wheel useful.</text>
    </svg>
  );
}

// ─── Soul Ascent (Plotinus) ───────────────────────────────
function SoulAscentSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.6)" : "rgba(193,124,90,0.45)";
  const glow = darkMode ? "rgba(255,230,150,0.25)" : "rgba(255,220,100,0.2)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  const steps = [
    { y: 145, label: "Physical beauty", w: 90 },
    { y: 118, label: "Beautiful souls", w: 74 },
    { y: 91, label: "Knowledge", w: 58 },
    { y: 64, label: "Forms", w: 42 },
  ];
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Light source at top */}
      <circle cx="140" cy="22" r="16" fill={glow} />
      <circle cx="140" cy="22" r="8" fill={terra} />
      {/* Rays */}
      {[-40,-20,0,20,40].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180;
        return <line key={i} x1={140 + Math.cos(rad) * 10} y1={22 + Math.sin(rad) * 10}
          x2={140 + Math.cos(rad) * 28} y2={22 + Math.sin(rad) * 28}
          stroke={terra} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />;
      })}
      <text x="140" y="16" textAnchor="middle" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">The One</text>
      {/* Steps */}
      {steps.map((s, i) => (
        <g key={i}>
          <rect x={140 - s.w / 2} y={s.y} width={s.w} height={22} fill={i === 0 ? "none" : terra} fillOpacity={0.08 + i * 0.06} stroke={stroke} strokeWidth="1.2" rx="2" />
          <text x="140" y={s.y + 14} textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-sans)">{s.label}</text>
        </g>
      ))}
      {/* Figure climbing */}
      <circle cx="84" cy="108" r="5" stroke={stroke} strokeWidth="1.2" fill="none" />
      <line x1="84" y1="113" x2="84" y2="125" stroke={stroke} strokeWidth="1.2" />
      <line x1="84" y1="118" x2="79" y2="123" stroke={stroke} strokeWidth="1.2" />
      <line x1="84" y1="118" x2="89" y2="121" stroke={stroke} strokeWidth="1.2" />
      {/* Arrow upward */}
      <path d="M84 105 L84 92" stroke={terra} strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arr)" />
    </svg>
  );
}

// ─── Gravedigger (Marx) ───────────────────────────────────
function GravediggerSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const terra = darkMode ? "rgba(193,124,90,0.5)" : "rgba(193,124,90,0.35)";
  const dirt = darkMode ? "rgba(120,90,60,0.3)" : "rgba(160,120,80,0.2)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="170" viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground line */}
      <path d="M20 120 Q140 115 260 120" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pit being dug */}
      <path d="M95 120 Q110 150 160 152 Q210 150 225 120" stroke={stroke} strokeWidth="1.5" fill={dirt} />
      {/* Dirt pile to the left */}
      <path d="M60 120 Q75 105 95 110 Q100 115 80 118 Z" fill={dirt} stroke={stroke} strokeWidth="1" />
      <path d="M65 118 Q72 108 82 112" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
      {/* Bourgeois figure (top hat) standing on edge */}
      <circle cx="180" cy="90" r="7" stroke={stroke} strokeWidth="1.5" fill="none" />
      <rect x="174" y="74" width="12" height="14" stroke={stroke} strokeWidth="1.2" fill="none" rx="1" />
      <line x1="171" y1="88" x2="189" y2="88" stroke={stroke} strokeWidth="1" />
      <line x1="180" y1="97" x2="180" y2="115" stroke={stroke} strokeWidth="1.5" />
      <line x1="180" y1="104" x2="173" y2="110" stroke={stroke} strokeWidth="1.5" />
      <line x1="180" y1="104" x2="187" y2="112" stroke={stroke} strokeWidth="1.5" />
      {/* Worker below, digging */}
      <circle cx="145" cy="133" r="6" stroke={terra} strokeWidth="1.5" fill="none" />
      <line x1="145" y1="139" x2="145" y2="152" stroke={terra} strokeWidth="1.5" />
      <line x1="145" y1="143" x2="138" y2="148" stroke={terra} strokeWidth="1.5" />
      <line x1="145" y1="143" x2="152" y2="150" stroke={terra} strokeWidth="1.5" />
      {/* Shovel */}
      <line x1="152" y1="150" x2="162" y2="158" stroke={terra} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="162" cy="160" rx="5" ry="3" fill={terra} />
      {/* Labels */}
      <text x="192" y="82" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Bourgeoisie</text>
      <text x="162" y="128" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Proletariat</text>
    </svg>
  );
}

// ─── Crystal Palace (Dostoevsky) ──────────────────────────
function CrystalPalaceSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const crystal = darkMode ? "rgba(180,210,240,0.12)" : "rgba(180,210,240,0.2)";
  const crystalStroke = darkMode ? "rgba(180,210,240,0.5)" : "rgba(100,160,210,0.5)";
  const henhouse = darkMode ? "rgba(193,124,90,0.25)" : "rgba(193,124,90,0.2)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="170" viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground */}
      <line x1="10" y1="140" x2="270" y2="140" stroke={stroke} strokeWidth="1" opacity="0.3" />
      {/* Crystal Palace — ornate, glassy */}
      <rect x="25" y="60" width="90" height="80" fill={crystal} stroke={crystalStroke} strokeWidth="1.5" />
      <polygon points="25,60 70,20 115,60" fill={crystal} stroke={crystalStroke} strokeWidth="1.5" />
      {/* Windows */}
      {[40, 60, 80].map(x => <rect key={x} x={x} y="80" width="10" height="14" fill={crystal} stroke={crystalStroke} strokeWidth="1" />)}
      <line x1="25" y1="70" x2="115" y2="70" stroke={crystalStroke} strokeWidth="0.8" />
      <line x1="70" y1="60" x2="70" y2="140" stroke={crystalStroke} strokeWidth="0.8" />
      <text x="70" y="155" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Crystal Palace</text>
      {/* vs */}
      <text x="145" y="100" textAnchor="middle" fill={stroke} fontSize="14" fontFamily="var(--font-serif)" fontWeight="300" opacity="0.4">vs</text>
      {/* Hen-house — simple, rough */}
      <rect x="168" y="95" width="80" height="45" fill={henhouse} stroke={stroke} strokeWidth="1.5" />
      <polygon points="168,95 208,68 248,95" fill={henhouse} stroke={stroke} strokeWidth="1.5" />
      <rect x="196" y="115" width="16" height="25" fill={henhouse} stroke={stroke} strokeWidth="1" />
      <text x="208" y="155" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Hen-house</text>
      {/* Figure with tongue out */}
      <circle cx="70" cy="40" r="5" stroke={stroke} strokeWidth="1.2" fill="none" />
      <path d="M68 43 Q70 48 72 43" stroke={stroke} strokeWidth="1" fill="none" />
      <text x="78" y="36" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">🙃</text>
    </svg>
  );
}

// ─── Living Belief (Mill / On Liberty) ───────────────────
function LivingBeliefSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const flame = darkMode ? "rgba(193,124,90,0.8)" : "rgba(193,124,90,0.7)";
  const flameOuter = darkMode ? "rgba(220,160,80,0.4)" : "rgba(220,160,80,0.35)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  const deadColor = darkMode ? "rgba(255,255,255,0.15)" : "rgba(44,44,44,0.2)";
  return (
    <svg width="280" height="170" viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left: living candle (debate alive) */}
      <rect x="52" y="100" width="16" height="45" fill={darkMode ? "#3a3530" : "#f0ede8"} stroke={stroke} strokeWidth="1.5" rx="1" />
      {/* Flame */}
      <path d="M60 100 Q64 82 60 72 Q56 82 60 100 Z" fill={flameOuter} />
      <path d="M60 100 Q63 88 60 80 Q57 88 60 100 Z" fill={flame} />
      {/* Wind lines */}
      <path d="M72 85 Q82 82 78 78" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M74 90 Q84 88 80 84" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <text x="60" y="155" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Living belief</text>
      <text x="60" y="165" textAnchor="middle" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">(challenged, debated)</text>
      {/* vs */}
      <text x="140" y="120" textAnchor="middle" fill={stroke} fontSize="13" fontFamily="var(--font-serif)" fontWeight="300" opacity="0.35">vs</text>
      {/* Right: dead candle (silenced opinion) */}
      <rect x="212" y="100" width="16" height="45" fill={darkMode ? "#2a2a2a" : "#e8e4df"} stroke={stroke} strokeWidth="1.2" strokeDasharray="3 2" rx="1" opacity="0.7" />
      {/* Smoke from extinguished */}
      <path d="M220 100 Q222 90 219 82" stroke={deadColor} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M220 100 Q217 90 221 83" stroke={deadColor} strokeWidth="1" strokeLinecap="round" />
      <text x="220" y="155" textAnchor="middle" fill={tc} fontSize="9" fontFamily="var(--font-serif)" fontStyle="italic">Dead dogma</text>
      <text x="220" y="165" textAnchor="middle" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">(silenced, hollow)</text>
    </svg>
  );
}

// ─── Sublime Mountain (Burke) ─────────────────────────────
function SublimeMountainSVG({ darkMode }: { darkMode: boolean }) {
  const stroke = darkMode ? "#b0aaa4" : "#2C2C2C";
  const mountain = darkMode ? "rgba(90,90,100,0.4)" : "rgba(80,80,90,0.2)";
  const faint = darkMode ? "rgba(255,255,255,0.06)" : "rgba(44,44,44,0.05)";
  const mist = darkMode ? "rgba(150,160,180,0.12)" : "rgba(150,160,180,0.15)";
  const tc = darkMode ? "#9a9590" : "#5A5A5A";
  return (
    <svg width="280" height="170" viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sky gradient suggestion */}
      <rect x="0" y="0" width="280" height="170" fill={faint} />
      {/* Far mountain (massive) */}
      <path d="M0 145 Q60 30 140 20 Q220 30 280 145 Z" fill={mountain} stroke={stroke} strokeWidth="1.2" />
      {/* Mist layers */}
      <ellipse cx="70" cy="100" rx="55" ry="18" fill={mist} />
      <ellipse cx="200" cy="95" rx="60" ry="16" fill={mist} />
      <ellipse cx="140" cy="110" rx="80" ry="14" fill={mist} />
      {/* Tiny figure at base */}
      <circle cx="138" cy="140" r="4" stroke={stroke} strokeWidth="1.2" fill="none" />
      <line x1="138" y1="144" x2="138" y2="153" stroke={stroke} strokeWidth="1.2" />
      <line x1="138" y1="147" x2="134" y2="152" stroke={stroke} strokeWidth="1.2" />
      <line x1="138" y1="147" x2="142" y2="151" stroke={stroke} strokeWidth="1.2" />
      {/* Arrow from figure to peak — awe/terror */}
      <path d="M140 136 Q144 80 142 45" stroke={tc} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" strokeLinecap="round" />
      <polygon points="140,42 142,50 144,42" fill={tc} opacity="0.4" />
      {/* Annotations */}
      <text x="148" y="142" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">observer</text>
      <text x="148" y="32" fill={tc} fontSize="8" fontFamily="var(--font-serif)" fontStyle="italic">astonishment</text>
    </svg>
  );
}
