
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IntegrationCredential } from "@/api/entities";
import { publishToShopifyEnhanced } from "@/api/functions";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function ShopifyPublishModal({
  isOpen,
  onClose,
  username,
  title,
  html,
  defaultCredentialId,
  excerpt,           // already derived from meta description
  slug,              // derived or generated
  tags,              // auto-populated (array)
  metaDescription,   // SEO meta description
  featuredImageUrl
}) {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState("");
  const [status, setStatus] = useState("active");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      if (!username) { setCredentials([]); setSelectedCredential(""); return; }
      const creds = await IntegrationCredential.filter({ provider: "shopify", user_name: username });
      setCredentials(creds || []);
      if (defaultCredentialId && (creds || []).some(c => c.id === defaultCredentialId)) {
        setSelectedCredential(defaultCredentialId);
      } else if ((creds || []).length) {
        setSelectedCredential(creds[0].id);
      } else {
        setSelectedCredential("");
      }
    })();
  }, [isOpen, username, defaultCredentialId]);

  const handlePublish = async () => {
    if (!selectedCredential) {
      toast.error("Select a Shopify connection.");
      return;
    }
    setIsPublishing(true);
    try {
      const { data } = await publishToShopifyEnhanced({
        credentialId: selectedCredential,
        title,
        html,
        status,
        excerpt,
        slug,
        tags,
        meta_description: metaDescription,
        featured_image_url: featuredImageUrl,
        // NEW: ensure Shopify author is the brand username
        author: username || undefined
      });

      if (data?.success) {
        toast.success("Published to Shopify");
        onClose();
      } else {
        toast.error(data?.error || "Shopify publish failed");
      }
    } catch (e) {
      toast.error("Error publishing to Shopify");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Publish to Shopify</DialogTitle>
          <DialogDescription className="text-white/70">
            Confirm and publish this article to your Shopify store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="shopify-connection" className="text-white">Shopify Connection</Label>
            <Select value={selectedCredential} onValueChange={setSelectedCredential}>
              <SelectTrigger id="shopify-connection" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50">
                <SelectValue placeholder="Select a connection..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50">
                {(credentials || []).map((c) => (
                  <SelectItem key={c.id} value={c.id} className="dark:text-slate-50">
                    {c.name} ({c.site_domain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="shopify-status" className="text-white">Post Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="shopify-status" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50">
                <SelectItem value="active">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="dark:text-white dark:border-slate-600 dark:hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing || !selectedCredential} className="dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
            {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : <>Publish Now <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
