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
import { Plus, Save, Trash2, Edit3, Loader2, Globe, FileCode, Settings, Palette, Type, Layout, Eye } from "lucide-react";
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

// Import new brand components
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

const initialBrandSpecState = {
  id: null,
  user_name: "",
  name: "",
  colors: {
    primary: "#1a365d",
    secondary: "#2c5282",
    accent: "#3182ce",
    text: "#1a202c",
    background: "#ffffff",
    muted: "#718096",
    success: "#38a169",
    warning: "#d69e2e",
    error: "#e53e3e"
  },
  typography: {
    font_family: "Inter, system-ui, sans-serif",
    heading_font: "Inter, system-ui, sans-serif",
    font_size_base: "16px",
    line_height: "1.6",
    heading_weight: "600",
    heading_sizes: {
      h1: "2.5rem",
      h2: "2rem",
      h3: "1.5rem",
      h4: "1.25rem",
      h5: "1.125rem",
      h6: "1rem"
    }
  },
  layout: {
    layout_type: "centered",
    max_width: "1200px",
    content_padding: "20px",
    section_spacing: "40px",
    element_spacing: "16px",
    border_radius: "8px",
    box_shadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  components: {
    buttons: {
      primary_bg: "#1a365d",
      primary_text: "#ffffff",
      secondary_bg: "#f7fafc",
      secondary_text: "#1a202c",
      border_radius: "6px",
      padding: "12px 24px"
    },
    links: {
      color: "#3182ce",
      hover_color: "#2c5282",
      text_decoration: "underline"
    },
    images: {
      border_radius: "8px",
      max_width: "100%",
      margin: "20px 0"
    }
  },
  custom_css: "",
  voice_and_tone: "",
  content_style_rules: "",
  prohibited_elements: "",
  preferred_elements: "",
  target_market: "",
  website_specs: {
    domain: "",
    cms_type: "",
    theme_colors: [],
    font_stack: "",
    layout_type: ""
  }
};

export default function BrandGuidelinesManager() {
  const [guidelines, setGuidelines] = useState([]);
  const [brandSpecs, setBrandSpecs] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [newGuideline, setNewGuideline] = useState(initialGuidelineState);
  const [newBrandSpec, setNewBrandSpec] = useState(initialBrandSpecState);
  const [isLoading, setIsLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cssFile, setCssFile] = useState(null);
  const [isUploadingCss, setIsUploadingCss] = useState(false);
  const [usernameDetails, setUsernameDetails] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Dialog states
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [guidelineToDelete, setGuidelineToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Feature flags
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping', { currentUser });
  const { enabled: showCustomCssUpload } = useFeatureFlag('show_brand_guidelines_css_upload', { currentUser });
  const { enabled: showEnhancedBrandSpecs } = useFeatureFlag('show_enhanced_brand_specs', { currentUser });

  const { consumeTokensForFeature } = useTokenConsumption();

  const loadGuidelinesAndUsernames = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch user first to determine permissions
      const user = await User.me().catch(() => null);
      setCurrentUser(user);

      // Fetch all data (admin can see all, then filter)
      const [allGuidelines, allBrandSpecs, allUsernames] = await Promise.all([
        BrandGuidelines.list("-updated_date", 200).catch(() => []),
        BrandSpecifications.list("-updated_date", 200).catch(() => []),
        Username.list("-updated_date", 100).catch(() => [])
      ]);

      let visibleUsernames = [];
      let visibleGuidelines = [];
      let visibleBrandSpecs = [];

      // Admins and superadmins see everything
      if (user && (user.role === 'admin' || user.is_superadmin)) {
        visibleUsernames = allUsernames.filter((u) => u.is_active);
        visibleGuidelines = allGuidelines;
        visibleBrandSpecs = allBrandSpecs;
      } else if (user && Array.isArray(user.assigned_usernames) && user.assigned_usernames.length > 0) {
        // Regular users only see content for their assigned usernames
        const assigned = new Set(user.assigned_usernames);
        visibleUsernames = allUsernames.filter((u) => u.is_active && assigned.has(u.user_name));
        visibleGuidelines = allGuidelines.filter((g) => assigned.has(g.user_name));
        visibleBrandSpecs = allBrandSpecs.filter((b) => assigned.has(b.user_name));
      } else {
        // No user or no assigned usernames
        visibleUsernames = [];
        visibleGuidelines = [];
        visibleBrandSpecs = [];
      }

      setUsernames(visibleUsernames);
      setGuidelines(visibleGuidelines);
      setBrandSpecs(visibleBrandSpecs);

      // Populate usernameDetails for CSS URI
      const details = {};
      for (const uname of visibleUsernames) {
        details[uname.user_name] = uname;
      }
      setUsernameDetails(details);

      // Set default username based on workspace or first available
      const defaultUsername = useWorkspaceScoping && globalUsername 
        ? globalUsername 
        : (visibleUsernames.length > 0 ? visibleUsernames[0].user_name : "");
      
      if (defaultUsername && !newGuideline.user_name) {
        setNewGuideline(prev => ({ ...prev, user_name: defaultUsername }));
        setNewBrandSpec(prev => ({ ...prev, user_name: defaultUsername }));
      }

    } catch (error) {
      console.error("Error loading guidelines:", error);
      toast.error("Failed to load brand guidelines");
    } finally {
      setIsLoading(false);
    }
  }, [useWorkspaceScoping, globalUsername, newGuideline.user_name]);

  useEffect(() => {
    loadGuidelinesAndUsernames();
  }, [loadGuidelinesAndUsernames]);

  // Handle website analysis completion
  const handleWebsiteAnalysisComplete = (analysisData) => {
    const {
      extracted_colors = {},
      extracted_typography = {},
      extracted_layout = {},
      website_domain = ""
    } = analysisData;

    setNewBrandSpec(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...extracted_colors
      },
      typography: {
        ...prev.typography,
        ...extracted_typography
      },
      layout: {
        ...prev.layout,
        ...extracted_layout
      },
      website_specs: {
        ...prev.website_specs,
        domain: website_domain,
        theme_colors: extracted_colors ? Object.values(extracted_colors).slice(0, 6) : [],
        font_stack: extracted_typography?.font_family || "",
        layout_type: extracted_layout?.type || ""
      }
    }));
  };

  // Save brand specifications
  const handleSaveBrandSpec = async () => {
    if (!newBrandSpec.name || !newBrandSpec.user_name) {
      toast.error("Please provide a name and select a username");
      return;
    }

    setIsSaving(true);
    try {
      if (newBrandSpec.id) {
        await BrandSpecifications.update(newBrandSpec.id, newBrandSpec);
        toast.success("Brand specifications updated successfully");
      } else {
        await BrandSpecifications.create(newBrandSpec);
        toast.success("Brand specifications created successfully");
      }
      
      await loadGuidelinesAndUsernames();
      setNewBrandSpec(initialBrandSpecState);
    } catch (error) {
      console.error("Error saving brand specs:", error);
      toast.error("Failed to save brand specifications");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete brand specifications
  const handleDeleteBrandSpec = async (id) => {
    try {
      await BrandSpecifications.delete(id);
      toast.success("Brand specifications deleted");
      await loadGuidelinesAndUsernames();
    } catch (error) {
      console.error("Error deleting brand specs:", error);
      toast.error("Failed to delete brand specifications");
    }
  };

  // Edit brand specifications
  const handleEditBrandSpec = (spec) => {
    setNewBrandSpec(spec);
    setIsEditing(true);
  };

  // Filter displayed data based on workspace selection
  const displayedGuidelines = useWorkspaceScoping && globalUsername
    ? guidelines.filter(g => g.user_name === globalUsername)
    : guidelines;

  const displayedBrandSpecs = useWorkspaceScoping && globalUsername
    ? brandSpecs.filter(b => b.user_name === globalUsername)
    : brandSpecs;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading brand guidelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Brand Guidelines Manager</h1>
          <p className="text-slate-600">
            Configure brand specifications, voice guidelines, and visual identity for your content
          </p>
        </div>

        <Tabs defaultValue={showEnhancedBrandSpecs ? "enhanced" : "guidelines"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enhanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Enhanced Brand Specs
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Brand Guidelines
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Brand Specifications Tab */}
          <TabsContent value="enhanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {isEditing ? "Edit" : "Create"} Brand Specifications
                    </h2>
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setNewBrandSpec(initialBrandSpecState);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Specification Name *
                        </label>
                        <Input
                          value={newBrandSpec.name}
                          onChange={(e) => setNewBrandSpec(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Main Brand, Secondary Brand"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Username *
                        </label>
                        <Select
                          value={newBrandSpec.user_name}
                          onValueChange={(value) => setNewBrandSpec(prev => ({ ...prev, user_name: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select username" />
                          </SelectTrigger>
                          <SelectContent>
                            {usernames.map((username) => (
                              <SelectItem key={username.user_name} value={username.user_name}>
                                {username.user_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Website Analysis */}
                    <WebsiteAnalyzer onAnalysisComplete={handleWebsiteAnalysisComplete} />

                    {/* Visual Identity */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Visual Identity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BrandColorPicker
                          label="Primary Color"
                          value={newBrandSpec.colors.primary}
                          onChange={(color) => setNewBrandSpec(prev => ({
                            ...prev,
                            colors: { ...prev.colors, primary: color }
                          }))}
                        />
                        <BrandColorPicker
                          label="Secondary Color"
                          value={newBrandSpec.colors.secondary}
                          onChange={(color) => setNewBrandSpec(prev => ({
                            ...prev,
                            colors: { ...prev.colors, secondary: color }
                          }))}
                        />
                        <BrandColorPicker
                          label="Accent Color"
                          value={newBrandSpec.colors.accent}
                          onChange={(color) => setNewBrandSpec(prev => ({
                            ...prev,
                            colors: { ...prev.colors, accent: color }
                          }))}
                        />
                        <BrandColorPicker
                          label="Text Color"
                          value={newBrandSpec.colors.text}
                          onChange={(color) => setNewBrandSpec(prev => ({
                            ...prev,
                            colors: { ...prev.colors, text: color }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Typography */}
                    <FontSelector
                      label="Typography"
                      fontFamily={newBrandSpec.typography.font_family}
                      fontSize={newBrandSpec.typography.font_size_base}
                      fontWeight={newBrandSpec.typography.heading_weight}
                      onFontFamilyChange={(fontFamily) => setNewBrandSpec(prev => ({
                        ...prev,
                        typography: { ...prev.typography, font_family: fontFamily }
                      }))}
                      onFontSizeChange={(fontSize) => setNewBrandSpec(prev => ({
                        ...prev,
                        typography: { ...prev.typography, font_size_base: fontSize }
                      }))}
                      onFontWeightChange={(fontWeight) => setNewBrandSpec(prev => ({
                        ...prev,
                        typography: { ...prev.typography, heading_weight: fontWeight }
                      }))}
                    />

                    {/* Layout & Spacing */}
                    <LayoutConfigurator
                      layout={newBrandSpec.layout}
                      onChange={(layout) => setNewBrandSpec(prev => ({ ...prev, layout }))}
                    />

                    {/* Brand Guidelines */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Brand Guidelines</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Voice and Tone
                          </label>
                          <Textarea
                            value={newBrandSpec.voice_and_tone}
                            onChange={(e) => setNewBrandSpec(prev => ({ ...prev, voice_and_tone: e.target.value }))}
                            placeholder="Describe the voice and tone for your brand..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Target Market
                          </label>
                          <Textarea
                            value={newBrandSpec.target_market}
                            onChange={(e) => setNewBrandSpec(prev => ({ ...prev, target_market: e.target.value }))}
                            placeholder="Describe your target audience..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Content Style Rules
                          </label>
                          <Textarea
                            value={newBrandSpec.content_style_rules}
                            onChange={(e) => setNewBrandSpec(prev => ({ ...prev, content_style_rules: e.target.value }))}
                            placeholder="e.g., Use active voice, keep sentences short..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Prohibited Elements
                          </label>
                          <Textarea
                            value={newBrandSpec.prohibited_elements}
                            onChange={(e) => setNewBrandSpec(prev => ({ ...prev, prohibited_elements: e.target.value }))}
                            placeholder="Words, phrases, or elements to avoid..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced CSS */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Advanced Custom CSS</h3>
                      <Textarea
                        value={newBrandSpec.custom_css}
                        onChange={(e) => setNewBrandSpec(prev => ({ ...prev, custom_css: e.target.value }))}
                        placeholder="/* Additional custom CSS styles */"
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveBrandSpec}
                        disabled={isSaving || !newBrandSpec.name || !newBrandSpec.user_name}
                        className="px-8"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? "Update" : "Create"} Brand Spec
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
                <BrandPreview brandSpecs={newBrandSpec} />
                
                {/* Existing Brand Specifications */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Existing Specifications</h3>
                  {displayedBrandSpecs.length === 0 ? (
                    <p className="text-slate-500 text-sm">No brand specifications configured yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {displayedBrandSpecs.map((spec) => (
                        <div key={spec.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{spec.name}</p>
                            <p className="text-sm text-slate-500">{spec.user_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBrandSpec(spec)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBrandSpec(spec.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Legacy Brand Guidelines Tab */}
          <TabsContent value="guidelines" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {isEditing ? "Edit" : "Create"} Brand Guidelines
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Guidelines Name *
                      </label>
                      <Input
                        value={newGuideline.name}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Main Brand Guidelines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Username *
                      </label>
                      <Select
                        value={newGuideline.user_name}
                        onValueChange={(value) => setNewGuideline(prev => ({ ...prev, user_name: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select username" />
                        </SelectTrigger>
                        <SelectContent>
                          {usernames.map((username) => (
                            <SelectItem key={username.user_name} value={username.user_name}>
                              {username.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Brand Guidelines Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Voice and Tone
                      </label>
                      <Textarea
                        value={newGuideline.voice_and_tone}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, voice_and_tone: e.target.value }))}
                        placeholder="Describe the voice and tone for your brand..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Content Style Rules
                      </label>
                      <Textarea
                        value={newGuideline.content_style_rules}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, content_style_rules: e.target.value }))}
                        placeholder="e.g., Use active voice, keep sentences short..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prohibited Elements
                      </label>
                      <Textarea
                        value={newGuideline.prohibited_elements}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, prohibited_elements: e.target.value }))}
                        placeholder="Words, phrases, or elements to avoid..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Elements
                      </label>
                      <Textarea
                        value={newGuideline.preferred_elements}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, preferred_elements: e.target.value }))}
                        placeholder="Words, phrases, or elements to encourage..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Target Market
                      </label>
                      <Textarea
                        value={newGuideline.target_market}
                        onChange={(e) => setNewGuideline(prev => ({ ...prev, target_market: e.target.value }))}
                        placeholder="Describe your target audience..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Custom CSS Section */}
                  {showCustomCssUpload && (
                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Custom Brand CSS</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Upload a CSS file to apply your website's exact styling to the editor preview.
                      </p>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept=".css"
                            onChange={(e) => setCssFile(e.target.files[0])}
                            className="bg-white border-slate-300 text-slate-900"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            if (!cssFile || !newGuideline.user_name) {
                              toast.error("Please select a CSS file and username");
                              return;
                            }
                            setIsUploadingCss(true);
                            try {
                              await uploadUserCss({
                                file: cssFile,
                                username: newGuideline.user_name
                              });
                              toast.success("CSS uploaded successfully");
                              await loadGuidelinesAndUsernames();
                            } catch (error) {
                              toast.error("Failed to upload CSS");
                            } finally {
                              setIsUploadingCss(false);
                            }
                          }}
                          disabled={isUploadingCss || !cssFile}
                        >
                          {isUploadingCss ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FileCode className="w-4 h-4 mr-2" />
                              Upload CSS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        if (!newGuideline.name || !newGuideline.user_name) {
                          toast.error("Please provide a name and select a username");
                          return;
                        }
                        setIsSaving(true);
                        try {
                          if (newGuideline.id) {
                            await BrandGuidelines.update(newGuideline.id, newGuideline);
                            toast.success("Brand guidelines updated successfully");
                          } else {
                            await BrandGuidelines.create(newGuideline);
                            toast.success("Brand guidelines created successfully");
                          }
                          await loadGuidelinesAndUsernames();
                          setNewGuideline(initialGuidelineState);
                        } catch (error) {
                          toast.error("Failed to save brand guidelines");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving || !newGuideline.name || !newGuideline.user_name}
                      className="px-8"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isEditing ? "Update" : "Create"} Guidelines
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Guidelines List */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Existing Guidelines</h3>
                {displayedGuidelines.length === 0 ? (
                  <p className="text-slate-500 text-sm">No brand guidelines configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {displayedGuidelines.map((guideline) => (
                      <div key={guideline.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{guideline.name}</p>
                          <p className="text-sm text-slate-500">{guideline.user_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewGuideline(guideline);
                              setIsEditing(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setGuidelineToDelete(guideline);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Brand Guidelines</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{guidelineToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (guidelineToDelete) {
                    try {
                      await BrandGuidelines.delete(guidelineToDelete.id);
                      toast.success("Brand guidelines deleted");
                      await loadGuidelinesAndUsernames();
                    } catch (error) {
                      toast.error("Failed to delete brand guidelines");
                    }
                  }
                  setShowDeleteConfirm(false);
                  setGuidelineToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}