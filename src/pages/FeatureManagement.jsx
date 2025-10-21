
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FeatureFlag } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Settings, Check, Plus, Zap } from "lucide-react";
import FeatureEndpointForm from "@/components/features/FeatureEndpointForm";
import { toast } from "sonner";
import MiniMultiSelect from '@/components/common/MiniMultiSelect';
import PageLoader, { SectionLoader } from '@/components/common/PageLoader';
import EmptyState, { SearchEmptyState } from '@/components/common/EmptyState';
import ModernCard from '@/components/common/ModernCard';
import { GradientButton, OutlineButton } from '@/components/ui/modern-button';

export default function FeatureManagement() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState(null); // The flag being edited in the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // NEW: search state

  const loadFlags = async () => {
    setLoading(true);
    try {
      const fetchedFlags = await FeatureFlag.list("-created_date"); // Fetches all flags, ordered by creation date
      setFlags(Array.isArray(fetchedFlags) ? fetchedFlags : []);
    } catch (error) {
      toast.error("Failed to load feature flags.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleEdit = (flag) => {
    setEditingFlag(flag);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingFlag(null); // No flag means we're creating a new one
    setIsModalOpen(true);
  };

  const handleSave = async (savedFlag) => {
    if (editingFlag) {
      // Update existing flag
      setFlags(flags.map((f) => f.id === savedFlag.id ? savedFlag : f));
      toast.success(`Feature '${savedFlag.flag_name || savedFlag.name}' updated.`);
    } else {
      // Add new flag to the top
      setFlags([savedFlag, ...flags]);
      toast.success(`Feature '${savedFlag.flag_name || savedFlag.name}' created.`);
    }
    setIsModalOpen(false);
  };

  const handleToggleGlobal = async (flag, checked) => {
    // Optimistic UI update
    const originalFlags = flags;
    setFlags(flags.map((f) => f.id === flag.id ? { ...f, is_enabled: checked } : f));

    try {
      await FeatureFlag.update(flag.id, { is_enabled: checked });
      toast.success(`'${flag.flag_name || flag.name}' is now globally ${checked ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      toast.error("Failed to update flag.");
      setFlags(originalFlags); // Revert on error
    }
  };

  const handleToggleComingSoon = async (flag, checked) => {
    // Optimistic UI update
    const originalFlags = flags;
    setFlags(flags.map((f) => f.id === flag.id ? { ...f, is_coming_soon: checked } : f));

    try {
      await FeatureFlag.update(flag.id, { is_coming_soon: checked });
      toast.success(`'${flag.flag_name || flag.name}' marked as ${checked ? 'coming soon' : 'active'}.`);
    } catch (error) {
      toast.error("Failed to update flag.");
      setFlags(originalFlags); // Revert on error
    }
  };

  const handlePlanChange = async (flag, newPlanKeys) => {
    const originalFlags = flags;
    setFlags(flags.map((f) => f.id === flag.id ? { ...f, required_plan_keys: newPlanKeys } : f));

    try {
      await FeatureFlag.update(flag.id, { required_plan_keys: newPlanKeys });
      toast.success(`Updated required plans for '${flag.flag_name || flag.name}'.`);
    } catch (error) {
      toast.error("Failed to update plans.");
      setFlags(originalFlags);
    }
  };

  const planOptions = [
  { value: 'growth', label: 'Growth' },
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' }];


  // NEW: Filter flags based on search query
  const filteredFlags = flags.filter((flag) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (flag.flag_name || flag.name || '').toLowerCase().includes(query) ||
      flag.description && flag.description.toLowerCase().includes(query));

  });


  if (loading) {
    return <PageLoader message="Loading feature flags..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-blue-50/20 p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Modern header with gradient title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Feature Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Control feature visibility and access for different user plans
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Modern search with purple accent */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-purple-500/20 focus:border-purple-500 focus:ring-purple-500/20" 
              />
            </div>
            <GradientButton onClick={handleCreate} icon={Plus}>
              Add Feature
            </GradientButton>
          </div>
        </div>

        {/* Modern card container */}
        <ModernCard variant="default" hover={false} className="overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFlags.length === 0 && !loading ? (
              searchQuery ? (
                <SearchEmptyState 
                  query={searchQuery} 
                  onClear={() => setSearchQuery('')}
                />
              ) : (
                <EmptyState
                  icon={Zap}
                  title="No feature flags yet"
                  description="Create your first feature flag to control feature access"
                  actionLabel="Create Feature"
                  onAction={handleCreate}
                />
              )
            ) : (
              filteredFlags.map((flag) => (
                <div 
                  key={flag.id} 
                  className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors"
                >
                  {/* Feature info */}
                  <div className="lg:col-span-1">
                    <div className="font-semibold text-gray-900 dark:text-white break-words flex items-center gap-2">
                      {flag.flag_name || flag.name}
                      {flag.is_enabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words mt-1">
                      {flag.description || 'No description'}
                    </p>
                  </div>

                  {/* Plan selector */}
                  <div className="lg:col-span-1">
                    <MiniMultiSelect
                      placeholder="All plans"
                      options={planOptions}
                      value={flag.required_plan_keys || []}
                      onChange={(keys) => handlePlanChange(flag, keys)}
                    />
                  </div>

                  {/* Toggles and action */}
                  <div className="flex flex-wrap items-center gap-4 lg:col-span-2 justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Enabled toggle */}
                      <div className="flex items-center">
                        <Switch
                          checked={!!flag.is_enabled}
                          onCheckedChange={(checked) => handleToggleGlobal(flag, checked)}
                          id={`global-${flag.id}`}
                          className="data-[state=checked]:bg-purple-600"
                        />
                        <label 
                          htmlFor={`global-${flag.id}`} 
                          className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Enabled
                        </label>
                      </div>
                      
                      {/* Coming soon toggle */}
                      <div className="flex items-center">
                        <Switch
                          checked={!!flag.is_coming_soon}
                          onCheckedChange={(checked) => handleToggleComingSoon(flag, checked)}
                          id={`soon-${flag.id}`}
                          className="data-[state=checked]:bg-amber-600"
                        />
                        <label 
                          htmlFor={`soon-${flag.id}`} 
                          className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Coming Soon
                        </label>
                      </div>
                    </div>

                    {/* Configure button */}
                    <OutlineButton 
                      size="sm" 
                      onClick={() => handleEdit(flag)}
                      icon={Settings}
                    >
                      Configure
                    </OutlineButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </ModernCard>

        {/* When rendering the token_cost input field, update it to: */}
        <div>
          <Label htmlFor="token_cost">Token Cost</Label>
          <Input
            id="token_cost"
            type="number"
            step="0.5"
            min="0"
            value={editingFlag?.token_cost ?? 1}
            onChange={(e) => setEditingFlag({ ...editingFlag, token_cost: parseFloat(e.target.value) || 0 })}
            className="bg-white border-slate-300"
          />
        </div>
      </div>

      <FeatureEndpointForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        flag={editingFlag}
        onSave={handleSave} />

    </div>);

}

