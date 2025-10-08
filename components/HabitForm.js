import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

export default function HabitForm({ contactId, email, firstName }) {
  const router = useRouter();
  const WORKFLOW2_URL = "/api/submit-form";

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    primaryGoal: "",
    biggestFrustration: "",
    trackingAreas: [],
    accountabilityStyle: "",
    thirtyDayFocus: "",
    futureVision: "",
    sheetsSkillLevel: "",
    approachOption: "",
    approachOtherText: ""
  });

  // STEPS QUESTIONS
  const steps = [
    {
      title: "Your Big Goal",
      question: "What's the ONE area that would transform everything if you mastered it?",
      type: "dropdown",
      field: "primaryGoal",
      options: ["Finances 💰","Fitness & Health 💪","Learning & Growth 📚","Focus & Productivity 🚀","Projects & Goals 🎯"]
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
      options: ["Self-tracking with great systems","Partner or small group accountability","Larger community with shared goals","Structured coaching or mentorship"]
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
      options: ["Beginner 🟢","Intermediate 🟡","Advanced 🔵","Expert 🔵"]
    },
    {
      title: "How you approach achieving goals",
      question: "To help us understand the resources and support that would be most helpful for you, which of the following best describes how you approach your goals?",
      type: "approach",
      field: "approachOption",
      options: [
        "I invest in tools, courses, or programs that help me reach my goals faster.",
        "I mostly rely on free resources and figure things out on my own.",
        "I use a mix of free resources and occasional paid programs.",
        "Other – I’d like to describe my approach:"
      ]
    }
  ];

  // RENDER FIELD
  const renderField = (step) => {
    const value = formData[step.field];

    switch(step.type) {
      case "dropdown":
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [step.field]: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select an option</option>
            {step.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
                    const updated = e.target.checked
                      ? [...formData[step.field], opt]
                      : formData[step.field].filter((i) => i !== opt);
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
        return <textarea
          value={value}
          onChange={(e) => setFormData({ ...formData, [step.field]: e.target.value })}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder={step.placeholder || ""}
          required
        />;

      case "approach":
        return (
          <div className="space-y-3">
            {step.options.map((opt, idx) => (
              <div key={opt} className="p-2">
                <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="approachOption"
                    value={opt}
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

      default: return null;
    }
  };

  // HANDLE FORM SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const payload = { contactId, email, firstName, formData };

      const res = await fetch(WORKFLOW2_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errMsg = json.error || json.message || "Server error during analysis. Please try again.";
        setSubmitError(errMsg);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Submission failed. Please try again.");
      setLoading(false);
    }
  };

  const handleBack = () => { if(currentStep > 0) setCurrentStep((s) => s - 1); };

  if(success) {
    return (
      <div className="text-center py-20">
        <Confetti />
        <h2 className="text-3xl font-bold text-green-600 mb-4">Your Personalized AI Habit Blueprint™ is Ready!</h2>
        <p className="text-gray-700 mb-6">Click the button below to view your full blueprint report.</p>
        <a href={`/report/${contactId}`} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">View My Blueprint</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6 text-sm text-gray-600">
        <strong>Contact:</strong> {firstName || "Guest"} • <strong>Email:</strong> {email}
      </div>

    

{/* Step container with fixed min-height to prevent layout jumps */}
<div className="mb-6 min-h-[240px] relative overflow-hidden">
  <AnimatePresence mode="wait">
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, x: currentStep > prevStep ? 50 : -50, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: currentStep > prevStep ? -50 : 50, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} // cubic-bezier for natural feeling
      className="absolute inset-0 w-full"
    >
      {/* Step title */}
      <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
      {/* Step question */}
      <p className="text-gray-600 mb-6">{steps[currentStep].question}</p>
      {/* Step input */}
      <div className="mb-6">{renderField(steps[currentStep])}</div>
    </motion.div>
  </AnimatePresence>
</div>






      {submitError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{submitError}</div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={handleBack} disabled={currentStep===0 || loading} className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50">Back</button>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {loading ? "Processing..." : currentStep===steps.length-1 ? "Generate My Blueprint" : "Continue"}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">Step {currentStep+1} of {steps.length}</div>
    </form>
  );
}
