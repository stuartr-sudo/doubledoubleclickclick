import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFullName(currentUser.full_name || '');
      } catch (error) {
        toast.error("You must be logged in to view this page.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await User.updateMyUserData({ full_name: fullName });
      toast.success("Account updated successfully!");
    } catch (error) {
      toast.error("Failed to update account. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-700">
        Access Denied. Please log in.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white mt-12 rounded-2xl shadow-lg border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
      <p className="text-slate-600 mb-8">Manage your profile and account details.</p>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-slate-100 border-slate-300 text-slate-500"
          />
           <p className="text-xs text-slate-500 mt-2">Your email address cannot be changed.</p>
        </div>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Role
          </label>
           <Input
            id="role"
            type="text"
            value={user.role === 'admin' ? 'Administrator' : 'User'}
            disabled
            className="bg-slate-100 border-slate-300 text-slate-500"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}