
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Eraser
} from "lucide-react";

export default function InlineFormatToolbar({ x, y, onClose }) {
  // Measure toolbar size to clamp within viewport
  const containerRef = React.useRef(null);
  const [size, setSize] = React.useState({ w: 380, h: 40 }); // increased width for heading buttons
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  // Compute sticky header bottom to avoid overlap
  const headerBottom = React.useMemo(() => {
    try {
      const tb = document.querySelector(".topbar");
      const nav = document.querySelector("nav");
      const tbBottom = tb ? tb.getBoundingClientRect().bottom : 0;
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
      return Math.max(tbBottom || 0, navBottom || 0);
    } catch {
      return 0;
    }
  }, []);

  const clampToViewport = React.useCallback((cx, cy, w, h) => {
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer showing ABOVE the click: y - height - gap
    let top = cy - h - 10;
    const minTop = (headerBottom || 0) + margin;
    // If not enough space above, place below the click
    if (top < minTop) {
      top = Math.min(cy + 10, vh - h - margin);
    }
    // Center horizontally around click
    let left = cx - w / 2;
    if (left < margin) left = margin;
    if (left > vw - w - margin) left = Math.max(margin, vw - w - margin);
    return { top, left };
  }, [headerBottom]);

  // Measure size after mount/update
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width || size.w || 380;
    const h = rect.height || size.h || 40;
    setSize({ w, h });
    setPos(clampToViewport(x ?? 0, y ?? 0, w, h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y]);

  // Re-clamp on resize
  React.useEffect(() => {
    const onResize = () => setPos(clampToViewport(x ?? 0, y ?? 0, size.w, size.h));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [x, y, size.w, size.h, clampToViewport]);

  // Close on Escape, outside click, or scroll
  React.useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose?.(); };
    const away = (e) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target)) onClose?.();
    };
    const onScroll = () => onClose?.();
    window.addEventListener("keydown", esc, true);
    window.addEventListener("mousedown", away, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", esc, true);
      window.removeEventListener("mousedown", away, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  // Also close when the preview iframe tells parent a click happened (Editor already calls onPreviewClick)
  React.useEffect(() => {
    const handler = (e) => {
      const t = e?.data?.type;
      if (t === "html-click" || t === "canvas-click" || t === "preview-click") onClose?.();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onClose]);

  // Send formatting commands to the preview iframe
  const sendCmd = (command, value = null) => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      try { iframe.focus(); win.focus(); } catch {}
      win.postMessage({ type: "editor-command", command, value }, "*");
    }
  };

  const prevent = (e, fn) => { e.preventDefault(); e.stopPropagation(); fn?.(); };

  return (
    <div
      id="b44-inline-toolbar"
      ref={containerRef}
      className="fixed z-[1100] flex items-center gap-1 rounded-lg bg-white border border-slate-200 shadow-xl px-2 py-1.5"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Heading buttons - UPDATED to use formatBlock */}
      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("formatBlock", "H1"))}>
        h1
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("formatBlock", "H2"))}>
        h2
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("formatBlock", "H3"))}>
        h3
      </Button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Basic styles */}
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("bold"))}>
        <Bold className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("italic"))}>
        <Italic className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("underline"))}>
        <Underline className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("strikeThrough"))}>
        <Strikethrough className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Lists */}
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("insertUnorderedList"))}>
        <List className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("insertOrderedList"))}>
        <ListOrdered className="w-4 h-4" />
      </Button>

      {/* Blockquote / Code */}
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("formatBlock", "BLOCKQUOTE"))}>
        <Quote className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("formatBlock", "PRE"))}>
        <Code className="w-4 h-4" />
      </Button>

      {/* Clear */}
      <Button size="sm" variant="ghost" className="h-8 px-2 hover:bg-slate-100" onMouseDown={(e) => prevent(e, () => sendCmd("removeFormat"))}>
        <Eraser className="w-4 h-4" />
      </Button>
    </div>
  );
}
