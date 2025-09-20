
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  UserCheck,
  Zap,
  Image as ImageIcon,
  Film,
  AlertCircle,
  Lightbulb,
  Shield,
  Globe,
  X,
  BookOpen, // Added BookOpen import
  Sparkles, // Added Sparkles import for "Ask AI"
  Bot, // Added Bot import for AI Agent Workflow
} from "lucide-react";

export default function TextActionsModal({ isOpen, onClose, selectedText = "", onActionSelect }) {
  const actions = [
    { id: "ai-rewrite", label: "AI Rewrite", icon: Wand2, accent: "from-violet-500 to-purple-600" },
    { id: "humanize", label: "Humanize", icon: UserCheck, accent: "from-emerald-500 to-teal-600" },
    { id: "tldr", label: "Generate TL;DR", icon: Zap, accent: "from-amber-500 to-orange-600" },
    { id: "generate-image", label: "Generate Image", icon: ImageIcon, accent: "from-blue-500 to-indigo-600" },
    { id: "generate-video", label: "Generate Video", icon: Film, accent: "from-pink-500 to-rose-600" },
    { id: "callout", label: "Create Callout", icon: AlertCircle, accent: "from-sky-500 to-cyan-600" },
    { id: "fact", label: "Create Fact Box", icon: Lightbulb, accent: "from-lime-500 to-green-600" },
    { id: "ai-detection", label: "AI Detection", icon: Shield, accent: "from-slate-600 to-slate-700" },
    { id: "sitemap-link", label: "Sitemap Linker", icon: Globe, accent: "from-fuchsia-500 to-purple-700" },
    { id: "cite-source", label: "Cite Source", icon: BookOpen, accent: "from-indigo-500 to-blue-600" }, // NEW: Cite Source
    { id: "ask-ai", label: "Ask AI", icon: Sparkles, accent: "from-purple-500 to-pink-600" }, // NEW: Ask AI
  ];

  const handleSelect = (id) => {
    if (typeof onActionSelect === "function") {
      onActionSelect(id);
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Actions for Selected Text</span>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Choose an action to apply to your highlighted text.
          </DialogDescription>
        </DialogHeader>

        {/* Selected text preview */}
        {selectedText ? (
          <div className="px-6">
            <div className="text-xs text-gray-500 mb-1">Selected text</div>
            <div className="text-sm p-3 rounded-lg border bg-gray-50 max-h-24 overflow-y-auto">
              {selectedText}
            </div>
          </div>
        ) : null}

        {/* Actions grid */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => handleSelect(a.id)}
                className={`group flex items-center gap-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 p-3 transition shadow-sm hover:shadow
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                <div className={`w-9 h-9 rounded-md bg-gradient-to-r ${a.accent} text-white flex items-center justify-center shadow`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{a.label}</div>
                  {a.id === "generate-image" && (
                    <div className="text-xs text-gray-500">Open AI image tools</div>
                  )}
                  {a.id === "generate-video" && (
                    <div className="text-xs text-gray-500">Create a short video from this idea</div>
                  )}
                  {a.id === "cite-source" && (
                    <div className="text-xs text-gray-500">Add a source citation via webhook</div>
                  )}
                  {a.id === "ask-ai" && (
                    <div className="text-xs text-gray-500">Get AI assistance with this text</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          {/* NEW: AI Agent Workflow action */}
          <div className="mt-2">
            <Button
              onClick={() => onActionSelect && onActionSelect('ai-agent')}
              className="w-full justify-start gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white"
            >
              <Bot className="w-4 h-4" />
              AI Agent Workflow
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-xs text-gray-500">
            Tip: You can also access these from the toolbar. Right-click works anywhere inside the preview when text is selected.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
