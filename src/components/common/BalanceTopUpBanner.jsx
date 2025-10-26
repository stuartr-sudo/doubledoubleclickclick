import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function BalanceTopUpBanner() {
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBalance = async () => {
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
        
        const currentBalance = parseFloat(currentUser.account_balance) || 0;
        
        // Only show banner if:
        // 1. User has less than $5.00 balance (threshold increased for better UX)
        // 2. User is NOT new (new users start with $5.00 credit)
        // 3. Banner hasn't been dismissed
        // Note: Superadmins are excluded from low balance warnings
        const isSuperadmin = currentUser.is_superadmin || currentUser.role === 'superadmin';
        const shouldShow = (
          currentBalance < 5.00 &&
          !isNewUser &&
          !isDismissed &&
          !isSuperadmin
        );
        
        setIsVisible(shouldShow);
      } catch (error) {
        console.error('Error checking account balance:', error);
        setIsVisible(false);
      }
    };

    checkBalance();
    
    // Listen for balance updates
    const handleBalanceUpdate = () => {
      checkBalance();
    };
    
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, [isDismissed]);

  const handleAddFunds = () => {
    navigate(createPageUrl('BalanceTopUp'));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || !user) {
    return null;
  }

  const currentBalance = parseFloat(user.account_balance) || 0;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 m-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="text-amber-800 font-medium">Low account balance</h4>
            <p className="text-amber-700 text-sm">
              Your current balance is ${currentBalance.toFixed(2)}. Add funds to continue using AI features without interruptions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddFunds} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <DollarSign className="w-4 h-4 mr-1" />
            Add Funds
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

