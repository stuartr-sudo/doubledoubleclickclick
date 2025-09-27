import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function TokenTopUpBanner() {
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenBalance = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        // Check if user is new (created within the last 24 hours)
        const isNewUser = (() => {
          if (!currentUser.created_date) return false;
          const createdAt = new Date(currentUser.created_date);
          const now = new Date();
          const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
          return hoursSinceCreation < 24; // Consider user "new" for first 24 hours
        })();
        
        // Only show banner if:
        // 1. User has 0 tokens
        // 2. User is NOT new
        // 3. Banner hasn't been dismissed
        const shouldShow = (
          (currentUser.token_balance === 0 || currentUser.token_balance == null) &&
          !isNewUser &&
          !isDismissed
        );
        
        setIsVisible(shouldShow);
      } catch (error) {
        console.error('Error checking token balance:', error);
        setIsVisible(false);
      }
    };

    checkTokenBalance();
  }, [isDismissed]);

  const handleTopUp = () => {
    navigate(createPageUrl('TokenPacketsTopUp'));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || !user) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 m-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="text-amber-800 font-medium">You're out of tokens</h4>
            <p className="text-amber-700 text-sm">
              Your current balance is {user.token_balance || 0}. Top up to continue using AI features without interruptions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleTopUp} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            Top up tokens
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}