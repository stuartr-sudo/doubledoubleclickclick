import { useState, useEffect } from 'react';
import { FeatureFlag } from '@/api/entities';
import { toast } from "sonner";

export default function useAskAiFeatures() {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const flags = await FeatureFlag.list();
        const featuresMap = flags.reduce((acc, flag) => {
          // Ensure token_cost is always a number, handle decimals
          const tokenCost = typeof flag.token_cost === 'number' ? flag.token_cost : parseFloat(flag.token_cost) || 0;
          
          acc[flag.name] = {
            enabled: flag.enabled_globally,
            isComingSoon: flag.is_coming_soon,
            youtube_tutorial_url: flag.youtube_tutorial_url,
            loom_tutorial_url: flag.loom_tutorial_url,
            token_cost: tokenCost
          };
          return acc;
        }, {});
        
        // Alias support for imagineer
        if (!featuresMap["ai_imagineer"] && featuresMap["imagineer"]) {
          featuresMap["ai_imagineer"] = featuresMap["imagineer"];
        }

        // Alias support for voice-ai (both hyphen and underscore)
        if (featuresMap["voice-ai"]) {
          featuresMap["voice_ai"] = featuresMap["voice-ai"];
        } else if (featuresMap["voice_ai"]) {
          featuresMap["voice-ai"] = featuresMap["voice_ai"];
        }

        console.log('Loaded features map:', featuresMap);
        console.log('voice-ai feature:', featuresMap["voice-ai"]);
        console.log('voice_ai feature:', featuresMap["voice_ai"]);

        setFeatures(featuresMap);
      } catch (error) {
        toast.error("Could not load AI features.");
        console.error("Error fetching feature flags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return { features, loading };
}