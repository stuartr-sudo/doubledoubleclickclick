
import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, RefreshCw, Copy, Check } from "lucide-react";

export default function AIRewriterModal({ isOpen, onClose, selectedText, onRewrite }) {
  const [style, setStyle] = useState("improve");
  const [customPrompt, setCustomPrompt] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    if (!selectedText.trim()) return;
    
    setIsLoading(true);
    try {
      const prompt = style === "custom" && customPrompt
        ? `${customPrompt}\n\nText to rewrite: "${selectedText}"`
        : `${styles[style]}\n\nText to rewrite: "${selectedText}"`;

      const result = await InvokeLLM({
        prompt: prompt
      });

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
  };

  const handleClose = () => {
    setRewrittenText("");
    setCustomPrompt("");
    setStyle("improve");
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-600" />
            AI Rewriter
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Enhance your selected text with AI-powered rewriting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Text */}
          <div>
            <h4 className="font-medium mb-2 text-white">Selected Text:</h4>
            <div className="p-3 bg-white/10 rounded-lg border border-white/20 text-sm max-h-24 overflow-y-auto text-white">
              {selectedText}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <h4 className="font-medium mb-2 text-white">Rewriting Style:</h4>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/10 border border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="b44-modal bg-slate-900 border border-white/20 text-white">
                {Object.entries(styles).map(([key, value]) => (
                  <SelectItem key={key} value={key} className="text-white focus:bg-white/10">
                    {key === "custom" ? "Custom Instructions" : value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt */}
          {style === "custom" && (
            <div>
              <h4 className="font-medium mb-2 text-white">Custom Instructions:</h4>
              <Textarea
                placeholder="Describe how you want the text to be rewritten..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="bg-white/10 border border-white/20 text-white placeholder:text-white/60"
              />
            </div>
          )}

          {/* Rewrite Button */}
          <Button
            onClick={handleRewrite}
            disabled={isLoading || (style === "custom" && !customPrompt.trim())}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Rewrite Text
              </>
            )}
          </Button>

          {/* Rewritten Text */}
          {rewrittenText && (
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
                  className="absolute top-2 right-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUseText}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
                >
                  Use This Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
