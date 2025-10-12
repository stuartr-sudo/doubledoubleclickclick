
import React, { useState, useEffect } from "react";
import { OnboardingStep } from "@/api/entities";
import { AppSettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, X, Plus, ArrowUp, ArrowDown, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingStepManager() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState("");
  const [showWelcomeVideoEditor, setShowWelcomeVideoEditor] = useState(false);
  const [topicsVideoUrl, setTopicsVideoUrl] = useState("");
  const [showTopicsVideoEditor, setShowTopicsVideoEditor] = useState(false);
  const [shopifyVideoUrl, setShopifyVideoUrl] = useState("");
  const [showShopifyVideoEditor, setShowShopifyVideoEditor] = useState(false);
  const [tokenHelpVideoUrl, setTokenHelpVideoUrl] = useState(""); // NEW state for token help video
  const [showTokenHelpVideoEditor, setShowTokenHelpVideoEditor] = useState(false); // NEW state for token help video editor
  const [videoRefreshKey, setVideoRefreshKey] = useState(0); // Force iframe refresh

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    loom_url: "",
    duration: "",
    is_active: true
  });

  useEffect(() => {
    loadSteps();
    loadVideoSettings();
  }, []);

  const extractLoomEmbedUrl = (embedCode) => {
    if (!embedCode) return '';
    
    // If it's already just a URL, return it with cache buster
    if (embedCode.startsWith('https://www.loom.com/embed/')) {
      return embedCode + (embedCode.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    
    // Extract iframe src from full embed HTML
    const iframeSrcMatch = embedCode.match(/src="([^"]+)"/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1] + (iframeSrcMatch[1].includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    
    return embedCode;
  };

  const loadSteps = async () => {
    try {
      const data = await OnboardingStep.list("step_number");
      setSteps(data);
    } catch (error) {
      console.error("Error loading onboarding steps:", error);
      toast.error("Failed to load onboarding steps");
    } finally {
      setLoading(false);
    }
  };

  const loadVideoSettings = async () => {
    try {
      const settings = await AppSettings.list();
      const welcomeSetting = settings.find(s => s.key === "welcome_onboarding_video");
      const topicsSetting = settings.find(s => s.key === "topics_onboarding_video");
      const shopifySetting = settings.find(s => s.key === "shopify_setup_video");
      const tokenHelpSetting = settings.find(s => s.key === "token_help_video"); // NEW: Find token help setting
      
      setWelcomeVideoUrl(welcomeSetting?.value || "");
      setTopicsVideoUrl(topicsSetting?.value || "");
      setShopifyVideoUrl(shopifySetting?.value || "");
      setTokenHelpVideoUrl(tokenHelpSetting?.value || ""); // NEW: Set token help video URL
      setVideoRefreshKey(prev => prev + 1); // Force refresh
    } catch (error) {
      console.error("Error loading video settings:", error);
    }
  };

  const handleEdit = (step) => {
    setEditingStep(step);
    setFormData({
      title: step.title || "",
      description: step.description || "",
      loom_url: step.loom_url || "",
      duration: step.duration || "",
      is_active: step.is_active !== false
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      const cleanLoomUrl = extractLoomEmbedUrl(formData.loom_url);
      
      await OnboardingStep.update(editingStep.id, {
        ...formData,
        loom_url: cleanLoomUrl
      });
      toast.success("Onboarding step updated successfully");
      setShowEditDialog(false);
      setEditingStep(null);
      loadSteps();
      setVideoRefreshKey(prev => prev + 1); // Force refresh
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update onboarding step");
    }
  };

  const handleCancel = () => {
    setShowEditDialog(false);
    setEditingStep(null);
    setFormData({
      title: "",
      description: "",
      loom_url: "",
      duration: "",
      is_active: true
    });
  };

  const moveStep = async (stepId, direction) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const currentNumber = step.step_number;
    const targetNumber = direction === 'up' ? currentNumber - 1 : currentNumber + 1;
    const targetStep = steps.find(s => s.step_number === targetNumber);

    if (!targetStep) return;

    try {
      await OnboardingStep.update(step.id, { step_number: targetNumber });
      await OnboardingStep.update(targetStep.id, { step_number: currentNumber });
      
      toast.success("Step order updated");
      loadSteps();
    } catch (error) {
      console.error("Error reordering steps:", error);
      toast.error("Failed to reorder steps");
    }
  };

  const handleSaveWelcomeVideo = async () => {
    try {
      const settings = await AppSettings.list();
      const existing = settings.find(s => s.key === "welcome_onboarding_video");
      
      if (existing) {
        await AppSettings.update(existing.id, { value: welcomeVideoUrl });
      } else {
        await AppSettings.create({
          key: "welcome_onboarding_video",
          value: welcomeVideoUrl,
          description: "Welcome page onboarding video embed code"
        });
      }
      
      setShowWelcomeVideoEditor(false);
      toast.success("Welcome video updated");
      await loadVideoSettings(); // Reload to refresh cache
    } catch (error) {
      console.error("Error saving welcome video:", error);
      toast.error("Failed to save welcome video");
    }
  };

  const handleSaveTopicsVideo = async () => {
    try {
      const settings = await AppSettings.list();
      const existing = settings.find(s => s.key === "topics_onboarding_video");
      
      if (existing) {
        await AppSettings.update(existing.id, { value: topicsVideoUrl });
      } else {
        await AppSettings.create({
          key: "topics_onboarding_video",
          value: topicsVideoUrl,
          description: "Topics onboarding video embed code"
        });
      }
      
      setShowTopicsVideoEditor(false);
      toast.success("Topics video updated");
      await loadVideoSettings(); // Reload to refresh cache
    } catch (error) {
      console.error("Error saving topics video:", error);
      toast.error("Failed to save topics video");
    }
  };

  const handleSaveShopifyVideo = async () => {
    try {
      const settings = await AppSettings.list();
      const existing = settings.find(s => s.key === "shopify_setup_video");
      
      if (existing) {
        await AppSettings.update(existing.id, { value: shopifyVideoUrl });
      } else {
        await AppSettings.create({
          key: "shopify_setup_video",
          value: shopifyVideoUrl,
          description: "Shopify API setup tutorial video embed code"
        });
      }
      
      setShowShopifyVideoEditor(false);
      toast.success("Shopify setup video updated");
      await loadVideoSettings();
    } catch (error) {
      console.error("Error saving Shopify video:", error);
      toast.error("Failed to save Shopify video");
    }
  };

  const handleSaveTokenHelpVideo = async () => { // NEW: Function to save token help video
    try {
      const settings = await AppSettings.list();
      const existing = settings.find(s => s.key === "token_help_video");
      
      if (existing) {
        await AppSettings.update(existing.id, { value: tokenHelpVideoUrl });
      } else {
        await AppSettings.create({
          key: "token_help_video",
          value: tokenHelpVideoUrl,
          description: "Token help video shown in header"
        });
      }
      
      setShowTokenHelpVideoEditor(false);
      toast.success("Token help video updated");
      await loadVideoSettings(); // Reload to refresh cache
    } catch (error) {
      console.error("Error saving token help video:", error);
      toast.error("Failed to save token help video");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading onboarding steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Onboarding Step Manager</h1>
        </div>

        {/* Token Help Video Settings - NEW FIRST ITEM */}
        <Card className="mb-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">★</div>
              <Play className="w-5 h-5" />
              Token Help Video (Header)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-yellow-700">
                <strong>This video appears</strong> when users click the help icon next to the token counter in the header menu.
              </p>
              {tokenHelpVideoUrl && (
                <div className="aspect-video bg-white rounded border border-yellow-200">
                  <div
                    key={`token-help-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: tokenHelpVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTokenHelpVideoEditor(true)}
                  className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Token Help Video
                </Button>
                <span className="text-sm text-slate-600">
                  {tokenHelpVideoUrl ? "Video configured" : "No video configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Video Settings - SECOND */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <Play className="w-5 h-5" />
              Welcome Video Settings (First Video)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-blue-700">
                <strong>This is the FIRST video</strong> that appears at the top of the Welcome page before any onboarding steps.
              </p>
              {welcomeVideoUrl && (
                <div className="aspect-video bg-white rounded border border-blue-200">
                  <div
                    key={`welcome-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: welcomeVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowWelcomeVideoEditor(true)}
                  className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Welcome Video
                </Button>
                <span className="text-sm text-slate-600">
                  {welcomeVideoUrl ? "Video configured" : "No video configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Steps - THIRD */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            Onboarding Steps (After Welcome Video)
          </h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className="border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                        {step.step_number}
                      </span>
                      {step.title}
                      {!step.is_active && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Inactive</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(step)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 mb-2">{step.description}</p>
                      <p className="text-sm text-slate-500">
                        Duration: {step.duration || "Not set"}
                      </p>
                    </div>
                    <div>
                      {step.loom_url ? (
                        <div className="aspect-video bg-slate-100 rounded border">
                          <iframe
                            key={`step-${step.id}-${videoRefreshKey}`}
                            src={extractLoomEmbedUrl(step.loom_url)}
                            frameBorder="0"
                            allowFullScreen
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            className="w-full h-full rounded"
                          ></iframe>
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-100 rounded border flex items-center justify-center">
                          <p className="text-slate-400 text-sm">No video URL set</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Topics Video Settings - FOURTH */}
        <Card className="mb-8 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <Play className="w-5 h-5" />
              Topics Onboarding Video Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-purple-700">
                This video appears during the Topics onboarding flow for all users.
              </p>
              {topicsVideoUrl && (
                <div className="aspect-video bg-white rounded border border-purple-200">
                  <div
                    key={`topics-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: topicsVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTopicsVideoEditor(true)}
                  className="bg-white border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Manage Topics Videos
                </Button>
                <span className="text-sm text-slate-600">
                  {topicsVideoUrl ? "Video configured" : "No video configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopify Setup Video - FIFTH */}
        <Card className="mb-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <Play className="w-5 h-5" />
              Shopify Setup Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-green-700">
                This video helps users create a Shopify API token and configure publishing.
              </p>
              {shopifyVideoUrl && (
                <div className="aspect-video bg-white rounded border border-green-200">
                  <div
                    key={`shopify-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: shopifyVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowShopifyVideoEditor(true)}
                  className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Shopify Tutorial
                </Button>
                <span className="text-sm text-slate-600">
                  {shopifyVideoUrl ? "Video configured" : "No video configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Step Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Onboarding Step {editingStep?.step_number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Step title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Step description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="loom_url">Loom Video URL or Embed Code</Label>
              <Textarea
                id="loom_url"
                value={formData.loom_url}
                onChange={(e) => setFormData({...formData, loom_url: e.target.value})}
                placeholder="Paste either:&#10;1. https://www.loom.com/embed/...&#10;2. Full embed code: <div style=...><iframe src=...></div>"
                rows={4}
                className="font-mono text-xs"
              />
              <div className="text-xs text-slate-500 mt-1 space-y-1">
                <p><strong>Accepted formats:</strong></p>
                <p>• Direct embed URL: https://www.loom.com/embed/...</p>
                <p>• Full Loom embed code (HTML div with iframe)</p>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="e.g., 3 min"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Step is active</Label>
            </div>

            {formData.loom_url && (
              <div>
                <Label>Video Preview</Label>
                <div className="aspect-video bg-slate-100 rounded border mt-2">
                  <iframe
                    key={`preview-${videoRefreshKey}`}
                    src={extractLoomEmbedUrl(formData.loom_url)}
                    frameBorder="0"
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    allowFullScreen
                    className="w-full h-full rounded"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Video Editor */}
      <Dialog open={showWelcomeVideoEditor} onOpenChange={setShowWelcomeVideoEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Welcome Video (First Video)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="welcome_video">Welcome Video Embed Code</Label>
              <Textarea
                id="welcome_video"
                value={welcomeVideoUrl}
                onChange={(e) => setWelcomeVideoUrl(e.target.value)}
                placeholder="Paste your Loom embed code here..."
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the full Loom embed code (HTML div with iframe).
              </p>
            </div>

            {welcomeVideoUrl && (
              <div>
                <Label>Preview</Label>
                <div className="aspect-video bg-slate-100 rounded border mt-2">
                  <div
                    key={`welcome-editor-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: welcomeVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowWelcomeVideoEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWelcomeVideo}>
              Save Welcome Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topics Video Editor */}
      <Dialog open={showTopicsVideoEditor} onOpenChange={setShowTopicsVideoEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topics Onboarding Video</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="topics_video">Topics Video Embed Code</Label>
              <Textarea
                id="topics_video"
                value={topicsVideoUrl}
                onChange={(e) => setTopicsVideoUrl(e.target.value)}
                placeholder="Paste your Loom embed code here..."
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the full Loom embed code (HTML div with iframe).
              </p>
            </div>

            {topicsVideoUrl && (
              <div>
                <Label>Preview</Label>
                <div className="aspect-video bg-slate-100 rounded border mt-2">
                  <div
                    key={`topics-editor-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: topicsVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowTopicsVideoEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTopicsVideo}>
              Save Topics Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shopify Video Editor */}
      <Dialog open={showShopifyVideoEditor} onOpenChange={setShowShopifyVideoEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shopify Setup Tutorial</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopify_video">Shopify Tutorial Video Embed Code</Label>
              <Textarea
                id="shopify_video"
                value={shopifyVideoUrl}
                onChange={(e) => setShopifyVideoUrl(e.target.value)}
                placeholder="Paste your Loom embed code here..."
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the full Loom embed code (HTML div with iframe).
              </p>
            </div>

            {shopifyVideoUrl && (
              <div>
                <Label>Preview</Label>
                <div className="aspect-video bg-slate-100 rounded border mt-2">
                  <div
                    key={`shopify-editor-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: shopifyVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowShopifyVideoEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveShopifyVideo}>
              Save Shopify Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Help Video Editor */}
      <Dialog open={showTokenHelpVideoEditor} onOpenChange={setShowTokenHelpVideoEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Token Help Video</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="token_help_video">Token Help Video Embed Code</Label>
              <Textarea
                id="token_help_video"
                value={tokenHelpVideoUrl}
                onChange={(e) => setTokenHelpVideoUrl(e.target.value)}
                placeholder="Paste your Loom embed code here..."
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste the full Loom embed code (HTML div with iframe).
              </p>
            </div>

            {tokenHelpVideoUrl && (
              <div>
                <Label>Preview</Label>
                <div className="aspect-video bg-slate-100 rounded border mt-2">
                  <div
                    key={`token-help-editor-${videoRefreshKey}`}
                    dangerouslySetInnerHTML={{ __html: tokenHelpVideoUrl }}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowTokenHelpVideoEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTokenHelpVideo}>
              Save Token Help Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
