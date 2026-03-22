import { generateOpenAIContent } from '../../../lib/openai';

export async function POST(request) {
    try {
        const { modeId, modeTitle, description } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return Response.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
        }

        const prompt = `You are a creative prompt generator for a speech practice application.
Produce exactly ONE creative, thought-provoking scenario prompt for the practice mode: "${modeTitle}" (${description}).
The prompt MUST BE EXTREMELY SHORT (under 12 words) and direct. Do not include any additional commentary, quotation marks, or prefixes. Make it specific and unique every time.`;

        const responseText = await generateOpenAIContent(prompt, { model: 'gpt-4o-mini' });

        return Response.json({ prompt: responseText.trim().replace(/^"|"$/g, '') });
    } catch (error) {
        console.error('Prompt generation error:', error);
        return Response.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}
