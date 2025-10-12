
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Image as ImageIcon, Loader2 } from "lucide-react"; // Renamed Image to ImageIcon
import { base44 } from "@/api/base44Client";

const STYLES = [
  { id: 'CDQPRVVJCSTPRBBCD5Q6AWR', name: 'Vibrant Strokes', category: 'Colorful', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/vibrant_strokes.png' },
  { id: 'CDQPRVVJCSTPRBBKDXK78', name: 'Glowful Breeze', category: 'Colorful', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/glowful_breeze.png' },
  { id: 'CDQPRVVJCSTPRBB6DHGQ8', name: 'Bold Canvas', category: 'Colorful', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/bold_canvas.png' },
  { id: 'CDQPRVVJCSTPRBB6D5P6RSB4', name: 'Radiant Blocks', category: 'Colorful', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/radiant_blocks.png' },
  { id: 'CDQPRVVJCSTPRBB7E9GP8TB5DST0', name: 'Pragmatic Shades', category: 'Colorful', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/pragmatic_shades.png' },
  { id: 'CDGQ6XB1DGPQ6VV6EG', name: 'Carefree Mist', category: 'Casual', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/carefree_mist.png' },
  { id: 'CDGQ6XB1DGPPCTBCDHJP8', name: 'Lively Layers', category: 'Casual', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/lively_layers.png' },
  { id: 'D1GPWS1DCDQPRVVJCSTPR', name: 'Artistic Flair', category: 'Hand-drawn', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/artistic_flair.png' },
  { id: 'D1GPWS1DDHMPWSBK', name: 'Sketch Notes', category: 'Hand-drawn', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/sketch_notes.png' },
  { id: 'CSQQ4VB1CDNJTVKFBXK6JV3C', name: 'Elegant Outline', category: 'Formal', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/elegant_outline.png' },
  { id: 'CSQQ4VB1DGPPRTB7D1T0', name: 'Subtle Accent', category: 'Formal', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/subtle_accent.png' },
  { id: 'CSQQ4VB1DGPQ6TBECXP6ABB3DXP6YWG', name: 'Monochrome Pro', category: 'Monochrome', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/monochrome_pro.png' },
  { id: 'CSQQ4VB1DGPPTVVEDXHPGWKFDNJJTSKCC5T0', name: 'Corporate Clean', category: 'Formal', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/corporate_clean.png' },
  { id: 'DNQPWVV3D1S6YVB55NK6RRBM', name: 'Minimal Contrast', category: 'Monochrome', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/minimal_contrast.png' },
  { id: 'CXS62Y9DCSQP6XBK', name: 'Silver Beam', category: 'Monochrome', preview_image_url: 'https://cdn.napkin.io/napkin-ai/images/style-previews/silver_beam.png' }
];

// Add a default preview to use when a style doesn't define one explicitly
const DEFAULT_STYLE_PREVIEW = 'https://via.placeholder.com/1200x800.png?text=Infographic+Style+Preview';

const VISUAL_TYPES = [
  { value: 'auto', label: 'Auto (Recommended)' },
  { value: 'mindmap', label: 'Mind Map' },
  { value: 'flowchart', label: 'Flow Chart' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'process', label: 'Process' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'hierarchy', label: 'Hierarchy' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'venn', label: 'Venn Diagram' }
];

// Add: tiny SVG data URL generator for Visual Type previews (robust, no network)
const svgDataUrl = (svg) => 'data:image/svg+xml;base64,' + btoa(svg);

const typeToSvg = (typeLabel = 'auto') => {
  const title = (VISUAL_TYPES.find(v => v.value === typeLabel)?.label || typeLabel || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const base = (shapes) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#e9eef5"/>
  ${shapes}
  <rect x="0" y="740" width="1200" height="60" fill="rgba(0,0,0,0.35)"/>
  <text x="30" y="780" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#fff">${title} preview</text>
</svg>`.trim();

  switch (typeLabel) {
    case 'mindmap':
      return base(`
        <circle cx="600" cy="360" r="70" fill="#3b82f6" opacity="0.85"/>
        ${[['420','260'],['420','460'],['780','260'],['780','460']].map(([x,y])=>`
          <circle cx="${x}" cy="${y}" r="44" fill="#93c5fd"/>
        `).join('')}
      `);
    case 'flowchart':
      return base(`
        <rect x="200" y="240" width="220" height="90" rx="10" fill="#38bdf8"/>
        <polygon points="560,240 720,285 560,330 400,285" fill="#fde68a" stroke="#f59e0b" stroke-width="3"/>
        <rect x="820" y="240" width="220" height="90" rx="10" fill="#86efac"/>
      `);
    case 'timeline':
      return base(`
        <line x1="160" y1="320" x2="1040" y2="320" stroke="#334155" stroke-width="6"/>
        ${[220,460,700,940].map((x,i)=>`
          <circle cx="${x}" cy="320" r="18" fill="#3b82f6"/>
          <rect x="${x-80}" y="360" width="160" height="80" rx="8" fill="#bfdbfe"/>
        `).join('')}
      `);
    case 'diagram':
      return base(`
        <rect x="250" y="220" width="220" height="110" rx="10" fill="#e2e8f0"/>
        <rect x="730" y="220" width="220" height="110" rx="10" fill="#e2e8f0"/>
        <rect x="490" y="460" width="220" height="110" rx="10" fill="#e2e8f0"/>
      `);
    case 'process':
      return base(`
        ${[220,470,720].map((x,i)=>`
          <rect x="${x}" y="260" width="200" height="90" rx="10" fill="#e0e7ff"/>
        `).join('')}
      `);
    case 'comparison':
      return base(`
        <rect x="220" y="220" width="320" height="280" rx="12" fill="#fef3c7"/>
        <rect x="660" y="220" width="320" height="280" rx="12" fill="#dcfce7"/>
      `);
    case 'hierarchy':
      return base(`
        <rect x="520" y="160" width="160" height="70" rx="8" fill="#fee2e2"/>
        ${[360,520,680,840].map((x)=>`
          <rect x="${x}" y="320" width="160" height="60" rx="8" fill="#fecaca"/>
        `).join('')}
      `);
    case 'cycle':
      return base(`
        ${[0,90,180,270].map((deg)=>`
          <path d="M600 360 m -130,0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0" fill="none" stroke="#0ea5e9" stroke-width="18" stroke-dasharray="205 205" transform="rotate(${deg}, 600, 360)"/>
        `).join('')}
      `);
    case 'matrix':
      return base(`
        <rect x="350" y="190" width="500" height="360" rx="10" fill="#f1f5f9" stroke="#94a3b8" stroke-width="3"/>
        <line x1="600" y1="190" x2="600" y2="550" stroke="#94a3b8" stroke-width="3"/>
        <line x1="350" y1="370" x2="850" y2="370" stroke="#94a3b8" stroke-width="3"/>
      `);
    case 'venn':
      return base(`
        <circle cx="520" cy="360" r="150" fill="#bfdbfe" opacity="0.75"/>
        <circle cx="680" cy="360" r="150" fill="#bbf7d0" opacity="0.75"/>
        <ellipse cx="600" cy="360" rx="90" ry="120" fill="#a7f3d0" opacity="0.85"/>
      `);
    default: // auto
      return base(`
        <rect x="180" y="210" width="260" height="140" rx="10" fill="#fef3c7"/>
        <circle cx="640" cy="280" r="70" fill="#93c5fd"/>
        <rect x="860" y="240" width="160" height="80" rx="10" fill="#bbf7d0"/>
      `);
  }
};


export default function InfographicsModal({ isOpen, onClose, selectedText, articleTitle, onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [styleId, setStyleId] = useState("CDQPRVVJCSTPRBB6DHGQ8");
  const [visualType, setVisualType] = useState("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [examplesMap, setExamplesMap] = React.useState({});

  React.useEffect(() => {
    if (isOpen) {
      setPrompt(selectedText || "");
      setContext(articleTitle || "");
      setIsGenerating(false);
    }
  }, [isOpen, selectedText, articleTitle]);

  // Load admin-provided examples when modal opens
  React.useEffect(() => {
    let cancelled = false;
    const loadExamples = async () => {
      if (!isOpen) return;
      try {
        const rows = await base44.entities.InfographicVisualTypeExample.list();
        const map = {};
        (rows || []).forEach((r) => {
          if (r.is_active !== false && r.visual_type_key && r.image_url) {
            map[r.visual_type_key] = r.image_url;
          }
        });
        if (!cancelled) setExamplesMap(map);
      } catch (e) {
        // silent fail; fallback to SVG previews
      }
    };
    loadExamples();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Compute selected style and its preview URL (fallback to readable placeholder)
  const selectedStyle = React.useMemo(
    () => STYLES.find((s) => s.id === styleId) || STYLES[0],
    [styleId]
  );
  // The stylePreviewUrl is no longer directly used for the img.src,
  // but keeping it as it might be used for constructing the placeholder label or for debugging.
  const stylePreviewUrl = React.useMemo(() => {
    if (!selectedStyle) return DEFAULT_STYLE_PREVIEW;
    if (selectedStyle.preview_image_url) return selectedStyle.preview_image_url;
    const label = encodeURIComponent(`${selectedStyle.name} Preview`);
    return `https://via.placeholder.com/1200x800.png?text=${label}`;
  }, [selectedStyle]);

  // Visual Type preview (prefer admin example, else use local SVG)
  const typePreviewUrl = React.useMemo(() => {
    if (examplesMap?.[visualType]) {
      return examplesMap[visualType];
    }
    return svgDataUrl(typeToSvg(visualType));
  }, [examplesMap, visualType]);


  // Removed the useEffect for fetching stylePreviewProxy as style previews are no longer displayed.
  // Removed the useState for resolvedPreviewUrl and loadingPreview as they are no longer used.

  const handleGenerate = () => {
    if (!prompt.trim()) {
      return;
    }

    if (isGenerating) {
      return;
    }

    setIsGenerating(true);

    const config = {
      content: prompt,
      context: context,
      format: 'png', // Hardcoded to PNG
      style_id: styleId,
      visual_query: visualType === 'auto' ? undefined : visualType,
      number_of_visuals: 1,
      transparent_background: false,
      color_mode: 'light',
      orientation: 'auto',
      width: 1200,
      height: 800,
      language: 'en'
    };

    onGenerate(config);
    onClose();
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-500" /> {/* Changed to ImageIcon */}
            Generate Infographic
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Transform your text into a beautiful visual using Napkin AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-white">Content to Visualize *</Label>
            <Textarea
              id="prompt"
              placeholder="Enter the text you want to turn into an infographic..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="context" className="text-white">Context (Optional)</Label>
            <Input
              id="context"
              placeholder="e.g., Article title or topic for better context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60 mt-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="style" className="text-white">Visual Style</Label>
              <Select value={styleId} onValueChange={setStyleId}>
                <SelectTrigger className="bg-white/10 border border-white/20 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="b44-modal bg-slate-900 border border-white/20 text-white">
                  {STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id} className="text-white focus:bg-white/10">
                      {style.name} <span className="text-white/50 text-xs ml-2">({style.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="visualType" className="text-white">Visual Type</Label>
            <Select value={visualType} onValueChange={setVisualType}>
              <SelectTrigger className="bg-white/10 border border-white/20 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="b44-modal bg-slate-900 border border-white/20 text-white">
                {VISUAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white focus:bg-white/10">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-white/50 mt-1">
              Choose a specific layout or let AI decide automatically
            </p>
          </div>

          {/* NEW: Visual Type Preview (always available, no network) */}
          <div className="mt-1">
            <div className="text-white text-sm mb-1">
              Visual Type Preview: <span className="font-semibold">{visualType === 'auto' ? 'Auto (Recommended)' : visualType.replace(/_/g,' ')}</span>
            </div>
            <div
              className="relative overflow-hidden rounded-lg border border-white/20 bg-white/5"
              title={`Preview of ${VISUAL_TYPES.find(v => v.value === visualType)?.label || visualType}`}
            >
              <img
                src={typePreviewUrl}
                alt={`${VISUAL_TYPES.find(v => v.value === visualType)?.label || visualType} preview`}
                className="w-full h-48 object-cover bg-slate-100"
                loading="eager"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1">
                This is an illustrative example. The generated infographic will adapt to your content.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 flex-1 from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" /> {/* Changed to ImageIcon */}
                  Generate Infographic
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
