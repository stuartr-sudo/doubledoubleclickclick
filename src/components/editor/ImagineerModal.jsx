
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STYLES = [
  { value: "realistic", label: "Realistic" },
  { value: "photorealistic", label: "Photorealistic" },
  { value: "hyperrealistic", label: "Hyperrealistic" },
  { value: "anime", label: "Anime" },
  { value: "manga", label: "Manga" },
  { value: "abstract", label: "Abstract" },
  { value: "surrealism", label: "Surrealism" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "acrylic", label: "Acrylic Paint" },
  { value: "digital-art", label: "Digital Art" },
  { value: "3d-render", label: "3D Render" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "sketch", label: "Sketch" },
  { value: "ink-drawing", label: "Ink Drawing" },
  { value: "charcoal", label: "Charcoal" },
  { value: "pastel", label: "Pastel" },
  { value: "collage", label: "Collage" },
  { value: "pop-art", label: "Pop Art" },
  { value: "minimalist", label: "Minimalist" },
  { value: "line-art", label: "Line Art" },
  { value: "isometric", label: "Isometric" },
  { value: "low-poly", label: "Low Poly" },
  { value: "vaporwave", label: "Vaporwave" },
  { value: "steampunk", label: "Steampunk" },
  { value: "cyberpunk-art", label: "Cyberpunk Art" },
  { value: "gothic", label: "Gothic" },
  { value: "art-nouveau", label: "Art Nouveau" },
  { value: "art-deco", label: "Art Deco" },
];

const INFLUENCES = [
  { value: "none", label: "None" },
  
  // Classic Masters
  { value: "van-gogh", label: "Van Gogh (impasto, swirling brushwork)" },
  { value: "monet", label: "Monet (impressionist light and color)" },
  { value: "rembrandt", label: "Rembrandt (dramatic lighting, chiaroscuro)" },
  { value: "da-vinci", label: "Leonardo da Vinci (sfumato, classical)" },
  { value: "picasso", label: "Picasso (cubism, geometric)" },
  { value: "dali", label: "Salvador Dalí (surrealism, dreamlike)" },
  { value: "hokusai", label: "Hokusai (Japanese woodblock)" },
  
  // Photography
  { value: "ansel-adams", label: "Ansel Adams (dramatic black-and-white)" },
  { value: "henri-cartier", label: "Henri Cartier-Bresson (decisive moment)" },
  { value: "steve-mccurry", label: "Steve McCurry (vibrant documentary)" },
  { value: "cinematic", label: "Cinematic Photography (film grain, bokeh)" },
  
  // Modern & Animation
  { value: "ghibli", label: "Studio Ghibli (whimsical cinematic anime)" },
  { value: "pixar", label: "Pixar (3D animated, cinematic lighting)" },
  { value: "disney", label: "Disney Animation (vibrant, expressive)" },
  { value: "makoto-shinkai", label: "Makoto Shinkai (photorealistic anime)" },
  
  // Contemporary Digital
  { value: "beeple", label: "Beeple (sci-fi digital art)" },
  { value: "artgerm", label: "Artgerm (stylized character art)" },
  { value: "loish", label: "Loish (colorful digital painting)" },
  
  // Dark & Unique
  { value: "hr-giger", label: "H. R. Giger (biomechanical, dark surrealism)" },
  { value: "zdzislaw", label: "Zdzisław Beksiński (dystopian surrealism)" },
  { value: "gothic-art", label: "Gothic Art (dark romantic, dramatic)" },
  
  // Architectural & Design
  { value: "bauhaus", label: "Bauhaus (geometric, minimal, primary colors)" },
  { value: "baroque", label: "Baroque Painting (chiaroscuro, ornate detail)" },
  { value: "brutalist", label: "Brutalist (raw concrete, angular)" },
  
  // Cultural & Aesthetic
  { value: "ukiyo-e", label: "Ukiyo-e (Japanese woodblock prints)" },
  { value: "mexican-mural", label: "Mexican Muralism (bold, political)" },
  { value: "aboriginal", label: "Aboriginal Dot Painting (spiritual patterns)" },
  
  // Modern Movements
  { value: "cyberpunk", label: "Cyberpunk Neon (rain, neon glow, futurism)" },
  { value: "vaporwave-aesthetic", label: "Vaporwave (retro, pink/cyan, glitch)" },
  { value: "synthwave", label: "Synthwave (80s retro, neon grids)" },
  { value: "solarpunk", label: "Solarpunk (eco-futurism, green tech)" },
];

const DIMENSIONS = [
  { value: "1024x1024", label: "Square (1024x1024)" },
  { value: "1920x1080", label: "Landscape (1920x1080)" },
  { value: "1080x1920", label: "Portrait (1080x1920)" },
  { value: "1536x1024", label: "Wide (1536x1024)" },
  { value: "1024x1536", label: "Tall (1024x1536)" },
  { value: "2048x2048", label: "Large Square (2048x2048)" },
  { value: "1280x720", label: "HD Landscape (1280x720)" },
  { value: "720x1280", label: "HD Portrait (720x1280)" },
];

export default function ImagineerModal({ isOpen, onClose, initialPrompt, onGenerate }) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [style, setStyle] = useState("realistic");
  // Influence default remains 'none' (valid Select value), user must pick another before Imagine is enabled
  const [influence, setInfluence] = useState("none");
  const [dimensions, setDimensions] = useState("1024x1024");
  const [generating, setGenerating] = useState(false);

  // Reset all fields when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset to defaults when modal closes
      setPrompt("");
      setStyle("realistic");
      setInfluence("none");
      setDimensions("1024x1024");
      setGenerating(false);
    }
  }, [isOpen]);

  // auto-populate from initialPrompt OR selection inside the editor iframe
  React.useEffect(() => {
    if (!isOpen) return; // Only run when opening the modal

    const fromProp = (initialPrompt || "").trim();
    if (fromProp) {
      setPrompt(fromProp);
      return;
    }

    let filled = false;

    // 1) Try selection in the parent window (rarely helps because selection is in iframe)
    try {
      const sel = window.getSelection ? window.getSelection() : null;
      const txt = sel && sel.toString ? sel.toString().trim() : "";
      if (txt) {
        setPrompt(txt);
        filled = true;
      }
    } catch (_) {}

    // 2) Fallback: try to read selection from the editor iframe
    if (!filled) {
      try {
        const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
        const iwin = iframe && iframe.contentWindow ? iframe.contentWindow : null;
        if (iwin && iwin.getSelection) {
          const itxt = iwin.getSelection().toString().trim();
          if (itxt) {
            setPrompt(itxt);
            filled = true;
          }
        }
      } catch (_) {}
    }

    // 3) If nothing found, clear prompt explicitly
    if (!filled) {
      setPrompt("");
    }
  }, [isOpen, initialPrompt]);

  const canImagine = !!(
    prompt.trim() &&
    style &&
    dimensions &&
    influence && influence !== "none"
  );

  const handleImagine = async () => {
    if (!canImagine) {
      toast.error("Please ensure all fields are filled, including selecting an Influence.");
      return;
    }

    setGenerating(true);
    
    try {
      // IMPORTANT: send influence EXACTLY as selected (no normalization to empty string)
      await onGenerate({ 
        prompt, 
        style, 
        influence, 
        dimensions 
      });
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to start image generation");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Imagineer - AI Image Generation
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Combine styles and influences to create unique AI-generated images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Image Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-[300px]">
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Influence (Artist/Movement)
              </label>
              <Select value={influence} onValueChange={setInfluence}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-[300px]">
                  {INFLUENCES.map((inf) => (
                    <SelectItem key={inf.value} value={inf.value}>
                      {inf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {influence === "none" && (
                <div className="text-xs text-amber-600 mt-1">
                  Please choose an influence.
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Dimensions
              </label>
              <Select value={dimensions} onValueChange={setDimensions}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-[300px]">
                  {DIMENSIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button 
              onClick={handleImagine} 
              disabled={generating || !canImagine}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Imagine
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
