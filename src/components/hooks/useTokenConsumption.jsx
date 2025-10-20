
import { useState, useCallback } from 'react';
import { checkAndConsumeTokens } from '@/api/functions';
import { User } from '@/api/entities';
import { toast } from 'sonner';

export function useTokenConsumption() {
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);

  const consumeTokensForFeature = useCallback(async (featureKey, costOverride = null) => {
    setIsCheckingTokens(true);
    try {
      const user = await User.me();
      if (!user) {
        toast.error('You must be logged in');
        return { success: false, error: 'Not authenticated' };
      }

      const result = await checkAndConsumeTokens({
        userId: user.id,
        featureName: featureKey
      });

      // API always returns 200 with ok:true/false
      if (result.ok) {
        // Immediately dispatch the event to update the UI
        if (typeof result.balance === 'number') {
          window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
            detail: { 
              newBalance: result.balance, 
              consumed: result.consumed || 1,
              featureUsed: featureKey 
            }
          }));
        }
        return { success: true, consumed: result.consumed, balance: result.balance };
      } else {
        // Handle business logic errors (INSUFFICIENT_TOKENS, DISABLED, COMING_SOON, etc.)
        const errorMessages = {
          INSUFFICIENT_TOKENS: `Insufficient tokens. Required: ${result.required}, Available: ${result.available}`,
          DISABLED: 'This feature is currently disabled',
          COMING_SOON: 'This feature is coming soon',
          RATE_LIMIT: 'Rate limit exceeded. Please try again later',
          MISSING_FEATURE_KEY: 'Feature not found'
        };
        const message = errorMessages[result.code] || result.error || 'Token consumption failed';
        toast.error(message);
        return { success: false, error: result.error, code: result.code };
      }
    } catch (error) {
      console.error('Error consuming tokens:', error);
      toast.error('Failed to check token balance');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingTokens(false);
    }
  }, []);

  // NEW: non-blocking token check that runs in background
  const consumeTokensOptimistic = useCallback(async (featureKey, costOverride = null) => {
    // fire-and-forget; do not set isCheckingTokens to avoid UI spinners
    try {
      const user = await User.me();
      if (!user) return;

      checkAndConsumeTokens({
        userId: user.id,
        featureName: featureKey
      })
      .then((result) => {
        if (result?.ok && typeof result.balance === 'number') {
          window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
            detail: { newBalance: result.balance, consumed: result.consumed || 1, featureUsed: featureKey }
          }));
        } else {
          // Quietly notify listeners; callers can choose to react (e.g., revert UI) without spamming toasts
          window.dispatchEvent(new CustomEvent('tokenConsumptionFailed', { 
            detail: { featureKey, error: result?.error, balance: result?.balance, code: result?.code }
          }));
        }
      })
      .catch((err) => {
        window.dispatchEvent(new CustomEvent('tokenConsumptionFailed', { 
          detail: { featureKey, error: err?.message || String(err) }
        }));
      });
    } catch (e) {
      console.warn('consumeTokensOptimistic failed to start:', e);
    }
  }, []);

  return { consumeTokensForFeature, consumeTokensOptimistic, isCheckingTokens };
}
