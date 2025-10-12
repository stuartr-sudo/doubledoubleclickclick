
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Link as LinkIcon, Copy, Check, DollarSign, AtSign, User as UserIcon } from "lucide-react";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { createBrandPaymentLink } from "@/api/functions";
import { SendEmail } from "@/api/integrations";
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

export default function AddBrandModal({ open, onClose, users = [], existingUsernames = [], onComplete }) {
  const [step, setStep] = React.useState("form"); // form | result
  const [isWorking, setIsWorking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [assignUserId, setAssignUserId] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [usernameKey, setUsernameKey] = React.useState("");
  const [amount, setAmount] = React.useState(99);
  const [currency, setCurrency] = React.useState("usd");

  const [resultLink, setResultLink] = React.useState("");
  const [resultUsernameId, setResultUsernameId] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setStep("form");
      setIsWorking(false);
      setCopied(false);
      setAssignUserId("");
      setDisplayName("");
      setUsernameKey("");
      setAmount(99);
      setCurrency("usd");
      setResultLink("");
      setResultUsernameId("");
    }
  }, [open]);

  // Notify parent when a link is generated (non-breaking: parent may omit onComplete)
  React.useEffect(() => {
    if (!open) return;
    if (resultLink) {
      onComplete && onComplete({
        link: resultLink,
        usernameId: resultUsernameId,
        usernameKey,
        assignedUserId: assignUserId,
        amount,
        currency
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultLink, open]);

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a,b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
  }, [users]);

  const usernameExists = (key) => {
    const k = (key || "").trim().toLowerCase();
    return existingUsernames.some(u => (u.user_name || "").toLowerCase() === k);
  };

  const handleCreate = async () => {
    const key = (usernameKey || "").trim();
    if (!assignUserId) { toast.error("Select a user to assign."); return; }
    if (!key) { toast.error("Enter a username key."); return; }
    if (usernameExists(key)) { toast.error("That username already exists."); return; }

    // CRITICAL: Check blacklist
    const assignedUser = sortedUsers.find(u => u.id === assignUserId);
    if (isBlacklisted(key) && assignedUser?.email !== STUART_EMAIL) {
      toast.error("This username is reserved and cannot be used.", {
        description: "Please choose a different username.",
        duration: 5000
      });
      return;
    }

    setIsWorking(true);
    try {
      // 1) Create username
      const created = await Username.create({
        user_name: key,
        display_name: displayName || undefined,
        is_active: true
      });
      setResultUsernameId(created.id);

      // 2) Assign to user
      const user = sortedUsers.find(u => u.id === assignUserId);
      const current = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
      if (!current.includes(key)) {
        await User.update(user.id, { assigned_usernames: [...current, key] });
      }

      // 3) Create payment link
      const { data } = await createBrandPaymentLink({
        amount,
        currency,
        brand_name: displayName || key,
        username_key: key,
        assigned_user_email: user?.email || ""
      });

      const url = data?.url || "";
      if (!url) {
        toast.error("Payment link creation failed.");
        return;
      }
      setResultLink(url);
      setStep("result");
      toast.success("Brand created and payment link generated.");
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to create brand.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!resultLink) return;
    await navigator.clipboard.writeText(resultLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSendEmail = async () => {
    const user = sortedUsers.find(u => u.id === assignUserId);
    if (!user?.email || !resultLink) { toast.error("Missing user email or link."); return; }
    const brandLabel = displayName || usernameKey;
    const subject = `Your SEWO brand setup link: ${brandLabel}`;
    const body = `Hi ${user.full_name || ""},

You've been invited to set up the brand "${brandLabel}" in SEWO.

Please complete payment using the secure link below:
${resultLink}

After payment, you'll be redirected back to SEWO to finish onboarding.

Thanks!`;
    await SendEmail({ to: user.email, subject, body });
    toast.success("Email sent.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Add Another Brand</DialogTitle>
          <DialogDescription className="text-slate-600">Create a brand username, assign a user, and generate a payment link.</DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 text-xs mb-1 block">Assign to user</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {sortedUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-600" />
                        <span>{u.full_name || u.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700 text-xs mb-1 block">Display name (optional)</Label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 bg-white border-slate-300 text-slate-900"
                    placeholder="e.g., Acme Corp"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-700 text-xs mb-1 block">Username key</Label>
                <Input
                  className="bg-white border-slate-300 text-slate-900"
                  placeholder="e.g., acme"
                  value={usernameKey}
                  onChange={(e) => setUsernameKey(e.target.value.trim())}
                />
                {usernameKey && usernameExists(usernameKey) && (
                  <div className="text-xs text-red-500 mt-1">This username already exists.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[120px,1fr] gap-3">
              <div>
                <Label className="text-slate-700 text-xs mb-1 block">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                    <SelectItem value="cad">CAD</SelectItem>
                    <SelectItem value="aud">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 text-xs mb-1 block">Amount</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    className="pl-9 bg-white border-slate-300 text-slate-900"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value || 0))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="bg-white border-slate-300 text-slate-900" onClick={onClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isWorking || usernameExists(usernameKey) || !assignUserId || !usernameKey} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isWorking ? "Creating..." : "Create & Generate Link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-slate-600 text-sm mb-1">Payment link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate text-slate-800">{resultLink}</div>
                <Button variant="outline" className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={resultLink} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">
                    <LinkIcon className="w-4 h-4 mr-2" /> Open
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="bg-white border-slate-300 text-slate-900" onClick={onClose}>Done</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendEmail}>
                <Send className="w-4 h-4 mr-2" /> Send to user
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
