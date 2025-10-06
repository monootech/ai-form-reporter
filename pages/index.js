// FILE: pages/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { email, contactId } = router.query;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validClient, setValidClient] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    primaryGoal: '',
    biggestFrustration: '',
    trackingAreas: [],
    accountabilityStyle: '',
    thirtyDayFocus: '',
    futureVision: '',
    sheetsSkillLevel: ''
  });

  // Steps configuration (keep your existing steps array)
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
    // ... keep all your existing steps exactly as they are
  ];

  // Validate client on page load
  useEffect(() => {
    const validateClient = async () => {
      if (!contactId || !email) {
        setValidClient(false);
        setValidationError('Missing required parameters. Please use the link sent to your email.');
        return;
      }

      try {
        console.log('🔍 Validating client...', { contactId, email });
        const response = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contactId, 
            email, 
            formData: {} // Empty for validation
          })
        });

        const result = await response.json();
        console.log('✅ Validation response:', result);

        if (result.valid || result.success) {
          setValidClient(true);
        } else {
          setValidClient(false);
          setValidationError(result.error || 'Invalid client. Please use the correct link from your email or purchase page.');
        }
      } catch (error) {
        console.error('❌ Validation error:', error);
        setValidClient(false);
        setValidationError('Unable to validate your access. Please try again or contact support.');
      }
    };

    if (contactId && email) {
      validateClient();
    } else {
      setValidClient(false);
      setValidationError('Missing required parameters. Please use the link sent to your email.');
    }
  }, [contactId, email]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Submitting form data...', formData);
      
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          email,
          formData: formData
        })
      });

      const result = await response.json();
      console.log('✅ Backend response:', result);
      
      if (result.action === 'analysis_complete' || result.success) {
        router.push(`/report/${result.reportId || contactId}`);
      } else {
        throw new Error(result.error || 'Unknown error from backend');
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(`Error: ${error.message}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  // Keep your existing renderField function exactly as is
  const renderField = (step) => {
    // ... your existing renderField implementation
  };

  // Show loading while validating
  if (validClient === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your access...</p>
        </div>
      </div>
    );
  }

  // Show error if invalid client
  if (validClient === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">{validationError}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p><strong>Note:</strong> You must be an existing client to access this form.</p>
              <p className="mt-2">Please click the correct link found in your email or purchase summary page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the form for valid clients (keep your existing form JSX)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Your existing form JSX goes here */}
    </div>
  );
}
