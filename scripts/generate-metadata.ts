#!/usr/bin/env npx tsx
/**
 * Generate .meta.json files for philosophy texts using Claude API.
 *
 * Usage:
 *   npx tsx scripts/generate-metadata.ts                # process all texts missing .meta.json
 *   npx tsx scripts/generate-metadata.ts --dry-run      # preview what would be generated
 *   npx tsx scripts/generate-metadata.ts --text="Epistemology/American Pragmatism/James/James_WillToBelieve"
 *   npx tsx scripts/generate-metadata.ts --force         # regenerate even if .meta.json exists
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIBRARY_ROOT = path.resolve(__dirname, "..", ":philos-data:library");

// ─── CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const TEXT_ARG = args.find((a) => a.startsWith("--text="))?.replace("--text=", "");

// ─── Find texts to process ──────────────────────────────────────────────

interface TextFile {
  mdPath: string;
  metaPath: string;
  relativePath: string;
}

function findTexts(): TextFile[] {
  const texts: TextFile[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".md")) {
        const base = path.basename(full, ".md");
        const metaPath = path.join(path.dirname(full), `${base}.meta.json`);
        const relativePath = path.relative(LIBRARY_ROOT, full).replace(/\.md$/, "");
        texts.push({ mdPath: full, metaPath, relativePath });
      }
    }
  }
  walk(LIBRARY_ROOT);
  return texts;
}

// ─── Parse markdown for the prompt ──────────────────────────────────────

function extractTextContent(mdPath: string): {
  title: string;
  author: string;
  content: string;
  branch: string;
  school: string;
} {
  const raw = fs.readFileSync(mdPath, "utf-8");
  const lines = raw.split("\n");

  // Extract title and author from header
  const titleMatch = raw.match(/^#\s+(.+)/m);
  const authorMatch = raw.match(/\*\*Author:\*\*\s*(.+)/i);

  // Extract branch/school from path
  const relPath = path.relative(LIBRARY_ROOT, mdPath);
  const parts = relPath.split(path.sep);

  // Get content (skip header, take first ~4000 words)
  let afterHeader = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const t = lines[i].trim();
    if (t.startsWith("# ") || t.startsWith("**Author:") || t === "")
      afterHeader = i + 1;
    else break;
  }

  const contentLines = lines.slice(afterHeader);
  const words = contentLines.join("\n").split(/\s+/);
  const truncated = words.slice(0, 4000).join(" ");

  return {
    title: titleMatch?.[1] || path.basename(mdPath, ".md"),
    author: authorMatch?.[1] || (parts.length >= 3 ? parts[parts.length - 2] : "Unknown"),
    content: truncated,
    branch: parts[0] || "",
    school: parts[1] || "",
  };
}

// ─── Read example .meta.json for few-shot ───────────────────────────────

function getExampleMeta(): string {
  const examplePath = path.join(
    LIBRARY_ROOT,
    "Epistemology/American Pragmatism/James/James_WillToBelieve.meta.json"
  );
  if (fs.existsSync(examplePath)) {
    return fs.readFileSync(examplePath, "utf-8");
  }
  return "No example available.";
}

// ─── Claude API call ────────────────────────────────────────────────────

async function generateMetadata(text: {
  title: string;
  author: string;
  content: string;
  branch: string;
  school: string;
}): Promise<object> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const exampleMeta = getExampleMeta();

  const prompt = `You are a philosophy professor creating structured metadata for a philosophical text.
Generate a JSON metadata object for the following text. Follow the exact structure of this example:

<example>
${exampleMeta}
</example>

Now generate metadata for this text:

Title: ${text.title}
Author: ${text.author}
Branch: ${text.branch}
School: ${text.school}

<text>
${text.content}
</text>

Requirements:
1. "id": kebab-case derived from the title
2. "title", "author", "branch", "school": as provided above
3. "year": the year the text was written/published (null if unknown)
4. "source": "Project Gutenberg" for Gutenberg texts, or the appropriate source
5. "sourceUrl": null (we don't have this info)
6. "introduction": 2-4 sentences capturing the text's significance and central argument. Written for an educated general reader, not a specialist.
7. "argumentCard": { centralQuestion, thesis, keyMoves (3-4 items), strongestObjection }
8. "conceptDNA": Array of 6-12 key concepts. Each has: term, displayTerm, definition (conversational, 2-3 sentences), origin, relatedTerms.
9. "conceptHighlights": Array mapping each concept term to paragraph IDs where it appears prominently (use approximate IDs based on where in the text the concept is discussed).
10. "guidedPaths": 1-2 reading paths through this text. Each path has: id, title, subtitle, description, estimatedTime, steps (2-3 steps with textPath, title, author, sectionRange, focusQuestion, connectionToNext), whyThisPath.
    - For textPath, use: "${text.branch}/${text.school}/${text.author.split(" ").pop()}/${path.basename(text.title).replace(/\s+/g, "_")}"
11. "debates": 1-2 philosophical debates this text participates in. Each has: id, title, subtitle, philosopher1 (name, position, keyQuote, arguments), philosopher2 (name, position, keyQuote, arguments), stakes, yourTurn.

Respond with ONLY the JSON object, no markdown fencing or explanation.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  const result = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const textBlock = result.content.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("No text in API response");

  // Parse JSON, stripping any markdown fencing
  const jsonStr = textBlock.text
    .replace(/^```json?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(jsonStr);
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Library root: ${LIBRARY_ROOT}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "GENERATE"} ${FORCE ? "(force)" : ""}\n`);

  let texts = findTexts();

  // Filter to specific text if requested
  if (TEXT_ARG) {
    texts = texts.filter((t) => t.relativePath === TEXT_ARG);
    if (texts.length === 0) {
      console.error(`Text not found: ${TEXT_ARG}`);
      process.exit(1);
    }
  }

  // Filter out texts that already have .meta.json (unless --force)
  if (!FORCE) {
    texts = texts.filter((t) => !fs.existsSync(t.metaPath));
  }

  console.log(`Found ${texts.length} text(s) to process.\n`);

  if (texts.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (DRY_RUN) {
    for (const t of texts) {
      console.log(`  Would generate: ${t.relativePath}`);
      console.log(`    .meta.json -> ${t.metaPath}`);
    }
    return;
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    console.error("Set it with: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  let success = 0;
  let failed = 0;

  for (const t of texts) {
    try {
      console.log(`Processing: ${t.relativePath}`);
      const textData = extractTextContent(t.mdPath);
      const meta = await generateMetadata(textData);

      fs.writeFileSync(t.metaPath, JSON.stringify(meta, null, 2) + "\n");
      console.log(`  -> Wrote ${t.metaPath}`);
      success++;

      // Rate limiting: wait 1 second between requests
      if (texts.indexOf(t) < texts.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
