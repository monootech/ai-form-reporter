// FILE: components/ReportHeader.js
export default function ReportHeader({ firstName, email, generatedAt }) {
  const properCase = (name) => {
    if (!name) return "";
    return name[0].toUpperCase() + name.slice(1).toLowerCase();
  };

  const formattedDate = new Date(generatedAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="text-center py-8 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mb-2">
        🎯 {properCase(firstName)}'s Personalized AI Habit Blueprint™
      </h1>
      <p className="text-lg md:text-xl text-gray-600 mb-4">
        ✨ Crafted just for you (to help you level up) — on {formattedDate}
      </p>
      <div className="h-px bg-gray-200 my-4 mx-auto w-24"></div>
      <p className="text-gray-500 mb-2">
        📧 A link to your full Habit Blueprint has been sent to your email ({email})
      </p>
      <p className="text-gray-400 text-sm mb-6">habitmasterysystem.com</p>
    </div>
  );
}
