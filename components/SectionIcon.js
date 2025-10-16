// FILE: components/SectionIcon.js
// Small, accessible SVG icon helper. Pass "name" and optional "className".
// Keep SVGs inline to avoid extra network requests.

// Fully compatible SVGs for all browsers, 

import React from "react";

const ICONS = {
  summary: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h18" stroke="#16a34a" />
      <path d="M3 12h18" stroke="#16a34a" />
      <path d="M3 17h12" stroke="#16a34a" />
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#d1fae5" stroke="#16a34a" strokeWidth="0.6" />
    </svg>
  ),
  analysis: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21v-6l6-6 4 4 8-8" stroke="#16a34a" />
      <circle cx="18" cy="6" r="2" fill="none" stroke="#16a34a" strokeWidth="0.8" />
    </svg>
  ),
  roadmap: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16" stroke="#16a34a" />
      <path d="M8 16v4" stroke="#16a34a" />
      <path d="M16 12v8" stroke="#16a34a" />
      <circle cx="8" cy="12" r="3" fill="none" stroke="#16a34a" strokeWidth="0.9" />
    </svg>
  ),
  longterm: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v6" stroke="#16a34a" />
      <path d="M12 22v-6" stroke="#16a34a" />
      <path d="M4 12h6" stroke="#16a34a" />
      <path d="M20 12h-6" stroke="#16a34a" />
      <circle cx="12" cy="12" r="2" fill="none" stroke="#16a34a" strokeWidth="0.9" />
    </svg>
  ),
  strategy: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7c5 0 5 10 10 10s5-10 10-10" stroke="#16a34a" />
      <path d="M9 7l-2-2" stroke="#16a34a" />
      <path d="M9 7l2-2" stroke="#16a34a" />
    </svg>
  ),
  tools: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 7l3-3 4 4-3 3" stroke="#16a34a" />
      <path d="M10 14l-3 3-4-4 3-3" stroke="#16a34a" />
    </svg>
  ),
};

export default function SectionIcon({ name = "summary", className = "inline-flex w-10 h-10" }) {
  return <span className={className}>{ICONS[name] || ICONS.summary}</span>;
}
