
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Database, Save } from "lucide-react";
import { airtableSync } from "@/api/functions";

const DEFAULT_TABLES = {
  faq: { id: "tblSDBPmucJA0Skvp", label: "Frequently Asked Questions", defaultFields: ["Keyword", "Username"] },
  keyword: { id: "tblDR9SmoK8wEYmnA", label: "Keyword Map", defaultFields: ["Keyword", "Username"] },
};

function FieldEditor({ meta, value, onChange }) {
  // meta may be undefined if metadata scope is not available; fall back to text
  const type = meta?.type;
  const options = meta?.options;

  if (type === "singleSelect" && options?.choices?.length) {
    return (
      <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
        <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 text-white border-white/20">
          <SelectItem key="__empty" value="">—</SelectItem>
          {options.choices.map((c) => (
            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "multipleSelects" && options?.choices?.length) {
    // Simple CSV editor for multi-selects
    const csv = Array.isArray(value) ? value.join(", ") : (value || "");
    return (
      <Input
        value={csv}
        onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        className="h-8 bg-white/10 border-white/20 text-white"
        placeholder="choice1, choice2"
      />
    );
  }

  if (type === "checkbox") {
    return (
      <Button variant="outline" className={`h-8 ${value ? "bg-emerald-600 text-white" : "bg-white/10 text-white"}`} onClick={() => onChange(!value)}>
        {value ? "Yes" : "No"}
      </Button>
    );
  }

  // Default text editor
  return (
    <Input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 bg-white/10 border-white/20 text-white"
    />
  );
}

export default function AirtablePage() {
  const [selectedTab, setSelectedTab] = useState("keyword");
  const [records, setRecords] = useState([]);
  const [fieldsCfg, setFieldsCfg] = useState(() => {
    const saved = localStorage.getItem("airtable_fields_cfg");
    return saved ? JSON.parse(saved) : {
      faq: DEFAULT_TABLES.faq.defaultFields,
      keyword: DEFAULT_TABLES.keyword.defaultFields,
    };
  });
  // dynamic tables pulled from backend config
  const [tables, setTables] = useState(DEFAULT_TABLES);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const currentTable = useMemo(() => tables[selectedTab], [tables, selectedTab]);

  const currentFieldMetas = useMemo(() => {
    if (!metadata) return {};
    const tableMeta = metadata.find(t => t.id === currentTable.id || t.name === currentTable.label);
    if (!tableMeta) return {};
    const map = {};
    tableMeta.fields.forEach(f => { map[f.name] = { type: f.type, options: f.options }; });
    return map;
  }, [metadata, currentTable]);

  const loadMetadata = async () => {
    const { data } = await airtableSync({ action: "getMetadata" });
    if (data?.success) {
      setMetadata(data.tables);
    } else {
      setMetadata(null); // continue without metadata
    }
  };

  const loadConfig = async () => {
    const { data } = await airtableSync({ action: "getConfig" });
    if (data?.success) {
      setTables(prev => ({
        faq: { ...prev.faq, id: data.tables.frequentlyAskedQuestions || prev.faq.id },
        keyword: { ...prev.keyword, id: data.tables.keywordMap || prev.keyword.id },
      }));
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    const { data } = await airtableSync({
      action: "listRecords",
      tableId: currentTable.id,
      pageSize: 100,
      fieldNames: fieldsCfg[selectedTab],
      sort: [{ field: fieldsCfg[selectedTab][0] || "created_time", direction: "asc" }],
    });
    if (data?.success) {
      setRecords(data.records || []);
    } else {
      console.error(data?.error || "Failed to load Airtable records");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
    loadMetadata();
  }, []);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, JSON.stringify(fieldsCfg[selectedTab]), currentTable.id]);

  const handleFieldCfgChange = (tabKey, csv) => {
    const parts = csv.split(",").map(s => s.trim()).filter(Boolean);
    const next = { ...fieldsCfg, [tabKey]: parts.length ? parts : [] };
    setFieldsCfg(next);
    localStorage.setItem("airtable_fields_cfg", JSON.stringify(next));
  };

  const updateCell = async (recordId, fieldName, newValue) => {
    setSaving(true);
    // Optimistic update
    setRecords(prev => prev.map(r => (r.id === recordId ? { ...r, fields: { ...r.fields, [fieldName]: newValue } } : r)));
    const { data } = await airtableSync({
      action: "updateRecord",
      tableId: currentTable.id,
      recordId,
      fields: { [fieldName]: newValue },
    });
    if (!data?.success) {
      console.error(data?.error || "Update failed");
      // reload to correct any mismatch
      loadRecords();
    } else {
      console.log("Updated");
    }
    setSaving(false);
  };

  const createRow = async () => {
    setSaving(true);
    const scaffold = {};
    fieldsCfg[selectedTab].forEach(f => { scaffold[f] = ""; });
    const { data } = await airtableSync({
      action: "createRecord",
      tableId: currentTable.id,
      fields: scaffold,
    });
    if (data?.success) {
      console.log("Row created");
      loadRecords();
    } else {
      console.error(data?.error || "Create failed");
    }
    setSaving(false);
  };

  const filtered = useMemo(() => {
    if (!filter) return records;
    const needle = filter.toLowerCase();
    return records.filter(r =>
      Object.entries(r.fields || {}).some(([k, v]) => {
        if (!fieldsCfg[selectedTab].includes(k)) return false;
        const val = Array.isArray(v) ? v.join(", ") : (v ?? "");
        return String(val).toLowerCase().includes(needle);
      })
    );
  }, [records, filter, fieldsCfg, selectedTab]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Airtable Console</h1>
              <p className="text-white/70 text-sm">Live view and edit for your Airtable tables.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadRecords} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={createRow} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Row
            </Button>
          </div>
        </div>

        {/* Table switcher + field config */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-1">Choose table</label>
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/20">
                  <SelectItem value="faq">{tables.faq.label}</SelectItem>
                  <SelectItem value="keyword">{tables.keyword.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-1">Fields to show (comma-separated)</label>
              <div className="flex gap-2">
                <Input
                  value={(fieldsCfg[selectedTab] || []).join(", ")}
                  onChange={(e) => handleFieldCfgChange(selectedTab, e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="e.g. Keyword, Username"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-1">Filter</label>
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white/10 border-white/20 text-white" placeholder="Search shown fields..." />
            </div>
          </div>

          {metadata ? (
            <div className="mt-3 text-xs text-white/60">
              Metadata loaded
              <Badge variant="outline" className="ml-2 border-white/20 text-white/70">smart controls enabled</Badge>
            </div>
          ) : (
            <div className="mt-3 text-xs text-white/60">
              Metadata not available for this token
              <Badge variant="outline" className="ml-2 border-white/20 text-white/70">fallback editors</Badge>
            </div>
          )}
        </div>

        {/* Data table */}
        <div className="overflow-auto">
          <table className="min-w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-white/10">
              <tr>
                {fieldsCfg[selectedTab].map((f) => (
                  <th key={f} className="text-left text-white/80 px-4 py-3 whitespace-nowrap">{f}</th>
                ))}
                <th className="px-4 py-3 text-white/80">Record ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-white/70" colSpan={(fieldsCfg[selectedTab].length || 0) + 1}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-6 text-white/70" colSpan={(fieldsCfg[selectedTab].length || 0) + 1}>No rows</td></tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="border-t border-white/10">
                    {fieldsCfg[selectedTab].map((field) => (
                      <td key={field} className="px-4 py-2 align-middle">
                        <FieldEditor
                          meta={currentFieldMetas[field]}
                          value={rec.fields?.[field]}
                          onChange={(val) => updateCell(rec.id, field, val)}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-xs text-white/50">{rec.id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {saving && (
            <div className="text-xs text-white/60 mt-2 flex items-center gap-2">
              <Save className="w-4 h-4 animate-pulse" />
              Saving…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
