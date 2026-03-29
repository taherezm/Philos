// Pure SVG chart components for the My Progress page — no external dependencies

import { useState, useMemo } from "react";
import type { SessionData } from "./absorptionTracker";

// ---- Progress Ring ----

export function ProgressRing({
  value,
  size = 140,
  strokeWidth = 8,
  color = "var(--color-terracotta)",
  trackColor,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={trackColor || "var(--color-cream-darker)"}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ---- Line Chart (Absorption Over Time) ----

interface LineChartProps {
  sessions: SessionData[];
  days: 7 | 30 | 0; // 0 = all time
  darkMode: boolean;
  textColor: string;
  textMuted: string;
}

export function AbsorptionLineChart({ sessions, days, darkMode, textColor, textMuted }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (days === 0) return sessions;
    const cutoff = Date.now() - days * 86400000;
    return sessions.filter((s) => new Date(s.startTime).getTime() > cutoff);
  }, [sessions, days]);

  if (filtered.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${textMuted}`}>
        No sessions yet in this period
      </div>
    );
  }

  const W = 600, H = 200, PAD_L = 36, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Map data points
  const points = filtered.map((s, i) => {
    const x = PAD_L + (filtered.length === 1 ? chartW / 2 : (i / (filtered.length - 1)) * chartW);
    const y = PAD_T + chartH - (s.absorptionScore / 100) * chartH;
    return { x, y, session: s };
  });

  // Smoothed bezier path
  let pathD = "";
  if (points.length === 1) {
    pathD = `M ${points[0].x} ${points[0].y}`;
  } else {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) * 0.4;
      const cpx2 = p1.x - (p1.x - p0.x) * 0.4;
      pathD += ` C ${cpx1} ${p0.y}, ${cpx2} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Baseline at y=25
  const baselineY = PAD_T + chartH - (25 / 100) * chartH;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // X-axis: show a few date labels
  const xLabels: { x: number; label: string }[] = [];
  if (filtered.length > 0) {
    const step = Math.max(1, Math.floor(filtered.length / 5));
    for (let i = 0; i < filtered.length; i += step) {
      const d = new Date(filtered[i].startTime);
      xLabels.push({
        x: points[i].x,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    // Always include last
    const lastI = filtered.length - 1;
    if (!xLabels.some((l) => Math.abs(l.x - points[lastI].x) < 30)) {
      const d = new Date(filtered[lastI].startTime);
      xLabels.push({ x: points[lastI].x, label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
  }

  const gridColor = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const labelColor = darkMode ? "#6a6560" : "#8A8A8A";

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto min-w-[400px]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* Grid lines */}
        {yLabels.map((v) => {
          const y = PAD_T + chartH - (v / 100) * chartH;
          return (
            <line key={v} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={gridColor} strokeWidth={1} />
          );
        })}

        {/* Y-axis labels */}
        {yLabels.map((v) => {
          const y = PAD_T + chartH - (v / 100) * chartH;
          return (
            <text key={v} x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill={labelColor}>
              {v}
            </text>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 6} textAnchor="middle" fontSize={10} fill={labelColor}>
            {l.label}
          </text>
        ))}

        {/* Baseline */}
        <line x1={PAD_L} y1={baselineY} x2={W - PAD_R} y2={baselineY} stroke={gridColor} strokeWidth={1} strokeDasharray="4 4" />
        <text x={W - PAD_R - 2} y={baselineY - 4} textAnchor="end" fontSize={9} fill={labelColor} opacity={0.6}>
          passive reading
        </text>

        {/* Smoothed line */}
        <path d={pathD} fill="none" stroke="var(--color-terracotta)" strokeWidth={2.5} strokeLinecap="round" />

        {/* Area fill */}
        {points.length > 1 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${PAD_T + chartH} L ${points[0].x} ${PAD_T + chartH} Z`}
            fill="var(--color-terracotta)"
            opacity={0.08}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3.5}
            fill="var(--color-terracotta)"
            stroke={darkMode ? "#1a1a1a" : "#FAF8F5"}
            strokeWidth={2}
            className="cursor-pointer transition-[r] duration-150"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (() => {
          const p = points[hoveredIdx];
          const d = new Date(p.session.startTime);
          const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const totalMin = Math.round(p.session.activeTimeMinutes + p.session.passiveTimeMinutes);
          const label = `${dateStr} — Score: ${p.session.absorptionScore}. ${p.session.textTitle}. ${totalMin} min`;
          const tooltipW = Math.min(label.length * 5.5, 280);
          const tooltipX = Math.max(PAD_L, Math.min(p.x - tooltipW / 2, W - PAD_R - tooltipW));
          const tooltipY = p.y - 32;
          return (
            <g>
              <rect x={tooltipX - 6} y={tooltipY - 12} width={tooltipW + 12} height={22} rx={4}
                fill={darkMode ? "#333" : "#fff"} stroke={darkMode ? "#444" : "#E5E0D8"} strokeWidth={1} />
              <text x={tooltipX} y={tooltipY} fontSize={10} fill={darkMode ? "#e0ddd8" : "#2C2C2C"}>
                {label.length > 52 ? label.slice(0, 52) + "…" : label}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ---- Stacked Bar Chart (Active vs Passive Time) ----

interface BarChartProps {
  sessions: SessionData[];
  darkMode: boolean;
  textMuted: string;
}

export function ActivePassiveBarChart({ sessions, darkMode, textMuted }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = sessions.slice(-10);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 text-sm ${textMuted}`}>
        No sessions yet
      </div>
    );
  }

  const W = 500, H = 180, PAD_L = 36, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxTime = Math.max(...data.map((s) => s.activeTimeMinutes + s.passiveTimeMinutes), 1);
  const barW = Math.min(40, chartW / data.length * 0.7);
  const gap = (chartW - barW * data.length) / (data.length + 1);

  const gridColor = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const labelColor = darkMode ? "#6a6560" : "#8A8A8A";

  // Y-axis: nice round numbers
  const yTicks: number[] = [];
  const yStep = Math.max(1, Math.ceil(maxTime / 4));
  for (let v = 0; v <= maxTime + yStep; v += yStep) yTicks.push(v);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto min-w-[350px]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* Grid */}
        {yTicks.map((v) => {
          const y = PAD_T + chartH - (v / (yTicks[yTicks.length - 1] || 1)) * chartH;
          return <line key={v} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={gridColor} strokeWidth={1} />;
        })}

        {/* Y labels */}
        {yTicks.map((v) => {
          const y = PAD_T + chartH - (v / (yTicks[yTicks.length - 1] || 1)) * chartH;
          return <text key={v} x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill={labelColor}>{v}m</text>;
        })}

        {/* Bars */}
        {data.map((s, i) => {
          const x = PAD_L + gap + i * (barW + gap);
          const total = s.activeTimeMinutes + s.passiveTimeMinutes;
          const scale = (yTicks[yTicks.length - 1] || 1);
          const activeH = (s.activeTimeMinutes / scale) * chartH;
          const passiveH = (s.passiveTimeMinutes / scale) * chartH;
          const totalH = activeH + passiveH;
          const barY = PAD_T + chartH - totalH;

          const d = new Date(s.startTime);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;

          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Passive (bottom) */}
              <rect x={x} y={barY + activeH} width={barW} height={Math.max(passiveH, 0)}
                rx={0}
                fill={darkMode ? "#3a3530" : "#E5E0D8"}
                opacity={hoveredIdx === i ? 0.9 : 0.6}
              />
              {/* Active (top) */}
              <rect x={x} y={barY} width={barW} height={Math.max(activeH, 0)}
                rx={i === 0 || i === data.length - 1 ? 3 : 2}
                fill="var(--color-terracotta)"
                opacity={hoveredIdx === i ? 1 : 0.85}
              />
              {/* X label */}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={10} fill={labelColor}>
                {label}
              </text>

              {/* Tooltip */}
              {hoveredIdx === i && (
                <g>
                  <rect x={x - 20} y={barY - 40} width={barW + 100} height={30} rx={4}
                    fill={darkMode ? "#333" : "#fff"} stroke={darkMode ? "#444" : "#E5E0D8"} strokeWidth={1} />
                  <text x={x - 14} y={barY - 22} fontSize={9} fill={darkMode ? "#e0ddd8" : "#2C2C2C"}>
                    {Math.round(total)}m total · {Math.round(s.activeTimeMinutes)}m active
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---- Horizontal Score Bar ----

export function ScoreBar({ value, darkMode }: { value: number; darkMode: boolean }) {
  return (
    <div className={`h-2 rounded-full w-full ${darkMode ? "bg-[#333]" : "bg-cream-darker/40"}`}>
      <div
        className="h-2 rounded-full bg-terracotta transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
