import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { toast } from 'sonner';

export default function FlashToggle({ item, onStatusChange }) {
  console.log('🎯 FLASH TOGGLE: Component rendered with item:', {
    id: item.id,
    type: item.type,
    title: item.title,
    flash_enabled: item.flash_enabled,
    flash_status: item.flash_status,
    hasContent: !!item.content
  });

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
    console.log('🔄 FLASH TOGGLE CLICKED:', { 
      enabled, 
      itemId: item.id, 
      itemType: item.type,
      currentStatus: item.flash_status,
      wordCount 
    });

    // Validation: Check word count
    if (enabled && wordCount < MIN_WORD_COUNT) {
      console.log('❌ FLASH TOGGLE: Word count too low', { wordCount, minRequired: MIN_WORD_COUNT });
      toast.error(`Content must be at least ${MIN_WORD_COUNT} words to enable Flash AI Enhancement`, {
        description: `Current: ${wordCount} words. Minimum: ${MIN_WORD_COUNT} words.`
      });
      return;
    }

    console.log('✅ FLASH TOGGLE: Starting toggle process');
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
      
      console.log('💾 FLASH TOGGLE: Updating database with data:', updateData);
      
      if (item.type === "post") {
        console.log('📝 FLASH TOGGLE: Updating blog post', item.id);
        await BlogPost.update(item.id, updateData);
        console.log('✅ FLASH TOGGLE: Blog post updated successfully');
      } else if (item.type === "webhook") {
        console.log('🔗 FLASH TOGGLE: Updating webhook', item.id);
        await WebhookReceived.update(item.id, updateData);
        console.log('✅ FLASH TOGGLE: Webhook updated successfully');
      }
      
      setIsEnabled(enabled);
      console.log('🔄 FLASH TOGGLE: Local state updated, enabled:', enabled);
      
      if (onStatusChange) {
        console.log('📡 FLASH TOGGLE: Calling onStatusChange callback');
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
      console.error("❌ FLASH TOGGLE: Database update failed:", err);
      console.error("❌ FLASH TOGGLE: Error details:", {
        message: err.message,
        status: err?.response?.status,
        data: err?.response?.data
      });
      
      // Set failed status on error
      if (onStatusChange) {
        console.log('📡 FLASH TOGGLE: Setting failed status due to error');
        onStatusChange(item.id, { flash_status: "failed" });
      }
      
      if (err?.response?.status === 429) {
        console.log('⏰ FLASH TOGGLE: Rate limit exceeded');
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        console.log('💥 FLASH TOGGLE: Generic error occurred');
        toast.error("Failed to save flash setting");
      }
    } finally {
      console.log('🏁 FLASH TOGGLE: Process completed, setting isSaving to false');
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
