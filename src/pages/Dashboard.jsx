
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import UserDashboard from "../components/dashboard/UserDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import UserSetupModal from "../components/dashboard/UserSetupModal";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Username } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPageUrl } from "@/utils";
import AnalyticsByUsername from "../components/analytics/AnalyticsByUsername"; // New import

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [usernameOptions, setUsernameOptions] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Determine usernames for the selector
        const isSuper = user.role === 'admin' || user.access_level === 'full';
        if (isSuper) {
          const rows = await Username.list("-created_date").catch(() => []);
          const names = rows.filter((u) => u.is_active !== false).map((u) => u.user_name);
          setUsernameOptions(names);
        } else {
          const names = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
          setUsernameOptions(names);
          if (names.length > 0) setSelectedUsername("all"); // Default to 'all' if user has usernames
        }

        // Check if user needs setup (no assigned usernames and not admin)
        if (user.role !== 'admin' && (!user.assigned_usernames || user.assigned_usernames.length === 0)) {
          setShowSetup(true);
        }
      } catch (error) {
        toast.error("You need to be logged in to view the dashboard.");
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSetupComplete = (userData) => {
    setCurrentUser((prev) => ({ ...prev, ...userData }));
    setShowSetup(false);
    toast.success("Your account has been set up successfully!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
        <p className="text-slate-600 mb-6">Please log in to view your dashboard.</p>
        <Button onClick={() => User.login()}>Log In</Button>
      </div>
    );
  }

  const selected = selectedUsername === "all" ? undefined : selectedUsername;

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      {showSetup && (
        <UserSetupModal
          isOpen={showSetup}
          onComplete={handleSetupComplete}
          currentUser={currentUser}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 text-sm">Welcome back, {currentUser.full_name || currentUser.email}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => { window.location.href = createPageUrl("Pages"); }}
              className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              Open Pages Wizard
            </Button>
            {usernameOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-sm">Username</span>
                <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                  <SelectTrigger className="w-48 bg-white border border-slate-300 text-slate-900">
                    <SelectValue placeholder="Filter by username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 text-slate-900">
                    <SelectItem value="all">All</SelectItem>
                    {usernameOptions.map((u) => (
                      <SelectItem key={u} value={u} className="hover:bg-slate-100">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
            <AnalyticsByUsername currentUser={currentUser} selectedUsername={selected} />
        </div>

        {/* Main dashboard content */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {currentUser.role === 'admin' ? (
              <AdminDashboard currentUser={currentUser} selectedUsername={selected} />
            ) : (
              <UserDashboard currentUser={currentUser} selectedUsername={selected} />
            )}
        </div>

      </div>
    </div>
  );
}
