export const sampleMarkdown = `# 🚀 Smart Markdown + Mermaid Preview

> **Built by Sudhir Kumar** · [\`@sudhi123\`](https://github.com/sudhi123) · Always Dark Theme 🌙

## 📌 Project Overview
This system **automatically detects** whether your input is:
- 📄 **Standard Markdown** — renders normally
- 🧩 **Raw Mermaid code** — auto-wraps in \`\`\`mermaid fence
- 📄🧩 **Mixed content** — Markdown with Mermaid blocks

It also **auto-fixes** common Mermaid errors before rendering!

---

## 🔍 Smart Detection — How It Works

| You Paste This... | System Detects | Action Taken |
|---|---|---|
| Normal \`# Heading\` markdown | 📄 Markdown | Render as HTML |
| Raw \`gitGraph\\ncommit...\` | 🧩 Raw Mermaid | Auto-wrap + render |
| README with \`\`\`mermaid blocks | 📄🧩 Mixed | Parse both |
| \`gitgraph\` (wrong case) | 🧩 Mermaid + Error | Auto-fix → \`gitGraph\` |
| \`tag:\` on separate line | 🧩 Mermaid + Error | Auto-fix → same line |

> 💡 **Try it!** Paste any raw Mermaid code (without \`\`\`mermaid fencing) in the editor — it will auto-detect and render!

---

## 📊 Git Branch Flow Diagram

\`\`\`mermaid
gitGraph
    commit id: "init"
    commit id: "add editor"
    branch feature/preview
    commit id: "add preview"
    commit id: "add split view"
    checkout main
    commit id: "add toolbar"
    merge feature/preview id: "merge preview"
    branch feature/mermaid
    commit id: "add mermaid"
    commit id: "add themes"
    checkout main
    merge feature/mermaid id: "merge mermaid"
    commit id: "v1.0 release" tag: "v1.0"
\`\`\`

---

## ⚠️ Common GitGraph Errors (Auto-Fixed!)

### 🐛 Error 1: \`No diagram type detected\`

**Cause:** Wrong capitalization of the keyword.

\`\`\`text
❌ WRONG — causes "No diagram type detected"

gitgraph            ← lowercase "g" in "graph" = BROKEN
  commit id: "init"
\`\`\`

**Fix:** Use \`gitGraph\` (camelCase — capital **G**):

\`\`\`text
✅ CORRECT

gitGraph             ← capital "G" in "Graph"
    commit id: "init"
\`\`\`

> 🔧 **This system auto-fixes this!** Even if you type \`gitgraph\`, it gets corrected to \`gitGraph\`.

| Wrong Spelling | Auto-Fixed To |
|---|---|
| \`gitgraph\` | \`gitGraph\` ✅ |
| \`GitGraph\` | \`gitGraph\` ✅ |
| \`GITGRAPH\` | \`gitGraph\` ✅ |
| \`sequencediagram\` | \`sequenceDiagram\` ✅ |
| \`classdiagram\` | \`classDiagram\` ✅ |

---

### 🐛 Error 2: \`Expecting token of type 'EOF' but found 'tag:'\`

**This was YOUR exact error!**

\`\`\`text
❌ WRONG — causes "Expecting EOF but found tag:"

gitGraph
    commit id: "v1.0 release"
    tag: "v1.0"           ← WRONG! tag: on its own line = BROKEN
\`\`\`

**Fix:** Put \`tag: "v1.0"\` on the **same line** as the \`commit\`:

\`\`\`text
✅ CORRECT — tag: is part of the commit command

gitGraph
    commit id: "v1.0 release" tag: "v1.0"    ← SAME line!
\`\`\`

> 🔧 **This system auto-fixes this too!** If \`tag:\` is on a separate line, it automatically moves it.

---

## 🧪 Test: Paste Raw Mermaid

Try clearing this editor and pasting this raw code (without fences):

\`\`\`text
gitGraph
    commit id: "start"
    branch develop
    commit id: "feature-1"
    checkout main
    merge develop id: "merge"
    commit id: "release" tag: "v2.0"
\`\`\`

The system will:
1. ✅ Detect it as **Raw Mermaid**
2. ✅ Auto-wrap in \`\`\`mermaid fence
3. ✅ Fix any capitalization errors
4. ✅ Render the diagram

---

## 📊 More Mermaid Diagrams

### Flowchart — Smart Detection Pipeline

\`\`\`mermaid
flowchart TD
    A[📝 User Input] -->|Paste / Type| B{🔍 Content Detector}
    B -->|Pure Markdown| C[📄 marked.js Parser]
    B -->|Raw Mermaid| D[🔧 Auto-Fixer]
    B -->|Mixed Content| E[📄🧩 Split Parser]
    D -->|Fix gitgraph → gitGraph| F[🔧 Capitalize Fix]
    D -->|Fix tag: line| G[🔧 Tag Line Fix]
    D -->|Auto-wrap fence| H[📦 Add Fences]
    F --> I[✅ Fixed Mermaid]
    G --> I
    H --> I
    I --> J[🎨 Mermaid Renderer]
    C --> K[✨ Live Preview]
    E --> K
    J --> K

    style A fill:#6366f1,stroke:#4f46e5,color:#fff
    style B fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#ef4444,stroke:#dc2626,color:#fff
    style K fill:#10b981,stroke:#059669,color:#fff
\`\`\`

### Sequence Diagram — User Flow

\`\`\`mermaid
sequenceDiagram
    actor User
    participant Editor
    participant Detector as 🔍 Detector
    participant Fixer as 🔧 Fixer
    participant Parser
    participant Preview

    User->>Editor: Pastes content
    Editor->>Detector: Analyze input
    Detector->>Detector: Check patterns
    alt Raw Mermaid
        Detector->>Fixer: Fix + auto-wrap
        Fixer->>Parser: Corrected markdown
    else Markdown with Mermaid
        Detector->>Fixer: Fix mermaid blocks
        Fixer->>Parser: Fixed markdown
    else Pure Markdown
        Detector->>Parser: Pass through
    end
    Parser->>Preview: Rendered HTML
    Preview-->>User: Live preview
\`\`\`

### Pie Chart — Tech Stack

\`\`\`mermaid
pie title Technology Breakdown
    "React + TypeScript" : 30
    "Tailwind CSS" : 20
    "Marked.js" : 15
    "Mermaid.js" : 15
    "Highlight.js" : 10
    "Smart Detector" : 10
\`\`\`

### State Diagram — App States

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Detecting: User types / pastes
    Detecting --> RawMermaid: No MD features
    Detecting --> PureMarkdown: No Mermaid
    Detecting --> MixedContent: Both detected
    RawMermaid --> AutoFixing: Check errors
    AutoFixing --> AutoWrapping: Add fences
    AutoWrapping --> Parsing: Process MD
    MixedContent --> AutoFixing
    PureMarkdown --> Parsing
    Parsing --> Rendering: HTML ready
    Rendering --> MermaidInit: Has diagrams
    Rendering --> Preview: No diagrams
    MermaidInit --> Preview: SVGs rendered
    Preview --> Idle: User edits
    Preview --> Exporting: Click export
    Exporting --> Preview: Downloaded
    Preview --> [*]: Close
\`\`\`

### Class Diagram — System Architecture

\`\`\`mermaid
classDiagram
    class ContentDetector {
        +detectContentType(text) DetectionResult
        +looksLikeMermaid(text) boolean
        +containsMermaidBlocks(text) boolean
    }
    class MermaidFixer {
        +fixMermaidCode(source) FixResult
        +fixMermaidInDocument(text) FixResult
        +fixCapitalization()
        +fixTagPlacement()
        +autoWrapRawMermaid()
    }
    class App {
        +string markdown
        +string processedMarkdown
        +DetectionResult detection
        +parseMarkdown()
        +renderMermaid()
        +exportHTML()
        +copyHTML()
    }
    class MarkedParser {
        +parse(md) string
        +renderCode(token) string
    }
    ContentDetector --> App : provides detection
    MermaidFixer --> App : provides fixes
    App --> MarkedParser : sends processed MD
\`\`\`

---

## 📋 GitGraph Command Reference

| Command | Syntax | Example |
|---|---|---|
| Commit | \`commit id: "msg"\` | \`commit id: "init"\` |
| Commit + Tag | \`commit id: "msg" tag: "label"\` | \`commit id: "v1.0" tag: "v1.0"\` |
| Branch | \`branch name\` | \`branch feature/login\` |
| Checkout | \`checkout name\` | \`checkout main\` |
| Merge | \`merge name id: "msg"\` | \`merge feature/login id: "merge"\` |

> ⚠️ **\`tag:\` is NOT a standalone command.** It's part of \`commit\`.
> ⚠️ **\`gitGraph\` must be camelCase.** Not \`gitgraph\` or \`GitGraph\`.

---

## 📋 Quick Reference — Mermaid Diagram Types

| Diagram Type | Keyword | Case Sensitive? |
|---|---|---|
| Flowchart | \`flowchart\` | ✅ lowercase |
| Sequence | \`sequenceDiagram\` | ✅ camelCase |
| Class | \`classDiagram\` | ✅ camelCase |
| State | \`stateDiagram-v2\` | ✅ camelCase |
| Git Graph | \`gitGraph\` | ✅ **camelCase** |
| Pie Chart | \`pie\` | ✅ lowercase |
| ER Diagram | \`erDiagram\` | ✅ camelCase |
| Gantt | \`gantt\` | ✅ lowercase |
| Journey | \`journey\` | ✅ lowercase |

> ⚠️ **Remember**: \`gitGraph\` NOT \`gitgraph\`, \`GitGraph\`, or \`Gitgraph\`
> ⚠️ **Remember**: \`tag:\` goes on the **same line** as \`commit\`, never on its own line

---

## ▶️ How to View Diagram in VS Code

1. Install **Markdown Preview Mermaid Support** extension
2. Open this README.md file
3. Press **Ctrl + Shift + V** (or **Cmd + Shift + V** on Mac)
4. Diagram will render automatically

---

## 🚀 Features

- [x] Live Markdown preview
- [x] 🌙 **Always Dark Theme** — editor & preview
- [x] 🔍 **Smart content detection** (Markdown / Mermaid / Mixed)
- [x] 🔧 **Auto-fix** GitGraph capitalization errors
- [x] 🔧 **Auto-fix** tag: line placement errors
- [x] 📦 **Auto-wrap** raw Mermaid in code fences
- [x] Mermaid diagram rendering (6+ diagram types)
- [x] GitGraph with correct syntax
- [x] ✨ **Enhanced syntax highlighting** (Catppuccin Mocha Dark)
- [x] Export as standalone HTML
- [x] Copy HTML to clipboard
- [x] Split/Editor/Preview view modes
- [x] 🎨 Dark themed editor + preview
- [x] Responsive design
- [x] GFM tables & task lists
- [x] Clear error messages
- [x] Smooth animations & transitions

---

## 💻 Code Example

\`\`\`typescript
// Smart Content Detection + Auto-Fix Pipeline
import { detectContentType } from './contentDetector';
import { fixMermaidInDocument } from './mermaidFixer';

function processInput(text: string) {
  // Step 1: Detect what kind of content this is
  const detection = detectContentType(text);
  
  // Step 2: Auto-fix Mermaid errors
  const isRawMermaid = detection.type === 'mermaid';
  const { output, fixes } = fixMermaidInDocument(text, isRawMermaid);
  
  // Step 3: Parse the fixed content
  const html = marked.parse(output);
  
  console.log(\`Type: \${detection.label}\`);
  console.log(\`Fixes: \${fixes.join(', ')}\`);
  
  return html;
}
\`\`\`

\`\`\`javascript
// Example: React Hook for smart detection
const useSmartDetection = (input) => {
  const detection = useMemo(() => detectContentType(input), [input]);
  const fixed = useMemo(() => {
    const isRaw = detection.type === 'mermaid';
    return fixMermaidInDocument(input, isRaw);
  }, [input, detection.type]);
  
  return { detection, ...fixed };
};
\`\`\`

\`\`\`python
# README.md → HTML Preview (Python version)
import markdown
import webbrowser

with open("README.md", "r", encoding="utf-8") as f:
    md = f.read()

html = markdown.markdown(md, extensions=["tables", "fenced_code"])
print("✅ Converted successfully!")
\`\`\`

\`\`\`css
/* Dark theme variables */
:root {
  --bg-primary: #0a0a14;
  --bg-secondary: #12121f;
  --accent: #8b5cf6;
  --text: #cbd5e1;
  --text-muted: #64748b;
}
\`\`\`

\`\`\`json
{
  "developer": "Sudhir Kumar",
  "username": "@sudhi123",
  "theme": "always-dark",
  "features": ["markdown", "mermaid", "smart-detect", "auto-fix"]
}
\`\`\`

---

## 🛠 Requirements
- VS Code with Mermaid extension
- Or use this web-based preview!

---

## 👨‍💻 Developer

**Sudhir Kumar** · \`@sudhi123\`
BCA Student

> *"Code karo, bugs fix karo, deploy karo"* 🚀

---

*Built with ❤️ by [@sudhi123](https://github.com/sudhi123)*
*React • TypeScript • Tailwind CSS • Marked.js • Highlight.js • Mermaid.js*
*Enhanced with 🔍 Smart Detection • 🔧 Auto-Fix Engine • 🌙 Always Dark Theme*
`;
