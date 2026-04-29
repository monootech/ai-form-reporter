// first edition of success page, now from processing page the client is redirected to here, not to the report page


import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const router = useRouter();
  const { contactId } = router.query;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [showConfetti, setShowConfetti] = useState(true);

  // Load user data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("habitFormSubmission");

    if (stored) {
      const data = JSON.parse(stored);
      setFirstName(data.formData?.firstName || "");
      setEmail(data.formData?.email || "");
    }

    // stop confetti after 5s (performance + polish)
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const formattedDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const properCase = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const goToReport = () => {
    router.push(`/report/${contactId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-50 via-green-100 to-green-200 flex flex-col justify-center items-center py-20 px-4">

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-5xl font-extrabold text-green-800 mb-6 text-center"
      >
        🎯 Congratulations{firstName ? `, ${properCase(firstName)}` : ""}!
        <br />
        Your Habit Blueprint is Ready
      </motion.h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-700 mb-6 text-center max-w-lg">
        ✨ We’ve created a personalized system tailored to your goals, behaviors, and future vision.
      </p>

      {/* Date */}
      <p className="text-md text-gray-600 mb-4 text-center">
        📅 Generated on {formattedDate}
      </p>

      <div className="h-px bg-gray-300 my-8 w-24 mx-auto"></div>

      {/* Email */}
      {email && (
        <p className="text-gray-600 text-center mb-6">
          📧 Your full report has been sent to <strong>{email}</strong>
        </p>
      )}

      {/* Value block */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-gray-800 text-center max-w-lg mb-8"
      >
        This isn’t generic advice — it’s a structured blueprint designed to help you build better habits, eliminate friction, and move toward your goals with clarity.
      </motion.p>

      {/* CTA */}
      <motion.button
        onClick={goToReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition"
      >
        View My Full Blueprint →
      </motion.button>

      {/* Secondary note */}
      <p className="text-sm text-gray-500 mt-6 text-center max-w-md">
        You can also access your report anytime from your email.
      </p>

    </div>
  );
}
