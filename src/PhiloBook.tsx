// PhiloBook page — personal philosophy commonplace book

import { useState, useMemo } from "react";
import type { PhiloBookStorage, PhiloBookItem, PhiloBookItemType, QuoteData, AnnotationData, DeJargonData, DebatePrepData, StudyPackageData } from "./philoBookData";
import { TYPE_BORDER_COLORS } from "./philoBookData";

type FilterTab = "all" | PhiloBookItemType;
type SortMode = "newest" | "oldest" | "by_text";

interface PhiloBookPageProps {
  storage: PhiloBookStorage;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: PhiloBookItem["data"]) => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "annotation", label: "Annotations" },
  { key: "quote", label: "Quotes" },
  { key: "dejargon", label: "De-jargons" },
  { key: "debate_prep", label: "Debate Preps" },
  { key: "study_package", label: "Study Packages" },
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  all: "Your PhiloBook is empty. Start reading, highlighting, and de-jargoning to build your collection.",
  annotation: "No annotations yet. When you're reading, highlight any passage and tap Annotate to start building your collection.",
  quote: "No quotes saved yet. Highlight a passage that resonates and tap Save as Quote.",
  dejargon: "No de-jargons saved yet. They'll appear here whenever you de-jargon a passage.",
  debate_prep: "No debate preps saved yet. Try the Debate Prep feature on any text.",
  study_package: "No study packages yet. Paste any philosophy passage into Study Mode to generate one.",
};

export function PhiloBookPage({ storage, onDelete, onUpdate, darkMode, text, textMuted, textFaint, cardBg, border }: PhiloBookPageProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inputBg = darkMode ? "bg-[#2a2a2a] border-[#444]" : "bg-white border-cream-darker/50";

  const filtered = useMemo(() => {
    let items = storage.items;

    // Filter by tab
    if (activeTab !== "all") {
      items = items.filter((i) => i.type === activeTab);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => {
        const d = i.data;
        const searchFields = [
          i.sourceTextTitle,
          i.sourceAuthor,
          "quotedText" in d ? d.quotedText : "",
          "highlightedText" in d ? d.highlightedText : "",
          "annotationText" in d ? d.annotationText : "",
          "originalText" in d ? d.originalText : "",
          "dejargonedText" in d ? d.dejargonedText : "",
          "result" in d ? d.result : "",
          "userNote" in d ? d.userNote : "",
        ];
        return searchFields.some((f) => f.toLowerCase().includes(q));
      });
    }

    // Sort
    const sorted = [...items];
    switch (sortMode) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "by_text":
        sorted.sort((a, b) => a.sourceTextTitle.localeCompare(b.sourceTextTitle));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [storage.items, activeTab, sortMode, searchQuery]);

  return (
    <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-10 sm:py-16">
      {/* Header */}
      <h1 className={`text-2xl font-semibold ${text} mb-1`} style={{ fontFamily: "var(--font-serif)" }}>
        PhiloBook
      </h1>
      <p className={`text-sm ${textMuted} mb-5`}>Your philosophical trail, collected</p>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your PhiloBook..."
          className={`w-full px-4 py-2.5 text-sm rounded-xl border ${inputBg} ${text} focus:outline-none focus:border-terracotta/40 transition-colors`}
        />
      </div>

      {/* Filter tabs + Sort */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 -mb-1 flex-1 min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "text-terracotta border-b-2 border-terracotta font-semibold"
                  : textMuted
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className={`text-xs px-2 py-1.5 rounded-lg border ${inputBg} ${textMuted} shrink-0`}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="by_text">By text</option>
        </select>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <div className={textFaint + " mb-3"}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p className={`text-sm ${textMuted} max-w-sm mx-auto`}>{EMPTY_MESSAGES[activeTab]}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={() => setSelectedId(selectedId === item.id ? null : item.id)}
              onDelete={onDelete}
              onUpdate={onUpdate}
              darkMode={darkMode}
              text={text}
              textMuted={textMuted}
              textFaint={textFaint}
              cardBg={cardBg}
              border={border}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Item Card ----

function ItemCard({
  item, isSelected, onSelect, onDelete, onUpdate, darkMode, text, textMuted, textFaint, cardBg, border,
}: {
  item: PhiloBookItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: PhiloBookItem["data"]) => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  border: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Use inline style for annotation border color since dynamic Tailwind classes won't work
  const borderStyle = item.type === "annotation"
    ? { borderLeftColor: (item.data as AnnotationData).highlightColor?.replace("0.25", "0.7") || "rgb(196,164,92)" }
    : {};

  const borderColor = item.type !== "annotation" ? TYPE_BORDER_COLORS[item.type] : "";

  const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleSaveEdit = (newData: PhiloBookItem["data"]) => {
    onUpdate(item.id, newData);
    setEditing(false);
  };

  return (
    <div
      onClick={() => { if (!editing) onSelect(); }}
      className={`${cardBg} rounded-xl border ${border} border-l-4 ${borderColor} overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? (darkMode ? "ring-1 ring-terracotta/40" : "ring-1 ring-terracotta/30 shadow-sm") : ""
      }`}
      style={borderStyle}
    >
      <div className="p-5">
        {/* Header: source + date */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium ${textMuted}`}>{item.sourceAuthor}</span>
            <span className={`text-xs ${textFaint}`}>&middot;</span>
            <span className={`text-xs ${textFaint}`}>{item.sourceTextTitle}</span>
          </div>
          <span className={`text-xs ${textFaint} shrink-0 ml-2`}>{dateStr}</span>
        </div>

        {/* Type-specific content */}
        {editing ? (
          <EditableContent item={item} onSave={handleSaveEdit} onCancel={() => setEditing(false)} darkMode={darkMode} text={text} textMuted={textMuted} textFaint={textFaint} border={border} />
        ) : (
          <>
            {item.type === "quote" && <QuoteCard data={item.data as QuoteData} text={text} />}
            {item.type === "annotation" && <AnnotationCard data={item.data as AnnotationData} text={text} textFaint={textFaint} darkMode={darkMode} border={border} />}
            {item.type === "dejargon" && <DeJargonCard data={item.data as DeJargonData} text={text} textMuted={textMuted} textFaint={textFaint} darkMode={darkMode} border={border} />}
            {item.type === "debate_prep" && <DebatePrepCard data={item.data as DebatePrepData} text={text} textMuted={textMuted} darkMode={darkMode} />}
            {item.type === "study_package" && <StudyPackageCard data={item.data as StudyPackageData} text={text} textMuted={textMuted} darkMode={darkMode} />}
          </>
        )}

        {/* Action bar — shown when selected, not editing */}
        {isSelected && !editing && (
          <div className={`flex items-center gap-2 mt-4 pt-3 border-t ${border} animate-[fadeIn_150ms_ease]`} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${darkMode ? "bg-[#333] text-[#ccc] hover:bg-[#3a3a3a]" : "bg-cream-dark text-charcoal-light hover:bg-cream-darker"} transition-colors`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1.5 ml-auto">
                <span className={`text-xs ${textFaint}`}>Delete?</span>
                <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className={`text-xs ${textMuted}`}>No</button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${darkMode ? "text-red-400/70 hover:bg-red-500/10" : "text-red-500/60 hover:bg-red-50"} transition-colors`}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 5h10M5.5 5V4a1.5 1.5 0 0 1 3 0v1M6.5 7.5v4M9.5 7.5v4M4.5 5l.5 8a1.5 1.5 0 0 0 1.5 1.5h3A1.5 1.5 0 0 0 11 13l.5-8" />
                </svg>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Editable Content ----

function EditableContent({ item, onSave, onCancel, darkMode, text, textMuted, textFaint, border }: {
  item: PhiloBookItem;
  onSave: (data: PhiloBookItem["data"]) => void;
  onCancel: () => void;
  darkMode: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
}) {
  const inputCls = `w-full px-3 py-2 text-sm rounded-lg ${darkMode ? "bg-[#222] text-[#ddd] border-[#444]" : "bg-cream-dark text-charcoal border-cream-darker"} border focus:outline-none focus:border-terracotta/40 resize-none`;

  if (item.type === "quote") {
    const d = item.data as QuoteData;
    const [val, setVal] = useState(d.quotedText);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} className={inputCls} rows={3} style={{ fontFamily: "var(--font-serif)" }} />
        <EditButtons onSave={() => onSave({ quotedText: val })} onCancel={onCancel} darkMode={darkMode} />
      </div>
    );
  }

  if (item.type === "annotation") {
    const d = item.data as AnnotationData;
    const [noteVal, setNoteVal] = useState(d.annotationText);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <div className={`text-sm ${text} leading-relaxed rounded px-2 py-1 mb-3`} style={{ fontFamily: "var(--font-serif)", backgroundColor: d.highlightColor || "rgba(196,164,92,0.15)" }}>
          {d.highlightedText}
        </div>
        <label className={`text-xs ${textFaint} mb-1 block`}>Annotation</label>
        <textarea value={noteVal} onChange={(e) => setNoteVal(e.target.value)} className={inputCls} rows={3} />
        <EditButtons onSave={() => onSave({ ...d, annotationText: noteVal })} onCancel={onCancel} darkMode={darkMode} />
      </div>
    );
  }

  if (item.type === "dejargon") {
    const d = item.data as DeJargonData;
    const [noteVal, setNoteVal] = useState(d.userNote);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <div className="mb-3">
          <span className={`text-xs font-medium ${textFaint} uppercase tracking-wider`}>Original</span>
          <p className={`text-sm ${textMuted} mt-1 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
            &ldquo;{d.originalText.slice(0, 200)}{d.originalText.length > 200 ? "..." : ""}&rdquo;
          </p>
        </div>
        <div className={`${darkMode ? "bg-[#1e1e1e]" : "bg-cream/60"} rounded-lg px-3 py-2.5 mb-3`}>
          <span className={`text-xs font-medium ${textFaint} uppercase tracking-wider`}>De-jargoned</span>
          <p className={`text-sm ${text} mt-1 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>{d.dejargonedText}</p>
        </div>
        <label className={`text-xs ${textFaint} mb-1 block`}>Your note</label>
        <textarea value={noteVal} onChange={(e) => setNoteVal(e.target.value)} className={inputCls} rows={2} placeholder="Add a personal note..." />
        <EditButtons onSave={() => onSave({ ...d, userNote: noteVal })} onCancel={onCancel} darkMode={darkMode} />
      </div>
    );
  }

  if (item.type === "debate_prep") {
    const d = item.data as DebatePrepData;
    const [val, setVal] = useState(d.result);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <p className={`text-sm ${textMuted} mb-2 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
          {d.originalText.slice(0, 150)}{d.originalText.length > 150 ? "..." : ""}
        </p>
        <label className={`text-xs ${textFaint} mb-1 block`}>Debate prep content</label>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} className={inputCls} rows={5} style={{ fontFamily: "var(--font-serif)" }} />
        <EditButtons onSave={() => onSave({ ...d, result: val })} onCancel={onCancel} darkMode={darkMode} />
      </div>
    );
  }

  if (item.type === "study_package") {
    const d = item.data as StudyPackageData;
    const [val, setVal] = useState(d.result);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <p className={`text-sm ${textMuted} mb-2 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
          {d.originalText.slice(0, 150)}{d.originalText.length > 150 ? "..." : ""}
        </p>
        <label className={`text-xs ${textFaint} mb-1 block`}>Study package content</label>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} className={inputCls} rows={5} style={{ fontFamily: "var(--font-serif)" }} />
        <EditButtons onSave={() => onSave({ ...d, result: val })} onCancel={onCancel} darkMode={darkMode} />
      </div>
    );
  }

  return null;
}

function EditButtons({ onSave, onCancel, darkMode }: { onSave: () => void; onCancel: () => void; darkMode: boolean }) {
  return (
    <div className="flex gap-2 mt-3">
      <button onClick={onSave} className="px-4 py-1.5 text-xs font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors">
        Save
      </button>
      <button onClick={onCancel} className={`px-4 py-1.5 text-xs font-medium rounded-lg ${darkMode ? "text-[#aaa] hover:bg-[#333]" : "text-charcoal-light hover:bg-cream-dark"} transition-colors`}>
        Cancel
      </button>
    </div>
  );
}

// ---- Type-specific Cards ----

function QuoteCard({ data, text }: { data: QuoteData; text: string }) {
  return (
    <blockquote className={`text-sm ${text} italic leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
      &ldquo;{data.quotedText}&rdquo;
    </blockquote>
  );
}

function AnnotationCard({ data, text, textFaint, darkMode, border }: { data: AnnotationData; text: string; textFaint: string; darkMode: boolean; border: string }) {
  return (
    <>
      <div
        className={`text-sm ${text} leading-relaxed rounded px-2 py-1 mb-3 ${data.underlined ? "underline decoration-1" : ""}`}
        style={{ fontFamily: "var(--font-serif)", backgroundColor: data.highlightColor || "rgba(196,164,92,0.15)", textDecorationColor: data.highlightColor?.replace("0.25", "0.5") }}
      >
        {data.highlightedText}
      </div>
      {data.annotationText && (
        <div className="flex items-start gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#9a9590" : "#8A8A8A"} strokeWidth="1.5" className="mt-0.5 shrink-0">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <p className={`text-sm ${text}`}>{data.annotationText}</p>
        </div>
      )}
    </>
  );
}

function DeJargonCard({ data, text, textMuted, textFaint, darkMode, border }: { data: DeJargonData; text: string; textMuted: string; textFaint: string; darkMode: boolean; border: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className="mb-3">
        <span className={`text-xs font-medium ${textFaint} uppercase tracking-wider`}>Original</span>
        <p className={`text-sm ${textMuted} mt-1 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
          &ldquo;{data.originalText.slice(0, 200)}{data.originalText.length > 200 ? "..." : ""}&rdquo;
        </p>
      </div>
      <div className={`${darkMode ? "bg-[#1e1e1e]" : "bg-cream/60"} rounded-lg px-3 py-2.5 mb-3`}>
        <span className={`text-xs font-medium ${textFaint} uppercase tracking-wider`}>De-jargoned</span>
        <p className={`text-sm ${text} mt-1 leading-relaxed`} style={{ fontFamily: "var(--font-serif)" }}>
          {data.dejargonedText}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-[#333]" : "bg-cream-dark"} ${textFaint}`}>
          {data.depthLayer}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-[#333]" : "bg-cream-dark"} ${textFaint}`}>
          {data.tone === "coffee_shop" ? "Coffee Shop" : "Office Hours"}
        </span>
      </div>
      {data.soWhatText && (
        <div className="mt-3">
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className={`text-xs font-medium text-terracotta`}>
            {expanded ? "Hide" : "Show"} So What?
          </button>
          {expanded && (
            <p className={`text-sm ${text} mt-2 leading-relaxed animate-[fadeIn_200ms_ease]`} style={{ fontFamily: "var(--font-serif)" }}>
              {data.soWhatText}
            </p>
          )}
        </div>
      )}
      {data.userNote && (
        <div className={`mt-3 pt-3 border-t ${border}`}>
          <p className={`text-xs ${textFaint} mb-0.5`}>Your note:</p>
          <p className={`text-sm ${textMuted}`}>{data.userNote}</p>
        </div>
      )}
    </>
  );
}

function DebatePrepCard({ data, text, textMuted, darkMode }: { data: DebatePrepData; text: string; textMuted: string; darkMode: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <p className={`text-sm ${textMuted} mb-2 leading-relaxed line-clamp-3`} style={{ fontFamily: "var(--font-serif)" }}>
        {data.originalText.slice(0, 200)}{data.originalText.length > 200 ? "..." : ""}
      </p>
      <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs font-medium text-terracotta">
        {expanded ? "Collapse" : "Show full debate prep"}
      </button>
      {expanded && (
        <div className={`mt-3 text-sm ${text} leading-relaxed whitespace-pre-line animate-[fadeIn_200ms_ease]`} style={{ fontFamily: "var(--font-serif)" }}>
          {data.result}
        </div>
      )}
    </>
  );
}

function StudyPackageCard({ data, text, textMuted, darkMode }: { data: StudyPackageData; text: string; textMuted: string; darkMode: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <p className={`text-sm ${textMuted} mb-2 leading-relaxed line-clamp-3`} style={{ fontFamily: "var(--font-serif)" }}>
        {data.originalText.slice(0, 200)}{data.originalText.length > 200 ? "..." : ""}
      </p>
      <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs font-medium text-terracotta">
        {expanded ? "Collapse" : "Show full study package"}
      </button>
      {expanded && (
        <div className={`mt-3 text-sm ${text} leading-relaxed whitespace-pre-line animate-[fadeIn_200ms_ease]`} style={{ fontFamily: "var(--font-serif)" }}>
          {data.result}
        </div>
      )}
    </>
  );
}
