import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { toast } from 'sonner';

export default function FlashToggle({ item, onStatusChange }) {
  const [isEnabled, setIsEnabled] = useState(item.flash_enabled || false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with item changes
  React.useEffect(() => {
    setIsEnabled(item.flash_enabled || false);
  }, [item.flash_enabled]);

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
        toast.success("Flash AI Enhancement enabled! Starting processing...");
        
        // Set running status immediately
        if (onStatusChange) {
          onStatusChange(item.id, { flash_status: "running" });
        }
        
        // Call Supabase Edge Functions directly
        try {
          console.log('🚀 Calling Supabase Edge Functions with:', {
            postId: item.id,
            postType: item.type,
            hasContent: !!item.content,
            userName: item.user_name
          });

          // Import supabase client
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );

          // Call the Flash orchestrator Edge Function
          const { data, error } = await supabase.functions.invoke('flash-orchestrator', {
            body: {
              postId: item.id,
              postType: item.type,
              content: item.content,
              userName: item.user_name,
              features: [
                'tldr',
                'table', 
                'cta',
                'faq',
                'citations',
                'internal-links',
                'anchor-menu',
                'brand-voice',
                'humanize',
                'structure',
                'clean-html'
              ]
            }
          });
          
          if (error) {
            console.error('❌ Supabase Edge Function error:', error);
            throw new Error(error.message || 'Flash processing failed');
          }
          
          console.log('✅ Flash processing successful:', data);
          
          // Update to completed after processing
          setTimeout(() => {
            if (onStatusChange) {
              onStatusChange(item.id, { flash_status: "completed" });
            }
            toast.success("Flash AI Enhancement completed!");
          }, 3000);
          
        } catch (error) {
          console.error('💥 Flash processing error:', error);
          if (onStatusChange) {
            onStatusChange(item.id, { flash_status: "failed" });
          }
          toast.error(`Flash processing failed: ${error.message}`);
        }
        
      } else {
        toast.success("Flash AI Enhancement disabled");
      }
    } catch (err) {
      console.error("Failed to save flash setting:", err);
      
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

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isSaving || (isEnabled && wordCount < MIN_WORD_COUNT)}
        className="data-[state=checked]:bg-indigo-600"
      />
      {isSaving && (
        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
      )}
    </div>
  );
}
