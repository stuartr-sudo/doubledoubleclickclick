import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/api/entities';
import { toast } from 'sonner';

export function useBalanceConsumption() {
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const consumeBalanceForFeature = useCallback(async (featureKey, costOverride = null) => {
    setIsCheckingBalance(true);
    try {
      const user = await User.me();
      if (!user) {
        toast.error('You must be logged in');
        return { success: false, error: 'Not authenticated' };
      }

      // Get session token for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required. Please log in.');
        return { success: false, error: 'No session token' };
      }

      // Call balance consumption API
      const response = await fetch('/api/balance/check-and-deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          featureName: featureKey
        })
      });

      const result = await response.json();

      // API always returns 200 with ok:true/false
      if (result.ok) {
        // Immediately dispatch the event to update the UI
        if (typeof result.balance === 'number') {
          window.dispatchEvent(new CustomEvent('balanceUpdated', { 
            detail: { 
              newBalance: result.balance, 
              consumed: result.consumed || 0.10,
              featureUsed: featureKey 
            }
          }));
        }
        return { success: true, consumed: result.consumed, balance: result.balance };
      } else {
        // Handle business logic errors (INSUFFICIENT_BALANCE, DISABLED, COMING_SOON, etc.)
        const errorMessages = {
          INSUFFICIENT_BALANCE: `Insufficient balance. Required: $${result.required?.toFixed(2)}, Available: $${result.available?.toFixed(2)}`,
          DISABLED: 'This feature is currently disabled',
          COMING_SOON: 'This feature is coming soon',
          RATE_LIMIT: 'Rate limit exceeded. Please try again later',
          MISSING_FEATURE_KEY: 'Feature not found'
        };
        const message = errorMessages[result.code] || result.error || 'Balance consumption failed';
        toast.error(message);
        return { success: false, error: result.error, code: result.code };
      }
    } catch (error) {
      console.error('Error consuming balance:', error);
      toast.error('Failed to check account balance');
      return { success: false, error: error.message };
    } finally {
      setIsCheckingBalance(false);
    }
  }, []);

  // NEW: non-blocking balance check that runs in background
  const consumeBalanceOptimistic = useCallback(async (featureKey, costOverride = null) => {
    // fire-and-forget; do not set isCheckingBalance to avoid UI spinners
    try {
      const user = await User.me();
      if (!user) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      fetch('/api/balance/check-and-deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          featureName: featureKey
        })
      })
      .then(res => res.json())
      .then((result) => {
        if (result?.ok && typeof result.balance === 'number') {
          window.dispatchEvent(new CustomEvent('balanceUpdated', { 
            detail: { newBalance: result.balance, consumed: result.consumed || 0.10, featureUsed: featureKey }
          }));
        } else {
          // Quietly notify listeners; callers can choose to react (e.g., revert UI) without spamming toasts
          window.dispatchEvent(new CustomEvent('balanceConsumptionFailed', { 
            detail: { featureKey, error: result?.error, balance: result?.balance, code: result?.code }
          }));
        }
      })
      .catch((err) => {
        window.dispatchEvent(new CustomEvent('balanceConsumptionFailed', { 
          detail: { featureKey, error: err?.message || String(err) }
        }));
      });
    } catch (e) {
      console.warn('consumeBalanceOptimistic failed to start:', e);
    }
  }, []);

  return { consumeBalanceForFeature, consumeBalanceOptimistic, isCheckingBalance };
}

