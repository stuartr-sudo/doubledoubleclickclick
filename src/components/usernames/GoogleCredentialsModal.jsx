
import React from "react";
import { Username } from "@/api/entities";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart3, Globe } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/api/entities"; // New import

export default function GoogleCredentialsModal({
  isOpen,
  onClose,
  defaultUsername = ""
}) {
  const [usernames, setUsernames] = React.useState([]);
  const [selectedUsername, setSelectedUsername] = React.useState("");
  const [selectedRecordId, setSelectedRecordId] = React.useState(null);

  const [ga4PropertyId, setGa4PropertyId] = React.useState("");
  const [gscSiteUrl, setGscSiteUrl] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Load usernames on open (scoped to current user)
  React.useEffect(() => {
    if (!isOpen) {
      // reset on close
      setSelectedUsername(defaultUsername || "");
      setSelectedRecordId(null);
      setGa4PropertyId("");
      setGscSiteUrl("");
      return;
    }
    (async () => {
      try {
        setIsLoading(true);

        // Get current user and determine scope
        let scopedUsernames = [];
        const me = await User.me().catch(() => null);

        const isAdmin = !!(me && (me.role === "admin" || me.access_level === "full"));

        // Load all usernames once (we'll filter below)
        const all = await Username.list("-created_date").catch(() => []);

        if (isAdmin) {
          // Admins see all active usernames
          scopedUsernames = all.filter(u => u.is_active !== false);
        } else {
          const assigned = Array.isArray(me?.assigned_usernames) ? me.assigned_usernames.filter(Boolean) : [];
          const assignedSet = new Set(assigned.map(String));
          scopedUsernames = all.filter(u => assignedSet.has(String(u.user_name)));
        }

        setUsernames(scopedUsernames || []);

        // Pick default selection only from allowed list
        const allowedKeys = new Set((scopedUsernames || []).map(u => u.user_name));
        const initial =
          (defaultUsername && allowedKeys.has(defaultUsername) && defaultUsername) ||
          scopedUsernames?.[0]?.user_name ||
          "";
        setSelectedUsername(initial || "");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, defaultUsername]);

  // When selection changes, populate existing values
  React.useEffect(() => {
    if (!selectedUsername || usernames.length === 0) {
      setSelectedRecordId(null);
      setGa4PropertyId("");
      setGscSiteUrl("");
      return;
    }
    const rec = usernames.find((u) => u.user_name === selectedUsername);
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

  // Basic validation
  const validGa4 =
    ga4PropertyId.trim() === "" ||
    /^G-[A-Z0-9]+$/i.test(ga4PropertyId.trim()) ||
    /^[0-9]{6,}$/.test(ga4PropertyId.trim());
  const validGsc = gscSiteUrl.trim() === "" || /^https?:\/\/.+/i.test(gscSiteUrl.trim());

  const canSave =
    !isSaving &&
    !isLoading &&
    !!selectedRecordId &&
    validGa4 &&
    validGsc;

  const handleSave = async () => {
    if (!selectedRecordId) return;
    setIsSaving(true);
    try {
      await Username.update(selectedRecordId, {
        ga4_property_id: ga4PropertyId.trim() || "",
        gsc_site_url: gscSiteUrl.trim() || ""
      });
      toast.success("Google credentials saved");
      onClose && onClose();
    } catch (e) {
      toast.error("Failed to save credentials");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Connect Google Analytics & Search Console
          </DialogTitle>
          <DialogDescription>
            Set the GA4 Property ID and GSC Site URL for your brand (Username). These values are saved on the selected Username.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Username picker */}
          <div>
            <Label className="mb-2 block">Brand (Username)</Label>
            <Select
              value={selectedUsername}
              onValueChange={setSelectedUsername}
              disabled={isLoading || usernames.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : "Select a brand"} />
              </SelectTrigger>
              <SelectContent>
                {usernames.map((u) => (
                  <SelectItem key={u.id} value={u.user_name}>
                    {u.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {usernames.length === 0 && !isLoading && (
              <p className="mt-2 text-sm text-gray-500">
                No usernames found. Add one in Username Manager first.
              </p>
            )}
          </div>

          {/* GA4 */}
          <div className="space-y-2">
            <Label htmlFor="ga4" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              GA4 Property ID
            </Label>
            <Input
              id="ga4"
              placeholder="e.g., 123456789 or G-XXXXXXXXXX"
              value={ga4PropertyId}
              onChange={(e) => setGa4PropertyId(e.target.value)}
            />
            {!validGa4 && (
              <p className="text-xs text-red-600">
                Enter a numeric Property ID (e.g., 123456789) or a Measurement ID (e.g., G-ABCD123456).
              </p>
            )}
            <p className="text-xs text-gray-500">
              Tip: In GA4, Property ID is numeric; Measurement ID starts with G-.
            </p>
          </div>

          {/* GSC */}
          <div className="space-y-2">
            <Label htmlFor="gsc" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Search Console Site URL
            </Label>
            <Input
              id="gsc"
              placeholder="https://www.example.com/"
              value={gscSiteUrl}
              onChange={(e) => setGscSiteUrl(e.target.value)}
            />
            {!validGsc && (
              <p className="text-xs text-red-600">
                Please enter a valid URL starting with http:// or https://
              </p>
            )}
            <p className="text-xs text-gray-500">
              Use the exact property URL from Search Console (include protocol and trailing slash when applicable).
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave} className="min-w-[110px]">
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
