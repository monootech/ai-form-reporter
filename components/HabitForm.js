import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

export default function HabitForm({ contactId, email, firstName }) {
  const router = useRouter();
//  const WORKFLOW2_URL = "/api/submit-form";



  // --- Submission state for report ---
  const [submitSuccess, setSubmitSuccess] = useState(false);   // true if form submitted successfully
  const [reportUrl, setReportUrl] = useState("");              // store URL of generated report
  const [submitError, setSubmitError] = useState("");          // error messages for submission
  const [isSubmitting, setIsSubmitting] = useState(false);     // track if submission is in progress



  // --- Form navigation ---
  const [currentStep, setCurrentStep] = useState(0);           // track current question step
  const [prevStep, setPrevStep] = useState(0);                 // track previous step (for animations)



  // --- Form data ---
  const [formData, setFormData] = useState({
    primaryGoal: "",
    biggestFrustration: "",
    trackingAreas: [],
    accountabilityStyle: "",
    thirtyDayFocus: "",
    futureVision: "",
    sheetsSkillLevel: "",
    approachOption: "",
    approachOtherText: "",
    backgroundSkills: "",    // NEW: user's education, skills, expertise
    goalsAmbitions: ""       // NEW: user's goals, ambitions, motivations
  });



  // --- Steps and questions configuration ---
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
        "Advanced 🔵 — I work with pivot tables, conditional formatting, and some advanced formulas such as LookUps, Query, etc...",
        "Expert 🟣 — I build complex dashboards and automations regularly"
      ]
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
    },
    {
  title: "About You (Optional, Highly Recommended)",
  question: "Tell us about yourself: your education, skills, professional experience, hobbies, and anything you’re proud of. What do you enjoy doing most, and what frustrates you?",
<p className="text-gray-500 text-sm mb-2">Optional but highly recommended — the more details you share, the more personalized your habit blueprint will be! </p>,
  type: "text",
  field: "backgroundSkills",
  placeholder: "For example: 'I have 5 years in marketing, I enjoy creative problem-solving, I struggle with staying consistent…'"
},
{
  title: "Your Goals & Ambitions (Optional, Highly Recommended)",
  question: "What are your biggest goals, ambitions, or dreams right now — personal, professional, or creative? What motivates you, and what usually holds you back?",
<p className="text-gray-500 text-sm mb-2">
  Optional but highly recommended — the more details you share, the more personalized your habit blueprint will be!
</p>,
  type: "text",
  field: "goalsAmbitions",
  placeholder: "For example: 'I want to run my own business, stay fit, and become an expert in data analytics…'"
}

  ];



  // --- Render field dynamically based on step type ---
  const renderField = (step) => {
    const value = formData[step.field];

    switch (step.type) {

      // Dropdown input
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
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      // Radio input
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

      // Checkbox input
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

      // Textarea input
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

      // Custom approach field with optional textarea
      case "approach":
        return (
          <div className="space-y-3">
            {step.options.map((opt) => (
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

      default:
        return null;
    }
  };








  // --- Handle form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Move to next step if not at end
    if (currentStep < steps.length - 1) {
      setPrevStep(currentStep);
      setCurrentStep((s) => s + 1);
      return;
    }

    // Last step → submit form
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const payload = { contactId, email, firstName, formData };
      console.log("Submitting payload to submit-form -> Workflow 2:", payload);

      const res = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });


const json = await res.json();        // res.json() will handle parsing safely.

      
      
  /*   // Remove manual res.text() and double parsing       // No risk of double-reading the body.
      
      const rawText = await res.text();
      console.log("Raw Workflow2 response:", rawText);

      let json;
      try {
        json = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        console.error("Failed to parse Workflow2 response:", parseErr);
        throw new Error("Invalid JSON returned from Workflow 2");
      }
  */
      
      if (!res.ok) {
        console.error("Workflow2 HTTP error:", res.status, json);
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      if (!json?.success || !json?.data?.reportUrl) {
        throw new Error("Submission succeeded but report URL is missing");
      }

      // ✅ Successful submission → save report URL
      setReportUrl(json.data.reportUrl);
      setSubmitSuccess(true);
      setSubmitError("");

    } catch (err) {
      console.error("Form submission error:", err);
      setSubmitError(err.message || "Submission failed. Please try again.");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };









  // --- Handle going back a step ---
  const handleBack = () => {
    if (currentStep > 0) {
      setPrevStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  };



  // --- Show success screen if report ready ---
  if (submitSuccess) {
    return (
      <div className="text-center py-20">
        <Confetti />
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Your Personalized AI Habit Blueprint™ is Ready!
        </h2>
        <p className="text-gray-700 mb-6">
          Click the button below to view your full blueprint report.
        </p>
        <a
          href={`/report/${contactId}`}
          // target="_blank"
          // rel="noopener noreferrer"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          View My Blueprint
        </a>
      </div>
    );
  }



  // --- Default form render ---
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">

      {/* --- Contact info display --- */}
      <div className="mb-6 text-sm text-gray-600">
        <strong>Contact:</strong> {firstName || "Guest"} • <strong>Email:</strong> {email}
      </div>



      {/* --- Question Section --- */}
      <div className="mb-6 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}  // slide up from bottom & fade
            animate={{ opacity: 1, y: 0 }}   // move to center
            exit={{ opacity: 0, y: -20 }}    // slide up & fade out
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
          >
            {/* Question title */}
            <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>

            {/* Question text */}
            <p className="text-gray-600 mb-6">{steps[currentStep].question}</p>

            {/* Options / input field */}
            <div className="mb-6">{renderField(steps[currentStep])}</div>
          </motion.div>
        </AnimatePresence>
      </div>



      {/* --- Error Message --- */}
      {submitError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {submitError}
        </div>
      )}



      {/* --- Navigation Buttons --- */}
      <div className="flex justify-between mt-4">

        {/* Back Button */}
        <motion.button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50"
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          Back
        </motion.button>

        {/* Continue / Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          whileHover={{ x: 4, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {isSubmitting
            ? "Processing..."
            : currentStep === steps.length - 1
            ? "Generate My Blueprint"
            : "Continue"}
        </motion.button>
      </div>



      {/* --- Step Indicator --- */}
      <div className="mt-4 text-sm text-gray-600">
        Step {currentStep + 1} of {steps.length}
      </div>

    </form>
  );
}
