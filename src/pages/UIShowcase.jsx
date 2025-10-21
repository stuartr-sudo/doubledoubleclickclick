import React, { useState } from 'react';
import PageLoader, { SectionLoader, ButtonLoader, InlineLoader } from '@/components/common/PageLoader';
import ModernDialog, { ConfirmDialog } from '@/components/common/ModernDialog';
import ModernCard, { StatCard, FeatureCard } from '@/components/common/ModernCard';
import EmptyState, { SearchEmptyState, ErrorEmptyState } from '@/components/common/EmptyState';
import { GradientButton, OutlineButton, GhostButton, IconButton, DestructiveButton } from '@/components/ui/modern-button';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  Plus, 
  Save,
  Trash2,
  Eye,
  Package,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function UIShowcase() {
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Saved successfully!');
    }, 2000);
  };

  if (pageLoading) {
    return <PageLoader message="Loading showcase..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-blue-50/20 p-8">
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Modern UI Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            All the new components in one place
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Buttons
          </h2>
          <ModernCard>
            <div className="flex flex-wrap gap-4">
              <GradientButton onClick={handleSave} loading={loading} icon={Save}>
                Gradient Button
              </GradientButton>
              <OutlineButton icon={Eye}>
                Outline Button
              </OutlineButton>
              <GhostButton icon={Settings}>
                Ghost Button
              </GhostButton>
              <DestructiveButton icon={Trash2}>
                Destructive Button
              </DestructiveButton>
              <IconButton tooltip="Settings">
                <Settings className="h-4 w-4" />
              </IconButton>
            </div>
          </ModernCard>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cards
          </h2>
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Users"
              value="12,345"
              change="+12% from last month"
              trend="up"
              icon={<Users className="h-6 w-6" />}
            />
            <StatCard
              title="Revenue"
              value="$54,320"
              change="+23% from last month"
              trend="up"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <StatCard
              title="Active Projects"
              value="89"
              change="-5% from last month"
              trend="down"
              icon={<FileText className="h-6 w-6" />}
            />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCard
              title="Default Card"
              description="This is a default card with hover effect"
              icon={<Package className="h-5 w-5" />}
              variant="default"
              headerAction={
                <Button size="sm" variant="outline">Edit</Button>
              }
            >
              <p className="text-gray-600 dark:text-gray-400">
                Card content goes here. This is a modern card with consistent styling.
              </p>
            </ModernCard>

            <ModernCard
              title="Gradient Card"
              description="This card has a gradient background"
              icon={<Sparkles className="h-5 w-5" />}
              variant="gradient"
            >
              <p className="text-gray-600 dark:text-gray-400">
                Perfect for highlighting important content or features.
              </p>
            </ModernCard>

            <ModernCard
              title="Glass Card"
              description="This card has a glass morphism effect"
              icon={<Zap className="h-5 w-5" />}
              variant="glass"
            >
              <p className="text-gray-600 dark:text-gray-400">
                Modern glass effect with backdrop blur.
              </p>
            </ModernCard>

            <FeatureCard
              title="Feature Card"
              description="Showcase features with this card"
              icon={<Sparkles className="h-5 w-5" />}
              action={
                <GradientButton className="w-full">
                  Activate Feature
                </GradientButton>
              }
            />
          </div>
        </section>

        {/* Dialogs Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dialogs
          </h2>
          <ModernCard>
            <div className="flex flex-wrap gap-4">
              <GradientButton onClick={() => setShowDialog(true)} icon={Plus}>
                Open Modern Dialog
              </GradientButton>
              <DestructiveButton onClick={() => setShowConfirm(true)} icon={Trash2}>
                Open Confirm Dialog
              </DestructiveButton>
            </div>
          </ModernCard>
        </section>

        {/* Loading States Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loading States
          </h2>
          <ModernCard>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Page Loader</h3>
                <Button onClick={() => {
                  setPageLoading(true);
                  setTimeout(() => setPageLoading(false), 2000);
                }}>
                  Trigger Page Loader (2s)
                </Button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Section Loader</h3>
                <SectionLoader message="Loading section content..." />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Button Loader</h3>
                <GradientButton loading={true}>
                  Loading...
                </GradientButton>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Inline Loader</h3>
                <p className="text-gray-600">
                  Processing data <InlineLoader size={16} /> please wait...
                </p>
              </div>
            </div>
          </ModernCard>
        </section>

        {/* Empty States Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Empty States
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernCard className="min-h-[300px]">
              <EmptyState
                icon={Package}
                title="No items"
                description="Get started by creating your first item"
                actionLabel="Create Item"
                onAction={() => toast.info('Create clicked')}
              />
            </ModernCard>

            <ModernCard className="min-h-[300px]">
              <SearchEmptyState 
                query="test search"
                onClear={() => toast.info('Clear clicked')}
              />
            </ModernCard>

            <ModernCard className="min-h-[300px]">
              <ErrorEmptyState
                error="Failed to load data"
                onRetry={() => toast.info('Retry clicked')}
              />
            </ModernCard>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Color Palette
          </h2>
          <ModernCard>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30"></div>
                <p className="text-sm font-medium">Primary Gradient</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 w-full bg-purple-600 rounded-lg"></div>
                <p className="text-sm font-medium">Purple Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 w-full bg-blue-600 rounded-lg"></div>
                <p className="text-sm font-medium">Blue Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 w-full bg-gray-900 dark:bg-gray-100 rounded-lg"></div>
                <p className="text-sm font-medium">Text Primary</p>
              </div>
            </div>
          </ModernCard>
        </section>

        {/* Animations Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Animations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCard>
              <h3 className="text-lg font-semibold mb-3">Fade In</h3>
              <div className="h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg animate-fade-in"></div>
            </ModernCard>
            <ModernCard>
              <h3 className="text-lg font-semibold mb-3">Float</h3>
              <div className="h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg animate-float"></div>
            </ModernCard>
          </div>
        </section>

      </div>

      {/* Modern Dialog Example */}
      <ModernDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Modern Dialog"
        description="This is a modern dialog with gradient title and purple accents"
        size="md"
        footer={
          <>
            <OutlineButton onClick={() => setShowDialog(false)}>
              Cancel
            </OutlineButton>
            <GradientButton onClick={() => {
              toast.success('Saved!');
              setShowDialog(false);
            }}>
              Save Changes
            </GradientButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This is the dialog content. You can put any components here.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Notice the gradient title, purple border, and consistent styling.
          </p>
        </div>
      </ModernDialog>

      {/* Confirm Dialog Example */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          toast.success('Deleted!');
          setShowConfirm(false);
        }}
        title="Delete Item?"
        description="This action cannot be undone. Are you sure?"
        variant="destructive"
      />
    </div>
  );
}

