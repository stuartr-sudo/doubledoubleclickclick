/**
 * useFlashAutoTrigger Hook
 * 
 * Monitors Airtable records for "Body Content" changes
 * When content arrives AND Flash Template is selected, triggers Flash automation
 */

import { useEffect, useRef } from 'react';
import { BlogPost } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useFlashAutoTrigger(airtableRecords, userName) {
  const processedRecordsRef = useRef(new Set());

  useEffect(() => {
    if (!airtableRecords || airtableRecords.length === 0 || !userName) {
      return;
    }

    const checkForNewContent = async () => {
      for (const record of airtableRecords) {
        const recordId = record.id;
        const fields = record.fields || {};

        // Skip if already processed
        if (processedRecordsRef.current.has(recordId)) {
          continue;
        }

        // Check if Body Content exists
        const bodyContent = fields['Body Content'] || fields['body_content'];
        if (!bodyContent || typeof bodyContent !== 'string' || bodyContent.trim().length === 0) {
          continue; // No content yet, skip
        }

        // Check if Flash Template is selected
        const flashTemplate = fields['Flash Template'];
        if (!flashTemplate || flashTemplate === 'None') {
          // No Flash template, just mark as processed and continue
          processedRecordsRef.current.add(recordId);
          continue;
        }

        // Get other required fields
        const keyword = fields['Keyword'] || 'Untitled';
        const targetMarket = fields['Target Market'];
        const promotedProduct = fields['Promoted Product'];

        console.log(`🆕 New content detected for: ${keyword}`);
        console.log(`   Flash Template: ${flashTemplate}`);

        try {
          // Step 1: Create blog post from Airtable content
          const newPost = await BlogPost.create({
            title: keyword,
            content: bodyContent,
            status: 'draft',
            user_name: userName,
            flash_status: 'pending',
            processing_id: recordId,
            meta_description: targetMarket ? `Content for ${targetMarket}` : undefined
          });

          if (!newPost || !newPost.id) {
            throw new Error('Failed to create blog post');
          }

          console.log(`✅ Blog post created: ${newPost.id}`);

          // Step 2: Get auth session for API call
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.access_token) {
            throw new Error('Not authenticated');
          }

          // Step 3: Trigger Flash automation
          console.log(`🚀 Triggering Flash automation: ${flashTemplate}`);

          const response = await fetch('/api/flash/auto-trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              postId: newPost.id,
              content: bodyContent,
              flashTemplate,
              userName
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
          }

          if (result.flashTriggered) {
            toast.success(`Flash automation started for "${keyword}"`, {
              description: `Workflow: ${flashTemplate}`
            });
          }

          console.log(`✅ Flash automation triggered successfully`);

          // Mark as processed
          processedRecordsRef.current.add(recordId);

        } catch (error) {
          console.error(`❌ Flash auto-trigger failed for ${keyword}:`, error);
          toast.error(`Failed to auto-Flash "${keyword}"`, {
            description: error.message
          });
        }
      }
    };

    // Check for new content every 10 seconds
    const interval = setInterval(checkForNewContent, 10000);

    // Also check immediately
    checkForNewContent();

    return () => clearInterval(interval);
  }, [airtableRecords, userName]);

  return null;
}

