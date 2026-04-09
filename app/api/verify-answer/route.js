import { generateOpenAIContent } from '../../lib/openai';

export async function POST(request) {
    try {
        const { question, spoken, expected} = await request.json();

        const prompt = `You are a strict but fair English examiner.
Task: Fill in the Blank verification.
Original Sentence (with ___): "${question}"
Expected Key Word (suggested): "${expected}"
Student Spoken Sentence: "${spoken}"

Is the student's sentence a grammatically correct and logically valid completion of the blank? 
Even if they used a different word than expected, if it makes sense in context, it is CORRECT.

Output EXACTLY and ONLY a JSON object:
{"correct": true/false, "feedback": "Brief feedback if incorrect, or 'Perfect!'"}
Keep feedback under 5 words.`;

        const responseText = await generateOpenAIContent(prompt, { model: 'gpt-4o-mini' });
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return Response.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error('Verification error:', error);
        return Response.json({ correct: false, feedback: 'Error verifying.' }, { status: 500 });
    }
}
