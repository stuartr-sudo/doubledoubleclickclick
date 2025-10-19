/**
 * Check and consume tokens for a feature.
 * 
 * @param {string} userId - The user's ID
 * @param {string} featureName - The feature flag name (e.g. 'ai_rewriter')
 * @returns {Promise<{success: boolean, tokensConsumed: number, remainingBalance: number, error?: string}>}
 */
export async function checkAndConsumeTokens(userId, featureName) {
  try {
    const response = await fetch('/api/tokens/check-and-consume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, featureName })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 402) {
        return {
          success: false,
          error: `Insufficient tokens. You need ${data.required} tokens but only have ${data.available}.`,
          required: data.required,
          available: data.available
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: data.error || 'Feature access denied'
        };
      }

      return {
        success: false,
        error: data.error || 'Failed to consume tokens'
      };
    }

    return {
      success: true,
      tokensConsumed: data.tokensConsumed,
      remainingBalance: data.remainingBalance,
      bypassedCharge: data.bypassedCharge || false
    };

  } catch (error) {
    console.error('Token consumption error:', error);
    return {
      success: false,
      error: 'Network error: failed to check tokens'
    };
  }
}

/**
 * Get the user's current token balance.
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<number>}
 */
export async function getTokenBalance(userId) {
  try {
    const response = await fetch(`/api/tokens/balance?userId=${userId}`);
    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

