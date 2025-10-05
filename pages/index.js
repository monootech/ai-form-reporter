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
{
title: "The Foundation",
question: "Which areas do you currently track or want to start tracking?",
type: "checkbox",
field: "trackingAreas",
options: [
"Finances (budgeting, savings, income)",
"Health & Fitness (exercise, nutrition, wellness)",
"Learning & Skills (courses, reading, growth)",
"Focus & Productivity (deep work, time management)",
"Projects & Goals (progress, milestones, outcomes)"
]
},
{
title: "Your Success Style",
question: "What's your ideal accountability setup?",
type: "radio",
field: "accountabilityStyle",
options: [
"Self-tracking with great systems",
"Partner or small group accountability",
"Larger community with shared goals",
"Structured coaching or mentorship"
]
},
{
title: "Immediate Focus",
question: "What specific habit would make the biggest impact in the next 30 days?",
type: "text",
field: "thirtyDayFocus",
placeholder: "Describe the ONE habit that would create a breakthrough..."
},
{
title: "Future Self",
question: "Imagine your ideal day 6 months from now - what does it look like?",
type: "text",
field: "futureVision",
placeholder: "Paint a picture of your ideal day 6 months from now..."
},
{
title: "Technical Foundation",
question: "How would you describe your Google Sheets comfort level?",
type: "radio",
field: "sheetsSkillLevel",
options: [
"Beginner 🟢 — I can enter data but formulas confuse me",
"Intermediate 🟡 — I use basic formulas but advanced stuff feels overwhelming",
"Advanced 🔵 — I work with pivot tables, conditional formatting, maybe some scripts",
"Expert 🟣 — I build complex dashboards and automations regularly"
]
}
];

const handleSubmit = async (e) => {
e.preventDefault();

```
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
      contactId: contactId || `temp-${Date.now()}`,
      email: email || 'test@example.com',
      formData: formData
    })
  });

  // FIRST, get the response as text to see what we're getting
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
        reportId: contactId || `temp-${Date.now()}`
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
```

};

const renderField = (step) => {
switch (step.type) {
case 'dropdown':
return (
<select
value={formData[step.field]}
onChange={(e) => setFormData({...formData, [step.field]: e.target.value})}
className="w-full p-3 border border-gray-300 rounded-lg"
required
> <option value="">Select an option</option>
{step.options.map(option => ( <option key={option} value={option}>{option}</option>
))} </select>
);

```
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
```

};

return ( <div className="min-h-screen bg-gray-50 py-8"> <div className="max-w-2xl mx-auto px-4"> <h1 className="text-3xl font-bold text-center mb-8">
Personalized AI Habit Blueprint </h1>

```
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
```

);
}
