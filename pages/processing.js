// GPT's 7th revision, wasn't redirecting to success page at all. fixed that.

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function ProcessingPage() {
  const router = useRouter();
  const { id: contactId } = router.query;

  const [submission, setSubmission] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [processed, setProcessed] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Preparing your Blueprint...");
  const [phase, setPhase] = useState("processing");
  const [progress, setProgress] = useState(0);
  const [showLeaveNote, setShowLeaveNote] = useState(false);
  const [showDelayNotice, setShowDelayNotice] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const progressRef = useRef(null);
  const sequenceRef = useRef(null);
  
  const startTimeRef = useRef(Date.now());
  const MIN_PROCESSING_TIME = 15000; // 15 seconds minimum

  const statusMessages = [
    "Reviewing your responses...",
    "Identifying behavioral patterns...",
    "Mapping success signals...",
    "Detecting improvement opportunities...",
    "Designing your personalized Blueprint...",
  ];

  // FINAL SEQUENTIAL MESSAGES
const finalMessages = [
  "Reviewing your responses...",
  "Organizing your input data...",
  "Identifying behavior patterns...",
  "Mapping your current habits...",
  "Analyzing strengths and bottlenecks...",
  "Comparing with high-performing profiles...",
  "Detecting improvement opportunities...",
  "Prioritizing high-impact changes...",
  "Designing your personalized system...",
  "Structuring your habit framework...",
  "Optimizing for consistency and results...",
  "Finalizing your Habit Blueprint..."
];

  const [finalIndex, setFinalIndex] = useState(0);

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

  // PROGRESS BAR (30s now)
  useEffect(() => {
    const duration = 20000;
    const interval = 100;

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / duration) * 100;
        return next >= 95 ? 95 : next;
      });
    }, interval);

    return () => clearInterval(progressRef.current);
  }, []);

  // leave note
  useEffect(() => {
    const t = setTimeout(() => {
      setShowLeaveNote(true);
    }, 5000);

    return () => clearTimeout(t);
  }, []);

  // delay notice
  useEffect(() => {
    const t = setTimeout(() => {
      setShowDelayNotice(true);
    }, 15000);

    return () => clearTimeout(t);
  }, []);

  // FINAL MESSAGE SEQUENCE (2–3s each, no loop)
  useEffect(() => {
    if (phase !== "analysis" && phase !== "generating") return;

    let i = 0;

    const runSequence = () => {
      if (i >= finalMessages.length - 1) return;

      const delay = 1400 + Math.random() * 600; // ~1.4–2s (feels faster but still natural)

      sequenceRef.current = setTimeout(() => {
        i++;
        setFinalIndex(i);
        runSequence();
      }, delay);
    };

    setFinalIndex(0);
    runSequence();

    return () => clearTimeout(sequenceRef.current);
  }, [phase]);

  // main orchestration
  useEffect(() => {
    if (!submission) return;

    const steps = submission.steps;
    let i = 0;

    const run = async () => {
      if (i >= steps.length) {
        setPhase("analysis");
        return;
      }

      const step = steps[i];
      setCurrentIndex(i);

      setStatusMessage(statusMessages[i % statusMessages.length]);

      const delay = 600 + Math.random() * 400;
      await new Promise((r) => setTimeout(r, delay));

      setProcessed((prev) => [
        {
          question: step.question,
          answer: submission.formData[step.field] || "(Not answered)",
        },
        ...prev,
      ]);

      i++;
      run();
    };

    run();

    // polling
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/get-report?id=${contactId}`);

   
        
        
if (res.status === 200) {
  const elapsed = Date.now() - startTimeRef.current;

// fallback: force continue after 20s no matter what
const FORCE_TIMEOUT = 20000;


if (elapsed < MIN_PROCESSING_TIME && elapsed < FORCE_TIMEOUT) {
    return; // ⛔ wait until minimum time passes
  }

  clearInterval(pollRef.current);
  clearInterval(progressRef.current);

 setPhase("generating");

// smooth finish from 95 → 100
setProgress(100);

setTimeout(() => {
  router.push(`/success/${contactId}`);
}, 1200);

  
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

  const steps = submission.steps;
  const currentStep = steps[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-700">
            Building Your Personalized Blueprint
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            This takes ~30 seconds while we design your system based on your responses.
          </p>

          {showLeaveNote && (
            <p className="text-xs text-gray-400 mt-2">
              You can safely leave this page — your report will still be generated and sent to your email.
            </p>
          )}
        </div>

        {/* PROGRESS */}
        <div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {Math.round(progress)}%
          </p>
        </div>

        {/* ACTIVE CARD */}
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

            <p className="text-xs text-gray-400 mt-4 animate-pulse">
              Processing…
            </p>
          </motion.div>
        )}

        {/* ANALYSIS */}
        {phase === "analysis" && (
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

            <p className="text-gray-700 font-medium">
              Designing your personalized Blueprint...
            </p>

            {/* FINAL MESSAGE UNDER IT */}
            <p className="text-sm text-green-700 mt-2 font-medium transition-opacity duration-300">
              {finalMessages[finalIndex]}
            </p>
          </div>
        )}

        {/* GENERATING */}
        {phase === "generating" && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

            <p className="font-semibold text-gray-800">
              Generating your personalized Blueprint...
            </p>

            {/* CONTINUE SHOWING FINAL MESSAGE */}
            <p className="text-sm text-green-700 mt-2 font-medium">
              {finalMessages[finalIndex]}
            </p>

            {showDelayNotice && (
              <p className="text-sm text-gray-500 mt-3">
                Your report is taking longer than expected. It will be sent to your email once ready (in about 1–2 minutes) – no need to stay on this page.
              </p>
            )}
          </div>
        )}

        {/* PROCESSED RESPONSES */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">
              Processed responses
            </h3>
          </div>

          <div className="max-h-72 overflow-y-auto p-4 space-y-4">
            {processed.map((item, idx) => (
              <div key={idx} className="border-b pb-3 last:border-none">
                <p className="font-semibold text-gray-800 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {item.question}
                </p>
                <p className="text-gray-600 text-sm mt-1 pl-5">
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
