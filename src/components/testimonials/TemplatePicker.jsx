
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { styleCatalog } from "@/components/variants/renderers";

function TemplatePicker({ selected = {}, primary = "", onChange }) {
  const catalog = styleCatalog();
  const styles = catalog.testimonial || [];

  const toggle = (key, checked) => {
    const nextSel = { ...(selected || {}) };
    if (checked) nextSel[key] = true; else delete nextSel[key];

    // If current primary was unchecked, fallback to first selected or empty
    let nextPrimary = primary;
    if (!nextSel[nextPrimary]) {
      nextPrimary = Object.keys(nextSel)[0] || "";
    }
    onChange && onChange({ selected: nextSel, primary: nextPrimary });
  };

  const handlePrimaryChange = (val) => {
    // Ensure the chosen primary is part of selected
    const nextSel = { ...(selected || {}) };
    if (val) nextSel[val] = true;
    onChange && onChange({ selected: nextSel, primary: val });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-700">Styles to save (choose multiple)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {styles.map((s) => (
            <label key={s.key} className="border border-slate-300 rounded-md p-3 flex items-center gap-2 hover:bg-slate-50 cursor-pointer">
              <Checkbox
                checked={!!selected[s.key]}
                onCheckedChange={(v) => toggle(s.key, Boolean(v))}
              />
              <span className="text-slate-800">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="max-w-sm">
        <Label className="text-slate-700">Primary style to insert</Label>
        <Select value={primary || ""} onValueChange={handlePrimaryChange}>
          <SelectTrigger className="bg-white border-slate-300 mt-1">
            <SelectValue placeholder="Choose a style to insert" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {styles.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-2">
          The selected primary style will be inserted into the editor and automatically added to the saved styles.
        </p>
      </div>
    </div>
  );
}

export default TemplatePicker;
