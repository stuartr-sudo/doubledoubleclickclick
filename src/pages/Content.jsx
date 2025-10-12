
import React, { useEffect, useMemo, useState } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, FileText, Link as LinkIcon, ChevronRight, ClipboardPaste, Trash2, Clock, Calendar as CalendarIcon, SortAsc } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function Content() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedUsernames, setAllowedUsernames] = useState([]);

  // OLD STATE renamed for local control
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]); // unified: posts + webhooks
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // state for delete confirmation
  const [sortByCountdown, setSortByCountdown] = useState(true); // Changed default to true
  const [autoReadPaste, setAutoReadPaste] = useState(false); // New state for auto-paste

  // NEW: Workspace context
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Derive the actual selectedUsername based on feature flag
  const selectedUsername = useWorkspaceScoping ? globalUsername : localSelectedUsername;

  const navigate = useNavigate(); // Initialize useNavigate

  // Generate a sensible default username for paste modal
  const defaultPasteUsername = useMemo(() => {
    if (selectedUsername && selectedUsername !== "all") return selectedUsername;
    return allowedUsernames && allowedUsernames.length > 0 ? allowedUsernames[0] : "";
  }, [selectedUsername, allowedUsernames]);

  // Modified handlePasteSubmit to use navigate and add error handling
  const handlePasteSubmit = async ({ title, content, user_name }) => {
    try {
      // Create draft record and open editor
      const newPost = await BlogPost.create({
        title: title?.trim() || "Pasted Content",
        content,
        status: "draft",
        user_name
      });
      // Navigate to editor for immediate editing
      if (newPost?.id) {
        const newUrl = createPageUrl(`Editor?post=${newPost.id}`);
        navigate(newUrl);
      } else {
        throw new Error("Failed to create post, no ID returned.");
      }
    } catch (error) {
      toast.error("Failed to create post from pasted content.");
      console.error("Error creating post from paste:", error);
    } finally {
      setShowPasteModal(false);
      setAutoReadPaste(false); // Reset autoReadPaste after submission attempt
    }
  };

  const handlePasteContent = () => {
    setAutoReadPaste(true);
    setShowPasteModal(true);
  };

  // Improved rate limit handling with batch fetching
  const loadScopedContentFast = async (usernames) => {
    if (!Array.isArray(usernames) || usernames.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

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

    try {
      // Fetch all posts and webhooks for the given usernames in parallel
      const [posts, hooks] = await Promise.all([
        BlogPost.filter({ user_name: usernames }, "-updated_date"),
        WebhookReceived.filter({ user_name: usernames }, "-updated_date"),
      ]);

      const normalizedContent = [
        ...(posts || []).map(normalizePost),
        ...(hooks || []).map(normalizeWebhook),
      ];
      
      const deduped = dedupeSmart(normalizedContent);
      deduped.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

      setItems(deduped);
    } catch (e) {
      console.error("Error fetching content:", e);
      toast.error("Failed to load content.");
      setItems([]);
    } finally {
      setLoading(false);
    }
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

        // If workspace scoping is not active, set the local default username
        if (!useWorkspaceScoping) {
          setLocalSelectedUsername(usernames.length === 1 ? usernames[0] : "all");
        }
        // If useWorkspaceScoping is true, `selectedUsername` is controlled by `globalUsername`
        // and should not be set here.

        // Load data with strict scoping using the new fast loader.
        // This will load all content relevant to the allowed usernames,
        // then the `filtered` useMemo will apply the actual `selectedUsername` filter.
        await loadScopedContentFast(usernames);
      } catch (e) {
        console.error("Failed to load initial data:", e);
        setAllowedUsernames([]);
        setItems([]);
        setLoading(false); // Ensure loading state is reset on error
      }
    })();
  }, [useWorkspaceScoping]); // Added useWorkspaceScoping to dependencies to react to its changes.

  // Add countdown calculation helper
  const calculateDaysFromPublish = (item) => {
    // Only calculate for published items
    if (item.status !== 'published') return null;

    const publishDate = new Date(item.updated_at || item.created_at);
    const now = new Date();
    const diffTime = now.getTime() - publishDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Update filtered items with sorting
  const filtered = useMemo(() => {
    let result = items.filter((it) => {
      const byUser = selectedUsername === "all" ? true : it.user_name === selectedUsername;
      const byStatus = statusFilter === "all" ? true : it.status === statusFilter;
      const byQuery = q.trim() ?
        (it.title || "").toLowerCase().includes(q.trim().toLowerCase()) :
        true;
      return byUser && byStatus && byQuery;
    });

    // Apply countdown sorting if enabled
    if (sortByCountdown) {
      result.sort((a, b) => {
        const daysA = calculateDaysFromPublish(a) ?? Infinity; // Use Infinity for non-published items
        const daysB = calculateDaysFromPublish(b) ?? Infinity;
        return daysA - daysB; // Ascending order (least days first, i.e. newest)
      });
    }

    return result;
  }, [items, q, statusFilter, selectedUsername, sortByCountdown]);

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
        
        {/* Combined filters and actions row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

          {/* Filters section (left-aligned) */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[200px]">
            <div className="relative flex-grow min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search content..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500" />
            </div>

            <div className="min-w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-white border border-slate-300 text-slate-900">
                  <Filter className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
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

            {!useWorkspaceScoping &&
              <div className="min-w-[180px]">
                <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}>
                  <SelectTrigger className="w-full bg-white border border-slate-300 text-slate-900">
                    <SelectValue placeholder="All Usernames" />
                  </SelectTrigger>
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
            }
          </div>

          {/* Actions section (right-aligned) */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortByCountdown ? "default" : "outline"}
              onClick={() => setSortByCountdown(!sortByCountdown)} className="bg-slate-50 text-cyan-600 px-4 py-2 text-sm font-medium border-2 border-cyan-600 inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 gap-2 hover:border-cyan-500 hover:text-cyan-500 hover:shadow-md"

              title="Sort by days since publish">
              <SortAsc className="w-4 h-4" />
              {sortByCountdown ? 'Days Sorted' : 'Sort by Days'}
            </Button>
            <Button
              variant="outline"
              onClick={handlePasteContent}
              className="gap-2 bg-white border-slate-300 text-slate-900 hover:bg-slate-100"
              title="Paste content to create a draft">
              <ClipboardPaste className="w-4 h-4" />
              Paste Content
            </Button>
          </div>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">{loading ? "Loading…" : `${filtered.length} item${filtered.length === 1 ? "" : "s"}`}</div>
              {/* Removed the 'Only scoped to your brands' text */}
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
                  const daysFromPublish = calculateDaysFromPublish(row);

                  return (
                    <div
                      key={`${row.type}-${row.id}`}
                      className="px-4 py-3 hover:bg-slate-50 grid items-center gap-3 grid-cols-[16px_1fr_120px_100px_auto_auto_20px]">
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

                      {/* 60-day Countdown */}
                      <div className="justify-self-end">
                        {daysFromPublish !== null ?
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                            daysFromPublish <= 20 ? 'bg-green-50 text-green-700 border border-green-200' :
                              daysFromPublish <= 40 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                daysFromPublish <= 50 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                  'bg-red-50 text-red-700 border border-red-200'}`
                          }>
                            <Clock className="w-3 h-3" />
                            <span>{daysFromPublish}d</span>
                          </div> :

                          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-400 bg-slate-50 border border-slate-200">
                            <Clock className="w-3 h-3" />
                            <span>--</span>
                          </div>
                        }
                      </div>

                      {/* Open */}
                      <div className="justify-self-end">
                        <Button
                          variant="ghost" className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:text-slate-900 hover:bg-blue-100"
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
                          onClick={() => setItemToDelete(row)} className="bg-pink-500 text-white px-4 py-2 text-sm font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.7)] shadow-[0_0_15px_rgba(236,72,153,0.4)] border border-pink-400"
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
        onClose={() => {
          setShowPasteModal(false);
          setAutoReadPaste(false); // Reset autoReadPaste on close
        }}
        allowedUsernames={allowedUsernames}
        defaultUsername={defaultPasteUsername}
        onSubmit={handlePasteSubmit}
        autoReadClipboard={autoReadPaste} // New prop for auto-reading clipboard
        initialRaw="" // New prop for initial raw content
      />

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
