import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, Image, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { generateKeiImage } from "@/api/functions";

// List of available providers and their models.
// In a real-world scenario, this might come from a config or API.
const PROVIDERS = {
  fal_ai: {
    label: "Fal AI (Fast)",
    models: [
    { id: "fal-ai/sdxl", label: "Stable Diffusion XL" },
    { id: "fal-ai/anything-v4.0", label: "Anything v4 (Anime)" }]

  },
  midjourney: {
    label: "Midjourney (High Quality)",
    models: [{ id: "midjourney/v6", label: "Midjourney v6" }]
  },
  infographic: {
    label: "Infographics (Kie)",
    models: [{ id: "infographic-v1", label: "Infographic Generator" }]
  }
};

export default function ImageGeneratorPanel({ onQueueJob, seedPrompt = "", defaultProvider, onInsert, onClose }) {
  const [prompt, setPrompt] = useState(seedPrompt);
  const [provider, setProvider] = useState(defaultProvider || "fal_ai");
  const [model, setModel] = useState(PROVIDERS[defaultProvider || "fal_ai"].models[0].id);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // When the seed prompt from the editor changes, update our state.
    setPrompt(seedPrompt);
  }, [seedPrompt]);

  useEffect(() => {
    // When the provider changes, reset the model to the first one for that provider.
    setModel(PROVIDERS[provider].models[0].id);
  }, [provider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image.");
      return;
    }
    setIsGenerating(true);

    try {
      // Special handler for Infographics via Kie.ai
      if (provider === "infographic") {
        const { data } = await generateKeiImage({
          prompt,
          endpointPath: "/v1/infographics/generate"
        });

        if (data?.url) {
          // If we get a URL directly, insert it immediately.
          onInsert(`<img src="${data.url}" alt="${prompt}" style="max-width:100%;height:auto;border-radius:8px;" />`);
          toast.success("Infographic generated and inserted!");
          onClose();
        } else if (data?.job_id) {
          // If it's a pending job, queue it for polling.
          onQueueJob({
            provider: 'kei',
            type: 'image',
            taskId: data.job_id,
            prompt,
            altText: prompt
          });
          onClose();
        } else {
          throw new Error("Invalid response from Infographic generator.");
        }
        return;
      }

      // For all other providers, use the onQueueJob prop which handles Fal/Midjourney polling.
      onQueueJob({
        provider,
        type: 'image',
        modelName: model,
        prompt,
        altText: prompt
      });
      onClose(); // Close modal immediately after queueing.
    } catch (error) {
      console.error("Error starting image generation:", error);
      toast.error("Failed to start image generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-50 p-1 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Generate AI Image</h3>
        <p className="text-sm text-slate-500">Describe the image you want to create.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        <div>
          <Label htmlFor="provider-select" className="text-slate-700">AI Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger id="provider-select" className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDERS).map(([key, { label }]) =>
              <SelectItem key={key} value={key}>{label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="prompt-input" className="text-slate-700">Prompt</Label>
          <Textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic shot of a robot drinking coffee on a rainy day" className="bg-slate-50 text-slate-600 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-32"

            required />

        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-200">
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isGenerating}>
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </form>
    </div>);

}