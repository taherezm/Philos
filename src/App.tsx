import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { CatalogEntry, UnifiedText, DebateEntry, ConceptDNAEntry } from "./types";
import { useAbsorptionTracker } from "./useAbsorptionTracker";
import { MyProgressView } from "./MyProgress";
import { SessionEndCard } from "./SessionEndCard";
import { TaxonomyRoadmap } from "./TaxonomyRoadmap";
import { PhiloBookPage } from "./PhiloBook";
import { InlineVisualWrapper } from "./InlineVisuals";
import { getVisualsForText, type VisualPlacement } from "./visualPlacements";
import {
  type PhiloBookStorage, type PhiloBookItem, type PhiloBookItemType,
  type PersistentHighlight, type HighlightStorage, type AnnotationData,
  loadPhiloBook, savePhiloBook, loadHighlights, saveHighlights,
  generateId, HIGHLIGHT_COLORS, DEFAULT_QUOTE_COLOR,
} from "./philoBookData";

type ToneMode = "coffee_shop" | "office_hours";
type DepthLevel = "plain" | "conceptual" | "scholarly";
type AppView = "landing" | "reading" | "philobook" | "debates" | "debate-detail" | "roadmap" | "study-mode" | "progress";

interface Bookmark {
  id: string;
  paragraphId: number;
  textId: string;
  textTitle: string;
  preview: string;
  timestamp: Date;
}

interface DeJargonResult {
  plain: string;
  conceptual: string;
  scholarly: string;
}

const SYSTEM_PROMPT = (tone: ToneMode) => `You are the de-jargon engine for Philos, a philosophy reading app. Your job is to make dense philosophical text clear and accessible while preserving the intellectual substance of the ideas.

TONE: ${tone}

${
  tone === "coffee_shop"
    ? `- Write like a smart, well-read friend explaining something over coffee
- Use "you" and direct address naturally
- Keep sentences short and varied in length
- Use concrete analogies and examples from everyday life when they genuinely help
- It's okay to say "basically" or "in plain terms" once, but don't overuse these crutches
- Be warm but not patronizing`
    : `- Write like an engaging philosophy professor in office hours
- Include relevant philosophical context: who is this thinker responding to? What tradition does this belong to? What's the broader debate?
- Use more structured explanation, but never lecture-style walls of text
- You can reference other thinkers by name when it adds genuine understanding
- Be intellectually generous -- assume the reader is smart but unfamiliar with the jargon`
}

FOR BOTH TONES -- ABSOLUTE RULES:
1. NEVER use these words/phrases: "essentially," "fundamentally," "it's worth noting," "it bears mentioning," "let's unpack," "delve into," "at its core," "in other words" (more than once), "simply put," "when we really think about it"
2. NEVER use more than one em dash per paragraph. Prefer commas, periods, or semicolons.
3. NEVER start a paragraph with "So," or "Now,"
4. NEVER use rhetorical questions that you immediately answer ("But what does this mean? It means...")
5. NEVER use the phrase "This is important because" -- just show why it's important through your explanation
6. Vary your sentence length. Mix short punchy sentences with longer ones. Read your output out loud in your head -- does it sound like a real person wrote it, or like an AI generated it?
7. Preserve the PHILOSOPHER'S voice in your explanation. When explaining William James, be slightly energetic and direct (James was). When explaining Seneca, be more aphoristic and coaching. When explaining Kant, be more methodical. The de-jargon should hint at the thinker's personality.
8. If a term is genuinely important philosophical vocabulary the reader SHOULD learn, keep it but define it clearly in context. Don't strip away all technical language -- give the reader the tools to use it themselves.
9. Keep explanations concise. For a single sentence or short passage, respond in 2-4 sentences. For a full paragraph, respond in 4-8 sentences. Never be longer than the original passage.
10. Do not begin your response with any greeting, preamble, or meta-commentary. Jump straight into the explanation.`;

function App() {
  // ---- State ----
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [currentText, setCurrentText] = useState<UnifiedText | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [allDebates, setAllDebates] = useState<DebateEntry[]>([]);

  const [tone, setTone] = useState<ToneMode>(() => (localStorage.getItem("philos_tone") as ToneMode) || "office_hours");
  const [view, setView] = useState<AppView>(() => (localStorage.getItem("philos_onboarded") ? "reading" : "landing"));
  const [selectedText, setSelectedText] = useState("");
  const [showDeJargon, setShowDeJargon] = useState(false);
  const [deJargonResult, setDeJargonResult] = useState<DeJargonResult | null>(null);
  const [activeDepth, setActiveDepth] = useState<DepthLevel>("plain");
  const [isLoading, setIsLoading] = useState(false);
  const [floatingBtn, setFloatingBtn] = useState<{ x: number; y: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [philoBook, setPhiloBook] = useState<PhiloBookStorage>(() => loadPhiloBook());
  const [highlights, setHighlights] = useState<HighlightStorage>(() => loadHighlights());
  const [showAnnotationUI, setShowAnnotationUI] = useState(false);
  const [annotationColor, setAnnotationColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [annotationUnderline, setAnnotationUnderline] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const [highlightToolbarMode, setHighlightToolbarMode] = useState<"toolbar" | "annotate" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [argumentCardOpen, setArgumentCardOpen] = useState(false);
  const [textCollapsed, setTextCollapsed] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("philos_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("philos_dark") === "true");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try { return JSON.parse(localStorage.getItem("philos_bookmarks") || "[]").map((b: any) => ({ ...b, timestamp: new Date(b.timestamp) })); } catch { return []; }
  });
  const [activeDebate, setActiveDebate] = useState<DebateEntry | null>(null);
  const [conceptPopover, setConceptPopover] = useState<{ term: string; x: number; y: number } | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [studyText, setStudyText] = useState("");
  const [studyResult, setStudyResult] = useState<string | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [soWhatResult, setSoWhatResult] = useState<string | null>(null);
  const [soWhatLoading, setSoWhatLoading] = useState(false);
  const [debatePrepResult, setDebatePrepResult] = useState<string | null>(null);
  const [debatePrepLoading, setDebatePrepLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const readingRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ---- Absorption Tracker ----
  const tracker = useAbsorptionTracker();
  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;

  // ---- Persist preferences ----
  useEffect(() => { if (apiKey) localStorage.setItem("philos_api_key", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("philos_dark", String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem("philos_tone", tone); }, [tone]);
  useEffect(() => { localStorage.setItem("philos_bookmarks", JSON.stringify(bookmarks)); }, [bookmarks]);

  // Dark mode class on html
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ---- Data loading ----
  const loadText = useCallback(async (relativePath: string) => {
    setTextLoading(true);
    try {
      const cleanPath = relativePath.replace(/\.md$/, "");
      const res = await fetch(`/api/text?path=${encodeURIComponent(cleanPath)}`);
      if (!res.ok) return;
      const data: UnifiedText = await res.json();
      if (!data.meta) return;
      setCurrentText(data);
      // Start absorption tracking session
      trackerRef.current.startSession(data.meta.id, data.meta.title, data.meta.author, data.meta.branch, data.meta.school);
      navigate("reading");
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Failed to load text:", err);
    } finally {
      setTextLoading(false);
    }
  }, []);

  // Fetch catalog, debates, guided paths on mount
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: CatalogEntry[]) => {
        setCatalog(data);
        // Auto-load the first enriched text (Will to Believe) after onboarding
        if (localStorage.getItem("philos_onboarded")) {
          const enriched = data.find((c) => c.hasEnrichedMetadata);
          if (enriched) {
            loadText(enriched.relativePath);
          }
        }
      })
      .catch((err) => console.error("Failed to load catalog:", err));

    fetch("/api/debates")
      .then((r) => r.json())
      .then((data: DebateEntry[]) => setAllDebates(data))
      .catch((err) => console.error("Failed to load debates:", err));

  }, [loadText]);

  // ---- Build concept highlight lookup from current text ----
  const conceptHighlightMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    if (currentText?.meta.conceptHighlights) {
      for (const ch of currentText.meta.conceptHighlights) {
        map[ch.term] = ch.paragraphIds;
      }
    }
    return map;
  }, [currentText]);

  // ---- Inline visual aids for current text ----
  const textVisuals = useMemo(() => {
    if (!currentText) return new Map<number, VisualPlacement[]>();
    const visuals = getVisualsForText(currentText.meta.id);
    const map = new Map<number, VisualPlacement[]>();
    for (const v of visuals) {
      const existing = map.get(v.afterParagraph) || [];
      existing.push(v);
      map.set(v.afterParagraph, existing);
    }
    return map;
  }, [currentText]);

  // ---- Handle text selection (only in reading view) ----
  const handleMouseUp = useCallback(() => {
    if (view !== "reading") return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTimeout(() => { if (!showDeJargon) setFloatingBtn(null); }, 200);
      return;
    }
    // Only allow selection within reading text
    const readingEl = readingRef.current;
    if (!readingEl) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !readingEl.contains(anchorNode)) return;

    const text = selection.toString().trim();
    if (text.length < 10) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectedText(text);
    setFloatingBtn({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  }, [showDeJargon, view]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);
    return () => { document.removeEventListener("mouseup", handleMouseUp); document.removeEventListener("touchend", handleMouseUp); };
  }, [handleMouseUp]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowDeJargon(false); setFloatingBtn(null); setConceptPopover(null); }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const callDeJargon = async () => {
    if (!apiKey) { setShowApiKeyInput(true); return; }
    if (!currentText) return;
    setShowDeJargon(true);
    setIsLoading(true);
    setDeJargonResult(null);
    setSoWhatResult(null);
    setDebatePrepResult(null);
    setFloatingBtn(null);
    setActiveDepth("plain");
    // Track de-jargon request
    tracker.recordDejargon(currentText.meta.id, 0, selectedText.length);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT(tone),
          messages: [{ role: "user", content: `De-jargon the following passage from "${currentText.meta.author}" (from the text "${currentText.meta.title}").\n\nProvide THREE versions at different depth levels. Respond ONLY in this exact JSON format with no other text:\n\n{\n  "plain": "The most accessible explanation. No jargon. Clear and direct.",\n  "conceptual": "Adds philosophical context: the argument structure, the tradition, who the thinker is responding to. Still clear but richer.",\n  "scholarly": "Near-original density but with key terms defined in parentheses and the argument structure made explicit. For readers who want to understand the text as written."\n}\n\nThe passage:\n"${selectedText}"` }],
        }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || "API request failed"); }
      const data = await response.json();
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) { setDeJargonResult(JSON.parse(jsonMatch[0])); }
      else { setDeJargonResult({ plain: content, conceptual: content, scholarly: content }); }
    } catch (err: any) {
      setDeJargonResult({ plain: `Error: ${err.message}. Please check your API key and try again.`, conceptual: `Error: ${err.message}`, scholarly: `Error: ${err.message}` });
    } finally { setIsLoading(false); }
  };

  const callSoWhat = async () => {
    if (!apiKey || !deJargonResult || !currentText) return;
    setSoWhatLoading(true);
    setSoWhatResult(null);
    tracker.recordActiveRecall("so_what");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: `You explain why old philosophical ideas still matter today. Be specific and concrete. Give 2-3 modern examples or applications. ${tone === "coffee_shop" ? "Write conversationally." : "Write with intellectual depth but stay accessible."}`,
          messages: [{ role: "user", content: `This passage is from ${currentText.meta.author}'s "${currentText.meta.title}" (${currentText.meta.year ?? "date unknown"}):\n\n"${selectedText}"\n\nExplain why this idea still matters today. Give specific modern examples -- technology, politics, relationships, science, whatever fits best. Be concrete, not abstract. 3-5 sentences.` }],
        }),
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setSoWhatResult(data.content[0].text);
    } catch (err: any) { setSoWhatResult(`Error: ${err.message}`); }
    finally { setSoWhatLoading(false); }
  };

  const callDebatePrep = async () => {
    if (!apiKey || !deJargonResult || !currentText) return;
    setDebatePrepLoading(true);
    setDebatePrepResult(null);
    tracker.recordActiveRecall("debate_prep");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `You are a debate coach preparing someone to argue about philosophical ideas. Be practical and punchy. ${tone === "coffee_shop" ? "Keep it casual and energizing." : "Be thorough but engaging."}`,
          messages: [{ role: "user", content: `This passage is from ${currentText.meta.author}'s "${currentText.meta.title}":\n\n"${selectedText}"\n\nPrepare me to debate this idea tomorrow. Give me:\n1. THE ARGUMENT IN ONE SENTENCE (what the philosopher is really saying)\n2. YOUR STRONGEST MOVE (the most convincing way to defend this position)\n3. THE BEST COUNTERARGUMENT (what an opponent would say)\n4. YOUR COMEBACK (how to respond to that counterargument)\n5. A KILLER EXAMPLE (a concrete real-world case that supports this idea)\n\nKeep each section to 1-2 sentences. Be direct.` }],
        }),
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setDebatePrepResult(data.content[0].text);
    } catch (err: any) { setDebatePrepResult(`Error: ${err.message}`); }
    finally { setDebatePrepLoading(false); }
  };

  const callStudyMode = async () => {
    if (!apiKey || !studyText.trim()) return;
    setStudyLoading(true);
    setStudyResult(null);
    tracker.recordActiveRecall("study_mode");
    tracker.recordFeatureUsed("study_mode");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: `You create study packages for philosophical texts. Be thorough but clear. ${tone === "coffee_shop" ? "Write in an approachable, friendly tone." : "Write with academic rigor but remain accessible."}`,
          messages: [{ role: "user", content: `Create a study package for this text:\n\n"${studyText}"\n\nProvide:\n1. SUMMARY (3-4 sentences capturing the core argument)\n2. KEY TERMS (list any important philosophical terms with brief definitions)\n3. THE ARGUMENT STRUCTURE (break down the logical moves being made)\n4. CRITICAL QUESTIONS (3 questions this text raises that you should think about)\n5. CONNECTIONS (how does this relate to other philosophical ideas or thinkers?)` }],
        }),
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setStudyResult(data.content[0].text);
    } catch (err: any) { setStudyResult(`Error: ${err.message}`); }
    finally { setStudyLoading(false); }
  };

  const saveToPhiloBook = (type: PhiloBookItemType = "dejargon", extraData?: Partial<PhiloBookItem>) => {
    if (!currentText) return;
    const base: Omit<PhiloBookItem, "data"> = {
      id: generateId(),
      type,
      createdAt: new Date().toISOString(),
      sourceTextId: currentText.meta.id,
      sourceTextTitle: currentText.meta.title,
      sourceAuthor: currentText.meta.author,
    };
    let item: PhiloBookItem;
    if (type === "dejargon" && deJargonResult) {
      item = { ...base, type: "dejargon", data: { originalText: selectedText, dejargonedText: deJargonResult[activeDepth], depthLayer: activeDepth as any, tone, soWhatText: soWhatResult, userNote: saveNote } };
    } else if (type === "quote") {
      item = { ...base, type: "quote", data: { quotedText: selectedText } };
    } else if (type === "debate_prep" && debatePrepResult) {
      item = { ...base, type: "debate_prep", data: { originalText: selectedText, result: debatePrepResult } };
    } else if (type === "study_package" && studyResult) {
      item = { ...base, type: "study_package", data: { originalText: studyText, result: studyResult, author: currentText.meta.author, title: currentText.meta.title } };
    } else if (extraData) {
      item = { ...base, ...extraData } as PhiloBookItem;
    } else return;
    setPhiloBook((prev) => {
      const updated = { items: [item, ...prev.items] };
      savePhiloBook(updated);
      return updated;
    });
    tracker.recordNotebookSave(saveNote.trim().length > 0, saveNote.length, type === "dejargon" ? "dejargon" : type === "debate_prep" ? "debate_prep" : "study_package");
    setSaveNote("");
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
    showToast(type === "quote" ? "Saved to PhiloBook" : type === "dejargon" ? "Saved to PhiloBook" : "Saved to PhiloBook");
  };

  const saveQuote = () => {
    if (!selectedText || !currentText) return;
    saveToPhiloBook("quote");
    setFloatingBtn(null);
    setHighlightToolbarMode(null);
    // Save as persistent highlight
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      savePersistentHighlight("quote", DEFAULT_QUOTE_COLOR, false, null);
    }
  };

  const saveAnnotation = () => {
    if (!selectedText || !currentText) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    savePersistentHighlight("annotation", annotationColor, annotationUnderline, annotationText || null);
    const item: PhiloBookItem = {
      id: generateId(), type: "annotation", createdAt: new Date().toISOString(),
      sourceTextId: currentText.meta.id, sourceTextTitle: currentText.meta.title, sourceAuthor: currentText.meta.author,
      data: { highlightedText: selectedText, annotationText, highlightColor: annotationColor, underlined: annotationUnderline, paragraphIndex: 0, startOffset: 0, endOffset: 0 } as AnnotationData,
    };
    setPhiloBook((prev) => {
      const updated = { items: [item, ...prev.items] };
      savePhiloBook(updated);
      return updated;
    });
    setAnnotationText("");
    setHighlightToolbarMode(null);
    setFloatingBtn(null);
    showToast("Annotation saved to PhiloBook");
  };

  const savePersistentHighlight = (type: "annotation" | "quote", color: string, underline: boolean, annotation: string | null) => {
    if (!currentText) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    // Find paragraph index
    const readingEl = readingRef.current;
    if (!readingEl) return;
    const paraEls = readingEl.querySelectorAll("[data-para-id]");
    let paraIndex = -1;
    let startOffset = 0;
    let endOffset = 0;
    for (let i = 0; i < paraEls.length; i++) {
      if (paraEls[i].contains(range.startContainer)) {
        paraIndex = parseInt(paraEls[i].getAttribute("data-para-id") || "-1");
        // Calculate text offsets
        const treeWalker = document.createTreeWalker(paraEls[i], NodeFilter.SHOW_TEXT);
        let offset = 0;
        let node: Node | null;
        while ((node = treeWalker.nextNode())) {
          if (node === range.startContainer) { startOffset = offset + range.startOffset; }
          if (node === range.endContainer) { endOffset = offset + range.endOffset; break; }
          offset += (node.textContent || "").length;
        }
        break;
      }
    }
    if (paraIndex < 0) return;
    const hl: PersistentHighlight = {
      id: generateId(), type, paragraphIndex: paraIndex, startOffset, endOffset,
      color, underline, annotationText: annotation, timestamp: new Date().toISOString(),
    };
    setHighlights((prev) => {
      const textId = currentText!.meta.id;
      const updated = { ...prev, [textId]: [...(prev[textId] || []), hl] };
      saveHighlights(updated);
      return updated;
    });
    sel.removeAllRanges();
  };

  const deletePhiloBookItem = (id: string) => {
    setPhiloBook((prev) => {
      const updated = { items: prev.items.filter((i) => i.id !== id) };
      savePhiloBook(updated);
      return updated;
    });
  };

  const updatePhiloBookItem = (id: string, data: PhiloBookItem["data"]) => {
    setPhiloBook((prev) => {
      const updated = { items: prev.items.map((i) => i.id === id ? { ...i, data } : i) };
      savePhiloBook(updated);
      return updated;
    });
    showToast("Updated");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const toggleBookmark = (paraId: number) => {
    if (!currentText) return;
    const existing = bookmarks.find((b) => b.paragraphId === paraId && b.textId === currentText.meta.id);
    if (existing) {
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      const para = currentText.paragraphs.find((p) => p.id === paraId);
      if (!para) return;
      setBookmarks((prev) => [...prev, {
        id: Date.now().toString(), paragraphId: paraId, textId: currentText.meta.id,
        textTitle: currentText.meta.title, preview: para.text.slice(0, 120), timestamp: new Date(),
      }]);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("philos_onboarded", "true");
    // Load default text
    const enriched = catalog.find((c) => c.hasEnrichedMetadata);
    if (enriched) {
      loadText(enriched.relativePath);
    } else {
      setView("reading");
    }
  };

  const navigate = (newView: AppView) => {
    // End tracking session when leaving reading view
    if (view === "reading" && newView !== "reading" && tracker.isSessionActive) {
      tracker.endSession();
    }
    setView(newView);
    setSidebarOpen(false);
    setShowDeJargon(false);
    setFloatingBtn(null);
    setActiveConcept(null);
  };

  // Track depth changes when user clicks depth tabs
  const handleDepthChange = (depth: DepthLevel) => {
    setActiveDepth(depth);
    tracker.recordDepthChange(depth);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const bg = darkMode ? "bg-[#1a1a1a]" : "bg-cream";
  const text = darkMode ? "text-[#e0ddd8]" : "text-charcoal";
  const textMuted = darkMode ? "text-[#9a9590]" : "text-charcoal-light";
  const textFaint = darkMode ? "text-[#6a6560]" : "text-charcoal-lighter";
  const border = darkMode ? "border-[#333]" : "border-cream-darker/50";
  const cardBg = darkMode ? "bg-[#242424]" : "bg-cream-dark/40";
  const cardBgHover = darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-cream-dark";
  const inputBg = darkMode ? "bg-[#2a2a2a] border-[#444]" : "bg-white border-cream-darker";
  const headerBg = darkMode ? "bg-[#1a1a1a]/95" : "bg-cream/95";

  // ---- Landing / Onboarding ----
  if (view === "landing") {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-6`}>
        <div className="max-w-lg w-full">
          {onboardingStep === 0 && (
            <div className="text-center animate-page-enter">
              <h1 className={`text-4xl sm:text-5xl font-semibold ${text} mb-4`} style={{ fontFamily: "var(--font-serif)" }}>
                Philos
              </h1>
              <p className={`text-lg ${textMuted} mb-2`} style={{ fontFamily: "var(--font-serif)" }}>
                Philosophy made readable.
              </p>
              <p className={`text-sm ${textFaint} mb-10 max-w-sm mx-auto`}>
                Read the great texts. Highlight anything confusing. Get clear, layered explanations powered by AI.
              </p>
              <button
                onClick={() => setOnboardingStep(1)}
                className="btn-primary px-8 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta-dark transition-colors text-sm"
              >
                Get Started
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="animate-page-enter">
              <p className={`text-xs font-medium uppercase tracking-wider text-terracotta mb-6 text-center`}>How it works</p>
              <div className="space-y-3">
                {[
                  { icon: "1", title: "Read", desc: "Browse curated primary texts from the philosophical canon." },
                  { icon: "2", title: "Highlight", desc: "Select any passage that feels dense or confusing." },
                  { icon: "3", title: "Understand", desc: "Get AI-powered explanations at three depth levels: Plain, Conceptual, and Scholarly." },
                ].map((step, i) => (
                  <div
                    key={step.icon}
                    className={`flex items-start gap-4 ${cardBg} rounded-xl p-4`}
                    style={{ animation: `pageEnter 300ms var(--ease-out) ${i * 60}ms both` }}
                  >
                    <span className="w-8 h-8 rounded-full bg-terracotta/15 text-terracotta flex items-center justify-center text-sm font-semibold shrink-0">
                      {step.icon}
                    </span>
                    <div>
                      <h3 className={`text-sm font-semibold ${text} mb-0.5`}>{step.title}</h3>
                      <p className={`text-sm ${textMuted}`}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ethical guardrails callout */}
              <div
                className="mt-5 flex gap-3 rounded-xl bg-terracotta/10 border border-terracotta/20 px-4 py-3"
                style={{ animation: "pageEnter 300ms var(--ease-out) 200ms both" }}
              >
                <svg className="shrink-0 mt-0.5 text-terracotta" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-terracotta mb-0.5 tracking-wide">Philosophical Guardrails</p>
                  <p className={`text-xs ${textMuted} leading-relaxed`}>
                    Philos is designed to enhance your critical thinking, not replace it. Our AI provides context and clarity, but the final interpretation is always yours.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOnboardingStep(2)}
                className="btn-primary w-full mt-5 px-6 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta-dark transition-colors text-sm"
                style={{ animation: "pageEnter 300ms var(--ease-out) 260ms both" }}
              >
                Next
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="animate-page-enter">
              <p className={`text-xs font-medium uppercase tracking-wider text-terracotta mb-2 text-center`}>Customize your experience</p>
              <p className={`text-sm ${textMuted} mb-6 text-center`}>How would you like explanations delivered?</p>
              <div className="space-y-3">
                <button
                  onClick={() => setTone("coffee_shop")}
                  className={`card-interactive w-full text-left p-4 rounded-xl border-2 ${
                    tone === "coffee_shop" ? "border-terracotta " + cardBg : (darkMode ? "border-[#333]" : "border-cream-darker/30") + " " + cardBg
                  }`}
                  style={{ animation: "pageEnter 280ms var(--ease-out) 60ms both" }}
                >
                  <h3 className={`text-sm font-semibold ${text} mb-1`}>Coffee Shop</h3>
                  <p className={`text-xs ${textMuted}`}>Like a smart friend explaining things casually. Concrete analogies, everyday language, warm tone.</p>
                </button>
                <button
                  onClick={() => setTone("office_hours")}
                  className={`card-interactive w-full text-left p-4 rounded-xl border-2 ${
                    tone === "office_hours" ? "border-terracotta " + cardBg : (darkMode ? "border-[#333]" : "border-cream-darker/30") + " " + cardBg
                  }`}
                  style={{ animation: "pageEnter 280ms var(--ease-out) 120ms both" }}
                >
                  <h3 className={`text-sm font-semibold ${text} mb-1`}>Office Hours</h3>
                  <p className={`text-xs ${textMuted}`}>Like an engaging professor. More context, philosophical tradition, structured explanations.</p>
                </button>
              </div>
              <button
                onClick={() => setOnboardingStep(3)}
                className="btn-primary w-full mt-8 px-6 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta-dark transition-colors text-sm"
                style={{ animation: "pageEnter 280ms var(--ease-out) 180ms both" }}
              >
                Next
              </button>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="animate-page-enter">
              <p className={`text-xs font-medium uppercase tracking-wider text-terracotta mb-2 text-center`}>Almost there</p>
              <p className={`text-sm ${textMuted} mb-6 text-center`}>To power the de-jargon engine, you'll need a Claude API key.</p>
              <div className={`${cardBg} rounded-xl p-4`} style={{ animation: "pageEnter 280ms var(--ease-out) 80ms both" }}>
                <label className={`text-xs ${textFaint} block mb-2`}>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className={`w-full px-3 py-2 text-sm ${inputBg} rounded-lg focus:outline-none focus:border-terracotta/50 transition-colors`}
                />
                <p className={`text-xs ${textFaint} mt-2`}>Stored locally. Never sent anywhere except the Anthropic API.</p>
              </div>
              <button
                onClick={finishOnboarding}
                className="btn-primary w-full mt-6 px-6 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta-dark transition-colors text-sm"
                style={{ animation: "pageEnter 280ms var(--ease-out) 160ms both" }}
              >
                {apiKey ? "Start Reading" : "Skip for Now"}
              </button>
              <p className={`text-xs ${textFaint} text-center mt-3`}>You can add your API key later in settings.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Main App Shell ----
  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-40 ${headerBg} backdrop-blur-sm border-b ${border}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`btn-icon p-2 -ml-2 rounded-lg ${cardBgHover} lg:hidden`}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
            </button>
            <PhilosLogo text={text} onClick={() => navigate("reading")} />
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient engagement indicator */}
            {tracker.isSessionActive && (
              <span
                className="ambient-dot"
                style={{
                  backgroundColor: "var(--color-terracotta)",
                  opacity: tracker.engagementLevel === "active" ? 1 : tracker.engagementLevel === "reading" ? 0.5 : 0.15,
                }}
                title={tracker.engagementLevel === "active" ? "Actively engaging" : tracker.engagementLevel === "reading" ? "Reading" : "Idle"}
              />
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`btn-icon p-2 rounded-lg ${cardBgHover} ${textFaint}`}
              aria-label="Toggle dark mode"
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`btn-icon p-2 rounded-lg ${cardBgHover} ${textFaint}`}
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className={`border-t ${border} ${darkMode ? "bg-[#222]" : "bg-cream-dark/50"} animate-slide-down`}>
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center gap-3 max-w-lg">
                <label className={`text-xs ${textMuted} whitespace-nowrap`}>API Key:</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..."
                  className={`flex-1 px-3 py-1.5 text-sm ${inputBg} rounded-lg focus:outline-none focus:border-terracotta/50 transition-colors ${text}`} />
                <button onClick={() => setShowApiKeyInput(false)} className="text-xs text-terracotta font-medium hover:text-terracotta-dark transition-colors">Done</button>
              </div>
              <p className={`text-xs ${textFaint} mt-1.5`}>Your key is stored locally and never sent anywhere except the Anthropic API.</p>
            </div>
          </div>
        )}

      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 ${bg} border-r ${border} overflow-y-auto transition-transform duration-[220ms] ease-[var(--ease-out)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="p-5">
            {/* Navigation */}
            <nav className="mb-6">
              {([
                { id: "reading" as AppView, label: "Browse", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
                { id: "roadmap" as AppView, label: "Guided Paths", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 17l4-4 4 4 4-4 4 4"/><path d="M3 7l4-4 4 4 4-4 4 4"/></svg> },
                { id: "debates" as AppView, label: "Debates", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { id: "study-mode" as AppView, label: "Study Mode", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
                { id: "progress" as AppView, label: "My Progress", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
                { id: "philobook" as AppView, label: "PhiloBook", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/></svg> },
              ]).map((item) => (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`sidebar-item relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left mb-0.5 transition-all duration-150 ${
                    view === item.id
                      ? "bg-terracotta/10 text-terracotta font-medium"
                      : `${textMuted} hover:${darkMode ? "text-[#c8c4be]" : "text-charcoal"}`
                  }`}>
                  <span className={`transition-colors duration-150 ${view === item.id ? "text-terracotta" : ""}`}>{item.icon}</span>
                  {item.label}
                  {view === item.id && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-terracotta rounded-r" />
                  )}
                </button>
              ))}
            </nav>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div className="mb-6">
                <h2 className={`text-xs font-semibold uppercase tracking-wider ${textFaint} mb-3`}>Bookmarks</h2>
                <div className="space-y-1">
                  {bookmarks.slice(0, 5).map((bm) => (
                    <button key={bm.id} onClick={() => { navigate("reading"); setTimeout(() => { const el = document.getElementById(`para-${bm.paragraphId}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100); }}
                      className={`sidebar-item w-full text-left px-3 py-2 rounded-lg text-xs ${textMuted} line-clamp-2`}>
                      &para;{bm.paragraphId}: {bm.preview}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Taxonomy - catalog-driven */}
            <h2 className={`text-xs font-semibold uppercase tracking-wider ${textFaint} mb-3`}>Taxonomy</h2>
            <CatalogSidebar
              catalog={catalog}
              currentText={currentText}
              darkMode={darkMode}
              textMuted={textMuted}
              textFaint={textFaint}
              textColor={text}
              cardBg={cardBg}
              onTextClick={loadText}
            />

            {/* Tone — subtle at bottom */}
            <div className={`mt-6 pt-4 border-t ${darkMode ? "border-[#333]/50" : "border-cream-darker/40"}`}>
              <button
                onClick={() => setTone(tone === "coffee_shop" ? "office_hours" : "coffee_shop")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${textFaint} ${darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-cream-dark/60"} transition-colors`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {tone === "coffee_shop" ? (
                    <><path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>
                  ) : (
                    <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>
                  )}
                </svg>
                <span>{tone === "coffee_shop" ? "Coffee Shop" : "Office Hours"}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/20 lg:hidden animate-[fadeIn_200ms_ease] backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 transition-[margin] duration-[240ms] ease-[var(--ease-out)] ${(showDeJargon || activeConcept) && !isMobile ? "mr-[400px]" : ""}`}>
          {/* ---- Reading View ---- */}
          {view === "reading" && (
            <div className="animate-page-enter max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
              {textLoading ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <svg className="loading-spin text-terracotta/50" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <p className={`text-sm ${textMuted}`} style={{ fontFamily: "var(--font-serif)" }}>Loading text…</p>
                </div>
              ) : !currentText ? (
                <div className={`${cardBg} rounded-xl p-8 border ${border} text-center`}>
                  <div className={textFaint + " mb-3"}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <h2 className={`text-lg font-semibold ${text} mb-2`}>Select a text to begin</h2>
                  <p className={`text-sm ${textMuted} max-w-sm mx-auto`}>
                    Choose a text from the sidebar to start reading. Enriched texts include introductions, argument cards, and concept highlighting.
                  </p>
                </div>
              ) : (
                <>
                  {/* Text Header */}
                  <div className="mb-10">
                    <p className="text-xs font-medium uppercase tracking-wider text-terracotta mb-2">
                      {currentText.meta.branch} / {currentText.meta.school}
                    </p>
                    <h1 className={`text-3xl sm:text-4xl font-semibold ${text} mb-2 leading-tight`} style={{ fontFamily: "var(--font-serif)" }}>
                      {currentText.meta.title}
                    </h1>
                    <p className={`text-base ${textMuted}`} style={{ fontFamily: "var(--font-sans)" }}>
                      {currentText.meta.author}{currentText.meta.year != null ? `, ${currentText.meta.year}` : ""}
                    </p>
                  </div>

                  {/* Introduction - only if present */}
                  {currentText.meta.introduction != null && (
                    <p className={`text-base leading-relaxed ${textMuted} mb-8 pb-8 border-b ${border}`} style={{ fontFamily: "var(--font-sans)" }}>
                      {currentText.meta.introduction}
                    </p>
                  )}

                  {/* Argument at a Glance - only if present */}
                  {currentText.meta.argumentCard != null && (
                    <div className="mb-6">
                      <button onClick={() => setArgumentCardOpen(!argumentCardOpen)}
                        className={`w-full flex items-center justify-between ${darkMode ? "bg-[#242424]" : "bg-cream-dark/70"} rounded-xl px-5 py-4 ${cardBgHover} transition-colors duration-150`}>
                        <span className={`text-sm font-medium ${text}`}>Argument at a Glance</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                          className={`${textFaint} transition-transform duration-200 ${argumentCardOpen ? "rotate-180" : ""}`}>
                          <path d="M4 6l4 4 4-4" />
                        </svg>
                      </button>
                      {argumentCardOpen && (
                        <div className={`${cardBg} rounded-b-xl px-5 py-5 -mt-2 pt-6 space-y-4 animate-[expandDown_220ms_var(--ease-out)]`}>
                          {[
                            { label: "The Central Question", content: currentText.meta.argumentCard!.centralQuestion },
                            { label: "The Thesis", content: currentText.meta.argumentCard!.thesis },
                          ].map((item) => (
                            <div key={item.label}>
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1.5">{item.label}</h3>
                              <p className={`text-sm leading-relaxed ${text}`} style={{ fontFamily: "var(--font-serif)" }}>{item.content}</p>
                            </div>
                          ))}
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1.5">The Key Moves</h3>
                            <ul className="space-y-1.5">
                              {currentText.meta.argumentCard!.keyMoves.map((move, i) => (
                                <li key={i} className={`text-sm leading-relaxed ${text} flex gap-2`} style={{ fontFamily: "var(--font-serif)" }}>
                                  <span className="text-terracotta/60 mt-0.5 shrink-0">&bull;</span><span>{move}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1.5">The Strongest Objection</h3>
                            <p className={`text-sm leading-relaxed ${text}`} style={{ fontFamily: "var(--font-serif)" }}>{currentText.meta.argumentCard!.strongestObjection}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Concept DNA - only if present */}
                  {currentText.meta.conceptDNA && currentText.meta.conceptDNA.length > 0 && (
                    <div className="mb-6">
                      <button
                        onClick={() => setActiveConcept(activeConcept ? null : currentText.meta.conceptDNA![0].term)}
                        className={`w-full flex items-center justify-between ${darkMode ? "bg-[#242424]" : "bg-cream-dark/70"} rounded-xl px-5 py-4 ${cardBgHover} transition-colors duration-200`}
                      >
                        <span className={`text-sm font-medium ${text}`}>Concept DNA</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${textFaint}`}>{currentText.meta.conceptDNA!.length} terms</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                            className={`${textFaint} transition-transform duration-200 ${activeConcept ? "rotate-180" : ""}`}>
                            <path d="M4 6l4 4 4-4" />
                          </svg>
                        </div>
                      </button>
                      {!activeConcept && (
                        <div className={`${cardBg} rounded-b-xl px-5 py-4 -mt-2 pt-5 animate-[fadeIn_200ms_ease]`}>
                          <p className={`text-xs ${textMuted} mb-3`}>Key philosophical terms in this text. Click to explore, or find them <span className="border-b-2 border-dotted border-terracotta/50">dotted-underlined</span> in the text.</p>
                          <div className="flex flex-wrap gap-2">
                            {currentText.meta.conceptDNA!.map((c) => (
                              <button
                                key={c.term}
                                onClick={() => setActiveConcept(c.term)}
                                className={`text-xs px-3 py-1.5 rounded-lg border ${border} ${cardBg} ${text} hover:border-terracotta/40 transition-colors`}
                              >
                                {c.displayTerm}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary Text (Collapsible) */}
                  <div className="mb-6">
                    <button onClick={() => setTextCollapsed(!textCollapsed)}
                      className={`w-full flex items-center justify-between ${darkMode ? "bg-[#242424]" : "bg-cream-dark/70"} rounded-xl px-5 py-4 ${cardBgHover} transition-colors duration-200`}>
                      <span className={`text-sm font-medium ${text}`}>Primary Text</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                        className={`${textFaint} transition-transform duration-200 ${!textCollapsed ? "rotate-180" : ""}`}>
                        <path d="M4 6l4 4 4-4" />
                      </svg>
                    </button>
                  </div>

                  {!textCollapsed && (
                    <div ref={(el) => { (readingRef as any).current = el; tracker.paragraphObserverRef(el); }} className={`reading-text ${darkMode ? "text-[#e0ddd8]" : ""}`}>
                      {currentText.paragraphs.map((para) => (
                        <div key={para.id}>
                          <div id={`para-${para.id}`} data-para-id={para.id} className="relative group">
                            {para.section && (
                              <h2 className={`text-lg font-semibold ${text} mt-10 mb-4 tracking-tight`} style={{ fontFamily: "var(--font-serif)" }}>
                                {para.section}
                              </h2>
                            )}
                            <div className="flex">
                              <span className={`hidden sm:block w-8 shrink-0 text-right pr-3 text-xs ${textFaint}/50 pt-1.5 select-none`}>
                                {para.id}
                              </span>
                              <p className="flex-1">{renderParagraphWithConcepts(para.text, para.id, setConceptPopover, setActiveConcept, conceptHighlightMap, currentText.meta.conceptDNA)}</p>
                              {/* Bookmark button */}
                              <button
                                onClick={() => toggleBookmark(para.id)}
                                className={`hidden sm:block ml-2 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                                  bookmarks.some((b) => b.paragraphId === para.id && b.textId === currentText.meta.id) ? "opacity-100 text-terracotta" : textFaint
                                }`}
                                aria-label="Bookmark"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarks.some((b) => b.paragraphId === para.id && b.textId === currentText.meta.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {/* Inline visual aids after this paragraph */}
                          {textVisuals.get(para.id)?.map((v, vi) => (
                            <InlineVisualWrapper
                              key={`visual-${para.id}-${vi}`}
                              visual={v}
                              darkMode={darkMode}
                              textMuted={textMuted}
                              textFaint={textFaint}
                              cardBg={cardBg}
                              border={border}
                              onExpand={() => tracker.recordDejargonClose()}
                              onCollapse={() => {}}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ---- PhiloBook View ---- */}
          {view === "philobook" && (
            <div className="animate-page-enter">
              <PhiloBookPage storage={philoBook} onDelete={deletePhiloBookItem} onUpdate={updatePhiloBookItem} darkMode={darkMode} text={text} textMuted={textMuted} textFaint={textFaint} cardBg={cardBg} border={border} />
            </div>
          )}

          {/* ---- Debates View ---- */}
          {view === "debates" && (
            <div className="animate-page-enter max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
              <h1 className={`text-2xl font-semibold ${text} mb-2`} style={{ fontFamily: "var(--font-serif)" }}>Philosopher vs. Philosopher</h1>
              <p className={`text-sm ${textMuted} mb-8`}>See the great debates play out. Pick a side — or don't.</p>
              <div className="space-y-3">
                {allDebates.map((debate, i) => (
                  <button key={debate.id} onClick={() => { setActiveDebate(debate); setView("debate-detail"); }}
                    className={`card-interactive w-full text-left ${cardBg} rounded-xl p-5 border ${border}`}
                    style={{ animation: `pageEnter 280ms var(--ease-out) ${Math.min(i * 40, 240)}ms both` }}
                  >
                    <h3 className={`text-base font-semibold ${text} mb-1`} style={{ fontFamily: "var(--font-serif)" }}>{debate.title}</h3>
                    <p className={`text-sm ${textMuted}`}>{debate.subtitle}</p>
                    <div className={`flex items-center gap-2 mt-3 text-xs ${textFaint}`}>
                      <span>{debate.philosopher1.name}</span>
                      <span className="text-terracotta">vs.</span>
                      <span>{debate.philosopher2.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---- Debate Detail View ---- */}
          {view === "debate-detail" && activeDebate && (
            <div className="animate-page-enter max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
              <button onClick={() => { setView("debates"); setActiveDebate(null); }}
                className={`text-sm ${textMuted} mb-6 flex items-center gap-1.5 hover:text-terracotta transition-colors duration-150`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4l-4 4 4 4"/></svg>
                Back to Debates
              </button>
              <h1 className={`text-2xl font-semibold ${text} mb-1`} style={{ fontFamily: "var(--font-serif)" }}>{activeDebate.title}</h1>
              <p className={`text-sm ${textMuted} mb-8`}>{activeDebate.subtitle}</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[activeDebate.philosopher1, activeDebate.philosopher2].map((phil, idx) => (
                  <div key={idx} className={`${cardBg} rounded-xl p-5 border ${border}`} style={{ animation: `pageEnter 280ms var(--ease-out) ${idx * 80}ms both` }}>
                    <h3 className={`text-sm font-semibold text-terracotta mb-2`}>{phil.name}</h3>
                    <p className={`text-sm ${text} mb-3`} style={{ fontFamily: "var(--font-serif)" }}>{phil.position}</p>
                    <blockquote className={`text-xs italic ${textMuted} border-l-2 border-terracotta/30 pl-3 mb-4`}>
                      "{phil.keyQuote}"
                    </blockquote>
                    <ul className="space-y-2">
                      {phil.arguments.map((arg, i) => (
                        <li key={i} className={`text-sm ${textMuted} flex gap-2`}>
                          <span className="text-terracotta/50 shrink-0">&bull;</span><span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className={`${cardBg} rounded-xl p-5 border ${border} mb-4`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">What's at Stake</h3>
                <p className={`text-sm ${text} leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>{activeDebate.stakes}</p>
              </div>
              <div className={`${cardBg} rounded-xl p-5 border ${border}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">Your Turn</h3>
                <p className={`text-sm ${text} leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>{activeDebate.yourTurn}</p>
              </div>
            </div>
          )}

          {/* ---- Taxonomy Roadmap ---- */}
          {view === "roadmap" && (
            <div className="animate-page-enter">
            <TaxonomyRoadmap
              completedTextIds={new Set(
                Object.entries(tracker.storage.philos_text_scores)
                  .filter(([, ts]) => ts.bestScore > 50)
                  .map(([id]) => id)
              )}
              currentTextId={currentText?.meta.id || null}
              onSelectText={(catalogId) => {
                const entry = catalog.find((c) => c.id === catalogId || c.relativePath.toLowerCase().includes(catalogId.toLowerCase()));
                if (entry) loadText(entry.relativePath);
              }}
              darkMode={darkMode}
              text={text}
              textMuted={textMuted}
              textFaint={textFaint}
              cardBg={cardBg}
              border={border}
            />
            </div>
          )}

          {/* ---- My Progress ---- */}
          {view === "progress" && (
            <div className="animate-page-enter">
            <MyProgressView
              storage={tracker.storage}
              darkMode={darkMode}
              text={text}
              textMuted={textMuted}
              textFaint={textFaint}
              cardBg={cardBg}
              border={border}
            />
            </div>
          )}

          {/* ---- Study Mode (BYOT) ---- */}
          {view === "study-mode" && (
            <div className="animate-page-enter max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
              <h1 className={`text-2xl font-semibold ${text} mb-2`} style={{ fontFamily: "var(--font-serif)" }}>Study Mode</h1>
              <p className={`text-sm ${textMuted} mb-8`}>Paste any philosophical text. Get an AI-generated study package.</p>

              <textarea
                value={studyText}
                onChange={(e) => setStudyText(e.target.value)}
                placeholder="Paste a philosophical passage here..."
                rows={8}
                className={`w-full px-4 py-3 text-sm ${inputBg} ${text} rounded-xl focus:outline-none focus:border-terracotta/50 transition-colors resize-none mb-4`}
                style={{ fontFamily: "var(--font-serif)" }}
              />
              <button
                onClick={callStudyMode}
                disabled={studyLoading || !studyText.trim()}
                className={`btn-primary px-6 py-2.5 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {studyLoading ? "Generating..." : "Generate Study Package"}
              </button>

              {studyResult && (
                <div className={`mt-8 ${cardBg} rounded-xl p-6 border ${border} animate-[fadeIn_300ms_ease]`}>
                  <div className={`text-sm leading-relaxed ${text} whitespace-pre-wrap`} style={{ fontFamily: "var(--font-serif)" }}>
                    {studyResult}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Highlight Toolbar */}
        {floatingBtn && !showDeJargon && highlightToolbarMode !== "annotate" && (
          <div className="fixed z-50 -translate-x-1/2 -translate-y-full animate-scale-in flex items-center gap-0.5 bg-charcoal rounded-lg shadow-xl p-1"
            style={{ left: floatingBtn.x, top: floatingBtn.y }}>
            <button onClick={callDeJargon}
              className="px-3 py-1.5 text-white text-xs font-medium rounded-md hover:bg-white/10 transition-colors" title="De-jargon this passage">
              De-jargon
            </button>
            <div className="w-px h-5 bg-white/20" />
            <button onClick={() => { setHighlightToolbarMode("annotate"); setShowAnnotationUI(true); }}
              className="px-3 py-1.5 text-white text-xs font-medium rounded-md hover:bg-white/10 transition-colors" title="Annotate">
              Annotate
            </button>
            <div className="w-px h-5 bg-white/20" />
            <button onClick={saveQuote}
              className="px-3 py-1.5 text-white text-xs font-medium rounded-md hover:bg-white/10 transition-colors" title="Save as quote">
              Quote
            </button>
          </div>
        )}

        {/* Annotation UI */}
        {highlightToolbarMode === "annotate" && floatingBtn && (
          <div className={`fixed z-50 -translate-x-1/2 w-72 animate-scale-in ${darkMode ? "bg-[#2a2a2a] border-[#444]" : "bg-white border-cream-darker"} border rounded-xl shadow-2xl p-4`}
            style={{ left: Math.min(Math.max(floatingBtn.x, 160), window.innerWidth - 160), top: floatingBtn.y + 10 }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${textFaint}`}>Annotate</span>
              <button onClick={() => { setHighlightToolbarMode(null); setAnnotationText(""); setShowAnnotationUI(false); }}
                className={`p-0.5 rounded ${textFaint} hover:${text}`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
            {/* Color picker */}
            <div className="flex items-center gap-2 mb-3">
              {HIGHLIGHT_COLORS.map((c) => (
                <button key={c.name} onClick={() => setAnnotationColor(c.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${annotationColor === c.value ? "border-terracotta scale-110" : `${darkMode ? "border-[#555]" : "border-cream-darker"}`}`}
                  style={{ backgroundColor: c.solid }} title={c.name} />
              ))}
              <button onClick={() => setAnnotationUnderline(!annotationUnderline)}
                className={`ml-auto px-2 py-0.5 text-xs rounded ${annotationUnderline ? "bg-terracotta text-white" : `${darkMode ? "bg-[#333] text-[#aaa]" : "bg-cream-dark text-charcoal-light"}`} transition-colors`}>
                U̲
              </button>
            </div>
            {/* Note textarea */}
            <textarea value={annotationText} onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="Add a note (optional)..."
              className={`w-full px-3 py-2 text-sm ${darkMode ? "bg-[#222] text-[#ddd]" : "bg-cream-dark text-charcoal"} rounded-lg focus:outline-none resize-none mb-3`} rows={2} />
            <div className="flex gap-2">
              <button onClick={saveAnnotation}
                className="btn-primary flex-1 px-3 py-1.5 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors">
                Save
              </button>
              <button onClick={() => { setHighlightToolbarMode(null); setAnnotationText(""); setShowAnnotationUI(false); }}
                className={`px-3 py-1.5 text-sm ${textMuted} rounded-lg ${darkMode ? "hover:bg-[#333]" : "hover:bg-cream-dark"} transition-colors`}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toastMessage && (
          <div className="toast fixed bottom-6 left-1/2 z-50 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg shadow-xl">
            {toastMessage}
          </div>
        )}

        {/* Concept DNA Popover */}
        {conceptPopover && currentText?.meta.conceptDNA && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setConceptPopover(null)} />
            <div
              className={`fixed z-50 w-80 ${darkMode ? "bg-[#2a2a2a] border-[#444]" : "bg-white border-cream-darker"} border rounded-xl shadow-2xl p-4 animate-scale-in`}
              style={{ left: Math.min(conceptPopover.x, window.innerWidth - 340), top: conceptPopover.y + 20 }}
            >
              {(() => {
                const concept = currentText.meta.conceptDNA!.find((c) => c.term === conceptPopover.term);
                if (!concept) return null;
                return (
                  <>
                    <h3 className={`text-sm font-semibold ${text} mb-1`}>{concept.displayTerm}</h3>
                    <p className={`text-xs ${textMuted} mb-2`}>{concept.origin}</p>
                    <p className={`text-sm ${text} leading-relaxed mb-3`} style={{ fontFamily: "var(--font-serif)" }}>{concept.definition}</p>
                    <div className="flex flex-wrap gap-1">
                      {concept.relatedTerms.map((rt) => (
                        <span key={rt} className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-[#333]" : "bg-cream-dark"} ${textFaint}`}>{rt}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* De-jargon Panel - Desktop */}
        {showDeJargon && !isMobile && (
          <div ref={panelRef}
            className={`dejargon-panel panel-enter fixed top-14 right-0 z-30 w-[400px] h-[calc(100vh-3.5rem)] ${bg} border-l ${border} overflow-y-auto`}>
            <DeJargonPanelContent
              isLoading={isLoading} result={deJargonResult} activeDepth={activeDepth} setActiveDepth={handleDepthChange}
              selectedText={selectedText} onClose={() => { setShowDeJargon(false); setDeJargonResult(null); setSoWhatResult(null); setDebatePrepResult(null); tracker.recordDejargonClose(); }}
              onSave={() => saveToPhiloBook("dejargon")} saveNote={saveNote} setSaveNote={setSaveNote} showSaveSuccess={showSaveSuccess}
              darkMode={darkMode} text={text} textMuted={textMuted} textFaint={textFaint} cardBg={cardBg} border={border} inputBg={inputBg}
              soWhatResult={soWhatResult} soWhatLoading={soWhatLoading} onSoWhat={callSoWhat}
              debatePrepResult={debatePrepResult} debatePrepLoading={debatePrepLoading} onDebatePrep={callDebatePrep}
              apiKey={apiKey}
            />
          </div>
        )}

        {/* De-jargon Panel - Mobile (Bottom Sheet) */}
        {showDeJargon && isMobile && (
          <>
            <div className="bottom-sheet-overlay fixed inset-0 z-40 bg-black/30"
              onClick={() => { setShowDeJargon(false); setDeJargonResult(null); setSoWhatResult(null); setDebatePrepResult(null); tracker.recordDejargonClose(); }} />
            <div className={`panel-enter-mobile fixed bottom-0 left-0 right-0 z-50 ${bg} rounded-t-2xl max-h-[70vh] overflow-y-auto shadow-2xl`}>
              <div className={`w-10 h-1 ${darkMode ? "bg-[#444]" : "bg-cream-darker"} rounded-full mx-auto mt-3 mb-1`} />
              <DeJargonPanelContent
                isLoading={isLoading} result={deJargonResult} activeDepth={activeDepth} setActiveDepth={handleDepthChange}
                selectedText={selectedText} onClose={() => { setShowDeJargon(false); setDeJargonResult(null); setSoWhatResult(null); setDebatePrepResult(null); tracker.recordDejargonClose(); }}
                onSave={() => saveToPhiloBook("dejargon")} saveNote={saveNote} setSaveNote={setSaveNote} showSaveSuccess={showSaveSuccess}
                darkMode={darkMode} text={text} textMuted={textMuted} textFaint={textFaint} cardBg={cardBg} border={border} inputBg={inputBg}
                soWhatResult={soWhatResult} soWhatLoading={soWhatLoading} onSoWhat={callSoWhat}
                debatePrepResult={debatePrepResult} debatePrepLoading={debatePrepLoading} onDebatePrep={callDebatePrep}
                apiKey={apiKey}
              />
            </div>
          </>
        )}

        {/* Concept DNA Panel - Desktop */}
        {activeConcept && !showDeJargon && !isMobile && currentText?.meta.conceptDNA && (
          <div className={`dejargon-panel panel-enter fixed top-14 right-0 z-30 w-[400px] h-[calc(100vh-3.5rem)] ${bg} border-l ${border} overflow-y-auto`}>
            <ConceptDNAPanel
              conceptDNA={currentText.meta.conceptDNA}
              activeTerm={activeConcept}
              onClose={() => setActiveConcept(null)}
              onTermClick={(term) => setActiveConcept(term)}
              darkMode={darkMode}
              text={text}
              textMuted={textMuted}
              textFaint={textFaint}
              cardBg={cardBg}
              border={border}
            />
          </div>
        )}

        {/* Reading Progress Bar */}
        <ReadingProgressBar visible={view === "reading" && !!currentText} panelOpen={(showDeJargon || (!!activeConcept && !showDeJargon)) && !isMobile} darkMode={darkMode} />

        {/* Session End Card */}
        {tracker.sessionEndData && (
          <SessionEndCard
            data={tracker.sessionEndData}
            onDismiss={tracker.dismissSessionEnd}
            onViewProgress={() => { tracker.dismissSessionEnd(); navigate("progress"); }}
            darkMode={darkMode}
            text={text}
            textMuted={textMuted}
            textFaint={textFaint}
            cardBg={cardBg}
            border={border}
          />
        )}
      </div>
    </div>
  );
}

/* ---- Catalog-driven Sidebar ---- */

interface CatalogSidebarProps {
  catalog: CatalogEntry[];
  currentText: UnifiedText | null;
  darkMode: boolean;
  textMuted: string;
  textFaint: string;
  textColor: string;
  cardBg: string;
  onTextClick: (relativePath: string) => void;
}

function CatalogSidebar({ catalog, currentText, darkMode, textMuted, textFaint, textColor, onTextClick }: CatalogSidebarProps) {
  // Build nested index: Branch -> School -> Author -> entries[]
  const tree = useMemo(() => {
    const index: Record<string, Record<string, Record<string, CatalogEntry[]>>> = {};
    for (const entry of catalog) {
      if (!index[entry.branch]) index[entry.branch] = {};
      if (!index[entry.branch][entry.school]) index[entry.branch][entry.school] = {};
      if (!index[entry.branch][entry.school][entry.author]) index[entry.branch][entry.school][entry.author] = [];
      index[entry.branch][entry.school][entry.author].push(entry);
    }
    return index;
  }, [catalog]);

  const branches = Object.keys(tree).sort();
  const activeBranch = currentText?.meta.branch || "";

  return (
    <nav>
      {branches.map((branch) => (
        <BranchNode
          key={branch}
          branch={branch}
          schools={tree[branch]}
          defaultOpen={branch === activeBranch || branch === "Epistemology"}
          currentTextId={currentText?.meta.id || null}
          darkMode={darkMode}
          textMuted={textMuted}
          textFaint={textFaint}
          textColor={textColor}
          onTextClick={onTextClick}
        />
      ))}
    </nav>
  );
}

function BranchNode({ branch, schools, defaultOpen, currentTextId, darkMode, textMuted, textFaint, textColor, onTextClick }: {
  branch: string;
  schools: Record<string, Record<string, CatalogEntry[]>>;
  defaultOpen: boolean;
  currentTextId: string | null;
  darkMode: boolean;
  textMuted: string;
  textFaint: string;
  textColor: string;
  onTextClick: (relativePath: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const schoolNames = Object.keys(schools).sort();
  const hasCurrent = schoolNames.some((s) =>
    Object.values(schools[s]).some((entries) => entries.some((e) => e.id === currentTextId))
  );

  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)}
        className={`sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left`}>
        <span className={hasCurrent ? `${textColor} font-medium` : textMuted}>{branch}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`${textFaint} transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
        </svg>
      </button>
      <div className={`tree-children ${open ? "open" : ""}`}>
        <div className="tree-children-inner">
          <div className={`ml-3 pl-3 border-l ${darkMode ? "border-[#333]" : "border-cream-darker/60"}`}>
            {schoolNames.map((school) => (
              <SchoolNode
                key={school}
                school={school}
                authors={schools[school]}
                currentTextId={currentTextId}
                darkMode={darkMode}
                textMuted={textMuted}
                textFaint={textFaint}
                textColor={textColor}
                onTextClick={onTextClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SchoolNode({ school, authors, currentTextId, darkMode, textMuted, textFaint, textColor, onTextClick }: {
  school: string;
  authors: Record<string, CatalogEntry[]>;
  currentTextId: string | null;
  darkMode: boolean;
  textMuted: string;
  textFaint: string;
  textColor: string;
  onTextClick: (relativePath: string) => void;
}) {
  const hasCurrent = Object.values(authors).some((entries) => entries.some((e) => e.id === currentTextId));
  const [open, setOpen] = useState(hasCurrent);
  const authorNames = Object.keys(authors).sort();

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`sidebar-item w-full flex items-center justify-between text-left px-3 py-1.5 text-sm rounded-lg ${hasCurrent ? textColor + " font-medium" : textMuted + " hover:text-terracotta"} transition-colors cursor-pointer`}
      >
        <span>{school}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`${textFaint} transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
        </svg>
      </button>
      <div className={`tree-children ${open ? "open" : ""}`}>
        <div className="tree-children-inner">
        <div className={`ml-3 pl-3 border-l ${darkMode ? "border-[#333]" : "border-cream-darker/60"} mb-1`}>
          {authorNames.map((author) => {
            const entries = authors[author];
            if (entries.length === 1) {
              // Single text by this author: show "Author - Title" directly
              const entry = entries[0];
              const isActive = entry.id === currentTextId;
              return (
                <button
                  key={entry.id}
                  onClick={() => onTextClick(entry.relativePath)}
                  className={`sidebar-item w-full text-left px-3 py-1.5 text-sm rounded-lg ${isActive ? "bg-terracotta/8 text-terracotta font-medium" : textMuted + " hover:text-terracotta"} transition-colors cursor-pointer`}
                >
                  {author} &mdash; {entry.title}
                </button>
              );
            }
            // Multiple texts by this author: collapsible author node
            return (
              <AuthorNode
                key={author}
                author={author}
                entries={entries}
                currentTextId={currentTextId}
                darkMode={darkMode}
                textMuted={textMuted}
                textFaint={textFaint}
                textColor={textColor}
                onTextClick={onTextClick}
              />
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

function AuthorNode({ author, entries, currentTextId, darkMode, textMuted, textFaint, textColor, onTextClick }: {
  author: string;
  entries: CatalogEntry[];
  currentTextId: string | null;
  darkMode: boolean;
  textMuted: string;
  textFaint: string;
  textColor: string;
  onTextClick: (relativePath: string) => void;
}) {
  const hasCurrent = entries.some((e) => e.id === currentTextId);
  const [open, setOpen] = useState(hasCurrent);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`sidebar-item w-full flex items-center justify-between text-left px-3 py-1.5 text-sm rounded-lg ${hasCurrent ? textColor + " font-medium" : textMuted + " hover:text-terracotta"} transition-colors cursor-pointer`}
      >
        <span>{author}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`${textFaint} transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
          <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
        </svg>
      </button>
      {open && (
        <div className={`ml-3 pl-3 border-l ${darkMode ? "border-[#333]" : "border-cream-darker/60"} mb-1`}>
          {entries.map((entry) => {
            const isActive = entry.id === currentTextId;
            return (
              <button
                key={entry.id}
                onClick={() => onTextClick(entry.relativePath)}
                className={`sidebar-item w-full text-left px-3 py-1.5 text-sm rounded-lg ${isActive ? "bg-terracotta/8 text-terracotta font-medium" : textMuted + " hover:text-terracotta"} transition-colors cursor-pointer`}
              >
                {entry.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Helper: Render paragraph with Concept DNA highlights ---- */
function renderParagraphWithConcepts(
  text: string,
  paraId: number,
  _setConceptPopover: (p: { term: string; x: number; y: number } | null) => void,
  setActiveConcept: (term: string | null) => void,
  conceptHighlightMap: Record<string, number[]>,
  conceptDNA: ConceptDNAEntry[] | null | undefined,
) {
  if (!conceptDNA || Object.keys(conceptHighlightMap).length === 0) return text;

  // Find concepts that appear in this paragraph
  const relevantTerms = Object.entries(conceptHighlightMap)
    .filter(([, paraIds]) => paraIds.includes(paraId))
    .map(([term]) => term);

  if (relevantTerms.length === 0) return text;

  // Build a keyword map from the concept DNA entries for this text
  const termKeywords: Record<string, string> = {};
  for (const entry of conceptDNA) {
    termKeywords[entry.term] = entry.term;
  }

  // Hardcoded keyword overrides for known terms
  const knownKeywords: Record<string, string> = {
    "hypothesis": "hypothesis",
    "genuine option": "genuine option",
    "passional nature": "passional nature",
    "clifford's rule": "Clifford",
    "objective evidence": "objective evidence",
    "pragmatism": "pragmatism",
    "pascal's wager": "Pascal",
    "empiricism": "empiricist",
    "absolutism": "absolutist",
    "volition": "willing nature",
    "forced option": "forced",
    "dupery": "dupery",
  };

  for (const [t, kw] of Object.entries(knownKeywords)) {
    termKeywords[t] = kw;
  }

  // Build matches for all relevant terms
  const matches: { start: number; end: number; term: string }[] = [];
  for (const term of relevantTerms) {
    const keyword = termKeywords[term] || term;
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx >= 0) {
      // Only add if it doesn't overlap with an existing match
      const overlap = matches.some((m) => idx < m.end && idx + keyword.length > m.start);
      if (!overlap) {
        matches.push({ start: idx, end: idx + keyword.length, term });
      }
    }
  }

  if (matches.length === 0) return text;

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Build fragments
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      parts.push(text.slice(cursor, m.start));
    }
    const matchText = text.slice(m.start, m.end);
    parts.push(
      <span
        key={`${m.term}-${m.start}`}
        className="border-b-2 border-dotted border-terracotta/50 cursor-pointer hover:bg-terracotta/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setActiveConcept(m.term);
        }}
      >
        {matchText}
      </span>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

/* ---- Sub-components ---- */

function DeJargonPanelContent({
  isLoading, result, activeDepth, setActiveDepth, selectedText, onClose, onSave,
  saveNote, setSaveNote, showSaveSuccess, darkMode, text, textMuted, textFaint, cardBg, border, inputBg,
  soWhatResult, soWhatLoading, onSoWhat, debatePrepResult, debatePrepLoading, onDebatePrep, apiKey,
}: {
  isLoading: boolean; result: DeJargonResult | null; activeDepth: DepthLevel; setActiveDepth: (d: DepthLevel) => void;
  selectedText: string; onClose: () => void; onSave: () => void; saveNote: string; setSaveNote: (s: string) => void;
  showSaveSuccess: boolean; darkMode: boolean; text: string; textMuted: string; textFaint: string; cardBg: string; border: string; inputBg: string;
  soWhatResult: string | null; soWhatLoading: boolean; onSoWhat: () => void;
  debatePrepResult: string | null; debatePrepLoading: boolean; onDebatePrep: () => void;
  apiKey: string;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${text}`}>De-jargoned</h3>
        <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-[#333]" : "hover:bg-cream-dark"} transition-colors duration-150 ${textFaint}`} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>

      <div className={`${darkMode ? "bg-[#2a2a2a]" : "bg-highlight/40"} rounded-lg px-4 py-3 mb-4 border-l-2 border-terracotta/40`}>
        <p className={`text-xs ${textMuted} line-clamp-3`} style={{ fontFamily: "var(--font-serif)" }}>
          &ldquo;{selectedText.slice(0, 200)}{selectedText.length > 200 ? "..." : ""}&rdquo;
        </p>
      </div>

      <div className={`flex gap-1 p-1 rounded-lg mb-5 ${darkMode ? "bg-[#2a2a2a]" : "bg-cream-dark/60"}`}>
        {(["plain", "conceptual", "scholarly"] as DepthLevel[]).map((depth) => (
          <button key={depth} onClick={() => setActiveDepth(depth)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
              activeDepth === depth
                ? "bg-terracotta text-white shadow-sm"
                : `${darkMode ? "text-[#888] hover:text-[#bbb]" : "text-charcoal-light hover:text-charcoal"}`
            }`}>
            {depth.charAt(0).toUpperCase() + depth.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center gap-3">
          <svg className="loading-spin text-terracotta/50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p className={`text-sm ${textMuted}`} style={{ fontFamily: "var(--font-serif)" }}>Reading the passage…</p>
        </div>
      ) : result ? (
        <>
          <div className={`explanation-text mb-6 ${darkMode ? "text-[#e0ddd8]" : ""}`}>
            {result[activeDepth].split("\n").map((p, i) => (<p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>))}
          </div>

          {/* Action buttons: So What? + Debate Prep */}
          {apiKey && (
            <div className={`flex gap-2 mb-4`}>
              <button onClick={onSoWhat} disabled={soWhatLoading}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border ${border} ${cardBg} ${text} hover:border-terracotta/50 transition-colors disabled:opacity-50`}>
                {soWhatLoading ? "Thinking..." : "So What?"}
              </button>
              <button onClick={onDebatePrep} disabled={debatePrepLoading}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border ${border} ${cardBg} ${text} hover:border-terracotta/50 transition-colors disabled:opacity-50`}>
                {debatePrepLoading ? "Prepping..." : "Debate Prep"}
              </button>
            </div>
          )}

          {/* So What? Result */}
          {soWhatResult && (
            <div className={`${cardBg} rounded-lg p-4 mb-4 border ${border} animate-[fadeIn_200ms_ease]`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">Why It Still Matters</h4>
              <p className={`text-sm leading-relaxed ${text}`} style={{ fontFamily: "var(--font-serif)" }}>{soWhatResult}</p>
            </div>
          )}

          {/* Debate Prep Result */}
          {debatePrepResult && (
            <div className={`${cardBg} rounded-lg p-4 mb-4 border ${border} animate-[fadeIn_200ms_ease]`}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">Debate Prep</h4>
              <div className={`text-sm leading-relaxed ${text} whitespace-pre-wrap`} style={{ fontFamily: "var(--font-serif)" }}>{debatePrepResult}</div>
            </div>
          )}

          {/* Save to PhiloBook */}
          <div className={`border-t ${border} pt-4`}>
            <textarea value={saveNote} onChange={(e) => setSaveNote(e.target.value)} placeholder="Add a note (optional)..."
              className={`w-full px-3 py-2 text-sm ${inputBg} ${text} rounded-lg focus:outline-none focus:border-terracotta/40 resize-none transition-colors`} rows={2} />
            <button onClick={onSave}
              className="btn-primary mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors">
              {showSaveSuccess ? "✓ Saved" : "Save to PhiloBook"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---- Reading Progress Bar ---- */

function ReadingProgressBar({ visible, panelOpen, darkMode }: { visible: boolean; panelOpen: boolean; darkMode: boolean }) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    // Fade in after a brief delay
    const timer = setTimeout(() => setShow(true), 50);

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          setProgress(Math.min(scrollTop / docHeight, 1));
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [visible]);

  if (!visible && !show) return null;

  return (
    <div
      className="fixed top-0 z-20"
      style={{
        right: panelOpen ? 400 : 0,
        width: 4,
        height: "100vh",
        backgroundColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(44,44,44,0.10)",
        opacity: show ? 1 : 0,
        transition: show ? "opacity 300ms ease" : "opacity 200ms ease",
      }}
    >
      <div
        style={{
          width: 4,
          height: `${progress * 100}%`,
          backgroundColor: darkMode ? "rgba(193,124,90,0.7)" : "rgba(193,124,90,0.8)",
          borderRadius: "0 0 2px 2px",
          transition: "height 150ms ease-out",
        }}
      />
    </div>
  );
}

/* ---- Concept DNA Panel ---- */

function ConceptDNAPanel({
  conceptDNA, activeTerm, onClose, onTermClick, darkMode, text, textMuted, textFaint, cardBg, border,
}: {
  conceptDNA: ConceptDNAEntry[];
  activeTerm: string;
  onClose: () => void;
  onTermClick: (term: string) => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}) {
  const concept = conceptDNA.find((c) => c.term === activeTerm);
  if (!concept) return null;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${text}`}>Concept DNA</h3>
        <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-[#333]" : "hover:bg-cream-dark"} transition-colors duration-150 ${textFaint}`} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>

      {/* Term header */}
      <div className={`${darkMode ? "bg-[#2a2a2a]" : "bg-highlight/40"} rounded-lg px-4 py-3 mb-5 border-l-2 border-terracotta/40`}>
        <h4 className={`text-base font-semibold ${text} mb-0.5`} style={{ fontFamily: "var(--font-serif)" }}>
          {concept.displayTerm}
        </h4>
        <p className={`text-xs ${textFaint}`}>{concept.origin}</p>
      </div>

      {/* Definition */}
      <div className="mb-5">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">Definition</h5>
        <p className={`text-sm ${text} leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
          {concept.definition}
        </p>
      </div>

      {/* Related Terms */}
      {concept.relatedTerms.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">Related Concepts</h5>
          <div className="flex flex-wrap gap-2">
            {concept.relatedTerms.map((rt) => {
              const isClickable = conceptDNA.some((c) => c.term === rt);
              return (
                <button
                  key={rt}
                  onClick={() => isClickable && onTermClick(rt)}
                  disabled={!isClickable}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    isClickable
                      ? `${cardBg} ${border} hover:border-terracotta/40 ${text} cursor-pointer`
                      : `${cardBg} ${border} ${textFaint} cursor-default`
                  }`}
                >
                  {rt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse all concepts */}
      <div className={`mt-8 pt-5 border-t ${border}`}>
        <h5 className={`text-xs font-semibold ${textMuted} mb-3`}>All concepts in this text</h5>
        <div className="space-y-1">
          {conceptDNA.map((c) => (
            <button
              key={c.term}
              onClick={() => onTermClick(c.term)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                c.term === activeTerm
                  ? "bg-terracotta/10 text-terracotta font-medium"
                  : `${text} ${darkMode ? "hover:bg-[#2a2a2a]" : "hover:bg-cream-dark/60"}`
              }`}
            >
              {c.displayTerm}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Philos Logo with Greek hover effect ---- */

function PhilosLogo({ text, onClick }: { text: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [tapped, setTapped] = useState(false);
  const showGreek = hovered || tapped;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchEnd={(e) => {
        // On touch devices, toggle instead of hover
        e.preventDefault();
        setTapped((prev) => !prev);
      }}
      className={`relative text-xl font-semibold tracking-tight ${text} cursor-pointer`}
      style={{ fontFamily: "var(--font-sans)", width: "5.5rem", height: "1.75rem" }}
    >
      {/* English */}
      <span
        className="absolute inset-0 flex items-center transition-all duration-[400ms] ease-in-out"
        style={{
          opacity: showGreek ? 0 : 1,
          transform: showGreek ? "translateY(-4px)" : "translateY(0)",
          pointerEvents: showGreek ? "none" : "auto",
        }}
      >
        Philos
      </span>
      {/* Greek */}
      <span
        className="absolute inset-0 flex items-center transition-all duration-[400ms] ease-in-out"
        style={{
          fontFamily: "var(--font-serif)",
          opacity: showGreek ? 1 : 0,
          transform: showGreek ? "translateY(0)" : "translateY(4px)",
          pointerEvents: showGreek ? "auto" : "none",
        }}
      >
        φίλος
      </span>
    </button>
  );
}

export default App;
