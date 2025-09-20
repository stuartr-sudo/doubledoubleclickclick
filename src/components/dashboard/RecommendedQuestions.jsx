
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ExternalLink } from "lucide-react";
// REMOVED invalid: import { toast } "sonner"; // This line was syntactically incorrect and is replaced by shadcn/ui toast
import { Username } from "@/api/entities";
import { getFaqRecommendations } from "@/api/functions";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast"; // New import for shadcn/ui toast

export default function RecommendedQuestions({ currentUser, selectedUsername }) {
  const [loading, setLoading] = React.useState(true);
  const [byUser, setByUser] = React.useState({});
  // Removed: const [creatingFor, setCreatingFor] = React.useState(null); // No longer tracking creation status as we navigate directly
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize shadcn/ui toast hook

  // Helper function for displaying error toasts (memoized to satisfy useEffect deps)
  const showError = React.useCallback(
    (msg) => toast({ title: "Error", description: String(msg || "Something went wrong"), variant: "destructive" }),
    [toast]
  );

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Determine usernames in scope
        let usernames = Array.isArray(currentUser?.assigned_usernames) ? [...currentUser.assigned_usernames] : [];
        const isSuper = currentUser?.role === "admin" || currentUser?.access_level === "full";

        if (isSuper && (!usernames || usernames.length === 0)) {
          const rows = await Username.list("-created_date").catch(() => []);
          usernames = rows.filter(u => u.is_active !== false).map(u => u.user_name);
        }

        if (selectedUsername) usernames = usernames.includes(selectedUsername) ? [selectedUsername] : [];

        if (!usernames || usernames.length === 0) {
          if (isMounted) {
            setByUser({});
            setLoading(false);
          }
          return;
        }

        const { data } = await getFaqRecommendations({ usernames, limitPerUser: 10 });
        if (data?.success) {
          if (isMounted) setByUser(data.data || {});
        } else {
          // Use showError helper for error toasts
          showError(data?.error || "Failed to load recommendations");
          if (isMounted) setByUser({});
        }
      } catch (e) {
        console.error("FAQ recommendations error:", e);
        // Use showError helper for error toasts
        showError("Failed to load recommended questions");
        if (isMounted) setByUser({});
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [currentUser, selectedUsername, showError]);

  // Removed: escapeHtml helper as it's no longer used
  // const escapeHtml = (s) =>
  //   String(s || "")
  //     .replace(/&/g, "&amp;")
  //     .replace(/</g, "&lt;")
  //     .replace(/>/g, "&gt;");

  // CHANGE: Open Topics > FAQ and focus the question instead of creating a draft
  const handleAnswerNow = (uname, q) => { // Changed to synchronous as no async operation is performed
    if (!q?.question) return;
    const url = createPageUrl(
      `Topics?tab=faq&username=${encodeURIComponent(uname)}&focus=${encodeURIComponent(q.question)}`
    );
    navigate(url);
  };

  const usernames = Object.keys(byUser);

  return (
    <Card className="bg-white border border-slate-200 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="text-slate-900 font-semibold text-lg">Recommended Questions to Answer</h3>
        </div>
        <Badge variant="outline" className="border-slate-300 text-slate-700">
          High intent
        </Badge>
      </div>

      {loading ? (
        <div className="text-slate-600 py-6">Loading recommendations...</div>
      ) : usernames.length === 0 ? (
        <div className="text-slate-600 py-6">No recommendations available yet.</div>
      ) : (
        <div className="space-y-6">
          {usernames.map((uname) => {
            const list = byUser[uname] || [];
            if (list.length === 0) return null;
            return (
              <div key={uname} className="bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-slate-900 font-medium">{uname}</h4>
                  <Link to={createPageUrl("Content")} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1">
                    View content
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-900">
                  {list.map((q) => (
                    <li key={q.id || q.question} className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{q.question}</div>
                        {q.topic && <div className="text-xs text-slate-600 mt-0.5">Topic: {q.topic}</div>}
                        {q.url && (
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                          >
                            Source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">High</Badge>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleAnswerNow(uname, q)}
                        >
                          Answer Now
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
