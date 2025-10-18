
import React, { useState } from "react";
import { humanizeText as humanizeWithRapidAPI } from "@/api/functions";
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
import { UserCheck, RefreshCw, Copy, Check, Loader2 } from "lucide-react";

export default function HumanizeTextModal({ isOpen, onClose, selectedText, onRewrite }) {
  const [tone, setTone] = useState("formal");
  const [humanizedText, setHumanizedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const availableTones = ["formal", "casual", "friendly", "professional", "storytelling", "conversational"];
  
  const MIN_TEXT_LENGTH = 25;
  const isTextTooShort = selectedText.trim().length < MIN_TEXT_LENGTH;

  const handleHumanize = async () => {
    if (isTextTooShort) return;
    
    setIsLoading(true);
    setHumanizedText(""); // Clear previous humanized text
    try {
      const { data } = await humanizeWithRapidAPI({
        text: selectedText,
        tone: tone
      });

      if (data.error) throw new Error(data.error);

      setHumanizedText(data.humanizedText);
    } catch (error) {
      console.error("Humanization error:", error);
      setHumanizedText(`Sorry, there was an error humanizing the text: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(humanizedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUseText = () => {
    onRewrite(humanizedText);
    handleClose(); // Close modal after using text
  };

  const handleClose = () => {
    setHumanizedText("");
    setTone("formal"); // Reset tone to default
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-2xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            Humanize AI Text
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Make your selected text sound more natural using the Humanizer API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Text */}
          <div>
            <h4 className="font-medium mb-2 text-slate-800">Selected Text:</h4>
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-sm max-h-24 overflow-y-auto text-slate-700">
              {selectedText}
            </div>
            {isTextTooShort && (
              <p className="text-xs text-yellow-600 mt-2">
                Please select at least {MIN_TEXT_LENGTH} characters to use the humanizer.
              </p>
            )}
          </div>

          {/* Humanization Tone */}
          <div>
            <h4 className="font-medium mb-2 text-slate-800">Select Tone:</h4>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {availableTones.map((t) => (
                    <SelectItem key={t} value={t} className="text-slate-800 hover:bg-slate-100 focus:bg-slate-100">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Humanize Button */}
          <Button
            onClick={handleHumanize}
            disabled={isLoading || isTextTooShort}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white disabled:opacity-50"
            title={isTextTooShort ? `Please select at least ${MIN_TEXT_LENGTH} characters.` : "Humanize Text"}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Humanizing Text...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Humanize Text
              </>
            )}
          </Button>

          {/* Humanized Text */}
          {humanizedText && (
            <div>
              <h4 className="font-medium mb-2 text-slate-800">Humanized Text:</h4>
              <div className="relative">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 max-h-40 overflow-y-auto text-emerald-900">
                  <p className="text-sm leading-relaxed">{humanizedText}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 bg-white/50 border-slate-300 hover:bg-slate-100 text-slate-600"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
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
                  className="flex-1 bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUseText}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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
