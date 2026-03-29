// React hook for absorption tracking — manages session lifecycle, signal capture, and persistence

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  SessionData, SessionSignals, DejargonSignal, DepthSignal, NotebookSignal,
  ActiveRecallSignal, ParagraphDwell, TrackerStorage, StreakData, TextScore, BadgeProgress, BadgeCheckState,
} from "./absorptionTracker";
import {
  loadTrackerState, saveTrackerState, computeAbsorptionScore, computeActiveTimeMs,
  computeParagraphComplexity, updateStreak, checkBadges, generateId, getSessionHighlights,
  computeLifetimeScore, BADGE_DEFINITIONS,
} from "./absorptionTracker";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface TrackerAPI {
  // Signal recording
  recordDejargon: (textId: string, paragraphId: number, passageLength: number) => void;
  recordDejargonClose: () => void;
  recordDepthChange: (depth: "plain" | "conceptual" | "scholarly") => void;
  recordNotebookSave: (hasNote: boolean, noteLength: number, type?: "dejargon" | "debate_prep" | "study_package") => void;
  recordActiveRecall: (action: ActiveRecallSignal["action"]) => void;
  recordFeatureUsed: (feature: string) => void;
  recordPathCompleted: () => void;

  // Session management
  startSession: (textId: string, textTitle: string, author: string, branch: string, school: string) => void;
  endSession: () => void;
  isSessionActive: boolean;

  // Paragraph dwell tracking — attach to reading view
  paragraphObserverRef: (el: HTMLDivElement | null) => void;

  // Ambient engagement level: "active" | "reading" | "idle"
  engagementLevel: "active" | "reading" | "idle";

  // Session end card data
  sessionEndData: SessionEndCardData | null;
  dismissSessionEnd: () => void;

  // Persisted data for My Progress page
  storage: TrackerStorage;
  lifetimeScore: number;
}

export interface SessionEndCardData {
  session: SessionData;
  highlights: string[];
  streakMessage: string;
  newBadges: string[]; // badge IDs earned this session
}

export function useAbsorptionTracker(): TrackerAPI {
  const [storage, setStorage] = useState<TrackerStorage>(loadTrackerState);
  const [sessionEndData, setSessionEndData] = useState<SessionEndCardData | null>(null);
  const [engagementLevel, setEngagementLevel] = useState<"active" | "reading" | "idle">("idle");
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Current session refs (avoid re-renders on every signal)
  const sessionRef = useRef<{
    id: string;
    startTime: number;
    textId: string;
    textTitle: string;
    author: string;
    branch: string;
    school: string;
    signals: SessionSignals;
    lastDejargonOpenTime: number | null;
    currentDepthKey: string | null;
    currentDepthLayers: Set<"plain" | "conceptual" | "scholarly">;
    paragraphDwells: Map<number, { startTime: number; totalTime: number; complexity: number }>;
  } | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const engagementTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readingContainerRef = useRef<HTMLDivElement | null>(null);

  // Persist storage on change
  useEffect(() => {
    saveTrackerState(storage);
  }, [storage]);

  // Reset idle timer on any user activity
  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (sessionRef.current) {
      idleTimerRef.current = setTimeout(() => {
        endSessionInternal();
      }, IDLE_TIMEOUT_MS);
    }
  }, []);

  useEffect(() => {
    const handler = () => resetIdle();
    window.addEventListener("mousemove", handler, { passive: true });
    window.addEventListener("keydown", handler, { passive: true });
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("click", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("click", handler);
    };
  }, [resetIdle]);

  // Engagement level polling (every 5 seconds)
  useEffect(() => {
    engagementTimerRef.current = setInterval(() => {
      if (!sessionRef.current) {
        setEngagementLevel("idle");
        return;
      }
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > 120000) {
        setEngagementLevel("idle");
      } else {
        // Check if user had a "feature" action in last 2 min
        const twoMinAgo = Date.now() - 120000;
        const recentFeatureUse = sessionRef.current.signals.dejargonRequests.some(d => d.timestamp > twoMinAgo)
          || sessionRef.current.signals.notebookSaves.some(n => n.timestamp > twoMinAgo)
          || sessionRef.current.signals.activeRecallActions.some(a => a.timestamp > twoMinAgo);
        setEngagementLevel(recentFeatureUse ? "active" : "reading");
      }
    }, 5000);
    return () => {
      if (engagementTimerRef.current) clearInterval(engagementTimerRef.current);
    };
  }, []);

  // Intersection Observer for paragraph dwell time
  const setupObserver = useCallback((container: HTMLDivElement | null) => {
    readingContainerRef.current = container;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!container) return;

    const paragraphs = container.querySelectorAll("[data-para-idx]");
    if (paragraphs.length === 0) return;

    const visibleSet = new Map<number, number>(); // paraIndex -> visibility start time

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!sessionRef.current) return;
        const now = Date.now();
        for (const entry of entries) {
          const idx = parseInt((entry.target as HTMLElement).dataset.paraIdx || "-1");
          if (idx < 0) continue;

          if (entry.isIntersecting) {
            if (!visibleSet.has(idx)) {
              visibleSet.set(idx, now);
            }
          } else {
            const startTime = visibleSet.get(idx);
            if (startTime && now - startTime > 2000) {
              const elapsed = now - startTime;
              const existing = sessionRef.current.paragraphDwells.get(idx);
              if (existing) {
                existing.totalTime += elapsed;
              } else {
                const paraText = (entry.target as HTMLElement).textContent || "";
                sessionRef.current.paragraphDwells.set(idx, {
                  startTime: now,
                  totalTime: elapsed,
                  complexity: computeParagraphComplexity(paraText),
                });
              }
            }
            visibleSet.delete(idx);
          }
        }
      },
      { threshold: 0.5 }
    );

    paragraphs.forEach((p) => observerRef.current?.observe(p));
  }, []);

  // Finalize dwell data from observer
  const finalizeDwells = useCallback((): ParagraphDwell[] => {
    if (!sessionRef.current) return [];
    const result: ParagraphDwell[] = [];
    for (const [idx, data] of sessionRef.current.paragraphDwells) {
      result.push({
        paragraphIndex: idx,
        totalDwellTime: data.totalTime,
        paragraphComplexity: data.complexity,
      });
    }
    return result;
  }, []);

  // End session (internal, builds SessionData and updates storage)
  const endSessionInternal = useCallback(() => {
    const sess = sessionRef.current;
    if (!sess) return;

    const endTime = Date.now();
    const totalMs = endTime - sess.startTime;
    if (totalMs < 10000) {
      // Less than 10 seconds — not a real session
      sessionRef.current = null;
      setIsSessionActive(false);
      return;
    }

    // Finalize depth tracking for last passage
    if (sess.currentDepthKey && sess.currentDepthLayers.size > 0) {
      const layers = Array.from(sess.currentDepthLayers) as ("plain" | "conceptual" | "scholarly")[];
      const depthOrder = { plain: 1, conceptual: 2, scholarly: 3 };
      const highest = layers.reduce((a, b) => depthOrder[a] >= depthOrder[b] ? a : b);
      sess.signals.depthLayers.push({
        passageKey: sess.currentDepthKey,
        layersViewed: layers,
        highestDepth: highest,
      });
    }

    // Close last dejargon read time
    if (sess.lastDejargonOpenTime && sess.signals.dejargonRequests.length > 0) {
      const lastReq = sess.signals.dejargonRequests[sess.signals.dejargonRequests.length - 1];
      if (lastReq.readTimeMs === 0) {
        lastReq.readTimeMs = endTime - sess.lastDejargonOpenTime;
      }
    }

    const dwells = finalizeDwells();
    const totalParagraphsRead = dwells.filter(d => d.totalDwellTime > 2000).length;
    const score = computeAbsorptionScore(sess.signals, Math.max(totalParagraphsRead, 1), totalMs);
    const activeMs = computeActiveTimeMs(sess.signals);

    const depthCounts = { plain: 0, conceptual: 0, scholarly: 0 };
    for (const d of sess.signals.depthLayers) {
      for (const l of d.layersViewed) depthCounts[l]++;
    }

    const sessionData: SessionData = {
      id: sess.id,
      startTime: new Date(sess.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      textId: sess.textId,
      textTitle: sess.textTitle,
      author: sess.author,
      branch: sess.branch,
      school: sess.school,
      absorptionScore: score,
      activeTimeMinutes: Math.round(activeMs / 60000 * 10) / 10,
      passiveTimeMinutes: Math.round((totalMs - activeMs) / 60000 * 10) / 10,
      signals: {
        dejargonRequests: sess.signals.dejargonRequests.length,
        dejargonAvgReadTime: sess.signals.dejargonRequests.length > 0
          ? sess.signals.dejargonRequests.reduce((s, d) => s + d.readTimeMs, 0) / sess.signals.dejargonRequests.length / 1000
          : 0,
        depthLayersViewed: depthCounts,
        paragraphDwellData: dwells,
        notebookSaves: sess.signals.notebookSaves.length,
        personalNotesWritten: sess.signals.notebookSaves.filter(n => n.hasPersonalNote).length,
        activeRecallActions: sess.signals.activeRecallActions.length,
        featuresUsed: Array.from(sess.signals.featuresUsed),
      },
    };

    // Update storage
    setStorage((prev) => {
      const updated = { ...prev };
      updated.philos_sessions = [...prev.philos_sessions, sessionData];

      // Text scores
      const textScores = { ...prev.philos_text_scores };
      const existing = textScores[sess.textId];
      if (existing) {
        textScores[sess.textId] = {
          ...existing,
          bestScore: Math.max(existing.bestScore, score),
          totalSessions: existing.totalSessions + 1,
          totalTimeMinutes: existing.totalTimeMinutes + Math.round(totalMs / 60000),
          lastRead: new Date().toISOString(),
          details: {
            dejargonCount: existing.details.dejargonCount + sessionData.signals.dejargonRequests,
            depthPlain: existing.details.depthPlain + depthCounts.plain,
            depthConceptual: existing.details.depthConceptual + depthCounts.conceptual,
            depthScholarly: existing.details.depthScholarly + depthCounts.scholarly,
            notebookEntries: existing.details.notebookEntries + sessionData.signals.notebookSaves,
            personalNotes: existing.details.personalNotes + sessionData.signals.personalNotesWritten,
            activeRecallCount: existing.details.activeRecallCount + sessionData.signals.activeRecallActions,
          },
        };
      } else {
        textScores[sess.textId] = {
          bestScore: score,
          totalSessions: 1,
          totalTimeMinutes: Math.round(totalMs / 60000),
          title: sess.textTitle,
          author: sess.author,
          branch: sess.branch,
          lastRead: new Date().toISOString(),
          details: {
            dejargonCount: sessionData.signals.dejargonRequests,
            depthPlain: depthCounts.plain,
            depthConceptual: depthCounts.conceptual,
            depthScholarly: depthCounts.scholarly,
            notebookEntries: sessionData.signals.notebookSaves,
            personalNotes: sessionData.signals.personalNotesWritten,
            activeRecallCount: sessionData.signals.activeRecallActions,
          },
        };
      }
      updated.philos_text_scores = textScores;

      // Lifetime counters
      updated.philos_lifetime_notes = prev.philos_lifetime_notes + sessionData.signals.personalNotesWritten;
      updated.philos_lifetime_dejargon = prev.philos_lifetime_dejargon + sessionData.signals.dejargonRequests;
      updated.philos_lifetime_sowhat = prev.philos_lifetime_sowhat + sess.signals.activeRecallActions.filter(a => a.action === "so_what").length;
      updated.philos_lifetime_debateprep = prev.philos_lifetime_debateprep + sess.signals.activeRecallActions.filter(a => a.action === "debate_prep").length;
      updated.philos_lifetime_scholarly = prev.philos_lifetime_scholarly + depthCounts.scholarly;

      // Branches
      const branches = new Set(prev.philos_branches_read);
      branches.add(sess.branch);
      updated.philos_branches_read = Array.from(branches);

      // Features
      const features = new Set(prev.philos_all_features);
      for (const f of sess.signals.featuresUsed) features.add(f);
      updated.philos_all_features = Array.from(features);

      // Streak
      updated.philos_streak = updateStreak(prev.philos_streak, score);

      // Badges
      const badgeState: BadgeCheckState = {
        sessions: updated.philos_sessions,
        badges: prev.philos_badges,
        streak: updated.philos_streak,
        textScores: updated.philos_text_scores,
        totalNotesWritten: updated.philos_lifetime_notes,
        totalDejargonRequests: updated.philos_lifetime_dejargon,
        totalSoWhatClicks: updated.philos_lifetime_sowhat,
        totalDebatePrepUses: updated.philos_lifetime_debateprep,
        totalScholarlyViews: updated.philos_lifetime_scholarly,
        branchesRead: branches,
        allFeaturesEverUsed: features,
        pathsCompleted: updated.philos_paths_completed,
        currentSessionHour: new Date().getHours(),
      };
      const newBadges = checkBadges(badgeState);

      // Detect newly earned badges
      const justEarned: string[] = [];
      for (const [id, bp] of Object.entries(newBadges)) {
        if (bp.earned && !prev.philos_badges[id]?.earned) {
          justEarned.push(id);
        }
      }
      updated.philos_badges = newBadges;

      // Build session-end card data
      const streak = updated.philos_streak;
      let streakMessage: string;
      if (score < 40) {
        streakMessage = "Light reading session";
      } else if (streak.current === 1) {
        streakMessage = "You started a new streak!";
      } else {
        streakMessage = `Day ${streak.current} of your reading streak`;
      }

      setSessionEndData({
        session: sessionData,
        highlights: getSessionHighlights(sessionData),
        streakMessage,
        newBadges: justEarned,
      });

      return updated;
    });

    // Cleanup
    sessionRef.current = null;
    setIsSessionActive(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (observerRef.current) observerRef.current.disconnect();
  }, [finalizeDwells]);

  // Public API
  const startSession = useCallback((textId: string, textTitle: string, author: string, branch: string, school: string) => {
    // End existing session first
    if (sessionRef.current) {
      endSessionInternal();
    }

    sessionRef.current = {
      id: generateId(),
      startTime: Date.now(),
      textId,
      textTitle,
      author,
      branch,
      school,
      signals: {
        dejargonRequests: [],
        depthLayers: [],
        paragraphDwells: [],
        notebookSaves: [],
        activeRecallActions: [],
        featuresUsed: new Set(),
      },
      lastDejargonOpenTime: null,
      currentDepthKey: null,
      currentDepthLayers: new Set(),
      paragraphDwells: new Map(),
    };

    setIsSessionActive(true);
    lastActivityRef.current = Date.now();
    idleTimerRef.current = setTimeout(() => endSessionInternal(), IDLE_TIMEOUT_MS);
  }, [endSessionInternal]);

  const endSession = useCallback(() => {
    endSessionInternal();
  }, [endSessionInternal]);

  const recordDejargon = useCallback((textId: string, paragraphId: number, passageLength: number) => {
    if (!sessionRef.current) return;
    resetIdle();

    // Close previous dejargon read time
    if (sessionRef.current.lastDejargonOpenTime && sessionRef.current.signals.dejargonRequests.length > 0) {
      const lastReq = sessionRef.current.signals.dejargonRequests[sessionRef.current.signals.dejargonRequests.length - 1];
      if (lastReq.readTimeMs === 0) {
        lastReq.readTimeMs = Date.now() - sessionRef.current.lastDejargonOpenTime;
      }
    }

    // Finalize previous depth tracking
    if (sessionRef.current.currentDepthKey && sessionRef.current.currentDepthLayers.size > 0) {
      const layers = Array.from(sessionRef.current.currentDepthLayers) as ("plain" | "conceptual" | "scholarly")[];
      const depthOrder = { plain: 1, conceptual: 2, scholarly: 3 };
      const highest = layers.reduce((a, b) => depthOrder[a] >= depthOrder[b] ? a : b);
      sessionRef.current.signals.depthLayers.push({
        passageKey: sessionRef.current.currentDepthKey,
        layersViewed: layers,
        highestDepth: highest,
      });
    }

    const signal: DejargonSignal = {
      timestamp: Date.now(),
      passageLength: passageLength,
      textId,
      paragraphId,
      readTimeMs: 0, // will be set on close
    };

    sessionRef.current.signals.dejargonRequests.push(signal);
    sessionRef.current.lastDejargonOpenTime = Date.now();
    sessionRef.current.signals.featuresUsed.add("dejargon");

    // Start new depth tracking
    const key = `${textId}_${paragraphId}_${Date.now()}`;
    sessionRef.current.currentDepthKey = key;
    sessionRef.current.currentDepthLayers = new Set(["plain"]);
  }, [resetIdle]);

  const recordDejargonClose = useCallback(() => {
    if (!sessionRef.current || !sessionRef.current.lastDejargonOpenTime) return;

    const lastReq = sessionRef.current.signals.dejargonRequests[sessionRef.current.signals.dejargonRequests.length - 1];
    if (lastReq && lastReq.readTimeMs === 0) {
      lastReq.readTimeMs = Date.now() - sessionRef.current.lastDejargonOpenTime;
    }
    sessionRef.current.lastDejargonOpenTime = null;

    // Finalize depth
    if (sessionRef.current.currentDepthKey && sessionRef.current.currentDepthLayers.size > 0) {
      const layers = Array.from(sessionRef.current.currentDepthLayers) as ("plain" | "conceptual" | "scholarly")[];
      const depthOrder = { plain: 1, conceptual: 2, scholarly: 3 };
      const highest = layers.reduce((a, b) => depthOrder[a] >= depthOrder[b] ? a : b);
      sessionRef.current.signals.depthLayers.push({
        passageKey: sessionRef.current.currentDepthKey,
        layersViewed: layers,
        highestDepth: highest,
      });
      sessionRef.current.currentDepthKey = null;
      sessionRef.current.currentDepthLayers = new Set();
    }
  }, []);

  const recordDepthChange = useCallback((depth: "plain" | "conceptual" | "scholarly") => {
    if (!sessionRef.current) return;
    resetIdle();
    sessionRef.current.currentDepthLayers.add(depth);
    sessionRef.current.signals.featuresUsed.add("depth");
  }, [resetIdle]);

  const recordNotebookSave = useCallback((hasNote: boolean, noteLength: number, type: "dejargon" | "debate_prep" | "study_package" = "dejargon") => {
    if (!sessionRef.current) return;
    resetIdle();
    sessionRef.current.signals.notebookSaves.push({
      timestamp: Date.now(),
      hasPersonalNote: hasNote,
      noteCharCount: noteLength,
      type,
    });
    sessionRef.current.signals.featuresUsed.add("notebook");
  }, [resetIdle]);

  const recordActiveRecall = useCallback((action: ActiveRecallSignal["action"]) => {
    if (!sessionRef.current) return;
    resetIdle();
    sessionRef.current.signals.activeRecallActions.push({
      timestamp: Date.now(),
      action,
    });
    sessionRef.current.signals.featuresUsed.add(action);
  }, [resetIdle]);

  const recordFeatureUsed = useCallback((feature: string) => {
    if (!sessionRef.current) return;
    sessionRef.current.signals.featuresUsed.add(feature);
  }, []);

  const recordPathCompleted = useCallback(() => {
    setStorage((prev) => ({
      ...prev,
      philos_paths_completed: prev.philos_paths_completed + 1,
    }));
  }, []);

  const dismissSessionEnd = useCallback(() => {
    setSessionEndData(null);
  }, []);

  // Auto-dismiss session end card after 15 seconds
  useEffect(() => {
    if (!sessionEndData) return;
    const timer = setTimeout(() => setSessionEndData(null), 15000);
    return () => clearTimeout(timer);
  }, [sessionEndData]);

  const lifetimeScore = computeLifetimeScore(storage.philos_sessions);

  return {
    recordDejargon,
    recordDejargonClose,
    recordDepthChange,
    recordNotebookSave,
    recordActiveRecall,
    recordFeatureUsed,
    recordPathCompleted,
    startSession,
    endSession,
    isSessionActive,
    paragraphObserverRef: setupObserver,
    engagementLevel,
    sessionEndData,
    dismissSessionEnd,
    storage,
    lifetimeScore,
  };
}
