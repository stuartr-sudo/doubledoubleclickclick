import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import UserDashboard from '@/components/dashboard/UserDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PopularContent from '@/components/dashboard/PopularContent';
import RecommendedQuestions from '@/components/dashboard/RecommendedQuestions';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Please log in to view your dashboard.</p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.is_superadmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}
      
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PopularContent />
        <RecommendedQuestions />
      </div>
    </div>
  );
}