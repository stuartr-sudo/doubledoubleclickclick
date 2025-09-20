
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          By using SEWO, you agree to use the service lawfully and to respect the intellectual property of others.
        </p>
        <p className="text-slate-300 leading-relaxed mb-4">
          All content you submit remains yours. You grant us permission to process it to provide the service. We provide the service “as is” without warranty.
        </p>
        <p className="text-slate-300 leading-relaxed mb-8">
          If you have questions about these terms, please reach out via the Contact page.
        </p>
        <Link to={createPageUrl('Home')} className="text-violet-400 hover:text-violet-300">Back to Home</Link>
      </div>
    </div>
  );
}
