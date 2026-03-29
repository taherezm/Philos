// My Progress page — shows absorption stats, charts, texts breakdown, badges

import { useState, useMemo } from "react";
import type { TrackerStorage, TextScore } from "./absorptionTracker";
import { computeLifetimeScore, getLevelTitle, BADGE_DEFINITIONS } from "./absorptionTracker";
import { ProgressRing, AbsorptionLineChart, ActivePassiveBarChart, ScoreBar } from "./ProgressCharts";

interface MyProgressProps {
  storage: TrackerStorage;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}

export function MyProgressView({ storage, darkMode, text, textMuted, textFaint, cardBg, border }: MyProgressProps) {
  const [chartRange, setChartRange] = useState<7 | 30 | 0>(30);
  const [textSort, setTextSort] = useState<"score" | "recent" | "az">("recent");
  const [expandedText, setExpandedText] = useState<string | null>(null);

  const lifetimeScore = computeLifetimeScore(storage.philos_sessions);
  const levelTitle = getLevelTitle(lifetimeScore);

  const streak = storage.philos_streak;
  const textScores = storage.philos_text_scores;
  const sessions = storage.philos_sessions;

  // Texts deeply read (score > 70)
  const textsRead = Object.keys(textScores).length;
  const textsDeeplyRead = Object.values(textScores).filter((t) => t.bestScore > 70).length;

  // Sort texts
  const sortedTexts = useMemo(() => {
    const entries = Object.entries(textScores);
    switch (textSort) {
      case "score":
        return entries.sort(([, a], [, b]) => b.bestScore - a.bestScore);
      case "az":
        return entries.sort(([, a], [, b]) => a.title.localeCompare(b.title));
      case "recent":
      default:
        return entries.sort(([, a], [, b]) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime());
    }
  }, [textScores, textSort]);

  // Badge data
  const badges = useMemo(() => {
    return BADGE_DEFINITIONS.map((def) => ({
      ...def,
      progress: storage.philos_badges[def.id] || { earned: false, earnedDate: null, progress: 0, target: def.target },
    }));
  }, [storage.philos_badges]);

  const ringTrackColor = darkMode ? "rgba(255,255,255,0.08)" : "var(--color-cream-darker)";

  if (sessions.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-16 text-center">
        <div className={textFaint + " mb-3"}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h2 className={`text-lg font-semibold ${text} mb-2`}>No reading data yet</h2>
        <p className={`text-sm ${textMuted} max-w-sm mx-auto`}>
          Start reading and engaging with texts to see your absorption progress here. De-jargon passages, write notes, and explore different depth layers to build your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <h1 className={`text-2xl font-semibold ${text} mb-8`} style={{ fontFamily: "var(--font-serif)" }}>
        My Progress
      </h1>

      {/* ---- Header Stats ---- */}
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mb-12">
        {/* Overall Score */}
        <div className="flex flex-col items-center">
          <ProgressRing value={lifetimeScore} size={130} strokeWidth={8} trackColor={ringTrackColor}>
            <span className={`text-3xl font-bold ${text}`}>{lifetimeScore}</span>
          </ProgressRing>
          <span className={`text-xs font-medium text-terracotta mt-2`}>{levelTitle}</span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className={`text-3xl font-bold ${text}`}>{streak.current}</span>
          </div>
          <span className={`text-xs ${textMuted}`}>day streak</span>
          {streak.longest > streak.current && (
            <span className={`text-xs ${textFaint} mt-0.5`}>best: {streak.longest}</span>
          )}
        </div>

        {/* Texts Deeply Read */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-0.5 mb-1">
            <span className={`text-3xl font-bold ${text}`}>{textsDeeplyRead}</span>
            <span className={`text-base ${textFaint}`}>/ {textsRead}</span>
          </div>
          <span className={`text-xs ${textMuted}`}>texts deeply absorbed</span>
        </div>
      </div>

      {/* ---- Absorption Over Time ---- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${text}`}>Absorption Over Time</h2>
          <div className={`flex gap-1 ${darkMode ? "bg-[#242424]" : "bg-cream-dark"} rounded-lg p-0.5`}>
            {([7, 30, 0] as const).map((d) => (
              <button
                key={d}
                onClick={() => setChartRange(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  chartRange === d
                    ? (darkMode ? "bg-[#333] text-[#e0ddd8]" : "bg-white text-charcoal") + " shadow-sm"
                    : textMuted
                }`}
              >
                {d === 0 ? "All" : `${d}d`}
              </button>
            ))}
          </div>
        </div>
        <div className={`${cardBg} rounded-xl p-4 border ${border}`}>
          <AbsorptionLineChart sessions={sessions} days={chartRange} darkMode={darkMode} textColor={text} textMuted={textMuted} />
        </div>
      </div>

      {/* ---- Active vs Passive Time ---- */}
      <div className="mb-10">
        <h2 className={`text-sm font-semibold ${text} mb-1`}>How You Spend Your Reading Time</h2>
        <p className={`text-xs ${textFaint} mb-3`}>Last 10 sessions</p>
        <div className={`${cardBg} rounded-xl p-4 border ${border}`}>
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-terracotta" />
              <span className={`text-xs ${textMuted}`}>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${darkMode ? "bg-[#3a3530]" : "bg-cream-darker"}`} />
              <span className={`text-xs ${textMuted}`}>Passive</span>
            </div>
          </div>
          <ActivePassiveBarChart sessions={sessions} darkMode={darkMode} textMuted={textMuted} />
        </div>
      </div>

      {/* ---- Texts Breakdown ---- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${text}`}>Texts Breakdown</h2>
          <div className="flex gap-1">
            {([
              ["score", "Highest Score"],
              ["recent", "Recently Read"],
              ["az", "A-Z"],
            ] as [typeof textSort, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTextSort(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  textSort === key ? "text-terracotta font-semibold" : textMuted
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sortedTexts.map(([textId, ts]) => (
            <div key={textId} className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
              <button
                onClick={() => setExpandedText(expandedText === textId ? null : textId)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-cream-dark/60"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${text} truncate`}>{ts.title}</p>
                  <p className={`text-xs ${textFaint}`}>{ts.author}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${text} w-7 text-right`}>{ts.bestScore}</span>
                      <div className="flex-1">
                        <ScoreBar value={ts.bestScore} darkMode={darkMode} />
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs ${textFaint} w-16 text-right`}>
                    {new Date(ts.lastRead).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <svg
                    width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className={`${textFaint} transition-transform duration-200 ${expandedText === textId ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
              </button>

              {expandedText === textId && (
                <div className={`px-4 pb-4 pt-1 border-t ${border} animate-[fadeIn_200ms_ease]`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <DetailStat label="Passages de-jargoned" value={ts.details.dejargonCount} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Plain depth" value={ts.details.depthPlain} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Conceptual depth" value={ts.details.depthConceptual} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Scholarly depth" value={ts.details.depthScholarly} textColor={text} textFaint={textFaint} />
                    <DetailStat label="PhiloBook entries" value={ts.details.notebookEntries} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Personal notes" value={ts.details.personalNotes} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Active recall" value={ts.details.activeRecallCount} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Total sessions" value={ts.totalSessions} textColor={text} textFaint={textFaint} />
                    <DetailStat label="Total time" value={`${ts.totalTimeMinutes}m`} textColor={text} textFaint={textFaint} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Badges ---- */}
      <div>
        <h2 className={`text-sm font-semibold ${text} mb-4`}>Milestones &amp; Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const earned = badge.progress.earned;
            return (
              <div
                key={badge.id}
                className={`${cardBg} rounded-xl p-4 border ${border} transition-all duration-300 ${
                  earned ? "badge-earned" : "opacity-50 grayscale"
                }`}
              >
                <div className="mb-2">
                  <svg
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke={earned ? "var(--color-terracotta)" : (darkMode ? "#555" : "#aaa")}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d={badge.icon} />
                  </svg>
                </div>
                <h3 className={`text-sm font-semibold ${earned ? text : textFaint} mb-0.5`}>{badge.name}</h3>
                <p className={`text-xs ${textFaint} mb-2`}>{badge.description}</p>
                {!earned && (
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full ${darkMode ? "bg-[#333]" : "bg-cream-darker/40"}`}>
                      <div
                        className="h-1.5 rounded-full bg-terracotta/40 transition-[width] duration-500"
                        style={{ width: `${(badge.progress.progress / badge.progress.target) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${textFaint}`}>{badge.progress.progress} / {badge.progress.target}</span>
                  </div>
                )}
                {earned && badge.progress.earnedDate && (
                  <p className={`text-xs ${textFaint}`}>
                    Earned {new Date(badge.progress.earnedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, textColor, textFaint }: { label: string; value: number | string; textColor: string; textFaint: string }) {
  return (
    <div>
      <span className={`text-sm font-semibold ${textColor}`}>{value}</span>
      <p className={`text-xs ${textFaint}`}>{label}</p>
    </div>
  );
}
