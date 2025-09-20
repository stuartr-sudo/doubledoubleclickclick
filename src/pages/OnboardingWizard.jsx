import React, { useEffect, useMemo, useState } from "react";
import { OnboardingWizard } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { airtableCreateRecord } from "@/api/functions";

function FieldInput({ cfg, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    placeholder: cfg.placeholder || "",
  };

  switch (cfg.type) {
    case "textarea":
      return <Textarea {...common} rows={4} />;
    case "number":
      return <Input type="number" {...common} />;
    case "date":
      return <Input type="date" {...common} />;
    case "email":
      return <Input type="email" {...common} />;
    case "url":
      return <Input type="url" {...common} />;
    case "select":
      return (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={cfg.placeholder || "Choose..."} />
          </SelectTrigger>
          <SelectContent>
            {(cfg.options || []).map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return <Input {...common} />;
  }
}

export default function OnboardingWizardPage() {
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me().catch(() => null);
        setUser(u);
        // Load active wizard for Company Information
        const list = await OnboardingWizard.filter({ is_active: true, table_id: "Company Information" });
        if (list && list.length) {
          setWizard(list[0]);
        } else {
          setWizard(null);
        }
      } catch {
        setWizard(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const steps = wizard?.steps || [];
  const step = steps[currentStep] || null;

  const canNext = useMemo(() => {
    if (!step) return false;
    const missing = (step.fields || []).some((f) => {
      if (!f.required) return false;
      const v = values[f.field_name];
      return v === undefined || v === null || String(v).trim() === "";
    });
    return !missing;
  }, [step, values]);

  const updateValue = (fieldName, val) => {
    setValues((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSubmit = async () => {
    if (!wizard) return;
    setSubmitting(true);
    try {
      const { data } = await airtableCreateRecord({
        tableId: wizard.table_id,
        fields: values,
      });
      if (!data?.success) {
        toast.error(data?.error || "Failed to create record in Airtable");
      } else {
        toast.success("Company information submitted.");
        // Optionally navigate or reset
        setValues({});
        setCurrentStep(0);
      }
    } catch (e) {
      toast.error(e?.message || "Submission failed");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white/80">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!wizard) {
    return (
      <div className="min-h-screen grid place-items-center text-white/80 text-center p-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">No active onboarding wizard</h2>
          <p className="text-white/70">Please ask an administrator to configure one in the Onboarding Wizard Builder.</p>
        </div>
      </div>
    );
  }

  const isLast = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>{wizard.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-sm text-white/70 mb-2">Step {currentStep + 1} of {steps.length}</div>
              <h3 className="text-xl font-semibold">{step?.title}</h3>
              {step?.description ? <p className="text-white/70 mt-1">{step.description}</p> : null}
            </div>

            <div className="space-y-4">
              {(step?.fields || []).map((f) => (
                <div key={f.field_name}>
                  <label className="block text-sm text-white/80 mb-1">
                    {f.label || f.field_name} {f.required ? <span className="text-red-300">*</span> : null}
                  </label>
                  <FieldInput
                    cfg={f}
                    value={values[f.field_name]}
                    onChange={(v) => updateValue(f.field_name, v)}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {!isLast ? (
                <Button disabled={!canNext} onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button disabled={!canNext || submitting} onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
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