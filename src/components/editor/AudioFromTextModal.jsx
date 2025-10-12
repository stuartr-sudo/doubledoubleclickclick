import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Music, Loader2, Sparkles, AlertCircle, Play, Pause, Check } from "lucide-react";
import { toast } from "sonner";
import { getElevenlabsVoices } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { cn } from "@/lib/utils";

export default function AudioFromTextModal({ isOpen, onClose, selectedText, onQueueJob }) {
  const [text, setText] = useState(selectedText || "");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [error, setError] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const textRef = useRef(null);
  const audioRef = useRef(null);

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

  // On open, ALWAYS overwrite the textarea with the current selection
  useEffect(() => {
    if (!isOpen) return;
    const fill = () => {
      const sel = readSelection();
      setText(sel || "");
    };
    fill();
    const t = setTimeout(fill, 35);
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
        console.log('[AudioFromTextModal] Voices response:', res);
        const list = Array.isArray(res?.data?.voices) ? res.data.voices : [];
        console.log('[AudioFromTextModal] Loaded voices:', list.map((v) => ({
          name: v.name,
          voice_id: v.voice_id,
          has_preview: !!v.preview_url
        })));
        setVoices(list);
        if (list.length > 0) setSelectedVoice(list[0].voice_id || "");
        if (list.length === 0) setError("No voices were returned from the service.");
      } catch (e) {
        console.error('[AudioFromTextModal] Failed to load voices:', e);
        setError(e?.message || "Failed to load voice list from the server.");
        toast.error(`Voice Error: ${e?.message || "Failed to load voice list."}`);
      } finally {
        setIsLoadingVoices(false);
      }
    })();
  }, [isOpen]);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  }, []);

  const handleClose = (open) => {
    if (!open) {
      setText("");
      stopPreview();
      onClose && onClose();
    }
  };

  const handlePreviewVoice = (voice) => {
    console.log('[AudioFromTextModal] Preview clicked:', {
      voice_name: voice.name,
      voice_id: voice.voice_id,
      preview_url: voice.preview_url
    });

    // If already playing this voice, stop it
    if (playingVoiceId === voice.voice_id) {
      console.log('[AudioFromTextModal] Stopping currently playing voice');
      stopPreview();
      return;
    }

    // Stop any currently playing audio
    stopPreview();

    // Check if voice has preview_url
    if (!voice.preview_url) {
      console.warn('[AudioFromTextModal] No preview_url for voice:', voice.name);
      toast.error("No preview available for this voice");
      return;
    }

    console.log('[AudioFromTextModal] Starting playback of:', voice.preview_url);

    // Play the preview
    setPlayingVoiceId(voice.voice_id);
    audioRef.current = new Audio(voice.preview_url);

    audioRef.current.addEventListener('ended', () => {
      console.log('[AudioFromTextModal] Audio playback ended');
      setPlayingVoiceId(null);
    });

    audioRef.current.addEventListener('error', (err) => {
      console.error('[AudioFromTextModal] Audio playback error:', err);
      toast.error("Failed to play voice preview");
      setPlayingVoiceId(null);
    });

    audioRef.current.play().catch((err) => {
      console.error('[AudioFromTextModal] Audio play() failed:', err);
      toast.error("Failed to play voice preview");
      setPlayingVoiceId(null);
    });
  };

  const handleGenerate = async () => {
    const cleaned = (text || "").trim();
    if (!cleaned || !selectedVoice) {
      toast.warning("Please enter text and select a voice.");
      return;
    }

    const result = await consumeTokensForFeature("ai_audio_generation");
    if (!result.success) {
      return;
    }

    stopPreview();

    onQueueJob &&
    onQueueJob({
      provider: "elevenlabs",
      type: "audio",
      text: cleaned,
      voice: selectedVoice,
      format: "mp3_44100_128"
    });
    setText("");
    onClose && onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-3xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generate Audio from Text
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Create an audio clip from your text using ElevenLabs. Click <Play className="w-3 h-3 inline" /> to preview voices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            ref={textRef}
            placeholder="Enter text to convert to audio..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
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

          <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select Voice</label>
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto bg-white">
                {voices.map((voice) =>
              <button
                key={voice.voice_id}
                type="button"
                onClick={() => setSelectedVoice(voice.voice_id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0",
                  selectedVoice === voice.voice_id && "bg-blue-50 hover:bg-blue-50"
                )}>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    selectedVoice === voice.voice_id ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  )}>
                        {selectedVoice === voice.voice_id &&
                    <Check className="w-2.5 h-2.5 text-white" />
                    }
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-medium text-slate-900 truncate">{voice.name || voice.voice_id}</span>
                        {voice.labels?.accent &&
                    <span className="text-xs text-slate-500 capitalize">{voice.labels.accent}</span>
                    }
                      </div>
                    </div>
                    {voice.preview_url &&
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice);
                  }}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-slate-200 transition-colors ml-2"
                  title="Preview voice">

                        {playingVoiceId === voice.voice_id ?
                  <Pause className="w-4 h-4 text-purple-600" /> :

                  <Play className="w-4 h-4 text-slate-600" />
                  }
                      </button>
                }
                  </button>
              )}
              </div>
            </div>
          }

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="bg-white border-slate-300 text-slate-600 hover:bg-slate-200">

              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isLoadingVoices || !selectedVoice} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700">


              <Music className="w-4 h-4 mr-2" />
              Generate & Insert Audio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}