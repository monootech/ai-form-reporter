// FILE: my_repo/pages/index.js (REPLACE ENTIRE FILE)
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    primaryGoal: '',
    biggestFrustration: '',
    trackingAreas: [],
    accountabilityStyle: '',
    thirtyDayFocus: '',
    futureVision: '',
    sheetsSkillLevel: ''
  });

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
    // Add other steps here...
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId || `temp-${Date.now()}`,
          email: email || 'unknown@example.com',
          formData
        })
      });

      const result = await response.json();
      
      if (result.action === 'redirect_to_existing' || result.action === 'analysis_complete') {
        router.push(`/report/${result.reportId}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Personalized AI Habit Blueprint
        </h1>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mb-6">{steps[currentStep].question}</p>
          
          {/* Form fields will go here */}
          <div className="mb-6">
            {steps[currentStep].type === 'dropdown' && (
              <select 
                value={formData[steps[currentStep].field]}
                onChange={(e) => setFormData({
                  ...formData, 
                  [steps[currentStep].field]: e.target.value
                })}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select an option</option>
                {steps[currentStep].options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Back
            </button>
            
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 
               currentStep === steps.length - 1 ? 'Generate My Blueprint' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
