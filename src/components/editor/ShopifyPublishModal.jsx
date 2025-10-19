import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageLibraryModal from "./ImageLibraryModal";
import { useCredentials } from "@/components/providers/CredentialsProvider";

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
  const [selectedCredential, setSelectedCredential] = useState("");
  const [status, setStatus] = useState("active");
  const [isPublishing, setIsPublishing] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);

  const { credentials: allCredentials, loadCredentials, getCredentialsByProvider } = useCredentials();

  const credentials = React.useMemo(() => {
    if (!username) return [];
    return getCredentialsByProvider('shopify').filter((c) => c.user_name === username);
  }, [allCredentials, username, getCredentialsByProvider]);

  // Load current post to get SEO metadata
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('post');

      if (postId) {
        try {
          const posts = await base44.entities.BlogPost.filter({ id: postId });
          if (posts && posts.length > 0) {
            setCurrentPost(posts[0]);
          }
        } catch (err) {
          console.error('Failed to load post:', err);
        }
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    console.log('ShopifyPublishModal - Loading credentials:', {
      username,
      defaultCredentialId,
      credentialsCount: credentials.length
    });

    loadCredentials(); // Load from cache

    // Auto-select credential
    if (defaultCredentialId && credentials.some((c) => c.id === defaultCredentialId)) {
      console.log('Setting credential from defaultCredentialId:', defaultCredentialId);
      setSelectedCredential(defaultCredentialId);
    } else if (credentials.length === 1) {
      // If there's exactly one credential, auto-select it
      console.log('Auto-selecting single credential:', credentials[0].id);
      setSelectedCredential(credentials[0].id);
    } else if (credentials.length > 1) {
      // Multiple credentials but no default - select first one
      console.log('Multiple credentials, selecting first:', credentials[0].id);
      setSelectedCredential(credentials[0].id);
    } else {
      console.log('No credentials available');
      setSelectedCredential("");
    }
  }, [isOpen, username, defaultCredentialId, credentials, loadCredentials]);

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

    if (!title || !title.trim()) {
      toast.error("Title is required for publishing");
      return;
    }

    console.log('Publishing to Shopify with:', {
      credentialId: selectedCredential,
      title: title.substring(0, 50),
      status,
      hasSeoMetadata: Boolean(currentPost?.meta_title || currentPost?.meta_description),
      exportSeoAsTags: currentPost?.export_seo_as_tags
    });

    setIsPublishing(true);
    try {
      const { data } = await base44.functions.invoke('publishToShopifyEnhanced', {
        credentialId: selectedCredential,
        title: title.trim(),
        html: html,
        status: status,
        excerpt: excerpt,
        slug: slug,
        tags: tags,
        meta_description: metaDescription || currentPost?.meta_description,
        meta_title: currentPost?.meta_title,
        focus_keyword: currentPost?.focus_keyword,
        export_seo_as_tags: currentPost?.export_seo_as_tags !== false,
        featured_image_url: featuredImageUrl || undefined,
        author: username || undefined,
        generated_llm_schema: currentPost?.generated_llm_schema
      });

      if (data?.success) {
        toast.success(`Published to Shopify${data.tags_added ? ` (${data.tags_added} tags)` : ''}`);
        onClose();
      } else {
        console.error('Shopify publish failed:', data);

        let errorMessage = data?.error || "Shopify publish failed";
        if (data?.details) {
          try {
            const details = JSON.parse(data.details);
            if (details.errors) {
              errorMessage += `: ${JSON.stringify(details.errors)}`;
            }
          } catch (e) {
            errorMessage += `: ${data.details}`;
          }
        }

        toast.error(errorMessage, { duration: 10000 });
      }
    } catch (e) {
      console.error("Shopify publish error:", e);

      let errorMsg = "Error publishing to Shopify";
      if (e?.response?.data?.error) {
        errorMsg = e.response.data.error;
        if (e.response.data.details) {
          errorMsg += ` - ${e.response.data.details}`;
        }
      } else if (e?.message) {
        errorMsg = e.message;
      }

      toast.error(errorMsg, { duration: 10000 });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageSelect = (image) => {
    if (image?.url) {
      setFeaturedImageUrl(image.url);
      toast.success("Featured image selected");
    }
    setShowImageLibrary(false);
  };

  // Determine if we should show the connection selector
  const showConnectionSelector = !defaultCredentialId && credentials.length > 1;

  // CRITICAL FIX: Button should be enabled if we have a selected credential AND a title
  const canPublish = Boolean(selectedCredential && title && title.trim());

  console.log('ShopifyPublishModal render:', {
    selectedCredential,
    credentialsCount: credentials.length,
    showConnectionSelector,
    canPublish,
    isPublishing
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="b44-modal max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Publish to Shopify</DialogTitle>
            <DialogDescription className="text-slate-600">
              Confirm and publish this article to your Shopify store.
              {currentPost?.export_seo_as_tags &&
              <div className="mt-2 text-xs text-blue-600">
                  ✓ SEO metadata will be exported as tags
                </div>
              }
              {currentPost?.generated_llm_schema &&
              <div className="mt-1 text-xs text-green-600">
                  ✓ JSON-LD schema will be included
                </div>
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Only show connection selector if no default credential and multiple options */}
            {showConnectionSelector &&
            <div>
                <Label htmlFor="shopify-connection" className="text-slate-900">Shopify Connection</Label>
                <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                  <SelectTrigger
                  id="shopify-connection"
                  className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">

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
            }

            <div>
              <Label htmlFor="shopify-status" className="text-slate-900">Post Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  id="shopify-status"
                  className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">

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
                  className="bg-white border border-slate-300 text-slate-900" />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageLibrary(true)}
                  className="bg-white border border-slate-300">

                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {featuredImageUrl &&
              <div className="mt-2">
                  <img
                  src={featuredImageUrl}
                  alt="Featured image preview"
                  className="max-h-32 w-auto rounded border border-slate-200"
                  onError={(e) => {e.target.style.display = 'none';}} />

                </div>
              }
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">

              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!canPublish || isPublishing} className="bg-blue-900 text-slate-100 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">


              {isPublishing ?
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing…
                </> :

              <>
                  Publish Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLibraryModal
        isOpen={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        onInsert={handleImageSelect}
        usernameFilter={username} />

    </>);

}