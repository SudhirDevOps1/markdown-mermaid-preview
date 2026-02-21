import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import mermaid from "mermaid";
import { sampleMarkdown } from "./sampleMarkdown";
import { detectContentType, type DetectionResult } from "./contentDetector";
import { fixMermaidInDocument } from "./mermaidFixer";

// ===== Theme type =====
type Theme = "dark" | "light";
type ViewMode = "split" | "editor" | "preview";

// ===== Mermaid dark theme variables =====
const MERMAID_DARK_VARS = {
  darkMode: true,
  background: "#1e1e2e",
  primaryColor: "#8b5cf6",
  primaryTextColor: "#cdd6f4",
  primaryBorderColor: "#6c7086",
  lineColor: "#6c7086",
  secondaryColor: "#313244",
  tertiaryColor: "#45475a",
  noteBkgColor: "#1e1e2e",
  noteTextColor: "#cdd6f4",
  noteBorderColor: "#6c7086",
  actorTextColor: "#cdd6f4",
  actorBorder: "#8b5cf6",
  actorBkg: "#1e1e2e",
  signalColor: "#cdd6f4",
  signalTextColor: "#cdd6f4",
  labelBoxBkgColor: "#1e1e2e",
  labelBoxBorderColor: "#6c7086",
  labelTextColor: "#cdd6f4",
  loopTextColor: "#cdd6f4",
  activationBorderColor: "#8b5cf6",
  activationBkgColor: "#313244",
  sequenceNumberColor: "#1e1e2e",
  sectionBkgColor: "#313244",
  altSectionBkgColor: "#1e1e2e",
  taskBkgColor: "#8b5cf6",
  taskTextColor: "#ffffff",
  taskBorderColor: "#6c7086",
  todayLineColor: "#f38ba8",
  git0: "#8b5cf6", git1: "#89b4fa", git2: "#a6e3a1", git3: "#fab387",
  git4: "#f38ba8", git5: "#f9e2af", git6: "#94e2d5", git7: "#f5c2e7",
  gitInv0: "#ffffff",
  gitBranchLabel0: "#ffffff", gitBranchLabel1: "#ffffff",
  gitBranchLabel2: "#ffffff", gitBranchLabel3: "#ffffff",
  commitLabelColor: "#cdd6f4",
  commitLabelBackground: "#313244",
  tagLabelColor: "#1e1e2e",
  tagLabelBackground: "#a6e3a1",
  tagLabelBorder: "#a6e3a1",
  pieStrokeColor: "#1e1e2e",
  pieSectionTextColor: "#ffffff",
  pieTitleTextColor: "#cdd6f4",
  pie1: "#8b5cf6", pie2: "#89b4fa", pie3: "#a6e3a1", pie4: "#fab387",
  pie5: "#f38ba8", pie6: "#f9e2af", pie7: "#94e2d5", pie8: "#f5c2e7",
  classText: "#cdd6f4",
  relationColor: "#6c7086",
  relationLabelColor: "#cdd6f4",
};

const MERMAID_LIGHT_VARS = {
  darkMode: false,
  background: "#ffffff",
  primaryColor: "#6366f1",
  primaryTextColor: "#1e293b",
  primaryBorderColor: "#cbd5e1",
  lineColor: "#94a3b8",
  secondaryColor: "#e0e7ff",
  tertiaryColor: "#f1f5f9",
  noteBkgColor: "#fefce8",
  noteTextColor: "#1e293b",
  noteBorderColor: "#cbd5e1",
  actorTextColor: "#1e293b",
  actorBorder: "#6366f1",
  actorBkg: "#eef2ff",
  signalColor: "#1e293b",
  signalTextColor: "#1e293b",
  labelBoxBkgColor: "#eef2ff",
  labelBoxBorderColor: "#cbd5e1",
  labelTextColor: "#1e293b",
  loopTextColor: "#1e293b",
  activationBorderColor: "#6366f1",
  activationBkgColor: "#e0e7ff",
  sequenceNumberColor: "#ffffff",
  sectionBkgColor: "#eef2ff",
  altSectionBkgColor: "#f8fafc",
  taskBkgColor: "#6366f1",
  taskTextColor: "#ffffff",
  taskBorderColor: "#4f46e5",
  todayLineColor: "#ef4444",
  git0: "#6366f1", git1: "#2563eb", git2: "#16a34a", git3: "#ea580c",
  git4: "#dc2626", git5: "#ca8a04", git6: "#0891b2", git7: "#db2777",
  gitInv0: "#ffffff",
  gitBranchLabel0: "#ffffff", gitBranchLabel1: "#ffffff",
  gitBranchLabel2: "#ffffff", gitBranchLabel3: "#ffffff",
  commitLabelColor: "#1e293b",
  commitLabelBackground: "#e0e7ff",
  tagLabelColor: "#ffffff",
  tagLabelBackground: "#16a34a",
  tagLabelBorder: "#16a34a",
  pieStrokeColor: "#ffffff",
  pieSectionTextColor: "#ffffff",
  pieTitleTextColor: "#1e293b",
  pie1: "#6366f1", pie2: "#2563eb", pie3: "#16a34a", pie4: "#ea580c",
  pie5: "#dc2626", pie6: "#ca8a04", pie7: "#0891b2", pie8: "#db2777",
  classText: "#1e293b",
  relationColor: "#94a3b8",
  relationLabelColor: "#1e293b",
};

// ===== Init mermaid =====
function initMermaid(theme: Theme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "dark" ? "dark" : "default",
    securityLevel: "loose",
    fontFamily: "'Inter', sans-serif",
    gitGraph: {
      showBranches: true,
      showCommitLabel: true,
      mainBranchName: "main",
      rotateCommitLabel: false,
    },
    themeVariables: theme === "dark" ? MERMAID_DARK_VARS : MERMAID_LIGHT_VARS,
  });
}

// ===== Unique ID generator =====
let mermaidIdCounter = 0;
function nextMermaidId() {
  mermaidIdCounter += 1;
  return "mmd-" + Date.now() + "-" + mermaidIdCounter;
}

// ===== Marked config =====
const renderer = new marked.Renderer();
const originalCode = renderer.code;

renderer.code = function (codeToken) {
  if (!codeToken) return originalCode.call(this, codeToken);
  const lang = (codeToken.lang || "").trim().toLowerCase();
  const text = codeToken.text || "";

  if (lang === "mermaid") {
    const id = nextMermaidId();
    const encoded = btoa(encodeURIComponent(text));
    return '<div class="mermaid-placeholder" data-mermaid-id="' + id + '" data-mermaid-source="' + encoded + '"><div class="mermaid-loading"><div class="spinner"></div>Rendering diagram...</div></div>';
  }

  let highlighted: string;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(text, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(text).value;
    }
  } catch {
    highlighted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const langLabel = lang || "code";
  return '<div class="code-block-wrapper"><div class="code-block-header"><span class="code-block-lang">' + langLabel + '</span><span class="code-block-dots"><span></span><span></span><span></span></span></div><pre><code class="hljs language-' + (lang || "text") + '">' + highlighted + '</code></pre></div>';
};

marked.setOptions({ renderer, gfm: true, breaks: false });

// ===== SVG Icons =====
const SunIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

// ===== APP =====
export function App() {
  // Load theme from localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("md-preview-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* ignore */ }
    return "dark";
  });

  const [markdownText, setMarkdownText] = useState(sampleMarkdown);
  const [htmlContent, setHtmlContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showFixPanel, setShowFixPanel] = useState(false);
  const [mermaidKey, setMermaidKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Responsive: auto-switch to preview on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === "split") {
        setViewMode("preview");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  // Apply theme to DOM + init mermaid
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("md-preview-theme", theme);
    initMermaid(theme);
    // Force mermaid re-render
    setMermaidKey(k => k + 1);
  }, [theme]);

  // Init mermaid on mount
  useEffect(() => {
    initMermaid(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // ===== Smart detection =====
  const detection: DetectionResult = useMemo(
    () => detectContentType(markdownText),
    [markdownText]
  );

  // ===== Auto-fix =====
  const fixResult = useMemo(() => {
    const isRawMermaid = detection.type === "mermaid";
    return fixMermaidInDocument(markdownText, isRawMermaid);
  }, [markdownText, detection.type]);

  const processedText = fixResult.output;
  const appliedFixes = fixResult.fixes;
  const hasAutoFixes = appliedFixes.length > 0;

  useEffect(() => {
    if (hasAutoFixes) setShowFixPanel(true);
  }, [hasAutoFixes]);

  // Parse markdown
  const parseMarkdown = useCallback((md: string) => {
    try {
      const result = marked.parse(md);
      if (typeof result === "string") setHtmlContent(result);
    } catch {
      setHtmlContent("<p style='color:#f87171;'>Error parsing markdown</p>");
    }
  }, []);

  // Debounced parsing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      parseMarkdown(processedText);
    }, 120);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [processedText, parseMarkdown]);

  // Render Mermaid diagrams — runs whenever htmlContent or mermaidKey changes
  useEffect(() => {
    if (!previewRef.current) return;

    const placeholders = previewRef.current.querySelectorAll(".mermaid-placeholder");
    if (placeholders.length === 0) return;

    const renderDiagrams = async () => {
      for (const el of Array.from(placeholders)) {
        const encoded = el.getAttribute("data-mermaid-source");
        if (!encoded) continue;

        // Always re-render (theme may have changed)
        const freshId = nextMermaidId();

        try {
          const source = decodeURIComponent(atob(encoded));
          const { svg } = await mermaid.render(freshId, source);
          el.innerHTML = '<div class="mermaid-container animate-fade-in">' + svg + '</div>';
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const safeMsg = errMsg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          el.innerHTML = '<div class="mermaid-error"><div class="mermaid-error-title">\u26A0\uFE0F Mermaid Error</div><div class="mermaid-error-body">' + safeMsg + '</div><div class="mermaid-error-hint">\uD83D\uDCA1 <strong>Tip:</strong> Check diagram type capitalization (e.g. <code>gitGraph</code> not <code>gitgraph</code>) and ensure <code>tag:</code> is on the same line as <code>commit</code>.</div></div>';
        }
      }
    };

    const timer = window.setTimeout(renderDiagrams, 80);
    return () => clearTimeout(timer);
  }, [htmlContent, mermaidKey]);

  // Stats
  const lines = markdownText.split("\n").length;
  const words = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
  const chars = markdownText.length;

  // Copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = htmlContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Export
  const handleExport = () => {
    const mermaidTheme = theme === "dark" ? "dark" : "default";
    const exportBg = theme === "dark" ? "#0a0a14" : "#ffffff";
    const exportText = theme === "dark" ? "#cbd5e1" : "#334155";
    const exportHeading = theme === "dark" ? "#f1f5f9" : "#0f172a";
    const exportCode = theme === "dark" ? "#cdd6f4" : "#334155";
    const exportCodeBg = theme === "dark" ? "#11111b" : "#f8f9fc";
    const exportLink = theme === "dark" ? "#818cf8" : "#4f46e5";
    const exportStrong = theme === "dark" ? "#f1f5f9" : "#0f172a";
    const exportTh = theme === "dark" ? "#c4b5fd" : "#4f46e5";
    const exportTd = theme === "dark" ? "#94a3b8" : "#475569";
    const exportBq = theme === "dark" ? "#a5b4fc" : "#4f46e5";
    const exportLi = theme === "dark" ? "#b8c5d6" : "#475569";
    const accentHex = theme === "dark" ? "139,92,246" : "99,102,241";
    const mermaidBg = theme === "dark" ? "rgba(30,30,46,0.8)" : "#f8f9ff";

    const bodyHtml = htmlContent.replace(
      /<div class="mermaid-placeholder"[^>]*data-mermaid-source="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
      (_m, enc) => {
        try {
          const src = decodeURIComponent(atob(enc));
          return '<div class="mermaid">\n' + src + '\n</div>';
        } catch {
          return '<div>Error decoding diagram</div>';
        }
      }
    );

    const fullHTML = '<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>README Preview \u2014 @sudhi123</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Inter",-apple-system,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:' + exportText + ';line-height:1.8;background:' + exportBg + '}h1{font-size:2.1em;font-weight:800;border-bottom:2px solid rgba(' + accentHex + ',0.3);padding-bottom:14px;margin-bottom:20px;color:' + exportHeading + '}h2{font-size:1.6em;font-weight:700;border-bottom:1px solid rgba(' + accentHex + ',0.2);padding-bottom:10px;margin-top:36px;color:' + exportHeading + '}h3{font-size:1.3em;font-weight:600;margin-top:28px;color:' + exportTh + '}code:not(pre code){background:rgba(' + accentHex + ',0.1);border:1px solid rgba(' + accentHex + ',0.2);padding:2px 7px;border-radius:5px;font-family:"JetBrains Mono",monospace;font-size:0.85em;color:' + exportTh + '}pre{background:' + exportCodeBg + ';border-radius:12px;overflow:hidden;border:1px solid rgba(' + accentHex + ',0.12)}pre code{display:block;padding:22px;color:' + exportCode + ';font-size:13px;overflow-x:auto;background:transparent;border:none;font-family:"JetBrains Mono",monospace}blockquote{border-left:4px solid rgba(' + accentHex + ',1);background:rgba(' + accentHex + ',0.06);padding:14px 22px;margin:0 0 16px;border-radius:0 10px 10px 0;color:' + exportBq + '}table{width:100%;border-collapse:collapse;border:1px solid rgba(' + accentHex + ',0.15);margin-bottom:20px;border-radius:10px;overflow:hidden}thead{background:rgba(' + accentHex + ',0.08)}th{padding:12px 18px;text-align:left;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.08em;color:' + exportTh + ';border-bottom:2px solid rgba(' + accentHex + ',0.2)}td{padding:11px 18px;border-bottom:1px solid rgba(' + accentHex + ',0.08);color:' + exportTd + '}hr{border:none;height:1px;background:linear-gradient(to right,transparent,rgba(' + accentHex + ',0.3),transparent);margin:36px 0}a{color:' + exportLink + ';text-decoration:none}a:hover{text-decoration:underline}strong{color:' + exportStrong + '}ul,ol{padding-left:24px}li{margin:6px 0;color:' + exportLi + '}.mermaid{display:flex;justify-content:center;margin:20px 0;padding:28px;background:' + mermaidBg + ';border:1px solid rgba(' + accentHex + ',0.12);border-radius:14px}img{max-width:100%;border-radius:10px}</style></head><body>' + bodyHtml + '<script>mermaid.initialize({startOnLoad:true,theme:"' + mermaidTheme + '"});<\/script></body></html>';

    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // === Theme-dependent class helpers ===
  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0a0a14]" : "bg-[#f8fafc]";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const bgEditor = isDark ? "bg-[#0d0d18]" : "bg-white";
  const bgEditorHeader = isDark ? "bg-[#0f0f1c]" : "bg-[#f1f5f9]";
  const bgPreview = isDark ? "bg-[#0f0f1a]" : "bg-white";
  const borderColor = isDark ? "border-[#1e1e2e]" : "border-[#e2e8f0]";
  const borderSubtle = isDark ? "border-[#1a1a2e]" : "border-[#e5e7eb]";
  const modeBtnBg = isDark ? "bg-[#0d0d18]" : "bg-[#f1f5f9]";
  const modeBtnBorder = isDark ? "border-[#1e1e30]" : "border-[#e2e8f0]";
  const modeBtnInactive = isDark ? "text-slate-500 hover:text-slate-300 hover:bg-[#16162a]" : "text-slate-500 hover:text-slate-800 hover:bg-[#e2e8f0]";
  const actionBtnBg = isDark ? "bg-[#0d0d18] border-[#1e1e30] hover:border-violet-500/40" : "bg-white border-[#e2e8f0] hover:border-indigo-400";
  const actionBtnText = isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900";
  const statusText = isDark ? "text-slate-600" : "text-slate-400";
  const statusHover = isDark ? "hover:text-slate-400" : "hover:text-slate-600";
  const editorFileLabelColor = isDark ? "text-slate-600" : "text-slate-400";

  const modeButtons: { mode: ViewMode; icon: string; label: string }[] = [
    { mode: "editor", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Editor" },
    { mode: "split", icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7", label: "Split" },
    { mode: "preview", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", label: "Preview" },
  ];

  const showEditor = viewMode === "editor" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <div className={`flex flex-col h-screen ${bg} ${textMain} overflow-hidden theme-transition`}>
      {/* ===== BUG FIX BANNER ===== */}
      {showBanner && (
        <div className="animate-slide-down flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500/8 via-orange-500/8 to-red-500/8 border-b border-amber-500/15">
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs flex-wrap">
            <span className="flex-shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-500/15 text-amber-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border border-amber-500/20 animate-glow">
              Bug Fixed
            </span>
            <span className="text-amber-200/80 hidden sm:inline">
              <strong className="text-amber-300">Error 1:</strong>{" "}
              <code className="px-1 py-0.5 bg-red-500/12 text-red-400 rounded text-[10px] sm:text-[11px] font-mono border border-red-500/15">gitgraph</code>
              <span className="mx-1 text-amber-500/50">{"\u2192"}</span>
              <code className="px-1 py-0.5 bg-emerald-500/12 text-emerald-400 rounded text-[10px] sm:text-[11px] font-mono border border-emerald-500/15">gitGraph</code>
              <span className="mx-2 text-slate-700">|</span>
              <strong className="text-amber-300">Error 2:</strong>{" "}
              <code className="px-1 py-0.5 bg-red-500/12 text-red-400 rounded text-[10px] sm:text-[11px] font-mono border border-red-500/15">tag:</code> separate line
              <span className="mx-1 text-amber-500/50">{"\u2192"}</span>
              <code className="px-1 py-0.5 bg-emerald-500/12 text-emerald-400 rounded text-[10px] sm:text-[11px] font-mono border border-emerald-500/15">{"commit ... tag: \"v1.0\""}</code>
            </span>
            <span className="text-amber-200/80 sm:hidden text-[10px]">
              <code className="text-red-400 font-mono">gitgraph</code>{" \u2192 "}<code className="text-emerald-400 font-mono">gitGraph</code>
              {" & "}
              <code className="text-red-400 font-mono">tag:</code>{" fix"}
            </span>
          </div>
          <button onClick={() => setShowBanner(false)} className="flex-shrink-0 p-1 sm:p-1.5 rounded-lg hover:bg-amber-500/15 text-amber-400/50 hover:text-amber-400 smooth-colors btn-press" title="Dismiss">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ===== AUTO-FIX PANEL ===== */}
      {showFixPanel && hasAutoFixes && (
        <div className="animate-slide-down flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500/8 via-teal-500/8 to-cyan-500/8 border-b border-emerald-500/15">
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
            <span className="flex-shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Auto-Fixed
            </span>
            <div className="flex items-center gap-1.5 text-emerald-200/80 flex-wrap">
              {appliedFixes.map((fix, i) => (
                <span key={i} className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">{fix}</span>
                  {i < appliedFixes.length - 1 && <span className="text-slate-700 ml-1 hidden sm:inline">{"\u2022"}</span>}
                </span>
              ))}
              <span className="sm:hidden text-emerald-400">{appliedFixes.length} fix{appliedFixes.length > 1 ? "es" : ""} applied</span>
            </div>
          </div>
          <button onClick={() => setShowFixPanel(false)} className="flex-shrink-0 p-1 sm:p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-400/50 hover:text-emerald-400 smooth-colors btn-press" title="Dismiss">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ===== TOP TOOLBAR ===== */}
      <header className={`flex-shrink-0 flex items-center justify-between px-3 sm:px-4 h-12 sm:h-13 glass ${borderColor} border-b toolbar-wrap`}>
        {/* Logo + Badges */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 animate-float flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className={`text-xs sm:text-sm font-bold tracking-wide leading-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              <span className="toolbar-logo-text">MD {"\u2192"} HTML Preview</span>
              <span className="sm:hidden">MD Preview</span>
            </h1>
            <span className={`text-[8px] sm:text-[9px] font-medium tracking-wider ${isDark ? "text-violet-400/70" : "text-indigo-500/70"}`}>
              by @sudhi123
            </span>
          </div>
          {/* Live badge */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Live
          </span>
          {/* Detection badge */}
          <span className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${detection.bgColor} ${detection.color} text-[10px] font-bold uppercase tracking-wider border ${detection.borderColor} smooth-colors`}>
            <span>{detection.emoji}</span>
            <span>{detection.label}</span>
            {detection.mermaidBlockCount > 0 && <span className="opacity-60">({detection.mermaidBlockCount})</span>}
          </span>
          {/* Auto-fix indicator */}
          {hasAutoFixes && (
            <span className="hidden xl:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/15">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {appliedFixes.length} fix{appliedFixes.length > 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* Center: View modes + Theme toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            className="theme-toggle flex-shrink-0"
            data-active={theme}
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="theme-toggle-knob">
              {isDark ? <MoonIcon /> : <SunIcon />}
            </div>
          </button>

          {/* View Modes */}
          <div className={`flex items-center gap-0.5 ${modeBtnBg} rounded-xl p-0.5 sm:p-1 border ${modeBtnBorder}`}>
            {modeButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold smooth-all btn-press ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                    : modeBtnInactive
                }`}
                title={label}
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold smooth-all btn-press border ${
              copyFeedback
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                : `${actionBtnBg} ${actionBtnText}`
            }`}
          >
            {copyFeedback ? (
              <>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] sm:text-xs font-semibold smooth-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 btn-press"
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`flex-1 flex overflow-hidden ${viewMode === "split" ? "" : "mobile-stack"}`}>
        {/* EDITOR */}
        {showEditor && (
          <div className={`flex flex-col ${bgEditor} smooth-all theme-transition ${viewMode === "split" ? "w-1/2" : "w-full"} mobile-full`}>
            <div className={`flex items-center justify-between px-3 sm:px-4 h-9 sm:h-10 ${bgEditorHeader} border-b ${borderSubtle} theme-transition`}>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57] smooth-all hover:brightness-125 cursor-pointer" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#febc2e] smooth-all hover:brightness-125 cursor-pointer" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28c840] smooth-all hover:brightness-125 cursor-pointer" />
                </div>
                <span className={`text-[10px] sm:text-[11px] ${editorFileLabelColor} font-mono ml-1 sm:ml-1.5 tracking-wide`}>
                  {detection.type === "mermaid" ? "diagram.mmd" : "README.md"}
                </span>
              </div>
              <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${detection.bgColor} ${detection.color} border ${detection.borderColor}`}>
                {detection.emoji} {detection.label}
              </span>
            </div>
            <textarea
              className={`editor-textarea flex-1 w-full bg-transparent p-3 sm:p-5 ${isDark ? "placeholder-slate-700" : "placeholder-slate-400"}`}
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder={"Type or paste your content here...\n\nSupports:\n\u2022 Standard Markdown (# headers, **bold**, etc.)\n\u2022 Raw Mermaid code (gitGraph, flowchart, etc.)\n\u2022 Markdown with ```mermaid blocks\n\nAuto-detects and auto-fixes common errors!"}
              spellCheck={false}
            />
          </div>
        )}

        {/* DIVIDER */}
        {viewMode === "split" && <div className="resize-handle flex-shrink-0 hidden sm:block" />}

        {/* PREVIEW */}
        {showPreview && (
          <div className={`flex flex-col ${bgPreview} smooth-all theme-transition ${viewMode === "split" ? "w-1/2" : "w-full"} mobile-full`}>
            <div className={`flex items-center justify-between px-3 sm:px-4 h-9 sm:h-10 ${bgEditorHeader} border-b ${borderSubtle} theme-transition`}>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isDark ? "text-violet-400/60" : "text-indigo-500/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className={`text-[10px] sm:text-[11px] ${editorFileLabelColor} font-mono tracking-wide`}>Preview</span>
                {detection.mermaidBlockCount > 0 && (
                  <span className={`text-[9px] sm:text-[10px] ${isDark ? "text-violet-400/70" : "text-indigo-500/70"} font-mono`}>
                    ({detection.mermaidBlockCount} diagram{detection.mermaidBlockCount > 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                {hasAutoFixes && (
                  <span className="hidden sm:inline text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">
                    {"\uD83D\uDD27"} {appliedFixes.length} auto-fix{appliedFixes.length > 1 ? "es" : ""}
                  </span>
                )}
                <span className={`text-[9px] sm:text-[10px] ${editorFileLabelColor} font-mono`}>HTML</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-violet-500/60" : "bg-indigo-500/60"} animate-pulse-dot`} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-10">
              <div
                ref={previewRef}
                className="markdown-preview max-w-4xl mx-auto animate-fade-in"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        )}
      </main>

      {/* ===== STATUS BAR ===== */}
      <footer className={`flex-shrink-0 flex items-center justify-between px-3 sm:px-4 h-7 sm:h-8 glass border-t ${borderColor} text-[9px] sm:text-[10px] ${statusText} font-mono theme-transition`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className={`smooth-colors ${statusHover}`}>Ln {lines}</span>
          <span className={`smooth-colors ${statusHover}`}>Words {words}</span>
          <span className={`smooth-colors ${statusHover} hidden sm:inline`}>Ch {chars}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline">UTF-8</span>
          <span className={`flex items-center gap-1 ${detection.color}`}>
            <span>{detection.emoji}</span>
            <span className="hidden sm:inline">{detection.label}</span>
          </span>
          {hasAutoFixes && (
            <span className="flex items-center gap-1 text-emerald-400/80">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">{appliedFixes.length} fix{appliedFixes.length > 1 ? "es" : ""}</span>
            </span>
          )}
          <span className="hidden md:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            Smart Detect
          </span>
          <span className={`hidden lg:inline ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>
          <span className="hidden lg:inline">{isDark ? "\uD83C\uDF19 Dark" : "\u2600\uFE0F Light"}</span>
          <span className={`hidden lg:inline ${isDark ? "text-slate-700" : "text-slate-300"}`}>|</span>
          <a
            href="https://github.com/sudhi123"
            target="_blank"
            rel="noopener noreferrer"
            className={`dev-badge hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${isDark ? "text-violet-400" : "text-indigo-600"} text-[10px] font-semibold no-underline`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            @sudhi123
          </a>
        </div>
      </footer>
    </div>
  );
}
