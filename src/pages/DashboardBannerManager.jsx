import React, { useState, useEffect } from "react";
import { DashboardBanner } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, EyeOff, Sparkles, Users, TrendingUp, Zap, Star, Gift, Rocket, Crown, Diamond, Flame } from "lucide-react";
import { toast } from "sonner";
import VideoModal from "@/components/common/VideoModal";

const iconMap = {
  sparkles: Sparkles,
  users: Users,
  "trending-up": TrendingUp,
  zap: Zap,
  star: Star,
  gift: Gift,
  rocket: Rocket,
  crown: Crown,
  diamond: Diamond,
  fire: Flame
};

const badgeLabels = {
  none: "No Badge",
  limited_time: "Limited Time Offer",
  best_value: "Best Value",
  early_access: "Early Access"
};

export default function DashboardBannerManager() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    badge_type: "none",
    gradient_from: "blue-600",
    gradient_to: "blue-800",
    video_url: "",
    cta_text: "",
    cta_link: "",
    icon: "sparkles",
    is_active: true,
    sort_order: 0,
    show_to_roles: ["all"]
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const fetchedBanners = await DashboardBanner.list();
      setBanners(fetchedBanners.sort((a, b) => a.sort_order - b.sort_order));
    } catch (error) {
      console.error("Error loading banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await DashboardBanner.update(editingBanner.id, formData);
        toast.success("Banner updated successfully");
      } else {
        await DashboardBanner.create(formData);
        toast.success("Banner created successfully");
      }
      resetForm();
      loadBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Failed to save banner");
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      description: banner.description || "",
      badge_type: banner.badge_type || "none",
      gradient_from: banner.gradient_from || "blue-600",
      gradient_to: banner.gradient_to || "blue-800",
      video_url: banner.video_url || "",
      cta_text: banner.cta_text || "",
      cta_link: banner.cta_link || "",
      icon: banner.icon || "sparkles",
      is_active: banner.is_active !== false,
      sort_order: banner.sort_order || 0,
      show_to_roles: banner.show_to_roles || ["all"]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await DashboardBanner.delete(id);
      toast.success("Banner deleted");
      loadBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  const toggleActive = async (banner) => {
    try {
      await DashboardBanner.update(banner.id, { is_active: !banner.is_active });
      toast.success(`Banner ${!banner.is_active ? 'activated' : 'deactivated'}`);
      loadBanners();
    } catch (error) {
      console.error("Error toggling banner:", error);
      toast.error("Failed to update banner");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      badge_type: "none",
      gradient_from: "blue-600",
      gradient_to: "blue-800",
      video_url: "",
      cta_text: "",
      cta_link: "",
      icon: "sparkles",
      is_active: true,
      sort_order: 0,
      show_to_roles: ["all"]
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const activeBannerCount = banners.filter(b => b.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Banner Manager</h1>
            <p className="text-slate-600 mt-1">Manage promotional banners displayed on the dashboard (max 4 active)</p>
          </div>
          <Button onClick={() => setShowForm(true)} disabled={activeBannerCount >= 4} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Banner {activeBannerCount >= 4 && "(Limit Reached)"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-600">Loading banners...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner) => {
              const IconComponent = iconMap[banner.icon] || Sparkles;
              return (
                <Card key={banner.id} className={`${banner.is_active ? 'border-blue-200' : 'border-slate-200 opacity-60'}`}>
                  <CardHeader className={`bg-gradient-to-r from-${banner.gradient_from} to-${banner.gradient_to} text-white rounded-t-lg`}>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5" />
                        <span className="text-lg">{banner.title}</span>
                      </div>
                      {banner.badge_type !== 'none' && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {badgeLabels[banner.badge_type]}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-slate-700 mb-4">{banner.description}</p>
                    
                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span className={banner.is_active ? "text-green-600" : "text-slate-500"}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {banner.cta_text && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">CTA:</span>
                          <span>{banner.cta_text}</span>
                        </div>
                      )}
                      {banner.video_url && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Video:</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => {
                              setPreviewVideoUrl(banner.video_url);
                              setShowVideoPreview(true);
                            }}
                          >
                            Preview Video
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Show to:</span>
                        <span>{banner.show_to_roles?.join(", ") || "all"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(banner)}>
                        {banner.is_active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {banner.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Create New Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Become an Affiliate"
                  required
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Earn 50% commission on every referral"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gradient From</Label>
                  <Input
                    value={formData.gradient_from}
                    onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                    placeholder="e.g., purple-600"
                  />
                </div>
                <div>
                  <Label>Gradient To</Label>
                  <Input
                    value={formData.gradient_to}
                    onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                    placeholder="e.g., indigo-600"
                  />
                </div>
              </div>

              <div>
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Badge Type</Label>
                <Select value={formData.badge_type} onValueChange={(value) => setFormData({ ...formData, badge_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(badgeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Video URL (YouTube or Loom)</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Button Text</Label>
                  <Input
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="e.g., Join Now"
                  />
                </div>
                <div>
                  <Label>CTA Link (page name or URL)</Label>
                  <Input
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="e.g., Affiliate or https://..."
                  />
                </div>
              </div>

              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Show to Roles</Label>
                <Select
                  value={formData.show_to_roles[0]}
                  onValueChange={(value) => setFormData({ ...formData, show_to_roles: [value] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admin Only</SelectItem>
                    <SelectItem value="user">Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBanner ? "Update" : "Create"} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Video Preview Modal */}
        <VideoModal
          isOpen={showVideoPreview}
          onClose={() => setShowVideoPreview(false)}
          videoUrl={previewVideoUrl}
          title="Banner Video Preview"
        />
      </div>
    </div>
  );
}