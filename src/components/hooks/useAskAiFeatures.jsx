
import { useState, useEffect } from 'react';
import { FeatureFlag } from '@/api/entities';

export default function useAskAiFeatures() {
  // Initialize features to null. Components consuming this hook should
  // handle a null state (e.g., show a loading indicator or disable features)
  // until the flags are fetched and processed.
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFlags = async () => {
      // Define the complete set of default AI features, all enabled by default.
      // This serves as the baseline, which will then be overridden by actual
      // feature flag data from the backend.
      // Each feature now includes an 'enabled' status and an 'isComingSoon' status.
      const defaultFeatures = {
        ai_rewrite: { enabled: true, isComingSoon: false },
        ai_humanize: { enabled: true, isComingSoon: false },
        ai_key_takeaway: { enabled: true, isComingSoon: false },
        ai_fact_box: { enabled: true, isComingSoon: false },
        ai_cite_sources: { enabled: true, isComingSoon: false },
        ai_generate_image: { enabled: true, isComingSoon: false },
        ai_generate_video: { enabled: true, isComingSoon: false },
        ai_audio: { enabled: true, isComingSoon: false },
        ai_image_library: { enabled: true, isComingSoon: false },
        ai_video_library: { enabled: true, isComingSoon: false },
        ai_youtube: { enabled: true, isComingSoon: false },
        ai_tiktok: { enabled: true, isComingSoon: false },
        ai_manual_link: { enabled: true, isComingSoon: false },
        ai_sitemap_link: { enabled: true, isComingSoon: false },
        ai_promoted_product: { enabled: true, isComingSoon: false },
        ai_amazon_import: { enabled: true, isComingSoon: false },
        ai_cta: { enabled: true, isComingSoon: false },
        ai_testimonials: { enabled: true, isComingSoon: false },
        ai_clean_html: { enabled: true, isComingSoon: false },
        ai_detection: { enabled: true, isComingSoon: false },
        ai_agent: { enabled: true, isComingSoon: false },
        ai_brand_it: { enabled: true, isComingSoon: false },
        ai_affilify: { enabled: true, isComingSoon: false },
        ai_localize: { enabled: true, isComingSoon: false },
        ai_faq: { enabled: true, isComingSoon: false },
      };

      try {
        const flags = await FeatureFlag.list();
        
        if (isMounted) {
          // Start with a copy of the default features.
          const updatedFeatureMap = { ...defaultFeatures };
          
          if (Array.isArray(flags)) {
            // Iterate over the fetched flags and apply their enabled and coming soon status.
            // This will override defaults and add any new flags not initially
            // present in the defaultFeatures map.
            flags.forEach(flag => {
              updatedFeatureMap[flag.name] = {
                enabled: flag.enabled_globally,
                isComingSoon: flag.is_coming_soon
              };
            });
          }
          // Set the final feature map. This will be either the merged map
          // or just the default features if `flags` was not an array.
          setFeatures(updatedFeatureMap);
        }
      } catch (error) {
        console.error("Could not fetch latest feature flags, using defaults:", error);
        // In case of an error during fetch, ensure that features are still set
        // to the default values, so the UI doesn't remain in a null/loading state indefinitely.
        if (isMounted) {
          setFeatures(defaultFeatures);
        }
      }
    };

    fetchFlags();

    // Cleanup function to prevent state updates on unmounted components
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this effect runs once on mount.

  // Return the current state of features.
  // This will be null initially, then populated with the feature map.
  return { features };
}
