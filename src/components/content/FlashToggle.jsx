import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { toast } from 'sonner';

export default function FlashToggle({ item, onStatusChange }) {
  const [isEnabled, setIsEnabled] = useState(item.flash_enabled || false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper: Count words in HTML content
  const countWords = (html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  };

  const wordCount = countWords(item.content);
  const MIN_WORD_COUNT = 400;

  const handleToggle = async (enabled) => {
    // Validation: Check word count
    if (enabled && wordCount < MIN_WORD_COUNT) {
      toast.error(`Content must be at least ${MIN_WORD_COUNT} words to enable Flash AI Enhancement`, {
        description: `Current: ${wordCount} words. Minimum: ${MIN_WORD_COUNT} words.`
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData = { flash_enabled: enabled };
      
      if (item.type === "post") {
        await BlogPost.update(item.id, updateData);
      } else if (item.type === "webhook") {
        await WebhookReceived.update(item.id, updateData);
      }
      
      setIsEnabled(enabled);
      
      if (onStatusChange) {
        onStatusChange(item.id, { flash_enabled: enabled });
      }
      
      if (enabled) {
        toast.success("Flash AI Enhancement enabled!");
      } else {
        toast.success("Flash AI Enhancement disabled");
      }
    } catch (err) {
      console.error("Failed to save flash setting:", err);
      if (err?.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Failed to save flash setting");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isSaving || (isEnabled && wordCount < MIN_WORD_COUNT)}
        className="data-[state=checked]:bg-indigo-600"
      />
      <span className="text-xs text-slate-500">
        {isSaving ? "Saving..." : isEnabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}
