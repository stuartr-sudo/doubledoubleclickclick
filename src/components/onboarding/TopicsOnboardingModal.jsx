
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Globe, MapPin, Languages, Target, Package } from "lucide-react";
import { airtableCreateRecord } from "@/api/functions";
import { extractWebsiteContent } from "@/api/functions";
import { toast } from "sonner";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

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
  { label: "Kazakh", value: "kk" }, { label: "Korean", value: "ko" }, { label: "Latvian", value: "lv" },
  { label: "Lithuanian", value: "lt" }, { label: "Malay", value: "ms" }, { label: "Maltese", value: "mt" },
  { label: "Norwegian", value: "no" }, { label: "Polish", value: "pl" }, { label: "Portuguese", value: "pt" },
  { label: "Romanian", value: "ro" }, { label: "Russian", value: "ru" }, { label: "Serbian", value: "sr" },
  { label: "Slovak", value: "sk" }, { label: "Slovenian", value: "sl" }, { label: "Swedish", value: "sv" },
  { label: "Thai", value: "th" }, { label: "Turkish", value: "tr" }, { label: "Ukrainian", value: "uk" },
  { label: "Vietnamese", value: "vi" }
];

export default function TopicsOnboardingModal({ 
  open, 
  onClose, 
  username, 
  onCompleted, 
  companyInfoTableId,
  targetMarketTableId,
  companyProductsTableId
}) {
  const [step, setStep] = React.useState(1);
  const [website, setWebsite] = React.useState("");
  const [geo, setGeo] = React.useState("");
  const [lang, setLang] = React.useState("");
  const [targetMarket, setTargetMarket] = React.useState("");
  const [generatingTargetMarket, setGeneratingTargetMarket] = React.useState(false);
  const [productUrl, setProductUrl] = React.useState("");
  const [productData, setProductData] = React.useState({ title: "", content: "", cleanName: "" });
  const [scrapingProduct, setScrapingProduct] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const { consumeTokensForFeature } = useTokenConsumption();

  const isValidTblId = (val) => typeof val === "string" && /^tbl[a-zA-Z0-9]{14}$/.test(val);

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
    if (step === 4 && !targetMarket.trim()) {
      toast.error("Please enter or generate a target market description");
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

    const result = await consumeTokensForFeature('topics_onboarding_ai_target_market');
    if (!result.success) {
      return;
    }

    setGeneratingTargetMarket(true);
    try {
      console.log('Fetching website content from:', website);
      const response = await extractWebsiteContent({ url: website });
      console.log('Website content response:', response);
      
      const websiteData = response?.data;
      if (websiteData?.success && websiteData?.text) {
        const prompt = `Based on this website content, write a concise 2-3 sentence description of the target market:\n\n${websiteData.text.substring(0, 3000)}`;
        const { InvokeLLM } = await import("@/api/integrations");
        const llmResponse = await InvokeLLM({ prompt });
        setTargetMarket(llmResponse || "");
        toast.success("Target market generated");
      } else {
        console.error('Failed to extract website content:', websiteData);
        toast.error("Could not extract website content. Please enter manually.");
      }
    } catch (error) {
      console.error('Error generating target market:', error);
      toast.error("Failed to generate target market. Please enter manually.");
    } finally {
      setGeneratingTargetMarket(false);
    }
  };

  const scrapeProduct = async () => {
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    const result = await consumeTokensForFeature('topics_onboarding_product_scrape');
    if (!result.success) {
      return;
    }

    setScrapingProduct(true);
    try {
      console.log('Scraping product from:', productUrl);
      const response = await extractWebsiteContent({ url: productUrl });
      console.log('Product scrape response:', response);
      
      const productPageData = response?.data;
      if (productPageData?.success && productPageData?.text && productPageData?.title) {
        const cleanName = generateCleanProductName(productPageData.title);
        setProductData({ 
          title: productPageData.title, 
          content: productPageData.text,
          cleanName: cleanName
        });
        toast.success("Product page scraped successfully");
      } else {
        console.error('Failed to extract product info:', productPageData);
        toast.error("Could not extract product information. Please continue without scraping.");
      }
    } catch (error) {
      console.error('Error scraping product:', error);
      toast.error("Failed to scrape product page. Please continue without scraping.");
    } finally {
      setScrapingProduct(false);
    }
  };

  const submit = async () => {
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
      await airtableCreateRecord({
        tableId: resolvedCompanyInfoTable,
        fields: fieldsPayload
      });

      // Submit to Target Market table
      if (targetMarket.trim()) {
        const randomDigits = Math.floor(100 + Math.random() * 900);
        const targetMarketName = `${username || "brand"}-${randomDigits}`;
        const resolvedTargetMarketTable = isValidTblId(targetMarketTableId) ? targetMarketTableId : "Target Market";
        
        console.log('Submitting to Target Market table:', resolvedTargetMarketTable);
        await airtableCreateRecord({
          tableId: resolvedTargetMarketTable,
          fields: {
            "Target Market Name": targetMarketName,
            "Target Market Description": targetMarket,
            "username": username || ""
          }
        });
      }

      // Submit to Company Product table
      if (productUrl.trim()) {
        const resolvedProductTable = isValidTblId(companyProductsTableId) ? companyProductsTableId : "Company Products";
        
        console.log('Submitting to Company Product table:', resolvedProductTable);
        await airtableCreateRecord({
          tableId: resolvedProductTable,
          fields: {
            "Page Name": productData.cleanName || productData.title || "",
            "Page Content": productData.content || "",
            "URL": productUrl,
            "client_username": username || ""
          }
        });
      }

      toast.success("Setup complete!");
      onCompleted?.({ website, geo: countryLabel, lang: languageLabel, targetMarket, product: productData });
      onClose?.();
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      toast.error(`Failed to complete setup: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && !o && onClose?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick setup for {username}</DialogTitle>
          <DialogDescription>Just five quick steps to tailor Topics for your business.</DialogDescription>
        </DialogHeader>

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

        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Website</h3>
            </div>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full"
            />
          </div>
        )}

        {step === 2 && (
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
        )}

        {step === 3 && (
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
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Target Market</h3>
            </div>
            <Textarea
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              placeholder="Describe your target market..."
              className="w-full h-32 mb-3"
            />
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
        )}

        {step === 5 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Add Your First Product</h3>
            </div>
            <Input
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="w-full mb-3"
            />
            <Button
              onClick={scrapeProduct}
              disabled={scrapingProduct}
              variant="outline"
              className="w-full mb-3"
            >
              {scrapingProduct ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                "Scrape product page"
              )}
            </Button>
            {productData.title && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">{productData.title}</div>
                <div className="text-xs text-gray-500 line-clamp-3">{productData.content}</div>
              </div>
            )}
          </div>
        )}

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
