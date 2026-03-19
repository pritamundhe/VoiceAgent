import { generateDeepSeekContent } from '../../../lib/deepseek';
import { calculateMetrics } from '../../../lib/analytics';

export async function POST(request) {
    try {
        const { transcript, duration, mode, prompt: userPrompt } = await request.json();

        if (!transcript) {
            return Response.json({ error: 'No transcript provided' }, { status: 400 });
        }

        // 1. Calculate base metrics
        const metrics = calculateMetrics(transcript, duration);
        if (!metrics) {
            return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
        }

        // 2. Core DeepSeek Analysis
        if (!process.env.DEEPSEEK_API_KEY) {
            return Response.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
        }

        const aiPrompt = `
        You are an expert speech coach. Analyze the following transcript from a "${mode}" session.
        The user was responding to this prompt: "${userPrompt || 'General Practice'}"
        
        Metrics already calculated:
        - WPM: ${metrics.wpm}
        - Total Words: ${metrics.totalWords}
        - Filler Word Rate: ${(metrics.totalFillers / metrics.totalWords * 100).toFixed(1)}%
        - Vocabulary Richness: ${metrics.vocabRichness}
        
        Transcript: 
        "${transcript}"
        
        Instruction: 
        Provide a structured evaluation in JSON format with these exact keys:
        - topic: (Briefly identify what the user spoke about)
        - feedback: (A supportive 2-3 sentence summary of the performance)
        - suggestions: (An array of exactly 3 tactical, short improvement tips)
        - confidenceScore: (A score from 0 to 100 based on word flow and certainty)
        
        Return ONLY the JSON. No conversational text.
        `;

        const aiResponseText = await generateDeepSeekContent(aiPrompt, { model: 'deepseek-chat' });
        
        let aiAnalysis;
        try {
            // Remove markdown format if any
            const cleaned = aiResponseText.replace(/```json|```/g, '').trim();
            aiAnalysis = JSON.parse(cleaned);
        } catch (pe) {
            console.error('AI JSON Parse Error:', pe, aiResponseText);
            aiAnalysis = {
                topic: "General Speech",
                feedback: "Analyzed your speech session but encountered a technical error in parsing detailed feedback.",
                suggestions: ["Focus on reducing filler words.", "Try to vary your pace more.", "Speak with more intent."],
                confidenceScore: 70
            };
        }

        console.log(`\n✅ [SESSION ANALYSIS] Report generated successfully!`);
        console.log(`   - Topic: ${aiAnalysis.topic}`);
        console.log(`   - Fluency Score: ${metrics.fluencyScore}`);
        console.log(`   - Words: ${metrics.totalWords}\n`);

        return Response.json({
            metrics,
            aiAnalysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Session analysis error:', error);
        return Response.json({ error: 'Failed to analyze session', details: error.message }, { status: 500 });
    }
}
