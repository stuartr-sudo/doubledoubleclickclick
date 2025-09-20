
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { publishContentToCms } from "@/api/functions";
import { testContentCmsConnection } from "@/api/functions";
import { Globe, Save, HelpCircle, Image as ImageIcon, Loader2, PlugZap, Link, Trash2, Terminal } from "lucide-react";
import ImageLibraryModal from "./ImageLibraryModal";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Username } from "@/api/entities";
import { BlogCategory } from "@/api/entities"; // Added import

const providers = [
  { key: "notion", label: "Notion" },
  { key: "shopify", label: "Shopify" },
  { key: "webhook", label: "Webhook" },
  { key: "webflow", label: "Webflow" },
  { key: "wordpress", label: "WordPress" }
];

// Helper to extract first image URL from HTML
function extractFirstImageUrl(html) {
  try {
    const m = String(html || '').match(/<img[^>]*src=["']([^"']+)["']/i);
    return m && m[1] ? m[1] : '';
  } catch {
    return '';
  }
}

export default function PublishToCMSModal({ isOpen, onClose, title, html }) {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("notion");
  const [credentials, setCredentials] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setPublishing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [allowedUsernames, setAllowedUsernames] = useState([]);

  // NEW: Shopify blogs list and related state
  const [shopifyBlogs, setShopifyBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [publishBlogId, setPublishBlogId] = useState(""); // NEW: blog to publish to (overrides credential)

  // NEW: categories for selected credential's username
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // New credential form state
  const [form, setForm] = useState({
    provider: "notion",
    name: "",
    site_domain: "",
    access_token: "",
    database_id: "",
    collection_id: "",
    blog_id: "",
    username: "",
    password: "",
    user_name: "",
    // NEW webhook fields
    endpoint_url: "",
    http_method: "POST",
    header_key: "X-Webhook-Secret",
    header_value: ""
  });

  const [coverUrl, setCoverUrl] = useState("");
  const [shopifyImageUrl, setShopifyImageUrl] = useState("");
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  const [notionFix, setNotionFix] = useState({ suggestions: [], message: '', selected: '', manualDbId: '' });

  // Helper to normalize Notion IDs from URL or raw
  const normalizeNotionIdLocal = (s) => {
    const raw = String(s || '').trim();
    if (!raw) return '';
    // Regex to match Notion database IDs from various URL formats or raw ID
    const urlMatch = raw.match(/(?:notion\.so\/)[^/]+\/([a-fA-F0-9]{32})(?:\?|#|$)/);
    const idFromUrl = urlMatch ? urlMatch[1] : null;

    const hex = (idFromUrl || raw).replace(/[^a-fA-F0-9]/g, '');
    if (hex.length >= 32) {
      const h = hex.slice(-32);
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`.toLowerCase();
    }
    return raw;
  };

  // NEW: Helper to normalize Shopify domain
  const normalizeShopDomain = (d) => String(d || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  useEffect(() => {
    if (!isOpen) {
      // Clear all state when modal closes
      setUser(null);
      setActive("notion");
      setCredentials([]);
      setSelectedId("");
      setIsSaving(false);
      setPublishing(false);
      setIsTesting(false);
      setForm({
        provider: "notion",
        name: "",
        site_domain: "",
        access_token: "",
        database_id: "",
        collection_id: "",
        blog_id: "",
        username: "",
        password: "",
        user_name: "",
        endpoint_url: "",
        http_method: "POST",
        header_key: "X-Webhook-Secret",
        header_value: ""
      });
      setCoverUrl("");
      setShopifyImageUrl("");
      setShowImageLibrary(false);
      setNotionFix({ suggestions: [], message: '', selected: '', manualDbId: '' });
      setAllowedUsernames([]);
      // NEW: Clear Shopify-specific states
      setShopifyBlogs([]);
      setLoadingBlogs(false);
      setPublishBlogId("");
      // NEW: Clear category states
      setCategoryOptions([]);
      setLoadingCategories(false);
      setSelectedCategoryId("");
      return;
    }
    (async () => {
      try {
        const u = await User.me();
        setUser(u);

        // Load allowed usernames (admins see all active; non-admins see assigned ∩ active)
        let allowed = [];
        try {
          const allUsernames = await Username.list("-created_date").catch(() => []);
          const activeUsernames = (allUsernames || []).filter(x => x.is_active !== false).map(x => x.user_name);
          const isSuper =
            u?.role === "admin" ||
            u?.access_level === "full" ||
            u?.is_superadmin === true ||
            u?.show_publish_options === true;

          if (isSuper) {
            allowed = Array.from(new Set(activeUsernames)).sort();
          } else {
            const assigned = Array.isArray(u?.assigned_usernames) ? u.assigned_usernames : [];
            const activeSet = new Set(activeUsernames);
            allowed = assigned.filter(n => activeSet.has(n)).sort();
          }
        } catch {
          allowed = [];
        }
        setAllowedUsernames(allowed);
        setForm(prev => ({
          ...prev,
          user_name: prev.user_name && allowed.includes(prev.user_name) ? prev.user_name : (allowed[0] || "")
        }));

        // Load credentials and filter for non-admins by allowed usernames
        const all = await IntegrationCredential.list("-updated_date");
        const isSuperAdmin =
          u?.role === "admin" ||
          u?.access_level === "full" ||
          u?.is_superadmin === true ||
          u?.show_publish_options === true;

        let filtered = all;
        if (!isSuperAdmin) {
          const allowSet = new Set(allowed);
          filtered = all.filter(c => !!c.user_name && allowSet.has(c.user_name));
        }
        setCredentials(filtered);

        // REMOVED: auto-creating a private username/credential and auto-assigning it to the user
        // This preserves manual username management as before.
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-detect first image in the HTML to prefill cover
  useEffect(() => {
    if (!isOpen) return;
    const firstImage = extractFirstImageUrl(html);
    setCoverUrl(firstImage || "");
    setShopifyImageUrl(firstImage || ""); // Also set for Shopify
  }, [isOpen, html]);

  // When connection changes, prefill manualDbId with the saved DB id so user can confirm/override
  useEffect(() => {
    if (!isOpen) return;
    const cred = credentials.find(c => c.id === selectedId);
    const currentDb = cred?.database_id || '';
    setNotionFix((prev) => ({ ...prev, manualDbId: currentDb || prev.manualDbId || '' }));
  }, [isOpen, selectedId, credentials]);

  // NEW: When switching provider/credential, seed publishBlogId from selected credential
  useEffect(() => {
    if (!isOpen) return;
    if (active !== "shopify") return;
    const cred = credentials.find(c => c.id === selectedId);
    setPublishBlogId(cred?.blog_id ? String(cred.blog_id) : "");
  }, [isOpen, active, selectedId, credentials]);

  // NEW: auto-load Shopify blogs when a Shopify connection is selected
  useEffect(() => {
    if (!isOpen) return;
    if (active !== "shopify") return;
    if (!selectedId) return; // Only fetch if a credential is selected
    // Automatically fetch blogs for the selected credential so the dropdown is ready
    fetchShopifyBlogs("selected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, active, selectedId]);

  // NEW: Load categories for the selected credential's username
  useEffect(() => {
    if (!isOpen) return;
    if (active !== "shopify") return;
    const cred = credentials.find(c => c.id === selectedId);
    const uname = cred?.user_name;
    if (!uname) {
      setCategoryOptions([]);
      setSelectedCategoryId("");
      return;
    }
    (async () => {
      setLoadingCategories(true);
      try {
        const cats = await BlogCategory.filter({ user_name: uname, is_active: true }, "-name");
        setCategoryOptions(cats || []);
        // Auto-pick first if none selected and categories exist
        if (!selectedCategoryId && cats && cats.length > 0) {
          setSelectedCategoryId(String(cats[0].id));
        } else if (selectedCategoryId && !cats.some(cat => String(cat.id) === String(selectedCategoryId))) {
          // If current selected category is not in the new list, clear it or pick first
          setSelectedCategoryId(cats && cats.length > 0 ? String(cats[0].id) : "");
        }
      } catch (e) {
        console.error("Error loading blog categories:", e);
        setCategoryOptions([]);
        setSelectedCategoryId("");
      }
      setLoadingCategories(false);
    })();
  }, [isOpen, active, selectedId, credentials, selectedCategoryId]);


  // Disabled: previously auto-created "private-..." username and auto-assigned to user.
  // Keeping a no-op to avoid accidental calls and preserve old behavior.
  const ensurePrivateWebhookConnection = async (u, allowedNames = [], existingCreds = []) => {
    return; // intentionally no-op
  };

  const options = useMemo(() => {
    return credentials.filter(c => c.provider === active);
  }, [credentials, active]);

  const resetForm = () => setForm({
    provider: active, // Reset with current active provider
    name: "",
    site_domain: "",
    access_token: "",
    database_id: "",
    collection_id: "",
    blog_id: "",
    username: "",
    password: "",
    user_name: allowedUsernames[0] || "",
    endpoint_url: "",
    http_method: "POST",
    header_key: "X-Webhook-Secret",
    header_value: ""
  });

  // Fetch Shopify blogs using either selected credential or the form entries (Step 2)
  const fetchShopifyBlogs = async (source = "selected") => {
    try {
      setLoadingBlogs(true);
      let domain = "";
      let token = "";
      if (source === "selected") {
        const cred = credentials.find(c => c.id === selectedId);
        domain = cred?.site_domain || "";
        token  = cred?.access_token || "";
      } else { // source === "form"
        domain = form.site_domain || "";
        token  = form.access_token || "";
      }

      const shop = normalizeShopDomain(domain);
      if (!shop || !token) {
        try { toast.error("Enter a valid Store Domain and Admin API Access Token first."); } catch {}
        setLoadingBlogs(false);
        return;
      }

      const res = await fetch(`https://${shop}/admin/api/2023-10/blogs.json`, {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        }
      });
      const text = await res.text();
      if (!res.ok) {
        try { toast.error("Failed to load blogs from Shopify", { description: text || `HTTP ${res.status} error` }); } catch {}
        setLoadingBlogs(false);
        return;
      }
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }
      const blogs = Array.isArray(data?.blogs) ? data.blogs : [];
      setShopifyBlogs(blogs.map(b => ({ id: String(b.id), title: b.title || b.handle || b.id })));

      if (source === "selected") {
          const cred = credentials.find(c => c.id === selectedId);
          if (cred?.blog_id && blogs.some(b => String(b.id) === String(cred.blog_id))) {
              setPublishBlogId(String(cred.blog_id));
          } else if (blogs.length > 0) {
              setPublishBlogId(String(blogs[0].id));
          } else {
              setPublishBlogId("");
          }
      } else { // source === "form"
          if (form.blog_id && blogs.some(b => String(b.id) === String(form.blog_id))) {
              setForm(f => ({ ...f, blog_id: String(form.blog_id) }));
          } else if (blogs.length > 0) {
              setForm(f => ({ ...f, blog_id: String(blogs[0].id) }));
          } else {
              setForm(f => ({ ...f, blog_id: "" }));
          }
      }
      try { toast.success(`Loaded ${blogs.length} blog${blogs.length === 1 ? "" : "s"}`); } catch {}
    } catch (e) {
      try { toast.error("Error loading blogs", { description: e.message }); } catch {}
    }
    setLoadingBlogs(false);
  };

  const saveCredentials = async () => {
    if (!form.name.trim()) {
      try { toast.error("Please name this connection"); } catch {}
      return;
    }
    // ensure a username is selected for assignment
    const connectionUsername = form.user_name || allowedUsernames[0] || "";
    if (!connectionUsername) {
      try { toast.error("Please select a Username to assign this connection to."); } catch {}
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        provider: active,
        name: form.name,
        user_name: connectionUsername,
      };

      if (active === "notion") {
        Object.assign(payload, {
          access_token: form.access_token || undefined,
          database_id: form.database_id || undefined
        });
      } else if (active === "shopify") {
        Object.assign(payload, {
          site_domain: form.site_domain || undefined,
          access_token: form.access_token || undefined,
          blog_id: form.blog_id || undefined
        });
      } else if (active === "webhook") {
        Object.assign(payload, {
          endpoint_url: form.endpoint_url || undefined,
          http_method: form.http_method || "POST",
          headers: form.header_value ? { [form.header_key || "X-Webhook-Secret"]: form.header_value } : undefined
        });
      } else if (active === "webflow") {
        Object.assign(payload, {
          access_token: form.access_token || undefined,
          collection_id: form.collection_id || undefined,
        });
      } else if (active === "wordpress") {
        Object.assign(payload, {
          site_domain: form.site_domain || undefined,
          username: form.username || undefined,
          password: form.password || undefined
        });
      }

      const created = await IntegrationCredential.create(payload);
      // Only add to list if user can see this username
      const isSuper = user?.role === "admin" || user?.access_level === "full";
      if (isSuper || allowedUsernames.includes(created.user_name)) {
        setCredentials(prev => [created, ...prev]);
      }
      setSelectedId(created.id);
      try { toast.success("Credentials saved"); } catch {}
      // keep username selection, clear other specific fields for new connection
      setForm(prev => ({
        ...prev,
        name: "",
        access_token: "",
        site_domain: "",
        database_id: "",
        collection_id: "",
        blog_id: "",
        username: "",
        password: "",
        endpoint_url: "",
        header_value: "",
      }));
    } catch (e) {
      try { toast.error("Failed to save credentials"); } catch {}
    }
    setIsSaving(false);
  };

  const deleteCredential = async (id) => {
    if (!id) return;
    try {
      await IntegrationCredential.delete(id);
      setCredentials(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) {
        setSelectedId("");
      }
      try { toast.success("Connection deleted."); } catch {}
    } catch (e) {
      try { toast.error("Failed to delete connection."); } catch {}
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    let credsToTest = {};
    let missingFields = [];

    // Prefer manual override for Notion DB ID if present
    const manualNormalizedNotionDbId = normalizeNotionIdLocal(notionFix.manualDbId);

    // Determine credentials source: selected existing or new form
    const sourceCreds = selectedId && credentials.find(c => c.id === selectedId)
      ? credentials.find(c => c.id === selectedId)
      : form;

    // Populate credsToTest based on active provider
    switch (active) {
      case 'notion':
        credsToTest = {
          access_token: sourceCreds.access_token,
          database_id: manualNormalizedNotionDbId || sourceCreds.database_id,
        };
        if (!credsToTest.access_token) missingFields.push("Integration Token");
        if (!credsToTest.database_id) missingFields.push("Database ID");
        break;
      case 'shopify':
        credsToTest = {
          site_domain: sourceCreds.site_domain,
          access_token: sourceCreds.access_token,
          blog_id: sourceCreds.blog_id,
        };
        if (!credsToTest.site_domain) missingFields.push("Store Domain");
        if (!credsToTest.access_token) missingFields.push("Admin API Access Token");
        if (!credsToTest.blog_id) missingFields.push("Blog ID");
        break;
      case 'webhook': // Added webhook test case
        credsToTest = {
          endpoint_url: sourceCreds.endpoint_url,
          http_method: sourceCreds.http_method || 'POST',
        };
        // If it's a saved credential, `sourceCreds.headers` might be an object
        if (sourceCreds.headers) {
          credsToTest.headers = sourceCreds.headers;
        } else if (form.header_value && form.header_key) {
          // If it's the form, construct the header object
          credsToTest.headers = { [form.header_key]: form.header_value };
        } else if (form.header_value) { // If value but no key, use default key
          credsToTest.headers = { "X-Webhook-Secret": form.header_value };
        }

        if (!credsToTest.endpoint_url) missingFields.push("Webhook Endpoint URL");
        break;
      case 'webflow':
        // Webflow testing not implemented yet
        missingFields.push("Webflow testing is not yet supported.");
        break;
      case 'wordpress':
        // WordPress testing not implemented yet
        missingFields.push("WordPress testing is not yet supported.");
        break;
      default:
        missingFields.push("Provider not supported for testing yet.");
        break;
    }

    if (missingFields.length > 0) {
      try { toast.error("Missing Information", { description: `Please provide: ${missingFields.join(', ')}.` }); } catch {}
      setIsTesting(false);
      return;
    }

    try {
      const { data } = await testContentCmsConnection({
        provider: active,
        credential: credsToTest
      });

      if (data.success) {
        try { toast.success("Connection Successful!", { description: data.message || `${providers.find(p => p.key === active)?.label || active} connection successful.` }); } catch {}
      } else {
        // Specific Notion error for DB not found
        if (active === 'notion' && data?.code === 'NOTION_DB_NOT_FOUND') {
          try { toast.error("Connection Failed", { description: "Notion could not access this database. Make sure to Share the DB with your integration in Notion.", duration: 12000 }); } catch {}
        } else {
          try { toast.error("Connection Failed", { description: data.error || `${providers.find(p => p.key === active)?.label || active} connection failed.` }); } catch {}
        }
      }
    } catch (e) {
      try { toast.error("Test Failed", { description: e.message || "An unexpected error occurred during connection test." }); } catch {}
    }
    setIsTesting(false);
  };

  // Save the manual DB override into the selected credential
  const handleSaveDbToSelected = async () => {
    if (!selectedId) {
      try { toast.error("Pick a saved connection first (Step 1)."); } catch {}
      return;
    }
    const normalized = normalizeNotionIdLocal(notionFix.manualDbId);
    if (!normalized || normalized.length < 36) { // Notion UUID is 36 chars with hyphens
      try { toast.error("Please paste a valid Notion database URL or 32-hex ID."); } catch {}
      return;
    }
    try {
      await IntegrationCredential.update(selectedId, { database_id: normalized });
      setCredentials(prev => prev.map(c => c.id === selectedId ? { ...c, database_id: normalized } : c));
      try { toast.success("Saved Database ID to connection."); } catch {}
    } catch (e) {
      try { toast.error("Failed to save Database ID", { description: e.message }); } catch {}
    }
  };

  const handlePickFromLibrary = (imageHtml) => {
    const m = String(imageHtml || "").match(/<img[^>]+src=["']([^"']+)["']/i);
    const picked = m && m[1] ? m[1] : "";
    if (!picked) {
      try { toast.error("Couldn’t detect an image from the selection."); } catch (e) { /* ignore */ }
      setShowImageLibrary(false);
      return;
    }
    if (active === "notion") setCoverUrl(picked);
    if (active === "shopify") setShopifyImageUrl(picked);
    try { toast.success("Image selected from library."); } catch (e) { /* ignore */ }
    setShowImageLibrary(false);
  };

  const doPublish = async () => {
    if (!selectedId) {
      try { toast.error("Please select credentials"); } catch {}
      return;
    }
    setPublishing(true);
    try {
      const manualOverride = notionFix.manualDbId ? normalizeNotionIdLocal(notionFix.manualDbId) : '';
      const plainText = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // FIX: removed TypeScript annotation on payload
      const payload = {
        provider: active,
        credentialId: selectedId,
        title,
        html,
        content: html,
        text: plainText
      };

      // Notion requires an explicit cover image: enforce here to "ask before posting"
      if (active === "notion") {
        if (!coverUrl) {
          try { toast.error("Please pick a cover image before publishing to Notion."); } catch {}
          setPublishing(false);
          return;
        }
        payload.coverUrl = coverUrl;
        if (manualOverride) payload.databaseId = manualOverride;
      } else if (active === "shopify") {
        // Pass selected blog id if chosen
        if (publishBlogId) payload.blog_id = publishBlogId;
        payload.imageUrl = shopifyImageUrl || "";

        // NEW: include selected category as a Shopify tag
        const selectedCat = categoryOptions.find(c => String(c.id) === String(selectedCategoryId));
        const categoryTag = selectedCat ? (selectedCat.tag || selectedCat.name) : undefined;
        if (categoryTag) {
            // Ensure payload.tags is an array
            let existingTags = [];
            if (Array.isArray(payload.tags)) {
                existingTags = payload.tags;
            } else if (typeof payload.tags === "string" && payload.tags.trim()) {
                existingTags = [payload.tags];
            }
            // Add the new tag if it's not already present
            if (!existingTags.includes(categoryTag)) {
                payload.tags = [...existingTags, categoryTag];
            } else {
                payload.tags = existingTags; // Keep original if tag already exists
            }
        }
      } else if (active === "webhook") {
        const featured = extractFirstImageUrl(html) || "";
        const excerpt = plainText.slice(0, 220).trim();
        payload.status = "published";
        payload.excerpt = excerpt;
        if (featured) payload.featured_image = featured;
      }

      const { data } = await publishContentToCms(payload);

      if (data?.success) {
        try { toast.success(`Published to ${active}.`); } catch {}
        if (data?.url) {
          try { navigator.clipboard.writeText(data.url); } catch {}
        }
        setNotionFix({ suggestions: [], message: '', selected: '', manualDbId: '' });
        onClose();
      } else {
        if (active === 'notion' && data?.code === 'COVER_REQUIRED') {
          try { toast.error("Cover image required", { description: "Pick a cover image (tip: Use first image or choose from library)." }); } catch {}
          setPublishing(false);
          return;
        }
        if (data?.code === 'NOTION_DB_NOT_FOUND' && active === "notion") {
          setNotionFix((prev) => ({
            ...prev,
            suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
            message: data?.error || "Notion database not accessible. Paste the DB URL/ID below or pick a suggestion."
          }));
          try { toast.error("Notion cannot access that database. Paste the DB URL/ID below and click Test.", { duration: 12000 }); } catch {}
          setPublishing(false);
          return;
        }
        throw new Error(data?.error || "Publish failed");
      }
    } catch (e) {
      const server = e?.response?.data;
      if (server?.code === 'COVER_REQUIRED') {
        try { toast.error("Cover image required", { description: "Pick a cover image before publishing to Notion." }); } catch {}
      } else if (server?.code === 'NOTION_DB_NOT_FOUND' && active === "notion") {
        setNotionFix((prev) => ({
          ...prev,
          suggestions: Array.isArray(server?.suggestions) ? server.suggestions : [],
          message: server?.error || "Notion database not accessible. Paste the DB URL/ID below or pick a suggestion."
        }));
        try { toast.error("Notion cannot access that database. Paste the DB URL/ID below and click Test.", { duration: 12000 }); } catch {}
      } else if (server?.error) {
        try { toast.error("Publish Failed", { description: server.error, duration: 10000 }); } catch {}
      } else {
        const msg = e?.message || "An unexpected error occurred.";
        try { toast.error("Publish Failed", { description: msg }); } catch {}
      }
    }
    setPublishing(false);
  };

  const handleApplyNotionDbSuggestion = async () => {
    if (!notionFix.selected || !selectedId) return;
    try {
      await IntegrationCredential.update(selectedId, { database_id: notionFix.selected });
      try { toast.success("Connection updated. Publishing..."); } catch {}
      setNotionFix({ suggestions: [], message: '', selected: '', manualDbId: '' }); // Clear suggestions after applying
      await doPublish(); // Retry publishing
    } catch (e) {
      try { toast.error("Failed to update connection with suggested database.", { description: e.message }); } catch {}
      setNotionFix({ suggestions: [], message: '', selected: '', manualDbId: '' }); // Clear suggestions on failure to avoid loop
    }
  };

  const handleApplyManualDbId = async (alsoSave) => {
    const normalized = normalizeNotionIdLocal(notionFix.manualDbId);
    if (!normalized || normalized.length < 36) { // Notion UUID is 36 chars with hyphens
      try { toast.error("Please paste a valid Notion database URL or ID"); } catch {}
      return;
    }
    if (alsoSave && selectedId) {
      try {
        await IntegrationCredential.update(selectedId, { database_id: normalized });
        try { toast.success("Connection updated with new Database ID. Publishing..."); } catch {}
      } catch (e) {
        try { toast.error("Failed to update connection with manual database ID.", { description: e.message }); } catch {}
        return; // Stop if saving fails
      }
    } else {
      try { toast.message("Publishing with the pasted Database ID (not saved to connection)."); } catch {}
    }
    // Clear suggestions to avoid confusion, keep manualDbId for audit until publish completes
    setNotionFix((prev) => ({ ...prev, suggestions: [], message: prev.message || '', selected: '' }));
    await doPublish();
  };

  const renderProviderFields = () => {
    // We will render the Username assignment selector before provider-specific fields
    const usernameSelect = (
      <div className="col-span-2">
        <Label>Assign to Username</Label>
        <Select
          value={form.user_name}
          onValueChange={(v) => setForm(f => ({ ...f, user_name: v }))}
          disabled={allowedUsernames.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={allowedUsernames.length ? "Select a username..." : "No usernames available"} />
          </SelectTrigger>
          <SelectContent>
            {allowedUsernames.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1">Only users assigned to this username will see this connection.</p>
      </div>
    );

    switch (active) {
      case "notion":
        return (
          <>
            {usernameSelect}
            <div className="col-span-2">
              <Label>Integration Token</Label>
              <Input placeholder="secret_xxx (from Notion integrations)" value={form.access_token} onChange={(e) => setForm(f => ({ ...f, access_token: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Create a Notion internal integration and paste the token here.</p>
            </div>
            <div className="col-span-2">
              <Label>Database ID</Label>
              <Input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={form.database_id} onChange={(e) => setForm(f => ({ ...f, database_id: e.target.value }))} />
              <Alert className="mt-2 border-amber-500/50 text-amber-200">
                <Terminal className="h-4 w-4" />
                <AlertTitle className="text-amber-300">Action Required in Notion</AlertTitle>
                <AlertDescription>
                  You <strong>must</strong> go to your database in Notion, click the "Share" button, and invite your integration by name. The connection will fail without this step.
                </AlertDescription>
              </Alert>
            </div>
          </>
        );
      case "shopify":
        return (
          <>
            {usernameSelect}
            <div>
              <Label>Store Domain</Label>
              <Input placeholder="yourstore.myshopify.com" value={form.site_domain} onChange={(e) => setForm(f => ({ ...f, site_domain: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Use the full subdomain of your Shopify store (no https://).</p>
            </div>
            <div>
              <Label>Admin API Access Token</Label>
              <Input placeholder="shpat_xxx" value={form.access_token} onChange={(e) => setForm(f => ({ ...f, access_token: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Create a private/custom app in Shopify and copy the Admin API token.</p>
            </div>
            <div>
              <Label>Blog ID</Label>
              <Input placeholder="e.g., 123456789" value={form.blog_id} onChange={(e) => setForm(f => ({ ...f, blog_id: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Pick from dropdown below or paste manually.</p>
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => fetchShopifyBlogs("form")} disabled={loadingBlogs}>
                  {loadingBlogs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Load Blogs
                </Button>
                <Select
                  value={form.blog_id || ""}
                  onValueChange={(v) => setForm(f => ({ ...f, blog_id: v }))}
                  disabled={loadingBlogs || shopifyBlogs.length === 0}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder={loadingBlogs ? "Loading..." : (shopifyBlogs.length ? "Select a blog" : "No blogs loaded")} />
                  </SelectTrigger>
                  <SelectContent>
                    {shopifyBlogs.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.title} — {b.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* NEW: Category dropdown for Shopify publish (per-username) */}
            <div className="col-span-2">
              <Label>Category</Label>
              <div className="flex items-center gap-2 mt-2">
                <Select
                  value={selectedCategoryId}
                  onValueChange={(v) => setSelectedCategoryId(v)}
                  disabled={loadingCategories || categoryOptions.length === 0}
                >
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder={loadingCategories ? "Loading..." : (categoryOptions.length ? "Select a category" : "No categories configured for this username")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}{c.tag && c.tag !== c.name ? ` — #${c.tag}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingCategories && <Loader2 className="h-4 w-4 animate-spin text-slate-500 ml-2" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">This category will be added as a tag on the Shopify article.</p>
            </div>
          </>
        );
      case "webhook": // Added webhook fields
        return (
          <>
            {usernameSelect}
            <div className="col-span-2">
              <Label>Webhook Endpoint URL</Label>
              <Input placeholder="https://your-app.example.com/api/receive" value={form.endpoint_url} onChange={(e) => setForm(f => ({ ...f, endpoint_url: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">This will receive a JSON payload with title, html, text, and user info.</p>
            </div>
            <div>
              <Label>HTTP Method</Label>
              <Select value={form.http_method} onValueChange={(v) => setForm(f => ({ ...f, http_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Auth Header (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Header key (e.g., X-Webhook-Secret)" value={form.header_key} onChange={(e) => setForm(f => ({ ...f, header_key: e.target.value }))} />
                <Input placeholder="Header value (secret/token)" value={form.header_value} onChange={(e) => setForm(f => ({ ...f, header_value: e.target.value }))} />
              </div>
              <p className="text-xs text-slate-500 mt-1">We’ll include this header on every request. You can add more later in Data → IntegrationCredential.</p>
            </div>
          </>
        );
      case "webflow":
        return (<div className="col-span-2 text-sm text-slate-500">Webflow coming soon.</div>);
      case "wordpress":
        return (<div className="col-span-2 text-sm text-slate-500">WordPress coming soon.</div>);
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Publish to CMS
            </DialogTitle>
            <DialogDescription>
              Connect once and publish this content directly to your CMS.
            </DialogDescription>
          </DialogHeader>

          <div className="p-1 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
            Your connections are saved securely to your account. Choose an existing one or add a new connection below.
          </div>

          <Tabs value={active} onValueChange={v => { setActive(v); setForm(f => ({ ...f, provider: v })); }} className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="notion">Notion</TabsTrigger>
              <TabsTrigger value="shopify">Shopify</TabsTrigger>
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
              <TabsTrigger value="webflow" disabled>Webflow</TabsTrigger>
              <TabsTrigger value="wordpress" disabled>WordPress</TabsTrigger>
            </TabsList>

            <TabsContent value={active}>
              <div className="space-y-4">
                {/* Step 1: Saved connections */}
                <h3 className="font-semibold">Step 1 — Select saved connection</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedId} onValueChange={setSelectedId} disabled={credentials.filter(c => c.provider === active).length === 0}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={`Pick a connection you've saved earlier. You can add a new one in Step 2.`} />
                    </SelectTrigger>
                    <SelectContent>
                      {credentials.filter(c => c.provider === active).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    onClick={() => selectedId && deleteCredential(selectedId)}
                    disabled={!selectedId}
                    title="Delete selected connection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => doPublish()} disabled={!selectedId || isPublishing} className="bg-slate-800 hover:bg-slate-900">
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    <span className="ml-2">Publish</span>
                  </Button>
                </div>

                {/* Shopify: Choose blog for publishing when a saved connection is selected */}
                {active === "shopify" && (
                  <div className="rounded-lg border p-3 bg-white/5 border-white/10">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label>Blog to publish to</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fetchShopifyBlogs("selected")}
                            disabled={loadingBlogs || !selectedId}
                            title={selectedId ? "Fetch blogs from Shopify" : "Select a connection first"}
                          >
                            {loadingBlogs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                            {loadingBlogs ? "Loading..." : "Refresh Blogs"}
                          </Button>
                          <Select
                            value={publishBlogId || ""}
                            onValueChange={(v) => setPublishBlogId(v)}
                            disabled={loadingBlogs || shopifyBlogs.length === 0}
                          >
                            <SelectTrigger className="w-72">
                              <SelectValue placeholder={loadingBlogs ? "Loading..." : (shopifyBlogs.length ? "Select a blog" : "No blogs loaded")} />
                            </SelectTrigger>
                            <SelectContent>
                              {shopifyBlogs.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.title} — {b.id}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          This selection overrides the blog in your saved connection for this publish only.
                        </p>
                      </div>
                    </div>
                     {/* Category dropdown for Shopify publish (per-username) when a saved connection is selected */}
                    <div className="mt-4">
                      <Label>Category</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Select
                          value={selectedCategoryId}
                          onValueChange={(v) => setSelectedCategoryId(v)}
                          disabled={loadingCategories || categoryOptions.length === 0}
                        >
                          <SelectTrigger className="w-72">
                            <SelectValue placeholder={loadingCategories ? "Loading..." : (categoryOptions.length ? "Select a category" : "No categories configured for this username")} />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}{c.tag && c.tag !== c.name ? ` — #${c.tag}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {loadingCategories && <Loader2 className="h-4 w-4 animate-spin text-slate-500 ml-2" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">This category will be added as a tag on the Shopify article.</p>
                    </div>
                  </div>
                )}


                {/* Notion-specific: DB override always visible */}
                {active === "notion" && (
                  <div className="rounded-lg border p-3 bg-blue-50/60">
                    <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                      <div>
                        <Label>Notion Database URL or ID</Label>
                        <Input
                          placeholder="Paste your database URL or 32-hex ID (e.g., 2457f09ade20816cb81bdcb9e9ec4adb)"
                          value={notionFix.manualDbId}
                          onChange={(e) => setNotionFix(s => ({ ...s, manualDbId: e.target.value }))}
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Current saved DB (connection): {credentials.find(c => c.id === selectedId)?.database_id || '—'}
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span className="ml-1">Test</span>
                      </Button>
                      <Button onClick={handleSaveDbToSelected} disabled={!selectedId}>
                        Save to selected
                      </Button>
                    </div>
                    <p className="text-xs text-blue-900 mt-2">
                      Important: In Notion, open your database, click Share, and invite your integration. Without this, Notion returns “object_not_found”.
                    </p>
                  </div>
                )}

                {/* Notion-only fix block */}
                {active === "notion" && (
                  <>
                    {/* Suggestions available */}
                    {Array.isArray(notionFix.suggestions) && notionFix.suggestions.length > 0 && (
                      <div className="rounded-lg border p-3 bg-amber-50">
                        <div className="text-sm text-amber-800 mb-2">{notionFix.message}</div>
                        <div className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
                          <div>
                            <Label>Select a Notion database your token can access</Label>
                            <Select value={notionFix.selected} onValueChange={(v) => setNotionFix(s => ({ ...s, selected: v }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a database" />
                              </SelectTrigger>
                              <SelectContent>
                                {notionFix.suggestions.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>{s.title} — {s.id.slice(0,8)}...</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleApplyNotionDbSuggestion} className="bg-emerald-600 hover:bg-emerald-700">
                            Use this database and publish
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Manual DB ID entry when no suggestions but there's a message indicating an issue */}
                    {(!notionFix.suggestions || notionFix.suggestions.length === 0) && notionFix.message && (
                      <div className="rounded-lg border p-3 bg-amber-50">
                        <div className="text-sm text-amber-800 mb-2">{notionFix.message}</div>
                        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                          <div>
                            <Label>Paste Notion Database URL or ID</Label>
                            <Input
                              placeholder="https://www.notion.so/yourworkspace/...-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              value={notionFix.manualDbId}
                              onChange={(e) => setNotionFix(s => ({ ...s, manualDbId: e.target.value }))}
                            />
                            <p className="text-xs text-amber-800 mt-1">
                              Tip: Open your Notion database, copy the URL, and paste it here. We’ll extract the ID automatically.
                            </p>
                          </div>
                          <Button variant="outline" onClick={() => handleApplyManualDbId(false)} disabled={isPublishing}>
                            Publish once with this ID
                          </Button>
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApplyManualDbId(true)} disabled={isPublishing}>
                            Save to connection + Publish
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Notion-only cover image option */}
                {active === "notion" && (
                  <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                    <div>
                      <Label>Cover image URL (Notion)</Label>
                      <Input
                        placeholder="https://example.com/cover.jpg"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Notion pages look better with a cover. Leave blank to auto-use the first image in your content.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCoverUrl(extractFirstImageUrl(html))}
                    >
                      Use first image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImageLibrary(true)}
                      className="gap-2"
                      title="Choose a cover from your library or generate one"
                    >
                      <ImageIcon className="w-4 h-4" /> Choose from library
                    </Button>
                  </div>
                )}

                {/* Shopify featured image */}
                {active === "shopify" && (
                  <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                    <div>
                      <Label>Featured image URL (Shopify)</Label>
                      <Input
                        placeholder="https://example.com/feature.jpg"
                        value={shopifyImageUrl}
                        onChange={(e) => setShopifyImageUrl(e.target.value)}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Optional but recommended. If empty, we’ll try the first image found in your content.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShopifyImageUrl(extractFirstImageUrl(html))}
                    >
                      Use first image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImageLibrary(true)}
                      className="gap-2"
                      title="Choose a featured image from your library or generate one"
                    >
                      <ImageIcon className="w-4 h-4" /> Choose from library
                    </Button>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Step 2: Create a new connection */}
                <h3 className="font-semibold">Step 2 — Add new {providers.find(p => p.key === active)?.label} connection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Connection name (e.g., Main Blog)</Label>
                    <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  {renderProviderFields()}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={saveCredentials} disabled={isSaving || !form.name}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Connection
                  </Button>
                  <Button onClick={handleTestConnection} disabled={isTesting}>
                    {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlugZap className="w-4 h-4 mr-2" />}
                    Test Connection
                  </Button>
                </div>

                {/* Quick help per provider */}
                <div className="mt-3 text-xs text-slate-500 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    Need help? For {providers.find(p => p.key === active)?.label}, enter the fields exactly as shown above. You can create or find these in your {providers.find(p => p.key === active)?.label} admin.
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>

        {/* Image library modal to pick cover; lives outside the CMS dialog to avoid nested focus issues */}
        <ImageLibraryModal
          isOpen={showImageLibrary}
          onClose={() => setShowImageLibrary(false)}
          onInsert={handlePickFromLibrary}
          selectedText=""
          generateOnly={false}
        />
      </Dialog>
    </>
  );
}
