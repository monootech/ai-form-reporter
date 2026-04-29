import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessingPage() {
  const router = useRouter();
  const { id: contactId } = router.query;

  const [submission, setSubmission] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [statusMessage, setStatusMessage] = useState("Preparing your answers...");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("answers"); // "answers" | "analysis" | "done"

  const pollIntervalRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Narrative-style messages
  const statusMessages = [
    "Reviewing your responses...",
    "Identifying behavior patterns...",
    "Comparing with high-performing profiles...",
    "Detecting improvement opportunities...",
    "Designing your personalized system...",
    "Finalizing your Habit Blueprint...",
  ];

  // Load submission
  useEffect(() => {
    if (!contactId) return;

    const stored = sessionStorage.getItem("habitFormSubmission");
    if (!stored) {
      setError("Submission data not found. Please try again.");
      return;
    }

    try {
      const data = JSON.parse(stored);
      if (data.contactId !== contactId) {
        setError("Invalid session. Please resubmit.");
        return;
      }
      setSubmission(data);
    } catch {
      setError("Failed to load submission.");
    }
  }, [contactId]);

  // Progress bar (time-based)
  useEffect(() => {
    const duration = 40000;
    const interval = 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / duration) * 100;
        return next >= 95 ? 95 : next;
      });
    }, interval);

    return () => clearInterval(progressTimerRef.current);
  }, []);

  // Main orchestration
  useEffect(() => {
    if (!submission) return;

    const { steps } = submission;

    // Animate answers with natural pacing
    let i = -1;

    const playAnswers = () => {
      i++;

      if (i < steps.length) {
        setCurrentStepIndex(i);

        const delay =
          i % 5 === 0 && i !== 0
            ? 1400 // thinking pause
            : 500 + Math.random() * 400;

        setTimeout(playAnswers, delay);
      } else {
        setPhase("analysis");
        rotateMessages();
      }
    };

    playAnswers();

    // Rotate messages during analysis
    let msgIndex = 0;
    const rotateMessages = () => {
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % statusMessages.length;
        setStatusMessage(statusMessages[msgIndex]);
      }, 3500);

      return interval;
    };

    // Poll backend
    const poll = async () => {
      try {
        const res = await fetch(`/api/get-report?id=${contactId}`);

        if (res.status === 200) {
          clearInterval(pollIntervalRef.current);
          clearInterval(progressTimerRef.current);

          setProgress(100);
          setPhase("done");
          setStatusMessage("Done! Preparing your results...");

          setTimeout(() => {
            router.push(`/report/${contactId}`);
          }, 1200);
        }
      } catch (err) {
        console.warn(err);
      }
    };

    pollIntervalRef.current = setInterval(poll, 2000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [submission, contactId, router]);

  const getAnswerText = (step, formData) => {
    const value = formData[step.field];
    if (!value) return "(Not answered)";
    if (Array.isArray(value)) return value.join(", ");
    return value;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full" />
      </div>
    );
  }

  const { steps, formData } = submission;
  const visibleSteps = steps.slice(0, currentStepIndex + 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            Building Your Blueprint
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This usually takes ~30 seconds. We’re analyzing your responses to generate a personalized plan.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
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

        {/* Status */}
        <motion.div
          key={statusMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow p-4 mb-6 text-center"
        >
          {statusMessage}
        </motion.div>





{/* Answer replay (IMPROVED UX - focus-based flow) */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden relative">

  <div className="bg-green-50 px-4 py-3 border-b">
    <h2 className="font-semibold text-green-800">
      Processing your responses
    </h2>
  </div>

  {/* CENTER FOCUS AREA */}
  <div className="p-6 min-h-[260px] flex flex-col justify-center">

    {/* CURRENT ACTIVE STEP */}
    <AnimatePresence mode="wait">
      {visibleSteps.length > 0 && (
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-sm text-gray-400 mb-1">
            Now processing
          </p>

          <p className="font-medium text-gray-800 text-lg">
            {visibleSteps[currentStepIndex]?.question}
          </p>

          <p className="text-green-700 mt-2 font-medium">
            {getAnswerText(
              visibleSteps[currentStepIndex],
              formData
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* STACKED PREVIOUS ANSWERS (NO SCROLL) */}
    <div className="space-y-2 mt-4">
      {visibleSteps
        .slice(Math.max(0, currentStepIndex - 2), currentStepIndex)
        .reverse()
        .map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-sm text-gray-500 flex justify-between"
          >
            <span className="truncate max-w-[70%]">
              {step.question}
            </span>
            <span className="text-gray-400 ml-3">
              ✓
            </span>
          </motion.div>
        ))}
    </div>
  </div>

  {/* FOOTER STATUS */}
  <div className="border-t px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
    {phase === "answers" && "Analyzing responses..."}
    {phase === "analysis" && statusMessage}
    {phase === "done" && "Finalizing your report..."}
  </div>
</div>






        {/* Phase 2 */}
        {phase !== "answers" && (
          <div className="text-center mt-6">
            <div className="animate-spin h-5 w-5 border-b-2 border-green-600 rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Generating your personalized plan...
            </p>
          </div>
        )}

        {/* Reassurance */}
        <p className="text-xs text-gray-400 text-center mt-6">
          You can safely leave this page — your report will still be generated.
        </p>
      </div>
    </div>
  );
}
