
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FeatureFlag } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Settings, Check, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FeatureEndpointForm from "@/components/features/FeatureEndpointForm";
import { toast } from "sonner";
import MiniMultiSelect from '@/components/common/MiniMultiSelect';

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
      toast.success(`Feature '${savedFlag.name}' updated.`);
    } else {
      // Add new flag to the top
      setFlags([savedFlag, ...flags]);
      toast.success(`Feature '${savedFlag.name}' created.`);
    }
    setIsModalOpen(false);
  };

  const handleToggleGlobal = async (flag, checked) => {
    // Optimistic UI update
    const originalFlags = flags;
    setFlags(flags.map((f) => f.id === flag.id ? { ...f, enabled_globally: checked } : f));

    try {
      await FeatureFlag.update(flag.id, { enabled_globally: checked });
      toast.success(`'${flag.name}' is now globally ${checked ? 'enabled' : 'disabled'}.`);
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
      toast.success(`'${flag.name}' marked as ${checked ? 'coming soon' : 'active'}.`);
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
      toast.success(`Updated required plans for '${flag.name}'.`);
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
      flag.name.toLowerCase().includes(query) ||
      flag.description && flag.description.toLowerCase().includes(query));

  });


  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feature Flag Management</h1>
          <p className="text-slate-600">Control feature visibility for users and plans.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* NEW: Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Feature
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredFlags.length === 0 && !loading ?
          <div className="p-4 text-center text-slate-500">
              {searchQuery ? `No features found matching "${searchQuery}"` : "No feature flags found."}
            </div> :

          filteredFlags.map((flag) =>
          <div key={flag.id} className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="lg:col-span-1">
                  <div className="font-semibold text-slate-800 break-words">{flag.name}</div>
                  <p className="text-sm text-slate-500 break-words">{flag.description || 'No description'}</p>
                </div>

                <div className="lg:col-span-1">
                  <MiniMultiSelect
                placeholder="No plan restriction"
                options={planOptions}
                value={flag.required_plan_keys || []}
                onChange={(keys) => handlePlanChange(flag, keys)} />

                </div>

                <div className="flex flex-wrap items-center gap-4 lg:col-span-2 justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                    type="checkbox"
                    checked={!!flag.enabled_globally}
                    onChange={(e) => handleToggleGlobal(flag, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    id={`global-${flag.id}`} />

                      <label htmlFor={`global-${flag.id}`} className="ml-2 block text-sm text-slate-700">
                        Enabled Globally
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                    type="checkbox"
                    checked={!!flag.is_coming_soon}
                    onChange={(e) => handleToggleComingSoon(flag, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    id={`soon-${flag.id}`} />

                      <label htmlFor={`soon-${flag.id}`} className="ml-2 block text-sm text-slate-700">
                        Coming Soon
                      </label>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => handleEdit(flag)} className="bg-background text-slate-700 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-slate-300 hover:bg-slate-50">
                    Configure
                  </Button>
                </div>
              </div>
          )
          }
        </div>
      </div>

      <FeatureEndpointForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        flag={editingFlag}
        onSave={handleSave} />

    </div>);

}