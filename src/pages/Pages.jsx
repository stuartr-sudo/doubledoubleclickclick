import React from "react";
import PageWizard from "@/components/pages/PageWizard";

export default function Pages() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">Pages Wizard</h1>
        <p className="text-white/70 mb-6">Choose a page option, writing style, and page style. Fill in the dynamic fields, then generate your page.</p>
        <PageWizard />
      </div>
    </div>
  );
}