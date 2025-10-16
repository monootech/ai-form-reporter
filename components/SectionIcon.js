// FILE: components/SectionIcon.js
// Small, accessible SVG icon helper. Pass "name" and optional "className".
// Keep SVGs inline to avoid extra network requests.

// Fully compatible SVGs for all browsers, 

import React from "react";

const ICONS = {
  summary: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7h18M3 12h18M3 17h12" />
      <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="0.6" opacity="0.06" />
    </svg>
  ),
  analysis: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21v-6l6-6 4 4 8-8" />
      <circle cx="18" cy="6" r="2" strokeWidth="0.8" fill="none" />
    </svg>
  ),
  roadmap: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h16M8 16v4M16 12v8" />
      <path d="M8 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" strokeWidth="0.9" />
    </svg>
  ),
  longterm: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v6M12 22v-6M4 12h6M20 12h-6" />
      <circle cx="12" cy="12" r="2" strokeWidth="0.9" />
    </svg>
  ),
  strategy: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7c5 0 5 10 10 10s5-10 10-10" />
      <path d="M9 7l-2-2M9 7l2-2" strokeWidth="1.2" />
    </svg>
  ),
  tools: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 7l3-3 4 4-3 3" />
      <path d="M10 14l-3 3-4-4 3-3" />
    </svg>
  ),
};

export default function SectionIcon({ name = "summary", className = "w-10 h-10 text-green-600" }) {
  const svg = ICONS[name] || ICONS.summary;
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      {svg}
    </span>
  );
}
