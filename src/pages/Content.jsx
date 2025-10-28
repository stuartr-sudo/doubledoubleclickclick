
import React, { useEffect, useMemo, useState, useRef } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, FileText, Link as LinkIcon, ClipboardPaste, Trash2, Clock, Calendar as CalendarIcon, SortAsc, Zap, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PasteContentModal from "@/components/content/PasteContentModal";
import PublishToCMSModal from "@/components/editor/PublishToCMSModal"; // New Import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from

"@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import FlashToggle from "../components/content/FlashToggle";

export default function Content() {// Renamed from ContentPage as per original file
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedUsernames, setAllowedUsernames] = useState([]);

  // OLD STATE renamed for local control
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");
  const [flashStatusFilter, setFlashStatusFilter] = useState("all"); // State for flash status filter
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]); // unified: posts + webhooks
  // itemsRef is no longer needed as the new polling useEffect will capture the latest `items` state via its `runningItemKeys` dependency.
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // state for delete confirmation
  const [sortByCountdown, setSortByCountdown] = useState(true); // Changed default to true
  const [autoReadPaste, setAutoReadPaste] = useState(false); // New state for auto-paste

  // NEW: Track polling backoff to respect rate limits
  // NEW: Increase base polling interval to 5 seconds (was 3)
  const [pollInterval, setPollInterval] = useState(5000); // Initial poll interval
  const pollBackoffRef = useRef(1); // Multiplier for backoff

  // NEW: Workspace context
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Derive the actual selectedUsername based on feature flag
  const selectedUsername = useWorkspaceScoping ? globalUsername : localSelectedUsername;

  const navigate = useNavigate(); // Initialize useNavigate

  // New state for publish modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingPost, setPublishingPost] = useState(null);

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

  // CRITICAL: Handler to immediately update item status in UI
  const handleFlashStatusChange = (itemId, updates) => {
    console.log("⚡ UI UPDATE: Immediately updating item", itemId, "with", updates);
    setItems((prev) => prev.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  // IMPROVED: Load content with retry on rate limit
  const loadScopedContentFast = async (usernames, attempt = 0) => {
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

    const normalizePost = (p) => {
      // Debug log to see if content is present
      if (!p.content) {
        console.warn("BlogPost missing content field:", p.id, p.title);
      }

      return {
        id: p.id,
        title: p.title || "(Untitled)",
        content: p.content || "", // Must include full HTML content
        status: p.status || "draft",
        type: "post",
        user_name: p.user_name || "",
        updated_at: p.updated_date || p.created_date,
        created_at: p.created_date,
        processing_id: p.processing_id || null,
        flash_status: p.flash_status || null,
        flashed_at: p.flashed_at || null
      };
    };

    const normalizeWebhook = (w) => {
      // Debug log to see if content is present
      if (!w.content) {
        console.warn("WebhookReceived missing content field:", w.id, w.title);
      }

      return {
        id: w.id,
        title: w.title || "(Untitled)",
        content: w.content || "", // Must include full HTML content
        status: w.status || "received",
        type: "webhook",
        user_name: w.user_name || "",
        updated_at: w.updated_date || w.created_date,
        created_at: w.created_date,
        processing_id: w.processing_id || w.id,
        flash_status: w.flash_status || null,
        flashed_at: w.flashed_at || null
      };
    };

    try {
      // IMPORTANT: Make sure we're fetching ALL fields including content
      // NEW: Stagger the two requests to avoid burst rate limits
      const posts = await BlogPost.filter({ user_name: usernames }, "-updated_date");

      // Wait 200ms before second request
      await new Promise((res) => setTimeout(res, 200));

      const hooks = await WebhookReceived.filter({ user_name: usernames }, "-updated_date");

      console.log("Loaded posts:", posts?.length, "webhooks:", hooks?.length);

      const normalizedContent = [
      ...(posts || []).map(normalizePost),
      ...(hooks || []).map(normalizeWebhook)];



      const deduped = dedupeSmart(normalizedContent);
      deduped.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

      console.log("Final items with content:", deduped.map((d) => ({
        id: d.id,
        title: d.title,
        hasContent: !!d.content,
        contentLength: d.content?.length || 0
      })));

      setItems(deduped);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching content:", e);

      // NEW: Retry on rate limit with exponential backoff
      if (e?.response?.status === 429 && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited loading content, retrying in ${delay}ms (attempt ${attempt + 1}/3)`);
        setTimeout(() => loadScopedContentFast(usernames, attempt + 1), delay);
        return; // Don't set loading false yet
      }

      toast.error("Failed to load content.");
      setItems([]);
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

  // Track which items are currently running flash workflows
  const runningItemKeys = useMemo(() => {
    const runningItems = items.filter((it) => it.flash_status === "running");
    return runningItems.map((it) => `${it.type}-${it.id}`).sort().join(',');
  }, [items]);

  // IMPROVED: Polling with much more aggressive backoff
  useEffect(() => {
    if (!runningItemKeys) {
      setPollInterval(5000); // Reset interval when no running items, to 5s base
      pollBackoffRef.current = 1;
      return;
    }

    console.log("📊 POLLING: Starting poll for running items:", runningItemKeys, "at interval:", pollInterval);

    const interval = setInterval(async () => {
      const currentRunningItems = items.filter((it) => it.flash_status === "running");

      if (currentRunningItems.length === 0) {
        console.log("📊 POLLING: No more running items, stopping this interval execution");
        setPollInterval(5000); // Reset interval to 5s base
        pollBackoffRef.current = 1;
        return; // Stop this specific interval iteration if no items are running.
      }

      console.log("📊 POLLING: Checking status for", currentRunningItems.length, "items");

      try {
        // Batch check with delay between requests to avoid rate limits
        const updates = [];
        let hitRateLimit = false;

        for (let i = 0; i < currentRunningItems.length; i++) {
          const item = currentRunningItems[i];

          // NEW: Longer stagger between requests (300ms instead of 100ms)
          if (i > 0) {
            await new Promise((res) => setTimeout(res, 300));
          }

          try {
            let updatedItem = null;
            if (item.type === "post") {
              const result = await BlogPost.filter({ id: item.id }, "-updated_date", 1);
              updatedItem = result && result[0];
            } else if (item.type === "webhook") {
              const result = await WebhookReceived.filter({ id: item.id }, "-updated_date", 1);
              updatedItem = result && result[0];
            }

            console.log("📊 POLLING: Item", item.id, "status:", item.flash_status, "→", updatedItem?.flash_status);

            // Return full normalized item if status changed
            if (updatedItem && updatedItem.flash_status !== item.flash_status) {
              if (item.type === "post") {
                updates.push({
                  id: updatedItem.id,
                  title: updatedItem.title || "(Untitled)",
                  content: updatedItem.content || "",
                  status: updatedItem.status || "draft",
                  type: "post",
                  user_name: updatedItem.user_name || "",
                  updated_at: updatedItem.updated_date || updatedItem.created_date,
                  created_at: updatedItem.created_date,
                  processing_id: updatedItem.processing_id || null,
                  flash_status: updatedItem.flash_status || null,
                  flashed_at: updatedItem.flashed_at || null
                });
              } else {// It must be a webhook
                updates.push({
                  id: updatedItem.id,
                  title: updatedItem.title || "(Untitled)",
                  content: updatedItem.content || "",
                  status: updatedItem.status || "received",
                  type: "webhook",
                  user_name: updatedItem.user_name || "",
                  updated_at: updatedItem.updated_date || updatedItem.created_date,
                  created_at: updatedItem.created_date,
                  processing_id: updatedItem.processing_id || updatedItem.id,
                  flash_status: updatedItem.flash_status || null,
                  flashed_at: updatedItem.flashed_at || null
                });
              }
            }
          } catch (err) {
            // Handle rate limit errors gracefully
            if (err?.response?.status === 429) {
              console.warn(`📊 POLLING: Rate limited on ${item.type} ${item.id}, backing off aggressively`);
              // Increase backoff multiplier
              pollBackoffRef.current = Math.min(pollBackoffRef.current * 2, 8); // More aggressive backoff
              setPollInterval((prev) => Math.min(prev * pollBackoffRef.current, 30000)); // Max 30 seconds
              hitRateLimit = true;
              break; // Stop polling this batch
            } else {
              console.error(`📊 POLLING: Failed to fetch update for ${item.type} ${item.id}:`, err);
            }
          }
        }

        // Update items state with new flash statuses
        if (updates.length > 0 && !hitRateLimit) {
          // Reset backoff on successful updates (if no rate limit was hit)
          pollBackoffRef.current = 1;
          setPollInterval(5000); // Reset to base interval

          setItems((prev) => prev.map((item) => {
            const update = updates.find((u) => u && u.id === item.id && u.type === item.type);
            if (update) {
              console.log("📊 POLLING: Updating item", item.id, "with new status:", update.flash_status);

              // Show toast when flash completes
              if (update.flash_status === "completed" && item.flash_status === "running") {
                toast.success(`Flash completed for "${item.title}"`);
              } else if (update.flash_status === "failed" && item.flash_status === "running") {
                toast.error(`Flash failed for "${item.title}"`);
              }
              return update;
            }
            return item;
          }));
        } else if (!hitRateLimit) {
          // If no updates and no rate limit, reset backoff to base interval
          pollBackoffRef.current = 1;
          setPollInterval(5000);
        }
      } catch (error) {
        console.error("📊 POLLING: Failed to poll flash status:", error);
        // Back off on general errors as well if it's a rate limit error
        if (error?.response?.status === 429) {
          pollBackoffRef.current = Math.min(pollBackoffRef.current * 2, 8);
          setPollInterval((prev) => Math.min(prev * pollBackoffRef.current, 30000));
        }
      }
    }, pollInterval); // Use dynamic interval

    return () => {
      console.log("📊 POLLING: Cleanup interval");
      clearInterval(interval);
    };

  }, [runningItemKeys, items, pollInterval]); // Added pollInterval to dependencies

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
    console.log("🔍 FILTERING:", {
      selectedUsername,
      totalItems: items.length,
      itemUserNames: items.map(it => it.user_name)
    });
    
    let result = items.filter((it) => {
      const byUser = selectedUsername === "all" ? true : it.user_name === selectedUsername;
      const byStatus = statusFilter === "all" ? true : it.status === statusFilter;
      const byQuery = q.trim() ?
      (it.title || "").toLowerCase().includes(q.trim().toLowerCase()) :
      true;

      // Flash status filter
      if (flashStatusFilter !== "all") {
        const itemFlashStatus = it.flash_status || "idle";
        if (flashStatusFilter !== itemFlashStatus) {
          return false;
        }
      }

      const passes = byUser && byStatus && byQuery;
      if (!passes && selectedUsername !== "all") {
        console.log("❌ Item filtered out:", it.title, "user_name:", it.user_name, "byUser:", byUser);
      }
      return passes;
    });
    
    console.log("✅ Filtered result:", result.length, "items");

    // Apply countdown sorting if enabled
    if (sortByCountdown) {
      result.sort((a, b) => {
        const daysA = calculateDaysFromPublish(a) ?? Infinity; // Use Infinity for non-published items
        const daysB = calculateDaysFromPublish(b) ?? Infinity;
        return daysA - daysB; // Ascending order (least days first, i.e. newest)
      });
    }

    return result;
  }, [items, q, statusFilter, selectedUsername, sortByCountdown, flashStatusFilter]);

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

  const handlePublishClick = async (post) => {
    // Load full post data including HTML content
    try {
      let fullPostData = null;
      if (post.type === "webhook") {
        const result = await WebhookReceived.filter({ id: post.id });
        fullPostData = result && result[0];
      } else if (post.type === "post") {
        const result = await BlogPost.filter({ id: post.id });
        fullPostData = result && result[0];
      }

      if (fullPostData) {
        setPublishingPost({
          ...post, // Keep existing properties from the list item
          content: fullPostData.content || post.content || "" // Prioritize fresh content, fallback to list item, then empty string
        });
        setPublishModalOpen(true);
      } else {
        toast.error("Failed to load post content for publishing.");
      }
    } catch (error) {
      console.error("Error loading post for publish:", error);
      toast.error("Failed to load post content for publishing.");
    }
  };

  const handlePublishModalClose = () => {
    setPublishModalOpen(false);
    setPublishingPost(null);
  };

  return (
    // Updated styling for main div from outline
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

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

            {/* Flash status filter */}
            <div className="min-w-[180px]">
              <Select value={flashStatusFilter} onValueChange={setFlashStatusFilter}>
                <SelectTrigger className="w-full bg-white border border-slate-300 text-slate-900">
                  <Zap className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="All Flash" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
                  <SelectItem
                    value="all"
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    All Flash
                  </SelectItem>
                  <SelectItem
                    value="idle"
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    Not Flashed
                  </SelectItem>
                  <SelectItem
                    value="running"
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    Running
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    Completed
                  </SelectItem>
                  <SelectItem
                    value="failed"
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100">
                    Failed
                  </SelectItem>
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

        {/* Updated styling for inner container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">{loading ? "Loading…" : `${filtered.length} item${filtered.length === 1 ? "" : "s"}`}</div>
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

          <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-8">
                      {/* Reduced checkbox column width from w-12 to w-8 and px-6 to px-3 */}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    {!useWorkspaceScoping &&
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Username
                      </th>
                  }
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-52">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filtered.map((post) => {
                  const isWebhook = post.type === "webhook";
                  const daysFromPublish = calculateDaysFromPublish(post);
                  const flashStatus = post.flash_status || "idle";

                  const getFlashStatusBadge = (status, enabled) => {
                    if (status === "running") {
                      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0 animate-pulse">Running</Badge>;
                    }
                    if (status === "completed") {
                      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex-shrink-0">Completed</Badge>;
                    }
                    if (status === "failed") {
                      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex-shrink-0">Failed</Badge>;
                    }
                    if (enabled) {
                      return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 flex-shrink-0">Enabled</Badge>;
                    }
                    return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex-shrink-0">Disabled</Badge>;
                  };

                  return (
                    <tr key={`${post.type}-${post.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap">
                          {/* Reduced padding from px-6 py-4 to px-3 py-3 */}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Icon for type */}
                            <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                              {post.type === "post" ?
                            <FileText className="w-3 h-3 text-blue-600" /> :

                            <LinkIcon className="w-3 h-3 text-cyan-600" />
                            }
                            </span>
                            {/* Title with flash status indicator */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {post.title}
                                </div>
                                {getFlashStatusBadge(flashStatus, post.flash_enabled)}
                              </div>
                            </div>
                          </div>
                        </td>
                        {!useWorkspaceScoping &&
                      <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-slate-600 truncate block">{post.user_name || '-'}</span>
                          </td>
                      }
                        <td className="px-4 py-3 whitespace-nowrap">
                          {/* Status badge */}
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 capitalize text-xs">
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                          {new Date(post.updated_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {/* Priority / Countdown */}
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
                              <CalendarIcon className="w-3 h-3" />
                              <span>--</span>
                            </div>
                        }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenItem(post);
                            }}
                            className="bg-gradient-to-r from-slate-800 to-indigo-900 hover:from-slate-700 hover:to-indigo-800 text-white px-2.5 text-xs font-medium rounded-md inline-flex items-center justify-center gap-1 whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8">
                              Open
                            </Button>

                            <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(post);
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-md h-8 w-8 inline-flex items-center justify-center transition-all"
                            title={`Delete "${post.title}"`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Flash Toggle */}
                            <FlashToggle
                            item={post}
                            onStatusChange={handleFlashStatusChange} />


                            {/* Publish Button */}
                            <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishClick(post);
                            }} className="gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white h-8 w-8 p-0 inline-flex items-center justify-center"

                            title="Publish to CMS">
                              <Globe className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>);

                })}
                </tbody>
              </table>
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
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NEW: Publish Modal */}
      {publishingPost &&
      <PublishToCMSModal
        isOpen={publishModalOpen}
        onClose={handlePublishModalClose}
        title={publishingPost.title}
        html={publishingPost.content} />

      }
    </div>);

}