
import React, { useEffect, useMemo, useState } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, FileText, Link as LinkIcon, ChevronRight, ClipboardPaste, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PasteContentModal from "@/components/content/PasteContentModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Content() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedUsernames, setAllowedUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]); // unified: posts + webhooks
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // state for delete confirmation

  // Generate a sensible default username for paste modal
  const defaultPasteUsername = useMemo(() => {
    if (selectedUsername && selectedUsername !== "all") return selectedUsername;
    return allowedUsernames && allowedUsernames.length > 0 ? allowedUsernames[0] : "";
  }, [selectedUsername, allowedUsernames]);

  const handlePasteSubmit = async ({ title, content, user_name }) => {
    // Create draft record and open editor
    const newPost = await BlogPost.create({
      title: title?.trim() || "Pasted Content",
      content,
      status: "draft",
      user_name
    });
    // Navigate to editor for immediate editing
    window.location.href = createPageUrl(`Editor?post=${newPost.id}`);
  };

  // NEW: fast loader with capped concurrency + incremental updates
  const loadScopedContentFast = async (me, usernames) => {
    if (!Array.isArray(usernames) || usernames.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const withRetry = async (fn, tries = 4, baseDelay = 200) => {
      let attempt = 0;
      // jittered exponential backoff on 429
      while (true) {
        try {
          return await fn();
        } catch (err) {
          attempt += 1;
          const msg = String(err?.message || "");
          const is429 = /429|rate limit/i.test(msg);
          if (attempt >= tries || !is429) throw err;
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.round(Math.random() * 120);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    };

    // Minimal p-limit (concurrency limiter)
    const createLimiter = (concurrency = 6) => {
      let active = 0;
      const queue = [];
      const next = () => {
        if (active >= concurrency) return;
        const job = queue.shift();
        if (!job) return;
        active++;
        job()
          .catch(() => {}) // errors handled in the job itself
          .finally(() => {
            active--;
            next();
          });
      };
      return (task) =>
        new Promise((resolve, reject) => {
          queue.push(async () => {
            try {
              const res = await task();
              resolve(res);
            } catch (e) {
              reject(e);
            }
          });
          next();
        });
    };

    const limit = createLimiter(6);

    // Smart dedupe (post vs webhook preference, recency)
    const dedupeSmart = (arr) => {
      const groups = new Map();
      for (const x of arr) {
        const uname = x.user_name || "";
        const titleKey = (x.title || "").trim().toLowerCase();
        const key = x.processing_id ? `${uname}|proc:${x.processing_id}` : `${uname}|t:${titleKey}`;
        const bucket = groups.get(key) || [];
        bucket.push(x);
        groups.set(key, bucket);
      }
      const score = (o) => {
        let s = 0;
        if (o.type === "post") s += 100;
        if (o.status === "published") s += 50;
        if (o.status === "editing") s += 20;
        const t = new Date(o.updated_at || o.created_at || 0).getTime() || 0;
        return s + t / 1e5;
      };
      const out = [];
      for (const [, list] of groups) {
        out.push([...list].sort((a, b) => score(b) - score(a))[0]);
      }
      return out;
    };

    const normalizePost = (p) => ({
      id: p.id,
      title: p.title || "(Untitled)",
      status: p.status || "draft",
      type: "post",
      user_name: p.user_name || "",
      updated_at: p.updated_date || p.created_date,
      created_at: p.created_date,
      processing_id: p.processing_id || null
    });

    const normalizeWebhook = (w) => ({
      id: w.id,
      title: w.title || "(Untitled)",
      status: w.status || "received",
      type: "webhook",
      user_name: w.user_name || "",
      updated_at: w.updated_date || w.created_date,
      created_at: w.created_date,
      processing_id: w.processing_id || w.id
    });

    let firstPushed = false;
    const push = (batch) => {
      if (!batch?.length) return;
      setItems((prev) => {
        const merged = dedupeSmart([...(prev || []), ...batch]);
        return merged.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      });
      if (!firstPushed) {
        setLoading(false); // show results as soon as the first batch lands
        firstPushed = true;
      }
    };

    // Build tasks per-username (BlogPost + WebhookReceived) and run with limited concurrency
    const tasks = [];
    for (const uname of usernames) {
      tasks.push(
        limit(async () => {
          try {
            const posts = await withRetry(() => BlogPost.filter({ user_name: uname }, "-updated_date"));
            push((posts || []).map(normalizePost));
          } catch (e) {
            console.error(`Error fetching posts for ${uname}:`, e);
            // ignore this username's posts on error
          }
        })
      );
      tasks.push(
        limit(async () => {
          try {
            const hooks = await withRetry(() => WebhookReceived.filter({ user_name: uname }, "-updated_date"));
            push((hooks || []).map(normalizeWebhook));
          } catch (e) {
            console.error(`Error fetching webhooks for ${uname}:`, e);
            // ignore this username's webhooks on error
          }
        })
      );
    }

    await Promise.allSettled(tasks);
    setLoading(false); // ensure loading ends even if nothing returned, or if tasks array was empty
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await User.me();
        setCurrentUser(me);

        // Determine which usernames this user can see, strictly based on assignments.
        let usernames = Array.isArray(me?.assigned_usernames) ? me.assigned_usernames.filter(Boolean) : [];

        usernames.sort((a, b) => a.localeCompare(b));
        setAllowedUsernames(usernames);
        setSelectedUsername(usernames.length === 1 ? usernames[0] : "all");

        // Load data with strict scoping using the new fast loader
        await loadScopedContentFast(me, usernames);
      } catch (e) {
        console.error("Failed to load initial data:", e);
        setAllowedUsernames([]);
        setItems([]);
        setLoading(false); // Ensure loading state is reset on error
      }
      // The finally block for setLoading(false) is handled within loadScopedContentFast and catch.
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const byUser = selectedUsername === "all" ? true : it.user_name === selectedUsername;
      const byStatus = statusFilter === "all" ? true : it.status === statusFilter;
      const byQuery = q.trim() ?
        (it.title || "").toLowerCase().includes(q.trim().toLowerCase()) :
        true;
      return byUser && byStatus && byQuery;
    });
  }, [items, q, statusFilter, selectedUsername]);

  const onOpenItem = (row) => {
    if (row.type === "post") {
      window.location.href = createPageUrl(`Editor?post=${row.id}`);
    } else {
      window.location.href = createPageUrl(`Editor?webhook=${row.id}`);
    }
  };

  // handler for confirming and executing deletion
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "post") {
        await BlogPost.delete(itemToDelete.id);
      } else if (itemToDelete.type === "webhook") {
        await WebhookReceived.delete(itemToDelete.id);
      } else {
        throw new Error(`Unknown content type: ${itemToDelete.type}`);
      }

      setItems((prev) =>
        prev.filter((it) => !(it.id === itemToDelete.id && it.type === itemToDelete.type))
      );
      toast.success("Content item deleted.");
    } catch (error) {
      toast.error(`Failed to delete item: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      setItemToDelete(null);
    }
  };

  const allStatuses = [
    { key: "all", label: "All Status" },
    // Webhook statuses
    { key: "received", label: "received" },
    { key: "editing", label: "editing" },
    { key: "published", label: "published" },
    // Post statuses
    { key: "draft", label: "draft" },
    { key: "archived", label: "archived" }];


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Content Management</h1>
            <p className="text-slate-600 mt-1">Manage your blog posts and webhook content. Only your brands are shown.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPasteModal(true)}
              className="gap-2 bg-white border-slate-300 text-slate-900 hover:bg-slate-100"
              title="Paste content to create a draft">
              <ClipboardPaste className="w-4 h-4" />
              Paste Content
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search content..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500" />
          </div>

          {/* Status filter */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-white border border-slate-300 text-slate-900">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              {/* Stronger hover/highlight contrast */}
              <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
                {allStatuses.map((s) =>
                  <SelectItem
                    key={s.key}
                    value={s.key}
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    {s.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Username filter */}
          <div>
            <Select value={selectedUsername} onValueChange={setSelectedUsername}>
              <SelectTrigger className="w-full bg-white border border-slate-300 text-slate-900">
                <SelectValue placeholder="All Usernames" />
              </SelectTrigger>
              {/* Stronger hover/highlight contrast */}
              <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
                <SelectItem
                  value="all"
                  className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                  All Usernames
                </SelectItem>
                {allowedUsernames.map((u) =>
                  <SelectItem
                    key={u}
                    value={u}
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    {u}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">{loading ? "Loading…" : `${filtered.length} item${filtered.length === 1 ? "" : "s"}`}</div>
              <div className="text-xs text-slate-500">Only scoped to your brands</div>
            </div>
          </div>

          {loading ?
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div> :
            filtered.length === 0 ?
              <div className="py-16 text-center text-slate-500">
                No content found for your selection.
              </div> :

              <div className="divide-y divide-slate-200">
                {filtered.map((row) => {
                  const isWebhook = row.type === "webhook";
                  const dotClass = isWebhook ? "bg-cyan-500" : "bg-blue-600";
                  return (
                    <div
                      key={`${row.type}-${row.id}`}
                      className="px-4 py-3 hover:bg-slate-50 grid items-center gap-3 grid-cols-[16px_1fr_120px_auto_auto_20px]">
                      {/* Left dot */}
                      <div className={`h-3 w-3 rounded-full ${dotClass}`} />

                      {/* Title area */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {row.type === "post" ?
                              <FileText className="w-4 h-4 text-blue-600" /> :
                              <LinkIcon className="w-4 h-4 text-cyan-600" />
                            }
                          </span>
                          <span className="truncate text-slate-900 font-medium">{row.title}</span>
                          {row.user_name ?
                            <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                              {row.user_name}
                            </span> :
                            null}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(row.updated_at || Date.now()).toLocaleString()}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="justify-self-end">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {row.status}
                        </span>
                      </div>

                      {/* Open */}
                      <div className="justify-self-end">
                        <Button
                          variant="ghost" className="bg-indigo-800 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => onOpenItem(row)}
                          title="Open in Editor">
                          Open
                        </Button>
                      </div>

                      {/* Delete Button */}
                      <div className="justify-self-end">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setItemToDelete(row)} className="bg-violet-700 text-slate-50 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-9 h-9 hover:bg-red-100 border border-red-200"
                          title={`Delete "${row.title}"`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Chevron */}
                      <div className="justify-self-end text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>);

                })}
              </div>
          }
        </div>

        <div className="mt-6 text-sm text-slate-600">
          Need to add a new article? Go to{" "}
          <Link className="underline text-blue-600 hover:text-blue-700" to={createPageUrl("Editor")}>Editor</Link>.
        </div>
      </div>

      <PasteContentModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        allowedUsernames={allowedUsernames}
        defaultUsername={defaultPasteUsername}
        onSubmit={handlePasteSubmit} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the content item: <strong className="text-slate-900">{itemToDelete?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)} className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
