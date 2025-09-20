
import React from "react";
import { BlogPost } from "@/api/entities";
import { Username } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

function scorePost(p) {
  const words = String(p.content || "").replace(/<[^>]*>/g, " ").split(/\s+/).length;
  const img = (String(p.content || "").match(/<img\b/gi) || []).length;
  const vid = (String(p.content || "").match(/<iframe\b/gi) || []).length;
  const rt = Number(p.reading_time || Math.round(words / 200));
  const updated = Date.parse(p.updated_date || p.created_date || 0) || 0;
  const days = Math.max(1, (Date.now() - updated) / (1000 * 60 * 60 * 24));
  const recency = 100 / days;           // 100 if today, decays with time
  const richness = img * 6 + vid * 10;  // video carries more weight
  const base = rt;                       // longer posts may get more engagement
  return 0.45 * recency + 0.35 * base + 0.2 * richness;
}

function Bar({ pct }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: "linear-gradient(90deg,#22c55e,#3b82f6)" }}
      />
    </div>
  );
}

export default function PopularContent({ currentUser, selectedUsername }) {
  const [loading, setLoading] = React.useState(true);
  const [byUser, setByUser] = React.useState({}); // { username: [posts] }

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      // Resolve usernames visible to this user
      let usernames = Array.isArray(currentUser?.assigned_usernames) ? [...currentUser.assigned_usernames] : [];
      const isSuper = currentUser?.role === "admin" || currentUser?.access_level === "full";
      if (isSuper) {
        const rows = await Username.list("-created_date").catch(() => []);
        usernames = rows.filter(u => u.is_active !== false).map(u => u.user_name);
      }
      if (selectedUsername) {
        usernames = usernames.includes(selectedUsername) ? [selectedUsername] : [];
      }
      const results = {};
      for (const uname of usernames) {
        const posts = await BlogPost.filter({ user_name: uname, status: "published" }, "-updated_date", 60).catch(() => []);
        const withScore = posts.map(p => ({ ...p, __score: scorePost(p) }))
          .sort((a, b) => b.__score - a.__score)
          .slice(0, 5);
        results[uname] = withScore;
      }
      if (isMounted) {
        setByUser(results);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [currentUser, selectedUsername]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 text-slate-600">
        Loading popular content...
      </div>
    );
  }

  const usernames = Object.keys(byUser);

  if (usernames.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 text-slate-600">
        No assigned usernames or published content yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usernames.map(uname => {
        const list = byUser[uname] || [];
        if (list.length === 0) return null;
        const maxScore = Math.max(...list.map(p => p.__score || 1), 1);
        return (
          <div key={uname} className="bg-white border border-slate-200 rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 font-semibold text-lg">Popular Content — {uname}</h3>
              <Link to={createPageUrl("Content")} className="text-sm text-slate-600 hover:text-slate-900">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {list.map(p => {
                const pct = (100 * (p.__score || 0)) / maxScore;
                const date = new Date(p.updated_date || p.created_date || Date.now());
                return (
                  <div key={p.id} className="p-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-slate-900 font-medium line-clamp-2">{p.title || "Untitled Post"}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          {date.toLocaleDateString()} • {p.reading_time || Math.ceil(String(p.content||"").replace(/<[^>]*>/g," ").split(/\s+/).length/200)} min read
                        </div>
                      </div>
                      <Link to={createPageUrl(`Editor?post=${p.id}`)}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          Open
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "linear-gradient(90deg,#22c55e,#3b82f6)" }}
                        />
                      </div>
                    </div>
                    {Array.isArray(p.tags) && p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tags.slice(0, 6).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {String(t)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
