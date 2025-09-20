
import React, { useEffect, useState, useCallback, useRef } from "react";
import { airtableSync } from "@/api/functions";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Users, ShieldAlert, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, Filter, Trash2, Tag, HelpCircle } from "lucide-react";
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

// --- Configuration ---
const TABLE_IDS = {
  keywordMap: "tblDR9SmoK8wEYmnA",
  faq: "tblSDBPmucJA0Skvp",
  targetMarket: "tblhayydQ0Zq2NBR9",
  blogCategories: "tblyNaoalXlmc1pQO",
  companyProducts: "tblafbTZlVJekc2Dz"
};

const KEYWORD_MAP_HEADERS = [
  "Keyword",
  "Select Keyword",
  "Search Volume",
  "Keyword Difficulty",
  "Search Intent",
  "Target Market",
  "Blog Category",
  "Promoted Product"
];


const KEYWORD_MAP_LAYOUT =
  "minmax(300px, 1.5fr) 140px 140px 160px 160px minmax(220px, 1fr) minmax(220px, 1fr) minmax(220px, 1fr)";

// Fields we require before sending to Airtable (moved outside component for stability)
const REQUIRED_FIELDS = ["Target Market", "Blog Category", "Promoted Product"];

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
      }

      // Strip HTML if present and use a truncated readable text
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
  const [selectedUsername, setSelectedUsername] = useState(null);

  const [keywordRows, setKeywordRows] = useState([]);
  const [faqRows, setFaqRows] = useState([]);
  const [options, setOptions] = useState({ tm: [], bc: [], pp: [] });

  const [loadingData, setLoadingData] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState(null);

  // Persist and restore active tab so it never jumps back on re-render
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('topics_active_tab') || 'keyword_map';
  });

  // NEW: toolbar states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showCompleteOnly, setShowCompleteOnly] = useState(false);
  // Removed: const [density, setDensity] = useState("comfortable"); // 'comfortable' | 'compact'

  // NEW: URL-driven focus for RecommendedQuestions -> Topics handoff
  const [pendingUsername, setPendingUsername] = useState(null);
  const [focusQuestion, setFocusQuestion] = useState(null);
  const faqTabRef = useRef(null);

  // NEW: Add Keyword/FAQ states
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newFaqKeyword, setNewFaqKeyword] = useState("");
  const [creating, setCreating] = useState(false);

  // NEW: brand field/value derived from existing rows for this username
  const [brandFieldKey, setBrandFieldKey] = useState(null);
  const [brandArray, setBrandArray] = useState([]);

  // Helper: pick the first existing field from candidates (case-insensitive)
  const pickField = useCallback((fieldsArr, candidates) => {
    const lowerMap = new Map((fieldsArr || []).map((f) => [String(f).toLowerCase(), f]));
    for (const c of candidates) {
      const hit = lowerMap.get(String(c).toLowerCase());
      if (hit) return hit;
    }
    return null;
  }, []);

  // Read URL params once on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const uname = urlParams.get('username');
    const focus = urlParams.get('focus');

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
  }, []);

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

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
      } catch (e) {
        setError("Failed to load user data. Please refresh.");
        console.error(e);
      } finally {
        setLoadingInitial(false);
      }
    };
    getInitialData();
  }, []);

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
    if (!username) return;

    setLoadingData(true);
    setError(null);
    setKeywordRows([]);
    setFaqRows([]);
    setOptions({ tm: [], bc: [], pp: [] });

    try {
      const listWithFilter = async (tableIdOrName, formula) => {
        const params = { action: "listAll", tableId: tableIdOrName };
        if (formula) params.filterByFormula = formula;
        const response = await airtableSync(params);
        if (!response.data.success) throw new Error(response.data.error || `Failed to load table ${tableIdOrName}`);
        return response.data.records || [];
      };

      const sanitizedUsername = username.replace(/'/g, "\\'");
      const mainFormula = `{Username} = '${sanitizedUsername}'`;
      // NEW: fetch keywords with strict server-side filter (Search Volume > 500 AND Username match)
      const keywordFormula = `AND({Search Volume} > 500, ${mainFormula})`;

      // Fetch main tables with appropriate formulas
      const [keywords, faqs] = await Promise.all([
        listWithFilter(TABLE_IDS.keywordMap, keywordFormula), // strict filter applied here
        listWithFilter(TABLE_IDS.faq, mainFormula) // keep FAQ filter as-is
      ]);

      // Fetch auxiliary tables WITHOUT Airtable-side filters
      const [tmRes, bcRes, ppRes] = await Promise.allSettled([
        listWithFilter(TABLE_IDS.targetMarket, null),
        listWithFilter(TABLE_IDS.blogCategories, null),
        listWithFilter(TABLE_IDS.companyProducts, null)
      ]);

      const rawTm = tmRes.status === "fulfilled" ? tmRes.value || [] : [];
      const rawBc = bcRes.status === "fulfilled" ? bcRes.value || [] : [];
      let rawPp = ppRes.status === "fulfilled" ? ppRes.value || [] : [];

      // Fallbacks for different table names
      if (!rawPp || rawPp.length === 0) {
        try { rawPp = await listWithFilter("Company Products", null); } catch (e) { console.warn("Fallback to 'Company Products' table name failed:", e.message); }
      }
      if (!rawPp || rawPp.length === 0) {
        try { rawPp = await listWithFilter("Products", null); } catch (e) { console.warn("Fallback to 'Products' table name failed:", e.message); }
      }

      // Helper to scope TM/BC by username
      const byUser = (arr) => {
        return (arr || []).filter((r) => {
          const f = r?.fields || {};
          const lower = Object.fromEntries(Object.entries(f).map(([k, v]) => [String(k).toLowerCase(), v]));
          const candidate =
            lower["username"] ||
            lower["user_name"] ||
            lower["user"] ||
            lower["client_username"] ||
            lower["client username"];
          // Use the original, unescaped 'username' for client-side comparison
          if (Array.isArray(candidate)) return candidate.includes(username);
          return (candidate || "") === username;
        });
      };

      // NEW: Filter products by client_username (or close variants) matching the selected username.
      const filterProductsByClientUsername = (records, uname) => {
        const keyCandidates = ["client_username", "client username", "username", "user_name", "user"];
        return (records || []).filter((r) => {
          const f = r?.fields || {};
          const lower = Object.fromEntries(Object.entries(f).map(([k, v]) => [String(k).toLowerCase(), v]));
          let val = null;
          for (const k of keyCandidates) {
            if (lower.hasOwnProperty(k)) { val = lower[k]; break; }
          }
          if (Array.isArray(val)) return val.includes(uname);
          return String(val || "") === uname;
        });
      };

      const tmArr = byUser(rawTm);
      const bcArr = byUser(rawBc);
      const ppArr = filterProductsByClientUsername(rawPp, username); // IMPORTANT: products filtered strictly by client_username

      setKeywordRows(keywords);
      setFaqRows(faqs);
      setOptions({
        tm: tmArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "targetMarket") })),
        bc: bcArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "blogCategories") })),
        pp: ppArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "companyProducts") }))
      });

      // NEW: derive Brand field and value array from existing rows (prefer Keyword Map, then FAQ)
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
      // Reset brand on error
      setBrandFieldKey(null);
      setBrandArray([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Memoize to prevent changing reference in effects
  const handleUsernameSelect = React.useCallback((username) => {
    setSelectedUsername(username);
    loadDataForUser(username);
  }, [loadDataForUser]);

  // When usernames are available, auto-select the pending username (if valid)
  useEffect(() => {
    if (!pendingUsername || !availableUsernames || availableUsernames.length === 0) return;
    if (availableUsernames.includes(pendingUsername)) {
      handleUsernameSelect(pendingUsername);
      setSelectedUsername(pendingUsername);
      setPendingUsername(null);
    }
  }, [availableUsernames, pendingUsername, handleUsernameSelect]);

  // After FAQ data and tab are ready, highlight and scroll to the focused question
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

  // Helper to know if a row has all assignments (same as in DataTable)
  const hasAllThree = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const bc = fields?.["Blog Category"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
      Array.isArray(bc) && bc.length > 0 &&
      Array.isArray(pp) && pp.length > 0;
  };

  const handleUpdate = useCallback(async (tableId, recordId, fieldName, newValue) => {
    const isKeywordMap = tableId === TABLE_IDS.keywordMap;
    const stateSetter = isKeywordMap ? setKeywordRows : setFaqRows;

    let fullyUpdatedRowFields = null;

    // Use the functional update form to get the latest state and capture the new fields.
    // This avoids stale closures and makes the function more stable.
    stateSetter((currentRows) =>
      currentRows.map((row) => {
        if (row.id === recordId) {
          const updatedFields = { ...row.fields, [fieldName]: newValue };
          fullyUpdatedRowFields = updatedFields; // Capture the new fields for the check below
          return { ...row, fields: updatedFields };
        }
        return row;
      })
    );

    // Map UI "Promoted Product" to the actual linked field if needed
    const canonicalLower = String(fieldName).toLowerCase();
    const isRequiredSpecial = ["target market", "blog category", "promoted product", "link to company products"].includes(canonicalLower);

    // For Promoted Product, ensure we write to the real linked field (often "Link to Company Products")
    let writeFieldName = fieldName;
    if (canonicalLower.includes("promoted") || canonicalLower.includes("company products")) {
      const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {});
      // Only override writeFieldName if getLinkedProductFieldName returns something valid and different
      if (ppKey && ppKey !== fieldName) {
        writeFieldName = ppKey;
      }
    }

    // For the three special dropdown fields, check if we should batch-write to Airtable.
    if (isRequiredSpecial) {
      if (fullyUpdatedRowFields) {
        // Dynamically get the exact field names, as they might vary slightly
        const tmKey = Object.keys(fullyUpdatedRowFields).find((k) => k.toLowerCase() === "target market") || "Target Market";
        const bcKey = Object.keys(fullyUpdatedRowFields).find((k) => k.toLowerCase() === "blog category") || "Blog Category";
        const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {}); // Use the helper for Promoted Product

        const hasAllThreeNow =
          Array.isArray(fullyUpdatedRowFields[tmKey]) && fullyUpdatedRowFields[tmKey].length > 0 &&
          Array.isArray(fullyUpdatedRowFields[bcKey]) && fullyUpdatedRowFields[bcKey].length > 0 &&
          Array.isArray(fullyUpdatedRowFields[ppKey]) && fullyUpdatedRowFields[ppKey].length > 0;

        if (hasAllThreeNow) {
          // All three are selected, so write the batch update to Airtable.
          await airtableSync({
            action: "updateRecord",
            tableId,
            recordId,
            fields: {
              [tmKey]: fullyUpdatedRowFields[tmKey],
              [bcKey]: fullyUpdatedRowFields[bcKey],
              [ppKey]: fullyUpdatedRowFields[ppKey]
            }
          });
          return; // Batch update performed, no need for single field update below
        }
      }
      // If not all three are complete, proceed with the single field update
      await airtableSync({
        action: "updateRecord",
        tableId,
        recordId,
        fields: { [writeFieldName]: newValue }
      });
      return;
    }

    // For any other field (e.g., the 'Select Keyword' switch), write to Airtable immediately.
    await airtableSync({
      action: "updateRecord",
      tableId,
      recordId,
      fields: { [writeFieldName]: newValue }
    });
  }, []);

  const refreshData = () => {
    if (selectedUsername) {
      loadDataForUser(selectedUsername);
    }
  };

  const handleCreateKeyword = async () => {
    if (!selectedUsername || !newKeyword.trim()) return;
    setCreating(true);
    setError(null); // Clear any previous error
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

      // NEW: Find a suitable Brand field in this table
      const brandFieldCandidate = pickField(available, ["Brand ID", "brand id", "BrandID", "Brand Name", "brand name", "Brand", "brand"]);
      // Prefer previously observed brand field if available
      const brandTargetField = brandFieldKey && available.some((f) => f.toLowerCase() === brandFieldKey.toLowerCase()) ?
        available.find((f) => f.toLowerCase() === brandFieldKey.toLowerCase()) :
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
        [keywordKey]: newKeyword.trim(),
        [usernameKey]: selectedUsername
      };
      if (selectKey) fieldsPayload[selectKey] = false;

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
          fields: {
            // Use fields as returned by Airtable to keep UI consistent
            ...data.record.fields,
            // Ensure optional arrays exist for UI (important for MiniMultiSelect)
            "Target Market": data.record.fields["Target Market"] || [],
            "Blog Category": data.record.fields["Blog Category"] || [],
            [getLinkedProductFieldName(data.record.fields)]: data.record.fields[getLinkedProductFieldName(data.record.fields)] || []
          }
        };
        setKeywordRows((prev) => [newRecord, ...prev]);
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

  const handleCreateFaq = async () => {
    if (!selectedUsername || !newFaqKeyword.trim()) return;
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
      const brandTargetField = brandFieldKey && available.some((f) => f.toLowerCase() === brandFieldKey.toLowerCase()) ?
        available.find((f) => f.toLowerCase() === brandFieldKey.toLowerCase()) :
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
        [keywordKey]: newFaqKeyword.trim(),
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
            "Blog Category": data.record.fields["Blog Category"] || [],
            [getLinkedProductFieldName(data.record.fields)]: data.record.fields[getLinkedProductFieldName(data.record.fields)] || []
          }
        };
        setFaqRows((prev) => [newRecord, ...prev]);
        setShowAddFaq(false);
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
    const confirmed = window.confirm("Are you sure you want to delete this record? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await airtableDeleteRecord({ tableId, recordId });

      if (tableId === TABLE_IDS.keywordMap) {
        setKeywordRows((prev) => prev.filter((r) => r.id !== recordId));
      } else if (tableId === TABLE_IDS.faq) {
        setFaqRows((prev) => prev.filter((r) => r.id !== recordId));
      }
      // Optionally provide user feedback for successful deletion
      console.log(`Record ${recordId} from table ${tableId} deleted successfully.`);
    } catch (e) {
      console.error("Error deleting record:", e);
      setError("Failed to delete record: " + (e.message || "Unknown error"));
    }
  };

  // NEW: Replace the previous capture/bubble-phase listener with a no-op to allow dropdowns to open normally
  React.useEffect(() => {

    // no-op: let Radix Select and DropdownMenu handle their own events
  }, []); // Derived rows for current filters
  const filteredKeywordRows = React.useMemo(() => {
    let rows = [...keywordRows]; // Use a copy to avoid mutating the original state
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    if (showSelectedOnly) {
      rows = rows.filter((r) => !!r?.fields?.["Select Keyword"]);
    }
    if (showCompleteOnly) {
      rows = rows.filter((r) => hasAllThree(r?.fields || {}));
    }
    return rows;
  }, [keywordRows, searchQuery, showSelectedOnly, showCompleteOnly]);

  const filteredFaqRows = React.useMemo(() => {
    let rows = [...faqRows];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    return rows;
  }, [faqRows, searchQuery]);

  // REPLACE the nested PageContent component with an inline-render variable to avoid remounts
  const renderPageBody = (() => {
    if (loadingInitial) {
      return (
        <div className="text-center py-12 text-slate-600 flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading user data...</span>
        </div>);

    }

    if (availableUsernames.length === 0 && currentUser?.role !== "admin") {
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
          <h3 className="text-xl font-semibold text-slate-900">Select a User</h3>
          <p className="text-slate-600">Choose a username from the dropdown above to view their topics.</p>
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
            />
          </TabsContent>

          <TabsContent
            value="faq"
            className="rounded-xl border border-slate-200 bg-white overflow-x-auto">

            <GroupedFaqTable
              rows={filteredFaqRows}
              tableId={TABLE_IDS.faq}
              options={options}
              handleUpdate={handleUpdate}
              density="compact"
              ref={faqTabRef}
              onDeleteRow={handleDeleteRecord} />

          </TabsContent>
        </Tabs>
      </>);

  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* One-row toolbar: compact controls with no horizontal scroll */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 mb-4">
          <div className="flex items-center gap-1 flex-nowrap">
            {/* Inline page title */}
            <span className="text-sm font-semibold text-slate-900 mr-2">Topics</span>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200" />

            {/* Username selector (slightly narrower to keep everything on one row) */}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-500" />
              <Select
                value={selectedUsername || ""}
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

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200" />

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
                  disabled={activeTab !== "keyword_map"}
                  className="h-5 w-9 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300" />
                <span className={`text-[11px] ${activeTab !== "keyword_map" ? "text-slate-400" : "text-slate-700"}`}>
                  Selected
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Switch
                  checked={showCompleteOnly}
                  onCheckedChange={setShowCompleteOnly}
                  disabled={activeTab !== "keyword_map"}
                  className="h-5 w-9 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300" />
                <span className={`text-[11px] ${activeTab !== "keyword_map" ? "text-slate-400" : "text-slate-700"}`}>
                  Complete
                </span>
              </div>
            </div>

            {/* Actions (small) */}
            <div className="ml-auto flex items-center gap-1">
              <Button
                onClick={() => setShowAddKeyword(true)}
                disabled={!selectedUsername || loadingData || loadingInitial}
                size="sm"
                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs"
                title={selectedUsername ? "Add keyword to Keyword Map" : "Select a username first"}>
                <Plus className="w-4 h-4 mr-1" />
                Add Keyword
              </Button>
              <Button
                onClick={() => setShowAddFaq(true)}
                disabled={!selectedUsername || loadingData || loadingInitial}
                size="sm"
                variant="outline"
                className="h-8 px-3 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 text-xs"
                title={selectedUsername ? "Add keyword to FAQs" : "Select a username first"}>
                <Plus className="w-4 h-4 mr-1" />
                Add FAQ
              </Button>
              <Button
                onClick={refreshData}
                disabled={!selectedUsername || loadingData}
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50"
                title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {renderPageBody}
      </div>

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
    </div>);

}

// --- Reusable DataTable Component (for Keyword Map) ---
const DataTable = ({ rows, headers, layout, tableId, options, handleUpdate, density = "comfortable", onDeleteRow }) => {
  // NEW: local sort state for Search Volume and Keyword Difficulty
  const [svSort, setSvSort] = React.useState(null); // null | 'asc' | 'desc'
  const [kdSort, setKdSort] = React.useState(null); // NEW: for Keyword Difficulty

  const toggleSvSort = () => {
    setSvSort((prev) => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
    setKdSort(null); // Clear KD sort when SV sort changes
  };
  const toggleKdSort = () => {
    setKdSort((prev) => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
    setSvSort(null); // Clear SV sort when KD sort changes
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
    if (!svSort && !kdSort) return rows;
    let list = [...rows]; // Create a shallow copy to avoid mutating original props

    if (svSort) {
      list.sort((a, b) => {
        const av = parseNum(a?.fields?.["Search Volume"]);
        const bv = parseNum(b?.fields?.["Search Volume"]);
        // Treat NaN as smallest in asc, largest in desc
        const aVal = isNaN(av) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : av;
        const bVal = isNaN(bv) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : bv;
        return svSort === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else if (kdSort) {
      list.sort((a, b) => {
        const av = parseNum(a?.fields?.["Keyword Difficulty"]);
        const bv = parseNum(b?.fields?.["Keyword Difficulty"]);
        const aVal = isNaN(av) ? kdSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : av;
        const bVal = isNaN(bv) ? kdSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : bv;
        return kdSort === "asc" ? aVal - bVal : bVal - aVal;
      });
    }
    return list;
  }, [rows, svSort, kdSort]);

  // helper for human-friendly numbers
  const formatNumber = (val) => {
    if (val == null || val === "") return "-";
    const n = typeof val === "number" ? val : parseFloat(String(val).toString().replace(/,/g, ""));
    if (isNaN(n)) return String(val);
    return n.toLocaleString();
  };

  const hasAllThree = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const bc = fields?.["Blog Category"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
      Array.isArray(bc) && bc.length > 0 &&
      Array.isArray(pp) && pp.length > 0;
  };

  const intentBadge = (val) => {
    const v = String(val || "").toLowerCase();
    const map = {
      informational: "bg-blue-100 text-blue-800",
      transactional: "bg-amber-100 text-amber-800",
      navigational: "bg-violet-100 text-violet-800",
      commercial: "bg-rose-100 text-rose-800"
    };
    const cls = map[v] || "bg-slate-200 text-slate-800";
    return <Badge className="bg-green-600 text-slate-50 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80">{v || "-"}</Badge>;
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
      if ((atLeft && delta < 0) || (atRight && delta > 0)) {
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

      <div className="min-w-[1200px]">
        {/* Edited: clearer sticky header with subtle shadow and border */}
        <div
          className="grid text-xs font-semibold tracking-wide text-slate-600 uppercase bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm"
          style={{ gridTemplateColumns: layout, gap: "1rem", padding: "0.75rem 1.5rem" }}>

          {headers.map((header) =>
            <div
              key={header}
              className={header === "Search Volume" || header === "Keyword Difficulty" ? "text-right" : "whitespace-nowrap"}>

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
                header === "Keyword Difficulty" ?
                  <button
                    type="button"
                    onClick={toggleKdSort}
                    className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
                    title="Sort by Keyword Difficulty">

                    <span>Keyword Difficulty</span>
                    {kdSort === "asc" ?
                      <ArrowUp className="w-3.5 h-3.5" /> :
                      kdSort === "desc" ?
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
            const complete = hasAllThree(fields);
            const productField = getLinkedProductFieldName(fields); // Determine the actual product field name here
            return (
              <div
                key={row.id}
                className={`grid items-center border-t border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                style={{ gridTemplateColumns: layout, gap: "1rem", padding: density === "compact" ? "0.5rem 1.0rem" : "0.875rem 1.5rem" }}>

                {headers.map((header) =>
                  <div
                    key={`${row.id}-${header}`}
                    className={header === "Search Volume" || header === "Keyword Difficulty" ? "text-right font-mono tabular-nums text-slate-700" : "min-w-0"}>

                    {header === "Keyword" ?
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 truncate">{String(fields[header] || "-")}</span>
                        {complete &&
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Writing Article
                          </Badge>
                        }
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteRow && onDeleteRow(tableId, row.id)}
                          title="Delete keyword">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div> :
                      header === "Select Keyword" ?
                        <Switch
                          checked={fields[header] || false}
                          onCheckedChange={(checked) =>
                            handleUpdate(tableId, row.id, header, checked)
                          }
                          className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300" /> :

                        header === "Target Market" ?
                          <MiniMultiSelect
                            options={options.tm}
                            value={fields["Target Market"] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, "Target Market", selected)} /> :

                          header === "Blog Category" ?
                            <MiniMultiSelect
                              options={options.bc}
                              value={fields["Blog Category"] || []}
                              onChange={(selected) => handleUpdate(tableId, row.id, "Blog Category", selected)} /> :

                            header === "Promoted Product" ?
                              <MiniMultiSelect
                                options={options.pp}
                                value={fields[productField] || []} // use actual linked field for display
                                onChange={(selected) => handleUpdate(tableId, row.id, productField, selected)} // write to actual field name
                              /> :
                              header === "Search Intent" ?
                                intentBadge(fields[header]) :
                                header === "Search Volume" || header === "Keyword Difficulty" ?
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
