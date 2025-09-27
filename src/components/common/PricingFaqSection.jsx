import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PricingFaqSection({ faqs }) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 md:mt-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id || index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 text-base leading-relaxed">
                <div 
                  dangerouslySetInnerHTML={{ __html: faq.answer }} 
                  className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}