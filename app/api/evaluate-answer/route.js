import { generateOpenAIContent } from '../../../lib/openai';

const MODE_CONTEXTS = {
    'interview': 'job interview. Evaluate if the answer is relevant, substantial, and demonstrates experience or thought.',
    'public-speaking': 'public speaking exercise. Evaluate if they delivered a coherent speech on the topic with some structure.',
    'pitch': 'startup/technical pitch exercise. Evaluate if they explained the concept clearly and persuasively.',
    'group-discussion': 'group discussion/debate. Evaluate if they made a coherent argument or point on the topic.',
    'sales': 'sales pitch scenario. Evaluate if they made a persuasive attempt to sell or convince.',
    'storytelling': 'storytelling exercise. Evaluate if they told a story or narrative related to the prompt.',
    'negotiation': 'negotiation scenario. Evaluate if they attempted to negotiate or assert a position.',
    'networking': 'networking/conversation exercise. Evaluate if they made a conversational and relevant response.',
    'media-interview': 'media/press interview. Evaluate if they gave a composed and on-message response.',
    'conflict-resolution': 'conflict resolution scenario. Evaluate if they addressed the situation constructively.',
    'teaching': 'teaching/explanation exercise. Evaluate if they explained the concept clearly.',
    'client-update': 'client update presentation. Evaluate if they communicated the update clearly and professionally.',
};

export async function POST(request) {
    try {
        const { question, answer, followUpCount = 0, mode = '', modeTitle = '', part = '' } = await request.json();

        if (!question || !answer || answer.trim().length < 3) {
            return Response.json({
                satisfied: false,
                followUp: "I didn't catch that. Could you try answering again?"
            });
        }

        const context = MODE_CONTEXTS[mode] || `${modeTitle || 'speaking'} exercise. Evaluate if the response is relevant and substantive.`;

        let prompt = `You are evaluating a student's spoken response in a ${context}

Prompt/Scenario: "${question}"
Student's Response: "${answer}"
Follow-up attempt number: ${followUpCount}

Criteria for SATISFIED:
- Response is relevant to the prompt/scenario
- Has at least 2-3 sentences or meaningful content (not just 1-2 words)
- Shows some thought, effort, or attempt at the task

If NOT satisfied, write an encouraging follow-up that helps them give a better answer.
The follow-up should be warm, specific to the prompt, and under 20 words.

Output ONLY valid JSON, nothing else:
{"satisfied": true, "followUp": null}
OR
{"satisfied": false, "followUp": "Your encouraging follow-up here"}`;

        if (part === 'listening') {
            prompt = `You are evaluating a student's spoken response to a listening exercise.

Original Audio Transcript: "${question}"
Student's Response: "${answer}"
Follow-up attempt number: ${followUpCount}

Criteria for SATISFIED:
- The student's response accurately reflects the meaning, summary, or exact dictation of the original audio transcript.
- It is an appropriate and correct response to the listening audio.

If SATISFIED, output {"satisfied": true, "followUp": "Correct!"}
If NOT satisfied, output an encouraging follow-up (under 20 words) explaining they missed the mark: {"satisfied": false, "followUp": "Not quite! Listen closely and try again."}

Output ONLY valid JSON, nothing else.`;
        } else if (part === 'reading') {
            prompt = `You are evaluating a student's read-aloud response.

Text to Read: "${question}"
Student's Spoken Response: "${answer}"
Follow-up attempt number: ${followUpCount}

Criteria for SATISFIED:
- The student's spoken response closely matches the text they were supposed to read. Minor pronunciation errors or one or two missed words are okay, but the core text must be read correctly.

If SATISFIED, output {"satisfied": true, "followUp": "Excellent reading!"}
If NOT satisfied, output an encouraging follow-up (under 20 words) explaining they missed some words: {"satisfied": false, "followUp": "You missed a few words. Let's try reading it again."}

Output ONLY valid JSON, nothing else.`;
        }

        const responseText = await generateOpenAIContent(prompt, { model: 'gpt-4o-mini' });
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        return Response.json(result);
    } catch (error) {
        console.error('Evaluate answer error:', error);
        // On error, be lenient and move on
        return Response.json({ satisfied: true, followUp: null });
    }
}
