
import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
      case 'LOW': return 'text-green-400 border-green-400';
      case 'MEDIUM': return 'text-yellow-400 border-yellow-400';
      case 'HIGH': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="w-4 h-4" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH': return <Shield className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getProgressBarGradient = (score) => {
    if (score <= 30) {
      return `linear-gradient(90deg, #10b981 0%, #84cc16 100%)`;
    } else if (score <= 60) {
      return `linear-gradient(90deg, #84cc16 0%, #f59e0b 100%)`;
    } else if (score <= 80) {
      return `linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)`;
    } else {
      return `linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)`;
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-6 h-6 text-blue-400" />
              AI Content Detection
            </DialogTitle>
            <DialogDescription className="text-white/70 text-base">
              Analyzing your content for AI-generated characteristics and providing recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <p className="text-white/70 text-lg">Analyzing your content...</p>
                <p className="text-white/50 text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-8">
                {/* Overall Score */}
                <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">AI Detection Results</h3>
                    <Badge className={`border text-base px-4 py-2 ${getRiskColor(analysisResult.risk_level)}`}>
                      {getRiskIcon(analysisResult.risk_level)}
                      <span className="ml-2">{analysisResult.risk_level} RISK</span>
                    </Badge>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg">AI Confidence Score</span>
                      <span className="font-bold text-xl">{analysisResult.confidence_score}%</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={analysisResult.confidence_score} 
                        className={`h-4 ${getProgressBarAnimation(analysisResult.confidence_score)}`}
                      />
                      <style jsx>{`
                        .progress-bar {
                          background: ${getProgressBarGradient(analysisResult.confidence_score)} !important;
                        }
                      `}</style>
                    </div>
                  </div>

                  <p className="text-white/80 text-base leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>

                {/* Analysis Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysisResult.ai_indicators?.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        AI Indicators Found
                      </h4>
                      <ul className="space-y-3 text-base text-white/80">
                        {analysisResult.ai_indicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.problematic_phrases?.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-red-400" />
                        Problematic Phrases
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.problematic_phrases.map((phrase, index) => (
                          <div key={index} className="bg-red-400/10 px-3 py-2 rounded-lg text-red-300 border border-red-400/20 text-sm">
                            "{phrase}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.writing_patterns?.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h4 className="font-medium mb-4 text-lg">Writing Patterns</h4>
                      <ul className="space-y-3 text-base text-white/80">
                        {analysisResult.writing_patterns.map((pattern, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.recommendations?.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Recommendations
                      </h4>
                      <ul className="space-y-3 text-base text-white/80">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleAnalyze}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 py-3 text-base"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Re-analyze Content
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 flex-1 py-3 text-base"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {!analysisResult && !isAnalyzing && !currentContent && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-600/20 to-slate-600/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-white/70 text-lg">No content to analyze</p>
                <p className="text-white/50 text-sm mt-2">Start writing in the editor first</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
