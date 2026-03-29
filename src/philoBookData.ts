// PhiloBook — data types, localStorage persistence, and migration from old Notebook

export type PhiloBookItemType = "quote" | "annotation" | "dejargon" | "debate_prep" | "study_package";

export interface PhiloBookItem {
  id: string;
  type: PhiloBookItemType;
  createdAt: string; // ISO timestamp
  sourceTextId: string;
  sourceTextTitle: string;
  sourceAuthor: string;
  data: QuoteData | AnnotationData | DeJargonData | DebatePrepData | StudyPackageData;
}

export interface QuoteData {
  quotedText: string;
}

export interface AnnotationData {
  highlightedText: string;
  annotationText: string;
  highlightColor: string;
  underlined: boolean;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
}

export interface DeJargonData {
  originalText: string;
  dejargonedText: string;
  depthLayer: "plain" | "conceptual" | "scholarly";
  tone: "coffee_shop" | "office_hours";
  soWhatText: string | null;
  userNote: string;
}

export interface DebatePrepData {
  originalText: string;
  result: string;
}

export interface StudyPackageData {
  originalText: string;
  result: string;
  author?: string;
  title?: string;
}

// Persistent highlight data for reading view
export interface PersistentHighlight {
  id: string;
  type: "annotation" | "quote";
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  color: string;
  underline: boolean;
  annotationText: string | null;
  timestamp: string;
}

export interface PhiloBookStorage {
  items: PhiloBookItem[];
}

export interface HighlightStorage {
  [textId: string]: PersistentHighlight[];
}

// Highlight color palette
export const HIGHLIGHT_COLORS = [
  { name: "Warm Amber", value: "rgba(196, 164, 92, 0.25)", solid: "rgb(196, 164, 92)" },
  { name: "Sage Green", value: "rgba(120, 148, 120, 0.25)", solid: "rgb(120, 148, 120)" },
  { name: "Muted Rose", value: "rgba(176, 122, 122, 0.25)", solid: "rgb(176, 122, 122)" },
  { name: "Dusty Blue", value: "rgba(118, 140, 168, 0.25)", solid: "rgb(118, 140, 168)" },
  { name: "Warm Terracotta", value: "rgba(186, 130, 100, 0.25)", solid: "rgb(186, 130, 100)" },
];

export const DEFAULT_QUOTE_COLOR = "rgba(196, 164, 92, 0.15)";

// Type border colors for PhiloBook cards
export const TYPE_BORDER_COLORS: Record<PhiloBookItemType, string> = {
  quote: "border-l-[rgb(196,164,92)]",
  annotation: "", // uses the item's highlight color
  dejargon: "border-l-terracotta",
  debate_prep: "border-l-[rgb(120,148,120)]",
  study_package: "border-l-[rgb(118,140,168)]",
};

// ---- localStorage helpers ----

const PHILOBOOK_KEY = "philos_book";
const HIGHLIGHTS_KEY = "philos_highlights";
const OLD_NOTEBOOK_KEY = "philos_notebook"; // for migration

export function loadPhiloBook(): PhiloBookStorage {
  try {
    const raw = localStorage.getItem(PHILOBOOK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Try migrating old notebook data
  const migrated = migrateOldNotebook();
  if (migrated.items.length > 0) {
    savePhiloBook(migrated);
  }
  return migrated;
}

export function savePhiloBook(storage: PhiloBookStorage): void {
  localStorage.setItem(PHILOBOOK_KEY, JSON.stringify(storage));
}

export function loadHighlights(): HighlightStorage {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveHighlights(storage: HighlightStorage): void {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(storage));
}

// ---- Migration from old Notebook ----

interface OldNotebookEntry {
  id: string;
  originalText: string;
  explanation: string;
  depthLevel: string;
  source: string;
  author: string;
  timestamp: string;
  userNote: string;
}

function migrateOldNotebook(): PhiloBookStorage {
  try {
    const raw = localStorage.getItem(OLD_NOTEBOOK_KEY);
    if (!raw) return { items: [] };
    const entries: OldNotebookEntry[] = JSON.parse(raw);
    const items: PhiloBookItem[] = entries.map((e) => ({
      id: e.id,
      type: "dejargon" as const,
      createdAt: e.timestamp || new Date().toISOString(),
      sourceTextId: "",
      sourceTextTitle: e.source,
      sourceAuthor: e.author,
      data: {
        originalText: e.originalText,
        dejargonedText: e.explanation,
        depthLayer: (e.depthLevel || "plain") as "plain" | "conceptual" | "scholarly",
        tone: "office_hours" as const,
        soWhatText: null,
        userNote: e.userNote || "",
      } satisfies DeJargonData,
    }));
    // Remove old data after migration
    localStorage.removeItem(OLD_NOTEBOOK_KEY);
    return { items };
  } catch {
    return { items: [] };
  }
}

// ---- Helper: generate UUID ----

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
