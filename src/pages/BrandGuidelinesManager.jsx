
import React, { useEffect, useState, useCallback } from "react";
import { BrandGuidelines } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2, Edit3, Loader2, Globe, FileCode } from "lucide-react";
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
} from
"@/components/ui/alert-dialog";

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

export default function BrandGuidelinesManager() {
  const [guidelines, setGuidelines] = useState([]); // Renamed from items
  const [usernames, setUsernames] = useState([]);
  const [newGuideline, setNewGuideline] = useState(initialGuidelineState); // Renamed from form
  const [isLoading, setIsLoading] = useState(true); // Renamed from loading
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Renamed from analyzing
  const [cssFile, setCssFile] = useState(null);
  const [isUploadingCss, setIsUploadingCss] = useState(false); // Renamed from isUploading to isUploadingCss
  const [usernameDetails, setUsernameDetails] = useState({});
  const [currentUser, setCurrentUser] = useState(null); // New state for current user details

  // New states from outline for dialogs/saving
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [guidelineToDelete, setGuidelineToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping', { currentUser });
  const { enabled: showCustomCssUpload } = useFeatureFlag('show_brand_guidelines_css_upload', { currentUser });

  const { consumeTokensForFeature } = useTokenConsumption();

  const loadGuidelinesAndUsernames = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch user first to determine permissions
      const user = await User.me().catch(() => null);
      setCurrentUser(user);

      // Fetch all guidelines and usernames (admin can see all, then filter)
      const allGuidelines = await BrandGuidelines.list("-updated_date", 200).catch(() => []);
      const allUsernames = await Username.list("-updated_date", 100).catch(() => []);

      let visibleUsernames = [];
      let visibleGuidelines = [];

      // Admins and superadmins see everything
      if (user && (user.role === 'admin' || user.is_superadmin)) {
        visibleUsernames = allUsernames.filter((u) => u.is_active); // Only active usernames
        visibleGuidelines = allGuidelines;
      } else if (user && Array.isArray(user.assigned_usernames) && user.assigned_usernames.length > 0) {
        // Regular users only see content for their assigned usernames
        const assigned = new Set(user.assigned_usernames);
        visibleUsernames = allUsernames.filter((u) => u.is_active && assigned.has(u.user_name));
        visibleGuidelines = allGuidelines.filter((g) => assigned.has(g.user_name));
      } else {
        // No user or no assigned usernames, or user has no assigned usernames
        visibleUsernames = [];
        visibleGuidelines = [];
      }

      setUsernames(visibleUsernames);
      setGuidelines(visibleGuidelines);

      // Populate usernameDetails for currentUsernameCssUri
      const details = {};
      for (const uname of visibleUsernames) {
        details[uname.user_name] = uname;
      }
      setUsernameDetails(details);

      // Set the default username in the form if it's not already set
      // and ensure it's from the *visible* usernames.
      setNewGuideline((prev) => {
        let defaultUserName = prev.user_name;
        if (useWorkspaceScoping && globalUsername) {
          defaultUserName = globalUsername;
        } else if (!defaultUserName && visibleUsernames.length > 0) {
          defaultUserName = visibleUsernames[0].user_name;
        } else if (defaultUserName && !visibleUsernames.some((u) => u.user_name === defaultUserName)) {
          // If the previously selected username is no longer visible, clear it or pick a new one
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

  // Sync form's username with global workspace selection when feature is on
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
    setCssFile(null);
    setIsEditing(false); // Exit editing mode
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
    setIsEditing(true); // Enter editing mode
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (item) => {
    setGuidelineToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!guidelineToDelete) return;
    try {
      await BrandGuidelines.delete(guidelineToDelete.id);
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
    // Use the correct username depending on the feature flag
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

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl || !/^https?:\/\//i.test(websiteUrl)) {
      toast.error("Please enter a valid URL (including http/https).");
      return;
    }
    setIsAnalyzing(true);
    try {
      // 1) Fetch and extract text from website (server-side)
      const { data: extracted } = await extractWebsiteContent({ url: websiteUrl });
      if (!extracted?.success) {
        toast.error(extracted?.error || "Failed to fetch website content");
        setIsAnalyzing(false);
        return;
      }

      // 2) Ask LLM to analyze voice/tone/target market (+ optional rules)
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

      // NEW: auto-suggest a Guideline Name from the site host if empty
      let suggestedName = "";
      try {
        const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
        suggestedName = `${host} • Core Voice`;
      } catch (_) { }

      // NEW: ensure a username is selected if none (use first available from visible usernames)
      // This will be overridden by globalUsername if useWorkspaceScoping is true via useEffect.
      const defaultUserName = newGuideline.user_name?.trim() ? newGuideline.user_name : usernames[0]?.user_name || "";

      setNewGuideline((f) => ({
        ...f,
        user_name: defaultUserName,
        name: f.name?.trim() ? f.name : suggestedName,
        voice_and_tone: out.voice_and_tone || f.voice_and_tone,
        content_style_rules: out.content_style_rules || f.content_style_rules,
        prohibited_elements: prohibitedCsv || f.prohibited_elements,
        preferred_elements: preferredCsv || f.preferred_elements,
        // NEW: populate target market
        // if the Username entity already has target_market, user can override per-guideline here
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
    const selectedUsername = newGuideline.user_name; // Use newGuideline.user_name as the selectedUsername

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
      return; // Error toast is handled by the hook
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

        // Find the username record and update it
        const usernameRecord = usernames.find((u) => u.user_name === selectedUsername);
        if (usernameRecord) {
          await Username.update(usernameRecord.id, { default_css_file_uri: fileUri });
          toast.success("Custom CSS uploaded and linked to username.");
          // Refresh data to show new CSS file link
          await loadGuidelinesAndUsernames();
          setCssFile(null); // Clear file input
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
      const usernameRecord = usernames.find((u) => u.user_name === newGuideline.user_name); // newGuideline.user_name is kept in sync by useEffect
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

  // Filter existing guidelines based on workspace selection if flag is enabled
  const displayedGuidelines = useWorkspaceScoping && globalUsername
    ? guidelines.filter(g => g.user_name === globalUsername)
    : guidelines;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Brand Guidelines</h1>
          <p className="text-slate-600 mb-4">Create voice and tone rules per username. These power the “Brand It” feature.</p>

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
                    className="bg-white border-slate-300 text-slate-900 pl-9" />

                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAnalyzeWebsite}
                  disabled={isAnalyzing || !websiteUrl}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white">

                  {isAnalyzing ?
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing…
                    </> :

                    "Analyze"
                  }
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">We’ll fetch the site, analyze its content with AI, and fill in Voice & Tone, Style Rules, and Target Market automatically.</p>
          </div>

          {/* Custom CSS Section with improved spacing */}
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
                      className="bg-white border-slate-300 text-slate-900 pt-3 pb-5 px-4 h-14 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <Button
                    onClick={handleUploadCss}
                    disabled={isUploadingCss || !cssFile || !newGuideline.user_name}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-6">
                    {isUploadingCss ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCode className="w-4 h-4 mr-2" />}
                    {isUploadingCss ? "Uploading..." : "Upload & Link CSS"}
                  </Button>
                  {currentUsernameCssUri &&
                    <Button variant="destructive" onClick={handleRemoveCss} className="h-14 px-4">
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  }
                </div>
              </div>
              {currentUsernameCssUri &&
                <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
                  <span className="font-semibold">Current CSS:</span> {currentUsernameCssUri.split('/').pop()}
                </div>
              }
            </div>
          )}


          <div className="grid md:grid-cols-2 gap-4">
            {/* Username selection - conditionally rendered */}
            {useWorkspaceScoping ? (
              <div>
                <label className="text-sm text-slate-700">Username</label>
                <Input
                  value={globalUsername || "No workspace selected"}
                  disabled
                  className="bg-slate-100 border-slate-300 text-slate-500 mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm text-slate-700">Username</label>
                <Select value={newGuideline.user_name} onValueChange={(v) => setNewGuideline((f) => ({ ...f, user_name: v }))}>
                  <SelectTrigger id="username" className="w-full bg-white border-slate-300 text-slate-900 mt-1">
                    <SelectValue placeholder="Select username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {usernames.length > 0 ? (
                      usernames.map((u) => (
                        <SelectItem key={u.id} value={u.user_name}>
                          {u.user_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-slate-500">No usernames assigned.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm text-slate-700">Guideline Name</label>
              <Input value={newGuideline.name} onChange={(e) => setNewGuideline((f) => ({ ...f, name: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., Core Voice" />
            </div>

            {/* Target market */}
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Target Market</label>
              <Input
                value={newGuideline.target_market || ""}
                onChange={(e) => setNewGuideline((f) => ({ ...f, target_market: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 mt-1"
                placeholder="e.g., SMB marketers in North America" />

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
            <Button onClick={handleSave} className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {isSaving ? "Saving..." : newGuideline.id ? "Update" : "Create"}
            </Button>
            <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" disabled={isSaving}>
              <Edit3 className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-2xl font-bold mb-4">Existing Guidelines</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : displayedGuidelines.length > 0 ? (
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
                      <Button variant="outline" size="sm" onClick={() => handleEdit(g)} className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9 rounded-md">
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(g)} className="bg-emerald-300 text-blue-900 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-destructive/90 h-9 rounded-md">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No brand guidelines found for your assigned usernames.</p>
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
    </div>);

}
