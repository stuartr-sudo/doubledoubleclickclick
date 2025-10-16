import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IntegrationCredential } from "@/api/entities";
import { publishToShopifyEnhanced } from "@/api/functions";
import { Loader2, ArrowRight, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageLibraryModal from "./ImageLibraryModal";

export default function ShopifyPublishModal({
  isOpen,
  onClose,
  username,
  title,
  html,
  defaultCredentialId,
  excerpt,
  slug,
  tags,
  metaDescription,
  featuredImageUrl: initialFeaturedImageUrl
}) {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState("");
  const [status, setStatus] = useState("active");
  const [isPublishing, setIsPublishing] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      if (!username) {setCredentials([]);setSelectedCredential("");return;}
      const creds = await IntegrationCredential.filter({ provider: "shopify", user_name: username });
      setCredentials(creds || []);
      if (defaultCredentialId && (creds || []).some((c) => c.id === defaultCredentialId)) {
        setSelectedCredential(defaultCredentialId);
      } else if ((creds || []).length) {
        setSelectedCredential(creds[0].id);
      } else {
        setSelectedCredential("");
      }
    })();
  }, [isOpen, username, defaultCredentialId]);

  useEffect(() => {
    if (isOpen && initialFeaturedImageUrl) {
      setFeaturedImageUrl(initialFeaturedImageUrl);
    }
  }, [isOpen, initialFeaturedImageUrl]);

  const handlePublish = async () => {
    if (!selectedCredential) {
      toast.error("Select a Shopify connection.");
      return;
    }
    sessionStorage.setItem('dcPublishing', '1');

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
        featured_image_url: featuredImageUrl || undefined,
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
      sessionStorage.removeItem('dcPublishing');
    }
  };

  const handleImageSelect = (image) => {
    if (image?.url) {
      setFeaturedImageUrl(image.url);
      toast.success("Featured image selected");
    }
    setShowImageLibrary(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="b44-modal max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Publish to Shopify</DialogTitle>
            <DialogDescription className="text-slate-600">
              Confirm and publish this article to your Shopify store.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="shopify-connection" className="text-slate-900">Shopify Connection</Label>
              <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                <SelectTrigger
                  id="shopify-connection"
                  className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  <SelectValue placeholder="Select a connection..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
                  {(credentials || []).map((c) =>
                  <SelectItem key={c.id} value={c.id} className="text-slate-900 hover:bg-slate-50">
                      {c.name} ({c.site_domain})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shopify-status" className="text-slate-900">Post Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  id="shopify-status"
                  className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
                  <SelectItem value="active" className="text-slate-900 hover:bg-slate-50">Published</SelectItem>
                  <SelectItem value="hidden" className="text-slate-900 hover:bg-slate-50">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="featured-image" className="text-slate-900">Featured Image (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="featured-image"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://... or select from library"
                  className="bg-white border border-slate-300 text-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageLibrary(true)}
                  className="bg-white border border-slate-300"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {featuredImageUrl && (
                <div className="mt-2">
                  <img
                    src={featuredImageUrl}
                    alt="Featured image preview"
                    className="max-h-32 w-auto rounded border border-slate-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !selectedCredential}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : <>Publish Now <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLibraryModal
        isOpen={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        onInsert={handleImageSelect}
        usernameFilter={username}
      />
    </>
  );
}