
import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Keep import for now, though it's replaced in JSX
import { AlertTriangle, CheckCircle, Loader2, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIContentDetectionModal({ isOpen, onClose, currentContent }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalyze = async () => {
    if (!currentContent?.trim()) return;

    setIsAnalyzing(true);
    try {
      const cleanContent = currentContent.replace(/<[^>]*>/g, '');
      const result = await InvokeLLM({
        prompt: `
Analyze the following content for AI-generated characteristics. Provide a detailed assessment including:

1. Overall AI confidence score (0-100, where 100 = definitely AI-generated)
2. Specific AI indicators found
3. Problematic phrases that sound robotic
4. Writing patterns that suggest AI generation
5. Recommendations for making it sound more human

Content to analyze:
${cleanContent}

Please be thorough and specific in your analysis.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            confidence_score: { type: "number" },
            risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            ai_indicators: {
              type: "array",
              items: { type: "string" }
            },
            problematic_phrases: {
              type: "array",
              items: { type: "string" }
            },
            writing_patterns: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            summary: { type: "string" }
          }
        }
      });

      setAnalysisResult(result);
    } catch (error) {
      console.error("AI detection error:", error);
      setAnalysisResult({
        confidence_score: 0,
        risk_level: "LOW",
        ai_indicators: [],
        problematic_phrases: [],
        writing_patterns: [],
        recommendations: ["Analysis failed. Please try again."],
        summary: "Unable to analyze content at this time."
      });
    }
    setIsAnalyzing(false);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':return 'text-emerald-600 border-emerald-300';
      case 'MEDIUM':return 'text-amber-600 border-amber-300';
      case 'HIGH':return 'text-rose-600 border-rose-300';
      default:return 'text-slate-500 border-slate-300';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':return <CheckCircle className="w-4 h-4" />;
      case 'MEDIUM':return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH':return <Shield className="w-4 h-4" />;
      default:return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getProgressBarGradient = (score) => {
    if (score <= 30) {
      return `linear-gradient(90deg, #34d399 0%, #a7f3d0 100%)`; // green shades
    } else if (score <= 60) {
      return `linear-gradient(90deg, #fcd34d 0%, #fef08a 100%)`; // yellow shades
    } else if (score <= 80) {
      return `linear-gradient(90deg, #fb923c 0%, #fed7aa 100%)`; // orange shades
    } else {
      return `linear-gradient(90deg, #f87171 0%, #fca5a5 100%)`; // red shades
    }
  };

  const getProgressBarAnimation = (score) => {
    return score > 80 ? 'animate-pulse' : '';
  };

  const handleClose = () => {
    setAnalysisResult(null);
    onClose();
  };

  // Start analyzing immediately when modal opens if there's content
  React.useEffect(() => {
    if (isOpen && currentContent && !analysisResult && !isAnalyzing) {
      handleAnalyze();
    }
  }, [isOpen, currentContent, analysisResult, isAnalyzing]); // Added dependencies for clarity and correctness

  const percent = Number(analysisResult?.confidence_score || 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-5xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200">
        <div className="p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
              <Shield className="w-6 h-6 text-blue-600" />
              AI Content Detection
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm">
              Analyze your content for AI-generated characteristics and get actionable recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isAnalyzing &&
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-slate-700 text-lg">Analyzing your content...</p>
                <p className="text-slate-500 text-sm mt-1">This may take a few moments</p>
              </div>
            }

            {analysisResult &&
            <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">AI Detection Results</h3>
                    <Badge className={`border ${getRiskColor(analysisResult.risk_level)} bg-white`}>
                      {getRiskIcon(analysisResult.risk_level)}
                      <span className="ml-2">{analysisResult.risk_level} RISK</span>
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">AI Confidence Score</span>
                      <span className="font-semibold text-slate-900">{percent}%</span>
                    </div>
                    {/* Custom gradient progress bar for high-contrast */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                      className={`h-full ${getProgressBarAnimation(percent)}`}
                      style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: getProgressBarGradient(percent) }} />

                    </div>
                  </div>

                  {analysisResult.summary &&
                <p className="text-slate-700 leading-relaxed">
                      {analysisResult.summary}
                    </p>
                }
                </div>

                {/* Analysis Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI Indicators */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      AI Indicators Found
                    </h4>
                    {analysisResult.ai_indicators?.length > 0 ?
                  <ul className="space-y-2 text-slate-700">
                        {analysisResult.ai_indicators.map((indicator, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="mt-2 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                            <span>{indicator}</span>
                          </li>
                    )}
                      </ul> :

                  <p className="text-slate-500 text-sm">No specific indicators found.</p>
                  }
                  </div>

                  {/* Problematic Phrases */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                      <Zap className="w-5 h-5 text-rose-600" />
                      Problematic Phrases
                    </h4>
                    {analysisResult.problematic_phrases?.length > 0 ?
                  <div className="flex flex-wrap gap-2">
                        {analysisResult.problematic_phrases.map((phrase, index) =>
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-md text-sm border bg-rose-50 text-rose-700 border-rose-200">

                            “{phrase}”
                          </span>
                    )}
                      </div> :

                  <p className="text-slate-500 text-sm">No problematic phrases detected.</p>
                  }
                  </div>

                  {/* Writing Patterns */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-semibold mb-4 text-slate-900">Writing Patterns</h4>
                    {analysisResult.writing_patterns?.length > 0 ?
                  <ul className="space-y-2 text-slate-700">
                        {analysisResult.writing_patterns.map((pattern, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <span>{pattern}</span>
                          </li>
                    )}
                      </ul> :

                  <p className="text-slate-500 text-sm">No notable patterns highlighted.</p>
                  }
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Recommendations
                    </h4>
                    {analysisResult.recommendations?.length > 0 ?
                  <ul className="space-y-2 text-slate-700">
                        {analysisResult.recommendations.map((rec, index) =>
                    <li key={index} className="flex items-start gap-2">
                            <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                    )}
                      </ul> :

                  <p className="text-slate-500 text-sm">No recommendations available.</p>
                  }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                  onClick={handleAnalyze}
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 flex-1 py-2.5">

                    <Shield className="w-4 h-4 mr-2" />
                    Re-analyze Content
                  </Button>
                  <Button
                  onClick={handleClose} className="bg-slate-900 text-gray-100 px-4 py-2.5 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-slate-800 flex-1">


                    Close
                  </Button>
                </div>
              </div>
            }

            {!analysisResult && !isAnalyzing && !currentContent &&
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-700 text-lg">No content to analyze</p>
                <p className="text-slate-500 text-sm mt-1">Start writing in the editor first</p>
              </div>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}