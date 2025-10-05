// FILE: my_repo/pages/index.js (UPDATED VERSION)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accessValid, setAccessValid] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [formData, setFormData] = useState({
    primaryGoal: '',
    biggestFrustration: '',
    trackingAreas: [],
    accountabilityStyle: '',
    thirtyDayFocus: '',
    futureVision: '',
    sheetsSkillLevel: ''
  });

  // Validate email format using regex:cite[3]:cite[7]:cite[8]
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check access when component mounts or query parameters change
  useEffect(() => {
    if (router.isReady) {
      const isValid = !!(contactId && email && validateEmail(email));
      setAccessValid(isValid);
      setAccessChecked(true);
      
      if (!isValid) {
        console.warn('Invalid access - missing or invalid parameters:', { contactId, email });
      }
    }
  }, [router.isReady, contactId, email]);

  const steps = [
    // ... your existing steps array remains exactly the same ...
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
    // ... keep all other steps exactly as they were ...
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if access is not valid
    if (!accessValid) {
      alert('Invalid access. Please use the correct link from your email.');
      return;
    }

    // If not last step, just advance
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Last step - submit to backend
    setLoading(true);
    try {
      console.log('Submitting form data:', formData);
      
      const response = await fetch(process.env.NEXT_PUBLIC_ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId, // Remove fallback to test data
          email: email, // Remove fallback to test data
          formData: formData
        })
      });

      // ... rest of your existing handleSubmit code remains exactly the same ...
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      
      // Try to parse as JSON, but handle HTML responses
      if (responseText.trim().startsWith('<')) {
        // It's HTML - check if it contains success message
        if (responseText.includes('Success') || responseText.includes('succ')) {
          // If HTML but successful, create a mock success response
          result = {
            action: 'analysis_complete', 
            reportId: contactId
          };
          console.log('HTML response detected, using mock success:', result);
        } else {
          throw new Error(`Backend returned HTML: ${responseText.substring(0, 100)}`);
        }
      } else {
        // It's probably JSON
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
      }

      console.log('Processed response:', result);
      
      if (result.action === 'redirect_to_existing' || result.action === 'analysis_complete') {
        router.push(`/report/${result.reportId}`);
      } else {
        throw new Error(result.error || 'Unknown response from backend');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert(`Error: ${error.message}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (step) => {
    // ... your existing renderField function remains exactly the same ...
    switch (step.type) {
      case 'dropdown':
        return (
          <select
            value={formData[step.field]}
            onChange={(e) => setFormData({...formData, [step.field]: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select an option</option>
            {step.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-3">
            {step.options.map(option => (
              <label key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name={step.field}
                  value={option}
                  checked={formData[step.field] === option}
                  onChange={(e) => setFormData({...formData, [step.field]: e.target.value})}
                  className="text-green-600 focus:ring-green-500"
                  required
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-3">
            {step.options.map(option => (
              <label key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[step.field].includes(option)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...formData[step.field], option]
                      : formData[step.field].filter(item => item !== option);
                    setFormData({...formData, [step.field]: updated});
                  }}
                  className="text-green-600 focus:ring-green-500 rounded"
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <textarea
            value={formData[step.field]}
            onChange={(e) => setFormData({...formData, [step.field]: e.target.value})}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder={step.placeholder}
            required
          />
        );
      
      default:
        return null;
    }
  };

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Show error message if access is invalid
  if (!accessValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">
              It looks like you're trying to access this form directly. Please use the personalized link sent to your email or provided in your purchase summary page.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p>If you're already our customer, please click the correct link found in your email.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show normal form if access is valid
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Personalized AI Habit Blueprint</h1>

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
          
          {/* Dynamic Field Rendering */}
          <div className="mb-6">
            {renderField(steps[currentStep])}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
