"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "./language-context";

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { copy } = useLanguage();

  return (
    <div className="faq-list">
      {copy.faq.items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div className={`faq-item ${isOpen ? "is-open" : ""}`} key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                id={`faq-button-${index}`}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <Plus size={20} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={`faq-panel-${index}`}
              role="region"
              aria-labelledby={`faq-button-${index}`}
              hidden={!isOpen}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
