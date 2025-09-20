
import React from "react";
import { Edit3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocalizeModal from "./LocalizeModal";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function AskAIFloatingBar(props) {
  // Destructure props to avoid referencing the whole props object in hooks
  const {
    x,
    y,
    onClose,
    onAskAI,
    onEdit,
    getCurrentHtml,
    currentHtml,
    html,
    value,
    onContentUpdate,
    onReplaceHtml,
    onChange,
  } = props;

  // Always call hooks at the top level (no early returns before this)
  const { enabled: barEnabled } = useFeatureFlag("ai_floating_bar", { defaultEnabled: true });
  const [showLocalize, setShowLocalize] = React.useState(false);

  // Helper to get current article HTML (kept behavior)
  const effectiveHtml = () =>
    (typeof getCurrentHtml === "function" && getCurrentHtml()) ||
    currentHtml ||
    html ||
    value ||
    "";

  const applyLocalized = (newHtml) => {
    if (typeof onContentUpdate === "function") onContentUpdate(newHtml);
    else if (typeof onReplaceHtml === "function") onReplaceHtml(newHtml);
    else if (typeof onChange === "function") onChange(newHtml);
    setShowLocalize(false);
  };

  // keep below any sticky headers (layout nav + editor topbar)
  const getHeaderBottom = () => {
    try {
      const tb = document.querySelector(".topbar");
      const nav = document.querySelector("nav");
      const tbBottom = tb ? tb.getBoundingClientRect().bottom : 0;
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
      return Math.max(tbBottom || 0, navBottom || 0);
    } catch (e) {
      return 0;
    }
  };
  const headerBottom = getHeaderBottom();
  const safeTopMin = Math.max(6, headerBottom + 6);

  const handleAskAI = React.useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (typeof onAskAI === "function") onAskAI();
  }, [onAskAI]);

  const handleEdit = React.useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (typeof onEdit === "function") onEdit();
  }, [onEdit]);

  // Now decide to hide after hooks run
  if (x == null || y == null || !barEnabled) return null;

  const topPos = Math.max(safeTopMin, y - 34);
  const leftPos = Math.max(6, x - 36);

  return (
    <>
      <div
        className="fixed z-[1000] rounded-full bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur px-1 py-0.5 flex items-center gap-1"
        style={{ left: leftPos, top: topPos }}
        onMouseLeave={onClose}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onClick={(e) => { e.stopPropagation(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        role="dialog"
        aria-label="Ask AI"
      >
        {/* Edit button (left) */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-white/90 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-full px-2.5"
          onMouseDown={handleEdit}
          title="Edit"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>

        {/* Ask AI button (right) */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-white/90 hover:bg-sky-500/10 hover:text-sky-300 rounded-full px-2.5"
          onMouseDown={handleAskAI}
          title="Ask AI"
        >
          <Bot className="w-3.5 h-3.5 mr-1" />
          Ask AI
        </Button>
      </div>

      {/* Localize Modal (unchanged behavior) */}
      <LocalizeModal
        isOpen={showLocalize}
        onClose={() => setShowLocalize(false)}
        originalHtml={effectiveHtml()}
        onApplyLocalized={applyLocalized}
      />
    </>
  );
}
