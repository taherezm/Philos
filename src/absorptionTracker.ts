// Absorption Tracker — types, score computation, badge logic, storage helpers

// ---- Types ----

export interface DejargonSignal {
  timestamp: number;
  passageLength: number;
  textId: string;
  paragraphId: number;
  readTimeMs: number; // time panel was open before close/next action
}

export interface DepthSignal {
  passageKey: string; // textId + paragraphId + timestamp
  layersViewed: ("plain" | "conceptual" | "scholarly")[];
  highestDepth: "plain" | "conceptual" | "scholarly";
}

export interface ParagraphDwell {
  paragraphIndex: number;
  totalDwellTime: number; // in ms
  paragraphComplexity: number; // 1-10 scale
}

export interface NotebookSignal {
  timestamp: number;
  hasPersonalNote: boolean;
  noteCharCount: number;
  type: "dejargon" | "debate_prep" | "study_package";
}

export interface ActiveRecallSignal {
  timestamp: number;
  action: "debate_prep" | "so_what" | "what_would_they_say" | "im_lost" | "explain_friend" | "study_mode";
}

export interface SessionSignals {
  dejargonRequests: DejargonSignal[];
  depthLayers: DepthSignal[];
  paragraphDwells: ParagraphDwell[];
  notebookSaves: NotebookSignal[];
  activeRecallActions: ActiveRecallSignal[];
  featuresUsed: Set<string>;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime: string;
  textId: string;
  textTitle: string;
  author: string;
  branch: string;
  school: string;
  absorptionScore: number;
  activeTimeMinutes: number;
  passiveTimeMinutes: number;
  signals: {
    dejargonRequests: number;
    dejargonAvgReadTime: number;
    depthLayersViewed: { plain: number; conceptual: number; scholarly: number };
    paragraphDwellData: ParagraphDwell[];
    notebookSaves: number;
    personalNotesWritten: number;
    activeRecallActions: number;
    featuresUsed: string[];
  };
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG path data
  target: number;
  check: (state: BadgeCheckState) => { earned: boolean; progress: number };
}

export interface BadgeProgress {
  earned: boolean;
  earnedDate: string | null;
  progress: number;
  target: number;
}

export interface BadgeCheckState {
  sessions: SessionData[];
  badges: Record<string, BadgeProgress>;
  streak: StreakData;
  textScores: Record<string, TextScore>;
  totalNotesWritten: number;
  totalDejargonRequests: number;
  totalSoWhatClicks: number;
  totalDebatePrepUses: number;
  totalScholarlyViews: number;
  branchesRead: Set<string>;
  allFeaturesEverUsed: Set<string>;
  pathsCompleted: number;
  currentSessionHour: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface TextScore {
  bestScore: number;
  totalSessions: number;
  totalTimeMinutes: number;
  title: string;
  author: string;
  branch: string;
  lastRead: string;
  details: {
    dejargonCount: number;
    depthPlain: number;
    depthConceptual: number;
    depthScholarly: number;
    notebookEntries: number;
    personalNotes: number;
    activeRecallCount: number;
  };
}

export interface TrackerStorage {
  philos_sessions: SessionData[];
  philos_badges: Record<string, BadgeProgress>;
  philos_streak: StreakData;
  philos_text_scores: Record<string, TextScore>;
  philos_lifetime_notes: number;
  philos_lifetime_dejargon: number;
  philos_lifetime_sowhat: number;
  philos_lifetime_debateprep: number;
  philos_lifetime_scholarly: number;
  philos_branches_read: string[];
  philos_all_features: string[];
  philos_paths_completed: number;
}

// ---- Storage Helpers ----

const STORAGE_KEYS = {
  sessions: "philos_sessions",
  badges: "philos_badges",
  streak: "philos_streak",
  textScores: "philos_text_scores",
  lifetimeNotes: "philos_lifetime_notes",
  lifetimeDejargon: "philos_lifetime_dejargon",
  lifetimeSoWhat: "philos_lifetime_sowhat",
  lifetimeDebatePrep: "philos_lifetime_debateprep",
  lifetimeScholarly: "philos_lifetime_scholarly",
  branchesRead: "philos_branches_read",
  allFeatures: "philos_all_features",
  pathsCompleted: "philos_paths_completed",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full — silently fail
  }
}

export function loadTrackerState(): TrackerStorage {
  return {
    philos_sessions: safeGet(STORAGE_KEYS.sessions, []),
    philos_badges: safeGet(STORAGE_KEYS.badges, {}),
    philos_streak: safeGet(STORAGE_KEYS.streak, { current: 0, longest: 0, lastActiveDate: "" }),
    philos_text_scores: safeGet(STORAGE_KEYS.textScores, {}),
    philos_lifetime_notes: safeGet(STORAGE_KEYS.lifetimeNotes, 0),
    philos_lifetime_dejargon: safeGet(STORAGE_KEYS.lifetimeDejargon, 0),
    philos_lifetime_sowhat: safeGet(STORAGE_KEYS.lifetimeSoWhat, 0),
    philos_lifetime_debateprep: safeGet(STORAGE_KEYS.lifetimeDebatePrep, 0),
    philos_lifetime_scholarly: safeGet(STORAGE_KEYS.lifetimeScholarly, 0),
    philos_branches_read: safeGet(STORAGE_KEYS.branchesRead, []),
    philos_all_features: safeGet(STORAGE_KEYS.allFeatures, []),
    philos_paths_completed: safeGet(STORAGE_KEYS.pathsCompleted, 0),
  };
}

export function saveTrackerState(state: TrackerStorage): void {
  safeSet(STORAGE_KEYS.sessions, state.philos_sessions);
  safeSet(STORAGE_KEYS.badges, state.philos_badges);
  safeSet(STORAGE_KEYS.streak, state.philos_streak);
  safeSet(STORAGE_KEYS.textScores, state.philos_text_scores);
  safeSet(STORAGE_KEYS.lifetimeNotes, state.philos_lifetime_notes);
  safeSet(STORAGE_KEYS.lifetimeDejargon, state.philos_lifetime_dejargon);
  safeSet(STORAGE_KEYS.lifetimeSoWhat, state.philos_lifetime_sowhat);
  safeSet(STORAGE_KEYS.lifetimeDebatePrep, state.philos_lifetime_debateprep);
  safeSet(STORAGE_KEYS.lifetimeScholarly, state.philos_lifetime_scholarly);
  safeSet(STORAGE_KEYS.branchesRead, state.philos_branches_read);
  safeSet(STORAGE_KEYS.allFeatures, state.philos_all_features);
  safeSet(STORAGE_KEYS.pathsCompleted, state.philos_paths_completed);
}

// ---- Paragraph Complexity ----

export function computeParagraphComplexity(text: string): number {
  if (!text || text.length < 20) return 1;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 10;

  const semicolons = (text.match(/[;:]/g) || []).length;
  const longWords = text.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z]/g, "").length > 10).length;

  // Normalize each factor to 0-1, then combine
  const sentenceFactor = Math.min(avgSentenceLen / 35, 1); // 35+ words = max
  const structureFactor = Math.min(semicolons / 6, 1); // 6+ semicolons/colons = max
  const jargonFactor = Math.min(longWords / 10, 1); // 10+ long words = max

  const raw = sentenceFactor * 0.4 + structureFactor * 0.3 + jargonFactor * 0.3;
  return Math.max(1, Math.min(10, Math.round(raw * 9 + 1)));
}

// ---- Score Computation ----

export function computeDejargonScore(signals: SessionSignals, totalParagraphsRead: number): number {
  if (totalParagraphsRead === 0 || signals.dejargonRequests.length === 0) return 0;

  const ratio = signals.dejargonRequests.length / totalParagraphsRead;

  let baseScore: number;
  if (ratio <= 0.05) {
    baseScore = ratio / 0.05 * 30; // 0 to 30
  } else if (ratio <= 0.4) {
    baseScore = 30 + ((ratio - 0.05) / 0.35) * 70; // 30 to 100
  } else if (ratio <= 0.8) {
    baseScore = 100;
  } else {
    baseScore = 70; // over-translating
  }

  // Factor in read time — penalize quick dismissals
  const validRequests = signals.dejargonRequests.filter((r) => r.readTimeMs > 3000);
  const readTimePenalty = signals.dejargonRequests.length > 0
    ? validRequests.length / signals.dejargonRequests.length
    : 1;

  return Math.round(baseScore * (0.5 + 0.5 * readTimePenalty));
}

export function computeDepthScore(signals: SessionSignals): number {
  if (signals.depthLayers.length === 0) return 0;

  const depthOrder = { plain: 1, conceptual: 2, scholarly: 3 };
  let total = 0;
  for (const d of signals.depthLayers) {
    const highest = depthOrder[d.highestDepth];
    if (highest >= 3) total += 100;
    else if (highest >= 2) total += 70;
    else total += 30;
  }
  return Math.round(total / signals.depthLayers.length);
}

// Pearson correlation
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function computeDwellScore(signals: SessionSignals, totalReadingTimeMs: number): number {
  if (totalReadingTimeMs < 120000) return 10; // under 2 minutes

  const dwells = signals.paragraphDwells.filter((d) => d.totalDwellTime > 0);
  if (dwells.length < 5) return 20;

  const complexities = dwells.map((d) => d.paragraphComplexity);
  const times = dwells.map((d) => d.totalDwellTime);
  const corr = pearson(complexities, times);

  if (corr > 0.6) return 100;
  if (corr >= 0.3) return Math.round(60 + ((corr - 0.3) / 0.3) * 40);
  if (corr >= 0) return Math.round(20 + (corr / 0.3) * 40);
  return 20;
}

export function computeNotebookScore(signals: SessionSignals): number {
  const passiveSaves = signals.notebookSaves.filter((s) => !s.hasPersonalNote).length;
  const activeSaves = signals.notebookSaves.filter((s) => s.hasPersonalNote).length;
  let score = Math.min(100, passiveSaves * 15 + activeSaves * 30);
  if (signals.notebookSaves.some((s) => s.noteCharCount > 100)) {
    score = Math.min(100, score + 10);
  }
  return score;
}

export function computeActiveRecallScore(signals: SessionSignals): number {
  return Math.min(100, signals.activeRecallActions.length * 20);
}

export function computeAbsorptionScore(signals: SessionSignals, totalParagraphsRead: number, totalReadingTimeMs: number): number {
  const dejargon = computeDejargonScore(signals, totalParagraphsRead);
  const depth = computeDepthScore(signals);
  const dwell = computeDwellScore(signals, totalReadingTimeMs);
  const notebook = computeNotebookScore(signals);
  const activeRecall = computeActiveRecallScore(signals);

  return Math.round(
    dejargon * 0.25 +
    depth * 0.15 +
    dwell * 0.20 +
    notebook * 0.20 +
    activeRecall * 0.20
  );
}

// ---- Active Time Estimation ----

export function computeActiveTimeMs(signals: SessionSignals): number {
  let activeMs = 0;
  // De-jargon read time
  for (const dj of signals.dejargonRequests) {
    activeMs += dj.readTimeMs;
  }
  // Notebook saves ~30s each
  activeMs += signals.notebookSaves.length * 30000;
  // Extra for personal notes
  for (const ns of signals.notebookSaves) {
    if (ns.hasPersonalNote) activeMs += Math.min(ns.noteCharCount * 200, 120000); // rough typing time
  }
  // Active recall actions ~20s each
  activeMs += signals.activeRecallActions.length * 20000;
  // Depth exploration ~10s per extra layer
  for (const d of signals.depthLayers) {
    activeMs += (d.layersViewed.length - 1) * 10000;
  }
  return activeMs;
}

// ---- Streak ----

export function updateStreak(streak: StreakData, sessionScore: number): StreakData {
  const today = new Date().toISOString().slice(0, 10);
  if (sessionScore < 40) return streak; // doesn't count

  if (streak.lastActiveDate === today) {
    return streak; // already counted today
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newCurrent: number;
  if (streak.lastActiveDate === yesterday) {
    newCurrent = streak.current + 1;
  } else {
    newCurrent = 1;
  }

  return {
    current: newCurrent,
    longest: Math.max(streak.longest, newCurrent),
    lastActiveDate: today,
  };
}

// ---- Lifetime Score ----

export function computeLifetimeScore(sessions: SessionData[]): number {
  if (sessions.length === 0) return 0;
  const recent = sessions.slice(-20);
  const sum = recent.reduce((acc, s) => acc + s.absorptionScore, 0);
  return Math.round(sum / recent.length);
}

export function getLevelTitle(score: number): string {
  if (score <= 25) return "Curious Browser";
  if (score <= 50) return "Active Reader";
  if (score <= 75) return "Deep Thinker";
  if (score <= 90) return "Philosophical Mind";
  return "Wisdom Seeker";
}

// ---- Badges ----

export const REQUIRED_FEATURES = ["dejargon", "notebook", "debate_prep", "study_mode", "so_what"];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_light",
    name: "First Light",
    description: "De-jargoned your first passage",
    icon: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
    target: 1,
    check: (s) => ({ earned: s.totalDejargonRequests >= 1, progress: Math.min(1, s.totalDejargonRequests) }),
  },
  {
    id: "creature_of_habit",
    name: "Creature of Habit",
    description: "3-day reading streak",
    icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z",
    target: 3,
    check: (s) => ({ earned: s.streak.current >= 3 || s.streak.longest >= 3, progress: Math.min(3, s.streak.current) }),
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "7-day reading streak",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    target: 7,
    check: (s) => ({ earned: s.streak.longest >= 7, progress: Math.min(7, s.streak.current) }),
  },
  {
    id: "month_of_wisdom",
    name: "Month of Wisdom",
    description: "30-day reading streak",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    target: 30,
    check: (s) => ({ earned: s.streak.longest >= 30, progress: Math.min(30, s.streak.current) }),
  },
  {
    id: "deep_diver",
    name: "Deep Diver",
    description: "Viewed Scholarly depth on 10 passages",
    icon: "M12 2L2 22h20L12 2zm0 4l7.53 14H4.47L12 6z",
    target: 10,
    check: (s) => ({ earned: s.totalScholarlyViews >= 10, progress: Math.min(10, s.totalScholarlyViews) }),
  },
  {
    id: "margin_scholar",
    name: "Margin Scholar",
    description: "Wrote 25 personal notes in notebook",
    icon: "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
    target: 25,
    check: (s) => ({ earned: s.totalNotesWritten >= 25, progress: Math.min(25, s.totalNotesWritten) }),
  },
  {
    id: "cross_pollinator",
    name: "Cross-Pollinator",
    description: "Read texts from 3 different branches",
    icon: "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 8v5l4.28 2.54.72-1.21-3.5-2.08V8H11z",
    target: 3,
    check: (s) => ({ earned: s.branchesRead.size >= 3, progress: Math.min(3, s.branchesRead.size) }),
  },
  {
    id: "whole_toolkit",
    name: "The Whole Toolkit",
    description: "Used every major feature at least once",
    icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    target: 5,
    check: (s) => {
      const count = REQUIRED_FEATURES.filter((f) => s.allFeaturesEverUsed.has(f)).length;
      return { earned: count >= REQUIRED_FEATURES.length, progress: count };
    },
  },
  {
    id: "century_club",
    name: "Century Club",
    description: "Scored above 80 on any single text",
    icon: "M6 9l6 6 6-6",
    target: 1,
    check: (s) => {
      const has = Object.values(s.textScores).some((t) => t.bestScore > 80);
      return { earned: has, progress: has ? 1 : 0 };
    },
  },
  {
    id: "debate_ready",
    name: "Debate Ready",
    description: "Used Debate Prep 5 times",
    icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    target: 5,
    check: (s) => ({ earned: s.totalDebatePrepUses >= 5, progress: Math.min(5, s.totalDebatePrepUses) }),
  },
  {
    id: "question_everything",
    name: "Question Everything",
    description: 'Used "So What?" on 10 different passages',
    icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0012 6.5 3.501 3.501 0 008.545 9h2.013A1.5 1.5 0 0112 8.5c.83 0 1.5.67 1.5 1.5 0 .66-.27 1.13-.71 1.49l-.86.72A3.31 3.31 0 0011 14.5h2c0-.93.42-1.44.97-1.89l.53-.45A3.08 3.08 0 0015.5 10 3.5 3.5 0 0013 13.355z",
    target: 10,
    check: (s) => ({ earned: s.totalSoWhatClicks >= 10, progress: Math.min(10, s.totalSoWhatClicks) }),
  },
  {
    id: "path_finder",
    name: "Path Finder",
    description: "Completed a guided reading path",
    icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z",
    target: 1,
    check: (s) => ({ earned: s.pathsCompleted >= 1, progress: Math.min(1, s.pathsCompleted) }),
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Had a reading session after 11 PM",
    icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    target: 1,
    check: (s) => {
      const has = s.sessions.some((sess) => {
        const h = new Date(sess.startTime).getHours();
        return h >= 23;
      });
      return { earned: has, progress: has ? 1 : 0 };
    },
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Had a reading session before 7 AM",
    icon: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    target: 1,
    check: (s) => {
      const has = s.sessions.some((sess) => {
        const h = new Date(sess.startTime).getHours();
        return h < 7;
      });
      return { earned: has, progress: has ? 1 : 0 };
    },
  },
  {
    id: "speed_reader_upgrade",
    name: "Speed Reader — Upgrade",
    description: "Read a text in under 10 min but scored above 60",
    icon: "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
    target: 1,
    check: (s) => {
      const has = s.sessions.some((sess) => {
        const mins = (new Date(sess.endTime).getTime() - new Date(sess.startTime).getTime()) / 60000;
        return mins < 10 && sess.absorptionScore > 60;
      });
      return { earned: has, progress: has ? 1 : 0 };
    },
  },
];

export function checkBadges(state: BadgeCheckState): Record<string, BadgeProgress> {
  const result: Record<string, BadgeProgress> = {};
  for (const badge of BADGE_DEFINITIONS) {
    const existing = state.badges[badge.id];
    if (existing?.earned) {
      result[badge.id] = existing;
      continue;
    }
    const { earned, progress } = badge.check(state);
    result[badge.id] = {
      earned,
      earnedDate: earned ? new Date().toISOString() : null,
      progress,
      target: badge.target,
    };
  }
  return result;
}

// ---- Session Summary Helpers ----

export function getSessionHighlights(session: SessionData): string[] {
  const highlights: string[] = [];
  if (session.signals.dejargonRequests > 0) {
    highlights.push(`You de-jargoned ${session.signals.dejargonRequests} passage${session.signals.dejargonRequests > 1 ? "s" : ""}`);
  }
  if (session.signals.personalNotesWritten > 0) {
    highlights.push(`You wrote ${session.signals.personalNotesWritten} personal note${session.signals.personalNotesWritten > 1 ? "s" : ""}`);
  }
  const totalDepthLayers = session.signals.depthLayersViewed.plain + session.signals.depthLayersViewed.conceptual + session.signals.depthLayersViewed.scholarly;
  if (session.signals.depthLayersViewed.scholarly > 0 && totalDepthLayers > 3) {
    highlights.push("You explored all 3 depth layers");
  }
  if (session.signals.featuresUsed.includes("debate_prep")) {
    highlights.push("You used Debate Prep");
  }
  if (session.signals.featuresUsed.includes("so_what")) {
    highlights.push('You used "So What?"');
  }
  if (session.signals.notebookSaves > 0) {
    highlights.push(`You saved ${session.signals.notebookSaves} notebook entr${session.signals.notebookSaves > 1 ? "ies" : "y"}`);
  }
  if (session.signals.activeRecallActions > 0 && highlights.length < 2) {
    highlights.push(`You used ${session.signals.activeRecallActions} active recall tool${session.signals.activeRecallActions > 1 ? "s" : ""}`);
  }
  return highlights.slice(0, 2);
}

// ---- UUID ----

export function generateId(): string {
  return "sess_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
