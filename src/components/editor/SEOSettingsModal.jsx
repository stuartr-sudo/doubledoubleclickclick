
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Search, Tag, Link, Image, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";

export default function SEOSettingsModal({ isOpen, onClose, postData, onSave }) {
  const [metadata, setMetadata] = useState({
    meta_title: "",
    slug: "",
    meta_description: "",
    focus_keyword: "",
    featured_image: "",
    tags: [],
    // NEW
    excerpt: "",
    generated_llm_schema: ""
  });

  const [autoLoading, setAutoLoading] = useState(false);
  const [genLoading, setGenLoading] = useState({ title: false, desc: false, slug: false, keyword: false, tags: false, image: false, excerpt: false });

  // NEW: track one-time auto-init
  const autoInitRef = React.useRef(false);

  useEffect(() => {
    if (postData) {
      setMetadata({
        meta_title: postData.meta_title || "",
        slug: postData.slug || "",
        meta_description: postData.meta_description || "",
        focus_keyword: postData.focus_keyword || "",
        featured_image: postData.featured_image || "",
        tags: postData.tags || [],
        // NEW
        excerpt: postData.excerpt || postData.meta_description || "",
        generated_llm_schema: postData.generated_llm_schema || ""
      });
    }
  }, [postData, isOpen]);

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

  // NEW: helpers
  const articleText = (() => {
    const html = postData?.content || "";
    return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
  })();

  const firstImageFromContent = () => {
    const html = postData?.content || "";
    const m = String(html).match(/<img[^>]*src=["']([^"']+)["']/i);
    return m?.[1] || "";
  };

  // NEW: canonical helpers (only makeSlug is kept, others removed as canonical_url is no longer managed by modal)
  const makeSlug = (str) => String(str || '').
  toLowerCase().
  replace(/[^a-z0-9\s-]/g, '').
  replace(/\s+/g, '-').
  replace(/-+/g, '-').
  replace(/^-|-$/g, '');

  // NEW: one-time auto-initialize when the modal opens
  useEffect(() => {
    if (!isOpen || autoInitRef.current) return;

    let needsAI = false;
    let next = {};

    // 1) Featured image from first <img> in content
    const firstImg = firstImageFromContent();
    if (firstImg && !metadata.featured_image) {
      next.featured_image = firstImg;
    }

    // 2) Slug from title if empty
    if (!metadata.slug && postData?.title) {
      const s = makeSlug(postData.title);
      if (s) next.slug = s;
    }

    // 4) Decide if we need AI for missing fields
    if (!metadata.focus_keyword || !metadata.meta_description || !Array.isArray(metadata.tags) || metadata.tags.length === 0 || !metadata.meta_title || !metadata.excerpt) {
      needsAI = true;
    }

    if (Object.keys(next).length > 0) {
      setMetadata((prev) => ({ ...prev, ...next }));
    }

    if (needsAI) {
      // run aggregated AI generation (title, description, focus_keyword, tags)
      handleAutoGenerate();
    }

    autoInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);


  const callLLM = async (prompt, schema) => {
    return await InvokeLLM({
      add_context_from_internet: true,
      prompt,
      response_json_schema: schema
    });
  };

  // NEW: field-specific generators
  const genTitle = async () => {
    setGenLoading((s) => ({ ...s, title: true }));
    try {
      const fx = (metadata.focus_keyword || "").trim();
      const res = await callLLM(
        `Write a world-class SEO meta title (<= 60 chars) for the article below.
Return JSON { "meta_title": string }. Include the focus keyword if provided, front-load value, avoid clickbait, use title case.
Focus keyword: ${fx || "(none)"}
Article title: ${postData?.title || ""}
Content: """${articleText}"""`,
        { type: "object", properties: { meta_title: { type: "string" } }, required: ["meta_title"] }
      );
      if (res?.meta_title) setMetadata((prev) => ({ ...prev, meta_title: res.meta_title }));
      toast.success("Meta Title suggested!");
    } catch (e) {
      console.error("Error generating title:", e);
      toast.error("Failed to suggest Meta Title.");
    } finally {
      setGenLoading((s) => ({ ...s, title: false }));
    }
  };

  const genDescription = async () => {
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
        // Use Unsplash on-the-fly featured endpoint to return a relevant image
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

  // NEW: generate excerpt from article content
  const genExcerpt = async () => {
    setGenLoading((s) => ({ ...s, excerpt: true }));
    try {
      const title = postData?.title || metadata.meta_title || "";
      const text = articleText; // already built from content
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


  // NEW: Auto-generate SEO fields using Perplexity via InvokeLLM
  const handleAutoGenerate = async () => {
    setAutoLoading(true);
    try {
      const title = postData?.title || "";
      const html = postData?.content || "";
      // Strip HTML tags and limit content length for prompt
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
          tags: Array.isArray(res.tags) ? res.tags : prev.tags, // Ensure tags is an array
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
  };

  // NEW: Generate JSON-LD Schema based on current content and SEO fields
  const genSchema = async () => {
    try {
      const title = postData?.title || metadata.meta_title || "";
      const html = postData?.content || "";
      if (!title || !html) {
        toast.error("Add a title and content before generating schema.");
        return;
      }

      // Limit content length to keep prompt manageable
      const text = String(html).slice(0, 20000);

      const result = await InvokeLLM({
        add_context_from_internet: false,
        prompt: `Generate a valid JSON-LD schema (one JSON object, no code fences) for this blog article. Prefer BlogPosting/Article. Include:
- headline (title)
- description (use meta_description/excerpt)
- author if inferable (string ok)
- datePublished (use current date if unknown)
- dateModified (current date)
- mainEntityOfPage (slug as URL path ok)
- image if present (use featured_image if available)
- keywords from tags (array)
- publisher as Organization if inferable
Return ONLY a single JSON object.

Context:
Title: ${title}
Slug: ${metadata.slug}
Meta description: ${metadata.meta_description || metadata.excerpt}
Excerpt: ${metadata.excerpt}
Tags: ${(metadata.tags || []).join(", ")}
Featured Image: ${metadata.featured_image || ""}
HTML (truncated):
${text}`,
        response_json_schema: {
          type: "object",
          additionalProperties: true
        }
      });

      const schemaObj = result || {};
      const schemaStr = JSON.stringify(schemaObj, null, 2);
      setMetadata((prev) => ({ ...prev, generated_llm_schema: schemaStr }));
      toast.success("Schema generated.");
    } catch (e) {
      console.error("Schema generation failed:", e);
      toast.error("Failed to generate schema.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-4xl bg-white text-slate-900 border-slate-200">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl text-slate-900">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            SEO & Post Settings
            <div className="ml-auto flex gap-2">
              <Button onClick={handleAutoGenerate} disabled={autoLoading} className="bg-purple-950 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-emerald-700">
                {autoLoading ? "Generating..." : "Auto-generate SEO"}
              </Button>
              <Button onClick={genSchema} variant="outline" className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
                Generate Schema
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-lg">
            <strong>SEO</strong> controls title, description, slug, tags, excerpt, and JSON-LD schema for search engines.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 max-h-[60vh] overflow-y-auto px-1">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="meta_title" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Search className="w-4 h-4 text-blue-500" />
                Meta Title
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genTitle}
                disabled={genLoading.title}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.title ? "..." : "Suggest"}
              </Button>
              <Input
                id="meta_title"
                name="meta_title"
                value={metadata.meta_title}
                onChange={handleChange}
                placeholder="Your SEO-optimized title for search results"
                className="bg-white border-slate-300 text-base h-12 placeholder:text-slate-500" />

              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-600">This appears as the clickable title in Google</p>
                <Badge variant={metadata.meta_title.length <= 60 ? "default" : "destructive"} className="text-xs bg-slate-200 text-slate-800">
                  {metadata.meta_title.length}/60
                </Badge>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="slug" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Link className="w-4 h-4 text-green-500" />
                URL Slug
              </Label>
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={genSlug}
                  disabled={genLoading.slug}
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                  <Sparkles className="w-4 h-4 mr-1" /> {genLoading.slug ? "..." : "Suggest"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  name="slug"
                  value={metadata.slug}
                  onChange={handleChange}
                  placeholder="your-post-url"
                  className="bg-white border-slate-300 text-base h-12 flex-1 placeholder:text-slate-500" />

                <Button
                  variant="outline"
                  onClick={generateSlug}
                  className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50 px-4">

                  Generate
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">Creates a clean, shareable URL</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="meta_description" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Search className="w-4 h-4 text-purple-500" />
                Meta Description
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genDescription}
                disabled={genLoading.desc}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.desc ? "..." : "Suggest"}
              </Button>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={metadata.meta_description}
                onChange={handleChange}
                rows={4}
                placeholder="Write a compelling summary that encourages clicks from search results..."
                className="bg-white border-slate-300 text-base placeholder:text-slate-500" />

              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-600">This appears under your title in Google search</p>
                <Badge variant={metadata.meta_description.length <= 160 ? "default" : "destructive"} className="text-xs bg-slate-200 text-slate-800">
                  {metadata.meta_description.length}/160
                </Badge>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="excerpt" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                Excerpt
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genExcerpt}
                disabled={genLoading.excerpt}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                title="Generate excerpt with AI">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.excerpt ? "..." : "AI Suggest"}
              </Button>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={metadata.excerpt}
                onChange={(e) => setMetadata((prev) => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                placeholder="Short summary shown as excerpt. Defaults to Meta description."
                className="bg-white border-slate-300 text-base placeholder:text-slate-500" />

              <p className="text-xs text-slate-600 mt-2">Will be used when publishing (e.g., Shopify excerpt).</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="featured_image" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Image className="w-4 h-4 text-pink-500" />
                Featured Image URL
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genFeaturedImage}
                disabled={genLoading.image}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.image ? "..." : "Suggest"}
              </Button>
              <Input
                id="featured_image"
                name="featured_image"
                value={metadata.featured_image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="bg-white border-slate-300 text-base h-12 placeholder:text-slate-500" />

              {metadata.featured_image &&
              <div className="mt-3">
                  <img
                  src={metadata.featured_image}
                  alt="Featured image preview"
                  className="rounded-md max-h-32 w-auto object-cover border border-slate-200"
                  onError={(e) => {e.target.style.display = 'none';}} />

                </div>
              }
              <p className="text-xs text-slate-600 mt-2">Shows when shared on social media</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="focus_keyword" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Target className="w-4 h-4 text-yellow-500" />
                Focus Keyword
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genKeyword}
                disabled={genLoading.keyword}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.keyword ? "..." : "Suggest"}
              </Button>
              <Input
                id="focus_keyword"
                name="focus_keyword"
                value={metadata.focus_keyword}
                onChange={handleChange}
                placeholder="e.g., 'content marketing strategies'"
                className="bg-white border-slate-300 text-base h-12 placeholder:text-slate-500" />

              <p className="text-xs text-slate-600 mt-2">Main keyword you want to rank for</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative">
              <Label htmlFor="tags" className="flex items-center gap-2 text-base font-semibold mb-3 text-slate-800">
                <Tag className="w-4 h-4 text-cyan-500" />
                Tags
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={genTags}
                disabled={genLoading.tags}
                className="absolute top-3 right-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                <Sparkles className="w-4 h-4 mr-1" /> {genLoading.tags ? "..." : "Suggest"}
              </Button>
              <Input
                id="tags"
                name="tags"
                value={metadata.tags.join(', ')}
                onChange={handleTagsChange}
                placeholder="marketing, SEO, content, writing"
                className="bg-white border-slate-300 text-base h-12 placeholder:text-slate-500" />

              <p className="text-xs text-slate-600 mt-2">Separate with commas</p>
            </div>

            {/* Removed canonical URL section as per outline */}

            {/* NEW: JSON-LD Schema editor */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
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
                <Button variant="outline" onClick={genSchema} className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
                  Generate Schema
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50 px-6 py-3">

            Cancel
          </Button>
          <Button
            onClick={handleSave} className="bg-gradient-to-r text-slate-50 px-6 py-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">


            <Globe className="w-4 h-4 mr-2" />
            Save SEO Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}