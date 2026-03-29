// Unified data model for all philosophy texts in the catalog

export interface ArgumentCard {
  centralQuestion: string;
  thesis: string;
  keyMoves: string[];
  strongestObjection: string;
}

export interface ConceptDNAEntry {
  term: string;
  displayTerm: string;
  definition: string;
  origin: string;
  relatedTerms: string[];
}

export interface ConceptHighlight {
  term: string;
  paragraphIds: number[];
}

export interface PathStep {
  textId?: string;
  textPath?: string;
  title: string;
  author: string;
  sectionRange?: string;
  focusQuestion: string;
  connectionToNext?: string;
}

export interface GuidedPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  estimatedTime: string;
  steps: PathStep[];
  whyThisPath: string;
}

export interface DebateEntry {
  id: string;
  title: string;
  subtitle: string;
  philosopher1: {
    name: string;
    position: string;
    keyQuote: string;
    arguments: string[];
  };
  philosopher2: {
    name: string;
    position: string;
    keyQuote: string;
    arguments: string[];
  };
  stakes: string;
  yourTurn: string;
}

export interface Paragraph {
  id: number;
  text: string;
  section?: string;
}

// Full metadata for a text (stored in .meta.json files)
export interface TextMetadata {
  id: string;
  title: string;
  author: string;
  year: number | null;
  branch: string;
  school: string;
  source?: string;
  sourceUrl?: string;
  introduction: string | null;
  argumentCard: ArgumentCard | null;
  conceptDNA: ConceptDNAEntry[] | null;
  conceptHighlights: ConceptHighlight[] | null;
  guidedPaths: GuidedPath[] | null;
  debates: DebateEntry[] | null;
}

// Lightweight catalog entry (returned by /api/catalog)
export interface CatalogEntry {
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

// Full text as served by /api/text
export interface UnifiedText {
  meta: TextMetadata;
  paragraphs: Paragraph[];
}
