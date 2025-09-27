
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TutorialVideo } from '@/api/entities';
import { FeatureFlag } from '@/api/entities';
import { User } from '@/api/entities';
import { BookOpen, Plus, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import TutorialCard from '@/components/tutorials/TutorialCard';
import { toast } from 'sonner';
import useFeatureFlag from '@/components/hooks/useFeatureFlag';

const AdminAddTutorial = ({ onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    loom_url: '',
    category: '',
    is_active: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || (!formData.youtube_url.trim() && !formData.loom_url.trim())) {
      toast.error("Title and at least one video URL (YouTube or Loom) are required.");
      return;
    }

    await onAdd(formData);
    setFormData({ title: '', description: '', youtube_url: '', loom_url: '', category: '', is_active: true });
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Card className="p-6 bg-white border border-slate-200 shadow-sm mb-8">
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Manual Tutorial
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border border-slate-200 shadow-sm mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Tutorial Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-slate-700">Tutorial Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., How to Use AI Rewrite"
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            required
          />
        </div>
        <div>
          <Label className="text-slate-700">Short Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this tutorial covers..."
            rows={3}
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div>
          <Label className="text-slate-700">YouTube Video URL (Optional)</Label>
          <Input
            type="url"
            value={formData.youtube_url}
            onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div>
          <Label className="text-slate-700">Loom Video URL or Embed Code (Optional)</Label>
          <Textarea
            value={formData.loom_url}
            onChange={(e) => setFormData(prev => ({ ...prev, loom_url: e.target.value }))}
            placeholder="https://www.loom.com/share/... or <div>...</div>"
            rows={3}
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div>
          <Label className="text-slate-700">Category (Optional)</Label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Getting Started, Advanced"
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Add Tutorial
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default function DoubleClickTutorials() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if tutorials page is enabled via feature flag
  const { enabled: tutorialsEnabled, loading: flagLoading } = useFeatureFlag('show_tutorials_page', { defaultEnabled: true });

  const isAdmin = useMemo(() => currentUser?.role === 'admin' || currentUser?.is_superadmin, [currentUser]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [user, manualTutorials, featureFlags] = await Promise.all([
        User.me(),
        TutorialVideo.list('-created_date'),
        FeatureFlag.list()
      ]);

      setCurrentUser(user);

      // Combine manual tutorials with feature flag tutorials
      const combinedTutorials = [];

      // Add manual tutorials (filter by is_active for non-admins)
      if (manualTutorials) {
        manualTutorials.forEach(tutorial => {
          // Show inactive tutorials only to admins
          if (tutorial.is_active !== false || isAdmin) {
            combinedTutorials.push({
              id: tutorial.id,
              title: tutorial.title,
              description: tutorial.description,
              youtube_url: tutorial.youtube_url,
              loom_url: tutorial.loom_url,
              category: tutorial.category,
              is_active: tutorial.is_active !== false,
              type: 'manual'
            });
          }
        });
      }

      // Add feature flag tutorials (only if they have tutorial URLs)
      if (featureFlags) {
        featureFlags.forEach(flag => {
          if ((flag.youtube_tutorial_url || flag.loom_tutorial_url) && flag.name.startsWith('ai_')) {
            combinedTutorials.push({
              id: flag.name,
              title: flag.description || flag.name,
              description: `Learn how to use the "${flag.name}" feature.`,
              youtube_url: flag.youtube_tutorial_url,
              loom_url: flag.loom_tutorial_url,
              category: 'Ask AI Features',
              is_active: true,
              type: 'feature_flag'
            });
          }
        });
      }

      setTutorials(combinedTutorials);
    } catch (error) {
      console.error('Failed to load tutorials:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleComplete = async (tutorialId) => {
    if (!currentUser) return;

    const completed = currentUser.completed_tutorial_ids || [];
    const isCompleted = completed.includes(tutorialId);
    const newCompletedIds = isCompleted
      ? completed.filter(id => id !== tutorialId)
      : [...completed, tutorialId];

    try {
      await User.updateMyUserData({ completed_tutorial_ids: newCompletedIds });
      setCurrentUser(prev => ({ ...prev, completed_tutorial_ids: newCompletedIds }));
      toast.success(isCompleted ? 'Tutorial marked as incomplete.' : 'Tutorial marked as complete!');
    } catch (error) {
      toast.error('Failed to update completion status.');
      console.error(error);
    }
  };

  const handleAddTutorial = async (formData) => {
    try {
      await TutorialVideo.create(formData);
      toast.success('Tutorial added successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to add tutorial.');
      console.error(error);
    }
  };

  const handleToggleVisibility = async (tutorial) => {
    if (tutorial.type !== 'manual') return;
    
    try {
      const newStatus = !tutorial.is_active;
      await TutorialVideo.update(tutorial.id, { is_active: newStatus });
      toast.success(`Tutorial ${newStatus ? 'shown' : 'hidden'} successfully!`);
      loadData();
    } catch (error) {
      toast.error('Failed to update tutorial visibility.');
      console.error(error);
    }
  };

  const handleDeleteManualTutorial = async (tutorialId) => {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      await TutorialVideo.delete(tutorialId);
      toast.success('Tutorial deleted successfully!');
      loadData();
    } catch (error) {
      toast.error('Failed to delete tutorial.');
      console.error(error);
    }
  };

  // Show loading while checking feature flag
  if (flagLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  // Show "not available" if feature is disabled
  if (!tutorialsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <BookOpen className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Feature Not Available</h2>
        <p className="text-slate-500 text-center max-w-md">
          The DoubleClick Tutorials feature is currently disabled. 
          Please contact your administrator if you need access to this feature.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <BookOpen className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
          <h1 className="text-4xl font-bold text-slate-900">DoubleClick Tutorials</h1>
          <p className="text-lg text-slate-600 mt-2">Your learning center for mastering every feature.</p>
        </div>

        {isAdmin && <AdminAddTutorial onAdd={handleAddTutorial} />}

        {/* Grid Layout for Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map(tutorial => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              isCompleted={(currentUser?.completed_tutorial_ids || []).includes(tutorial.id)}
              onToggleComplete={() => handleToggleComplete(tutorial.id)}
              onDelete={isAdmin && tutorial.type === 'manual' ? () => handleDeleteManualTutorial(tutorial.id) : null}
              onToggleVisibility={isAdmin && tutorial.type === 'manual' ? () => handleToggleVisibility(tutorial) : null}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {tutorials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No tutorials available yet.</p>
            {isAdmin && (
              <p className="text-slate-400 text-sm mt-2">Add some tutorials above or configure YouTube/Loom URLs in Feature Management.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
