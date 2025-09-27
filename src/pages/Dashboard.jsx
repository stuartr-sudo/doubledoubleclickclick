
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
import AnalyticsByUsername from "../components/analytics/AnalyticsByUsername";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";


export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // OLD STATE - will be replaced by context when feature flag is active
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");
  const [localUsernameOptions, setLocalUsernameOptions] = useState([]);

  // NEW: Workspace context and feature flag
  const { selectedUsername: globalUsername, assignedUsernames: globalUsernames } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // This logic remains for the modular (old) system
        // It populates local state, which is used when useWorkspaceScoping is false
        const isSuper = user.role === 'admin' || user.access_level === 'full';
        if (isSuper) {
          const rows = await Username.list("-created_date").catch(() => []);
          const names = rows.filter((u) => u.is_active !== false).map((u) => u.user_name);
          setLocalUsernameOptions(names);
        } else {
          const names = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
          setLocalUsernameOptions(names);
          if (names.length > 0) setLocalSelectedUsername("all"); // Default to 'all' if user has usernames
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
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Access Denied</h2>
        <p className="text-slate-600 mb-6">Please log in to view your dashboard.</p>
        <Button onClick={() => User.login()}>Log In</Button>
      </div>
    );
  }

  // NEW: Determine which username to use based on feature flag
  const selected = useWorkspaceScoping
    ? (globalUsername === 'all' ? undefined : globalUsername)
    : (localSelectedUsername === "all" ? undefined : localSelectedUsername);

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
