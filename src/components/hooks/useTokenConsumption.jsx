
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

      if (result.success) {
        // Immediately dispatch the event to update the UI
        if (typeof result.remainingBalance === 'number') {
          window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
            detail: { 
              newBalance: result.remainingBalance, 
              consumed: result.tokensConsumed || 1,
              featureUsed: featureKey 
            }
          }));
        }
        return { success: true, consumed: result.tokensConsumed, balance: result.remainingBalance };
      } else {
        // Handle error from our API
        toast.error(result.error || 'Token consumption failed');
        return { success: false, error: result.error };
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
        if (result?.success && typeof result.remainingBalance === 'number') {
          window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
            detail: { newBalance: result.remainingBalance, consumed: result.tokensConsumed || 1, featureUsed: featureKey }
          }));
        } else {
          // Quietly notify listeners; callers can choose to react (e.g., revert UI) without spamming toasts
          window.dispatchEvent(new CustomEvent('tokenConsumptionFailed', { 
            detail: { featureKey, error: result?.error, balance: result?.remainingBalance }
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
