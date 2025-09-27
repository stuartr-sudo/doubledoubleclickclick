import { useState, useCallback } from 'react';
import { checkAndConsumeTokens } from '@/api/functions';
import { toast } from 'sonner';

export function useTokenConsumption() {
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);

  const consumeTokensForFeature = useCallback(async (featureKey, costOverride = null) => {
    setIsCheckingTokens(true);
    try {
      const { data } = await checkAndConsumeTokens({
        feature_key: featureKey,
        cost_override: costOverride
      });

      if (data.ok) {
        // Immediately dispatch the event to update the UI
        if (typeof data.balance === 'number') {
          window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
            detail: { 
              newBalance: data.balance, 
              consumed: data.consumed || 1,
              featureUsed: featureKey 
            }
          }));
        }
        return { success: true, consumed: data.consumed, balance: data.balance };
      } else {
        // Handle various error cases
        if (data.code === 'INSUFFICIENT_TOKENS') {
          toast.error(`Insufficient tokens. Required: ${data.required || 1}, Available: ${data.balance || 0}`);
        } else if (data.code === 'DISABLED') {
          toast.error('This feature is disabled for your account');
        } else if (data.code === 'COMING_SOON') {
          toast.error('This feature is coming soon');
        } else {
          toast.error(data.error || 'Token consumption failed');
        }
        return { success: false, error: data.error, code: data.code };
      }
    } catch (error) {
      console.error('Error consuming tokens:', error);
      toast.error('Failed to check token balance');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingTokens(false);
    }
  }, []);

  return { consumeTokensForFeature, isCheckingTokens };
}