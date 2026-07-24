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
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <HelpCircle size={13} strokeWidth={2} /> Common Questions
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mt-1">
          Everything you need to know about security, features, and performance.
        </p>
      </div>

      <div className="space-y-2.5">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen 
                  ? 'bg-white border-indigo-200 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-slate-900 text-sm md:text-base">
                  {item.question}
                </span>
                <div className={`p-1 rounded-full transition-transform duration-200 ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                  <ChevronDown size={16} strokeWidth={2} />
                </div>
              </button>
              
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100">
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
