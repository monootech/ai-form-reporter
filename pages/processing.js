// GPT's 3rd revision, better UX implementation asked.

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessingPage() {
  const router = useRouter();
  const { id: contactId } = router.query;

  const [submission, setSubmission] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [processed, setProcessed] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Preparing...");
  const [phase, setPhase] = useState("processing"); // processing | analysis | generating
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  const statusMessages = [
    "Analyzing response patterns...",
    "Mapping behavioral tendencies...",
    "Comparing against proven frameworks...",
    "Extracting key insights...",
    "Building your system design...",
  ];

  // Load submission
  useEffect(() => {
    if (!contactId) return;

    const stored = sessionStorage.getItem("habitFormSubmission");

    if (!stored) {
      setError("Missing submission data.");
      return;
    }

    const data = JSON.parse(stored);

    if (data.contactId !== contactId) {
      setError("Invalid session.");
      return;
    }

    setSubmission(data);
  }, [contactId]);

  // Main orchestration (SLOW + HUMAN PACED)
  useEffect(() => {
    if (!submission) return;

    const steps = submission.steps;
    let i = 0;

    const runStep = async () => {
      if (i >= steps.length) {
        setPhase("analysis");
        return;
      }

      const step = steps[i];

      setCurrentIndex(i);

      // show status message rotation
      setStatusMessage(statusMessages[i % statusMessages.length]);

      // simulate processing time (IMPORTANT UX FIX)
      const delay = 1400 + Math.random() * 800;
      await new Promise((r) => setTimeout(r, delay));

      setProcessed((prev) => [
        {
          question: step.question,
          answer: submission.formData[step.field] || "(Not answered)",
        },
        ...prev, // newest goes on top (your requested ordering)
      ]);

      i++;
      runStep();
    };

    runStep();

    // Poll backend
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/get-report?id=${contactId}`);

        if (res.status === 200) {
          clearInterval(pollRef.current);

          setPhase("generating");

          setTimeout(() => {
            router.push(`/report/${contactId}`);
          }, 1500);
        }
      } catch {}
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [submission]);

  const getAnswer = (step, formData) => {
    const val = formData[step.field];
    if (!val) return "(Not answered)";
    return Array.isArray(val) ? val.join(", ") : val;
  };

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full" />
      </div>
    );
  }

  const currentStep = submission.steps[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-700">
            Building Your Blueprint
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            This takes ~30 seconds while we generate your personalized system.
          </p>
        </div>

        {/* PHASE 1: PROCESSING CARD */}
        {phase === "processing" && currentStep && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <p className="text-xs text-gray-400 mb-2">
              Now processing
            </p>

            <h2 className="text-lg font-semibold text-gray-800">
              {currentStep.question}
            </h2>

            <p className="text-green-700 mt-3 font-medium">
              {getAnswer(currentStep, submission.formData)}
            </p>
          </motion.div>
        )}

        {/* ANALYSIS STATUS */}
        {phase === "analysis" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow p-4 text-center"
          >
            <p className="text-gray-700 font-medium">
              {statusMessage}
            </p>

            <div className="mt-3 flex justify-center">
              <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </motion.div>
        )}

        {/* GENERATING STATE */}
        {phase === "generating" && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              Generating your personalized plan...
            </p>
          </div>
        )}

        {/* PROCESSED RESPONSES (SECONDARY PANEL) */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">
              Processed responses
            </h3>
          </div>

          <div className="max-h-72 overflow-y-auto p-4 space-y-4">
            {processed.map((item, idx) => (
              <div key={idx} className="border-b pb-3 last:border-none">
                <p className="font-semibold text-gray-800">
                  {item.question}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {item.answer}
                </p>
              </div>
            ))}

            {processed.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                Waiting for responses...
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
