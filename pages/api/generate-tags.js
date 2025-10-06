export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { formData } = req.body || {};

  if (!formData) return res.status(400).json({ error: 'Missing formData' });

  try {
    const tags = [];

    // Goal-based
    if (formData.primaryGoal?.includes('Finances')) tags.push('Goal_Financial_Clarity');
    if (formData.primaryGoal?.includes('Fitness') || formData.primaryGoal?.includes('Health')) tags.push('Goal_Health_Fitness');
    if (formData.primaryGoal?.includes('Learning') || formData.primaryGoal?.includes('Growth')) tags.push('Goal_Learning_Growth');
    if (formData.primaryGoal?.includes('Focus') || formData.primaryGoal?.includes('Productivity')) tags.push('Goal_Productivity_Projects');

    // Frustration-based
    if (formData.biggestFrustration?.includes('consistency')) tags.push('Obstacle_Discipline_Consistency');
    if (formData.biggestFrustration?.includes('overwhelm')) tags.push('Obstacle_Overwhelm');
    if (formData.biggestFrustration?.includes('accountability')) tags.push('Obstacle_Accountability_Lacking');

    return res.status(200).json({
      generatedTags: [...new Set(tags)],
      tagGenerationSuccess: true
    });

  } catch (err) {
    console.error('Tag generation error:', err);
    return res.status(500).json({
      generatedTags: [],
      tagGenerationSuccess: false,
      tagError: err.message
    });
  }
}
