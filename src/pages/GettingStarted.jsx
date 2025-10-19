
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BlogPost } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Globe, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { Sitemap } from "@/api/entities";
import { BrandGuidelines } from "@/api/entities";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import { scrapeWithFirecrawl, extractWebsiteContent, getSitemapPages, llmRouter } from "@/api/functions";

export default function GettingStarted() {
  const { user, loading } = useAuth();
  
  const [blogUrl, setBlogUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  const [siteUrl, setSiteUrl] = useState("");
  const [fetchingPages, setFetchingPages] = useState(false);
  const [pages, setPages] = useState([]);
  const [sitemapError, setSitemapError] = useState("");

  // New state for MagicOrbLoader
  const [importing, setImporting] = useState(false);
  const [importEta, setImportEta] = useState(60);

  useEffect(() => {
    if (user?.completed_tutorial_ids?.includes('getting_started_scrape')) {
      window.location.href = createPageUrl('Dashboard');
      return;
    }
  }, [user]);

  const normalizeUrl = (url) => {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./i, '');
    } catch {
      return null;
    }
  };

  // Prefer consistent HTML regardless of source; decode entities if only text returned
  const coerceToHtml = (payload, fallbackUrl) => {
    const d = payload || {};
    const html =
      d.html ||
      d.content_html ||
      d.body_html ||
      d.article_html ||
      d.cleaned_html ||
      d.markup ||
      d.data?.html;

    if (typeof html === "string" && html.trim()) return html;

    const maybeHtml = d.text_html || d.content || d.text || d.body || "";
    if (typeof maybeHtml === "string" && /<[a-z][\s\S]*>/i.test(maybeHtml)) {
      return String(maybeHtml);
    }

    // Decode HTML entities from plaintext and wrap in paragraphs
    const decode = (str) => {
      const tmp = document.createElement("textarea");
      tmp.innerHTML = str;
      return tmp.value;
    };
    const decoded = decode(String(maybeHtml || ""));
    if (!decoded.trim()) return `<p>${fallbackUrl || ""}</p>`; // never return empty

    const parts = decoded
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return `<p>${fallbackUrl || ""}</p>`; // Ensure at least one <p>
    if (parts.length <= 1) return `<p>${decoded}</p>`;
    return parts.map((p) => `<p>${p}</p>`).join("\n");
  };

  const deriveTitle = (payload, url) => {
    const d = payload || {};
    const raw =
      d.title ||
      d.meta_title ||
      d.data?.title ||
      (d.metadata && d.metadata.title) ||
      "";

    const decode = (str) => {
      const tmp = document.createElement("textarea");
      tmp.innerHTML = str;
      return tmp.value;
    };

    if (raw) return decode(String(raw));

    try {
      const u = new URL(url);
      const path = u.pathname.replace(/\/+/g, "/").replace(/(^\/|\/$)/g, "");
      const last = path.split("/").pop() || u.hostname;
      return decode(
        last
          .replace(/[-_]+/g, " ")
          .replace(/\.[a-z0-9]+$/i, "")
          .replace(/\b\w/g, (m) => m.toUpperCase())
      );
    } catch {
      return "Imported Article";
    }
  };

  const generateSitemapAndGuidelines = async (url, userName) => {
    if (!url || !userName) return;

    try {
      const domain = extractDomain(url);
      if (!domain) {
        console.log('[Background] Invalid URL for domain extraction:', url);
        return;
      }

      console.log('[Background] Starting sitemap and guidelines generation for:', domain);

      // Part 1: Check if sitemap already exists
      const existingSitemaps = await Sitemap.filter({ domain, user_name: userName }).catch(() => []);
      
      if (existingSitemaps.length === 0) {
        console.log('[Background] Fetching sitemap for:', domain);
        
        try {
          const response = await getSitemapPages({
            url: `https://${domain}`,
            limit: 200
          });
          const data = response.data;

          if (data?.success && Array.isArray(data.pages) && data.pages.length > 0) {
            await Sitemap.create({
              domain,
              pages: data.pages,
              user_name: userName
            });
            console.log('[Background] Sitemap saved successfully:', data.pages.length, 'pages');
          } else {
            console.log('[Background] Sitemap fetch successful but no pages found or data format incorrect for:', domain);
          }
        } catch (sitemapError) {
          console.log('[Background] Sitemap generation failed (silently):', sitemapError?.message);
        }
      } else {
        console.log('[Background] Sitemap already exists for:', domain);
      }

      // Part 2: Check if brand guidelines already exist
      const existingGuidelines = await BrandGuidelines.filter({ user_name: userName }).catch(() => []);
      
      if (existingGuidelines.length === 0) {
        console.log('[Background] Generating brand guidelines for:', domain);
        
        try {
          // Use LLM to analyze the website and extract brand guidelines
          const prompt = `Analyze the website at ${url} and extract brand voice and style guidelines.

Based on the content, extract:
1. Voice and tone (e.g., professional, friendly, technical, casual)
2. Writing style rules (e.g., sentence structure, preferred voice, formatting)
3. Words/phrases to avoid
4. Words/phrases to encourage
5. Target audience/market

Return a JSON object with these fields:
{
  "voice_and_tone": "string describing voice and tone",
  "content_style_rules": "string with writing style rules",
  "prohibited_elements": "comma-separated words/phrases to avoid",
  "preferred_elements": "comma-separated words/phrases to encourage",
  "target_market": "description of target audience"
}`;

          const response = await llmRouter({
            provider: 'openai',
            model: 'gpt-4',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          });
          const guidelinesData = response.data;

          if (guidelinesData) {
            await BrandGuidelines.create({
              user_name: userName,
              name: `${domain} Brand Guidelines`,
              voice_and_tone: guidelinesData.voice_and_tone || "Professional and clear",
              content_style_rules: guidelinesData.content_style_rules || "Use active voice and concise sentences",
              prohibited_elements: guidelinesData.prohibited_elements || "",
              preferred_elements: guidelinesData.preferred_elements || "",
              target_market: guidelinesData.target_market || ""
            });
            console.log('[Background] Brand guidelines saved successfully');
          } else {
            console.log('[Background] LLM returned no guidelines data for:', domain);
          }
        } catch (guidelinesError) {
          console.log('[Background] Brand guidelines generation failed (silently):', guidelinesError?.message);
        }
      } else {
        console.log('[Background] Brand guidelines already exist for:', userName);
      }
    } catch (error) {
      console.log('[Background] Background task error (silently handled):', error?.message);
    }
  };

  const scrapeAndOpenEditor = async (url) => {
    if (!url) {
      setError("Please enter a blog post URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (including https://)");
      return;
    }

    setError("");
    setScraping(true);
    setImporting(true); // Show MagicOrbLoader
    setImportEta(60);    // Set ETA for MagicOrbLoader

    try {
      console.log('[GettingStarted] Attempting to scrape:', url);
      
      let data = null;
      let lastError = null;

      // Try scrapeWithFirecrawl first
      try {
        const response = await scrapeWithFirecrawl({ url: url });
        data = response.data;
        console.log('[GettingStarted] scrapeWithFirecrawl response:', JSON.stringify(data, null, 2));
      } catch (firecrawlError) {
        console.warn('[GettingStarted] scrapeWithFirecrawl failed:', firecrawlError.message, 'Trying extractWebsiteContent...');
        lastError = firecrawlError;
        
        // Fallback to extractWebsiteContent
        try {
          const response = await extractWebsiteContent({ url: url });
          data = response.data;
          console.log('[GettingStarted] extractWebsiteContent response:', JSON.stringify(data, null, 2));
        } catch (extractError) {
          console.error('[GettingStarted] Both scraping methods failed:', extractError.message);
          lastError = extractError;
          data = null; // Ensure data is null if both fail
        }
      }

      if (!data) {
        throw new Error(lastError?.message || 'Failed to extract content from URL');
      }

      // Use helper functions for consistent content and title extraction
      const htmlContent = coerceToHtml(data, url);
      const postTitle = deriveTitle(data, url);

      console.log('[GettingStarted] Extracted title:', postTitle);
      console.log('[GettingStarted] HTML content found:', !!htmlContent, 'Length:', htmlContent?.length || 0);

      if (!htmlContent || htmlContent.trim().length === 0) {
        console.error('[GettingStarted] No content found after processing. Available payload fields:', Object.keys(data || {}));
        throw new Error(`No content found. Response had these fields: ${Object.keys(data || {}).join(', ')}`);
      }

      const username = user?.assigned_usernames?.[0] || "";

      const newPost = await BlogPost.create({
        title: postTitle,
        content: htmlContent, // Use the HTML content
        status: "draft",
        user_name: username
      });

      const currentCompleted = user?.completed_tutorial_ids || [];
      const updatedCompleted = Array.from(new Set([...currentCompleted, "getting_started_scrape"]));
      
      // Update user profile in Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ completed_tutorial_ids: updatedCompleted })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }

      // NEW: Trigger background sitemap and guidelines generation
      if (username) {
        generateSitemapAndGuidelines(url, username).catch((err) => {
          console.log('[Background] Silent error:', err?.message);
        });
      }

      toast.success("Blog post imported successfully! Opening in editor...");

      setTimeout(() => {
        window.location.href = createPageUrl(`Editor?post=${newPost.id}`);
      }, 600);
    } catch (err) {
      console.error("[GettingStarted] Scraping error:", err);
      setError(err?.message || "Failed to import blog post. Please try again.");
      setScraping(false); // Turn off button loader on error
    } finally {
      setImporting(false); // Ensure MagicOrbLoader is turned off
    }
  };

  const handleManualScrape = async () => {
    if (!blogUrl) {
      setError("Please enter a blog post URL");
      return;
    }
    try {
      new URL(blogUrl);
    } catch {
      setError("Please enter a valid URL (including https://)");
      return;
    }

    setError(""); // Clear previous errors
    setImporting(true); // Show MagicOrbLoader
    setImportEta(60);   // Set ETA
    try {
      await scrapeAndOpenEditor(blogUrl); // Delegate to unified scraper
    } finally {
      setImporting(false); // Hide MagicOrbLoader
    }
  };

  const handleFetchSitemap = async () => {
    setSitemapError("");
    setPages([]);
    
    if (!siteUrl.trim()) {
      setSitemapError("Please enter your website URL");
      return;
    }

    setFetchingPages(true);
    try {
      // Client-side sitemap scraping (no API calls needed)
      const pages = await scrapeSitemapClientSide(siteUrl);
      
      setPages(pages);
      if (pages.length === 0) {
        setSitemapError("No pages found on that website");
      } else {
        // NEW: Trigger background sitemap and guidelines generation
        const username = user?.assigned_usernames?.[0] || "";
        if (username && pages.length > 0) {
          generateSitemapAndGuidelines(siteUrl, username).catch((err) => {
            console.log('[Background] Silent error:', err?.message);
          });
        }
      }
    } catch (e) {
      console.error("Sitemap fetch error:", e);
      setSitemapError(e?.message || "Failed to fetch sitemap pages");
      setPages([]);
    } finally {
      setFetchingPages(false);
    }
  };

  // Client-side sitemap scraping function
  const scrapeSitemapClientSide = async (baseUrl) => {
    const pages = [];
    const visited = new Set();
    
    try {
      // Normalize URL
      const url = normalizeUrl(baseUrl);
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Try to fetch sitemap.xml first
      const sitemapUrls = [
        `${url}/sitemap.xml`,
        `${url}/sitemap_index.xml`,
        `${url}/sitemaps.xml`
      ];

      let sitemapFound = false;

      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await fetch(sitemapUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DoubleClickBot/1.0)'
            },
            mode: 'cors'
          });

          if (response.ok) {
            const xml = await response.text();
            const sitemapPages = parseSitemapXML(xml, 50);
            if (sitemapPages.length > 0) {
              pages.push(...sitemapPages);
              sitemapFound = true;
              break;
            }
          }
        } catch (error) {
          console.log(`Sitemap ${sitemapUrl} not found or error:`, error.message);
          continue;
        }
      }

      // If no sitemap found, try to discover pages by crawling common paths
      if (!sitemapFound) {
        const commonPaths = [
          '/',
          '/about',
          '/contact',
          '/blog',
          '/news',
          '/products',
          '/services',
          '/pricing',
          '/faq',
          '/support',
          '/home',
          '/index'
        ];

        for (const path of commonPaths) {
          const fullUrl = `${url}${path}`;
          
          try {
            const response = await fetch(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DoubleClickBot/1.0)'
              },
              mode: 'cors'
            });

            if (response.ok) {
              pages.push({
                url: fullUrl,
                title: extractTitleFromUrl(fullUrl)
              });
              
              if (pages.length >= 20) {
                break;
              }
            }
          } catch (error) {
            // Ignore individual page errors
            continue;
          }
        }
      }

      return pages;
    } catch (error) {
      console.error('Error during client-side sitemap scraping:', error);
      throw new Error('Failed to scrape sitemap: ' + error.message);
    }
  };

  // Helper function to parse sitemap XML
  const parseSitemapXML = (xml, limit) => {
    const pages = [];
    
    try {
      // Simple regex-based parsing for sitemap URLs
      const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g);
      
      if (urlMatches) {
        for (const match of urlMatches) {
          const url = match.replace(/<\/?loc>/g, '').trim();
          if (url && isValidUrl(url)) {
            pages.push({
              url: url,
              title: extractTitleFromUrl(url)
            });
            
            if (pages.length >= limit) {
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing sitemap XML:', error);
    }

    return pages;
  };

  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper function to extract title from URL
  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract meaningful title from URL path
      if (pathname === '/' || pathname === '') {
        return 'Home';
      }
      
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      return 'Page';
    }
  };

  const handlePageSelect = async (pageUrl) => {
    setImporting(true); // Show MagicOrbLoader
    setImportEta(60);   // Set ETA
    try {
      const normalizedUrl = normalizeUrl(pageUrl);
      console.log('[GettingStarted] Sitemap URL:', pageUrl, '→ Normalized:', normalizedUrl);
      await scrapeAndOpenEditor(normalizedUrl);
    } finally {
      setImporting(false); // Hide MagicOrbLoader
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Let's Import Your First Blog Post 🚀
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Paste any blog post URL and we'll automatically extract the content for you. This is a great way to see how DoubleClick can help you edit and optimize existing content!
            </p>
          </div>

          {/* Side-by-side grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left card: Manual URL import */}
            <Card className="shadow-xl border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Import from URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="blog-url" className="text-sm font-medium text-slate-700">
                    Blog Post URL
                  </label>
                  <Input
                    id="blog-url"
                    type="url"
                    placeholder="https://example.com/blog/my-article"
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualScrape()}
                    disabled={scraping || importing}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>We'll extract the content from the URL</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Create a draft blog post in your account</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Open it in the editor for you to optimize</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleManualScrape}
                  disabled={scraping || importing || !blogUrl}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Import Blog Post
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right card: Sitemap selection */}
            <Card className="shadow-xl border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="w-5 h-5 text-green-600" />
                  Choose from your website pages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="site-url" className="text-sm font-medium text-slate-700">
                    Your Website (home page or domain)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="site-url"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchSitemap()}
                      disabled={fetchingPages || scraping || importing}
                      className="flex-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    />
                    <Button
                      onClick={handleFetchSitemap}
                      disabled={fetchingPages || scraping || importing || !siteUrl}
                      className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                    >
                      {fetchingPages ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Fetch Pages"
                      )}
                    </Button>
                  </div>
                </div>

                {sitemapError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{sitemapError}</p>
                  </div>
                )}

                {/* Scrollable sitemap pages list */}
                {pages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select a page to import ({pages.length} found)
                    </label>
                    <div className="border border-slate-200 rounded-lg bg-white max-h-[400px] overflow-y-auto">
                      {pages.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageSelect(page.url)}
                          disabled={scraping || importing}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="font-medium text-slate-900 text-sm mb-1 line-clamp-1">
                            {page.title}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {page.url}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pages.length === 0 && !fetchingPages && !sitemapError && (
                  <div className="text-center py-8 text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Enter your website URL above to fetch pages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AutoLink-style loading placeholder (non-blocking UI, no toasts) */}
      <MagicOrbLoader
        open={importing}
        label="Importing your article and creating an editable draft..."
        duration={importEta}
      />
    </>
  );
}
