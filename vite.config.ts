import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import type { Plugin, IncomingMessage, ServerResponse } from "vite";

// The library data lives here (colons in folder name)
const LIBRARY_ROOT = path.resolve(__dirname, ":philos-data:library");

// ─── Markdown → Paragraphs Parser ────────────────────────────────────

interface ParsedParagraph {
  id: number;
  text: string;
  section?: string;
}

const BOILERPLATE_RE =
  /^(produced by|translated by|transcrib|editor|illustration|cover|title:|release date|posting date|last updated|\*\*\*|copyright|project gutenberg|e-?text|http|www\.|note:|cassell|changed|picture:|_london_|printed for|to the king|at london|david price|ccx\d|pglaf|\* \* \*|decorative|& company|longmans|new impression|fourth avenue|first edition|reprinted|london,? bombay)/i;

// Detect front-matter section labels (PREFACE, CONTENTS, etc.)
const FRONT_MATTER_RE = /^(preface|contents|table of contents|foreword|editor'?s? note|dedication|acknowledgment|introduction)\b\.?$/i;

// Detect page markers like {vii}, {viii}, {1}, {23}, etc.
const PAGE_MARKER_RE = /^\{[ivxlc\d]+\}$/i;

// Detect table-of-contents lines (dotted leaders or trailing page numbers)
const TOC_LINE_RE = /(\.\s*\.\s*\.)|(\.\s+\d+\s*$)|\d{2,}\s*$/;

// Detect section headings: Roman numerals (I. II. III. etc.), ## headings, or short ALL-CAPS lines
const SECTION_RE = /^(#{1,3}\s+)?([IVXLC]+\.?\s*$|SECTION\s+[IVXLC]+|CHAPTER\s+[IVXLC]+|BOOK\s+[IVXLC]+|PART\s+[IVXLC]+)/i;
const ROMAN_STANDALONE_RE = /^[IVXLC]+\.?$/;

function isBoilerplateBlock(p: string): boolean {
  if (p === "") return true;
  if (BOILERPLATE_RE.test(p)) return true;
  if (PAGE_MARKER_RE.test(p)) return true;
  if (FRONT_MATTER_RE.test(p)) return true;
  if (TOC_LINE_RE.test(p)) return true;
  if (p.length < 60) return true;
  // Mostly uppercase = title page
  const letters = (p.match(/[a-zA-Z]/g) || []).length;
  const uppers = (p.match(/[A-Z]/g) || []).length;
  if (letters > 0 && uppers / letters > 0.5) return true;
  // Page markers embedded in text like {viii}
  if (/\{[ivxlc]+\}/i.test(p)) return true;
  return false;
}

function parseMarkdownToParagraphs(raw: string): ParsedParagraph[] {
  const lines = raw.split("\n");

  // 1. Skip # Title and **Author:** header
  let afterHeader = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const t = lines[i].trim();
    if (t.startsWith("# ") || t.startsWith("**Author:") || t === "")
      afterHeader = i + 1;
    else break;
  }

  // 2. Join remaining and split into paragraph blocks
  const rest = lines.slice(afterHeader).join("\n");
  const blocks = rest.split(/\n\s*\n/);

  // 3. Find where real content starts
  // Strategy: Scan the first portion of blocks for front-matter markers
  // (page markers, PREFACE, CONTENTS, TOC lines). The last such marker
  // tells us where front matter ends. Only scan first 40% of blocks to
  // avoid false positives in actual content.
  const scanLimit = Math.min(blocks.length, Math.ceil(blocks.length * 0.4));
  let lastFrontMatterIdx = -1;
  for (let i = 0; i < scanLimit; i++) {
    const p = blocks[i].trim().replace(/\s+/g, " ");
    if (PAGE_MARKER_RE.test(p)) lastFrontMatterIdx = i;
    if (FRONT_MATTER_RE.test(p)) lastFrontMatterIdx = i;
    if (TOC_LINE_RE.test(p)) lastFrontMatterIdx = i;
  }

  // Start after the last front-matter marker, then skip remaining short/boilerplate blocks
  let contentStart = lastFrontMatterIdx + 1;
  for (let i = contentStart; i < blocks.length; i++) {
    const p = blocks[i].trim().replace(/\s+/g, " ");
    if (p === "") continue;
    if (BOILERPLATE_RE.test(p)) continue;
    if (p.length < 60) continue;
    const letters = (p.match(/[a-zA-Z]/g) || []).length;
    const uppers = (p.match(/[A-Z]/g) || []).length;
    if (letters > 0 && uppers / letters > 0.5) continue;
    contentStart = i;
    break;
  }

  // 4. Convert blocks to numbered paragraphs with section detection
  const paragraphs: ParsedParagraph[] = [];
  let id = 1;
  let currentSection: string | undefined;

  for (let i = contentStart; i < blocks.length; i++) {
    let block = blocks[i].trim().replace(/\s+/g, " ");
    if (!block) continue;

    // Strip inline page markers like {2}, {viii}
    block = block.replace(/\s*\{[ivxlc\d]+\}\s*/gi, " ").trim();

    // Check for [Text truncated marker - stop here
    if (block.startsWith("[Text truncated")) break;

    // Check if this block is a section heading
    const trimmedBlock = block.replace(/\s+/g, " ");
    if (
      trimmedBlock.length < 40 &&
      (SECTION_RE.test(trimmedBlock) || ROMAN_STANDALONE_RE.test(trimmedBlock))
    ) {
      currentSection = trimmedBlock
        .replace(/^#{1,3}\s+/, "")
        .replace(/\.$/, "")
        .trim();
      if (currentSection && !currentSection.endsWith("."))
        currentSection += ".";
      continue;
    }

    // Regular paragraph
    const para: ParsedParagraph = { id, text: block };
    if (currentSection) {
      para.section = currentSection;
      currentSection = undefined;
    }
    paragraphs.push(para);
    id++;
  }

  return paragraphs;
}

// ─── Metadata reader ──────────────────────────────────────────────────

function readMetadata(mdFilePath: string) {
  const dir = path.dirname(mdFilePath);
  const base = path.basename(mdFilePath, ".md");

  // Try enriched .meta.json first
  const metaPath = path.join(dir, `${base}.meta.json`);
  if (fs.existsSync(metaPath)) {
    try {
      return { ...JSON.parse(fs.readFileSync(metaPath, "utf-8")), _enriched: true };
    } catch {}
  }

  // Fall back to basic .json
  const basicPath = path.join(dir, `${base}.json`);
  if (fs.existsSync(basicPath)) {
    try {
      const basic = JSON.parse(fs.readFileSync(basicPath, "utf-8"));
      return {
        id: base.toLowerCase().replace(/[_\s]+/g, "-"),
        title: basic.work || base.replace(/^[^_]+_/, "").replace(/([A-Z])/g, " $1").trim(),
        author: basic.author || "Unknown",
        year: null,
        branch: basic.primary_category || "",
        school: basic.primary_subcategory || "",
        source: basic.source || null,
        sourceUrl: basic.source_url || null,
        introduction: null,
        argumentCard: null,
        conceptDNA: null,
        conceptHighlights: null,
        guidedPaths: null,
        debates: null,
        _enriched: false,
      };
    } catch {}
  }

  // No metadata at all — derive from markdown header and path
  const mdContent = fs.readFileSync(mdFilePath, "utf-8");
  const titleMatch = mdContent.match(/^#\s+(.+)/m);
  const authorMatch = mdContent.match(/\*\*Author:\*\*\s*(.+)/i);
  const relPath = path.relative(LIBRARY_ROOT, mdFilePath);
  const parts = relPath.split(path.sep);

  return {
    id: base.toLowerCase().replace(/[_\s]+/g, "-"),
    title: titleMatch?.[1] || base,
    author: authorMatch?.[1] || (parts.length >= 3 ? parts[parts.length - 2] : "Unknown"),
    year: null,
    branch: parts[0] || "",
    school: parts[1] || "",
    source: null,
    sourceUrl: null,
    introduction: null,
    argumentCard: null,
    conceptDNA: null,
    conceptHighlights: null,
    guidedPaths: null,
    debates: null,
    _enriched: false,
  };
}

// ─── Catalog cache ────────────────────────────────────────────────────

interface CatalogItem {
  id: string;
  title: string;
  author: string;
  year: number | null;
  branch: string;
  school: string;
  relativePath: string;
  hasEnrichedMetadata: boolean;
  introductionPreview: string | null;
}

let catalogCache: CatalogItem[] | null = null;

function buildCatalog(): CatalogItem[] {
  if (catalogCache) return catalogCache;

  const items: CatalogItem[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        const meta = readMetadata(full);
        items.push({
          id: meta.id,
          title: meta.title,
          author: meta.author,
          year: meta.year,
          branch: meta.branch,
          school: meta.school,
          relativePath: path.relative(LIBRARY_ROOT, full),
          hasEnrichedMetadata: !!meta._enriched,
          introductionPreview: meta.introduction
            ? meta.introduction.slice(0, 200)
            : null,
        });
      }
    }
  }
  walk(LIBRARY_ROOT);

  // Sort by branch > school > author > title
  items.sort((a, b) =>
    `${a.branch}|${a.school}|${a.author}|${a.title}`.localeCompare(
      `${b.branch}|${b.school}|${b.author}|${b.title}`
    )
  );

  catalogCache = items;
  return items;
}

// ─── API Plugin ───────────────────────────────────────────────────────

function philosApiPlugin(): Plugin {
  return {
    name: "philos-api",
    configureServer(server) {
      // Invalidate cache on file changes
      server.watcher.on("change", (filePath: string) => {
        if (filePath.includes(":philos-data:library")) {
          catalogCache = null;
        }
      });

      // GET /api/catalog — lightweight index of all texts
      server.middlewares.use("/api/catalog", (_req: IncomingMessage, res: ServerResponse) => {
        try {
          const catalog = buildCatalog();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(catalog));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/text?path=Epistemology/American%20Pragmatism/James/James_WillToBelieve
      // Returns full UnifiedText (metadata + parsed paragraphs)
      server.middlewares.use("/api/text", (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        let textPath = url.searchParams.get("path") || "";

        // Add .md extension if missing
        if (!textPath.endsWith(".md")) textPath += ".md";

        const fullPath = path.join(LIBRARY_ROOT, textPath);

        try {
          if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Text not found", path: textPath }));
            return;
          }

          const raw = fs.readFileSync(fullPath, "utf-8");
          const paragraphs = parseMarkdownToParagraphs(raw);
          const meta = readMetadata(fullPath);
          delete (meta as any)._enriched;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ meta, paragraphs }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/guided-paths — aggregates all guided paths from .meta.json files
      server.middlewares.use("/api/guided-paths", (_req: IncomingMessage, res: ServerResponse) => {
        try {
          const allPaths: any[] = [];
          function walk(dir: string) {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              if (entry.name.startsWith(".")) continue;
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                walk(full);
              } else if (entry.name.endsWith(".meta.json")) {
                try {
                  const meta = JSON.parse(fs.readFileSync(full, "utf-8"));
                  if (meta.guidedPaths && Array.isArray(meta.guidedPaths)) {
                    allPaths.push(...meta.guidedPaths);
                  }
                } catch {}
              }
            }
          }
          walk(LIBRARY_ROOT);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(allPaths));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // GET /api/debates — aggregates all debates from .meta.json files
      server.middlewares.use("/api/debates", (_req: IncomingMessage, res: ServerResponse) => {
        try {
          const allDebates: any[] = [];
          const seenIds = new Set<string>();
          function walk(dir: string) {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              if (entry.name.startsWith(".")) continue;
              const full = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                walk(full);
              } else if (entry.name.endsWith(".meta.json")) {
                try {
                  const meta = JSON.parse(fs.readFileSync(full, "utf-8"));
                  if (meta.debates && Array.isArray(meta.debates)) {
                    for (const d of meta.debates) {
                      if (!seenIds.has(d.id)) {
                        seenIds.add(d.id);
                        allDebates.push(d);
                      }
                    }
                  }
                } catch {}
              }
            }
          }
          walk(LIBRARY_ROOT);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(allDebates));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), philosApiPlugin()],
});
