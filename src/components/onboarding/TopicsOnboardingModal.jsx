
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Globe, MapPin, Languages, Target, Package, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { airtableUpdateRecord } from "@/api/functions";
import { toast } from "sonner";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { AppSettings } from "@/api/entities";
import { agentSDK } from "@/agents";
import app from "@/api/appClient";
import { supabase } from "@/lib/supabase";

const COUNTRY_OPTIONS = [
  { label: "Algeria", value: "2012" }, { label: "Angola", value: "2024" }, { label: "Azerbaijan", value: "2031" },
  { label: "Argentina", value: "2032" }, { label: "Australia", value: "2036" }, { label: "Austria", value: "2040" },
  { label: "Bahrain", value: "2048" }, { label: "Bangladesh", value: "2050" }, { label: "Armenia", value: "2051" },
  { label: "Belgium", value: "2056" }, { label: "Bolivia", value: "2068" }, { label: "Bosnia and Herzegovina", value: "2070" },
  { label: "Brazil", value: "2076" }, { label: "Bulgaria", value: "2100" }, { label: "Myanmar (Burma)", value: "2104" },
  { label: "Cambodia", value: "2116" }, { label: "Cameroon", value: "2120" }, { label: "Canada", value: "2124" },
  { label: "Sri Lanka", value: "2144" }, { label: "Chile", value: "2152" }, { label: "Taiwan", value: "2158" },
  { label: "Colombia", value: "2170" }, { label: "Costa Rica", value: "2188" }, { label: "Croatia", value: "2191" },
  { label: "Cyprus", value: "2196" }, { label: "Czechia", value: "2203" }, { label: "Denmark", value: "2208" },
  { label: "Ecuador", value: "2218" }, { label: "El Salvador", value: "2222" }, { label: "Estonia", value: "2233" },
  { label: "Finland", value: "2246" }, { label: "France", value: "2250" }, { label: "Germany", value: "2276" },
  { label: "Ghana", value: "2288" }, { label: "Greece", value: "2300" }, { label: "Guatemala", value: "2320" },
  { label: "Hong Kong", value: "2344" }, { label: "Hungary", value: "2348" }, { label: "India", value: "2356" },
  { label: "Indonesia", value: "2360" }, { label: "Ireland", value: "2372" }, { label: "Israel", value: "2376" },
  { label: "Italy", value: "2380" }, { label: "Cote d'Ivoire", value: "2384" }, { label: "Japan", value: "2392" },
  { label: "Kazakhstan", value: "2398" }, { label: "Jordan", value: "2400" }, { label: "Kenya", value: "2404" },
  { label: "South Korea", value: "2410" }, { label: "Latvia", value: "2428" }, { label: "Lithuania", value: "2440" },
  { label: "Malaysia", value: "2458" }, { label: "Malta", value: "2470" }, { label: "Mexico", value: "2484" },
  { label: "Moldova", value: "2498" }, { label: "Morocco", value: "2504" }, { label: "Netherlands", value: "2528" },
  { label: "New Zealand", value: "2554" }, { label: "Nicaragua", value: "2558" }, { label: "Nigeria", value: "2566" },
  { label: "Norway", value: "2578" }, { label: "Pakistan", value: "2586" }, { label: "Panama", value: "2591" },
  { label: "Paraguay", value: "2600" }, { label: "Peru", value: "2604" }, { label: "Philippines", value: "2608" },
  { label: "Poland", value: "2616" }, { label: "Portugal", value: "2620" }, { label: "Romania", value: "2642" },
  { label: "Saudi Arabia", value: "2682" }, { label: "Senegal", value: "2686" }, { label: "Serbia", value: "2688" },
  { label: "Singapore", value: "2702" }, { label: "Slovakia", value: "2703" }, { label: "Vietnam", value: "2704" },
  { label: "Slovenia", value: "2705" }, { label: "South Africa", value: "2710" }, { label: "Spain", value: "2724" },
  { label: "Sweden", value: "2752" }, { label: "Switzerland", value: "2756" }, { label: "Thailand", value: "2764" },
  { label: "United Arab Emirates", value: "2784" }, { label: "Tunisia", value: "2788" }, { label: "Turkiye", value: "2792" },
  { label: "Ukraine", value: "2804" }, { label: "North Macedonia", value: "2807" }, { label: "Egypt", value: "2818" },
  { label: "United Kingdom", value: "2826" }, { label: "United States", value: "2840" },
  { label: "Burkina Faso", value: "2854" }, { label: "Uruguay", value: "2858" }, { label: "Venezuela", value: "2862" }
];

const LANGUAGE_OPTIONS = [
  { label: "French", value: "fr" }, { label: "Arabic", value: "ar" }, { label: "Portuguese", value: "pt" },
  { label: "Azeri", value: "az" }, { label: "Spanish", value: "es" }, { label: "English", value: "en" },
  { label: "German", value: "de" }, { label: "Bengali", value: "bn" }, { label: "Armenian", value: "hy" },
  { label: "Dutch", value: "nl" }, { label: "Bosnian", value: "bs" }, { label: "Bulgarian", value: "bg" },
  { label: "Chinese (Traditional)", value: "zh-TW" }, { label: "Chinese (Simplified)", value: "zh-CN" },
  { label: "Croatian", value: "hr" }, { label: "Czech", value: "cs" }, { label: "Danish", value: "da" },
  { label: "Greek", value: "el" }, { label: "Estonian", value: "et" }, { label: "Finnish", value: "fi" },
  { label: "Hebrew", value: "he" }, { label: "Hindi", value: "hi" }, { label: "Hungarian", value: "hu" },
  { label: "Indonesian", value: "id" }, { label: "Italian", value: "it" }, { label: "Japanese", value: "ja" },
  { label: "Kazakh", value: "kk" }, { label: "Jordan", value: "jo" }, { label: "Korean", value: "ko" }, { label: "Latvian", value: "lv" },
  { label: "Lithuanian", value: "lt" }, { label: "Malay", value: "ms" }, { label: "Maltese", value: "mt" },
  { label: "Norwegian", value: "no" }, { label: "Polish", value: "pl" }, { label: "Portuguese", value: "pt" },
  { label: "Romanian", value: "ro" }, { label: "Russian", value: "ru" }, { label: "Serbian", value: "sr" },
  { label: "Slovak", value: "sk" }, { label: "Slovenian", value: "sl" }, { label: "Swedish", value: "sv" },
  { label: "Thai", value: "th" }, { label: "Turkish", value: "tr" }, { label: "Ukrainian", value: "uk" },
  { label: "Vietnamese", value: "vi" }
];

// normalize incoming URLs to ensure they include protocol and are valid
const normalizeUrl = (input) => {
  if (!input) return "";
  let url = String(input).trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    return "";
  }
};

// Helper: ensure a compact string, trimmed and length-limited
const toCleanString = (val, maxLen = 4000) => {
  try {
    if (val == null) return "";
    const s = String(val).replace(/\s+/g, " ").trim();
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  } catch {
    return "";
  }
};

// Robust agent summarizer with polling + timeout and string-only return
const summarizeProductWithAgent = async (pageTitle, pageText, { timeoutMs = 30000, pollIntervalMs = 2000 } = {}) => {
  const title = toCleanString(pageTitle, 200) || "Untitled Product";
  const text = toCleanString(pageText, 12000); // guard extremely long pages

  const conversation = await agentSDK.createConversation({
    agent_name: "product_summarizer",
    metadata: { name: `Summarize: ${title.slice(0, 60)}` }
  });

  if (!conversation || !conversation.id) {
    throw new Error("Failed to create product_summarizer conversation");
  }

  await agentSDK.addMessage(conversation, {
    role: "user",
    content: `Summarize the following product page into ~250-300 words, focusing on benefits and key features. 
Return ONLY the summary text, no headings, lists, or markdown.

Title: ${title}
Content:
${text}`
  });

  const startTime = Date.now();
  let summaryContent = null;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs)); // Wait before checking

    const updatedConversation = await agentSDK.getConversation(conversation.id);
    const messages = updatedConversation?.messages || [];
    const lastMessage = messages[messages.length - 1];

    // Check if we have a complete assistant response (is_complete or sufficient content length)
    if (lastMessage?.role === 'assistant' && (lastMessage.is_complete === true || (lastMessage.content && lastMessage.content.length > 50))) {
      summaryContent = toCleanString(lastMessage.content);
      break;
    }
  }

  if (summaryContent) {
    return summaryContent;
  } else {
    throw new Error(`product_summarizer timed out after ${timeoutMs / 1000} seconds without a complete summary.`);
  }
};

export default function TopicsOnboardingModal({
  open,
  onClose,
  username,
  onCompleted,
  companyInfoTableId,
  targetMarketTableId,
  companyProductsTableId,
  usersTableId = "Users"
}) {
  const [step, setStep] = React.useState(1);
  const [website, setWebsite] = React.useState("");
  const [geo, setGeo] = React.useState("");
  const [lang, setLang] = React.useState("");
  const [targetMarket, setTargetMarket] = React.useState("");
  const [targetMarketName, setTargetMarketName] = React.useState(""); // NEW
  const [generatingTargetMarket, setGeneratingTargetMarket] = React.useState(false);
  const [productUrl, setProductUrl] = React.useState("");
  const [productData, setProductData] = React.useState({ title: "", content: "", cleanName: "" }); // Data for submission
  const [scrapedProductDisplay, setScrapedProductDisplay] = React.useState(null); // Data for display in step 5
  const [isScrapingProduct, setIsScrapingProduct] = React.useState(false); // Renamed from scrapingProduct
  const [saving, setSaving] = React.useState(false);
  const [videoEmbedCode, setVideoEmbedCode] = React.useState("");
  const lastScrapeIdRef = React.useRef(0); // prevent race conditions across clicks

  const { consumeTokensForFeature } = useTokenConsumption();

  const isValidTblId = (val) => typeof val === "string" && /^tbl[a-zA-Z0-9]{14}$/.test(val);

  // Load video embed code
  React.useEffect(() => {
    const loadVideo = async () => {
      try {
        const settings = await AppSettings.list();
        const videoSetting = settings.find(s => s.setting_name === "topics_onboarding_video");
        if (videoSetting?.setting_value) {
          setVideoEmbedCode(videoSetting.setting_value);
        }
      } catch (error) {
        console.error("Error loading video:", error);
      }
    };

    if (open) {
      loadVideo();
    }
  }, [open]);

  const next = () => {
    if (step === 1 && !website.trim()) {
      toast.error("Please enter your website URL");
      return;
    }
    if (step === 2 && !geo) {
      toast.error("Please select a geographic location");
      return;
    }
    if (step === 3 && !lang) {
      toast.error("Please select a language");
      return;
    }
    if (step === 4 && (!targetMarketName.trim() || !targetMarket.trim())) {
      toast.error("Please enter both a name and description for your target market");
      return;
    }
    if (step < 5) setStep(step + 1);
    else submit();
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateCleanProductName = (title) => {
    // Remove HTML entities
    const withoutEntities = title.replace(/&[^;]+;/g, ' ');
    // Remove special characters and extra spaces
    const cleaned = withoutEntities.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    // Take first 3-4 words
    const words = cleaned.split(' ').slice(0, 4).join(' ');
    return words;
  };

  const generateTargetMarket = async () => {
    if (!website.trim()) {
      toast.error("Please enter your website first");
      return;
    }

    // sanitize website URL before calling extractWebsiteContent
    const sanitized = normalizeUrl(website);
    if (!sanitized) {
      toast.error("Please enter a valid website URL (e.g., https://example.com)");
      return;
    }
    if (sanitized !== website) setWebsite(sanitized);

    const result = await consumeTokensForFeature('topics_onboarding_ai_target_market');
    if (!result.success) {
      return;
    }

    setGeneratingTargetMarket(true);
    try {
      console.log('Fetching website content from:', sanitized);
      
      // Use getSitemapPages to get a snapshot of the site structure
      const sitemapResponse = await app.functions.getSitemapPages({ url: sanitized, limit: 50 });
      console.log('Sitemap response:', sitemapResponse);

      if (sitemapResponse?.success && sitemapResponse?.pages?.length > 0) {
        // Build a context from the sitemap
        const pagesList = sitemapResponse.pages.slice(0, 10).map(p => `- ${p.title || p.url}`).join('\n');
        const prompt = `You are a content strategist. Based on the website at ${sanitized} and the following page titles:
${pagesList}

Produce a JSON object with:
{
  "target_market": "A concise 2-3 sentence description of the target market for this business",
  "topics": [
    {"keyword": "relevant keyword 1", "topic": "topic category 1"},
    {"keyword": "relevant keyword 2", "topic": "topic category 2"}
  ]
}

Focus on commercial relevance and SEO value. Return ONLY valid JSON.`;

        // Call the new LLM router
        const llmResponse = await app.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              target_market: { type: "string" },
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    keyword: { type: "string" },
                    topic: { type: "string" }
                  },
                  required: ["keyword", "topic"],
                  additionalProperties: false
                }
              }
            },
            required: ["target_market", "topics"],
            additionalProperties: false
          }
        });
        
        console.log('LLM response:', llmResponse);

        if (llmResponse?.success && llmResponse?.result) {
          const data = llmResponse.result;
          setTargetMarket(data.target_market || "");
          // Auto-fill target market name with a short summary
          if (data.target_market) {
            const shortName = data.target_market.split('.')[0].substring(0, 50);
            setTargetMarketName(shortName);
          }
          toast.success("Target market generated from website");
        } else {
          throw new Error(llmResponse?.error || 'LLM returned no result');
        }
      } else {
        console.error('Failed to fetch sitemap:', sitemapResponse);
        toast.error("Could not access website. Please enter manually.");
      }
    } catch (error) {
      console.error('Error generating target market:', error);
      toast.error("Failed to generate target market. Please enter manually.");
    } finally {
      setGeneratingTargetMarket(false);
    }
  };

  const handleScrapeProduct = async () => { // Renamed from scrapeProduct
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    const sanitized = normalizeUrl(productUrl);
    if (!sanitized) {
      toast.error("Please enter a valid product URL (e.g., https://example.com/product)");
      return;
    }
    if (sanitized !== productUrl) setProductUrl(sanitized);

    const tokenRes = await consumeTokensForFeature('topics_onboarding_product_scrape');
    if (!tokenRes.success) return;

    const myId = Date.now();
    lastScrapeIdRef.current = myId; // Mark this scrape operation with a unique ID

    setIsScrapingProduct(true); // Updated state name
    let productTitle = "";
    let productRawContent = "";
    let cleanName = "";
    let summary = "";
    let productImage = ""; // To store image URL for display

    try {
      const isAmazonUrl = sanitized.includes('amazon.com') || sanitized.includes('amzn.');

      if (isAmazonUrl) {
        console.log('Scraping Amazon product from:', sanitized);
        console.log('[DEBUG] app:', app);
        console.log('[DEBUG] app.functions:', app?.functions);
        console.log('[DEBUG] app.functions.amazonProduct:', app?.functions?.amazonProduct);
        if (!app || !app.functions || !app.functions.amazonProduct) {
          throw new Error('app.functions.amazonProduct is not available');
        }
        const amazonData = await app.functions.amazonProduct({ url: sanitized });

        if (!amazonData?.success) {
          if (amazonData?.error && amazonData.error.includes("exceeded the MONTHLY quota")) {
            toast.error("Amazon Import Quota Reached", {
              description: "You've used all your free Amazon data requests for the month. Please try a different product URL.",
              duration: 10000
            });
          } else {
            toast.error(amazonData?.error || "Failed to fetch Amazon product details.");
          }
          return; // Early exit, still in finally
        }

        const p = amazonData.data;
        productTitle = toCleanString(p.product_title || "", 200);
        productRawContent = toCleanString(p.product_description || "", 12000);
        if (Array.isArray(p.about_product)) {
          productRawContent += "\n\n" + toCleanString(p.about_product.join("\n"), 12000 - productRawContent.length);
        }
        cleanName = generateCleanProductName(productTitle || "Untitled Product");
        productImage = p.main_image_url || ""; // Capture main image URL

      } else {
        console.log('Scraping generic product from:', sanitized);
        const response = await app.functions.extractWebsiteContent({ url: sanitized, maxAge: 0 });
        const productPageData = response?.data;

        if (!response?.success || !response?.text) {
          toast.error("Could not extract product information from the URL.");
          return; // Early exit, still in finally
        }

        productTitle = toCleanString(response.title || "", 200);
        productRawContent = toCleanString(response.text || "", 12000);
        cleanName = generateCleanProductName(productTitle || "Untitled Product");
        // No image extraction for generic pages for now
      }

      // If another scrape was initiated while we were fetching content, abort this one
      if (myId !== lastScrapeIdRef.current) {
        console.log("Aborting current scrape, new scrape initiated.");
        return;
      }
      
      // Step 2: Call product_summarizer agent
      try {
        summary = await summarizeProductWithAgent(productTitle, productRawContent);
        toast.success("Product page summarized successfully");
      } catch (agentError) {
        console.warn("Product summarization agent failed or timed out:", agentError.message);
        toast.warning("Product summarization timed out. Using raw content for description.");
        summary = productRawContent; // Fallback to raw content if summarization fails
      }
      
      // If another scrape was initiated while we were waiting for the agent, abort this one
      if (myId !== lastScrapeIdRef.current) {
        console.log("Aborting current scrape after agent, new scrape initiated.");
        return;
      }

      // Update state for submission
      setProductData({
        title: productTitle,
        content: summary, // Use summarized content or raw content fallback
        cleanName: cleanName
      });
      // Update state for display in the modal
      setScrapedProductDisplay({
        name: productTitle,
        description: summary,
        image_url: productImage
      });

    } catch (error) {
      console.error('Error scraping product:', error);
      const msg = toCleanString(error?.message || "Unknown error", 100);
      toast.error(`Failed to scrape or summarize product page. ${msg ? `(${msg})` : ""}`);
    } finally {
      if (myId === lastScrapeIdRef.current) { // Only set scrapingProduct to false if this is the latest operation
        setIsScrapingProduct(false); // Updated state name
      }
    }
  };

  const submit = async () => {
    // Guard against multiple submissions
    if (saving) return;

    setSaving(true);
    try {
      const resolvedCompanyInfoTable = isValidTblId(companyInfoTableId) ? companyInfoTableId : "Company Information";
      const countryLabel = COUNTRY_OPTIONS.find(o => o?.value === geo)?.label || geo || "";
      const languageLabel = LANGUAGE_OPTIONS.find(o => o?.value === lang)?.label || lang || "";

      // Submit to Company Information table
      const fieldsPayload = {
        "Client Website": website,
        "Username": username || "",
        "Client Namespace": username || "",
        "Geographic Location": countryLabel,
        "Language": languageLabel
      };

      console.log('Submitting to Company Information:', fieldsPayload);
      await app.functions.airtableCreateRecord({
        tableId: resolvedCompanyInfoTable,
        fields: fieldsPayload
      });

      // Submit to Target Market table - USE USER-PROVIDED NAME
      if (targetMarket.trim() && targetMarketName.trim()) {
        const resolvedTargetMarketTable = isValidTblId(targetMarketTableId) ? targetMarketTableId : "Target Market";

        console.log('Submitting to Target Market table:', resolvedTargetMarketTable);
        await app.functions.airtableCreateRecord({
          tableId: resolvedTargetMarketTable,
          fields: {
            "Target Market Name": targetMarketName.trim(), // Use the user-provided name
            "Target Market Description": targetMarket,
            "username": username || ""
          }
        });
      }

      // Submit to Company Product table
      if (productUrl.trim()) {
        const resolvedProductTable = isValidTblId(companyProductsTableId) ? companyProductsTableId : "Company Products";

        console.log('Submitting to Company Product table:', resolvedProductTable);
        await app.functions.airtableCreateRecord({
          tableId: resolvedProductTable,
          fields: {
            "Page Name": productData.cleanName || productData.title || "",
            "Page Content": productData.content || "",
            "URL": productUrl,
            "client_username": username || "",
            "Status": "Add to Pinecone" // Automatically set Status field
          }
        });
      }

      // STEP 1: Fetch sitemap and store in Sitemap entity
      if (website) {
        try {
          console.log('[Sitemap] Fetching pages for:', website);
          const sitemapData = await app.functions.getSitemapPages({ url: website, limit: 200 });
          
          if (sitemapData?.success && Array.isArray(sitemapData.pages) && sitemapData.pages.length) {
            // Store sitemap in database without SELECT to avoid RLS read issues
            const payload = {
              domain: sitemapData.base || new URL(website).hostname.replace(/^www\./i, ''),
              pages: sitemapData.pages,
              user_name: username,
              total_pages: sitemapData.total || sitemapData.pages.length
            };
            const { error: insertErr } = await supabase.from('sitemaps').insert(payload);
            if (insertErr) {
              console.warn('[Sitemap] Insert failed (non-blocking):', insertErr?.message || insertErr);
            } else {
              console.log('[Sitemap] Stored', sitemapData.pages.length, 'pages for', username);
            }
          }
        } catch (sitemapError) {
          console.error('[Sitemap] Failed to fetch or store sitemap:', sitemapError);
          // Don't block onboarding if sitemap fails
        }
      }

      // STEP 2: Store timestamp for countdown timer and update user topics
      const me = await app.auth.me().catch(() => null);
      let timestamp = null; // Declare timestamp here
      if (me && username) { // Ensure username is present before storing
        const raw = me.topics_onboarding_completed_at;
        let completedMap = {};
        if (typeof raw === 'string' && raw.trim()) {
          try { completedMap = JSON.parse(raw); } catch { completedMap = {}; }
        } else if (raw && typeof raw === 'object') {
          completedMap = raw;
        }

        timestamp = new Date().toISOString(); // Assign value to timestamp
        completedMap[username] = timestamp;

        await app.auth.updateMe({ 
          topics_onboarding_completed_at: JSON.stringify(completedMap),
          topics: Array.from(new Set([username, ...(me.topics || [])])) // Update topics field for the user
        });

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: { user: { ...me, topics_onboarding_completed_at: completedMap } } }));
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newBalance: me.token_balance } }));
      }

      // STEP 3: Send Firecrawl webhook once per username (CRITICAL: only called here)
      if (username && website) {
        const lsKey = `firecrawl_onboarding_${username}`;
        if (localStorage.getItem(lsKey) !== '1') {
          try {
            const urlObj = new URL(website);
            const domain = urlObj.hostname.replace(/^www\./i, '');
            
            await app.functions.notifyFirecrawlWebsite({
              user_name: username,
              site_url: website,
              domain: domain
            });
            localStorage.setItem(lsKey, '1');
            console.log('[Firecrawl] Webhook sent successfully:', { user_name: username, site_url: website, domain });
          } catch (e) {
            console.error('[Firecrawl] Webhook failed:', e?.message || e);
            // Don't block onboarding completion if webhook fails
          }
        } else {
            console.log('[Firecrawl] Webhook already sent for this username, skipping');
        }
      }


      toast.success("Setup complete!");
      onCompleted?.({ website, geo: countryLabel, lang: languageLabel, targetMarket, targetMarketName, product: productData });
      onClose?.();
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      toast.error(`Failed to complete setup: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-600 mt-1" />
            <div className="flex-1">
              <Label htmlFor="website" className="text-base font-medium">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="mt-2"
              />
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Geographic Location</h3>
          </div>
          <Select value={geo} onValueChange={setGeo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a country/region" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Language</h3>
          </div>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Target Market</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-market-name" className="text-slate-700 font-medium mb-2 block">
                Target Market Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="target-market-name"
                value={targetMarketName}
                onChange={(e) => setTargetMarketName(e.target.value)}
                placeholder="e.g., Small Business Owners, Tech Enthusiasts, Pet Owners"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="target-market-desc" className="text-slate-700 font-medium mb-2 block">
                Target Market Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="target-market-desc"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="Describe your target market in detail..."
                className="w-full h-32"
              />
            </div>

            <Button
              onClick={generateTargetMarket}
              disabled={generatingTargetMarket}
              variant="outline"
              className="w-full"
            >
              {generatingTargetMarket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate from website"
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-900">Add Your First Product</h3>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="https://example.com/product"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="text-base"
            />
            <Button
              onClick={handleScrapeProduct}
              disabled={isScrapingProduct || !productUrl.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isScrapingProduct ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping product page...
                </>
              ) : (
                "Scrape product page"
              )}
            </Button>
          </div>

          {scrapedProductDisplay && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">{scrapedProductDisplay.name}</p>
                  <p className="text-sm text-green-700 mt-1 line-clamp-3">{scrapedProductDisplay.description}</p>
                  {scrapedProductDisplay.image_url && (
                    <img
                      src={scrapedProductDisplay.image_url}
                      alt={scrapedProductDisplay.name}
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && !o && onClose?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick setup for {username}</DialogTitle>
          <DialogDescription>Just five quick steps to tailor Topics for your business.</DialogDescription>
        </DialogHeader>

        {/* Video embed at top */}
        {videoEmbedCode && (
          <div className="mb-4">
            <div
              dangerouslySetInnerHTML={{ __html: videoEmbedCode }}
              className="w-full aspect-video [&>iframe]:w-full [&>iframe]:h-full rounded-md overflow-hidden"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${
                s <= step ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
          ))}
          <div className="ml-auto text-sm text-gray-500">Step {step} of 5</div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
          <Button onClick={back} disabled={step === 1 || saving} variant="outline">
            Back
          </Button>
          <Button onClick={next} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : step === 5 ? (
              "Complete"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
