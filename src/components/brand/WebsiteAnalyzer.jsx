import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function WebsiteAnalyzer({
  onAnalysisComplete,
  className = ""
}) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }

    if (!validateUrl(websiteUrl)) {
      toast.error("Please enter a valid URL (including http:// or https://)");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      const { data } = await base44.functions.invoke('analyzeWebsiteBrand', {
        url: websiteUrl,
        extract_colors: true,
        extract_fonts: true,
        extract_layout: true,
        generate_css: true
      });

      if (data.success) {
        setAnalysisResult(data);
        onAnalysisComplete(data);
        toast.success("Website analysis completed successfully!");
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Website analysis error:", error);
      setError(error.message || "Failed to analyze website");
      toast.error("Failed to analyze website. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUrlChange = (e) => {
    let url = e.target.value;
    
    // Auto-add protocol if missing
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    setWebsiteUrl(url);
    setError("");
    setAnalysisResult(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-800">Website Analysis</h3>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          Website URL
        </Label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={websiteUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className="flex-1"
            disabled={isAnalyzing}
          />
          <Button
            onClick={analyzeWebsite}
            disabled={isAnalyzing || !websiteUrl.trim()}
            className="px-6"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          Enter your website URL to automatically extract colors, fonts, and layout styles
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis Failed</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-3">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>

          <div className="space-y-3">
            {/* Extracted Colors */}
            {analysisResult.extracted_colors && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-2">Extracted Colors:</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(analysisResult.extracted_colors).slice(0, 6).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-green-600">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Typography */}
            {analysisResult.extracted_typography && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">Font Family:</div>
                <div className="text-sm text-green-600 font-mono">
                  {analysisResult.extracted_typography.font_family}
                </div>
              </div>
            )}

            {/* Website Domain */}
            {analysisResult.website_domain && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">Domain:</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-green-600">{analysisResult.website_domain}</span>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Layout Type */}
            {analysisResult.extracted_layout && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-1">Layout Type:</div>
                <div className="text-sm text-green-600 capitalize">
                  {analysisResult.extracted_layout.type || "Standard"}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-green-600">
            Brand specifications have been automatically populated below. You can adjust any values as needed.
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Analyzing website...</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Extracting colors, fonts, and layout information from {websiteUrl}
          </div>
        </div>
      )}
    </div>
  );
}