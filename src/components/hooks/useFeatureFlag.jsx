import { useMemo } from 'react';
import { useFeatureFlagData } from '@/components/providers/FeatureFlagProvider';

export default function useFeatureFlag(featureName, { currentUser, defaultEnabled = true } = {}) {
  const { flags, products, loading } = useFeatureFlagData();

  const result = useMemo(() => {
    // When data is loading or empty (stubbed), default to enabled
    if (loading || !flags || flags.length === 0) {
      return { enabled: defaultEnabled, isComingSoon: false, isLoading: loading };
    }

    const flag = flags.find(f => f.flag_name === featureName);

    // If flag doesn't exist in the DB, use the default passed to the hook.
    if (!flag) {
      return { enabled: defaultEnabled, isComingSoon: false, isLoading: false };
    }

    // Master switch: if disabled globally, it's off for everyone except superadmins.
    if (!flag.is_enabled && !currentUser?.is_superadmin) {
        return { enabled: false, isComingSoon: false, isLoading: false };
    }
    
    // Superadmins bypass all checks except 'coming soon' (and can see disabled flags)
    if (currentUser?.is_superadmin) {
        if (flag.is_coming_soon) {
            return { enabled: false, isComingSoon: true, isLoading: false };
        }
        return { enabled: true, isComingSoon: false, isLoading: false };
    }

    // User-specific overrides are the next highest priority
    if (currentUser && flag.user_overrides && typeof flag.user_overrides[currentUser.id] === 'boolean') {
      return { enabled: flag.user_overrides[currentUser.id], isComingSoon: flag.is_coming_soon, isLoading: false };
    }

    // 'Coming soon' hides the feature for all non-admins.
    if (flag.is_coming_soon) {
      return { enabled: false, isComingSoon: true, isLoading: false };
    }

    // Plan-based restriction is the final check.
    const requiredPlans = flag.required_plan_keys;
    if (Array.isArray(requiredPlans) && requiredPlans.length > 0) {
      if (!currentUser || !currentUser.plan_price_id) {
        return { enabled: false, isComingSoon: false, isLoading: false }; // No plan, no access.
      }

      const userProduct = products.find(p => p.stripe_price_id === currentUser.plan_price_id);
      if (!userProduct || !requiredPlans.includes(userProduct.plan_key)) {
        return { enabled: false, isComingSoon: false, isLoading: false }; // Wrong plan, no access.
      }
    }

    // If it passed all the checks (globally enabled, not coming soon, and met plan requirements), it's enabled.
    return { enabled: true, isComingSoon: false, isLoading: false };

  }, [featureName, currentUser, defaultEnabled, flags, products, loading]);

  return result;
}