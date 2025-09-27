
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getElevenlabsVoices } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption'; // Updated import path and hook name

export default function AudioFromTextModal({ isOpen, onClose, selectedText, onQueueJob }) {
  const [text, setText] = useState(selectedText || "");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [error, setError] = useState(null);
  const textRef = useRef(null);

  // Initialize the token consumption hook
  const { consumeTokensForFeature } = useTokenConsumption();

  // Read freshest selection: prop -> persisted -> iframe -> window
  const readSelection = useCallback(() => {
    let val = (selectedText || "").trim();

    if (!val) {
      try {
        val = (localStorage.getItem("b44_audio_selected_text") || "").trim();
      } catch (_) {}
    }
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
    if (val && val.length > 8000) val = val.slice(0, 8000);
    return val;
  }, [selectedText]);

  // On open, ALWAYS overwrite the textarea with the current selection (no prev guard)
  useEffect(() => {
    if (!isOpen) return;
    const fill = () => {
      const sel = readSelection();
      setText(sel || "");
    };
    fill();
    const t = setTimeout(fill, 35); // micro-retry after render
    return () => clearTimeout(t);
  }, [isOpen, readSelection]);

  // If parent changes selectedText while open, refresh content
  useEffect(() => {
    if (!isOpen) return;
    const sel = readSelection();
    setText(sel || "");
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
  }, [isOpen, text]);

  // Load voices on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsLoadingVoices(true);
    (async () => {
      try {
        const res = await getElevenlabsVoices();
        const list = Array.isArray(res?.data?.voices) ? res.data.voices : [];
        setVoices(list);
        if (list.length > 0) setSelectedVoice(list[0].voice_id || "");
        if (list.length === 0) setError("No voices were returned from the service.");
      } catch (e) {
        setError(e?.message || "Failed to load voice list from the server.");
        toast.error(`Voice Error: ${e?.message || "Failed to load voice list."}`);
      } finally {
        setIsLoadingVoices(false);
      }
    })();
  }, [isOpen]);

  const handleClose = (open) => {
    if (!open) {
      // reset so next open always pulls fresh selection
      setText("");
      onClose && onClose();
    }
  };

  const handleGenerate = async () => {
    const cleaned = (text || "").trim();
    if (!cleaned || !selectedVoice) {
      toast.warning("Please enter text and select a voice.");
      return;
    }

    // Check and consume tokens before generating audio
    const result = await consumeTokensForFeature("ai_audio_generation");
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    // Queue only — insertion happens once when job finishes (prevents duplicates)
    onQueueJob &&
    onQueueJob({
      provider: "elevenlabs",
      type: "audio",
      text: cleaned,
      voice: selectedVoice,
      format: "mp3_44100_128"
    });
    // reset and close
    setText("");
    onClose && onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-2xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate Audio from Text
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Create an audio clip from your text using ElevenLabs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            ref={textRef}
            placeholder="Enter text to convert to audio..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            autoFocus
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />


          {isLoadingVoices ?
          <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading voices…</span>
            </div> :
          error ?
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div> :

          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                <SelectValue placeholder="Select a voice…" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 z-[999]">
                {voices.map((v) =>
              <SelectItem key={v.voice_id} value={v.voice_id} className="text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{v.name || v.voice_id}</span>
                      {!!v?.labels?.accent &&
                  <span className="text-xs text-slate-500 capitalize bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {v.labels.accent}
                        </span>
                  }
                    </div>
                  </SelectItem>
              )}
              </SelectContent>
            </Select>
          }

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleClose(false)} className="bg-indigo-200 text-slate-600 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">


              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isLoadingVoices || !selectedVoice} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700">


              <Music className="w-4 h-4 mr-2" />
              Generate &amp; Insert Audio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}
