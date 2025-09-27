import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, Wand2 } from "lucide-react";
import SitemapLinkerModal from "./SitemapLinkerModal";
import { agentSDK } from "@/agents";
import { toast } from "sonner";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

export default function CtaTemplateFillModal({ isOpen, onCancel, onSubmit, template, pageHtml, pageTitle, preferredUsername }) {
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [buttonText, setButtonText] = useState("Learn more");
  const [buttonUrl, setButtonUrl] = useState("#");
  const [isGenerating, setIsGenerating] = useState({ headline: false, subtext: false, button_text: false });
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  useEffect(() => {
    if (isOpen) {
      if (template?.preview_data) {
        setHeadline(template.preview_data.headline || "");
        setSubtext(template.preview_data.subtext || "");
        setButtonText(template.preview_data.button_text || "Learn more");
        setButtonUrl(template.preview_data.button_url || "#");
      } else {
        setHeadline("");
        setSubtext("");
        setButtonText("Learn more");
        setButtonUrl("#");
      }
    }
  }, [isOpen, template]);

  const handleGenerateAI = async (field) => {
    const costResult = await consumeTokensForFeature('ai_cta_generate_text');
    if (!costResult.success) return;

    setIsGenerating(prev => ({ ...prev, [field]: true }));
    try {
      const conv = await agentSDK.createConversation({ agent_name: "cta_text_generator" });
      if (!conv?.id) throw new Error("Failed to create AI conversation.");

      const prompt = `Based on the article titled "${pageTitle}" and the context of the page, generate a compelling ${field.replace('_', ' ')} for a call-to-action.
Page content context (first 5000 chars): ${String(pageHtml || "").substring(0, 5000)}`;

      await agentSDK.addMessage(conv, { role: "user", content: prompt });

      const pollTimeout = 45000;
      const pollInterval = 2000;
      const startTime = Date.now();
      let generatedText = "";

      while (Date.now() - startTime < pollTimeout) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        const updatedConv = await agentSDK.getConversation(conv.id);
        const lastMsg = updatedConv.messages?.[updatedConv.messages.length - 1];

        if (lastMsg?.role === 'assistant' && (lastMsg.is_complete || lastMsg.content)) {
          generatedText = (lastMsg.content || "").replace(/["']+/g, "").trim();
          if (generatedText) break;
        }
      }
      
      if (generatedText) {
        if (field === 'headline') setHeadline(generatedText);
        else if (field === 'subtext') setSubtext(generatedText);
        else if (field === 'button_text') setButtonText(generatedText);
        toast.success(`AI generated ${field.replace('_', ' ')}.`);
      } else {
        toast.error("AI text generation timed out.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate AI text.");
    } finally {
      setIsGenerating(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleLinkFromSitemap = (url) => {
    setButtonUrl(url);
    setIsSitemapOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ headline, subtext, button_text: buttonText, button_url: buttonUrl, name: template?.name });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-2xl bg-white text-slate-900 border border-slate-200">
          <DialogHeader>
            <DialogTitle>Fill CTA Details</DialogTitle>
            <DialogDescription>
              Set the button text and link; optional headline and subtext will also be inserted if the template uses them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="headline" className="flex justify-between items-center mb-1">
                  <span>Headline (optional)</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateAI('headline')} disabled={isGenerating.headline}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating.headline ? 'Generating...' : 'AI generate'}
                  </Button>
                </Label>
                <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g., Get your free quote" className="bg-white text-slate-900" />
              </div>
              <div>
                <Label htmlFor="subtext" className="flex justify-between items-center mb-1">
                  <span>Subtext (optional)</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateAI('subtext')} disabled={isGenerating.subtext}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating.subtext ? 'Generating...' : 'AI generate'}
                  </Button>
                </Label>
                <Textarea id="subtext" value={subtext} onChange={(e) => setSubtext(e.target.value)} placeholder="One or two sentences to support the CTA" className="bg-white text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-text" className="flex justify-between items-center mb-1">
                    <span>Button Text</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateAI('button_text')} disabled={isGenerating.button_text}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isGenerating.button_text ? '...' : 'AI'}
                    </Button>
                  </Label>
                  <Input id="button-text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="bg-white text-slate-900" />
                </div>
                <div>
                  <Label htmlFor="button-url" className="flex justify-between items-center mb-1">
                    <span>Button URL</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsSitemapOpen(true)} className="bg-white text-slate-900">
                      <Link className="w-4 h-4 mr-2" />
                      From Sitemap
                    </Button>
                  </Label>
                  <Input id="button-url" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className="bg-white text-slate-900" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit">Insert CTA</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <SitemapLinkerModal
        isOpen={isSitemapOpen}
        onClose={() => setIsSitemapOpen(false)}
        onLinkInsert={handleLinkFromSitemap}
        usernameFilter={preferredUsername}
      />
    </>
  );
}