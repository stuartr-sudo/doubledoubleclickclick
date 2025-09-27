
import React, { useState, useEffect } from "react";
import { OnboardingStep } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, X, Plus, ArrowUp, ArrowDown, Play } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingStepManager() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(""); // New state for welcome video
  const [showWelcomeVideoEditor, setShowWelcomeVideoEditor] = useState(false); // New state for welcome video editor dialog
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    loom_url: "",
    duration: "",
    is_active: true
  });

  useEffect(() => {
    loadSteps();
    // In a real application, you would also load the welcomeVideoUrl from a settings entity here
    // For this example, we'll initialize it as empty or a placeholder
    // setWelcomeVideoUrl(loadWelcomeVideoFromSettings());
  }, []);

  // Helper function to extract iframe src from full embed code
  const extractLoomEmbedUrl = (embedCode) => {
    if (!embedCode) return '';
    
    // If it's already just a URL, return it
    if (embedCode.startsWith('https://www.loom.com/embed/')) {
      return embedCode;
    }
    
    // Extract iframe src from full embed HTML
    const iframeSrcMatch = embedCode.match(/src="([^"]+)"/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      return iframeSrcMatch[1];
    }
    
    return embedCode; // Return as-is if we can't parse it
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
      // Extract just the iframe src URL for storage
      const cleanLoomUrl = extractLoomEmbedUrl(formData.loom_url);
      
      await OnboardingStep.update(editingStep.id, {
        ...formData,
        loom_url: cleanLoomUrl
      });
      toast.success("Onboarding step updated successfully");
      setShowEditDialog(false);
      setEditingStep(null);
      loadSteps();
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

    if (!targetStep) return; // Can't move beyond bounds

    try {
      // Swap step numbers
      await OnboardingStep.update(step.id, { step_number: targetNumber });
      await OnboardingStep.update(targetStep.id, { step_number: currentNumber });
      
      toast.success("Step order updated");
      loadSteps();
    } catch (error) {
      console.error("Error reordering steps:", error);
      toast.error("Failed to reorder steps");
    }
  };

  const handleSaveWelcomeVideo = () => {
    // For now, this just closes the dialog - you can later save this to a settings entity
    // Example: await Settings.update('welcome_video_embed', welcomeVideoUrl);
    setShowWelcomeVideoEditor(false);
    toast.success("Welcome video updated (note: implement persistent storage)");
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

        {/* Welcome Video Section */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Welcome Video Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-blue-700">
                This video appears at the top of the Welcome page before the onboarding steps.
              </p>
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
                    {/* Reorder buttons */}
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
                          src={extractLoomEmbedUrl(step.loom_url)}
                          frameBorder="0"
                          allowFullScreen
                          webkitallowfullscreen
                          mozallowfullscreen
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

        {/* Edit Dialog */}
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

              {/* Video Preview */}
              {formData.loom_url && (
                <div>
                  <Label>Video Preview</Label>
                  <div className="aspect-video bg-slate-100 rounded border mt-2">
                    <iframe
                      src={extractLoomEmbedUrl(formData.loom_url)}
                      frameBorder="0"
                      webkitallowfullscreen
                      mozallowfullscreen
                      allowfullscreen
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

        {/* Welcome Video Editor Dialog */}
        <Dialog open={showWelcomeVideoEditor} onOpenChange={setShowWelcomeVideoEditor}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Welcome Video</DialogTitle>
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
                  Paste the full Loom embed code (HTML div with iframe). Example: &lt;div style=&quot;position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;&quot;&gt;&lt;iframe src=&quot;https://www.loom.com/embed/...&quot; frameborder=&quot;0&quot; webkitallowfullscreen mozallowfullscreen allowfullscreen style=&quot;position: absolute; top: 0; left: 0; width: 100%; height: 100%;&quot;&gt;&lt;/iframe&gt;&lt;/div&gt;
                </p>
              </div>

              {/* Preview */}
              {welcomeVideoUrl && (
                <div>
                  <Label>Preview</Label>
                  <div className="aspect-video bg-slate-100 rounded border mt-2">
                    <div
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
      </div>
    </div>
  );
}
