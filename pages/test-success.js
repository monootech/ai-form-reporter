import Confetti from "react-confetti";

export default function TestSuccess() {
  const firstName = "Mojtaba";      // mock name
  const email = "mojtaba@example.com"; // mock email
  const contactId = "12345";        // mock contact ID

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
    return name[0].toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="text-center py-20 px-4 max-w-2xl mx-auto">
      <Confetti />

      {/* Main Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mb-2">
        🎯 {properCase(firstName)}'s Personalized AI Habit Blueprint™
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-gray-600 mb-4">
        ✨ Crafted just for you (to help you level up) — on {formattedDate}
      </p>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-4 mx-auto w-24"></div>

      {/* Email Info */}
      <p className="text-gray-500 mb-2">
        📧 A link to your full Habit Blueprint has been sent to your email ({email})
      </p>

      {/* Branding */}
      <p className="text-gray-400 text-sm mb-6">habitmasterysystem.com</p>

      {/* View Report Button */}
      <a
        href={`/report/${contactId}`}
        className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        View My Blueprint
      </a>
    </div>
  );
}
