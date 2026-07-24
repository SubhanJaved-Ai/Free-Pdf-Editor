'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is AetherPDF truly 100% free to use?",
    answer: "Yes. All core PDF editing features — including text modification, page reordering, merging, splitting, compression, signatures, and protection — are completely free with no hidden paywalls, daily quotas, or watermarks."
  },
  {
    question: "How are my documents kept secure and private?",
    answer: "Your files never leave your browser. AetherPDF uses WebAssembly (Wasm) and local JavaScript engines to parse and edit your PDF directly inside your device's memory. No file is ever uploaded to external servers."
  },
  {
    question: "Do I need to sign up or create an account?",
    answer: "No registration is required. You can immediately drag & drop your PDF file onto the home screen and start editing without entering an email or creating a password."
  },
  {
    question: "What file size limits apply when uploading PDFs?",
    answer: "Since processing happens locally in your browser, AetherPDF can handle large documents (up to 500MB+) smoothly, limited only by your computer or mobile device's available RAM."
  },
  {
    question: "Can I sign and fill out PDF forms?",
    answer: "Yes. You can add electronic signatures, draw custom signatures, insert text fields, checkmarks, and fill out interactive PDF forms easily."
  }
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-16" id="faq">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
          <HelpCircle size={13} /> Common Questions
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-on-surface-variant text-base max-w-md mx-auto mt-2">
          Everything you need to know about AetherPDF security, features, and performance.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? 'bg-white border-primary/40 shadow-md shadow-primary/5' 
                  : 'bg-surface/60 hover:bg-white border-outline-variant/50 hover:border-outline-variant'
              }`}
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-on-surface text-base md:text-lg">
                  {item.question}
                </span>
                <div className={`p-1.5 rounded-full bg-surface-container transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
                  <ChevronDown size={18} />
                </div>
              </button>
              
              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-on-surface-variant text-sm md:text-base leading-relaxed border-t border-outline-variant/20 animate-fade-up">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
