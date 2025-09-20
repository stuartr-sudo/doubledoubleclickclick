
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2 } from "lucide-react";

export default function AnalyticsByUsername({ usernames = [], isSavingMap = {}, onSave, onRefresh }) {
  const [local, setLocal] = React.useState([]);

  React.useEffect(() => {
    setLocal((usernames || []).filter(u => u.is_active !== false).map(u => ({
      id: u.id,
      user_name: u.user_name,
      display_name: u.display_name,
      ga4_property_id: u.ga4_property_id || "",
      gsc_site_url: u.gsc_site_url || ""
    })));
  }, [usernames]);

  const updateField = (id, key, value) => {
    setLocal(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  const handleSave = (row) => {
    const patch = {
      ga4_property_id: (row.ga4_property_id || "").trim(),
      gsc_site_url: (row.gsc_site_url || "").trim()
    };
    onSave && onSave(row, patch);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-slate-900 font-semibold">Analytics by Username</h3>
          <p className="text-slate-600 text-sm">Add your GA4 Property ID and GSC Site URL per brand.</p>
        </div>
        <Button onClick={onRefresh} variant="outline" className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {local.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No active usernames yet.</div>
      ) : (
        <div className="divide-y divide-slate-200">
          {local.map(row => (
            <Card key={row.id} className="m-3 bg-white border-slate-200 shadow-sm">
              <div className="p-4 grid grid-cols-1 md:grid-cols-[2fr_2fr_200px] gap-3 items-end">
                <div>
                  <div className="text-slate-900 font-medium">{row.display_name || row.user_name}</div>
                  <div className="text-xs text-slate-500">@{row.user_name}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-700 text-sm mb-1 block">GA4 Property ID</Label>
                    <Input
                      placeholder="e.g., 123456789"
                      value={row.ga4_property_id}
                      onChange={(e) => updateField(row.id, "ga4_property_id", e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 text-sm mb-1 block">GSC Site URL</Label>
                    <Input
                      placeholder="https://example.com/"
                      value={row.gsc_site_url}
                      onChange={(e) => updateField(row.id, "gsc_site_url", e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <Button
                    onClick={() => handleSave(row)}
                    disabled={!!isSavingMap[row.id]}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSavingMap[row.id] ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
