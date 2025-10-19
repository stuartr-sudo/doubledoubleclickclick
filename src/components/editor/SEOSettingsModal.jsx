
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Search, Tag, Link, Image, Focus, Sparkles, Save, CheckCircle2, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import ImageLibraryModal from "./ImageLibraryModal";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
// import { agentSDK } from "@/agents"; // TODO: Replace with Supabase conversation management
import FeatureHelpIcon from "./FeatureHelpIcon";

export default function SEOSettingsModal({ isOpen, onClose, postData, onSave }) {
  const [metadata, setMetadata] = useState({
    meta_title: "",
    slug: "",
    meta_description: "",
    focus_keyword: "",
    featured_image: "",
    tags: [],
    excerpt: "",
    generated_llm_schema: "",
    export_seo_as_tags: false // Added new state property
  });

  const [autoLoading, setAutoLoading] = useState(false);
  const [genLoading, setGenLoading] = useState({ title: false, desc: false, slug: false, keyword: false, tags: false, image: false, excerpt: false });

  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const autoInitRef = useRef(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  // Helper functions that might be used in effects or handlers
  const articleText = useMemo(() => {
    const html = postData?.content || "";
    return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
  }, [postData?.content]);

  const firstImageFromContent = useCallback(() => {
    const html = postData?.content || "";
    const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] || "";
  }, [postData?.content]);

  const makeSlug = useCallback((str) => String(str || '').
    toLowerCase().
    replace(/[^a-z0-9\s-]/g, '').
    replace(/\s+/g, '-').
    replace(/-+/g, '-').
    replace(/^-|-$/g, ''), []);

  // HOISTED: define handleAutoGenerate before any use (buttons/useEffects)
  const handleAutoGenerate = useCallback(async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setAutoLoading(true);
    try {
      const title = postData?.title || "";
      const html = postData?.content || "";
      const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);

      const res = await InvokeLLM({
        add_context_from_internet: true,
        prompt: `You are an SEO assistant. Based on the article content below, propose SEO fields.\nReturn JSON only.\n\nTitle: ${title}\nContent: """${text}"""\n\nRules:\n- meta_title <= 60 chars\n- meta_description <= 160 chars\n- focus_keyword: 2-4 words\n- tags: 4-8 tags\n- excerpt: 1-2 engaging sentences, max 160 characters, no quotes or emojis.\nJSON keys: meta_title, meta_description, focus_keyword, tags(array of strings), excerpt.`,
        response_json_schema: {
          type: "object",
          properties: {
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            focus_keyword: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            excerpt: { type: "string" }
          },
          required: ["meta_title", "meta_description", "focus_keyword", "tags", "excerpt"]
        }
      });

      if (res) {
        setMetadata((prev) => ({
          ...prev,
          meta_title: res.meta_title || prev.meta_title,
          meta_description: res.meta_description || prev.meta_description,
          focus_keyword: res.focus_keyword || prev.focus_keyword,
          tags: Array.isArray(res.tags) ? res.tags : prev.tags,
          excerpt: res.excerpt || prev.excerpt
        }));
        toast.success("SEO drafted from article.");
      } else {
        toast.error("Failed to get a response for SEO generation.");
      }
    } catch (e) {
      console.error("Error generating SEO:", e);
      toast.error(e?.message || "Failed to generate SEO.");
    } finally {
      setAutoLoading(false);
    }
  }, [consumeTokensForFeature, setAutoLoading, postData, articleText, setMetadata, toast]);


  useEffect(() => {
    if (postData) {
      const firstImg = firstImageFromContent();
      setMetadata({
        meta_title: postData.meta_title || postData.title || "",
        slug: postData.slug || makeSlug(postData.title || "") || "",
        meta_description: postData.meta_description || "",
        focus_keyword: postData.focus_keyword || "",
        featured_image: postData.featured_image || firstImg || "",
        tags: postData.tags || [],
        excerpt: postData.excerpt || postData.meta_description || "",
        generated_llm_schema: postData.generated_llm_schema || "",
        export_seo_as_tags: postData.export_seo_as_tags !== false // Initialize new property
      });
    }
    autoInitRef.current = false;
  }, [postData, isOpen, firstImageFromContent, makeSlug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean);
    setMetadata((prev) => ({ ...prev, tags: tagsArray }));
  };

  const handleSave = () => {
    onSave(metadata);
    toast.success("SEO settings saved successfully!");
    onClose();
  };

  const generateSlug = () => {
    if (postData.title) {
      const newSlug = postData.title.
        toLowerCase().
        replace(/[^a-z0-9\s-]/g, '').
        replace(/\s+/g, '-').
        replace(/-+/g, '-').
        replace(/^-|-$/g, '');
      setMetadata((prev) => ({
        ...prev,
        slug: newSlug
      }));
      toast.success("Slug generated from title!");
    }
  };

  const handleImageSelectForSeo = (image) => {
    if (image?.url) {
      setMetadata((prev) => ({ ...prev, featured_image: image.url }));
      toast.success("Featured image selected!");
    }
    setShowImageLibrary(false);
  };

  useEffect(() => {
    if (!isOpen || autoInitRef.current) return;

    let needsAI = false;
    let next = {};

    const firstImg = firstImageFromContent();
    if (firstImg && !metadata.featured_image) {
      next.featured_image = firstImg;
    }

    if (!metadata.slug && postData?.title) {
      const s = makeSlug(postData.title);
      if (s) next.slug = s;
    }

    if (!metadata.focus_keyword || !metadata.meta_description || !Array.isArray(metadata.tags) || metadata.tags.length === 0 || !metadata.meta_title || !metadata.excerpt) {
      needsAI = true;
    }

    if (Object.keys(next).length > 0) {
      setMetadata((prev) => ({ ...prev, ...next }));
    }

    if (needsAI) {
      // Now handleAutoGenerate is defined via useCallback and available
      handleAutoGenerate();
    }

    autoInitRef.current = true;
  }, [isOpen, metadata.meta_title, metadata.meta_description, metadata.focus_keyword, metadata.tags, metadata.excerpt, metadata.slug, metadata.featured_image, postData?.title, firstImageFromContent, makeSlug, articleText, handleAutoGenerate]);

  const callLLM = async (prompt, schema) => {
    return await InvokeLLM({
      add_context_from_internet: true,
      prompt,
      response_json_schema: schema
    });
  };

  const genTitle = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, title: true }));
    try {
      const fx = (metadata.focus_keyword || "").trim();
      const res = await callLLM(
        `Rewrite the article's title to be highly optimized for SEO while remaining natural and compelling.
Constraints:
- ≤ 60 characters
- Include the focus keyword if provided
- No quotes, no emojis
- Title case
Return JSON { "meta_title": string }.

Focus keyword: ${fx || "(none)"}
Current title: ${postData?.title || metadata.meta_title || ""}
Content (truncated): """${articleText}"""`,
        { type: "object", properties: { meta_title: { type: "string" } }, required: ["meta_title"] }
      );
      if (res?.meta_title) setMetadata((prev) => ({ ...prev, meta_title: res.meta_title }));
      toast.success("Title rewritten for SEO!");
    } catch (e) {
      console.error("Error generating title:", e);
      toast.error("Failed to rewrite title.");
    } finally {
      setGenLoading((s) => ({ ...s, title: false }));
    }
  };

  const genDescription = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, desc: true }));
    try {
      const fx = (metadata.focus_keyword || "").trim();
      const res = await callLLM(
        `Write a compelling SEO meta description (<= 160 chars) with a clear benefit, no quotes, no emojis.
Return JSON { "meta_description": string }.
Focus keyword: ${fx || "(none)"}
Article title: ${postData?.title || ""}
Content: """${articleText}"""`,
        { type: "object", properties: { meta_description: { type: "string" } }, required: ["meta_description"] }
      );
      if (res?.meta_description) setMetadata((prev) => ({ ...prev, meta_description: res.meta_description }));
      toast.success("Meta Description suggested!");
    } catch (e) {
      console.error("Error generating description:", e);
      toast.error("Failed to suggest Meta Description.");
    } finally {
      setGenLoading((s) => ({ ...s, desc: false }));
    }
  };

  const genSlug = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, slug: true }));
    try {
      const res = await callLLM(
        `Create a clean URL slug from the article title/content.
Rules: lowercase, a-z 0-9 and hyphens, trim, no stop-words at ends, <= 6 words.
Return JSON { "slug": string }.
Title: ${postData?.title || ""}
Content: """${articleText.slice(0, 1200)}"""`,
        { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }
      );
      if (res?.slug) setMetadata((prev) => ({ ...prev, slug: res.slug.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") }));
      toast.success("Slug suggested!");
    } catch (e) {
      console.error("Error generating slug:", e);
      toast.error("Failed to suggest Slug.");
    } finally {
      setGenLoading((s) => ({ ...s, slug: false }));
    }
  };

  const genKeyword = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, keyword: true }));
    try {
      const res = await callLLM(
        `Propose one primary focus keyword (2-4 words) that best matches the article below.
Return JSON { "focus_keyword": string } (no quotes in value).
Title: ${postData?.title || ""}
Content: """${articleText}"""`,
        { type: "object", properties: { focus_keyword: { type: "string" } }, required: ["focus_keyword"] }
      );
      if (res?.focus_keyword) setMetadata((prev) => ({ ...prev, focus_keyword: res.focus_keyword }));
      toast.success("Focus Keyword suggested!");
    } catch (e) {
      console.error("Error generating keyword:", e);
      toast.error("Failed to suggest Focus Keyword.");
    } finally {
      setGenLoading((s) => ({ ...s, keyword: false }));
    }
  };

  const genTags = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, tags: true }));
    try {
      const res = await callLLM(
        `Suggest 4-8 SEO tags for the article (short, lowercase, no punctuation).
Return JSON { "tags": string[] }.
Title: ${postData?.title || ""}
Content: """${articleText}"""`,
        { type: "object", properties: { tags: { type: "array", items: { type: "string" } } }, required: ["tags"] }
      );
      if (Array.isArray(res?.tags)) setMetadata((prev) => ({ ...prev, tags: res.tags.map((t) => String(t).trim()).filter(Boolean) }));
      toast.success("Tags suggested!");
    } catch (e) {
      console.error("Error generating tags:", e);
      toast.error("Failed to suggest Tags.");
    } finally {
      setGenLoading((s) => ({ ...s, tags: false }));
    }
  };

  const genFeaturedImage = async () => {
    setGenLoading((s) => ({ ...s, image: true }));
    try {
      const first = firstImageFromContent();
      if (first) {
        setMetadata((prev) => ({ ...prev, featured_image: first }));
        toast.success("Featured image from content!");
        return;
      }
      const res = await callLLM(
        `Create a concise Unsplash search query for a blog cover image matching the article.
Return JSON { "query": string } (no hashtags).
Title: ${postData?.title || ""}
Content: """${articleText.slice(0, 1200)}"""`,
        { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
      );
      const q = encodeURIComponent(res?.query || "");
      if (q) {
        setMetadata((prev) => ({ ...prev, featured_image: `https://source.unsplash.com/featured/?${q}` }));
        toast.success("Featured image suggested!");
      } else {
        toast.error("No Unsplash query generated.");
      }
    } catch (e) {
      console.error("Error generating image:", e);
      toast.error("Failed to suggest Featured Image.");
    } finally {
      setGenLoading((s) => ({ ...s, image: false }));
    }
  };

  const genExcerpt = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setGenLoading((s) => ({ ...s, excerpt: true }));
    try {
      const title = postData?.title || metadata.meta_title || "";
      const text = articleText;
      const res = await InvokeLLM({
        add_context_from_internet: false,
        prompt: `Write a concise, engaging excerpt for the blog article below.
Rules:
- 1–2 sentences
- Max 160 characters
- No quotes, no emojis, no markdown
Return JSON: { "excerpt": string }

Title: ${title}
Content: """${text}"""`,
        response_json_schema: {
          type: "object",
          properties: { excerpt: { type: "string" } },
          required: ["excerpt"]
        }
      });
      if (res?.excerpt) {
        setMetadata((prev) => ({ ...prev, excerpt: res.excerpt }));
        toast.success("Excerpt suggested.");
      } else {
        toast.error("No excerpt returned.");
      }
    } catch (e) {
      console.error("Error generating excerpt:", e);
      toast.error("Failed to suggest Excerpt.");
    } finally {
      setGenLoading((s) => ({ ...s, excerpt: false }));
    }
  };

  const genSchema = async () => {
    const ok = await consumeTokensForFeature('ai_seo');
    if (!ok?.success) return;

    setIsGeneratingSchema(true);
    try {
      const title = postData?.title || metadata.meta_title || "";
      const html = postData?.content || "";
      if (!title || !html) {
        toast.error("Add a title and content before generating schema.");
        return;
      }

      const text = String(html).slice(0, 20000);

      // TODO: Replace agentSDK functionality with Supabase conversation management
      // const conversation = await agentSDK.createConversation({
      //   agent_name: "schema_generator",
      //   metadata: { purpose: "Generate JSON-LD schema for article" }
      // });

      // if (!conversation?.id) {
      //   throw new Error("Could not start conversation with schema_generator agent.");
      // }

      // await agentSDK.addMessage(conversation, {
      //   role: "user",
      //   content: `Generate a valid JSON-LD schema (one JSON object, no code fences) for this blog article. Prefer BlogPosting/Article. Include:
      // - headline (title)
      // - description (use meta_description/excerpt)
      // - author if inferable (string ok, e.g., "${postData?.author_name || "Unknown Author"}")
      // - datePublished (use current date if unknown, e.g., "${new Date().toISOString().split('T')[0]}")
      // - dateModified (current date, e.g., "${new Date().toISOString().split('T')[0]}")
      // - mainEntityOfPage (slug as URL path ok, e.g., "/${metadata.slug}")
      // - image if present (use featured_image if available)
      // - keywords from tags (array)
      // - publisher as Organization if inferable (e.g., "${postData?.site_name || "Your Company"}")
      // Return ONLY a single JSON object.
      //
      // Context:
      // Title: ${title}
      // Slug: ${metadata.slug}
      // Meta description: ${metadata.meta_description || metadata.excerpt}
      // Excerpt: ${metadata.excerpt}
      // Tags: ${(metadata.tags || []).join(", ")}
      // Featured Image: ${metadata.featured_image || ""}
      // HTML (truncated):
      // ${text}`
      // });

      const pollTimeout = 90000;
      const pollInterval = 2000;
      const startTime = Date.now();

      let schemaJson = "";
      let attempts = 0;
      const maxAttempts = Math.ceil(pollTimeout / pollInterval);

      while (Date.now() - startTime < pollTimeout && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        // const updatedConversation = await agentSDK.getConversation(conversation.id);
        // const lastMessage = updatedConversation?.messages?.[updatedConversation.messages.length - 1];

        // if (lastMessage?.role === 'assistant' && (lastMessage.is_complete === true || (lastMessage.content && lastMessage.content.length > 10))) {
          let contentStr = lastMessage.content || "";

          contentStr = contentStr.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
          contentStr = contentStr.trim();

          if (contentStr && contentStr.length > 10) {
            schemaJson = contentStr;
            break;
          }
        }
      }

        // if (!schemaJson || schemaJson.length < 10) {
        //   toast.error("Agent didn't return a valid schema. Please try again.");
        //   return;
        // }

      // TODO: Replace agentSDK functionality with Supabase conversation management
      toast.error("Schema generation is temporarily disabled during migration.");
    } catch (e) {
      console.error("Schema generation failed:", e);
      toast.error(e?.message || "Failed to generate schema.");
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white p-0 flex flex-col max-h-[90vh] w-full max-w-4xl rounded-lg shadow-2xl fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border border-gray-200 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-200 flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-2xl text-slate-900">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              SEO & Post Settings
              <FeatureHelpIcon
                featureFlagName="seo"
                label="SEO"
                description="Configure meta title, description, slug, tags, excerpt, and JSON-LD. Click to watch a short tutorial."
                className="ml-1"
              />
              <div className="ml-auto flex gap-2">
                <Button onClick={handleAutoGenerate} disabled={autoLoading} className="bg-gray-600 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-emerald-700">
                  {autoLoading ? "Generating..." : "Auto-generate SEO"}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-lg">
              <strong>SEO</strong> controls title, description, slug, tags, excerpt, and JSON-LD schema for search engines.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meta Title */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <Label htmlFor="meta-title" className="font-semibold text-slate-800">Meta Title</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={genTitle}
                    disabled={genLoading.title}
                    className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.title ? "..." : "Suggest"}
                  </Button>
                </div>
                <Input
                  id="meta-title"
                  name="meta_title"
                  value={metadata.meta_title}
                  onChange={handleChange}
                  placeholder="Your SEO-optimized title for search results" className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white" />

                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>This appears as the clickable title in Google</span>
                  <span className={metadata.meta_title.length > 60 ? "text-red-500 font-medium" : ""}>
                    {metadata.meta_title.length}/60
                  </span>
                </div>
              </div>

              {/* Featured Image URL */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-pink-600" />
                    <Label htmlFor="featured-image" className="font-semibold text-slate-800">Featured Image URL</Label>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setShowImageLibrary(true)}>
                    <Image className="w-3.5 h-3.5 mr-1" /> Import
                  </Button>
                </div>
                <Input
                  id="featured-image"
                  name="featured_image"
                  placeholder="Auto-detected from first image in content or manually enter"
                  value={metadata.featured_image || ''}
                  onChange={handleChange} className="bg-white text-slate-800 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />


                {metadata.featured_image &&
                  <div className="mt-3">
                    <img
                      src={metadata.featured_image}
                      alt="Featured image preview"
                      className="rounded-md max-h-32 w-auto object-cover border border-slate-200"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                }
                <p className="text-xs text-slate-500 mt-2">Shows when shared on social media</p>
              </div>

              {/* URL Slug */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-green-600" />
                    <Label htmlFor="slug" className="font-semibold text-slate-800">URL Slug</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={genSlug}
                      disabled={genLoading.slug}
                      className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.slug ? "..." : "Suggest"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSlug}
                      className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                      Generate
                    </Button>
                  </div>
                </div>
                <Input
                  id="slug"
                  name="slug"
                  value={metadata.slug}
                  onChange={handleChange}
                  placeholder="your-post-url" className="bg-white text-slate-600 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

                <p className="text-xs text-slate-500 mt-2">Creates a clean, shareable URL</p>
              </div>

              {/* Focus Keyword */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Focus className="w-4 h-4 text-orange-600" />
                    <Label htmlFor="focus-keyword" className="font-semibold text-slate-800">Focus Keyword</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={genKeyword}
                    disabled={genLoading.keyword}
                    className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.keyword ? "..." : "Suggest"}
                  </Button>
                </div>
                <Input
                  id="focus-keyword"
                  name="focus_keyword"
                  value={metadata.focus_keyword}
                  onChange={handleChange}
                  placeholder="e.g., 'content marketing strategies'" className="bg-white text-slate-700 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

                <p className="text-xs text-slate-500 mt-2">Main keyword you want to rank for</p>
              </div>

              {/* Meta Description */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <Label htmlFor="meta-description" className="font-semibold text-slate-800">Meta Description</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={genDescription}
                    disabled={genLoading.desc}
                    className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.desc ? "..." : "Suggest"}
                  </Button>
                </div>
                <Textarea
                  id="meta-description"
                  name="meta_description"
                  value={metadata.meta_description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a compelling summary that encourages clicks from search results..." className="bg-white text-slate-700 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />

                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>This appears under your title in search results</span>
                  <span className={metadata.meta_description.length > 160 ? "text-red-500 font-medium" : ""}>
                    {metadata.meta_description.length}/160
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-teal-600" />
                    <Label htmlFor="tags" className="font-semibold text-slate-800">Tags</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={genTags}
                    disabled={genLoading.tags}
                    className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.tags ? "..." : "Suggest"}
                  </Button>
                </div>
                <Input
                  id="tags"
                  name="tags"
                  value={metadata.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="marketing, SEO, content, writing" className="bg-white text-slate-700 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

                <p className="text-xs text-slate-500 mt-2">Comma-separated tags for organization</p>
              </div>

              {/* Excerpt */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="excerpt" className="font-semibold text-slate-800">Excerpt</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={genExcerpt}
                    disabled={genLoading.excerpt}
                    className="h-8 px-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Generate excerpt with AI">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> {genLoading.excerpt ? "..." : "AI Suggest"}
                  </Button>
                </div>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={metadata.excerpt}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  placeholder="Short summary shown as excerpt. Defaults to Meta description." className="bg-white text-slate-700 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />

                <p className="text-xs text-slate-500 mt-2">Will be used when publishing (e.g., Shopify excerpt).</p>
              </div>

              {/* Export SEO as Tags Toggle - NEW SECTION */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold text-slate-800">Export SEO Metadata as Shopify Tags</Label>
                    <p className="text-xs text-slate-500 mt-1">
                      When enabled, meta_title, meta_description, and focus_keyword will be added as tags when publishing to Shopify
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={metadata.export_seo_as_tags}
                    onChange={(e) => setMetadata((prev) => ({ ...prev, export_seo_as_tags: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* JSON-LD Schema editor */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 col-span-1 md:col-span-2">
                <Label htmlFor="schema" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                  JSON-LD Schema
                </Label>
                <Textarea
                  id="schema"
                  name="schema"
                  value={metadata.generated_llm_schema}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, generated_llm_schema: e.target.value }))}
                  rows={8}
                  placeholder='Paste or generate a JSON object. It will be embedded as <script type="application/ld+json"> on publish.'
                  className="font-mono text-sm bg-slate-100 border-slate-300 text-slate-800" />
                <div className="flex justify-end mt-2">
                  <Button variant="outline" onClick={genSchema} disabled={isGeneratingSchema} className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
                    {isGeneratingSchema ? "Generating Schema..." : "Generate Schema"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
          <DialogFooter className="p-6 flex justify-between border-t border-slate-200 flex-shrink-0">
            <div className="text-xs text-slate-500 self-center">
              {autoInitRef.current &&
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />SEO drafted from article.</span>
              }
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50 px-6 py-3">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-900 text-slate-50 px-6 py-3 text-sm font-medium [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                Save SEO Settings
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLibraryModal
        isOpen={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        onInsert={handleImageSelectForSeo}
        usernameFilter={postData?.user_name} />

    </>
  );

}
