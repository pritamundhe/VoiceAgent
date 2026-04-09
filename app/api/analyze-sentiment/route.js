export async function POST(request) {
    try {
        const { text } = await request.json();
        if (!text) return Response.json({ error: 'No text provided' }, { status: 400 });

        const model = 'distilbert-base-uncased-finetuned-sst-2-english';
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
             console.warn("No HUGGINGFACE_API_KEY found. Falling back to default values.");
             return Response.json({ sentiment: { label: 'POSITIVE', score: 0.5 } });
        }

        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: text })
        });

        if (!response.ok) {
            throw new Error(`HF API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        
        // HF typically returns an array of label objects for classification models: e.g. [[{label: "POSITIVE", score: 0.99}, {label: "NEGATIVE", score: 0.01}]]
        let sentimentData = { label: 'POSITIVE', score: 0.5 }; // Default fallback
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
            // Sort by score and pick highest
            const bestMatch = data[0].sort((a, b) => b.score - a.score)[0];
            sentimentData = bestMatch;
        }

        return Response.json({ sentiment: sentimentData });
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return Response.json({ error: 'Failed to analyze text' }, { status: 500 });
    }
}
