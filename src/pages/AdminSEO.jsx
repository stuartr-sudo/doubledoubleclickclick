import React from "react";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Settings, BarChart3, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AdminSEO() {
  const [me, setMe] = React.useState(null);
  const [checking, setChecking] = React.useState(true);

  const [usernames, setUsernames] = React.useState([]);
  const [selectedUsername, setSelectedUsername] = React.useState("");
  const [selectedRecordId, setSelectedRecordId] = React.useState(null);

  const [ga4PropertyId, setGa4PropertyId] = React.useState("");
  const [gscSiteUrl, setGscSiteUrl] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setChecking(true);
      try {
        const u = await User.me();
        setMe(u);
        if (u?.role === "admin" || u?.access_level === "full") {
          setIsLoading(true);
          const all = await Username.list("-created_date").catch(() => []);
          const active = (all || []).filter(x => x.is_active !== false);
          setUsernames(active);
          setSelectedUsername(active?.[0]?.user_name || "");
        }
      } finally {
        setChecking(false);
        setIsLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!selectedUsername || usernames.length === 0) {
      setSelectedRecordId(null);
      setGa4PropertyId("");
      setGscSiteUrl("");
      return;
    }
    const rec = usernames.find(u => u.user_name === selectedUsername);
    if (rec) {
      setSelectedRecordId(rec.id);
      setGa4PropertyId(rec.ga4_property_id || "");
      setGscSiteUrl(rec.gsc_site_url || "");
    } else {
      setSelectedRecordId(null);
      setGa4PropertyId("");
      setGscSiteUrl("");
    }
  }, [selectedUsername, usernames]);

  const validGa4 =
    ga4PropertyId.trim() === "" ||
    /^G-[A-Z0-9]+$/i.test(ga4PropertyId.trim()) ||
    /^[0-9]{6,}$/.test(ga4PropertyId.trim());

  const validGsc = gscSiteUrl.trim() === "" || /^https?:\/\/.+/i.test(gscSiteUrl.trim());

  const canSave = !!selectedRecordId && !isSaving && validGa4 && validGsc;

  const handleSave = async () => {
    if (!selectedRecordId) return;
    setIsSaving(true);
    try {
      await Username.update(selectedRecordId, {
        ga4_property_id: ga4PropertyId.trim() || "",
        gsc_site_url: gscSiteUrl.trim() || ""
      });
      toast.success("SEO settings saved for " + selectedUsername);
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (!(me?.role === "admin" || me?.access_level === "full")) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Access denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 mb-4">You must be an admin to access SEO Setup.</p>
            <Link to={createPageUrl("Dashboard")} className="text-indigo-300 hover:text-indigo-200">Back to Dashboard</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" /> SEO Setup
        </h1>
        <Link to={createPageUrl("Dashboard")} className="text-sm text-white/70 hover:text-white">Back to Dashboard</Link>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Connect GA4 & Search Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block">Brand (Username)</Label>
            <Select
              value={selectedUsername}
              onValueChange={setSelectedUsername}
              disabled={isLoading || usernames.length === 0}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select a brand"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 text-white">
                {usernames.map(u => (
                  <SelectItem key={u.id} value={u.user_name}>
                    {u.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {usernames.length === 0 && (
              <p className="mt-2 text-sm text-white/60">No usernames found. Add one first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga4" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              GA4 Property ID
            </Label>
            <Input
              id="ga4"
              placeholder="e.g., 123456789 or G-XXXXXXXXXX"
              value={ga4PropertyId}
              onChange={(e) => setGa4PropertyId(e.target.value)}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/50"
            />
            {!validGa4 && (
              <p className="text-xs text-red-400">
                Enter a numeric Property ID (e.g., 123456789) or a Measurement ID (e.g., G-ABCD123456).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gsc" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Search Console Site URL
            </Label>
            <Input
              id="gsc"
              placeholder="https://www.example.com/"
              value={gscSiteUrl}
              onChange={(e) => setGscSiteUrl(e.target.value)}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/50"
            />
            {!validGsc && (
              <p className="text-xs text-red-400">
                Please enter a valid URL starting with http:// or https://
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!canSave} className="min-w-[120px]">
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}