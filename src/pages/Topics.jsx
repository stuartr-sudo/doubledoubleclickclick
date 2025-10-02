
import React, { useEffect, useState, useCallback, useRef } from "react";
import { airtableSync } from "@/api/functions";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Users, ShieldAlert, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, Filter, Trash2, Tag, HelpCircle, Info, Key } from "lucide-react";
import MiniMultiSelect from "@/components/common/MiniMultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupedFaqTable from "@/components/topics/GroupedFaqTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { airtableCreateRecord } from "@/api/functions";
import { airtableListFields } from "@/api/functions";
import { airtableDeleteRecord } from "@/api/functions";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { toast } from "sonner";
import { BlogPost } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TopicsOnboardingModal from "@/components/onboarding/TopicsOnboardingModal";
import { Username } from "@/api/entities";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

// --- Configuration ---
const TABLE_IDS = {
  keywordMap: "tblDR9SmoK8wEYmnA",
  faq: "tblSDBPmucJA0Skvp",
  targetMarket: "tblhayydQ0Zq2NBR9",
  blogCategories: "tblyNaoalXlmc1pQO",
  companyProducts: "Company Products", // Use table name instead of ID
  companyInformation: "Company Information" // This should be a real table ID or name
};

const GET_QUESTIONS_RATE_LIMIT = {
  limit: 3,
  windowMs: 30 * 60 * 1000 // 30 minutes
};

const KEYWORD_MAP_HEADERS = [
  "Keyword",
  "Get Questions", // This is the UI label for 'Select Keyword'
  "Search Volume",
  "Target Market",
  "Promoted Product"
];


// Reduce the column width for 'Get Questions' from 120px to 80px
const KEYWORD_MAP_LAYOUT = "2fr 80px 100px 1.2fr 1.2fr";

// Fields we require before sending to Airtable (moved outside component for stability)
const REQUIRED_FIELDS = ["Target Market", "Promoted Product"];

// --- Helper Functions ---
function getLabel(fields, tableContext = null) {
  if (!fields) return "(untitled)";

  // Prefer clean, human product titles for Company Products
  if (tableContext === "companyProducts") {
    // 1) Strong priority for page/product name fields
    const NAME_KEYS = [
      "Page Name",
      "PageName",
      "Product Name",
      "ProductName",
      "Name",
      "Title",
      "H1",
      "SEO Title",
      "Seo Title"
    ];


    const stripHtml = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const safeTruncate = (s, n = 80) => s.length > n ? s.slice(0, n) + "..." : s;

    for (const key of NAME_KEYS) {
      if (typeof fields[key] === "string" && fields[key]) {
        const clean = stripHtml(fields[key]);
        if (clean) return safeTruncate(clean, 80);
      }
    }

    // 2) If a name field isn't present, attempt to derive a readable name from Page Content
    const contentCandidates = ["Page Content", "Content", "Body", "Description"];
    for (const key of contentCandidates) {
      const raw = fields[key];
      if (!raw) continue;
      let text = String(raw);

      // Try JSON payloads that may contain name/title
      if (/^\s*\{/.test(text)) {
        try {
          const obj = JSON.parse(text);
          const guess =
            obj?.page_name || obj?.pageName || obj?.name || obj?.title || obj?.product_name || obj?.productName;
          if (typeof guess === "string" && guess.trim()) {
            const clean = stripHtml(guess);
            if (clean) return safeTruncate(clean, 80);
          }
        } catch {
          // ignore JSON parse errors and continue
        }
      } // Strip HTML if present and use a truncated readable text
      const clean = stripHtml(text);
      if (clean) return safeTruncate(clean, 80);
    }

    // 3) Last resort: show record id
    return fields.id || "(untitled)";
  }

  // Default labels for other tables
  const PREFERRED_LABELS = ["Target Market Name", "Blog Name", "Page Name", "Name", "Title", "Keyword"];
  for (const key of PREFERRED_LABELS) {
    if (typeof fields[key] === "string" && fields[key]) return fields[key];
  }
  return fields.id || "(untitled)";
}

// NEW: reliably find the actual linked-products field on a row (Promoted Product vs Link to Company Products)
function getLinkedProductFieldName(fieldsObj) {
  const keys = Object.keys(fieldsObj || {});
  const lowerMap = new Map(keys.map((k) => [k.toLowerCase(), k]));
  return (
    lowerMap.get("link to company products") ||
    lowerMap.get("promoted product") ||
    lowerMap.get("promoted products") ||
    "Promoted Product" // Fallback to common display name if no exact match found
  );
}

const renderFieldValue = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    // Changed for light theme compatibility
    return <span className="text-slate-500">-</span>;
  }
  return String(value);
};

// --- Main Component ---
export default function TopicsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [localSelectedUsername, setLocalSelectedUsername] = useState(null); // Renamed from selectedUsername

  const [keywordRows, setKeywordRows] = useState([]);
  const [faqRows, setFaqRows] = useState([]);
  const [options, setOptions] = useState({ tm: [], bc: [], pp: [] });

  const [loadingData, setLoadingData] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true); // FIX: malformed useState call
  const [error, setError] = useState(null);

  // Persist and restore active tab so it never jumps back on re-render
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('topics_active_tab') || 'keyword_map';
  });

  // NEW: toolbar states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showCompleteOnly, setShowCompleteOnly] = useState(false);
  const [showManualOnly, setShowManualOnly] = useState(false); // NEW: Manual filter state

  // NEW: Dedicated state for filtering FAQs by a keyword from the Keyword Map
  const [faqKeywordFilter, setFaqKeywordFilter] = useState(null);

  // NEW: URL-driven focus for RecommendedQuestions -> Topics handoff
  const [pendingUsername, setPendingUsername] = useState(null);
  const [focusQuestion, setFocusQuestion] = useState(null);
  const faqTabRef = useRef(null);

  // NEW: Add Keyword/FAQ states (kept for existing modal logic, though UI button now uses inline add)
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaqKeyword, setNewFaqKeyword] = useState("");
  const [creating, setCreating] = useState(false);

  // NEW: Inline add form state
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineKeywordText, setInlineKeywordText] = useState("");
  const [inlineTarget, setInlineTarget] = useState("keyword_map"); // "keyword_map" | "faq"

  // NEW: brand field/value derived from existing rows for this username
  const [brandFieldKey, setBrandFieldKey] = useState(null);
  const [brandArray, setBrandArray] = useState([]);

  // NEW: Cache auxiliary data to avoid repeated fetches
  const [auxDataCache, setAuxDataCache] = useState({ tm: [], bc: [], pp: [], cacheTime: 0 });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // NEW: ref mirror of the cache to avoid re-creating callbacks and causing loops
  const auxDataCacheRef = useRef(auxDataCache);
  useEffect(() => {
    auxDataCacheRef.current = auxDataCache;
  }, [auxDataCache]);

  const { selectedUsername: globalUsername, assignedUsernames: globalUsernames, isLoading: isWorkspaceLoading } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username based on workspace scoping
  const selectedUsername = useWorkspaceScoping ? globalUsername : localSelectedUsername;

  // Ref to suppress initial data load when workspace scoping is active
  const isInitialDataLoadSuppressed = useRef(true);

  // NEW: State for tracking loading questions per row
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const [countdown, setCountdown] = useState({});

  // NEW: Ref to store interval IDs for cleanup, preventing leaks if toggled multiple times
  const intervalRefs = useRef({});

  // NEW: Map of keyword(lowercased) -> blogPostId to detect written content
  const [writtenByKeyword, setWrittenByKeyword] = useState({});

  // Add an in-flight guard to prevent concurrent loads
  const isFetchingRef = useRef(false);

  // NEW: onboarding gate states and ref
  const [checkingTopicsGate, setCheckingTopicsGate] = React.useState(true);
  const [topicsGateSatisfied, setTopicsGateSatisfied] = React.useState(true); // Assume satisfied until checked
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Keep a ref so loaders can bail if gate is false
  const topicsGateRef = React.useRef(true);
  React.useEffect(() => { topicsGateRef.current = topicsGateSatisfied; }, [topicsGateSatisfied]);

  // Helper: pick the first existing field from candidates (case-insensitive)
  const pickField = useCallback((fieldsArr, candidates) => {
    const lowerMap = new Map((fieldsArr || []).map((f) => [String(f).toLowerCase(), f]));
    for (const c of candidates) {
      const hit = lowerMap.get(String(c).toLowerCase());
      if (hit) return hit;
    }
    return null;
  }, []);

  // NEW: persist manual-added Keyword Map record IDs across reloads
  const MANUAL_KW_SET_KEY = "manual_keyword_ids";
  const getManualKwSet = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(MANUAL_KW_SET_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }, []);
  const saveManualKwSet = React.useCallback((setObj) => {
    try {
      localStorage.setItem(MANUAL_KW_SET_KEY, JSON.stringify(Array.from(setObj)));
    } catch {
      // ignore
    }
  }, []); // Read URL params once on mount

  const [deleteTarget, setDeleteTarget] = useState(null); // {tableId, recordId}
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const uname = urlParams.get('username');
    const focus = urlParams.get('focus');
    const faqKeyword = urlParams.get('faq_keyword'); // NEW: read dedicated filter from URL

    if (tab === 'faq') {
      setActiveTab('faq');
    }
    if (uname) {
      setPendingUsername(uname);
    }
    if (focus) {
      setFocusQuestion(focus);
      setSearchQuery(focus); // filter list to find it quickly
    }
    if (faqKeyword) { // NEW: set dedicated filter from URL
      setFaqKeywordFilter(faqKeyword);
    }
  }, []);

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (useWorkspaceScoping) {
          // With workspace, available usernames come from the provider
          setAvailableUsernames(globalUsernames || []);
        } else {
          // Original logic for non-workspace mode
          if (user.role === "admin") {
            const allUsers = await User.list();
            const usernames = new Set();
            allUsers.forEach((u) => {
              if (Array.isArray(u.assigned_usernames)) {
                u.assigned_usernames.forEach((name) => usernames.add(name));
              }
              if (u.username) {
                usernames.add(u.username);
              }
            });
            setAvailableUsernames(Array.from(usernames).sort());
          } else {
            setAvailableUsernames(user.assigned_usernames || []);
          }
        }
      } catch (e) {
        setError("Failed to load user data. Please refresh.");
        console.error(e);
      } finally {
        setLoadingInitial(false);
      }
    };
    getInitialData();
  }, [useWorkspaceScoping, globalUsernames]);

  // Gate check BEFORE loading any Airtable data
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const me = await User.me().catch(() => null);
        const uname = selectedUsername || null;

        if (!me || !uname) {
          // If no user or no username selected, gate is implicitly satisfied (or not applicable)
          // or we're waiting for selection. Allow UI to proceed to username selection.
          if (isMounted) {
            setTopicsGateSatisfied(true);
            setShowOnboarding(false);
            setCheckingTopicsGate(false);
          }
          return;
        }

        const doneForThis = Array.isArray(me.topics) && me.topics.includes(uname);

        if (isMounted) {
          setTopicsGateSatisfied(doneForThis);
          setShowOnboarding(!doneForThis);
          setCheckingTopicsGate(false);
        }
      } catch (e) {
        console.error("Error checking topics gate:", e);
        if (isMounted) {
          // On error, assume satisfied to not block the user indefinitely, but log it.
          setTopicsGateSatisfied(true);
          setShowOnboarding(false);
          setCheckingTopicsGate(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [selectedUsername]);

  // Persist activeTab to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('topics_active_tab', activeTab);
  }, [activeTab]);

  // Preserve scroll position across rerenders/reloads to avoid "jump to top" feel
  useEffect(() => {
    const onScroll = () => sessionStorage.setItem('topics_scroll', String(window.scrollY || 0));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Restore scroll after data loads or tab/user changes
  useEffect(() => {
    const saved = sessionStorage.getItem('topics_scroll');
    if (saved) {
      const y = parseInt(saved, 10);
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    }
  }, [activeTab, selectedUsername, loadingData]);

  const loadDataForUser = useCallback(async (username) => {
    // SHORT-CIRCUIT all heavy loading if gate not satisfied
    if (!topicsGateRef.current) {
      setLoadingData(false);
      isFetchingRef.current = false;
      console.log("TopicsPage: loadDataForUser blocked by topics gate.");
      return;
    }

    if (!username) return;

    // Prevent double-loading if a fetch is already in progress
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoadingData(true);
    setError(null);

    try {
      const listWithFilter = async (tableIdOrName, formula) => {
        const params = { action: "listAll", tableId: tableIdOrName };
        if (formula) params.filterByFormula = formula;
        const response = await airtableSync(params);
        if (!response.data.success) throw new Error(response.data.error || `Failed to load table ${tableIdOrName}`);
        return response.data.records || [];
      };

      const sanitizedUsername = username.replace(/'/g, "\\'");
      // Ensure manually added keywords always load, even if Search Volume <= 100
      const manualIds = Array.from(getManualKwSet ? getManualKwSet() : new Set());
      const mainFormula = `{Username} = '${sanitizedUsername}'`;
      const keywordFormula = manualIds.length ?
        `AND({Username} = '${sanitizedUsername}', OR({Search Volume} > 100, ${manualIds.map((id) => `RECORD_ID()='${id}'`).join(", ")}))` :
        `AND({Search Volume} > 100, {Username} = '${sanitizedUsername}')`;
      const productFormula = `{Client Username} = '${sanitizedUsername}'`; // Specific formula for Company Products

      // Start main data fetch immediately (EXACT filters; only one call per table)
      const mainDataPromise = Promise.all([
        listWithFilter(TABLE_IDS.keywordMap, keywordFormula),
        listWithFilter(TABLE_IDS.faq, mainFormula)
      ]);

      // Decide whether to refresh cache using the ref (prevents callback recreation loop)
      const now = Date.now();
      const cacheSnapshot = auxDataCacheRef.current || { tm: [], bc: [], pp: [], cacheTime: 0 }; // Use ref here
      const shouldRefreshCache =
        now - (cacheSnapshot.cacheTime || 0) > CACHE_DURATION ||
        (cacheSnapshot.tm?.length || 0) === 0 ||
        (cacheSnapshot.bc?.length || 0) === 0 ||
        (cacheSnapshot.pp?.length || 0) === 0;

      let auxDataPromise;
      if (shouldRefreshCache) {
        // Fetch auxiliary data with optimized concurrent requests AND server-side filtering
        auxDataPromise = Promise.allSettled([
          listWithFilter(TABLE_IDS.targetMarket, mainFormula),
          listWithFilter(TABLE_IDS.blogCategories, mainFormula),
          listWithFilter(TABLE_IDS.companyProducts, productFormula)
        ]).then(async (results) => {
          let tmArr = results[0].status === "fulfilled" ? results[0].value || [] : [];
          let bcArr = results[1].status === "fulfilled" ? results[1].value || [] : [];
          let ppArr = results[2].status === "fulfilled" ? results[2].value || [] : [];

          // Fallback attempt for products table if primary formula fails (e.g., field variation)
          if (ppArr.length === 0 && results[2].status === "rejected") {
            try {
              ppArr = await listWithFilter(TABLE_IDS.companyProducts, mainFormula); // Try with 'Username' field
            } catch {
              // keep empty
            }
          } // Last resort: fetch by table name and filter client-side
          if (ppArr.length === 0) {
            try {
              const allProducts = await listWithFilter(TABLE_IDS.companyProducts, null); // Use the table name from config
              const keyCandidates = ["client_username", "client username", "username", "user_name", "user"];
              ppArr = (allProducts || []).filter((r) => {
                const f = r?.fields || {};
                const lower = Object.fromEntries(Object.entries(f).map(([k, v]) => [String(k).toLowerCase(), v]));
                let val = null;
                for (const k of keyCandidates) {
                  if (lower.hasOwnProperty(k)) { val = lower[k]; break; }
                }
                if (Array.isArray(val)) return val.includes(username);
                return String(val || "") === username;
              });
            } catch {
              // keep empty
            }
          }
          return { tmArr, bcArr, ppArr, cacheTime: now };
        });
      } else {
        // Use cached data
        auxDataPromise = Promise.resolve({
          tmArr: cacheSnapshot.tm || [],
          bcArr: cacheSnapshot.bc || [],
          ppArr: cacheSnapshot.pp || [],
          cacheTime: cacheSnapshot.cacheTime || now
        });
      }

      // Wait for both main data and auxiliary data
      const [mainData, auxData] = await Promise.all([mainDataPromise, auxDataPromise]);
      const [keywords, faqs] = mainData;
      const { tmArr, bcArr, ppArr, cacheTime } = auxData;

      // Update cache in both ref and state only when refreshed (prevents re-renders → loops)
      if (shouldRefreshCache) {
        const nextCache = { tm: tmArr, bc: bcArr, pp: ppArr, cacheTime };
        auxDataCacheRef.current = nextCache; // Update ref first
        setAuxDataCache(nextCache);
      }

      // Preserve manual 'm' markers using persisted set and tag results before setting state
      const manualSet = getManualKwSet();
      const processedKeywords = (keywords || []).map((r) =>
        manualSet.has(r.id) ? { ...r, __manualAdded: true } : r
      );

      // Set processed data
      setKeywordRows(processedKeywords);
      setFaqRows(faqs);
      setOptions({
        tm: tmArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "targetMarket") })),
        bc: bcArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "blogCategories") })),
        pp: ppArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "companyProducts") }))
      });

      // Derive brand info (optimized)
      const deriveBrand = (rows) => {
        const candidates = ["Brand ID", "Brand Name", "Brand"];
        for (const row of rows || []) {
          const f = row?.fields || {};
          const lowerToActual = new Map(Object.keys(f).map((k) => [k.toLowerCase(), k]));
          for (const c of candidates) {
            const actual = lowerToActual.get(c.toLowerCase());
            if (actual) {
              const val = f[actual];
              if (Array.isArray(val) && val.length > 0) return { key: actual, arr: val };
              if (typeof val === "string" && val.trim()) return { key: actual, arr: [val.trim()] };
              if (typeof val === "number") return { key: actual, arr: [String(val)] };
            }
          }
        }
        return null;
      };

      const brandFromKeywords = deriveBrand(keywords);
      const brandFromFaqs = deriveBrand(faqs);
      const brandPick = brandFromKeywords || brandFromFaqs;

      if (brandPick) {
        setBrandFieldKey(brandPick.key);
        setBrandArray(brandPick.arr);
      } else {
        setBrandFieldKey(null);
        setBrandArray([]);
      }
    } catch (e) {
      console.error(`Failed to load data for ${username}:`, e);
      setError(e.message || "An unknown error occurred.");
      setBrandFieldKey(null);
      setBrandArray([]);
    } finally {
      setLoadingData(false);
      isFetchingRef.current = false; // Release the guard
    }
    // IMPORTANT: only depend on getManualKwSet (stable callback), not on auxDataCache state
  }, [getManualKwSet, CACHE_DURATION, topicsGateRef]); // CACHE_DURATION is a constant, so it's stable

  // When selectedUsername (from any source) changes, load data
  useEffect(() => {
    if (selectedUsername && topicsGateSatisfied) { // Only load if gate is satisfied
      if (useWorkspaceScoping && isInitialDataLoadSuppressed.current) {
        // If workspace scoping is enabled and this is the initial data load trigger,
        // suppress the actual data fetch. The user will need to click refresh.
        console.log("TopicsPage: Suppressing initial data load for workspace user.");
        setLoadingData(false); // Stop spinner
        setKeywordRows([]); // Clear any pending data
        setFaqRows([]);
      } else {
        // For subsequent username changes, or if not workspace scoped, or if initial load was already done,
        // proceed with loading data.
        loadDataForUser(selectedUsername);
      }
    } else if (!selectedUsername) {
      // Clear data if no username is selected (e.g., initial state or user de-selected)
      setKeywordRows([]);
      setFaqRows([]);
      setLoadingData(false);
    }
    // After the first check (which might suppress or load), set the ref to false.
    // This ensures subsequent changes to selectedUsername (e.g., manual selection or global change)
    // will trigger loadDataForUser.
    isInitialDataLoadSuppressed.current = false;
  }, [selectedUsername, loadDataForUser, useWorkspaceScoping, topicsGateSatisfied]); // Added topicsGateSatisfied

  // Memoize to prevent changing reference in effects
  const handleUsernameSelect = React.useCallback((username) => {
    setLocalSelectedUsername(username); // Set local state for non-workspace mode
  }, []);

  // NEW: Load written status for current username (maps BlogPosts by focus_keyword)
  const updateWrittenStatus = React.useCallback(async (username) => {
    if (!username) {
      setWrittenByKeyword({});
      return;
    }
    // fetch recent posts for this username; build map by focus_keyword
    const posts = await BlogPost.filter({ user_name: username }, "-created_date", 500);
    const map = {};
    (posts || []).forEach((p) => {
      const key = (p.focus_keyword || "").toString().trim().toLowerCase();
      if (key && !map[key]) {
        map[key] = p.id;
      }
    });
    setWrittenByKeyword(map);
  }, []);

  // Refresh written status whenever username changes and on an interval
  React.useEffect(() => {
    if (!selectedUsername || !topicsGateSatisfied) { // Only update if gate is satisfied
      setWrittenByKeyword({});
      return;
    }
    updateWrittenStatus(selectedUsername);
    const id = setInterval(() => updateWrittenStatus(selectedUsername), 15000); // Poll every 15 seconds
    return () => clearInterval(id);
  }, [selectedUsername, updateWrittenStatus, topicsGateSatisfied]); // Added topicsGateSatisfied

  // When usernames are available, auto-select the pending username (if valid)
  useEffect(() => {
    if (!pendingUsername || !availableUsernames || availableUsernames.length === 0) return;
    if (availableUsernames.includes(pendingUsername)) {
      if (useWorkspaceScoping) {
        // In workspace mode, we assume the provider handles this.
        // This logic is primarily for the old system.
      } else { handleUsernameSelect(pendingUsername); }
      setPendingUsername(null);
    }
  }, [availableUsernames, pendingUsername, handleUsernameSelect, useWorkspaceScoping]); // After FAQ data and tab are ready, highlight and scroll to the focused question
  useEffect(() => {
    if (activeTab !== 'faq' || !focusQuestion) return;
    if (!faqTabRef.current) return;
    // small delay to ensure the table is rendered
    const t = setTimeout(() => {
      const root = faqTabRef.current;
      const all = Array.from(root.querySelectorAll('li, tr, div'));
      const target = all.find((el) => (el.textContent || '').toLowerCase().includes(focusQuestion.toLowerCase()));
      if (target) {
        target.classList.add('ring-2', 'ring-emerald-400', 'rounded-md', 'bg-emerald-500/10');
        try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { console.error("Scroll failed:", e); }
        // remove highlight after a few seconds
        setTimeout(() => {
          target.classList.remove('ring-2', 'ring-emerald-400', 'rounded-md', 'bg-emerald-500/10');
        }, 4500);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [activeTab, faqRows, loadingData, focusQuestion, searchQuery]);

  // Helper to know if a row has all required assignments
  const isComplete = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
      Array.isArray(pp) && pp.length > 0;
  };

  // NEW: token consumption for feature-flagged actions on Topics
  const { consumeTokensForFeature } = useTokenConsumption();

  const handleUpdate = useCallback(async (tableId, recordId, fieldName, newValue) => {
    const isKeywordMap = tableId === TABLE_IDS.keywordMap;
    const stateSetter = isKeywordMap ? setKeywordRows : setFaqRows;

    // Correct field name for Airtable update. "Get Questions" is the UI name, "Select Keyword" is the actual Airtable field.
    const writeFieldName = fieldName === "Get Questions" ? "Select Keyword" : fieldName;

    // NEW: Handle "Get Questions" toggle with Rate Limiting
    if (fieldName === "Get Questions" && newValue === true) {
      const now = Date.now();
      const rateLimitKey = `get_questions_timestamps_${currentUser?.id || 'guest'}`;
      let timestamps = [];
      try {
        timestamps = JSON.parse(localStorage.getItem(rateLimitKey)) || [];
      } catch (e) {
        timestamps = [];
      }

      const recentTimestamps = timestamps.filter((ts) => now - ts < GET_QUESTIONS_RATE_LIMIT.windowMs);

      if (recentTimestamps.length >= GET_QUESTIONS_RATE_LIMIT.limit) {
        toast.warning("Woah there, slow down!", {
          description: "You've reached the rate limit for getting questions. For higher limits, please consider upgrading."
        });
        return; // Stop the update
      }

      // Add new timestamp and save
      const newTimestamps = [...recentTimestamps, now];
      localStorage.setItem(rateLimitKey, JSON.stringify(newTimestamps));

      // NEW: feature flag token consumption (non-blocking of UI layout/colors)
      await consumeTokensForFeature("topics_get_questions");

      // Clear any existing interval for this recordId to prevent leaks
      if (intervalRefs.current[recordId]) {
        clearInterval(intervalRefs.current[recordId]);
        delete intervalRefs.current[recordId];
      }

      // Start loading state for this record
      setLoadingQuestions((prev) => ({
        ...prev,
        [recordId]: { loading: true, startTime: Date.now() }
      }));

      // Start countdown
      setCountdown((prev) => ({
        ...prev,
        [recordId]: 60
      }));

      // Countdown timer
      const newIntervalId = setInterval(() => {
        setCountdown((prev) => {
          const currentCount = prev[recordId];
          if (currentCount === undefined || currentCount <= 1) { // <=1 to ensure 0 is shown for a tick
            clearInterval(intervalRefs.current[recordId]);
            delete intervalRefs.current[recordId]; // Clean up ref entry
            setLoadingQuestions((prevLoading) => {
              const updated = { ...prevLoading };
              delete updated[recordId];
              return updated;
            });
            const newCountdown = { ...prev };
            delete newCountdown[recordId];
            return newCountdown;
          }
          return {
            ...prev,
            [recordId]: currentCount - 1
          };
        });
      }, 1000);

      intervalRefs.current[recordId] = newIntervalId; // Store the new interval ID

      // Backup 60-second timer to ensure loading state clears, even if interval fails
      setTimeout(() => {
        if (intervalRefs.current[recordId]) { // Only clear if interval still exists
          clearInterval(intervalRefs.current[recordId]);
          delete intervalRefs.current[recordId];
        }
        setLoadingQuestions((prev) => {
          const updated = { ...prev };
          delete updated[recordId];
          return updated;
        });
        setCountdown((prev) => {
          const newCountdown = { ...prev };
          delete newCountdown[recordId];
          return newCountdown;
        });
      }, 60000);
    } else if (fieldName === "Get Questions" && newValue === false) {
      // Clear any existing interval for this recordId
      if (intervalRefs.current[recordId]) {
        clearInterval(intervalRefs.current[recordId]);
        delete intervalRefs.current[recordId];
      }

      // Clear loading state and countdown when toggled off
      setLoadingQuestions((prev) => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
      setCountdown((prev) => {
        const newCountdown = { ...prev };
        delete newCountdown[recordId];
        return newCountdown;
      });
    }

    let fullyUpdatedRowFields = null;
    // NEW: capture if this specific change leads to a "complete" state (TM + PP both selected) to charge tokens once
    let becameComplete = false;

    // Use the functional update form to get the latest state and capture the new fields.
    // This avoids stale closures and makes the function more stable.
    stateSetter((currentRows) =>
      currentRows.map((row) => {
        if (row.id === recordId) {
          const wasCompleteBefore = isComplete(row.fields || {});
          // IMPORTANT: Update UI state using the actual Airtable field name ('writeFieldName')
          const updatedFields = { ...row.fields, [writeFieldName]: newValue };
          fullyUpdatedRowFields = updatedFields; // Capture the new fields for the check below
          const nowComplete = isComplete(updatedFields || {});
          becameComplete = !wasCompleteBefore && nowComplete;
          return { ...row, fields: updatedFields };
        }
        return row;
      })
    );

    // Map UI "Promoted Product" to the actual linked field if needed
    const canonicalLower = String(fieldName).toLowerCase();
    const isRequiredSpecial = ["target market", "promoted product", "link to company products"].includes(canonicalLower);

    // For Promoted Product, ensure we write to the real linked field (often "Link to Company Products")
    let finalWriteFieldName = writeFieldName; // Start with the potentially remapped field name
    if (canonicalLower.includes("promoted") || canonicalLower.includes("company products")) {
      const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {});
      // Only override finalWriteFieldName if ppKey returns something valid and different from writeFieldName
      if (ppKey && ppKey !== writeFieldName) {
        finalWriteFieldName = ppKey;
      }
    }

    // For the two special dropdown fields, check if we should batch-write to Airtable.
    if (isRequiredSpecial) {
      if (fullyUpdatedRowFields) {
        // Dynamically get the exact field names, as they might vary slightly
        const tmKey = Object.keys(fullyUpdatedRowFields).find((k) => k.toLowerCase() === "target market") || "Target Market";
        const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {}); // Use the helper for Promoted Product

        const isNowComplete =
          Array.isArray(fullyUpdatedRowFields[tmKey]) && fullyUpdatedRowFields[tmKey].length > 0 &&
          Array.isArray(fullyUpdatedRowFields[ppKey]) && fullyUpdatedRowFields[ppKey].length > 0;

        // NEW: token consumption when completion is achieved (non-blocking UI/layout)
        if (becameComplete) {
          await consumeTokensForFeature("topics_assignment_complete");
        }

        if (isNowComplete) {
          // All required fields are selected, so write the batch update to Airtable.
          await airtableSync({
            action: "updateRecord",
            tableId,
            recordId,
            fields: {
              [tmKey]: fullyUpdatedRowFields[tmKey],
              [ppKey]: fullyUpdatedRowFields[ppKey]
            }
          });
          return; // Batch update performed, no need for single field update below
        }
      }
      // If not all required fields are complete, proceed with the single field update
      await airtableSync({
        action: "updateRecord",
        tableId,
        recordId,
        fields: { [finalWriteFieldName]: newValue }
      });
      return;
    }

    // For any other field (e.g., the 'Select Keyword' switch itself), write to Airtable immediately.
    await airtableSync({
      action: "updateRecord",
      tableId,
      recordId,
      fields: { [finalWriteFieldName]: newValue }
    });
  }, [currentUser, consumeTokensForFeature]); // intervalRefs not included in dependency array as it's a ref and doesn't trigger re-renders

  const refreshData = () => {
    // Clear cache to force a full refresh on next load
    const cleared = { tm: [], bc: [], pp: [], cacheTime: 0 };
    auxDataCacheRef.current = cleared;
    setAuxDataCache(cleared);
    // When manually refreshing, ensure next call runs (even in workspace-suppressed initial load)
    isInitialDataLoadSuppressed.current = false;
    if (selectedUsername) {
      loadDataForUser(selectedUsername);
    }
  };

  // EDIT: allow optional text override so inline form can reuse this without changing existing behavior
  const handleCreateKeyword = async (textOverride) => {
    const text = (textOverride ?? newKeyword)?.trim();
    if (!selectedUsername || !text) return;
    setCreating(true);
    setError(null);
    try {
      // Inspect table fields to use correct names
      const { data: listRes } = await airtableListFields({
        tableId: TABLE_IDS.keywordMap,
        sampleSize: 1
      });

      const available = listRes?.fields || [];

      const usernameKey = pickField(available, ["Username", "username", "user_name", "client_username", "User", "user"]);
      const keywordKey = pickField(available, ["Keyword", "Name", "Title"]);
      const selectKey = pickField(available, ["Select Keyword", "Select", "Selected"]);
      const getQuestionsKey = pickField(available, ["Get Questions", "Get_Questions"]); // Added for new field

      // NEW: Find a suitable Brand field in this table
      const brandFieldCandidate = pickField(available, ["Brand ID", "brand id", "BrandID", "Brand Name", "brand name", "Brand", "brand"]);
      // Prefer previously observed brand field if available
      const brandTargetField = brandFieldKey && available.some((f) => f === brandFieldKey) ?
        brandFieldKey :
        brandFieldCandidate;

      if (!keywordKey) {
        setError("Airtable: No suitable keyword field found (tried Keyword/Name/Title).");
        setCreating(false);
        return;
      }
      if (!usernameKey) {
        setError("Airtable: Could not find a Username field (tried Username/username/user_name/client_username).");
        setCreating(false);
        return;
      }

      const fieldsPayload = {
        [keywordKey]: text,
        [usernameKey]: selectedUsername
      };
      if (selectKey) fieldsPayload[selectKey] = false;
      if (getQuestionsKey) fieldsPayload[getQuestionsKey] = false; // Initialize new field as false

      // NEW: always set canonical 'Username' field for filtering and compatibility
      fieldsPayload["Username"] = selectedUsername;

      // NEW: include Brand array if we have it and the table has a matching field
      if (brandTargetField && Array.isArray(brandArray) && brandArray.length > 0) {
        fieldsPayload[brandTargetField] = brandArray;
      }

      const { data } = await airtableCreateRecord({
        tableId: TABLE_IDS.keywordMap,
        fields: fieldsPayload
      });

      if (data?.success && data?.record) {
        const newRecord = {
          id: data.record.id,
          __manualAdded: true, // NEW: mark local manual
          fields: {
            // Use fields as returned by Airtable to keep UI consistent
            ...data.record.fields,
            // Ensure optional arrays exist for UI (important for MiniMultiSelect)
            "Target Market": data.record.fields["Target Market"] || [],
            [getLinkedProductFieldName(data.record.fields)]: data.record.fields[getLinkedProductFieldName(data.record.fields)] || []
          }
        };
        // NEW: persist manual id so it stays marked after reload
        const setObj = getManualKwSet();
        setObj.add(newRecord.id);
        saveManualKwSet(setObj);

        // insert at top
        setKeywordRows((prev) => [newRecord, ...prev]);

        // keep existing modal behavior intact
        setShowAddKeyword(false);
        setNewKeyword("");
        setActiveTab("keyword_map");
        setSearchQuery("");

        // If we just wrote a brand, cache it
        if (brandTargetField && fieldsPayload[brandTargetField]) { // Check against payload as it's the one we sent
          setBrandFieldKey(brandTargetField);
          setBrandArray(Array.isArray(fieldsPayload[brandTargetField]) ? fieldsPayload[brandTargetField] : [fieldsPayload[brandTargetField]]);
        }
      } else {
        setError(data?.error || "Failed to create keyword in Airtable.");
      }
    } catch (e) {
      console.error("Error creating keyword:", e);
      setError(e?.message || "Error creating keyword in Airtable.");
    } finally {
      setCreating(false);
    }
  };

  // EDIT: allow optional text override so inline form can reuse this without changing existing behavior
  const handleCreateFaq = async (textOverride) => {
    const text = (textOverride ?? newFaqKeyword)?.trim();
    if (!selectedUsername || !text) return;
    setCreating(true);
    setError(null); // Clear any previous error
    try {
      // Inspect FAQ table fields
      const { data: listRes } = await airtableListFields({
        tableId: TABLE_IDS.faq,
        sampleSize: 1
      });

      const available = listRes?.fields || [];

      const usernameKey = pickField(available, ["Username", "username", "user_name", "client_username", "User", "user"]);
      // Many bases use "Keyword" for FAQs; some use "Question" or "Title"
      const keywordKey = pickField(available, ["Keyword", "Question", "Title", "Name"]);

      // NEW: Find a suitable Brand field in this table
      const brandFieldCandidate = pickField(available, ["Brand ID", "brand id", "BrandID", "Brand Name", "brand name", "Brand", "brand"]);
      const brandTargetField = brandFieldKey && available.some((f) => f === brandFieldKey) ?
        brandFieldKey :
        brandFieldCandidate;

      if (!keywordKey) {
        setError("Airtable: No suitable keyword/question field found.");
        setCreating(false);
        return;
      }
      if (!usernameKey) {
        setError("Airtable: Could not find a Username field (tried Username/username/user_name/client_username).");
        setCreating(false);
        return;
      }

      const fieldsPayload = {
        [keywordKey]: text,
        [usernameKey]: selectedUsername
      };

      // NEW: always set canonical 'Username' field for filtering and compatibility
      fieldsPayload["Username"] = selectedUsername;

      // NEW: include Brand array if we have it and the table has a matching field
      if (brandTargetField && Array.isArray(brandArray) && brandArray.length > 0) {
        fieldsPayload[brandTargetField] = brandArray;
      }

      const { data } = await airtableCreateRecord({
        tableId: TABLE_IDS.faq,
        fields: fieldsPayload
      });

      if (data?.success && data?.record) {
        const newRecord = {
          id: data.record.id,
          fields: {
            ...data.record.fields,
            "Target Market": data.record.fields["Target Market"] || [],
            [getLinkedProductFieldName(data.record.fields)]: data.record.fields[getLinkedProductFieldName(data.record.fields)] || []
          }
        };
        setFaqRows((prev) => [newRecord, ...prev]);
        // keep existing modal behavior intact
        setShowAddFaq(false); // Fix: Corrected typo from setShowAddFag to setShowAddFaq
        setNewFaqKeyword("");
        setActiveTab("faq");
        setSearchQuery("");

        // Cache brand after successful write
        if (brandTargetField && fieldsPayload[brandTargetField]) { // Check against payload as it's the one we sent
          setBrandFieldKey(brandTargetField);
          setBrandArray(Array.isArray(fieldsPayload[brandTargetField]) ? fieldsPayload[brandTargetField] : [fieldsPayload[brandTargetField]]);
        }
      } else {
        setError(data?.error || "Failed to create FAQ in Airtable.");
      }
    } catch (e) {
      console.error("Error creating FAQ:", e);
      setError(e?.message || "Error creating FAQ in Airtable.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRecord = async (tableId, recordId) => {
    if (!tableId || !recordId) return;
    setDeleteTarget({ tableId, recordId });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { tableId, recordId } = deleteTarget;
    try {
      await airtableDeleteRecord({ tableId, recordId });

      if (tableId === TABLE_IDS.keywordMap) {
        setKeywordRows((prev) => prev.filter((r) => r.id !== recordId));
        // NEW: remove from manual set if present
        const setObj = getManualKwSet();
        if (setObj.has(recordId)) {
          setObj.delete(recordId);
          saveManualKwSet(setObj);
        }
      } else if (tableId === TABLE_IDS.faq) {
        setFaqRows((prev) => prev.filter((r) => r.id !== recordId));
      }
    } catch (e) {
      console.error("Error deleting record:", e);
      setError("Failed to delete record: " + (e.message || "Unknown error"));
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // NEW: Function to handle "View Questions" click
  const handleViewQuestions = useCallback((keyword) => {
    // Switch to FAQ tab
    setActiveTab('faq');
    // Set the dedicated filter for FAQs instead of using the global search
    setFaqKeywordFilter(keyword);
    // Clear global search to avoid confusion
    setSearchQuery("");
  }, []);

  // Example: guard the "Get Questions" trigger (replace prop usage below)
  const guardedHandleViewQuestions = useCallback(async (keyword) => {
    // The previous ensureOnboardingGate relied on usernameRecord.topics.
    // With the new User.me().topics gate, this check might be redundant or require re-evaluation
    // depending on the exact intent of two separate 'topics' fields.
    // For now, I'm removing the call to the now-removed ensureOnboardingGate.
    // If a different gate specific to an action is needed, it should be re-introduced.
    handleViewQuestions(keyword); // Call the original handler
  }, [handleViewQuestions]);

  // NEW: Inline submit wrapper (does not affect existing modal flows)
  const handleInlineSubmit = async () => {
    if (!inlineKeywordText.trim()) return;
    if (inlineTarget === "faq") {
      await handleCreateFaq(inlineKeywordText);
    } else {
      await handleCreateKeyword(inlineKeywordText);
    }
    setShowInlineAdd(false);
    setInlineKeywordText("");
    setInlineTarget("keyword_map");

    // Refresh written status after creating (in case a post already exists for that keyword)
    if (selectedUsername) updateWrittenStatus(selectedUsername);
  };

  // Derived rows for current filters
  const filteredKeywordRows = React.useMemo(() => {
    let rows = [...keywordRows]; // Use a copy to avoid mutating the original state
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    if (showSelectedOnly) {
      // FIX: Use the correct field "Select Keyword" for filtering
      rows = rows.filter((r) => !!r?.fields?.["Select Keyword"]);
    }
    if (showCompleteOnly) {
      rows = rows.filter((r) => isComplete(r?.fields || {}));
    }
    // NEW: filter by '__manualAdded' presence
    if (showManualOnly) {
      rows = rows.filter((r) => r.__manualAdded);
    }
    return rows;
  }, [keywordRows, searchQuery, showSelectedOnly, showCompleteOnly, showManualOnly]);

  const filteredFaqRows = React.useMemo(() => {
    let rows = [...faqRows];

    // First, apply the dedicated keyword filter if it exists
    if (faqKeywordFilter) {
      rows = rows.filter((r) => (r?.fields?.['Top Level Keyword'] || []).includes(faqKeywordFilter));
    }

    // Then, apply the global search query to the already-filtered list
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    return rows;
  }, [faqRows, searchQuery, faqKeywordFilter]);


  // Derived rows for current filters
  // REPLACE the nested PageContent component with an inline-render variable to avoid remounts
  const renderPageBody = (() => {
    if (loadingInitial || useWorkspaceScoping && isWorkspaceLoading) {
      return (
        <div className="text-center py-12 text-slate-600 flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading user data...</span>
        </div>);

    }

    if (!useWorkspaceScoping && availableUsernames.length === 0 && currentUser?.role !== "admin") {
      return (
        <div className="text-center py-12 text-amber-700 bg-amber-50 rounded-2xl border border-amber-200">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No Usernames Assigned</h3>
          <p className="text-amber-700/80 mt-2">
            Your account does not have any usernames assigned. Please contact an administrator.
          </p>
        </div>);

    }

    if (!selectedUsername) {
      return (
        <div className="text-center py-12 text-slate-600 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900">Select a Workspace</h3>
          <p className="text-slate-600">Choose a workspace from the top navigation to view topics.</p>
        </div>);

    }

    // Check if initial load was suppressed and we haven't manually triggered a load yet
    if (useWorkspaceScoping && isInitialDataLoadSuppressed.current) {
      return (
        <div className="text-center py-12 text-slate-600 bg-white rounded-2xl border border-slate-200">
          <Info className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900">Data Load Suppressed</h3>
          <p className="text-slate-600">Click "Refresh" to load topics for {selectedUsername}.</p>
        </div>);

    }

    if (loadingData) {
      return (
        <div className="text-center py-12 text-slate-600 flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading topics for {selectedUsername}...</span>
        </div>);

    }

    if (error) {
      return <div className="text-center py-12 text-red-600">{error}</div>;
    }

    return (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 rounded-xl p-1 mb-4 shadow-sm">
            <TabsTrigger
              value="keyword_map"
              className="rounded-lg text-slate-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors">

              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Keyword Map</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {filteredKeywordRows.length}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              className="rounded-lg text-slate-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors">

              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>FAQs</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {filteredFaqRows.length}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="keyword_map"
            className="rounded-xl border border-slate-200 bg-white">

            <DataTable
              rows={filteredKeywordRows}
              headers={KEYWORD_MAP_HEADERS}
              tableId={TABLE_IDS.keywordMap}
              options={options}
              handleUpdate={handleUpdate}
              density="compact"
              onDeleteRow={handleDeleteRecord}
              layout={KEYWORD_MAP_LAYOUT} // Ensure layout prop is passed
              loadingQuestions={loadingQuestions}
              countdown={countdown} // Pass countdown state to DataTable
              handleViewQuestions={guardedHandleViewQuestions} // Use the guarded handler
              // NEW: pass written map
              writtenByKeyword={writtenByKeyword} />


          </TabsContent>

          <TabsContent
            value="faq"
            className="rounded-xl border border-slate-200 bg-white overflow-x-auto">

            {/* NEW: Filter status banner */}
            {faqKeywordFilter &&
              <div className="sticky top-0 z-30 bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-700" />
                  <span className="text-sm text-indigo-800">
                    Showing questions for: <span className="font-semibold">{faqKeywordFilter}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFaqKeywordFilter(null)}
                  className="text-indigo-700 hover:bg-indigo-100 h-7 px-2">

                  Clear Filter
                </Button>
              </div>
            }

            <GroupedFaqTable
              rows={filteredFaqRows}
              tableId={TABLE_IDS.faq}
              options={options}
              handleUpdate={handleUpdate}
              density="compact"
              ref={faqTabRef}
              onDeleteRow={handleDeleteRecord}
              // NEW: pass written map
              writtenByKeyword={writtenByKeyword} />


          </TabsContent>
        </Tabs>
      </>);

  })();

  if (checkingTopicsGate) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <TopicsOnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        username={selectedUsername}
        companyInfoTableId={TABLE_IDS.companyInformation}
        targetMarketTableId={TABLE_IDS.targetMarket}
        companyProductsTableId={TABLE_IDS.companyProducts}
        onCompleted={async () => {
          // Mark this username as completed in the current user's record
          const me = await User.me().catch(() => null);
          if (me) {
            const arr = Array.isArray(me.topics) ? me.topics : [];
            const uname = selectedUsername || null;
            if (uname && !arr.includes(uname)) {
              const updated = [...arr, uname];
              await User.updateMyUserData({ topics: updated });
              setCurrentUser(prev => ({ ...prev, topics: updated })); // Update local user state
              setTopicsGateSatisfied(true);
              setShowOnboarding(false);
              toast.success(`Topics onboarding complete for ${uname}.`);
              refreshData(); // Force a refresh of data to reflect the new state
            }
          }
        }}
      />

      {/* Only render the existing Topics UI when the gate is satisfied */}
      {topicsGateSatisfied && (
        <div className="w-full px-6">
          {/* One-row toolbar: compact controls with no horizontal scroll */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 mb-2">
            <div className="flex items-center gap-1 flex-nowrap">
              {/* Inline page title */}
              <span className="text-sm font-semibold text-slate-900 mr-2">Topics</span>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-200" />

              {/* Username selector - now conditionally rendered */}
              {!useWorkspaceScoping &&
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-500" />
                  <Select
                    value={localSelectedUsername || ""}
                    onValueChange={handleUsernameSelect}
                    disabled={loadingInitial}>
                    <SelectTrigger className="w-40 h-8 bg-white border-slate-300 text-slate-900 text-sm">
                      <SelectValue placeholder={loadingInitial ? "Loading..." : "Select username"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200">
                      {availableUsernames.map((name) =>
                        <SelectItem key={name} value={name} className="text-slate-900 hover:bg-slate-100">
                          {name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              }

              {/* Divider (only if workspace scoping is off) */}
              {!useWorkspaceScoping && <div className="h-5 w-px bg-slate-200" />}

              {/* Search keywords (slightly narrower) */}
              <div className="relative">
                <Input
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 w-[180px] h-8 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 text-sm" />
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-200" />

              {/* Quick filters */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Switch
                    checked={showSelectedOnly}
                    onCheckedChange={setShowSelectedOnly}
                    disabled={activeTab !== "keyword_map"} className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white" />

                  <span className={`text-[11px] ${activeTab !== "keyword_map" ? "text-slate-400" : "text-slate-700"}`}>
                    Selected
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Switch
                    checked={showCompleteOnly}
                    onCheckedChange={setShowCompleteOnly}
                    disabled={activeTab !== "keyword_map"} className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white" />

                  <span className={`text-[11px] ${activeTab !== "keyword_map" ? "text-slate-400" : "text-slate-700"}`}>
                    Complete
                  </span>
                </div>

                {/* NEW: Manual filter toggle */}
                <div className="flex items-center gap-1">
                  <Switch
                    checked={showManualOnly}
                    onCheckedChange={setShowManualOnly}
                    disabled={activeTab !== "keyword_map"} className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white" />

                  <span className={`text-[11px] ${activeTab !== "keyword_map" ? "text-slate-400" : "text-slate-700"}`}>
                    Manual
                  </span>
                </div>
              </div>

              {/* Actions (refresh button and new Add Keyword button) */}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  onClick={refreshData}
                  disabled={!selectedUsername || loadingData}
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50"
                  title="Refresh">

                  <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
                </Button>
                {/* EDIT: Keep same button, only toggles inline form (colors/layout unchanged) */}
                <Button
                  onClick={() => setShowInlineAdd((v) => !v)}
                  disabled={!selectedUsername}
                  size="sm"
                  className="gap-2 h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">

                  <Plus className="w-4 h-4" />
                  Add Keyword
                </Button>
              </div>
            </div>
          </div>

          {/* NEW: Inline add form (appears below toolbar) */}
          {showInlineAdd &&
            <div className="bg-white border border-slate-200 rounded-xl p-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={inlineKeywordText}
                  onChange={(e) => setInlineKeywordText(e.target.value)}
                  placeholder="Enter keyword or question"
                  className="bg-white border-slate-300 text-slate-900 h-8 flex-1 min-w-[220px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inlineKeywordText.trim() && !creating) {
                      e.preventDefault();
                      handleInlineSubmit();
                    }
                  }} />

                <Select value={inlineTarget} onValueChange={setInlineTarget}>
                  <SelectTrigger className="w-44 h-8 bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200">
                    <SelectItem value="keyword_map">Keyword Map</SelectItem>
                    <SelectItem value="faq">FAQs</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleInlineSubmit}
                  disabled={!inlineKeywordText.trim() || creating}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700">

                  {creating ? "Adding..." : "Submit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowInlineAdd(false); setNewKeyword(""); setNewFaqKeyword(""); setInlineKeywordText(""); setInlineTarget("keyword_map"); }}
                  className="h-8 bg-white border-slate-300 text-slate-900 hover:bg-slate-50">

                  Cancel
                </Button>
              </div>
            </div>
          }

          {renderPageBody}
        </div>
      )}


      {/* Add Keyword (Keyword Map) Dialog */}
      <Dialog open={showAddKeyword} onOpenChange={setShowAddKeyword}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Add Keyword (Keyword Map)</DialogTitle>
            <DialogDescription className="text-slate-600">
              Creates a new Keyword Map record in Airtable for "{selectedUsername}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-slate-800">Keyword</label>
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter a keyword"
              className="bg-white border border-slate-300 text-slate-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newKeyword.trim() && !creating) {
                  e.preventDefault();
                  handleCreateKeyword();
                }
              }} />

          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddKeyword(false)} className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleCreateKeyword} disabled={!newKeyword.trim() || creating} className="bg-emerald-600 hover:bg-emerald-700">
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add FAQ Keyword Dialog */}
      <Dialog open={showAddFaq} onOpenChange={setShowAddFaq}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Add Keyword (FAQs)</DialogTitle>
            <DialogDescription className="text-slate-600">
              Creates a new FAQ record in Airtable for "{selectedUsername}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-slate-800">Keyword</label>
            <Input
              value={newFaqKeyword}
              onChange={(e) => setNewFaqKeyword(e.target.value)}
              placeholder="Enter a keyword for FAQs"
              className="bg-white border border-slate-300 text-slate-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFaqKeyword.trim() && !creating) {
                  e.preventDefault();
                  handleCreateFaq();
                }
              }} />

          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddFaq(false)} className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleCreateFaq} disabled={!newFaqKeyword.trim() || creating} className="bg-emerald-600 hover:bg-emerald-700">
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        title="Delete record"
        description="Are you sure you want to delete this record? This action cannot be undone."
      />
    </div>);

}

// --- Reusable DataTable Component (for Keyword Map) ---
const DataTable = ({ rows, headers, layout, tableId, options, handleUpdate, density = "comfortable", onDeleteRow, loadingQuestions, countdown, handleViewQuestions, writtenByKeyword }) => {
  // NEW: local sort state for Search Volume
  const [svSort, setSvSort] = React.useState(null); // null | 'asc' | 'desc'

  const toggleSvSort = () => {
    setSvSort((prev) => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
  };

  // Helper to safely parse numbers that may include commas/strings
  const parseNum = (val) => {
    if (val == null || val === "") return Number.NaN;
    if (typeof val === "number") return val;
    const n = parseFloat(String(val).replace(/,/g, ""));
    return isNaN(n) ? Number.NaN : n;
  };

  // Sort rows according to active sort
  const sortedRows = React.useMemo(() => {
    let list = [...rows];
    // Always pin manually added rows to the top
    list.sort((a, b) => {
      const ma = a.__manualAdded ? 1 : 0;
      const mb = b.__manualAdded ? 1 : 0;

      // Prioritize manual-added rows to the top
      if (ma !== mb) return mb - ma; // manual first (1 - 0 = 1 means a comes after b; 0 - 1 = -1 means a comes before b)

      if (!svSort) return 0; // If no Search Volume sort, maintain original order for non-manual rows or relative order for manual rows

      const av = parseNum(a?.fields?.["Search Volume"]);
      const bv = parseNum(b?.fields?.["Search Volume"]);
      const aVal = isNaN(av) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : av;
      const bVal = isNaN(bv) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : bv;
      return svSort === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [rows, svSort]);

  // helper for human-friendly numbers
  const formatNumber = (val) => {
    if (val == null || val === "") return "-";
    const n = typeof val === "number" ? val : parseFloat(String(val).toString().replace(/,/g, ""));
    if (isNaN(n)) return String(n); // Changed from String(val) to String(n) for consistent output if val was a string number
    return n.toLocaleString();
  };

  const isComplete = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
      Array.isArray(pp) && pp.length > 0;
  };

  // Enhanced horizontal scroll with safe click handling
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isInteractive = (target) =>
      !!(target && target.closest('button, [role="button"], a, input, select, textarea, [contenteditable="true"]'));

    const onWheel = (e) => {
      const canScrollX = el.scrollWidth > el.clientWidth;
      // If no horizontal scrollbar, or if explicit vertical intent (deltaY is much larger than deltaX)
      // or if shift key is not pressed, allow natural vertical scrolling.
      // e.g. for trackpads, deltaY is often non-zero even with horizontal scroll
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

      if (!canScrollX) {
        // No horizontal scrollbar, allow natural vertical scroll
        return;
      }

      if (!horizontalIntent) {
        // Not strong horizontal intent, allow natural vertical scrolling
        return;
      }

      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY; // Prefer deltaX, fall back to deltaY if deltaX is 0 (e.g. shift-scroll)

      // Check if at the horizontal edges. If so, don't preventDefault to allow parent scroll
      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1; // -1 to account for subpixel rendering differences
      if (atLeft && delta < 0 || atRight && delta > 0) {
        // At horizontal limit, don't prevent vertical scrolling of parent
        return;
      }

      el.scrollLeft += delta;
      e.preventDefault(); // Prevent page scroll when actively horizontal scrolling the table
    };

    let isDown = false;
    let isPanning = false;
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (isInteractive(e.target)) return; // don't hijack clicks on controls
      isDown = true;
      isPanning = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      // no preventDefault here so click events still fire if user doesn't pan
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!isPanning && Math.abs(dx) > 3) { // Start panning only after small threshold
        isPanning = true;
      }
      if (isPanning) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault(); // Prevent default only when actively panning
      }
    };

    const onPointerUp = () => {
      isDown = false;
      isPanning = false;
    };

    const onKeyDown = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const step = 60;
      if (e.key === "ArrowRight") {
        el.scrollLeft += step;
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        el.scrollLeft -= step;
        e.preventDefault();
      } else if (e.key === "Home") {
        el.scrollLeft = 0;
        e.preventDefault();
      } else if (e.key === "End") {
        el.scrollLeft = el.scrollWidth;
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: false }); // passive: false to allow preventDefault
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (rows.length === 0) {
    return <div className="text-center text-slate-500 py-10">No records match your filters.</div>;
  }
  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      className="w-full overflow-x-auto focus:outline-none"
      style={{ touchAction: "pan-x pan-y" }} // Allow natural vertical touch scrolling too
      aria-label="Keyword table horizontal scroller">

      <div className="w-full">
        {/* Edited: clearer sticky header with subtle shadow and border */}
        <div
          className="grid text-xs font-semibold tracking-wide text-slate-600 uppercase bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm"
          style={{ gridTemplateColumns: layout, gap: "1.5rem", padding: "0.5rem 1.5rem" }}>

          {headers.map((header) =>
            <div
              key={header}
              className={header === "Search Volume" ? "text-right" : "whitespace-nowrap"}>

              {header === "Search Volume" ?
                <button
                  type="button"
                  onClick={toggleSvSort}
                  className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
                  title="Sort by Search Volume">

                  <span>Search Volume</span>
                  {svSort === "asc" ?
                    <ArrowUp className="w-3.5 h-3.5" /> :
                    svSort === "desc" ?
                      <ArrowDown className="w-3.5 h-3.5" /> :
                      <ArrowUpDown className="w-3.5 h-3.5" />
                  }
                </button> :
                header
              }
            </div>
          )}
        </div>

        {/* Edited: clearer rows, numeric columns aligned and formatted */}
        <div className="text-sm text-slate-900">
          {sortedRows.map((row, idx) => {
            const fields = row.fields || {};
            const complete = isComplete(fields);
            const productField = getLinkedProductFieldName(fields); // Determine the actual product field name here
            const keywordText = String(fields["Keyword"] || "").trim();
            const keywordKey = keywordText.toLowerCase();
            const postId = writtenByKeyword ? writtenByKeyword[keywordKey] : null;

            // FIX: Read from the correct "Select Keyword" for the toggle's state
            const isToggled = fields["Select Keyword"] || false;
            const isLoading = loadingQuestions[row.id]?.loading;
            const currentCountdown = countdown[row.id]; // Access countdown for this row
            // The "View Questions" button should show if toggled is true, it's not currently loading, and countdown is finished (or never started for existing items)
            const canShowButton = isToggled && !isLoading && (currentCountdown === undefined || currentCountdown <= 0);


            return (
              <div
                key={row.id}
                className={`grid items-center border-t border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                style={{ gridTemplateColumns: layout, gap: "1.5rem", padding: density === "compact" ? "0.5rem 1.5rem" : "1rem 2rem" }}>

                {headers.map((header) =>
                  <div
                    key={`${row.id}-${header}`}
                    className={header === "Search Volume" ? "text-right font-mono tabular-nums text-slate-700" : "min-w-0"}>

                    {header === "Keyword" ?
                      <div className="flex items-center gap-2">
                        {/* NEW: 'm' symbol for manual-added */}
                        {row.__manualAdded &&
                          <span className="h-5 w-5 rounded-full border border-slate-300 text-slate-600 text-[10px] flex items-center justify-center">
                            m
                          </span>
                        }
                        <span className="text-slate-900 truncate">{keywordText || "-"}</span>
                        {complete && (
                          postId ?
                            <Link to={`${createPageUrl('Editor')}?postId=${postId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                title="Open in Editor">

                                Written
                              </Button>
                            </Link> :

                            <Badge className="bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                              Writing Article
                            </Badge>)

                        }
                        <Button
                          variant="ghost"
                          size="icon" className="text-fuchsia-700 ml-auto text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-8 w-8 hover:text-red-700 hover:bg-red-50"

                          onClick={() => onDeleteRow && onDeleteRow(tableId, row.id)}
                          title="Delete keyword">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div> :
                      header === "Get Questions" ?
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isToggled}
                            onCheckedChange={(checked) =>
                              // FIX: Pass the UI name "Get Questions" but the logic will map it to "Select Keyword"
                              handleUpdate(tableId, row.id, "Get Questions", checked)
                            } className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white"

                            style={{
                              // Tailwind classes handle the switch track background, this ensures thumb color is correct.
                              // The original code in the outline provided '#64748b' as off color, which is slate-700.
                              '--switch-thumb': isToggled ? '#ffffff' : '#64748b'
                            }} />

                          {isLoading && currentCountdown !== undefined && currentCountdown > 0 &&
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Searching... {currentCountdown}s</span>
                            </div>
                          }
                          {isToggled && canShowButton && // Only show button when toggled AND not loading AND countdown is done
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewQuestions(fields["Keyword"])}
                              className="text-xs px-2 py-1 h-6 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                              View Questions
                            </Button>
                          }
                        </div> :
                        header === "Target Market" ?
                          <MiniMultiSelect
                            options={options.tm}
                            value={fields["Target Market"] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, "Target Market", selected)}
                            size="sm"
                          /> :

                          header === "Promoted Product" ?
                            <MiniMultiSelect
                              options={options.pp}
                              value={fields[productField] || []} // use actual linked field for display
                              onChange={(selected) => handleUpdate(tableId, row.id, productField, selected)} // write to actual field name
                              size="sm"
                              itemVariant="pill" // Added itemVariant for bordered pills
                            /> :
                            header === "Search Volume" ?
                              <span>{formatNumber(fields[header])}</span> :
                              renderFieldValue(fields[header])
                    }
                  </div>
                )}
              </div>);

          })}
        </div>
      </div>
    </div>);

};
