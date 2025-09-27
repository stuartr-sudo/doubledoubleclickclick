
import React, { useEffect, useState, useRef } from "react";
import { agentSDK } from "@/agents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Loader2, Wand2, RefreshCw } from "lucide-react";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

export default function AffilifyModal({ isOpen, onClose, originalHtml, selectedText, onApply, onInsert }) {
  const [conversation, setConversation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [outputHtml, setOutputHtml] = useState("");
  // removed copied state
  const [tone, setTone] = useState("neutral");
  const subRef = useRef(null);
  const { consumeTokensForFeature } = useTokenConsumption();

  const tonePrompts = {
    neutral: "Keep tone neutral and objective.",
    enthusiastic: "Use a mildly enthusiastic, positive tone without exaggeration.",
    journalistic: "Use an objective, journalistic tone.",
    reviewer: "Use a friendly reviewer tone with light, third-person recommendations."
  };

  const hasSelection = !!(selectedText && selectedText.trim().length > 0);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }
    setOutputHtml("");
  }, [isOpen]);

  const cleanup = () => {
    if (subRef.current) {
      try {subRef.current();} catch (_) {}
      subRef.current = null;
    }
    setConversation(null);
    setIsRunning(false);
    setOutputHtml("");
    // removed setCopied(false);
    setTone("neutral");
  };

  const runAffilify = async () => {
    if (isRunning) return;

    // Check and consume tokens before starting Affilify
    const result = await consumeTokensForFeature('ai_affilify');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    setIsRunning(true);
    setOutputHtml("");

    const toneNote = tonePrompts[tone] || tonePrompts.neutral;

    let content;
    if (hasSelection) {
      content = [
      "You are Affilify.",
      toneNote,
      "Task: Transform ONLY the HTML/text snippet below from first‑person product language (we/our/us) into third‑person affiliate style (they/their/them), gently restructuring as needed.",
      "Rules:",
      "1) Preserve any existing inline HTML tags within the snippet.",
      "2) Do not add or remove claims; do not include explanations.",
      "3) Return ONLY the transformed snippet as HTML/text (no wrappers, no fences).",
      "",
      "Snippet:",
      selectedText].
      join("\n");
    } else {
      content = [
      "You are Affilify.",
      toneNote,
      "Task: Identify places in the HTML where first‑person product language (we/our/us) appears and rewrite into third‑person affiliate style (they/their/them), gently restructuring as needed.",
      "Rules:",
      "1) Preserve ALL original HTML structure, tags, ids, classes, and attributes exactly, modifying only text nodes.",
      "2) Do not add or remove claims; do not include explanations.",
      "3) Return ONLY the full resulting HTML string (no fences).",
      "",
      "Full HTML:",
      originalHtml].
      join("\n");
    }

    const conv = await agentSDK.createConversation({
      agent_name: "affilify",
      metadata: { name: "Affilify run", description: hasSelection ? "Selection-only affiliate transform" : "Full article affiliate transform" }
    });
    setConversation(conv);

    if (subRef.current) {
      try {subRef.current();} catch (_) {}
    }
    subRef.current = agentSDK.subscribeToConversation(conv.id, (data) => {
      const msgs = data?.messages || [];
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (m.role === "assistant" && typeof m.content === "string" && m.content.trim()) {
          setOutputHtml(m.content);
          break;
        }
      }
      if (data?.messages?.some((m) => m.role === "assistant")) {
        setIsRunning(false);
      }
    });

    await agentSDK.addMessage(conv, {
      role: "user",
      content
    });
  };

  const handleApply = () => {
    if (!outputHtml) return;
    if (hasSelection && typeof onInsert === "function") {
      onInsert(outputHtml);
    } else if (typeof onApply === "function") {
      onApply(outputHtml);
    }
    onClose();
  };

  // removed handleCopy function

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-3xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <Megaphone className="w-5 h-5 text-purple-600" />
            Affilify
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {hasSelection ? "Transform the highlighted text to third‑person affiliate style." : "Transform the entire article to third‑person affiliate style."} HTML structure is preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-sm text-slate-800">
              <div className="font-medium mb-1">Scope</div>
              <div className="chip px-2 py-1 rounded-md inline-block bg-slate-100 border border-slate-200 text-slate-700">
                {hasSelection ? "Selected text" : "Entire article"}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-800 font-medium mb-1">Tone / Style</div>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="neutral">Neutral (default)</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="journalistic">Journalistic</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasSelection &&
          <div>
              <h4 className="font-medium text-slate-800 mb-2">Highlighted Text:</h4>
              <Textarea
              value={selectedText}
              readOnly
              rows={3}
              className="bg-slate-50 border border-slate-300 text-slate-800 resize-none" />

            </div>
          }

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={runAffilify}
              disabled={isRunning} className="bg-gradient-to-r text-slate-100 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-1 from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">

              {isRunning ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </> :

              <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Run Affilify
                </>
              }
            </Button>
            <Button
              onClick={runAffilify}
              disabled={isRunning}
              variant="outline"
              className="flex-none bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
              title="Re-run with the current tone/style">

              <RefreshCw className="w-4 h-4 mr-2" />
              Re-run
            </Button>
            {/* removed Copy HTML button */}
            <div className="flex-1" />
            <Button
              onClick={handleApply}
              disabled={!outputHtml || isRunning} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-none hover:bg-cyan-700">

              Apply to Editor
            </Button>
          </div>

          <div>
            <div className="text-sm text-slate-800 mb-2">Preview (HTML string):</div>
            <Textarea
              value={outputHtml || (isRunning ? "Awaiting output…" : "Click Run Affilify to generate the affiliate-friendly version...")}
              readOnly
              rows={10}
              className="bg-slate-50 border-slate-300 text-slate-800 resize-y" />

          </div>
        </div>
      </DialogContent>
    </Dialog>);

}
