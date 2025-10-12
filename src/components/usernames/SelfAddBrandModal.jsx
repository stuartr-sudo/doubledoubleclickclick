
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { toast } from "sonner";

// CRITICAL: Username blacklist - only Stuart Asta can use these terms
const BLACKLIST = [
  'stuartasta', 'stuarta', 'stuartas', 'stuartast', 'stuart-asta', 'stuartasta1',
  'stuartasta_', 'stuart_asta', 'stuartasta-', 'sasta', 's-asta', 's_asta',
  'stasta', 'stasta1', 'doubleclick', 'double-click', 'double_click', 'doubleclk',
  'doublecl1ck', 'doubleclicks', 'double-clicks', 'doubleclick1', 'doubleclick_',
  'doubleclick-', 'dbleclick', 'dbl-click', 'dblclick', 'dclick', 'd-click',
  'db1eclick', 'doub1eclick', 'dc-work', 'dcwork', 'dc_work', 'doubleclickwork',
  'doubleclick-work', 'doubleclick_work', 'doubleclck', 'double-clck',
  'doub1eck1ick', 'd0ubleclick', 'd0uble-click', 'doubieclick', '2bleclick', 'doubl3click'
];

const STUART_EMAIL = 'stuartr@doubleclick.work';

function isBlacklisted(username) {
  const lower = username.toLowerCase();
  return BLACKLIST.some(term => lower.includes(term));
}

export default function SelfAddBrandModal({ open, onClose, currentUser, onComplete }) {
  const [displayName, setDisplayName] = React.useState("");
  const [usernameKey, setUsernameKey] = React.useState("");
  const [isWorking, setIsWorking] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setDisplayName("");
      setUsernameKey("");
      setIsWorking(false);
      setError("");
    }
  }, [open]);

  const sanitize = (val) => (val || "").trim().toLowerCase();

  const handleCreate = async () => {
    setError("");
    const key = sanitize(usernameKey);
    if (!key) {
      setError("Please enter a username.");
      return;
    }

    // CRITICAL: Check blacklist
    if (isBlacklisted(key) && currentUser?.email !== STUART_EMAIL) {
      toast.error("This username is reserved and cannot be used.", {
        description: "Please choose a different username.",
        duration: 5000
      });
      return;
    }

    setIsWorking(true);
    try {
      // Check duplicate
      const exists = await Username.filter({ user_name: key }).catch(() => []);
      if ((exists || []).length > 0) {
        setError("That username already exists. Please choose a different one.");
        setIsWorking(false);
        return;
      }

      // 1) Create the Username record
      const created = await Username.create({
        user_name: key,
        display_name: displayName || key,
        is_active: true
      });

      // 2) Assign to current user
      const current = Array.isArray(currentUser?.assigned_usernames) ? currentUser.assigned_usernames : [];
      if (!current.includes(key)) {
        await User.updateMyUserData({ assigned_usernames: [...current, key] });
      }

      toast.success("Brand added to your account.");
      onComplete && onComplete();
      onClose && onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to add brand.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose && onClose()}>
      <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogDescription className="text-slate-600">
            Create a brand username and link it to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 text-xs mb-1 block">Display name (optional)</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="bg-white border-slate-300 text-slate-900"
            />
          </div>
          <div>
            <Label className="text-slate-700 text-xs mb-1 block">Username</Label>
            <Input
              value={usernameKey}
              onChange={(e) => setUsernameKey(e.target.value)}
              placeholder="e.g., acme"
              className="bg-white border-slate-300 text-slate-900"
            />
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isWorking || !usernameKey.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isWorking ? "Adding..." : "Add Brand"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
