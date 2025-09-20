
import React from "react";
import { FeatureFlag } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import FeatureEndpointForm from "@/components/features/FeatureEndpointForm";

export default function FeatureManagementPage() {
  const [flags, setFlags] = React.useState([]);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newEnabled, setNewEnabled] = React.useState(true);
  const [newComingSoon, setNewComingSoon] = React.useState(false); // NEW
  const [expanded, setExpanded] = React.useState({}); // flagId -> boolean
  const [emailInputs, setEmailInputs] = React.useState({}); // flagId -> email
  const [overrideVal, setOverrideVal] = React.useState({}); // flagId -> boolean
  const [userCache, setUserCache] = React.useState({}); // userId -> email
  const [seeding, setSeeding] = React.useState(false); // NEW
  const [normalizing, setNormalizing] = React.useState(false); // NEW
  const [tokenCostEdits, setTokenCostEdits] = React.useState({}); // flagId -> number

  // Add a canonical list of default features used across the app (no duplicates will be created)
  const DEFAULT_FEATURES = React.useMemo(() => ([
    { name: "ai_rewrite", description: "AI: Rewrite selected text" },
    { name: "ai_humanize", description: "AI: Humanize selected text" },
    { name: "ai_key_takeaway", description: "AI: Generate TL;DR / key takeaways" },
    { name: "ai_fact_box", description: "AI: Generate callouts/fact boxes" },
    { name: "ai_cite_sources", description: "AI: Find sources and cite" },
    { name: "ai_generate_image", description: "AI: Generate images" },
    { name: "ai_generate_video", description: "AI: Generate videos" },
    { name: "ai_audio", description: "AI: Text-to-speech audio" },
    { name: "ai_image_library", description: "AI: Image library" },
    { name: "ai_video_library", description: "AI: Video library" },
    { name: "ai_youtube", description: "AI: YouTube embed and tools" },
    { name: "ai_tiktok", description: "AI: TikTok embed and tools" },
    { name: "ai_manual_link", description: "Links: Insert manual link" },
    { name: "ai_sitemap_link", description: "Links: Insert from sitemap" },
    { name: "ai_promoted_product", description: "Blocks: Promoted product" },
    { name: "ai_amazon_import", description: "Imports: Amazon product/reviews" },
    { name: "ai_cta", description: "Blocks: CTA library" },
    { name: "ai_testimonials", description: "Blocks: Testimonials library" },
    { name: "ai_clean_html", description: "Tools: Clean HTML" },
    { name: "ai_detection", description: "Tools: AI content detection" },
    { name: "ai_agent", description: "Tools: Run AI Agent workflow" },
    { name: "ai_brand_it", description: "AI: Align to brand guidelines" },
    { name: "ai_affilify", description: "AI: Affiliate-optimized links/blocks" },
    { name: "ai_localize", description: "AI: Localize/translate content" },
    { name: "ai_faq", description: "AI: Generate FAQ section" },
    // UI gating flags used in code:
    { name: "ai_floating_bar", description: "UI: Ask AI floating bar on selection" },
    { name: "ai_agent_workflow_button", description: "UI: Show AI Agent menu button" },
    // NEW: Toggle for header token balance indicator
    { name: "show_token_balance", description: "UI: Show token balance in header" }
  ]), []);

  // Alias map to normalize legacy names -> canonical
  const ALIAS_MAP = React.useMemo(() => ({
    affilify: "ai_affilify",
    brand_it: "ai_brand_it"
  }), []);

  const loadFlags = async () => {
    const list = await FeatureFlag.list("-updated_date", 100);
    setFlags(list || []);
  };

  React.useEffect(() => {
    loadFlags();
  }, []);

  // Enhanced: prevent duplicate manual add
  const addFlag = async () => {
    if (!newName.trim()) return;
    const exists = await FeatureFlag.filter({ name: newName.trim() });
    if (Array.isArray(exists) && exists.length > 0) {
      alert("A feature with this key already exists.");
      return;
    }
    await FeatureFlag.create({
      name: newName.trim(),
      description: newDesc || "",
      enabled_globally: !!newEnabled,
      is_coming_soon: !!newComingSoon, // NEW
      user_overrides: {},
      token_cost: 0 // Default token cost for new features
    });
    setNewName("");
    setNewDesc("");
    setNewEnabled(true);
    setNewComingSoon(false); // NEW
    loadFlags();
  };

  const toggleGlobal = async (flag) => {
    await FeatureFlag.update(flag.id, { enabled_globally: !flag.enabled_globally });
    loadFlags();
  };

  // NEW: Toggle coming soon status
  const toggleComingSoon = async (flag) => {
    await FeatureFlag.update(flag.id, { is_coming_soon: !flag.is_coming_soon });
    loadFlags();
  };

  const ensureUserInCache = React.useCallback(async (userId) => {
    if (!userId || userCache[userId]) return;
    const rows = await User.filter({ id: userId });
    const email = rows && rows[0]?.email ? rows[0].email : userId;
    setUserCache((m) => ({ ...m, [userId]: email }));
  }, [userCache]); // userCache is read, so it's a dependency

  React.useEffect(() => {
    // prime cache for known overrides
    (async () => {
      const promises = [];
      flags.forEach((f) => {
        const overrides = f.user_overrides || {};
        Object.keys(overrides).forEach((uid) => {
          promises.push(ensureUserInCache(uid));
        });
      });
      await Promise.all(promises);
    })();
  }, [flags, ensureUserInCache]); // ensureUserInCache is now a dependency

  const addOrUpdateOverride = async (flag) => {
    const email = (emailInputs[flag.id] || "").trim();
    if (!email) return;
    const users = await User.filter({ email });
    if (!users || users.length === 0) {
      alert("No user found with that email.");
      return;
    }
    const user = users[0];
    const overrides = { ...(flag.user_overrides || {}) };
    const val = !!overrideVal[flag.id];
    overrides[user.id] = val;
    await FeatureFlag.update(flag.id, { user_overrides: overrides });
    setUserCache((m) => ({ ...m, [user.id]: user.email }));
    setEmailInputs((m) => ({ ...m, [flag.id]: "" }));
    loadFlags();
  };

  const removeOverride = async (flag, userId) => {
    const overrides = { ...(flag.user_overrides || {}) };
    delete overrides[userId];
    await FeatureFlag.update(flag.id, { user_overrides: overrides });
    loadFlags();
  };

  // NEW: Seed default features idempotently (only creates missing ones)
  const seedDefaultFeatures = async () => {
    setSeeding(true);
    try {
      const existing = await FeatureFlag.list(undefined, 500);
      const existingSet = new Set((existing || []).map(f => f.name));
      const toCreate = DEFAULT_FEATURES.filter(f => !existingSet.has(f.name));
      for (const f of toCreate) {
        // Create sequentially to avoid rate limits
        await FeatureFlag.create({
          name: f.name,
          description: f.description || "",
          enabled_globally: true,
          user_overrides: {},
          token_cost: 0 // Default token cost for seeded features
        });
      }
      await loadFlags();
      alert(toCreate.length === 0 ? "All default features already exist." : `Added ${toCreate.length} default feature(s).`);
    } catch (error) {
      console.error("Error seeding default features:", error);
      alert("Failed to add default features. Check console for details.");
    } finally {
      setSeeding(false);
    }
  };

  // NEW: Normalize & deduplicate feature flags
  const normalizeFeatureFlags = async () => {
    setNormalizing(true);
    try {
      let allFlags = await FeatureFlag.list(undefined, 500) || [];
      let renamedCount = 0, mergedCount = 0, removedCount = 0;

      // Step 1: rename legacy aliases or merge into canonical if exists
      // Create a mutable copy and map for quicker lookups
      const currentFlagsMap = new Map(allFlags.map(f => [f.id, f]));
      const flagsToProcess = [...allFlags]; // Iterate over a copy as we modify original list indirectly

      for (const f of flagsToProcess) {
        if (!currentFlagsMap.has(f.id)) continue; // Skip if already processed/deleted

        const currName = (f.name || "").trim();
        const currNameLower = currName.toLowerCase();
        const canonicalName = ALIAS_MAP[currNameLower];

        if (canonicalName && canonicalName !== currNameLower) {
          // Check if a flag with the canonical name already exists
          const target = allFlags.find(x => (x.name || "").toLowerCase() === canonicalName);

          if (target) {
            // Merge into existing canonical, then delete legacy
            const mergedOverrides = { ...(target.user_overrides || {}), ...(f.user_overrides || {}) };
            const enabled = !!(target.enabled_globally || f.enabled_globally);
            const tokenCost = Math.max(target.token_cost || 0, f.token_cost || 0); // Keep max token cost
            await FeatureFlag.update(target.id, { user_overrides: mergedOverrides, enabled_globally: enabled, token_cost: tokenCost });
            await FeatureFlag.delete(f.id);
            removedCount += 1;
            mergedCount += 1;
            // Update local tracking to reflect deletion
            allFlags = allFlags.filter(x => x.id !== f.id);
            currentFlagsMap.delete(f.id);
            currentFlagsMap.set(target.id, { ...target, user_overrides: mergedOverrides, enabled_globally: enabled, token_cost: tokenCost }); // Update keeper in map
          } else {
            // Just rename to canonical
            await FeatureFlag.update(f.id, { name: canonicalName });
            f.name = canonicalName; // Update local object for subsequent deduplication
            currentFlagsMap.set(f.id, { ...f, name: canonicalName }); // Update map
            renamedCount += 1;
          }
        }
      }

      // Re-fetch all flags to ensure we have the most current state after alias processing
      // and to correctly handle any potential inconsistencies from concurrent updates
      allFlags = await FeatureFlag.list(undefined, 500) || [];

      // Step 2: deduplicate exact same names (e.g., two ai_brand_it)
      const groups = allFlags.reduce((acc, f) => {
        const key = (f.name || "").toLowerCase();
        (acc[key] ||= []).push(f);
        return acc;
      }, {});

      for (const key of Object.keys(groups)) {
        const arr = groups[key];
        if (arr.length <= 1) continue;

        // Keep most recently updated flag
        arr.sort((a, b) => {
          const ta = new Date(a.updated_date || a.created_date || 0).getTime();
          const tb = new Date(b.updated_date || b.created_date || 0).getTime();
          return tb - ta;
        });

        const keeper = arr[0];
        for (const dup of arr.slice(1)) {
          const mergedOverrides = { ...(keeper.user_overrides || {}), ...(dup.user_overrides || {}) };
          const enabled = !!(keeper.enabled_globally || dup.enabled_globally);
          const tokenCost = Math.max(keeper.token_cost || 0, dup.token_cost || 0); // Keep max token cost
          await FeatureFlag.update(keeper.id, { user_overrides: mergedOverrides, enabled_globally: enabled, token_cost: tokenCost });
          await FeatureFlag.delete(dup.id);
          removedCount += 1;
          mergedCount += 1;
        }
      }

      await loadFlags();
      alert(`Normalization complete.
- Renamed: ${renamedCount}
- Merged: ${mergedCount}
- Removed duplicates: ${removedCount}`);
    } catch (e) {
      console.error("Normalization failed:", e);
      alert("Failed to normalize features. See console for details.");
    } finally {
      setNormalizing(false);
    }
  };

  // NEW: Update token cost
  const updateTokenCost = async (flag) => {
    const raw = tokenCostEdits[flag.id];
    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      alert("Please enter a valid non-negative number for token cost.");
      return;
    }
    await FeatureFlag.update(flag.id, { token_cost: val });
    setTokenCostEdits((m) => ({ ...m, [flag.id]: undefined })); // Clear specific input field state
    loadFlags();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-slate-900 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Feature Management</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={seedDefaultFeatures}
                disabled={seeding || normalizing}
              >
                {seeding ? "Adding features…" : "Add All Default Features"}
              </Button>
              <Button
                variant="outline"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={normalizeFeatureFlags}
                disabled={normalizing || seeding}
                title="Rename legacy keys and merge duplicates"
              >
                {normalizing ? "Fixing…" : "Normalize & Deduplicate"}
              </Button>
            </div>
          </div>

          <Card className="p-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-lg mb-3 text-slate-900">Add Feature</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="text-slate-700">Feature key</Label>
                <Input
                  placeholder="e.g., ai_affilify"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label className="text-slate-700">Enabled globally</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={newEnabled}
                    onCheckedChange={setNewEnabled}
                    className="data-[state=unchecked]:bg-slate-200 data-[state=checked]:bg-indigo-600"
                  />
                  <span className="ml-2 text-sm text-slate-600">{newEnabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div>
                <Label className="text-slate-700">Coming Soon</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={newComingSoon}
                    onCheckedChange={setNewComingSoon}
                    className="data-[state=unchecked]:bg-slate-200 data-[state=checked]:bg-indigo-600"
                  />
                  <span className="ml-2 text-sm text-slate-600">{newComingSoon ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <Label className="text-slate-700">Description</Label>
                <Input
                  placeholder="What does this feature do?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button onClick={addFlag} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Feature</Button>
            </div>
          </Card>

          <div className="space-y-4">
            {flags.map((flag) => {
              const overrides = flag.user_overrides || {};
              const isExpanded = !!expanded[flag.id];
              return (
                <Card key={flag.id} className="p-4 bg-white border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <div className="text-base font-medium text-slate-900">{flag.name}</div>
                      {flag.description && <div className="text-sm text-slate-600">{flag.description}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Globally</span>
                        <Switch
                          checked={!!flag.enabled_globally}
                          onCheckedChange={() => toggleGlobal(flag)}
                          className="data-[state=unchecked]:bg-slate-200 data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Coming Soon</span>
                        <Switch
                          checked={!!flag.is_coming_soon}
                          onCheckedChange={() => toggleComingSoon(flag)}
                          className="data-[state=unchecked]:bg-slate-200 data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Token cost</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={tokenCostEdits[flag.id] ?? (flag.token_cost ?? 0)}
                          onChange={(e) => setTokenCostEdits((m) => ({ ...m, [flag.id]: e.target.value }))}
                          className="w-28 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                        />
                        <Button
                          variant="outline"
                          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          onClick={() => updateTokenCost(flag)}
                          title="Save token cost"
                        >
                          Save
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => setExpanded((m) => ({ ...m, [flag.id]: !isExpanded }))}
                      >
                        {isExpanded ? "Hide overrides" : "Manage overrides"}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                        <div>
                          <Label className="text-slate-700">User email</Label>
                          <Input
                            placeholder="user@example.com"
                            value={emailInputs[flag.id] || ""}
                            onChange={(e) => setEmailInputs((m) => ({ ...m, [flag.id]: e.target.value }))}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-700">Enabled</Label>
                          <Switch
                            checked={!!overrideVal[flag.id]}
                            onCheckedChange={(v) => setOverrideVal((m) => ({ ...m, [flag.id]: v }))}
                            className="data-[state=unchecked]:bg-slate-200 data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                        <Button onClick={() => addOrUpdateOverride(flag)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          Add/Update Override
                        </Button>
                      </div>

                      <div className="mt-2">
                        <div className="text-sm text-slate-600 mb-2">Current overrides</div>
                        <div className="space-y-2">
                          {Object.keys(overrides).length === 0 && (
                            <div className="text-sm text-slate-500">No overrides yet.</div>
                          )}
                          {Object.entries(overrides).map(([uid, val]) => (
                            <div key={uid} className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2">
                              <div className="text-sm text-slate-800">
                                <span className="font-mono">{userCache[uid] || uid}</span>
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    val ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {val ? "enabled" : "disabled"}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                                onClick={() => removeOverride(flag, uid)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <FeatureEndpointForm />
      </div>
    </>
  );
}
