import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
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
    
    // Set running status immediately for visual feedback
    if (enabled && onStatusChange) {
      onStatusChange(item.id, { flash_status: "running" });
    }
    
    try {
      const updateData = { 
        flash_enabled: enabled,
        flash_status: enabled ? "running" : "idle"
      };
      
      if (item.type === "post") {
        await BlogPost.update(item.id, updateData);
      } else if (item.type === "webhook") {
        await WebhookReceived.update(item.id, updateData);
      }
      
      setIsEnabled(enabled);
      
      if (onStatusChange) {
        onStatusChange(item.id, { 
          flash_enabled: enabled,
          flash_status: enabled ? "running" : "idle"
        });
      }
      
      if (enabled) {
        toast.success("Flash AI Enhancement enabled! Processing...", {
          description: "Flash features are being applied to your content."
        });
        
        // Simulate Flash processing (in real implementation, this would call the Edge Function)
        setTimeout(() => {
          if (onStatusChange) {
            onStatusChange(item.id, { flash_status: "completed" });
          }
          toast.success("Flash AI Enhancement completed!", {
            description: "Your content has been enhanced with AI features."
          });
        }, 3000); // 3 second simulation
        
      } else {
        toast.success("Flash AI Enhancement disabled");
      }
    } catch (err) {
      console.error("Failed to save flash setting:", err);
      
      // Set failed status on error
      if (onStatusChange) {
        onStatusChange(item.id, { flash_status: "failed" });
      }
      
      if (err?.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Failed to save flash setting");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusText = () => {
    if (isSaving) return "Saving...";
    if (item.flash_status === "running") return "Running...";
    if (item.flash_status === "completed") return "Completed";
    if (item.flash_status === "failed") return "Failed";
    return isEnabled ? "ON" : "OFF";
  };

  const getStatusColor = () => {
    if (isSaving || item.flash_status === "running") return "text-blue-600";
    if (item.flash_status === "completed") return "text-green-600";
    if (item.flash_status === "failed") return "text-red-600";
    return "text-slate-500";
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isSaving || (isEnabled && wordCount < MIN_WORD_COUNT)}
        className="data-[state=checked]:bg-indigo-600"
      />
      <div className="flex items-center gap-1">
        {(isSaving || item.flash_status === "running") && (
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
        )}
        <span className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}
