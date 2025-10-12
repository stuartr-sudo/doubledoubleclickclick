import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";

export default function AnalyticsByUsername() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold text-lg">Google Analytics & Search Console Integration</h3>
            <p className="text-slate-600 text-sm">Connect your analytics accounts to see live reporting</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">Coming Soon</h4>
          <p className="text-slate-600 max-w-md mx-auto">
            We're building a seamless Google OAuth integration that will allow you to connect your GA4 and Search Console accounts 
            to view real-time analytics and insights directly in your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}