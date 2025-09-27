
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
          acc[flag.name] = {
            enabled: flag.enabled_globally,
            isComingSoon: flag.is_coming_soon,
            youtube_tutorial_url: flag.youtube_tutorial_url,
            loom_tutorial_url: flag.loom_tutorial_url, // Added this line
            token_cost: flag.token_cost || 0
          };
          return acc;
        }, {});
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
