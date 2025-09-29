document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    
    // Show loading, hide form
    submitBtn.disabled = true;
    this.classList.add('hidden');
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value,
        goals: document.getElementById('goals').value,
        challenges: document.getElementById('challenges').value,
        email: document.getElementById('email').value,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Call your Vercel API
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ formData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success with report link
            document.getElementById('reportLink').href = data.reportUrl;
            loading.classList.add('hidden');
            result.classList.remove('hidden');
            
            // In a real app, you might want to store the report data
            // with the reportId for retrieval on the report page
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        alert('Error generating report: ' + error.message);
        // Reset form
        submitBtn.disabled = false;
        this.classList.remove('hidden');
        loading.classList.add('hidden');
    }
});
