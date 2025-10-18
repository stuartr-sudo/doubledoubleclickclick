
import React, { useEffect, useState, useCallback } from "react";
import { BrandGuidelines } from "@/api/entities";
import { BrandSpecifications } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, Edit3, Loader2, Globe, FileCode, Palette, Type, Layout as LayoutIcon } from "lucide-react";
import { toast } from "sonner";
import { InvokeLLM } from "@/api/integrations";
import { extractWebsiteContent } from "@/api/functions";
import { uploadUserCss } from "@/api/functions";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
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

import BrandColorPicker from "@/components/brand/BrandColorPicker";
import FontSelector from "@/components/brand/FontSelector";
import LayoutConfigurator from "@/components/brand/LayoutConfigurator";
import WebsiteAnalyzer from "@/components/brand/WebsiteAnalyzer";
import BrandPreview from "@/components/brand/BrandPreview";

const initialGuidelineState = {
  id: null,
  user_name: "",
  name: "",
  voice_and_tone: "",
  content_style_rules: "",
  prohibited_elements: "",
  preferred_elements: "",
  ai_instructions_override: "",
  target_market: ""
};

const initialBrandSpecsState = {
  colors: {
    primary: "#1a365d",
    secondary: "#2c5282",
    accent: "#3182ce",
    text: "#1a202c",
    heading: "#1a202c", // Added new heading color
    background: "#ffffff",
    muted: "#718096"
  },
  typography: {
    font_family: "Inter, system-ui, sans-serif",
    font_size_base: "16px",
    line_height: "1.6"
  },
  layout: {
    max_width: "1200px",
    content_padding: "20px",
    section_spacing: "40px",
    element_spacing: "16px",
    border_radius: "8px",
    box_shadow: "0 2px 4px rgba(0,0,0,0.1)",
    type: "centered"
  },
  custom_css: ""
};

export default function BrandGuidelinesManager() {
  const [guidelines, setGuidelines] = useState([]);
  const [brandSpecsList, setBrandSpecsList] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [newGuideline, setNewGuideline] = useState(initialGuidelineState);
  const [brandSpecs, setBrandSpecs] = useState(initialBrandSpecsState);
  const [isLoading, setIsLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cssFile, setCssFile] = useState(null);
  const [isUploadingCss, setIsUploadingCss] = useState(false);
  const [usernameDetails, setUsernameDetails] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [guidelineToDelete, setGuidelineToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");
  const [editingBrandSpec, setEditingBrandSpec] = useState(null);

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping', { currentUser });
  const { enabled: showCustomCssUpload } = useFeatureFlag('show_brand_guidelines_css_upload', { currentUser });

  const { consumeTokensForFeature } = useTokenConsumption();

  const loadGuidelinesAndUsernames = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me().catch(() => null);
      setCurrentUser(user);

      const allGuidelines = await BrandGuidelines.list("-updated_date", 200).catch(() => []);
      const allBrandSpecs = await BrandSpecifications.list("-updated_date", 200).catch(() => []);
      const allUsernames = await Username.list("-updated_date", 100).catch(() => []);

      let visibleUsernames = [];
      let visibleGuidelines = [];
      let visibleBrandSpecs = [];

      if (user && (user.role === 'admin' || user.is_superadmin)) {
        visibleUsernames = allUsernames.filter((u) => u.is_active);
        visibleGuidelines = allGuidelines;
        visibleBrandSpecs = allBrandSpecs;
      } else if (user && Array.isArray(user.assigned_usernames) && user.assigned_usernames.length > 0) {
        const assigned = new Set(user.assigned_usernames);
        visibleUsernames = allUsernames.filter((u) => u.is_active && assigned.has(u.user_name));
        visibleGuidelines = allGuidelines.filter((g) => assigned.has(g.user_name));
        visibleBrandSpecs = allBrandSpecs.filter((g) => assigned.has(g.user_name));
      } else {
        visibleUsernames = [];
        visibleGuidelines = [];
        visibleBrandSpecs = [];
      }

      setUsernames(visibleUsernames);
      setGuidelines(visibleGuidelines);
      setBrandSpecsList(visibleBrandSpecs);

      const details = {};
      for (const uname of visibleUsernames) {
        details[uname.user_name] = uname;
      }
      setUsernameDetails(details);

      setNewGuideline((prev) => {
        let defaultUserName = prev.user_name;
        if (useWorkspaceScoping && globalUsername) {
          defaultUserName = globalUsername;
        } else if (!defaultUserName && visibleUsernames.length > 0) {
          defaultUserName = visibleUsernames[0].user_name;
        } else if (defaultUserName && !visibleUsernames.some((u) => u.user_name === defaultUserName)) {
          defaultUserName = visibleUsernames.length > 0 ? visibleUsernames[0].user_name : "";
        }
        return { ...prev, user_name: defaultUserName };
      });

    } catch (err) {
      toast.error("Failed to load brand guidelines and user data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [useWorkspaceScoping, globalUsername]);

  useEffect(() => {
    loadGuidelinesAndUsernames();
  }, [loadGuidelinesAndUsernames]);

  useEffect(() => {
    if (useWorkspaceScoping) {
      setNewGuideline((prev) => ({ ...prev, user_name: globalUsername || "" }));
    }
  }, [useWorkspaceScoping, globalUsername]);

  const resetForm = () => {
    setNewGuideline((prev) => {
      let defaultUserName = usernames.length > 0 ? usernames[0].user_name : "";
      if (useWorkspaceScoping && globalUsername) {
        defaultUserName = globalUsername;
      }
      return {
        ...initialGuidelineState,
        user_name: defaultUserName
      };
    });
    setBrandSpecs(initialBrandSpecsState);
    setCssFile(null);
    setIsEditing(false);
    setEditingBrandSpec(null);
  };

  const handleEdit = (item) => {
    setNewGuideline({
      id: item.id,
      user_name: item.user_name || "",
      name: item.name || "",
      voice_and_tone: item.voice_and_tone || "",
      content_style_rules: item.content_style_rules || "",
      prohibited_elements: item.prohibited_elements || "",
      preferred_elements: item.preferred_elements || "",
      ai_instructions_override: item.ai_instructions_override || "",
      target_market: item.target_market || ""
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditBrandSpec = (spec) => {
    setEditingBrandSpec(spec);
    setNewGuideline((prev) => ({
      ...prev,
      user_name: spec.user_name,
      name: spec.name,
      voice_and_tone: spec.voice_and_tone || "",
      content_style_rules: spec.content_style_rules || "",
      prohibited_elements: spec.prohibited_elements || "",
      preferred_elements: spec.preferred_elements || "",
      target_market: spec.target_market || ""
    }));
    setBrandSpecs({
      colors: { ...initialBrandSpecsState.colors, ...(spec.colors || {}) }, // Merge with defaults for new properties like 'heading'
      typography: spec.typography || initialBrandSpecsState.typography,
      layout: spec.layout || initialBrandSpecsState.layout,
      custom_css: spec.custom_css || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (item) => {
    setGuidelineToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!guidelineToDelete) return;
    try {
      if (guidelineToDelete.isBrandSpec) {
        await BrandSpecifications.delete(guidelineToDelete.id);
      } else {
        await BrandGuidelines.delete(guidelineToDelete.id);
      }
      toast.success("Deleted");
      loadGuidelinesAndUsernames();
      setShowDeleteConfirm(false);
      setGuidelineToDelete(null);
    } catch (error) {
      toast.error("Failed to delete guideline.");
      console.error(error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const activeUsername = useWorkspaceScoping ? globalUsername : newGuideline.user_name;

    const userNameTrim = (activeUsername || "").trim();
    const nameTrim = (newGuideline.name || "").trim();
    const voiceTrim = (newGuideline.voice_and_tone || "").trim();

    if (!userNameTrim || !nameTrim || !voiceTrim) {
      toast.error("Username, Guideline Name, and Voice & Tone are required");
      setIsSaving(false);
      return;
    }

    const payload = {
      ...newGuideline,
      user_name: userNameTrim,
      name: nameTrim,
      voice_and_tone: voiceTrim
    };

    try {
      if (payload.id) {
        await BrandGuidelines.update(payload.id, payload);
        toast.success("Updated");
      } else {
        await BrandGuidelines.create(payload);
        toast.success("Created");
      }
      resetForm();
      loadGuidelinesAndUsernames();
    } catch (error) {
      toast.error(`Failed to save guideline: ${error.message}`);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrandSpecs = async () => {
    setIsSaving(true);
    const activeUsername = useWorkspaceScoping ? globalUsername : newGuideline.user_name;

    const userNameTrim = (activeUsername || "").trim();
    const nameTrim = (newGuideline.name || "").trim();

    if (!userNameTrim || !nameTrim) {
      toast.error("Username and Name are required");
      setIsSaving(false);
      return;
    }

    const payload = {
      user_name: userNameTrim,
      name: nameTrim,
      voice_and_tone: newGuideline.voice_and_tone || "",
      content_style_rules: newGuideline.content_style_rules || "",
      prohibited_elements: newGuideline.prohibited_elements || "",
      preferred_elements: newGuideline.preferred_elements || "",
      target_market: newGuideline.target_market || "",
      colors: brandSpecs.colors,
      typography: brandSpecs.typography,
      layout: brandSpecs.layout,
      custom_css: brandSpecs.custom_css
    };

    try {
      if (editingBrandSpec) {
        await BrandSpecifications.update(editingBrandSpec.id, payload);
        toast.success("Brand Specifications Updated");
      } else {
        await BrandSpecifications.create(payload);
        toast.success("Brand Specifications Created");
      }
      resetForm();
      loadGuidelinesAndUsernames();
    } catch (error) {
      toast.error(`Failed to save brand specifications: ${error.message}`);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl || !/^https?:\/\//i.test(websiteUrl)) {
      toast.error("Please enter a valid URL (including http/https).");
      return;
    }
    setIsAnalyzing(true);
    try {
      const { data: extracted } = await extractWebsiteContent({ url: websiteUrl });
      if (!extracted?.success) {
        toast.error(extracted?.error || "Failed to fetch website content");
        setIsAnalyzing(false);
        return;
      }

      const longText = extracted.text || "";
      const prompt = [
        "You are a brand analyst. Read the following website content and extract concise, actionable brand guidance.",
        "",
        "Language requirement:",
        "- Detect the dominant language of the content and RESPOND ENTIRELY in that same language.",
        "- Do NOT translate to any other language. If the site is English, respond in English; otherwise respond in the site's language.",
        "",
        "Return JSON with the following fields:",
        "- voice_and_tone: 5-10 sentences describing voice and tone with examples of phrasing.",
        "- target_market: 1-3 sentences describing the primary audience (demographics, roles, regions if evident).",
        "- content_style_rules: 6-12 bullet-style rules as a single string (e.g., '• Use short sentences...').",
        "- prohibited_elements: a short list of words/phrases/patterns to avoid.",
        "- preferred_elements: a short list of words/phrases/patterns to encourage.",
        "",
        "Be specific and grounded in the content. If a field is unclear, make a best-effort reasonable inference.",
        "",
        "CONTENT START",
        longText,
        "CONTENT END"
      ].join("\n");

      const schema = {
        type: "object",
        properties: {
          voice_and_tone: { type: "string" },
          target_market: { type: "string" },
          content_style_rules: { type: "string" },
          prohibited_elements: { type: "array", items: { type: "string" } },
          preferred_elements: { type: "array", items: { type: "string" } }
        }
      };

      const ai = await InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      const out = ai || {};
      const prohibitedCsv = Array.isArray(out.prohibited_elements) ? out.prohibited_elements.join(", ") : out.prohibited_elements || "";
      const preferredCsv = Array.isArray(out.preferred_elements) ? out.preferred_elements.join(", ") : out.preferred_elements || "";

      let suggestedName = "";
      try {
        const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
        suggestedName = `${host} • Core Voice`;
      } catch (_) { }

      const defaultUserName = newGuideline.user_name?.trim() ? newGuideline.user_name : usernames[0]?.user_name || "";

      setNewGuideline((f) => ({
        ...f,
        user_name: defaultUserName,
        name: f.name?.trim() ? f.name : suggestedName,
        voice_and_tone: out.voice_and_tone || f.voice_and_tone,
        content_style_rules: out.content_style_rules || f.content_style_rules,
        prohibited_elements: prohibitedCsv || f.prohibited_elements,
        preferred_elements: preferredCsv || f.preferred_elements,
        target_market: out.target_market || f.target_market
      }));

      toast.success("Analysis complete. Fields populated — review and adjust as needed.");
    } catch (e) {
      toast.error("Analysis failed. Try another URL or adjust later.");
      console.error("Website analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadCss = async () => {
    const selectedUsername = newGuideline.user_name;

    if (!cssFile) {
      toast.error("Please choose a CSS file to upload.");
      return;
    }
    if (!selectedUsername) {
      toast.error("Please select a username to link the CSS file to.");
      return;
    }

    const tokenResult = await consumeTokensForFeature('brand_guidelines_css_upload');
    if (!tokenResult.success) {
      return;
    }

    setIsUploadingCss(true);
    try {
      const formData = new FormData();
      formData.append("file", cssFile);
      formData.append("user_name", selectedUsername);

      const { data } = await uploadUserCss(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        const fileUri = data.file_uri;

        const usernameRecord = usernames.find((u) => u.user_name === selectedUsername);
        if (usernameRecord) {
          await Username.update(usernameRecord.id, { default_css_file_uri: fileUri });
          toast.success("Custom CSS uploaded and linked to username.");
          await loadGuidelinesAndUsernames();
          setCssFile(null);
        } else {
          toast.error("Could not find the selected username to link the CSS file.");
        }
      } else {
        toast.error(data.error || "Failed to upload CSS file.");
      }
    } catch (error) {
      console.error(error);
      toast.error(`CSS upload failed: ${error.data?.error || error.message}`);
    } finally {
      setIsUploadingCss(false);
    }
  };

  const handleRemoveCss = async () => {
    if (!newGuideline.user_name) return;
    if (!confirm("Are you sure you want to remove the custom CSS for this username?")) return;

    try {
      const usernameRecord = usernames.find((u) => u.user_name === newGuideline.user_name);
      if (usernameRecord) {
        await Username.update(usernameRecord.id, { default_css_file_uri: null });
        toast.success("Custom CSS removed.");
        await loadGuidelinesAndUsernames();
      }
    } catch (error) {
      toast.error("Failed to remove CSS.");
      console.error(error);
    }
  };

  const currentUsernameCssUri = usernameDetails[newGuideline.user_name]?.default_css_file_uri;

  const displayedGuidelines = useWorkspaceScoping && globalUsername
    ? guidelines.filter(g => g.user_name === globalUsername)
    : guidelines;

  const displayedBrandSpecs = useWorkspaceScoping && globalUsername
    ? brandSpecsList.filter(g => g.user_name === globalUsername)
    : brandSpecsList;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Brand Guidelines & Specifications</h1>
          <p className="text-slate-600 mb-6">Create voice, tone, and visual brand specifications per username.</p>

          {/* Only Guideline Name - Always Visible */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <label className="text-sm font-medium text-slate-700">Guideline Name</label>
            <Input 
              value={newGuideline.name} 
              onChange={(e) => setNewGuideline((f) => ({ ...f, name: e.target.value }))} 
              className="bg-white border-slate-300 text-slate-900 mt-1" 
              placeholder="e.g., Core Voice or Main Brand" 
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* NEW: Single-row segmented tab header (no wrapping, 4 equal columns) */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <TabsTrigger value="identity" className="w-full h-10 rounded-lg flex items-center justify-center gap-2">
                  <FileCode className="w-4 h-4" />
                  <span>Identity</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="w-full h-10 rounded-lg flex items-center justify-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span>Colors</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="w-full h-10 rounded-lg flex items-center justify-center gap-2">
                  <Type className="w-4 h-4" />
                  <span>Typography</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="w-full h-10 rounded-lg flex items-center justify-center gap-2">
                  <LayoutIcon className="w-4 h-4" />
                  <span>Layout</span>
                </TabsTrigger>
              </div>
            </div>

            {/* Identity Tab */}
            <TabsContent value="identity" className="space-y-4">
              {/* Website analyzer */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-slate-700">Website URL</label>
                    <div className="relative mt-1">
                      <Input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="bg-white border-slate-300 text-slate-900 pl-9"
                      />
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAnalyzeWebsite}
                      disabled={isAnalyzing || !websiteUrl}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        "Analyze"
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">We'll fetch the site, analyze its content with AI, and fill in Voice & Tone, Style Rules, and Target Market automatically.</p>
              </div>

              {/* Custom CSS Section */}
              {showCustomCssUpload && (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 my-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Custom Brand CSS</h3>
                  <p className="text-sm text-slate-600 mb-4">Upload a CSS file to apply your website's exact styling to the editor preview. This CSS will be linked to the selected username.</p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="css-upload" className="block text-sm font-medium mb-2 text-slate-700">Upload CSS File</label>
                      <div className="relative">
                        <Input
                          id="css-upload"
                          type="file"
                          accept=".css"
                          onChange={(e) => setCssFile(e.target.files[0])}
                          className="bg-white border-slate-300 text-slate-900 pt-3 pb-5 px-4 h-14 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
                      <Button
                        onClick={handleUploadCss}
                        disabled={isUploadingCss || !cssFile || !newGuideline.user_name}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-6"
                      >
                        {isUploadingCss ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCode className="w-4 h-4 mr-2" />}
                        {isUploadingCss ? "Uploading..." : "Upload & Link CSS"}
                      </Button>
                      {currentUsernameCssUri && (
                        <Button variant="destructive" onClick={handleRemoveCss} className="h-14 px-4">
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  {currentUsernameCssUri && (
                    <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
                      <span className="font-semibold">Current CSS:</span> {currentUsernameCssUri.split('/').pop()}
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">Target Market</label>
                  <Input
                    value={newGuideline.target_market || ""}
                    onChange={(e) => setNewGuideline((f) => ({ ...f, target_market: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900 mt-1"
                    placeholder="e.g., SMB marketers in North America"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">Voice & Tone</label>
                  <Textarea value={newGuideline.voice_and_tone} onChange={(e) => setNewGuideline((f) => ({ ...f, voice_and_tone: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[80px]" placeholder="Describe the voice and tone in detail..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">Content Style Rules</label>
                  <Textarea value={newGuideline.content_style_rules} onChange={(e) => setNewGuideline((f) => ({ ...f, content_style_rules: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[80px]" placeholder="Active voice, sentence length, headings conventions..." />
                </div>
                <div>
                  <label className="text-sm text-slate-700">Prohibited (comma-separated)</label>
                  <Input value={newGuideline.prohibited_elements} onChange={(e) => setNewGuideline((f) => ({ ...f, prohibited_elements: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., synergy, deep dive" />
                </div>
                <div>
                  <label className="text-sm text-slate-700">Preferred (comma-separated)</label>
                  <Input value={newGuideline.preferred_elements} onChange={(e) => setNewGuideline((f) => ({ ...f, preferred_elements: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., practical, clear" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-700">AI Instructions Override (optional)</label>
                  <Textarea value={newGuideline.ai_instructions_override} onChange={(e) => setNewGuideline((f) => ({ ...f, ai_instructions_override: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[60px]" placeholder="Extra directives to the AI for this brand" />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} className="bg-blue-900 text-white hover:bg-indigo-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : newGuideline.id ? "Update" : "Create"}
                </Button>
                <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" disabled={isSaving}>
                  <Edit3 className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <BrandColorPicker
                  label="Primary Color"
                  value={brandSpecs.colors.primary}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, primary: color }
                  }))}
                />
                <BrandColorPicker
                  label="Secondary Color"
                  value={brandSpecs.colors.secondary}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, secondary: color }
                  }))}
                />
                <BrandColorPicker
                  label="Accent Color"
                  value={brandSpecs.colors.accent}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, accent: color }
                  }))}
                />
                <BrandColorPicker
                  label="Text Color"
                  value={brandSpecs.colors.text}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, text: color }
                  }))}
                />
                <BrandColorPicker
                  label="Heading Color" // New Heading Color picker
                  value={brandSpecs.colors.heading}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, heading: color }
                  }))}
                />
                <BrandColorPicker
                  label="Background Color"
                  value={brandSpecs.colors.background}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, background: color }
                  }))}
                />
                <BrandColorPicker
                  label="Muted Color"
                  value={brandSpecs.colors.muted}
                  onChange={(color) => setBrandSpecs(prev => ({
                    ...prev,
                    colors: { ...prev.colors, muted: color }
                  }))}
                />
              </div>

              <BrandPreview brandSpecs={brandSpecs} />

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveBrandSpecs} className="bg-blue-900 text-white hover:bg-indigo-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : editingBrandSpec ? "Update Specifications" : "Save Specifications"}
                </Button>
                <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" disabled={isSaving}>
                  <Edit3 className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <FontSelector
                label="Font Settings"
                fontFamily={brandSpecs.typography.font_family}
                fontSize={brandSpecs.typography.font_size_base}
                fontWeight="400"
                onFontFamilyChange={(font) => setBrandSpecs(prev => ({
                  ...prev,
                  typography: { ...prev.typography, font_family: font }
                }))}
                onFontSizeChange={(size) => setBrandSpecs(prev => ({
                  ...prev,
                  typography: { ...prev.typography, font_size_base: size }
                }))}
                onFontWeightChange={() => {}}
              />

              <div>
                <label className="text-sm text-slate-700">Line Height</label>
                <Input
                  type="text"
                  value={brandSpecs.typography.line_height}
                  onChange={(e) => setBrandSpecs(prev => ({
                    ...prev,
                    typography: { ...prev.typography, line_height: e.target.value }
                  }))}
                  placeholder="1.6"
                  className="bg-white border-slate-300 text-slate-900 mt-1"
                />
              </div>

              <BrandPreview brandSpecs={brandSpecs} />

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveBrandSpecs} className="bg-blue-900 text-white hover:bg-indigo-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : editingBrandSpec ? "Update Specifications" : "Save Specifications"}
                </Button>
                <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" disabled={isSaving}>
                  <Edit3 className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <LayoutConfigurator
                layout={brandSpecs.layout}
                onChange={(newLayout) => setBrandSpecs(prev => ({
                  ...prev,
                  layout: { ...prev.layout, ...newLayout }
                }))}
              />

              <div>
                <label className="text-sm text-slate-700">Custom CSS</label>
                <Textarea
                  value={brandSpecs.custom_css}
                  onChange={(e) => setBrandSpecs(prev => ({
                    ...prev,
                    custom_css: e.target.value
                  }))}
                  className="bg-white border-slate-300 text-slate-900 mt-1 font-mono text-sm min-h-[120px]"
                  placeholder="/* Additional custom CSS */"
                />
              </div>

              <BrandPreview brandSpecs={brandSpecs} />

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveBrandSpecs} className="bg-blue-900 text-white hover:bg-indigo-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : editingBrandSpec ? "Update Specifications" : "Save Specifications"}
                </Button>
                <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" disabled={isSaving}>
                  <Edit3 className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Existing Guidelines List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-2xl font-bold mb-4">Existing Guidelines</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              {displayedGuidelines.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-700">Basic Guidelines</h3>
                  <div className="space-y-4">
                    {displayedGuidelines.map((g) => (
                      <div key={g.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{g.name}</h3>
                            <p className="text-sm text-slate-500">Username: {g.user_name}</p>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                              <strong>Voice & Tone:</strong> {g.voice_and_tone}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(g)} className="bg-blue-900 text-slate-50 hover:bg-accent hover:text-accent-foreground">
                              <Edit3 className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(g)} className="bg-emerald-300 text-blue-900 hover:bg-destructive/90">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayedBrandSpecs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-700">Brand Specifications</h3>
                  <div className="space-y-4">
                    {displayedBrandSpecs.map((spec) => (
                      <div key={spec.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{spec.name}</h3>
                            <p className="text-sm text-slate-500">Username: {spec.user_name}</p>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border-2 border-slate-300" style={{ backgroundColor: spec.colors?.primary }} />
                                <span className="text-xs text-slate-600">Primary</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border-2 border-slate-300" style={{ backgroundColor: spec.colors?.secondary }} />
                                <span className="text-xs text-slate-600">Secondary</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border-2 border-slate-300" style={{ backgroundColor: spec.colors?.accent }} />
                                <span className="text-xs text-slate-600">Accent</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border-2 border-slate-300" style={{ backgroundColor: spec.colors?.heading || initialBrandSpecsState.colors.heading }} />
                                <span className="text-xs text-slate-600">Heading</span>
                              </div>
                              <div className="text-xs text-slate-600">
                                <Type className="w-4 h-4 inline mr-1" />
                                {spec.typography?.font_family?.split(',')[0] || 'Default'}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handleEditBrandSpec(spec)} className="bg-blue-900 text-slate-50 hover:bg-accent hover:text-accent-foreground">
                              <Edit3 className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete({ ...spec, isBrandSpec: true })} className="bg-emerald-300 text-blue-900 hover:bg-destructive/90">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {displayedGuidelines.length === 0 && displayedBrandSpecs.length === 0 && (
                <p className="text-slate-500">No brand guidelines found for your assigned usernames.</p>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{guidelineToDelete?.name}" guideline for username "{guidelineToDelete?.user_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
