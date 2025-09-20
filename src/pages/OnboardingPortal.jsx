
import React, { useEffect, useMemo, useState } from "react";
import { OnboardingWizard } from "@/api/entities";
import { airtableCreateRecord } from "@/api/functions";
import { airtableSync } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function OnboardingPortal() {
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [linkedIdMaps, setLinkedIdMaps] = useState({}); // { Language: { 'English': 'recXXX' }, GeographicLocationsDFSEO: {...} }

  // Fetch active wizard (first active)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const active = await OnboardingWizard.filter({ is_active: true }, "-updated_date", 1);
        if (active && active.length) {
          setWizard(active[0]);
          // Initialize answers map
          const fldPairs = [];
          (active[0].steps || []).forEach(s =>
            (s.fields || []).forEach(f => fldPairs.push([f.field_name, ""]))
          );
          setAnswers(Object.fromEntries(fldPairs));
        } else {
          setWizard(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const steps = useMemo(() => wizard?.steps || [], [wizard]);

  const currentFields = useMemo(() => steps[stepIdx]?.fields || [], [steps, stepIdx]);

  const setVal = (fieldName, val) => {
    setAnswers(prev => ({ ...prev, [fieldName]: val }));
    setErrorMap(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const validateStep = () => {
    const errs = {};
    currentFields.forEach(f => {
      if (f.required && !String(answers[f.field_name] ?? "").trim()) {
        errs[f.field_name] = "Required";
      }
    });
    setErrorMap(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStepIdx(i => Math.min(i + 1, steps.length - 1));
  };

  const prev = () => setStepIdx(i => Math.max(i - 1, 0));

  // Fallback: if a select field has no options but maps to a linked table we know, try to fetch once.
  // Fetch select options AND record id maps for linked tables
  const LINKED_FIELD_TABLES = {
    Language: "Language",
    GeographicLocationsDFSEO: "GeographicLocationsDFSEO",
    "Geographic Location": "GeographicLocationsDFSEO"
  };

  useEffect(() => {
    (async () => {
      if (!wizard) return;
      const newWizard = JSON.parse(JSON.stringify(wizard));
      const maps = {};
      let updated = false;

      for (const [fieldName, tableName] of Object.entries(LINKED_FIELD_TABLES)) {
        // if any step contains this field and it's select or missing options, fetch
        const fieldExists = (newWizard.steps || []).some(s => (s.fields || []).some(f => f.field_name === fieldName));
        if (!fieldExists) continue;

        const { data } = await airtableSync({ action: "listAll", tableId: tableName });
        if (data?.success) {
          const records = data.records || [];
          const pairs = records.map(r => {
            const fields = r.fields || {};
            const label =
              fields.Name || fields.name || fields.Title || fields.title ||
              Object.values(fields).find(v => typeof v === "string" && v.trim().length > 0) || "";
            return [String(label), r.id];
          }).filter(([label, id]) => label && id);
          const uniq = {};
          pairs.forEach(([label, id]) => { if (!uniq[label]) uniq[label] = id; });
          maps[fieldName] = uniq;

          // also populate options on fields that lack them
          const options = Object.keys(uniq).sort((a, b) => a.localeCompare(b));
          (newWizard.steps || []).forEach(s => {
            (s.fields || []).forEach(f => {
              if (f.field_name === fieldName) {
                f.type = "select"; // Ensure type is select for these fields
                if (!Array.isArray(f.options) || f.options.length === 0) {
                  f.options = options;
                  updated = true;
                }
              }
            });
          });
        }
      }

      setLinkedIdMaps(maps);
      if (updated) setWizard(newWizard);
    })();
  }, [wizard]);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!wizard?.table_id) return toast.error("Wizard is missing Airtable table target.");

    setSubmitting(true);
    try {
      // Compose fields payload: ONLY include completed fields (non-empty)
      const payload = {};
      (wizard.steps || []).forEach(s => {
        (s.fields || []).forEach(f => {
          const raw = answers[f.field_name];
          const hasValue =
            typeof raw === "number" ||
            (typeof raw === "string" && raw.trim().length > 0);

          if (!hasValue) return;

          // Map linked selects by label -> Airtable record ID (array) if map exists
          if (f.type === "select" && linkedIdMaps[f.field_name]) {
            const label = String(raw).trim();
            const id = linkedIdMaps[f.field_name][label];
            if (id) {
              payload[f.field_name] = [id]; // Airtable linked record expects array of record IDs
            } else {
              // Fallback: send the label as-is if no ID found (Airtable may auto-match by display)
              payload[f.field_name] = label;
            }
          } else {
            payload[f.field_name] = raw;
          }
        });
      });

      if (Object.keys(payload).length === 0) {
        toast.error("Please complete at least one field before submitting.");
        setSubmitting(false);
        return;
      }

      const { data } = await airtableCreateRecord({ tableId: wizard.table_id, fields: payload });
      if (!data?.success) {
        toast.error(data?.error || "Failed to create record in Airtable.");
      } else {
        toast.success("Onboarding submitted successfully!");
        // Reset answers for a clean state
        const cleared = {};
        (wizard.steps || []).forEach(s => (s.fields || []).forEach(f => { cleared[f.field_name] = ""; }));
        setAnswers(cleared);
        setErrorMap({});
        setStepIdx(0);
      }
    } catch (e) {
      toast.error("Submission failed.");
    }
    setSubmitting(false);
  };

  // --- Elegant UI ---
  const inputBase = "bg-white/10 border transition-colors text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30";
  const errClass = "border-red-400 focus:border-red-400 focus:bg-red-500/10";

  const renderField = (f) => {
    const v = answers[f.field_name] ?? "";
    const err = errorMap[f.field_name];

    const FieldLabel = (
      <div className="flex items-center justify-between">
        <label className="text-[0.9rem] text-white/90">
          {f.label || f.field_name}{f.required ? " *" : ""}
        </label>
        {f.placeholder ? <span className="text-xs text-white/40">{f.placeholder}</span> : null}
      </div>
    );

    if (f.type === "textarea") {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Textarea
            value={v}
            onChange={(e) => setVal(f.field_name, e.target.value)}
            rows={5}
            className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
          />
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    if (f.type === "number") {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Input
            type="number"
            value={v}
            placeholder="Enter a number"
            onChange={(e) => setVal(f.field_name, e.target.value)}
            className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
          />
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    if (f.type === "date") {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Input
            type="date"
            value={v}
            onChange={(e) => setVal(f.field_name, e.target.value)}
            className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
          />
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    if (f.type === "email") {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Input
            type="email"
            value={v}
            placeholder="name@company.com"
            onChange={(e) => setVal(f.field_name, e.target.value)}
            className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
          />
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    if (f.type === "url") {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Input
            type="url"
            value={v}
            placeholder="https://example.com"
            onChange={(e) => setVal(f.field_name, e.target.value)}
            className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
          />
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    if (f.type === "select" && (f.options || []).length > 0) {
      return (
        <div key={f.field_name} className="space-y-1">
          {FieldLabel}
          <Select value={v || ""} onValueChange={(val) => setVal(f.field_name, val)}>
            <SelectTrigger className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 border-white/20 text-white max-h-72">
              {(f.options || []).map((opt, i) => (
                <SelectItem key={`${f.field_name}-${i}`} value={String(opt)}>{String(opt)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err ? <div className="text-xs text-red-300">{err}</div> : null}
        </div>
      );
    }

    // default: text
    return (
      <div key={f.field_name} className="space-y-1">
        {FieldLabel}
        <Input
          value={v}
          placeholder="Type your answer"
          onChange={(e) => setVal(f.field_name, e.target.value)}
          className={`${inputBase} ${err ? errClass : "border-white/15"} rounded-lg`}
        />
        {err ? <div className="text-xs text-red-300">{err}</div> : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-white/80" />
      </div>
    );
  }

  if (!wizard) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white/80">
        No active onboarding wizard found.
      </div>
    );
  }

  const isLast = stepIdx === steps.length - 1;
  const progressPct = steps.length ? Math.round(((stepIdx + 1) / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white">
      {/* Soft background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{wizard?.name || "Onboarding"}</h1>
          <p className="text-white/60 text-sm">Step {stepIdx + 1} of {steps.length}</p>
        </div>

        {/* Stepper + Progress */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  i === stepIdx ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-200" : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                <span className={`w-5 h-5 rounded-full grid place-items-center text-[11px] ${
                  i === stepIdx ? "bg-emerald-500/70 text-white" : "bg-white/10 text-white/70"
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPct} />
        </div>

        {/* Form Card */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md shadow-2xl shadow-black/20">
          <CardHeader>
            <CardTitle className="text-white">{steps[stepIdx]?.title}</CardTitle>
            {steps[stepIdx]?.description ? (
              <p className="text-sm text-white/70">{steps[stepIdx].description}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentFields.map(renderField)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={prev}
                disabled={stepIdx === 0 || submitting}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {!isLast ? (
                <Button onClick={next} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Submit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
