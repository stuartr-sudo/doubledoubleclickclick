import React, { useState, useEffect } from "react";
import { User, Username } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function DebugUsernames() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsernames, setAllUsernames] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const usernames = await Username.list("-created_date");
      setAllUsernames(usernames || []);
    } catch (e) {
      console.error("Debug page error:", e);
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addKeppiToUser = async () => {
    try {
      await User.update(currentUser.id, {
        assigned_usernames: ['keppi']
      });
      toast.success("Added 'keppi' to assigned_usernames!");
      loadData();
    } catch (e) {
      toast.error("Failed to update: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p>Loading debug info...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasKeppi = currentUser?.assigned_usernames?.includes('keppi');

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Username Debug Page
        </h1>
        <p className="text-slate-600">
          Diagnosing why "keppi" isn't showing in the Topics dropdown
        </p>
      </div>

      {/* Current User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current User Profile
            <Button
              onClick={loadData}
              size="icon"
              variant="ghost"
              className="ml-auto">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-slate-900">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Full Name</p>
                <p className="text-slate-900">{currentUser?.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Role</p>
                <p className="text-slate-900">{currentUser?.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Is Superadmin</p>
                <p className="text-slate-900">
                  {currentUser?.is_superadmin ? (
                    <CheckCircle className="w-5 h-5 text-green-600 inline" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 inline" />
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">
                  Assigned Usernames
                </p>
                {hasKeppi ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              {!currentUser?.assigned_usernames || currentUser.assigned_usernames.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-amber-800 text-sm mb-2">
                    ❌ No assigned usernames found
                  </p>
                  <Button onClick={addKeppiToUser} className="bg-indigo-600 hover:bg-indigo-700">
                    Add "keppi" Now
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentUser.assigned_usernames.map((username) => (
                    <span
                      key={username}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        username === 'keppi'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                      {username}
                      {username === 'keppi' && ' ✅'}
                    </span>
                  ))}
                </div>
              )}

              {!hasKeppi && currentUser?.assigned_usernames?.length > 0 && (
                <div className="mt-3">
                  <Button onClick={addKeppiToUser} className="bg-indigo-600 hover:bg-indigo-700">
                    Add "keppi" Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Usernames Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Usernames in System</CardTitle>
        </CardHeader>
        <CardContent>
          {allUsernames.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              No usernames found in the system
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Username
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Display Name
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      Active
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allUsernames.map((username) => (
                    <tr
                      key={username.id}
                      className={`border-b border-slate-100 ${
                        username.user_name === 'keppi' ? 'bg-green-50' : ''
                      }`}>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {username.user_name || username.username}
                        {username.user_name === 'keppi' && ' 🎯'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {username.display_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {username.is_active ? (
                          <CheckCircle className="w-5 h-5 text-green-600 inline" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-400 inline" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {username.created_date
                          ? new Date(username.created_date).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Summary */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>If "keppi" is in assigned_usernames, hard refresh browser (Cmd+Shift+R)</li>
            <li>If not, click "Add keppi Now" button above</li>
            <li>Clear browser cache (Application → Clear Storage)</li>
            <li>Log out and log back in</li>
            <li>Go to Topics page - "keppi" should appear in dropdown</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

