
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { Username } from "@/api/entities";
import { addTopicKeyword } from "@/api/functions";

export default function AddKeywordDialog({ open, onOpenChange, onAdded }) {
  const [keyword, setKeyword] = React.useState("");
  const [target, setTarget] = React.useState("keyword"); // keyword | faq
  const [usernames, setUsernames] = React.useState([]);
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag("use_workspace_scoping", { defaultEnabled: true });

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      // When workspace scoping is on, lock to global username
      if (useWorkspaceScoping && globalUsername) {
        setUsername(globalUsername);
        setUsernames([globalUsername]);
        return;
      }
      // otherwise, load available usernames for selection
      const list = await Username.list("-created_date").catch(() => []);
      const active = (list || []).filter(u => u.is_active !== false && u.user_name).map(u => u.user_name);
      setUsernames(active);
      if (!username && active.length > 0) setUsername(active[0]);
    })();
  }, [open, useWorkspaceScoping, globalUsername, username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error("Enter a keyword");
      return;
    }
    if (!username) {
      toast.error("Select a username");
      return;
    }
    setLoading(true);
    try {
      const { data } = await addTopicKeyword({ keyword: keyword.trim(), target, username });
      if (data?.success) {
        toast.success(`Added "${keyword.trim()}" to ${target === "faq" ? "FAQs" : "Keyword Map"} for ${username}`);
        setKeyword("");
        onAdded?.();
        onOpenChange(false);
      } else {
        toast.error(data?.error || "Failed to add keyword");
      }
    } catch (err) {
      toast.error("Failed to add keyword");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Keyword</DialogTitle>
          <DialogDescription>Add a keyword/topic to Airtable with the correct username.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Keyword / Topic</Label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., grain-free dog treats" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Destination Table</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword Map</SelectItem>
                  <SelectItem value="faq">FAQs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!useWorkspaceScoping && (
              <div>
                <Label>Username</Label>
                <Select value={username} onValueChange={setUsername}>
                  <SelectTrigger><SelectValue placeholder="Select username" /></SelectTrigger>
                  <SelectContent>
                    {usernames.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {useWorkspaceScoping && (
              <div>
                <Label>Username</Label>
                <Input value={globalUsername || ""} disabled />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Keyword"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
