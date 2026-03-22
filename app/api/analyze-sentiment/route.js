import { pipeline } from '@xenova/transformers';

class PipelineSingleton {
    static task = 'text-classification';
    static model = 'DistilBERT/distilbert-base-uncased-finetuned-sst-2-english';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

export async function POST(request) {
    try {
        const { text } = await request.json();
        if (!text) return Response.json({ error: 'No text provided' }, { status: 400 });

        const classifier = await PipelineSingleton.getInstance();
        const result = await classifier(text);
        
        return Response.json({ sentiment: result[0] });
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return Response.json({ error: 'Failed to analyze text' }, { status: 500 });
    }
}
