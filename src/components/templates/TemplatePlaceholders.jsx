import React from "react";
import { Badge } from "@/components/ui/badge";

const groups = {
  product: [
    "PRODUCT_NAME",
    "PRODUCT_DESCRIPTION",
    "PRODUCT_PRICE",
    "PRODUCT_URL",
    "IMAGE_URL",
    "IMAGE_ALT",
    "SKU",
    "STAR_RATING",
    "REVIEW_COUNT",
    "BUTTON_TEXT",
    "LINK_TEXT"
  ],
  cta: [
    "HEADLINE",
    "SUBTEXT",
    "BUTTON_TEXT",
    "BUTTON_URL"
  ],
  email_form: [
    "HEADLINE",
    "SUBTEXT",
    "BUTTON_TEXT",
    "ACTION_URL",
    "EMAIL_PLACEHOLDER",
    "NAME_PLACEHOLDER"
  ],
  tldr: ["TITLE", "CONTENT"],
  testimonial: ["REVIEW_TITLE", "REVIEW_COMMENT", "REVIEW_AUTHOR", "REVIEW_DATE", "STAR_RATING"],
  faq: ["QUESTION", "ANSWER"],
  callout: ["TITLE", "CONTENT", "ICON"],
  fact: ["TITLE", "CONTENT"],
  general: ["TITLE", "CONTENT", "IMAGE_URL", "BUTTON_TEXT", "BUTTON_URL"]
};

export default function TemplatePlaceholders({ feature }) {
  const list = groups[feature] || groups.general;
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
      <div className="text-sm font-semibold text-slate-800 mb-2">Available placeholders</div>
      <div className="flex flex-wrap gap-2">
        {list.map((k) => (
          <Badge key={k} variant="secondary" className="bg-white border border-slate-200 text-slate-800">{"{{" + k + "}}"}</Badge>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">Wrap placeholders exactly like shown (for example: {"{{PRODUCT_NAME}}"}) and they will be replaced at render-time.</p>
    </div>
  );
}