// FILE: components/SectionIcon.js
// Small, accessible SVG icon helper. Pass "name" and optional "className".
// Keep SVGs inline to avoid extra network requests.

// Fully compatible SVGs for all browsers, 

// FILE: components/SectionIcon.js
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
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#d1fae5" stroke="#16a34a" strokeWidth="1"/>
      <path d="M6 8h12M6 12h12M6 16h8" stroke="#16a34a" strokeWidth="1.4"/>
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
      <circle cx="6" cy="18" r="2" fill="#a7f3d0" stroke="#16a34a"/>
      <circle cx="12" cy="12" r="2" fill="#a7f3d0" stroke="#16a34a"/>
      <circle cx="18" cy="6" r="2" fill="#a7f3d0" stroke="#16a34a"/>
      <path d="M6 18L12 12L18 6" stroke="#16a34a" strokeWidth="1.5"/>
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
      <path d="M4 20h16" stroke="#16a34a" strokeWidth="1.5"/>
      <circle cx="8" cy="16" r="2" fill="#bbf7d0" stroke="#16a34a"/>
      <circle cx="16" cy="12" r="2" fill="#bbf7d0" stroke="#16a34a"/>
      <path d="M8 16V12M16 12V8" stroke="#16a34a" strokeWidth="1.4"/>
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
      <circle cx="12" cy="12" r="2" fill="#bbf7d0" stroke="#16a34a"/>
      <path d="M12 2v6M12 22v-6M4 12h6M20 12h-6" stroke="#16a34a" strokeWidth="1.5"/>
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
      <path d="M3 7c5 0 5 10 10 10s5-10 10-10" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M9 7l-2-2M9 7l2-2" stroke="#16a34a" strokeWidth="1.4"/>
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
      <path d="M14 7l3-3 4 4-3 3" stroke="#16a34a" strokeWidth="1.4"/>
      <path d="M10 14l-3 3-4-4 3-3" stroke="#16a34a" strokeWidth="1.4"/>
    </svg>
  ),
};

export default function SectionIcon({ name = "summary", className = "inline-flex w-10 h-10" }) {
  return <span className={className}>{ICONS[name] || ICONS.summary}</span>;
}
