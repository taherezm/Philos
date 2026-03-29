// Session-end card — slides up from bottom after a reading session ends

import { ProgressRing } from "./ProgressCharts";
import { BADGE_DEFINITIONS } from "./absorptionTracker";
import type { SessionEndCardData } from "./useAbsorptionTracker";

interface SessionEndCardProps {
  data: SessionEndCardData;
  onDismiss: () => void;
  onViewProgress: () => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}

export function SessionEndCard({ data, onDismiss, onViewProgress, darkMode, text, textMuted, textFaint, cardBg, border }: SessionEndCardProps) {
  const { session, highlights, streakMessage, newBadges } = data;
  const totalMin = Math.round(session.activeTimeMinutes + session.passiveTimeMinutes);
  const ringTrackColor = darkMode ? "rgba(255,255,255,0.08)" : "var(--color-cream-darker)";

  return (
    <div className="session-end-card fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-[420px]">
      <div className={`${darkMode ? "bg-[#242424]" : "bg-white"} rounded-2xl shadow-2xl border ${border} p-5 relative`}>
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className={`absolute top-3 right-3 p-1 rounded-lg ${darkMode ? "hover:bg-[#333]" : "hover:bg-cream-dark"} transition-colors ${textFaint}`}
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Session time */}
        <p className={`text-sm ${textMuted} mb-4 pr-6`}>
          You spent <span className={`font-semibold ${text}`}>{totalMin} minute{totalMin !== 1 ? "s" : ""}</span> with {session.author} today.
        </p>

        {/* Score ring + highlights */}
        <div className="flex items-start gap-4 mb-4">
          <ProgressRing value={session.absorptionScore} size={64} strokeWidth={5} trackColor={ringTrackColor}>
            <span className={`text-lg font-bold ${text}`}>{session.absorptionScore}</span>
          </ProgressRing>
          <div className="flex-1 pt-1">
            {highlights.map((h, i) => (
              <p key={i} className={`text-sm ${text} mb-1`}>{h}</p>
            ))}
          </div>
        </div>

        {/* Streak */}
        <p className={`text-xs ${textMuted} mb-3`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="2" className="inline -mt-0.5 mr-1">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {streakMessage}
        </p>

        {/* New badges */}
        {newBadges.length > 0 && (
          <div className={`border-t ${border} pt-3 mb-3`}>
            {newBadges.map((badgeId) => {
              const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
              if (!def) return null;
              return (
                <div key={badgeId} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={def.icon} />
                  </svg>
                  <span className={`text-sm font-medium ${text}`}>You earned: {def.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onViewProgress}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors"
        >
          View Full Progress
        </button>
      </div>
    </div>
  );
}
