import React, { useState, useEffect } from 'react';
import { TutorialVideo } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Video, Plus, Edit, Trash2, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import VideoModal from '@/components/common/VideoModal';

// List of available pages in the app
const AVAILABLE_PAGES = [
  'Dashboard',
  'Content',
  'Editor',
  'Topics',
  'Webhooks',
  'ProductManager',
  'Media',
  'ImageLibrary',
  'TestimonialLibrary',
  'VideoLibrary',
  'YouTubeManager',
  'SitemapManager',
  'BrandGuidelinesManager',
  'ServiceCatalog',
  'UserManagement',
  'UsernameManager',
  'FeatureManagement',
  'EditorWorkflowManager',
  'AppProductManager',
  'LandingPageManager',
  'SalesPageManager',
  'Pricing',
  'Pages',
  'PagesSetup',
  'CustomTemplateManager',
  'ProductLibrary',
  'CtaManager',
  'EmailFormManager',
  'AccountSettings'
].sort();

export default function Educational() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    assigned_page_name: '',
    category: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (!user.is_superadmin) {
        toast.error('Access denied. Superadmin only.');
        return;
      }

      const fetchedVideos = await TutorialVideo.list('-sort_order');
      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tutorial videos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      assigned_page_name: '',
      category: '',
      is_active: true,
      sort_order: 0
    });
    setEditingVideo(null);
    setShowForm(true);
  };

  const handleEdit = (video) => {
    setFormData({
      title: video.title || '',
      description: video.description || '',
      video_url: video.video_url || '',
      assigned_page_name: video.assigned_page_name || '',
      category: video.category || '',
      is_active: video.is_active !== undefined ? video.is_active : true,
      sort_order: video.sort_order || 0
    });
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.video_url.trim() || !formData.assigned_page_name) {
      toast.error('Title, Video URL, and Assigned Page are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingVideo) {
        await TutorialVideo.update(editingVideo.id, formData);
        toast.success('Tutorial video updated successfully!');
      } else {
        await TutorialVideo.create(formData);
        toast.success('Tutorial video created successfully!');
      }

      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Failed to save tutorial video.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (video) => {
    setVideoToDelete(video);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      await TutorialVideo.delete(videoToDelete.id);
      toast.success('Tutorial video deleted.');
      await loadData();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete tutorial video.');
    } finally {
      setVideoToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handlePreview = (video) => {
    setPreviewVideo(video);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser?.is_superadmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Access denied. Superadmin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-8 h-8 text-indigo-600" />
              Educational Videos
            </h1>
            <p className="text-slate-600 mt-1">Manage page-specific tutorial videos that auto-play on first visit</p>
          </div>
          <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Tutorial Video
          </Button>
        </div>

        {/* Videos List */}
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No tutorial videos yet. Add your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{video.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {video.assigned_page_name}
                        </span>
                        {video.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {video.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {video.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {video.description || 'No description'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(video)}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(video)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(video)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Edit Tutorial Video' : 'Add Tutorial Video'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., How to use the Editor"
                  required
                />
              </div>

              <div>
                <Label htmlFor="assigned_page_name">Assigned Page *</Label>
                <Select
                  value={formData.assigned_page_name}
                  onValueChange={(value) => setFormData({ ...formData, assigned_page_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_PAGES.map((page) => (
                      <SelectItem key={page} value={page}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="video_url">Video URL or Embed Code *</Label>
                <Textarea
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="YouTube URL, Loom URL, or full embed code"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what this tutorial covers"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Getting Started, Advanced"
                />
              </div>

              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active (auto-play on first visit)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingVideo ? 'Update' : 'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the tutorial video. This action cannot be undone.
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

        {/* Preview Modal */}
        <VideoModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          videoUrl={previewVideo?.video_url || ''}
          title={previewVideo?.title || 'Tutorial Preview'}
        />
      </div>
    </div>
  );
}