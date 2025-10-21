import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import UserDashboard from '@/components/dashboard/UserDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PopularContent from '@/components/dashboard/PopularContent';
import RecommendedQuestions from '@/components/dashboard/RecommendedQuestions';
import PageLoader from '@/components/common/PageLoader';
import EmptyState from '@/components/common/EmptyState';
import { UserCircle } from 'lucide-react';

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

  // Modern loading state
  if (loading) {
    return <PageLoader message="Loading your dashboard..." />;
  }

  // Modern empty state with action
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        <EmptyState
          icon={UserCircle}
          title="Not logged in"
          description="Please log in to view your dashboard and access all features."
          actionLabel="Go to Login"
          onAction={() => window.location.href = '/login'}
        />
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.is_superadmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-blue-50/20">
      {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}
      
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PopularContent />
        <RecommendedQuestions />
      </div>
    </div>
  );
}