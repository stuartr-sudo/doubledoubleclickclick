
import React, { useState, useEffect, useCallback, useRef } from "react";
import { airtableSync } from "@/api/functions";
import { User } from "@/api/entities";
import { AppSettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Users, ShieldAlert, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, Filter, Trash2, Tag, HelpCircle, Info, Key, Clock, MessageCircle } from "lucide-react";
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
  DialogFooter } from
"@/components/ui/dialog";
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
import { callPromptWebhook } from "@/api/functions";
import app from "@/api/appClient";
import { useFlashAutoTrigger } from "@/components/hooks/useFlashAutoTrigger";

// --- Configuration ---
const TABLE_IDS = {
  keywordMap: "tblDR9SmoK8wEYmnA",
  faq: "tblSDBPmucJA0Skvp",
  targetMarket: "tblhayydQ0Zq2NBR9",
  blogCategories: "tblyNaoalXlmc1pQO",
  companyProducts: "Company Products",
  companyInformation: "Company Information"
};

const GET_QUESTIONS_RATE_LIMIT = {
  limit: 3,
  windowMs: 30 * 60 * 1000
};

const KEYWORD_MAP_HEADERS = [
"Keyword",
"Flash Template",
"Get Questions",
"Search Volume",
"Actions"];


const KEYWORD_MAP_LAYOUT = "2fr 180px 200px 100px 100px";

const REQUIRED_FIELDS = ["Target Market", "Promoted Product"];

// --- Helper Functions ---
function getLabel(fields, tableContext = null) {
  if (!fields) return "(untitled)";

  if (tableContext === "companyProducts") {
    const NAME_KEYS = [
    "Page Name",
    "PageName",
    "Product Name",
    "ProductName",
    "Name",
    "Title",
    "H1",
    "SEO Title",
    "Seo Title"];


    const stripHtml = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const safeTruncate = (s, n = 80) => s.length > n ? s.slice(0, n) + "..." : s;

    for (const key of NAME_KEYS) {
      if (typeof fields[key] === "string" && fields[key]) {
        const clean = stripHtml(fields[key]);
        if (clean) return safeTruncate(clean, 80);
      }
    }

    const contentCandidates = ["Page Content", "Content", "Body", "Description"];
    for (const key of contentCandidates) {
      const raw = fields[key];
      if (!raw) continue;
      let text = String(raw);

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
        }
      }
      const clean = stripHtml(text);
      if (clean) return safeTruncate(clean, 80);
    }

    return fields.id || "(untitled)";
  }

  const PREFERRED_LABELS = ["Target Market Name", "Blog Name", "Page Name", "Name", "Title", "Keyword"];
  for (const key of PREFERRED_LABELS) {
    if (typeof fields[key] === "string" && fields[key]) return fields[key];
  }
  return fields.id || "(untitled)";
}

function getLinkedProductFieldName(fieldsObj) {
  const keys = Object.keys(fieldsObj || {});
  const lowerMap = new Map(keys.map((k) => [k.toLowerCase(), k]));
  return (
    lowerMap.get("link to company products") ||
    lowerMap.get("promoted product") ||
    lowerMap.get("promoted products") ||
    "Promoted Product");

}

const renderFieldValue = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return <span className="text-slate-500">-</span>;
  }
  return String(value);
};

// --- Main Component ---
export default function TopicsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [localSelectedUsername, setLocalSelectedUsername] = useState(null);

  const [keywordRows, setKeywordRows] = useState([]);
  const [faqRows, setFaqRows] = useState([]);
  const [options, setOptions] = useState({ tm: [], bc: [], pp: [] });

  const [loadingData, setLoadingData] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('topics_active_tab') || 'keyword_map';
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showCompleteOnly, setShowCompleteOnly] = useState(false);
  const [showManualOnly, setShowManualOnly] = useState(false);

  const [faqKeywordFilter, setFaqKeywordFilter] = useState(null);

  const [pendingUsername, setPendingUsername] = useState(null);
  const [focusQuestion, setFocusQuestion] = useState(null);
  const faqTabRef = useRef(null);

  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaqKeyword, setNewFaqKeyword] = useState("");
  const [creating, setCreating] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);
  const [currentTargetMarket, setCurrentTargetMarket] = useState(null);

  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineKeywordText, setInlineKeywordText] = useState("");
  const [inlineTarget, setInlineTarget] = useState("keyword_map");

  const [brandFieldKey, setBrandFieldKey] = useState(null);
  const [brandArray, setBrandArray] = useState([]);

  const [auxDataCache, setAuxDataCache] = useState({ tm: [], bc: [], pp: [], cacheTime: 0 });
  const CACHE_DURATION = 5 * 60 * 1000;

  const auxDataCacheRef = useRef(auxDataCache);
  useEffect(() => {
    auxDataCacheRef.current = auxDataCache;
  }, [auxDataCache]);

  const { selectedUsername: globalUsername, assignedUsernames: globalUsernames, isLoading: isWorkspaceLoading } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  const selectedUsername = useWorkspaceScoping ? globalUsername : localSelectedUsername;

  const isInitialDataLoadSuppressed = useRef(true);

  const [loadingQuestions, setLoadingQuestions] = useState({});

  const intervalRefs = useRef({});

  const [writtenByKeyword, setWrittenByKeyword] = useState({});

  const isFetchingRef = useRef(false);

  const [checkingTopicsGate, setCheckingTopicsGate] = React.useState(false); // DISABLED
  const [topicsGateSatisfied, setTopicsGateSatisfied] = React.useState(true); // ALWAYS TRUE
  const [showOnboarding, setShowOnboarding] = React.useState(false); // NEVER SHOW

  // Enable Flash Auto-Trigger: watches keywordRows for new content + Flash Template
  useFlashAutoTrigger(keywordRows, selectedUsername);

  const [onboardingCompletionTime, setOnboardingCompletionTime] = useState(null);
  const [onboardingTimeRemaining, setOnboardingTimeRemaining] = useState(0);

  const topicsGateRef = React.useRef(true);
  React.useEffect(() => {topicsGateRef.current = topicsGateSatisfied;}, [topicsGateSatisfied]);

  const pickField = useCallback((fieldsArr, candidates) => {
    const lowerMap = new Map((fieldsArr || []).map((f) => [String(f).toLowerCase(), f]));
    for (const c of candidates) {
      const hit = lowerMap.get(String(c).toLowerCase());
      if (hit) return hit;
    }
    return null;
  }, []);

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
    }
  }, []);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const uname = urlParams.get('username');
    const focus = urlParams.get('focus');
    const faqKeyword = urlParams.get('faq_keyword');

    if (tab === 'faq') {
      setActiveTab('faqs');
    }
    if (uname) {
      setPendingUsername(uname);
    }
    if (focus) {
      setFocusQuestion(focus);
      setSearchQuery(focus);
    }
    if (faqKeyword) {
      setFaqKeywordFilter(faqKeyword);
    }
  }, []);

  const formatTimeRemaining = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Countdown timer - simplified to avoid production build issues
  useEffect(() => {
    if (!selectedUsername || !currentUser) {
      setOnboardingCompletionTime(null);
      setOnboardingTimeRemaining(0);
      return;
    }

    // Safely parse topics_onboarding_completed_at
    let completedMap = {};
    const raw = currentUser?.topics_onboarding_completed_at;
    
    if (!raw) {
      setOnboardingCompletionTime(null);
      setOnboardingTimeRemaining(0);
      return;
    }

    if (typeof raw === 'string' && raw.trim()) {
      try {
        completedMap = JSON.parse(raw);
      } catch {
        setOnboardingCompletionTime(null);
        setOnboardingTimeRemaining(0);
        return;
      }
    } else if (raw && typeof raw === 'object') {
      completedMap = raw;
    }

    const completionTimeStr = completedMap[selectedUsername];
    if (!completionTimeStr) {
      setOnboardingCompletionTime(null);
      setOnboardingTimeRemaining(0);
      return;
    }

    // Calculate remaining time
    const completionMs = new Date(completionTimeStr).getTime();
    if (isNaN(completionMs)) {
      setOnboardingCompletionTime(null);
      setOnboardingTimeRemaining(0);
      return;
    }

    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    const elapsed = now - completionMs;
    const remaining = Math.max(0, fifteenMinutes - elapsed);

    setOnboardingCompletionTime(completionTimeStr);
    setOnboardingTimeRemaining(remaining);

    // Only set up interval if there's time remaining
    if (remaining > 0) {
      const timer = setInterval(() => {
        const currentNow = Date.now();
        const currentElapsed = currentNow - completionMs;
        const currentRemaining = Math.max(0, fifteenMinutes - currentElapsed);
        
        setOnboardingTimeRemaining(currentRemaining);
        
        if (currentRemaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [selectedUsername, currentUser]);

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (useWorkspaceScoping) {
          setAvailableUsernames(globalUsernames || []);
        } else {
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

  // DISABLED: Topics onboarding modal completely removed
  React.useEffect(() => {
    // Always satisfied, never show onboarding
    setTopicsGateSatisfied(true);
    setShowOnboarding(false);
    setCheckingTopicsGate(false);
  }, [selectedUsername]);

  useEffect(() => {
    sessionStorage.setItem('topics_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const onScroll = () => sessionStorage.setItem('topics_scroll', String(window.scrollY || 0));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('topics_scroll');
    if (saved) {
      const y = parseInt(saved, 10);
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    }
  }, [activeTab, selectedUsername, loadingData]);

  const loadDataForUser = useCallback(async (username) => {
    if (!topicsGateRef.current) {
      setLoadingData(false);
      isFetchingRef.current = false;
      console.log("TopicsPage: loadDataForUser blocked by topics gate.");
      return;
    }

    if (!username) return;

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoadingData(true);
    setError(null);

    try {
      const listWithFilter = async (tableIdOrName, formula) => {
        const params = { action: "listAll", tableId: tableIdOrName };
        if (formula) params.filterByFormula = formula;
        const response = await airtableSync(params);
        if (!response.success) throw new Error(response.error || `Failed to load table ${tableIdOrName}`);
        return response.records || [];
      };

      const sanitizedUsername = username.replace(/'/g, "\\'");
      const usernameFormula = `{Username} = '${sanitizedUsername}'`;

      const productFormula = `{Client Username} = '${sanitizedUsername}'`;

      const mainDataPromise = Promise.all([
      listWithFilter(TABLE_IDS.keywordMap, usernameFormula),
      listWithFilter(TABLE_IDS.faq, usernameFormula)]
      );

      const now = Date.now();
      const cacheSnapshot = auxDataCacheRef.current || { tm: [], bc: [], pp: [], cacheTime: 0 };
      const shouldRefreshCache =
      now - (cacheSnapshot.cacheTime || 0) > CACHE_DURATION ||
      (cacheSnapshot.tm?.length || 0) === 0 ||
      (cacheSnapshot.bc?.length || 0) === 0 ||
      (cacheSnapshot.pp?.length || 0) === 0;

      let auxDataPromise;
      if (shouldRefreshCache) {
        auxDataPromise = Promise.allSettled([
        listWithFilter(TABLE_IDS.targetMarket, usernameFormula),
        listWithFilter(TABLE_IDS.blogCategories, usernameFormula),
        listWithFilter(TABLE_IDS.companyProducts, productFormula)]
        ).then(async (results) => {
          let tmArr = results[0].status === "fulfilled" ? results[0].value || [] : [];
          let bcArr = results[1].status === "fulfilled" ? results[1].value || [] : [];
          let ppArr = results[2].status === "fulfilled" ? results[2].value || [] : [];

          if (ppArr.length === 0 && results[2].status === "rejected") {
            try {
              ppArr = await listWithFilter(TABLE_IDS.companyProducts, usernameFormula);
            } catch {
            }
          }
          if (ppArr.length === 0) {
            try {
              const allProducts = await listWithFilter(TABLE_IDS.companyProducts, null);
              const keyCandidates = ["client_username", "client username", "username", "user_name", "user"];
              ppArr = (allProducts || []).filter((r) => {
                const f = r?.fields || {};
                const lower = Object.fromEntries(Object.entries(f).map(([k, v]) => [String(k).toLowerCase(), v]));
                let val = null;
                for (const k of keyCandidates) {
                  if (lower.hasOwnProperty(k)) {val = lower[k];break;}
                }
                if (Array.isArray(val)) return val.includes(username);
                return String(val || "") === username;
              });
            } catch {
            }
          }
          return { tmArr, bcArr, ppArr, cacheTime: now };
        });
      } else {
        auxDataPromise = Promise.resolve({
          tmArr: cacheSnapshot.tm || [],
          bcArr: cacheSnapshot.bc || [],
          ppArr: cacheSnapshot.pp || [],
          cacheTime: cacheSnapshot.cacheTime || now
        });
      }

      const [mainData, auxData] = await Promise.all([mainDataPromise, auxDataPromise]);
      const [keywords, faqs] = mainData;
      const { tmArr, bcArr, ppArr, cacheTime } = auxData;

      if (shouldRefreshCache) {
        const nextCache = { tm: tmArr, bc: bcArr, pp: ppArr, cacheTime };
        auxDataCacheRef.current = nextCache;
        setAuxDataCache(nextCache);
      }

      const manualSet = getManualKwSet();
      
      // Ensure keywords and faqs are arrays
      const safeKeywords = Array.isArray(keywords) ? keywords : [];
      const safeFaqs = Array.isArray(faqs) ? faqs : [];
      
      const processedKeywords = safeKeywords.map((r) =>
        manualSet.has(r.id) ? { ...r, __manualAdded: true } : r
      );

      setKeywordRows(processedKeywords);
      setFaqRows(safeFaqs);
      setOptions({
        tm: tmArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "targetMarket") })),
        bc: bcArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "blogCategories") })),
        pp: ppArr.map((r) => ({ value: r.id, label: getLabel(r.fields, "companyProducts") }))
      });

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
      isFetchingRef.current = false;
    }
  }, [getManualKwSet, CACHE_DURATION, topicsGateRef]);

  useEffect(() => {
    if (selectedUsername && topicsGateSatisfied) {
      // ALWAYS load data when username is selected - NO SUPPRESSION
      loadDataForUser(selectedUsername);
    } else if (!selectedUsername) {
      setKeywordRows([]);
      setFaqRows([]);
      setLoadingData(false);
    }
  }, [selectedUsername, loadDataForUser, topicsGateSatisfied]);

  const handleUsernameSelect = React.useCallback((username) => {
    setLocalSelectedUsername(username);
  }, []);

  const updateWrittenStatus = React.useCallback(async (username) => {
    if (!username) {
      setWrittenByKeyword({});
      return;
    }
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

  React.useEffect(() => {
    if (!selectedUsername || !topicsGateSatisfied) {
      setWrittenByKeyword({});
      return;
    }
    updateWrittenStatus(selectedUsername);
    const id = setInterval(() => updateWrittenStatus(selectedUsername), 15000);
    return () => clearInterval(id);
  }, [selectedUsername, updateWrittenStatus, topicsGateSatisfied]);

  useEffect(() => {
    if (!pendingUsername || !availableUsernames || availableUsernames.length === 0) return;
    if (availableUsernames.includes(pendingUsername)) {
      if (useWorkspaceScoping) {
      } else {handleUsernameSelect(pendingUsername);}
      setPendingUsername(null);
    }
  }, [availableUsernames, pendingUsername, handleUsernameSelect, useWorkspaceScoping]);

  useEffect(() => {
    if (activeTab !== 'faqs' || !focusQuestion) return;
    if (!faqTabRef.current) return;
    const t = setTimeout(() => {
      const root = faqTabRef.current;
      const all = Array.from(root.querySelectorAll('li, tr, div'));
      const target = all.find((el) => (el.textContent || '').toLowerCase().includes(focusQuestion.toLowerCase()));
      if (target) {
        target.classList.add('ring-2', 'ring-emerald-400', 'rounded-md', 'bg-emerald-500/10');
        try {target.scrollIntoView({ behavior: 'smooth', block: 'center' });} catch (e) {console.error("Scroll failed:", e);}
        setTimeout(() => {
          target.classList.remove('ring-2', 'ring-emerald-400', 'rounded-md', 'bg-emerald-500/10');
        }, 4500);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [activeTab, faqRows, loadingData, focusQuestion, searchQuery]);

  const isComplete = useCallback((fields) => {
    const tm = fields?.["Target Market"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
    Array.isArray(pp) && pp.length > 0;
  }, []);

  const { consumeTokensForFeature } = useTokenConsumption();

  const handleUpdate = useCallback(async (tableId, recordId, fieldName, newValue) => {
    const isKeywordMap = tableId === TABLE_IDS.keywordMap;
    const stateSetter = isKeywordMap ? setKeywordRows : setFaqRows;

    const writeFieldName = fieldName === "Get Questions" ? "Select Keyword" : fieldName;

    // Log the update for debugging
    console.log('[Topics] handleUpdate called:', {
      tableId,
      recordId,
      fieldName,
      newValue,
      valueType: Array.isArray(newValue) ? `array[${newValue.length}]` : typeof newValue
    });

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
        return;
      }

      const newTimestamps = [...recentTimestamps, now];
      localStorage.setItem(rateLimitKey, JSON.stringify(newTimestamps));

      await consumeTokensForFeature("topics_get_questions");

      if (intervalRefs.current[recordId]) {
        clearInterval(intervalRefs.current[recordId]);
        delete intervalRefs.current[recordId];
      }

      setLoadingQuestions((prev) => ({
        ...prev,
        [recordId]: { loading: true, startTime: Date.now() }
      }));

      let secondsElapsed = 0;
      const totalSeconds = 60;

      const newIntervalId = setInterval(() => {
        secondsElapsed++;
        if (secondsElapsed >= totalSeconds) {
          clearInterval(intervalRefs.current[recordId]);
          delete intervalRefs.current[recordId];
          setLoadingQuestions((prevLoading) => {
            const updated = { ...prevLoading };
            delete updated[recordId];
            return updated;
          });
        }
      }, 1000);

      intervalRefs.current[recordId] = newIntervalId;
    } else if (fieldName === "Get Questions" && newValue === false) {
      if (intervalRefs.current[recordId]) {
        clearInterval(intervalRefs.current[recordId]);
        delete intervalRefs.current[recordId];
      }

      setLoadingQuestions((prev) => {
        const newState = { ...prev };
        delete newState[recordId];
        return newState;
      });
    }

    let fullyUpdatedRowFields = null;
    let becameComplete = false;

    stateSetter((currentRows) =>
    currentRows.map((row) => {
      if (row.id === recordId) {
        const wasCompleteBefore = isComplete(row.fields || {});
        const updatedFields = { ...row.fields, [writeFieldName]: newValue };
        fullyUpdatedRowFields = updatedFields;
        const nowComplete = isComplete(updatedFields || {});
        becameComplete = !wasCompleteBefore && nowComplete;
        return { ...row, fields: updatedFields };
      }
      return row;
    })
    );

    const canonicalLower = String(fieldName).toLowerCase();
    const isRequiredSpecial = ["target market", "promoted product", "link to company products"].includes(canonicalLower);

    let finalWriteFieldName = writeFieldName;
    if (canonicalLower.includes("promoted") || canonicalLower.includes("company products")) {
      const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {});
      if (ppKey && ppKey !== writeFieldName) {
        finalWriteFieldName = ppKey;
      }
    }

    if (isRequiredSpecial) {
      if (fullyUpdatedRowFields) {
        const tmKey = Object.keys(fullyUpdatedRowFields).find((k) => k.toLowerCase() === "target market") || "Target Market";
        const ppKey = getLinkedProductFieldName(fullyUpdatedRowFields || {});

        const isNowComplete =
        Array.isArray(fullyUpdatedRowFields[tmKey]) && fullyUpdatedRowFields[tmKey].length > 0 &&
        ppKey && Array.isArray(fullyUpdatedRowFields[ppKey]) && fullyUpdatedRowFields[ppKey].length > 0;

        if (becameComplete) {
          await consumeTokensForFeature("topics_assignment_complete");
        }

        // ALWAYS update Airtable, whether complete or not (handles deselections)
        const fieldsToUpdate = {
          [finalWriteFieldName]: newValue
        };

        console.log('[Topics] Syncing to Airtable:', {
          recordId,
          fieldsToUpdate,
          isNowComplete
        });

        await airtableSync({
          action: "updateRecord",
          tableId,
          recordId,
          fields: fieldsToUpdate
        });

        console.log('[Topics] Airtable sync complete');
        return;
      }

      console.log('[Topics] Syncing to Airtable (fallback):', {
        recordId,
        field: finalWriteFieldName,
        value: newValue
      });

      await airtableSync({
        action: "updateRecord",
        tableId,
        recordId,
        fields: { [finalWriteFieldName]: newValue }
      });
      return;
    }

    console.log('[Topics] Syncing to Airtable (non-special field):', {
      recordId,
      field: finalWriteFieldName,
      value: newValue
    });

    await airtableSync({
      action: "updateRecord",
      tableId,
      recordId,
      fields: { [finalWriteFieldName]: newValue }
    });
  }, [currentUser, consumeTokensForFeature]);

  const refreshData = useCallback(() => {
    const cleared = { tm: [], bc: [], pp: [], cacheTime: 0 };
    auxDataCacheRef.current = cleared;
    setAuxDataCache(cleared);
    isInitialDataLoadSuppressed.current = false;
    if (selectedUsername) {
      loadDataForUser(selectedUsername);
    }
  }, [selectedUsername, loadDataForUser]);

  useEffect(() => {
    const handler = () => refreshData();
    window.addEventListener('topicsRefreshRequested', handler);
    return () => window.removeEventListener('topicsRefreshRequested', handler);
  }, [refreshData]);

  const handleCreateKeyword = async (textOverride) => {
    const text = (textOverride ?? newKeyword)?.trim();
    if (!selectedUsername || !text) return;
    setCreating(true);
    setError(null);
    try {
      const { data: listRes } = await airtableListFields({
        tableId: TABLE_IDS.keywordMap,
        sampleSize: 1
      });

      const available = listRes?.fields || [];

      const usernameKey = pickField(available, ["Username", "username", "user_name", "client_username", "User", "user"]);
      const keywordKey = pickField(available, ["Keyword", "Name", "Title"]);
      const selectKey = pickField(available, ["Select Keyword", "Select", "Selected"]);
      const getQuestionsKey = pickField(available, ["Get Questions", "Get_Questions"]);

      const brandFieldCandidate = pickField(available, ["Brand ID", "brand id", "BrandID", "Brand Name", "brand name", "Brand", "brand"]);
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
      if (getQuestionsKey) fieldsPayload[getQuestionsKey] = false;

      fieldsPayload["Username"] = selectedUsername;

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
          __manualAdded: true,
          fields: {
            ...data.record.fields,
            "Target Market": data.record.fields["Target Market"] || [],
            [getLinkedProductFieldName(data.record.fields)]: data.record.fields[getLinkedProductFieldName(data.record.fields)] || []
          }
        };
        const setObj = getManualKwSet();
        setObj.add(newRecord.id);
        saveManualKwSet(setObj);

        setKeywordRows((prev) => [newRecord, ...prev]);

        setShowAddKeyword(false);
        setNewKeyword("");
        setActiveTab("keyword_map");
        setSearchQuery("");

        if (brandTargetField && fieldsPayload[brandTargetField]) {
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

  const handleCreateFaq = async (textOverride) => {
    const text = (textOverride ?? newFaqKeyword)?.trim();
    if (!selectedUsername || !text) return;
    setCreating(true);
    setError(null);
    try {
      const { data: listRes } = await airtableListFields({
        tableId: TABLE_IDS.faq,
        sampleSize: 1
      });

      const available = listRes?.fields || [];

      const usernameKey = pickField(available, ["Username", "username", "user_name", "client_username", "User", "user"]);
      const keywordKey = pickField(available, ["Keyword", "Question", "Title", "Name"]);

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

      fieldsPayload["Username"] = selectedUsername;

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
        setShowAddFaq(false);
        setNewFaqKeyword("");
        setActiveTab("faqs");
        setSearchQuery("");

        if (brandTargetField && fieldsPayload[brandTargetField]) {
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

  const handleCreateArticle = useCallback(async (question) => {
    try {
      const currentUser = await User.me();
      const timestamps = Array.isArray(currentUser.article_creation_timestamps) ?
      currentUser.article_creation_timestamps :
      [];

      const now = Date.now();
      const thirtyMinsAgo = now - 30 * 60 * 1000;

      const recentCreations = timestamps.filter((ts) => {
        const timestamp = new Date(ts).getTime();
        return timestamp > thirtyMinsAgo;
      });

      if (recentCreations.length >= 5) {
        toast.info("Your content queue is full! Our AI agents are busy writing your articles. Please check back in a few minutes.");
        return;
      }

      setIsCreatingArticle(true);

      const payload = {
        user_name: selectedUsername,
        target_market: currentTargetMarket || undefined,
        question_id: question.id,
        question_text: question.question
      };

      const { data } = await callPromptWebhook(payload);

      if (data?.success && data?.webhook_id) {
        const updatedTimestamps = [...timestamps, new Date().toISOString()];
        await User.updateMyUserData({ article_creation_timestamps: updatedTimestamps });

        toast.success("Article created! Redirecting to editor...");
        setTimeout(() => {
          window.location.href = createPageUrl(`Editor?webhook=${data.webhook_id}`);
        }, 500);
      } else {
        throw new Error(data?.error || "Failed to create article");
      }
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error(error.message || "Failed to create article");
    } finally {
      setIsCreatingArticle(false);
    }
  }, [selectedUsername, currentTargetMarket, setIsCreatingArticle]);


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

  const handleViewQuestions = useCallback((keyword) => {
    setActiveTab('faqs');
    setFaqKeywordFilter(keyword);
    setSearchQuery("");
  }, []);

  const guardedHandleViewQuestions = useCallback(async (keyword) => {
    handleViewQuestions(keyword);
  }, [handleViewQuestions]);

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

    if (selectedUsername) updateWrittenStatus(selectedUsername);
  };

  const filteredKeywordRows = React.useMemo(() => {
    if (!Array.isArray(keywordRows)) return [];
    let rows = [...keywordRows];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    if (showSelectedOnly) {
      rows = rows.filter((r) => !!r?.fields?.["Select Keyword"]);
    }
    if (showCompleteOnly) {
      rows = rows.filter((r) => isComplete(r?.fields || {}));
    }
    if (showManualOnly) {
      rows = rows.filter((r) => r.__manualAdded);
    }
    return rows;
  }, [keywordRows, searchQuery, showSelectedOnly, showCompleteOnly, showManualOnly, isComplete]);

  const filteredFaqRows = React.useMemo(() => {
    if (!Array.isArray(faqRows)) return [];
    let rows = [...faqRows];

    if (faqKeywordFilter) {
      rows = rows.filter((r) => (r?.fields?.['Top Level Keyword'] || []).includes(faqKeywordFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => String(r?.fields?.["Keyword"] || "").toLowerCase().includes(q));
    }
    return rows;
  }, [faqRows, searchQuery, faqKeywordFilter]);


  const renderPageBody = (() => {
    if (loadingInitial || useWorkspaceScoping && isWorkspaceLoading) {
      return (
        <div className="text-center py-12 text-slate-600 flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
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

    if (onboardingTimeRemaining > 0) {
      return (
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center bg-white rounded-2xl border-2 border-slate-200 p-12 shadow-lg max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Processing Your Topics</h2>
            <p className="text-slate-600 mb-8">
              Our AI is analyzing your keywords and preparing personalized recommendations.
            </p>
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {formatTimeRemaining(onboardingTimeRemaining)}
            </div>
            <div className="text-sm text-slate-500">time remaining</div>
          </div>
        </div>
      );
    }

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

    // Show empty state if no keywords and no FAQs
    if (keywordRows.length === 0 && faqRows.length === 0 && !loadingData) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Tag className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Keywords Yet</h3>
          <p className="text-slate-600 mb-4">
            Start by adding keywords to track content topics for {selectedUsername}.
          </p>
          <p className="text-sm text-slate-500">
            Keywords will appear here once they're synced from Airtable or added manually.
          </p>
        </div>
      );
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
              value="faqs"
              className="rounded-lg text-slate-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-colors">

              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Questions</span>
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
              layout={KEYWORD_MAP_LAYOUT}
              loadingQuestions={loadingQuestions}
              handleViewQuestions={guardedHandleViewQuestions}
              writtenByKeyword={writtenByKeyword} />


          </TabsContent>

          <TabsContent
            value="faqs"
            className="rounded-xl border border-slate-200 bg-white overflow-x-auto">

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
      </div>);

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
        onCompleted={async (websiteUrl) => {
          const me = await User.me().catch(() => null);
          if (me) {
            const arr = Array.isArray(me.topics) ? me.topics : [];
            const uname = selectedUsername || null;
            if (uname) {
              const updatedTopics = [...arr, uname];
              const completionTimestamp = new Date().toISOString();

              const existingCompletionTimestamps = me.topics_onboarding_completed_at ?
              typeof me.topics_onboarding_completed_at === 'string' ?
              JSON.parse(me.topics_onboarding_completed_at) :
              me.topics_onboarding_completed_at :
              {};

              const updatedCompletionTimestamps = {
                ...existingCompletionTimestamps,
                [uname]: completionTimestamp
              };

              await User.updateMyUserData({
                topics: updatedTopics,
                topics_onboarding_completed_at: JSON.stringify(updatedCompletionTimestamps)
              });

              setCurrentUser((prev) => ({
                ...prev,
                topics: updatedTopics,
                topics_onboarding_completed_at: JSON.stringify(updatedCompletionTimestamps)
              }));

              setTopicsGateSatisfied(true);
              setShowOnboarding(false);

              toast.success(`Topics onboarding complete for ${uname}. Processing keywords...`);
            }
          }
        }} />


      {topicsGateSatisfied &&
      <div className="w-full px-6">
          {onboardingTimeRemaining > 0 &&
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Onboarding Complete! Questions will be available in {formatTimeRemaining(onboardingTimeRemaining)}.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This 15-minute timer starts after you complete the onboarding process. Data will refresh automatically.
                  </p>
                </div>
              </div>
            </div>
        }

          <div className="bg-white border border-slate-200 rounded-xl p-2 mb-2">
            <div className="flex items-center gap-1 flex-nowrap">
              <span className="text-sm font-semibold text-slate-900 mr-2">Topics</span>

              <div className="h-5 w-px bg-slate-200" />

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

              {!useWorkspaceScoping && <div className="h-5 w-px bg-slate-200" />}

              <div className="relative">
                <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 w-[180px] h-8 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 text-sm" />
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="h-5 w-px bg-slate-200" />

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
                <Button
                onClick={() => setShowInlineAdd((v) => !v)}
                disabled={!selectedUsername}
                size="sm" className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 gap-2 h-8 bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-slate-950 hover:to-indigo-950 hover:scale-102 text-white text-sm animate-[subtle-pulse_3s_ease-in-out_infinite] hover:animate-none">


                  <Plus className="w-4 h-4" />
                  Add Keyword
                </Button>
              </div>
            </div>
          </div>

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
              onClick={() => {setShowInlineAdd(false);setNewKeyword("");setNewFaqKeyword("");setInlineKeywordText("");setInlineTarget("keyword_map");}}
              className="h-8 bg-white border-slate-300 text-slate-900 hover:bg-slate-50">

                  Cancel
                </Button>
              </div>
            </div>
        }

          {renderPageBody}
        </div>
      }

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
        onClose={() => {if (!deleteLoading) setDeleteTarget(null);}}
        title="Delete record"
        description="Are you sure you want to delete this record? This action cannot be undone." />

    </div>);

}

// --- Reusable DataTable Component (for Keyword Map) ---
const DataTable = ({ rows, headers, layout, tableId, options, handleUpdate, density = "comfortable", onDeleteRow, loadingQuestions, handleViewQuestions, writtenByKeyword }) => {
  const [svSort, setSvSort] = React.useState(null);

  const toggleSvSort = () => {
    setSvSort((prev) => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
  };

  const parseNum = (val) => {
    if (val == null || val === "") return Number.NaN;
    if (typeof val === "number") return val;
    const n = parseFloat(String(val).replace(/,/g, ""));
    return isNaN(n) ? Number.NaN : n;
  };

  const sortedRows = React.useMemo(() => {
    let list = [...rows];
    list.sort((a, b) => {
      const ma = a.__manualAdded ? 1 : 0;
      const mb = b.__manualAdded ? 1 : 0;

      if (ma !== mb) return mb - ma;

      if (!svSort) return 0;

      const av = parseNum(a?.fields?.["Search Volume"]);
      const bv = parseNum(b?.fields?.["Search Volume"]);
      const aVal = isNaN(av) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : av;
      const bVal = isNaN(bv) ? svSort === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : bv;
      return svSort === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [rows, svSort]);

  const formatNumber = (val) => {
    if (val == null || val === "") return "-";
    const n = typeof val === "number" ? val : parseFloat(String(val).toString().replace(/,/g, ""));
    if (isNaN(n)) return String(n);
    return n.toLocaleString();
  };

  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isInteractive = (target) =>
    !!(target && target.closest('button, [role="button"], a, input, select, textarea, [contenteditable="true"]'));

    const onWheel = (e) => {
      const canScrollX = el.scrollWidth > el.clientWidth;
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

      if (!canScrollX) {
        return;
      }

      if (!horizontalIntent) {
        return;
      }

      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;

      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if (atLeft && delta < 0 || atRight && delta > 0) {
        return;
      }

      el.scrollLeft += delta;
      e.preventDefault();
    };

    let isDown = false;
    let isPanning = false;
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (isInteractive(e.target)) return;
      isDown = true;
      isPanning = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!isPanning && Math.abs(dx) > 3) {
        isPanning = true;
      }
      if (isPanning) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault();
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
    window.addEventListener("pointermove", onPointerMove, { passive: false });
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
      style={{ touchAction: "pan-x pan-y" }}
      aria-label="Keyword table horizontal scroller">

      <div className="w-full">
        <div
          className="grid text-xs font-semibold tracking-wide text-slate-600 uppercase bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm"
          style={{ gridTemplateColumns: layout, gap: "1.5rem", padding: "0.5rem 1.5rem" }}>

          {headers.map((header) =>
          <div
            key={header}
            className={header === "Search Volume" ? "text-right" : header === "Actions" ? "text-center" : "whitespace-nowrap"}>

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

        <div className="text-sm text-slate-900">
          {sortedRows.map((row, idx) => {
            const fields = row.fields || {};
            const complete = isComplete(fields);
            const keywordText = String(fields["Keyword"] || "").trim();
            const keywordKey = keywordText.toLowerCase();
            const postId = writtenByKeyword ? writtenByKeyword[keywordKey] : null;

            const isToggled = fields["Select Keyword"] || false;
            const isLoading = loadingQuestions[row.id]?.loading;
            const canShowButton = isToggled && !isLoading;


            return (
              <div
                key={row.id}
                className={`grid items-center border-t border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                style={{ gridTemplateColumns: layout, gap: "1.5rem", padding: density === "compact" ? "0.5rem 1.5rem" : "1rem 2rem" }}>

                {headers.map((header) =>
                <div
                  key={`${row.id}-${header}`}
                  className={header === "Search Volume" ? "text-right font-mono tabular-nums text-slate-700" : header === "Actions" ? "text-center" : "min-w-0"}>

                    {header === "Keyword" ?
                  <div className="flex items-center gap-2">
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
                      </div> :
                  header === "Flash Template" ?
                  <Select
                    value={fields["Flash Template"] || "None"}
                    onValueChange={(value) => handleUpdate(tableId, row.id, "Flash Template", value)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Product Review">Product Review</SelectItem>
                      <SelectItem value="How-To Guide">How-To Guide</SelectItem>
                      <SelectItem value="Listicle">Listicle</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="News & Blog">News & Blog</SelectItem>
                    </SelectContent>
                  </Select> :
                  header === "Get Questions" ?
                  <div className="flex items-center gap-2">
                          <Switch
                      checked={isToggled}
                      onCheckedChange={(checked) =>
                      handleUpdate(tableId, row.id, "Get Questions", checked)
                      } className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white"

                      style={{
                        '--switch-thumb': isToggled ? '#ffffff' : '#64748b'
                      }} />

                          {isLoading &&
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Searching...</span>
                            </div>
                    }
                          {canShowButton &&
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewQuestions(fields["Keyword"])}
                      className="text-xs px-2 py-1 h-6 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                              View Questions
                            </Button>
                    }
                        </div> :
                  header === "Search Volume" ?
                  <span>{formatNumber(fields[header])}</span> :
                  header === "Actions" ?
                  <Button
                    variant="ghost"
                    size="icon" className="text-red-600 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-8 w-8 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteRow && onDeleteRow(tableId, row.id)}
                    title="Delete keyword">
                              <Trash2 className="w-4 h-4" />
                            </Button> :
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