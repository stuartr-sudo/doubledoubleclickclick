import React, { useState, useEffect, useCallback, useRef } from "react";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Wand2, RefreshCw, Copy, Check } from "lucide-react";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { toast } from "sonner";

export default function HumanizeTextModal({ isOpen, onClose, selectedText, onRewrite }) {
  const [style, setStyle] = useState("improve");
  const [customPrompt, setCustomPrompt] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [textToHumanize, setTextToHumanize] = useState("");
  const textRef = useRef(null);

  const { consumeTokensOptimistic } = useTokenConsumption();

  // Read freshest selection: prop -> iframe -> window
  const readSelection = useCallback(() => {
    let val = (selectedText || "").trim();

    if (!val) {
      try {
        const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
        const win = iframe?.contentWindow;
        if (win && typeof win.getSelection === "function") {
          val = (win.getSelection()?.toString() || "").trim();
        }
      } catch (_) {}
    }
    if (!val && typeof window.getSelection === "function") {
      val = (window.getSelection()?.toString() || "").trim();
    }
    return val;
  }, [selectedText]);

  // On open, ALWAYS overwrite the textarea with the current selection
  useEffect(() => {
    if (!isOpen) return;
    const fill = () => {
      const sel = readSelection();
      setTextToHumanize(sel || "");
    };
    fill();
    const t = setTimeout(fill, 35);
    return () => clearTimeout(t);
  }, [isOpen, readSelection]);

  // If parent changes selectedText while open, refresh content
  useEffect(() => {
    if (!isOpen) return;
    const sel = readSelection();
    setTextToHumanize(sel || "");
  }, [selectedText, isOpen, readSelection]);

  // Autofocus and move caret to end
  useEffect(() => {
    if (!isOpen) return;
    const el = textRef.current;
    if (!el) return;
    try {
      el.focus();
      const v = el.value;
      el.setSelectionRange(v.length, v.length);
    } catch (_) {}
  }, [isOpen, textToHumanize]);

  const styles = {
    improve: "Improve the clarity and flow of this text while keeping the same meaning",
    professional: "Rewrite this text in a more professional and formal tone",
    casual: "Rewrite this text in a more casual and conversational tone",
    persuasive: "Rewrite this text to be more persuasive and compelling",
    concise: "Make this text more concise while preserving all key information",
    engaging: "Rewrite this text to be more engaging and captivating for readers",
    custom: "Use custom instructions"
  };

  const handleRewrite = async () => {
    if (!textToHumanize || textToHumanize.trim().length < 50) {
      toast.error("Text must be at least 50 characters long");
      return;
    }

    setIsLoading(true);
    consumeTokensOptimistic('ai_humanize');

    try {
      const prompt = style === "custom" && customPrompt ?
      `${customPrompt}\n\nText to rewrite: "${textToHumanize}"` :
      `${styles[style]}\n\nText to rewrite: "${textToHumanize}"`;

      const result = await InvokeLLM({ prompt: prompt });
      setRewrittenText(result);
    } catch (error) {
      console.error("AI rewrite error:", error);
      setRewrittenText("Sorry, there was an error rewriting the text. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rewrittenText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUseText = () => {
    onRewrite(rewrittenText);
    onClose();
  };

  const handleClose = (open) => {
    if (!open) {
      setTextToHumanize("");
      setRewrittenText("");
      setCustomPrompt("");
      setStyle("improve");
      setIsCopied(false);
      onClose && onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-2xl bg-slate-900 text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wand2 className="w-5 h-5 text-violet-600" />
            AI Rewriter
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enhance your selected text with AI-powered rewriting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="font-medium mb-2 text-white block">Text to Humanize:</label>
            <Textarea
              ref={textRef}
              value={textToHumanize}
              onChange={(e) => setTextToHumanize(e.target.value)}
              placeholder="Paste or edit your text here (minimum 50 characters)..."
              rows={6}
              autoFocus
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 resize-none" />

            <p className="text-xs text-white/60 mt-1">
              {textToHumanize.length} characters (minimum 50 required)
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-white">Rewriting Style:</h4>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/10 border border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="b44-modal bg-slate-900 border border-white/20 text-white">
                {Object.entries(styles).map(([key, value]) =>
                <SelectItem key={key} value={key} className="text-white focus:bg-white/10">
                    {key === "custom" ? "Custom Instructions" : value}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {style === "custom" &&
          <div>
              <h4 className="font-medium mb-2 text-white">Custom Instructions:</h4>
              <Textarea
              placeholder="Describe how you want the text to be rewritten..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60" />

            </div>
          }

          <Button
            onClick={handleRewrite}
            disabled={isLoading || style === "custom" && !customPrompt.trim() || textToHumanize.trim().length < 50} className="bg-gradient-to-r text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 w-full from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50">


            {isLoading ?
            <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rewriting...
              </> :

            <>
                <Wand2 className="w-4 h-4 mr-2" />
                Rewrite Text
              </>
            }
          </Button>

          {rewrittenText &&
          <div>
              <h4 className="font-medium mb-2 text-white">Rewritten Text:</h4>
              <div className="relative">
                <div className="p-4 bg-white/5 rounded-lg border border-white/15 max-h-40 overflow-y-auto text-white">
                  <p className="text-sm leading-relaxed">{rewrittenText}</p>
                </div>
                <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-white/10 border-white/20 text-white hover:bg-white/20">

                  {isCopied ?
                <Check className="w-4 h-4 text-green-400" /> :

                <Copy className="w-4 h-4" />
                }
                </Button>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">

                  Cancel
                </Button>
                <Button
                onClick={handleUseText} className="bg-gradient-to-r text-slate-100 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 flex-1 from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700">


                  Use This Text
                </Button>
              </div>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>);

}