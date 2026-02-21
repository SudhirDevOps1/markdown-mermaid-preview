// ============================================
// 🔧 Mermaid Auto-Fixer Engine
// Fixes common errors BEFORE rendering
// ============================================

export interface FixResult {
  output: string;
  fixes: string[];
  wasModified: boolean;
}

/**
 * Fix common GitGraph errors inside a mermaid code string:
 * 1. gitgraph/GitGraph/GITGRAPH → gitGraph (camelCase)
 * 2. tag: "..." on separate line → merged with previous commit line
 * 3. sequencediagram → sequenceDiagram
 * 4. classdiagram → classDiagram
 * 5. statediagram → stateDiagram
 * 6. erdiagram → erDiagram
 * 7. Remove BOM / invisible chars at start
 */
export function fixMermaidCode(source: string): FixResult {
  const fixes: string[] = [];
  let code = source;

  // Fix 0: Remove BOM and zero-width characters
  const originalLength = code.length;
  code = code.replace(/^\uFEFF/, ""); // BOM
  code = code.replace(/[\u200B\u200C\u200D\uFEFF]/g, ""); // zero-width chars
  if (code.length !== originalLength) {
    fixes.push("Removed invisible characters (BOM/zero-width)");
  }

  // Fix 1: gitGraph capitalization
  // Must match only the diagram type keyword at the start of the content
  const gitGraphRegex = /^(\s*)(gitgraph|GitGraph|GITGRAPH|Gitgraph|GITGraph|gitgRAPH|GITgraph)\b/im;
  if (gitGraphRegex.test(code)) {
    const match = code.match(gitGraphRegex);
    if (match && match[2] !== "gitGraph") {
      code = code.replace(gitGraphRegex, "$1gitGraph");
      fixes.push(`Fixed capitalization: "${match[2]}" → "gitGraph"`);
    }
  }

  // Fix 2: sequenceDiagram capitalization
  const seqRegex = /^(\s*)(sequencediagram|SequenceDiagram|SEQUENCEDIAGRAM)\b/im;
  if (seqRegex.test(code)) {
    const match = code.match(seqRegex);
    if (match && match[2] !== "sequenceDiagram") {
      code = code.replace(seqRegex, "$1sequenceDiagram");
      fixes.push(`Fixed capitalization: "${match[2]}" → "sequenceDiagram"`);
    }
  }

  // Fix 3: classDiagram capitalization
  const classRegex = /^(\s*)(classdiagram|ClassDiagram|CLASSDIAGRAM)\b/im;
  if (classRegex.test(code)) {
    const match = code.match(classRegex);
    if (match && match[2] !== "classDiagram") {
      code = code.replace(classRegex, "$1classDiagram");
      fixes.push(`Fixed capitalization: "${match[2]}" → "classDiagram"`);
    }
  }

  // Fix 4: stateDiagram capitalization
  const stateRegex = /^(\s*)(statediagram|StateDiagram|STATEDIAGRAM)(-v2)?\b/im;
  if (stateRegex.test(code)) {
    const match = code.match(stateRegex);
    if (match && match[2] !== "stateDiagram") {
      code = code.replace(stateRegex, "$1stateDiagram$3");
      fixes.push(`Fixed capitalization: "${match[2]}" → "stateDiagram"`);
    }
  }

  // Fix 5: erDiagram capitalization
  const erRegex = /^(\s*)(erdiagram|ErDiagram|ERDIAGRAM)\b/im;
  if (erRegex.test(code)) {
    const match = code.match(erRegex);
    if (match && match[2] !== "erDiagram") {
      code = code.replace(erRegex, "$1erDiagram");
      fixes.push(`Fixed capitalization: "${match[2]}" → "erDiagram"`);
    }
  }

  // Fix 6: tag: on separate line → merge with previous commit line
  // Pattern: line ends with commit ...\n   tag: "..."
  const tagFixRegex = /^([ \t]*(?:commit|merge)[ \t]+.*)[\r\n]+([ \t]+tag:[ \t]+"[^"]*")/gm;
  let tagFixCount = 0;
  while (tagFixRegex.test(code)) {
    // reset lastIndex after test
    tagFixRegex.lastIndex = 0;
    code = code.replace(tagFixRegex, (_, commitLine, tagPart) => {
      tagFixCount++;
      return `${commitLine} ${tagPart.trim()}`;
    });
  }
  if (tagFixCount > 0) {
    fixes.push(
      `Moved "tag:" to same line as "commit" (${tagFixCount} fix${tagFixCount > 1 ? "es" : ""})`
    );
  }

  // Fix 7: type: on separate line → merge with previous commit line (same pattern)
  const typeFixRegex = /^([ \t]*commit[ \t]+.*)[\r\n]+([ \t]+type:[ \t]+\w+)/gm;
  let typeFixCount = 0;
  while (typeFixRegex.test(code)) {
    typeFixRegex.lastIndex = 0;
    code = code.replace(typeFixRegex, (_, commitLine, typePart) => {
      typeFixCount++;
      return `${commitLine} ${typePart.trim()}`;
    });
  }
  if (typeFixCount > 0) {
    fixes.push(
      `Moved "type:" to same line as "commit" (${typeFixCount} fix${typeFixCount > 1 ? "es" : ""})`
    );
  }

  return {
    output: code,
    fixes,
    wasModified: fixes.length > 0,
  };
}

/**
 * Process full document: find all ```mermaid blocks and fix each one.
 * Also auto-wrap raw mermaid if detected.
 */
export function fixMermaidInDocument(fullText: string, isRawMermaid: boolean): FixResult {
  const allFixes: string[] = [];
  let result = fullText;

  // If it's raw mermaid (no fencing), wrap it first
  if (isRawMermaid) {
    const { output, fixes } = fixMermaidCode(result);
    result = "```mermaid\n" + output + "\n```";
    allFixes.push("Auto-wrapped raw Mermaid in ```mermaid code fence");
    allFixes.push(...fixes);
    return {
      output: result,
      fixes: allFixes,
      wasModified: true,
    };
  }

  // Find and fix all ```mermaid blocks in the document
  const mermaidBlockRegex = /(```mermaid\s*\n)([\s\S]*?)(```)/gi;
  result = result.replace(mermaidBlockRegex, (fullMatch, opening, code, closing) => {
    const { output, fixes } = fixMermaidCode(code);
    allFixes.push(...fixes);
    if (fixes.length > 0) {
      return opening + output + closing;
    }
    return fullMatch;
  });

  return {
    output: result,
    fixes: allFixes,
    wasModified: allFixes.length > 0,
  };
}
