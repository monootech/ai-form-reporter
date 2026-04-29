// 2nd edition of success page, improved copy and removed the buttonn for now, instead telling them to check their emails.


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

  // Load user data
  useEffect(() => {
    const stored = sessionStorage.getItem("habitFormSubmission");

    if (stored) {
      const data = JSON.parse(stored);
      setFirstName(data.formData?.firstName || "");
      setEmail(data.formData?.email || "");
    }

    // stop confetti after 5s
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Date (uses user's browser locale automatically)
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const properCase = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
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

      {/* Email Confirmation */}
      {email && (
        <p className="text-gray-600 text-center mb-6">
          📧 Your full Habit Blueprint has been sent to <strong>{email}</strong>
        </p>
      )}

      {/* Emotional payoff / value */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-gray-800 text-center max-w-lg mb-10"
      >
        This isn’t just another report — it’s a structured plan designed specifically for you to break patterns, build momentum, and move toward the version of yourself you’ve been aiming for.
      </motion.p>

      {/* NEXT STEPS BLOCK */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg max-w-lg text-center"
      >
        <h2 className="text-2xl font-semibold text-green-800 mb-4">
          🚀 Your Next Steps
        </h2>

        <p className="text-gray-700 mb-4">
          Keep an eye on your inbox — your personalized Habit Blueprint is on its way.
        </p>

        <p className="text-gray-700 mb-4">
          📧 We’ve sent it to <strong>{email}</strong>
        </p>

        <p className="text-gray-700 mb-4">
          Inside, you’ll discover the key patterns shaping your behavior, along with clear steps to help you improve faster and more effectively.
        </p>

        <p className="text-gray-600">
          You’ve already taken the hardest step — starting.
          <br />
          Now it’s time to build momentum.
        </p>
      </motion.div>

      {/* Subtle anticipation builder */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-sm text-gray-500 mt-8 text-center max-w-md"
      >
        (Tip: If you don’t see the email within a minute, check your Spam, Trash, Promotions, Social or Updates folder and add support@habitmasterysystem.com to your contacts.)
      </motion.p>

    </div>
  );
}
