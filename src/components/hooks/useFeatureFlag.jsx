import React from "react";
import { FeatureFlag } from "@/api/entities";
import { User } from "@/api/entities";

// NEW: simple in-memory cache with 60s TTL
const FLAG_CACHE = new Map(); // key: featureName -> { enabled, isComingSoon, ts }

export default function useFeatureFlag(featureName, opts = {}) {
  const { currentUser = null, defaultEnabled = true } = opts;
  const [enabled, setEnabled] = React.useState(!!defaultEnabled);
  const [loading, setLoading] = React.useState(true);
  const [isComingSoon, setIsComingSoon] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Check cache first
      const now = Date.now();
      const cached = FLAG_CACHE.get(featureName);
      if (cached && now - cached.ts < 60_000) {
        if (mounted) {
          setEnabled(cached.enabled);
          setIsComingSoon(cached.isComingSoon);
          setLoading(false);
        }
        return;
      }

      // Fallbacks
      let effective = !!defaultEnabled;
      let comingSoon = false;

      try {
        const flags = await FeatureFlag.filter({ name: featureName });
        if (flags && flags.length > 0) {
          const flag = flags[0];
          effective = !!flag.enabled_globally;
          comingSoon = !!flag.is_coming_soon;

          // Respect per-user override if available
          let uid = currentUser?.id || null;
          if (!uid) {
            try {
              const me = await User.me();
              uid = me?.id || null;
            } catch {
              uid = null;
            }
          }
          const overrides = flag.user_overrides || {};
          if (uid && Object.prototype.hasOwnProperty.call(overrides, uid)) {
            effective = !!overrides[uid];
          }
        }
      } catch {
        // keep defaults on error
        effective = !!defaultEnabled;
        comingSoon = false;
      }

      // Save to cache
      FLAG_CACHE.set(featureName, { enabled: effective, isComingSoon: comingSoon, ts: Date.now() });

      if (mounted) {
        setEnabled(effective);
        setIsComingSoon(comingSoon);
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [featureName, currentUser?.id, defaultEnabled]);

  return { enabled, loading, isComingSoon };
}