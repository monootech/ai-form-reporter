import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { formData, generatedTags } = req.body || {};

  if (!formData) return res.status(400).json({ error: 'Missing formData' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    }

    const prompt = `
Create a personalized habit blueprint for someone who wants to improve their ${formData.primaryGoal}.

Their main challenge: ${formData.biggestFrustration}
Their 30-day focus: ${formData.thirtyDayFocus}
Their future vision: ${formData.futureVision}

Provide:
1. Quick wins
2. 30-day plan
3. Strategies for consistency
4. Tracking methods
`;

    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

    return res.status(200).json({ analysis, aiSuccess: true, analysisLength: analysis.length });

  } catch (err) {
    console.error('Gemini AI error:', err);

    const fallback = `
# Personalized Habit Blueprint

## Quick Start Guide
Based on your goal to improve **${formData.primaryGoal}**, here's your action plan:

### Immediate Actions (Week 1)
1. Start small daily sessions
2. Track your progress
3. Set clear targets

### 30-Day Roadmap
- Week 1: Small wins
- Week 2: Increase gradually
- Week 3: Refine
- Week 4: Solidify

### Success Tips
- Focus on consistency
- Celebrate small wins
- Adjust approach
`;

    return res.status(200).json({ analysis: fallback, aiSuccess: false, aiError: err.message, analysisLength: fallback.length });
  }
}
