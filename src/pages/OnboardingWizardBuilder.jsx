
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/api/entities";
import { OnboardingWizard } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCw, ListChecks, Copy, ExternalLink } from "lucide-react";
import { airtableListFields } from "@/api/functions";
import { airtableSync } from "@/api/functions";
import { createPageUrl } from "@/utils";

const FIELD_TYPES = [
  { key: "text", label: "Text" },
  { key: "textarea", label: "Long text" },
  { key: "number", label: "Number" },
  { key: "date", label: "Date" },
  { key: "email", label: "Email" },
  { key: "url", label: "URL" },
  { key: "select", label: "Select (options)" },
];

export default function OnboardingWizardBuilder() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tableId, setTableId] = useState("Company Information");
  const [availableFields, setAvailableFields] = useState([]);
  const [wizard, setWizard] = useState({
    name: "Company Onboarding",
    table_id: "Company Information",
    is_active: false,
    submit_on_final_step: true, // NEW: added for submit behavior
    steps: [
      { title: "Company Basics", description: "Tell us about your company.", fields: [] },
    ],
  });
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const [customDomain, setCustomDomain] = useState(
    (typeof window !== "undefined" && localStorage.getItem("b44_custom_domain")) || ""
  ); // NEW

  // EDIT: map of linked-record fields -> Airtable table names (added "Geographic Location")
  const LINKED_FIELD_TABLES = {
    Language: "Language",
    GeographicLocationsDFSEO: "GeographicLocationsDFSEO",
    "Geographic Location": "GeographicLocationsDFSEO"
  };
  const isLinkedField = (name) => !!LINKED_FIELD_TABLES[name];

  // NEW: fetch options from a linked table in Airtable, now returns { label, value (ID) }
  const fetchLinkedOptions = async (tableName) => {
    const { data } = await airtableSync({ action: "listAll", tableId: tableName });
    if (!data?.success) {
      toast.error(data?.error || `Failed to load options from ${tableName}`);
      return [];
    }
    const records = data.records || [];
    const pickLabel = (fields) => {
      // Prefer Name/Title, fallback to first string field
      return (
        fields?.Name ||
        fields?.name ||
        fields?.Title ||
        fields?.title ||
        Object.values(fields || {}).find((v) => typeof v === "string" && v !== "" && v !== null) ||
        null
      );
    };
    // Return objects with label and value (Airtable record ID)
    const optionsMap = new Map(); // To ensure unique labels while keeping first ID
    records.forEach((r) => {
        const label = pickLabel(r.fields);
        if (typeof label === "string" && label.trim().length > 0 && !optionsMap.has(label)) {
            optionsMap.set(label, r.id); // Store ID as value
        }
    });

    const options = Array.from(optionsMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));

    return options;
  };

  const isAdmin = useMemo(
    () => !!(currentUser && (currentUser.role === "admin" || currentUser.access_level === "full")),
    [currentUser]
  );

  const portalPath = createPageUrl('OnboardingPortal'); // NEW
  const publicLink = React.useMemo(() => {             // NEW
    const d = (customDomain || "").trim();
    let origin = "";
    if (d) {
      origin = /^https?:\/\//i.test(d) ? d : `https://${d}`;
      origin = origin.replace(/\/+$/, "");
    } else if (typeof window !== "undefined") {
      origin = window.location.origin;
    }
    return `${origin}${portalPath}`;
  }, [customDomain, portalPath]);

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setWizard((w) => ({ ...w, table_id: tableId }));
  }, [tableId]);

  const loadFields = async () => {
    const { data } = await airtableListFields({ tableId });
    if (data?.success) {
      setAvailableFields(data.fields || []);
      toast.success("Loaded fields from Airtable.");
    } else {
      toast.error(data?.error || "Failed to fetch Airtable fields");
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const addStep = () => {
    setWizard((w) => {
      const newSteps = [...w.steps, { title: `Step ${w.steps.length + 1}`, description: "", fields: [] }];
      // Set the newly created step as active
      setActiveStepIdx(newSteps.length - 1);
      return { ...w, steps: newSteps };
    });
  };

  const removeStep = (idx) => {
    setWizard((w) => {
      const nextSteps = w.steps.filter((_, i) => i !== idx);
      return { ...w, steps: nextSteps };
    });
    // NEW: keep activeStepIdx in range after removal
    setActiveStepIdx((prev) => {
      const nextLen = (wizard.steps?.length || 1) - 1; // Calculate length after removal
      if (nextLen <= 0) return 0; // If no steps left, default to 0
      if (prev === idx) return Math.max(0, idx - 1); // If removed step was active, move to previous
      if (prev > idx) return Math.max(0, prev - 1); // If active step was after removed step, decrement its index
      return prev; // Otherwise, stay the same
    });
  };

  const updateStep = (idx, patch) => {
    setWizard((w) => {
      const steps = w.steps.slice();
      steps[idx] = { ...steps[idx], ...patch };
      return { ...w, steps };
    });
  };

  // EDIT: make addFieldToStep async and auto-configure linked selects
  const addFieldToStep = async (stepIdx, fieldName) => {
    if (stepIdx == null || stepIdx < 0) return;
    if (!fieldName) return;

    // If linked, prefetch options
    let initialField = {
      field_name: fieldName,
      label: fieldName,
      type: "text",
      required: false,
      placeholder: "",
      options: [],
    };

    if (isLinkedField(fieldName)) {
      const table = LINKED_FIELD_TABLES[fieldName];
      const options = await fetchLinkedOptions(table); // These are {label, value}[]
      initialField.type = "select";
      initialField.options = options;
    }

    setWizard((w) => {
      const steps = w.steps.slice();
      const step = { ...steps[stepIdx] };
      const exists = (step.fields || []).some((f) => f.field_name === fieldName);
      if (!exists) {
        step.fields = [...(step.fields || []), initialField];
        steps[stepIdx] = step;
      }
      return { ...w, steps };
    });
  };

  // NEW: refresh options for a specific linked field in a step
  const refreshLinkedFieldOptions = async (stepIdx, fieldName) => {
    if (!isLinkedField(fieldName)) return;
    const table = LINKED_FIELD_TABLES[fieldName];
    const options = await fetchLinkedOptions(table); // These are {label, value}[]
    setWizard((w) => {
      const steps = w.steps.slice();
      const step = { ...steps[stepIdx] };
      step.fields = (step.fields || []).map((f) =>
        f.field_name === fieldName ? { ...f, type: "select", options } : f
      );
      steps[stepIdx] = step;
      return { ...w, steps };
    });
    toast.success(`Updated options from ${table}`);
  };

  const removeFieldFromStep = (stepIdx, fieldName) => {
    setWizard((w) => {
      const steps = w.steps.slice();
      const step = { ...steps[stepIdx] };
      step.fields = (step.fields || []).filter((f) => f.field_name !== fieldName);
      steps[stepIdx] = step;
      return { ...w, steps };
    });
  };

  const updateField = (stepIdx, fieldName, patch) => {
    setWizard((w) => {
      const steps = w.steps.slice();
      const step = { ...steps[stepIdx] };
      step.fields = (step.fields || []).map((f) => {
        if (f.field_name === fieldName) {
          // Special handling for options if type is changing or if it's a manual select
          if ('options' in patch) {
              if (!isLinkedField(fieldName)) { // For manual selects, options are always string[]
                  const newOptions = Array.isArray(patch.options) ? patch.options.map(String) : [];
                  return { ...f, ...patch, options: newOptions };
              }
          }
          return { ...f, ...patch };
        }
        return f;
      });
      steps[stepIdx] = step;
      return { ...w, steps };
    });
  };

  const saveWizard = async (activate = false) => {
    if (!wizard.name || !wizard.table_id || !wizard.steps?.length) {
      toast.error("Please fill wizard name, table and at least one step.");
      return;
    }
    setSaving(true);
    try {
      // NOTE: Wizard name and table ID are currently fixed due to UI redesign, not user editable here.
      // If these need to be dynamic, UI must be reintroduced or managed elsewhere.
      // Same applies for is_active and submit_on_final_step toggles.
      const payload = { ...wizard, is_active: activate ? true : wizard.is_active };
      const existing = await OnboardingWizard.filter({ table_id: payload.table_id });
      if (existing?.length) {
        const updated = await OnboardingWizard.update(existing[0].id, payload);
        setWizard(updated);
      } else {
        const created = await OnboardingWizard.create(payload);
        setWizard(created);
      }
      toast.success(activate ? "Wizard saved and activated." : "Wizard saved.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save wizard.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white/80">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center text-white/80">
        Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-400" />
              Onboarding Quiz Builder
            </h1>
            <p className="text-white/70 text-sm">
              Build your onboarding questions per step. Click fields below to add them to the active step.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Public link share panel - now always visible, with full link */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5 pl-2 max-w-[560px]">
              <span className="text-xs text-white/60">Public link</span>
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                onBlur={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("b44_custom_domain", (customDomain || "").trim());
                  }
                }}
                placeholder="yourdomain.com (optional)"
                className="w-44 bg-transparent outline-none text-white/80 text-xs placeholder:text-white/40"
                title="Enter your custom domain to generate the live link"
              />
              <Input
                value={publicLink}
                readOnly
                className="bg-white/10 border-white/15 text-white/80 text-xs h-8"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicLink);
                  try { toast.success("Link copied"); } catch {}
                }}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 shrink-0"
                title="Copy public link"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={() => window.open(publicLink, "_blank", "noopener,noreferrer")}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 shrink-0"
                title="Open public link"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </button>
            </div>

            <Button variant="outline" onClick={loadFields} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Fields
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(createPageUrl('OnboardingPortal'), '_blank', 'noopener,noreferrer')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Preview Wizard
            </Button>
            <Button onClick={() => saveWizard(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => saveWizard(true)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save & Activate
            </Button>
          </div>
        </div>

        {/* Single-column builder */}
        <div className="space-y-6">
          {/* Steps list */}
          <div className="space-y-4">
            {wizard.steps.map((step, idx) => (
              <Card
                key={idx}
                className={`bg-white/5 ${idx === activeStepIdx ? "border-emerald-400/40 ring-1 ring-emerald-500/20" : "border-white/10"} border shadow-lg shadow-black/10`}
              >
                <CardHeader className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle>Step {idx + 1}</CardTitle>
                    {idx === activeStepIdx ? (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-600/20 text-emerald-200 border border-emerald-500/30">
                        Active target
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {idx !== activeStepIdx && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStepIdx(idx)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="text-red-300 hover:text-red-400"
                      onClick={() => removeStep(idx)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove step
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 mb-1">Title</label>
                      <Input value={step.title} onChange={(e) => updateStep(idx, { title: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1">Quick add field</label>
                      <Select onValueChange={async (v) => await addFieldToStep(idx, v)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose a field to add" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border-white/20 text-white max-h-[280px]">
                          {availableFields.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f} {isLinkedField(f) ? "• linked" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Description</label>
                    <Textarea value={step.description} onChange={(e) => updateStep(idx, { description: e.target.value })} />
                  </div>

                  {/* Field rows */}
                  <div className="space-y-3">
                    {(step.fields || []).length === 0 ? (
                      <div className="text-white/60 text-sm">No questions in this step yet.</div>
                    ) : (
                      (step.fields || []).map((field) => (
                        <div
                          key={field.field_name}
                          className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_120px] gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/10 shadow-sm shadow-black/5"
                        >
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Label</label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(idx, field.field_name, { label: e.target.value })}
                            />
                            <p className="text-[11px] text-white/50 mt-1">
                              Maps to: “{field.field_name}”
                              {isLinkedField(field.field_name) ? (
                                <span className="ml-2 text-emerald-300">• linked</span>
                              ) : null}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Type</label>
                            <Select
                              value={field.type}
                              onValueChange={async (v) => {
                                // preserve options if switching to select for manual fields
                                const patch = { type: v };
                                // If field is linked, and we're switching away from 'select' to something else,
                                // but then switch back to 'select', we should refetch options, unless they are already there.
                                // For now, simple update is fine. The refresh button handles explicit refresh.
                                updateField(idx, field.field_name, patch);
                              }}
                            >
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800/95 border-white/20 text-white">
                                {FIELD_TYPES.map((t) => (
                                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Placeholder</label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) => updateField(idx, field.field_name, { placeholder: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center justify-between md:justify-center gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!field.required}
                                onCheckedChange={(v) => updateField(idx, field.field_name, { required: v })}
                              />
                              <span className="text-xs">Required</span>
                            </div>
                            <Button variant="ghost" className="text-red-300 hover:text-red-400" onClick={() => removeFieldFromStep(idx, field.field_name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Linked select options (pretty chips) */}
                          {field.type === "select" && isLinkedField(field.field_name) && (
                            <div className="md:col-span-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="block text-xs text-white/60">
                                  Options from Airtable • {LINKED_FIELD_TABLES[field.field_name]}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => refreshLinkedFieldOptions(idx, field.field_name)}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  Refresh options
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-auto rounded-md p-2 bg-white/5 border border-white/10">
                                {(field.options || []).length ? (
                                  (field.options || []).slice(0, 80).map((opt, i) => (
                                    <span
                                      key={i} // Using index as key is acceptable here as options are not reordered independently
                                      className="px-2 py-0.5 text-xs rounded bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                                    >
                                      {typeof opt === "string" ? opt : opt?.label}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-white/50">No options loaded yet.</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Manual select options */}
                          {field.type === "select" && !isLinkedField(field.field_name) && (
                            <div className="md:col-span-4">
                              <label className="block text-xs text-white/60 mb-1">Options (comma separated)</label>
                              <Input
                                value={Array.isArray(field.options) ? (field.options).join(", ") : ""}
                                onChange={(e) =>
                                  updateField(idx, field.field_name, {
                                    options: e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={addStep} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Plus className="w-4 h-4 mr-2" /> Add Step
            </Button>
          </div>

          {/* Available fields UNDER the builder */}
          <Card className="bg-white/5 border-white/10 shadow-xl shadow-black/20">
            <CardHeader>
              <CardTitle>Add Questions from Airtable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-white/60">
                Active target: Step {Math.min(activeStepIdx + 1, (wizard.steps?.length || 1))}. Click any field to add it as a question.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableFields.length ? (
                  availableFields.map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={async () => {
                        await addFieldToStep(activeStepIdx, f);
                        try { toast.success(`Added “${f}” to Step ${activeStepIdx + 1}`); } catch (e) { /* swallow error if toast fails */ }
                      }}
                      className="px-3 py-1.5 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-sm shadow-sm transition-colors"
                    >
                      {f}
                      {isLinkedField(f) ? (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                          linked
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <span className="text-white/60 text-sm">
                    No fields detected yet (save some records in Airtable and refresh).
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
