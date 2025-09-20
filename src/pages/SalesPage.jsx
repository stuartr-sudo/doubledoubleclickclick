
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Wand2, Globe, Bot, Image as ImageIcon, Video, Megaphone, Shield, BookOpen, Sparkles, Share2, ShoppingBag, Youtube, Music, Quote, Smartphone, Tablet, Laptop } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { SalesPageContent } from "@/api/entities";

export default function SalesPage() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let rows = await SalesPageContent.filter({ identifier: "main_sales_v1" });
        if (!rows?.length) rows = await SalesPageContent.list("-updated_date", 1);
        setContent(rows?.[0] || null);
      } catch (error) {
        console.error("Failed to load SalesPageContent:", error);
        setContent(null); // Ensure content is null on error
      }
    })();
  }, []);

  const iconMap = useMemo(() => ({
    sparkles: Sparkles,
    image: ImageIcon,
    video: Video,
    share: Share2,
    shopping: ShoppingBag,
    wand: Wand2,
    book: BookOpen,
    megaphone: Megaphone,
    globe: Globe,
    shield: Shield,
    bot: Bot,
    zap: Zap,
    youtube: Youtube,
    music: Music,
    quote: Quote,
    smartphone: Smartphone,
    tablet: Tablet,
    laptop: Laptop
  }), []);

  // Defaults from the original static page
  const defaultHero = {
    badge: "All‑in‑One AI Content Platform",
    title: "Stop chasing content. \nStart dominating your market.",
    subtitle: "Create, optimize, and publish content at scale with AI rewriting, humanization, image/video generation, citations, localization, and one‑click publishing—wrapped in a blazing‑fast editor.",
    bg: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1600&auto=format&fit=crop",
    ctaPrimaryText: "Request a demo",
    ctaPrimaryPage: "Contact",
    ctaSecondaryText: "Explore the platform",
    ctaSecondaryPage: "Home"
  };

  const hero = {
    badge: content?.hero_badge || defaultHero.badge,
    title: content?.hero_title || defaultHero.title,
    subtitle: content?.hero_subtitle || defaultHero.subtitle,
    bg: content?.hero_bg_image_url || defaultHero.bg,
    ctaPrimaryText: content?.cta_primary_text || defaultHero.ctaPrimaryText,
    ctaPrimaryPage: content?.cta_primary_page || defaultHero.ctaPrimaryPage,
    ctaSecondaryText: content?.cta_secondary_text || defaultHero.ctaSecondaryText,
    ctaSecondaryPage: content?.cta_secondary_page || defaultHero.ctaSecondaryPage
  };

  const defaultBigBenefits = [
    {
      title: "Create faster",
      desc: "From blank page to polished post in minutes with AI assists at every step.",
      icon: Zap
    },
    {
      title: "Publish smarter",
      desc: "Keep formatting, images, and SEO metadata across destinations automatically.",
      icon: Globe
    },
    {
      title: "Scale quality",
      desc: "Workflows standardize excellence so every post is consistent and on-brand.",
      icon: Bot
    }
  ];

  const dynamicBenefits = (content?.big_benefits || []).map(b => ({
    icon: iconMap[b.icon_key] || Zap, // Fallback to Zap if icon_key not found or null
    title: b.title,
    desc: b.desc
  }));

  const defaultFeatures = [
    {
      icon: Sparkles,
      title: "Hyperediting, without the hassle",
      desc: "Live WYSIWYG editing with clean HTML, responsive previews for mobile, tablet, and desktop."
    },
    {
      icon: ImageIcon,
      title: "AI Images & Library",
      desc: "Generate on-brand images, manage uploads, and auto-write accessible alt text."
    },
    {
      icon: Video,
      title: "Video, Audio, and Embeds",
      desc: "Insert YouTube and TikTok, generate clips, and add narration or music in seconds."
    },
    {
      icon: Share2,
      title: "Calls-to-Action that convert",
      desc: "Drop in reusable CTA blocks and email capture forms that fit your brand."
    },
    {
      icon: ShoppingBag,
      title: "Promoted Products",
      desc: "Insert rich product blocks with images, pricing, and links—optimized for conversions."
    },
    {
      icon: Wand2,
      title: "AI Rewrite & Humanize",
      desc: "Polish voice and clarity with AI rewrites and natural, human-sounding edits."
    },
    {
      icon: BookOpen,
      title: "Citations & Research",
      desc: "Cite sources, add fact boxes, and summarize key takeaways with a click."
    },
    {
      icon: Megaphone,
      title: "Affilify & Brand It",
      desc: "Shift tone for affiliate content and enforce brand voice with your guidelines."
    },
    {
      icon: Globe,
      title: "Localize",
      desc: "Translate content while preserving structure, ready for global audiences."
    },
    {
      icon: Shield,
      title: "AI Detection",
      desc: "Confidence scoring and recommendations to keep content authentic."
    },
    {
      icon: Bot,
      title: "AI Agent Workflows",
      desc: "Run multi-step automations (cleanup → TL;DR → brand → links) with live progress."
    },
    {
      icon: Zap,
      title: "One‑click publishing",
      desc: "Push to Notion, Shopify, Webflow, WordPress, or your own webhook."
    }
  ];

  const dynamicFeatures = (content?.feature_highlights || []).map(f => ({
    icon: iconMap[f.icon_key] || Sparkles, // Fallback to Sparkles
    title: f.title,
    desc: f.desc
  }));

  const metrics = (content?.metrics && content.metrics.length > 0)
    ? content.metrics
    : [
        { value: "10x", label: "Faster content creation" },
        { value: "1‑Click", label: "Publishing to your stack" },
        { value: "100%", label: "On‑brand with AI guardrails" }
      ];

  const hypereditingDefault = {
    badge: "Hyperediting",
    title: "From messy drafts to publish‑ready in minutes",
    desc: "Skip the formatting fight. Drag in images, align media, add callouts and citations, then run an AI polish pass. Our editor and “Ask AI” palette eliminate busywork so you can focus on ideas.",
    features: [
      { icon: Sparkles, text: "Clean HTML and responsive layout" },
      { icon: Wand2, text: "Rewrite, humanize, summarize, and localize" },
      { icon: Bot, text: "Multi-step AI agent workflows with live progress" }
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop"
  };

  const publishingDefault = {
    badge: "Publishing & Automation",
    title: "One‑click publishing to your stack",
    desc: "Push to Notion, Shopify, WordPress, Webflow, or any system via webhook—formatting, images, and SEO metadata included. Schedule in advance or set defaults per brand for true one‑click publishing.",
    platforms: ["Notion", "Shopify", "Webflow", "WordPress", "Webhook"],
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1600&auto=format&fit=crop"
  };

  const testimonialsDefault = [
    {
      quote: "We shipped a month of content in three days. The workflows are a game‑changer.",
      name: "Agency Director"
    },
    {
      quote: "Our writers love the humanize + brand passes. The voice is remarkably consistent.",
      name: "Head of Content"
    },
    {
      quote: "The one‑click publish to Notion and Shopify saves hours every single week.",
      name: "Growth Marketer"
    }
  ];

  const finalCtaDefaults = {
    title: "Ready to transform your content operations?",
    subtitle: "See how teams ship 10x more content that’s more on‑brand, more engaging, and easier to publish—without adding headcount.",
    ctaPrimaryText: "Request a demo",
    ctaPrimaryPage: "Contact",
    ctaSecondaryText: "Start exploring",
    ctaSecondaryPage: "Home",
    bottomText: "AI images, video, and audio built in"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={hero.bg}
          alt="Abstract data visualization"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          loading="lazy"
        />
        <div className="relative container mx-auto px-6 pt-20 pb-16">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            {hero.badge}
          </Badge>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            {hero.title.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < hero.title.split('\n').length - 1 && <br className="hidden md:block" />}
              </React.Fragment>
            ))}
          </h1>
          <p className="mt-5 text-slate-300 text-lg md:text-xl max-w-3xl">
            {hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link to={createPageUrl(hero.ctaPrimaryPage)}>{hero.ctaPrimaryText}</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20">
              <Link to={createPageUrl(hero.ctaSecondaryPage)}>{hero.ctaSecondaryText}</Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-2 text-slate-400 text-sm">
            <Smartphone className="w-4 h-4" />
            <Tablet className="w-4 h-4" />
            <Laptop className="w-4 h-4" />
            <span className="ml-2">Responsive preview built in</span>
          </div>
        </div>
      </section>

      {/* Big benefits */}
      <section className="container mx-auto px-6 py-14 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {(dynamicBenefits.length > 0 ? dynamicBenefits : defaultBigBenefits).map((b, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                {<b.icon className="w-6 h-6 text-emerald-400" />}
                <h3 className="mt-4 text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 text-slate-300">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-6 pb-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold">{content?.features_title || "Everything you need to create, optimize, and publish"}</h2>
          <p className="mt-3 text-slate-300">
            {content?.features_subtitle || "Our integrated toolset turns your content operation into a growth engine—no tabs, no hacks, no copy‑paste."}
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(dynamicFeatures.length > 0 ? dynamicFeatures : defaultFeatures).map((f, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">
              <div className="flex items-center gap-3">
                {<f.icon className="w-5 h-5 text-emerald-400" />}
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof style strip */}
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6 py-10 grid md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div key={i}>
              <p className="text-4xl font-extrabold">{m.value}</p>
              <p className="text-slate-300 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story + imagery */}
      <section className="container mx-auto px-6 py-14 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{content?.hyper_badge || hypereditingDefault.badge}</Badge>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold">{content?.hyper_title || hypereditingDefault.title}</h3>
            <p className="mt-3 text-slate-300">
              {content?.hyper_desc || hypereditingDefault.desc}
            </p>
            <ul className="mt-4 space-y-2 text-slate-300 text-sm">
              {(content?.hyper_features || hypereditingDefault.features).map((feature, i) => {
                const IconComponent = iconMap[feature.icon_key] || feature.icon;
                return (
                  <li key={i} className="flex gap-2">
                    {IconComponent && <IconComponent className="w-4 h-4 text-emerald-400 mt-0.5" />}
                    {feature.text}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img
              src={content?.hyper_image_url || hypereditingDefault.image}
              alt="Creative editing workspace"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Publishing section */}
      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="rounded-xl overflow-hidden border border-white/10 order-2 md:order-1">
            <img
              src={content?.publish_image_url || publishingDefault.image}
              alt="Publishing integrations"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="order-1 md:order-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{content?.publish_badge || publishingDefault.badge}</Badge>
            <h3 className="mt-4 text-2xl md:text-3xl font-bold">{content?.publish_title || publishingDefault.title}</h3>
            <p className="mt-3 text-slate-300">
              {content?.publish_desc || publishingDefault.desc}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-slate-300 text-sm">
              {(content?.publish_platforms || publishingDefault.platforms).map((platform, i) => (
                <Badge key={i} variant="outline" className="border-white/20">{platform}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials teaser */}
      <section className="bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
          {(content?.testimonials || testimonialsDefault).map((t, i) => (
            <div key={i} className="p-6 rounded-xl bg-slate-900/60 border border-white/10">
              <Quote className="w-5 h-5 text-emerald-400" />
              <p className="mt-3">{t.quote}</p>
              <p className="mt-3 text-sm text-slate-400">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 p-8 md:p-12 text-center">
          <h3 className="text-3xl md:text-4xl font-bold">{content?.final_cta_title || finalCtaDefaults.title}</h3>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
            {content?.final_cta_subtitle || finalCtaDefaults.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
              <Link to={createPageUrl(content?.final_cta_primary_page || finalCtaDefaults.ctaPrimaryPage)}>{content?.final_cta_primary_text || finalCtaDefaults.ctaPrimaryText}</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20">
              <Link to={createPageUrl(content?.final_cta_secondary_page || finalCtaDefaults.ctaSecondaryPage)}>{content?.final_cta_secondary_text || finalCtaDefaults.ctaSecondaryText}</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Youtube className="w-4 h-4" />
            <Music className="w-4 h-4" />
            <ImageIcon className="w-4 h-4" />
            <span>{content?.final_cta_bottom_text || finalCtaDefaults.bottomText}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
