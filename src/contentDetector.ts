// ============================================
// 🔍 Smart Content Detection Engine
// Detects: Pure Markdown | Pure Mermaid | Mixed
// ============================================

export type ContentType = "markdown" | "mermaid" | "mixed" | "empty";

export interface DetectionResult {
  type: ContentType;
  label: string;
  emoji: string;
  color: string;           // Tailwind color class
  bgColor: string;         // Tailwind bg class
  borderColor: string;     // Tailwind border class
  description: string;
  mermaidBlockCount: number;
  wasAutoWrapped: boolean;
  wasAutoFixed: boolean;
  fixes: string[];         // List of auto-fixes applied
}

// All known Mermaid diagram type keywords (first line of a mermaid diagram)
const MERMAID_KEYWORDS = [
  "graph",
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "journey",
  "gantt",
  "pie",
  "quadrantChart",
  "requirementDiagram",
  "gitGraph",
  "mindmap",
  "timeline",
  "zenuml",
  "sankey-beta",
  "xychart-beta",
  "block-beta",
  "packet-beta",
  "kanban",
  "architecture-beta",
];

// Case-insensitive variants that people commonly mistype
const MERMAID_KEYWORDS_LOWER = MERMAID_KEYWORDS.map((k) => k.toLowerCase());

/**
 * Check if a string looks like raw Mermaid code (not wrapped in ```mermaid)
 */
export function looksLikeMermaid(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const firstLine = trimmed.split("\n")[0].trim().toLowerCase();

  // Check if first line starts with any mermaid keyword
  for (const keyword of MERMAID_KEYWORDS_LOWER) {
    if (firstLine === keyword || firstLine.startsWith(keyword + " ") || firstLine.startsWith(keyword + "\t")) {
      return true;
    }
  }

  // Also check common misspellings
  if (
    firstLine === "gitgraph" ||
    firstLine === "sequencediagram" ||
    firstLine === "classdiagram" ||
    firstLine === "statediagram" ||
    firstLine === "erdiagram" ||
    firstLine.startsWith("graph ") ||
    firstLine.startsWith("flowchart ")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if input contains markdown fenced mermaid blocks
 */
export function containsMermaidBlocks(text: string): boolean {
  return /```mermaid\s*\n/i.test(text);
}

/**
 * Check if input has any markdown features (headers, lists, links, bold, etc.)
 */
function hasMarkdownFeatures(text: string): boolean {
  const mdPatterns = [
    /^#{1,6}\s/m,           // Headers
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Ordered lists
    /\[.+?\]\(.+?\)/,       // Links
    /!\[.*?\]\(.+?\)/,      // Images
    /\*\*.+?\*\*/,          // Bold
    /\*.+?\*/,              // Italic
    /~~.+?~~/,              // Strikethrough
    /^>\s/m,                // Blockquotes
    /\|.+\|.+\|/,           // Tables
    /^---+$/m,              // Horizontal rules
    /^===+$/m,              // Alt horizontal rules
    /```[\s\S]*?```/,       // Code blocks (any)
    /`[^`]+`/,              // Inline code
    /^\s*- \[[ x]\]/m,     // Task lists
  ];

  let matchCount = 0;
  for (const pattern of mdPatterns) {
    if (pattern.test(text)) matchCount++;
  }

  return matchCount >= 1;
}

/**
 * Count mermaid blocks in content
 */
function countMermaidBlocks(text: string): number {
  const matches = text.match(/```mermaid/gi);
  return matches ? matches.length : 0;
}

/**
 * Main detection function — analyzes input and returns type + metadata
 */
export function detectContentType(text: string): DetectionResult {
  const trimmed = text.trim();

  // Empty
  if (!trimmed) {
    return {
      type: "empty",
      label: "Empty",
      emoji: "📭",
      color: "text-slate-400",
      bgColor: "bg-slate-500/20",
      borderColor: "border-slate-500/30",
      description: "No content — start typing!",
      mermaidBlockCount: 0,
      wasAutoWrapped: false,
      wasAutoFixed: false,
      fixes: [],
    };
  }

  const hasMD = hasMarkdownFeatures(trimmed);
  const hasMermaidBlocks = containsMermaidBlocks(trimmed);
  const isRawMermaid = looksLikeMermaid(trimmed);
  const blockCount = countMermaidBlocks(trimmed);

  // Case 1: Raw Mermaid (no markdown, no fencing)
  if (isRawMermaid && !hasMD && !hasMermaidBlocks) {
    return {
      type: "mermaid",
      label: "Raw Mermaid",
      emoji: "🧩",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      description: "Raw Mermaid diagram detected — auto-wrapped in ```mermaid fence",
      mermaidBlockCount: 1,
      wasAutoWrapped: true,
      wasAutoFixed: false,
      fixes: ["Auto-wrapped in ```mermaid code fence"],
    };
  }

  // Case 2: Markdown with Mermaid blocks (mixed)
  if (hasMD && (hasMermaidBlocks || isRawMermaid)) {
    return {
      type: "mixed",
      label: "Markdown + Mermaid",
      emoji: "📄🧩",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/30",
      description: `Mixed content — ${blockCount || (isRawMermaid ? 1 : 0)} Mermaid diagram${(blockCount || 1) > 1 ? "s" : ""} detected`,
      mermaidBlockCount: blockCount || (isRawMermaid ? 1 : 0),
      wasAutoWrapped: false,
      wasAutoFixed: false,
      fixes: [],
    };
  }

  // Case 3: Markdown only (with mermaid blocks but no markdown features = still mermaid-focused)
  if (hasMermaidBlocks && !hasMD) {
    return {
      type: "mixed",
      label: "Fenced Mermaid",
      emoji: "🧩",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      description: `${blockCount} fenced Mermaid diagram${blockCount > 1 ? "s" : ""}`,
      mermaidBlockCount: blockCount,
      wasAutoWrapped: false,
      wasAutoFixed: false,
      fixes: [],
    };
  }

  // Case 4: Pure Markdown
  if (hasMD && !hasMermaidBlocks && !isRawMermaid) {
    return {
      type: "markdown",
      label: "Markdown",
      emoji: "📄",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      description: "Standard Markdown content",
      mermaidBlockCount: 0,
      wasAutoWrapped: false,
      wasAutoFixed: false,
      fixes: [],
    };
  }

  // Fallback: treat as markdown
  return {
    type: "markdown",
    label: "Text",
    emoji: "📝",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    borderColor: "border-slate-500/30",
    description: "Plain text content",
    mermaidBlockCount: 0,
    wasAutoWrapped: false,
    wasAutoFixed: false,
    fixes: [],
  };
}
