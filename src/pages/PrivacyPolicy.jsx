
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-slate-300 leading-relaxed mb-4">
          We respect your privacy. We only collect the information necessary to run SEWO, such as your name and email when you join our waitlist or contact us.
        </p>
        <p className="text-slate-300 leading-relaxed mb-4">
          We will never sell your data. You can request deletion of your data at any time by contacting us via the Contact page.
        </p>
        <p className="text-slate-300 leading-relaxed mb-8">
          This policy may be updated over time. We will post any changes on this page.
        </p>
        <Link to={createPageUrl('Home')} className="text-violet-400 hover:text-violet-300">Back to Home</Link>
      </div>
    </div>
  );
}
