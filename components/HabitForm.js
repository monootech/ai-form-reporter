
// FILE: components/HabitForm.js
// Description: Multi-step form component. On final submit it POSTs to Workflow 2
// (set NEXT_PUBLIC_WORKFLOW2_URL in Vercel). The component expects props:
// { contactId, email, firstName } provided from pages/index.js.

import { useState } from "react";
import { useRouter } from "next/router";

export default function HabitForm({ contactId, email, firstName }) {
  const router = useRouter();

  const WORKFLOW2_URL = "/api/submit-form";


  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    primaryGoal: "",
    biggestFrustration: "",
    trackingAreas: [],
    accountabilityStyle: "",
    thirtyDayFocus: "",
    futureVision: "",
    sheetsSkillLevel: "",
    // new question: approach to achieving goals
    approachOption: "", // "1","2","3","4"
    approachOtherText: ""
  });

  // All steps/questions (complete)
  const steps = [
    {
      title: "Your Big Goal",
      question: "What's the ONE area that would transform everything if you mastered it?",
      type: "dropdown",
      field: "primaryGoal",
      options: [
        "Finances 💰",
        "Fitness & Health 💪",
        "Learning & Growth 📚",
        "Focus & Productivity 🚀",
        "Projects & Goals 🎯"
      ]
    },
    {
      title: "Current Challenges",
      question: "What's been your biggest frustration with building consistent habits?",
      type: "radio",
      field: "biggestFrustration",
      options: [
        "I start strong but can't maintain consistency",
        "I get overwhelmed and don't know where to focus",
        "I forget to track or lose motivation quickly",
        "I lack accountability and external support",
        "I have the willpower but not the right system"
      ]
    },
    {
      title: "The Foundation",
      question: "Which areas do you currently track or want to start tracking?",
      type: "checkbox",
      field: "trackingAreas",
      options: [
        "Finances (budgeting, savings, income)",
        "Health & Fitness (exercise, nutrition, wellness)",
        "Learning & Skills (courses, reading, growth)",
        "Focus & Productivity (deep work, time management)",
        "Projects & Goals (progress, milestones, outcomes)"
      ]
    },
    {
      title: "Your Success Style",
      question: "What's your ideal accountability setup?",
      type: "radio",
      field: "accountabilityStyle",
      options: [
        "Self-tracking with great systems",
        "Partner or small group accountability",
        "Larger community with shared goals",
        "Structured coaching or mentorship"
      ]
    },
    {
      title: "Immediate Focus",
      question: "What specific habit would make the biggest impact in the next 30 days?",
      type: "text",
      field: "thirtyDayFocus",
      placeholder: "Describe the ONE habit that would create a breakthrough..."
    },
    {
      title: "Future Self",
      question: "Imagine your ideal day 6 months from now - what does it look like?",
      type: "text",
      field: "futureVision",
      placeholder: "Paint a picture of your ideal day 6 months from now..."
    },
    {
      title: "Technical Foundation",
      question: "How would you describe your Google Sheets comfort level?",
      type: "radio",
      field: "sheetsSkillLevel",
      options: [
        "Beginner 🟢 — I can enter data but formulas confuse me",
        "Intermediate 🟡 — I use basic formulas but advanced stuff feels overwhelming",
        "Advanced 🔵 — I work with pivot tables, conditional formatting, maybe some scripts",
        "Expert 🟣 — I build complex dashboards and automations regularly"
      ]
    },
    {
      title: "How you approach achieving goals",
      question:
        "To help us understand the resources and support that would be most helpful for you, which of the following best describes how you approach achieving your goals?",
      type: "approach",
      field: "approachOption",
      options: [
        "1. I invest in tools, courses, or programs that help me reach my goals faster.",
        "2. I mostly rely on free resources and figure things out on my own.",
        "3. I use a mix of free resources and occasional paid programs.",
        "4. Other – I’d like to describe my approach:"
      ]
    }
  ];

  // Helper: render individual field types
  const renderField = (step) => {
    const value = formData[step.field];

    switch (step.type) {
      case "dropdown":
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [step.field]: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select an option</option>
            {step.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-3">
            {step.options.map((opt) => (
              <label key={opt} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name={step.field}
                  value={opt}
                  checked={formData[step.field] === opt}
                  onChange={(e) => setFormData({ ...formData, [step.field]: e.target.value })}
                  className="text-green-600 focus:ring-green-500"
                  required
                />
                <span className="flex-1">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {step.options.map((opt) => (
              <label key={opt} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[step.field].includes(opt)}
                  onChange={(e) => {
                    const updated = e.target.checked ? [...formData[step.field], opt] : formData[step.field].filter((i) => i !== opt);
                    setFormData({ ...formData, [step.field]: updated });
                  }}
                  className="text-green-600 focus:ring-green-500 rounded"
                />
                <span className="flex-1">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "text":
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [step.field]: e.target.value })}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder={step.placeholder || ""}
            required
          />
        );




 // approach question: render radio options with full text values (no numeric indexes)
case "approach":
  return (
    <div className="space-y-3">
      {step.options.map((opt) => (
        <div key={opt} className="p-2">
          <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="approachOption"
              value={opt} // <-- store full text
              checked={formData.approachOption === opt}
              onChange={(e) => setFormData({
                ...formData,
                approachOption: e.target.value,
                approachOtherText: e.target.value !== step.options[3] ? "" : formData.approachOtherText
              })}
              className="mt-1"
              required
            />
            <div className="flex-1 text-left">
              <div className="text-sm">{opt}</div>
              {opt === step.options[3] && formData.approachOption === step.options[3] && (
                <textarea
                  value={formData.approachOtherText}
                  onChange={(e) => setFormData({ ...formData, approachOtherText: e.target.value })}
                  rows={3}
                  className="mt-2 w-full p-2 border border-gray-200 rounded"
                  placeholder="Describe your approach..."
                  required
                />
              )}
            </div>
          </label>
        </div>
      ))}
    </div>
  );





      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // navigate next step if not last
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Last step -> submit data to Workflow 2
    setLoading(true);
    setSubmitError("");

    try {
      const payload = {
        contactId,
        email,
        firstName,
        formData
      };

      const res = await fetch(WORKFLOW2_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
             
      });

      // Try to parse JSON
      const json = await res.json();

      if (!res.ok || !json.success) {
        const errMsg = json.error || json.message || "Server error during analysis. Please try again.";
        setSubmitError(errMsg);
        setLoading(false);
        return;
      }

      // On success, navigate to the report URL if provided, otherwise to a report page
      if (json.reportUrl) {
        // external or public URL
        window.location.href = json.reportUrl;
      } else if (json.contactId) {
        router.push(`/report/${json.contactId}`);
      } else {
        // fallback
        router.push("/report");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Submission failed. Please try again or contact support.");
      setLoading(false);
    }
  };

  // Back button behavior
  const handleBack = () => {
    if (currentStep === 0) return;
    setCurrentStep((s) => s - 1);
  };

  return (
    <div>
      <div className="mb-6 text-sm text-gray-600">
        <strong>Contact:</strong> {firstName || "Guest"} • <strong>Email:</strong> {email}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
        <p className="text-gray-600 mb-6">{steps[currentStep].question}</p>

        <div className="mb-6">{renderField(steps[currentStep])}</div>

        {submitError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {submitError}
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : currentStep === steps.length - 1 ? "Generate My Blueprint" : "Continue"}
          </button>
        </div>
      </form>

      {/* Progress */}
      <div className="mt-4 text-sm text-gray-600">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
}
