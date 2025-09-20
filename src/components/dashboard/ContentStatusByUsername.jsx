
import React from "react";
import { BlogPost } from "@/api/entities";
import { Username } from "@/api/entities";
import { Loader2 } from "lucide-react";

export default function ContentStatusByUsername({ currentUser, selectedUsername }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      if (!currentUser) return;
      setLoading(true);

      // Determine accessible usernames
      const isAdmin = currentUser.role === "admin" || currentUser.access_level === "full";
      let allowed = [];

      if (isAdmin) {
        const all = await Username.list("-created_date").catch(() => []);
        allowed = (all || []).filter(u => u.is_active !== false).map(u => u.user_name).filter(Boolean);
      } else {
        allowed = Array.isArray(currentUser.assigned_usernames) ? currentUser.assigned_usernames.filter(Boolean) : [];
      }

      // Optional single username filter coming from dashboard selector
      if (selectedUsername) {
        allowed = allowed.filter(u => u === selectedUsername);
      }

      if (allowed.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Fetch posts per username and aggregate counts
      const tasks = allowed.map(async (uname) => {
        const posts = await BlogPost.filter({ user_name: uname }, "-updated_date").catch(() => []);
        const draft = posts.filter(p => p.status === "draft").length;
        const published = posts.filter(p => p.status === "published").length;
        return { user_name: uname, draft, published, total: draft + published };
      });

      const results = await Promise.all(tasks);
      const sorted = results.sort((a, b) => a.user_name.localeCompare(b.user_name));
      setRows(sorted);
      setLoading(false);
    })();
  }, [currentUser, selectedUsername]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Content Status by Username</h3>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center text-slate-600">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-slate-600">
          No usernames or content found for your access.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="py-2 pr-4 font-medium">Username</th>
                <th className="py-2 pr-4 font-medium">Draft</th>
                <th className="py-2 pr-4 font-medium">Published</th>
                <th className="py-2 pr-4 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_name} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="py-2 pr-4 text-slate-900">{r.user_name}</td>
                  <td className="py-2 pr-4 text-slate-800">{r.draft}</td>
                  <td className="py-2 pr-4 text-slate-800">{r.published}</td>
                  <td className="py-2 pr-4 text-slate-900">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
