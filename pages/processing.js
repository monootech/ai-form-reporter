// this page is added to act as an interactive processing screen that replays the user's answers with smooth animations, shows staged progress messages, and polls for the generated report in the background. Once the report is ready, the user is automatically redirected to it.

// pages/processing.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessingPage() {
  const router = useRouter();
  const { id: contactId } = router.query;

  const [submission, setSubmission] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = "preparing"
  const [statusMessage, setStatusMessage] = useState("Preparing your answers...");
  const [error, setError] = useState(null);
  const [pollingComplete, setPollingComplete] = useState(false);

  // Refs for timers
  const answerIntervalRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Status messages to rotate through
  const statusMessages = [
    "📋 Logging your answers...",
    "🔍 Analyzing your responses...",
    "🧠 Matching patterns against proven systems...",
    "✨ Generating your personalized insights...",
    "📊 Building your 30-day roadmap...",
    "✍️ Finalizing your Habit Blueprint...",
  ];

  // Load stored submission
  useEffect(() => {
    if (!contactId) return;

    const stored = sessionStorage.getItem("habitFormSubmission");
    if (!stored) {
      setError("Submission data not found. Please try submitting the form again.");
      return;
    }

    try {
      const data = JSON.parse(stored);
      // Validate that the contactId matches
      if (data.contactId !== contactId) {
        setError("Invalid session. Please refresh and resubmit.");
        return;
      }
      setSubmission(data);
    } catch (err) {
      setError("Could not load your submission details.");
    }
  }, [contactId]);

  // Start answer replay and progress messages once submission is loaded
  useEffect(() => {
    if (!submission) return;

    const totalSteps = submission.steps.length;

    // 1) Animate answers one by one
    answerIntervalRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          clearInterval(answerIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 700); // 0.7s per answer

    // 2) Rotate status messages every 4 seconds
    let msgIdx = 0;
    messageIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % statusMessages.length;
      setStatusMessage(statusMessages[msgIdx]);
    }, 4000);

    // 3) Start polling for report readiness
    const pollForReport = async () => {
      if (!contactId) return;
      try {
        const res = await fetch(`/api/get-report?id=${contactId}`);
        if (res.status === 200) {
          // Report exists! Stop all timers and redirect.
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
          if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPollingComplete(true);
          router.push(`/report/${contactId}`);
        } else if (res.status !== 404) {
          // An unexpected error, but we continue polling
          console.warn("Unexpected polling response:", res.status);
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    };

    pollIntervalRef.current = setInterval(pollForReport, 2000); // every 2 seconds

    // 4) Timeout after 60 seconds – show a fallback, but redirect if report arrives later
    timeoutRef.current = setTimeout(() => {
      setError(
        "Your report is taking longer than expected. It will be sent to your email once ready – no need to stay on this page."
      );
    }, 60000);

    // Cleanup on unmount or redirect
    return () => {
      if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [submission, contactId, router]);

  // Helper: get the human-readable answer for a given field
  const getAnswerText = (step, formData) => {
    const value = formData[step.field];
    if (value === undefined || value === "") return "(Not answered)";
    if (step.type === "checkbox") return value.join(", ");
    if (step.type === "approach") {
      if (value === step.options[step.options.length - 1]) {
        return `${value} – ${formData.approachOtherText || ""}`;
      }
      return value;
    }
    if (step.type === "dropdown" && step.options) {
      const opt = step.options.find((o) => o.startsWith(value));
      return opt || value;
    }
    return value;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Return to Form
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const { steps, formData } = submission;
  const totalSteps = steps.length;
  const visibleSteps = steps.slice(0, currentStepIndex + 1);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">Building Your Blueprint</h1>
          <p className="text-gray-600 mt-2">
            We're analyzing your answers to create a personalized Habit Blueprint.
          </p>
        </div>

        {/* Status message (animated) */}
        <motion.div
          key={statusMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-md rounded-xl p-4 mb-8 text-center border-l-4 border-green-500"
        >
          <p className="text-gray-700 font-medium">{statusMessage}</p>
        </motion.div>

        {/* Answer replay list */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 px-6 py-3 border-b border-green-100">
            <h2 className="font-semibold text-green-800">Your responses</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            <AnimatePresence>
              {visibleSteps.map((step, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 py-4 flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{step.question}</p>
                    <p className="text-gray-600 mt-1">{getAnswerText(step, formData)}</p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
            {currentStepIndex + 1 < totalSteps && (
              <li className="px-6 py-4 text-gray-400 italic">
                Loading more answers...
              </li>
            )}
          </ul>
        </div>

        {/* Live progress indicator */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {currentStepIndex + 1 < totalSteps ? (
            <p>✨ Processing your answers step by step</p>
          ) : (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>Finalizing your report – this may take a moment</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
