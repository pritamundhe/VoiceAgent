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
        const { question, answer, followUpCount = 0, mode = '', modeTitle = '', part = '', chatHistory = [], nextQuestion = null } = await request.json();

        if (!question || !answer || answer.trim().length < 3) {
            return Response.json({
                satisfied: false,
                aiResponse: "I didn't quite catch that. Could you try answering again?"
            });
        }

        const context = MODE_CONTEXTS[mode] || `${modeTitle || 'speaking'} exercise.`;
        
        const historyText = chatHistory.length > 0 
            ? chatHistory.slice(-4).map(m => `${m.role === 'ai' ? 'Coach' : 'User'}: ${m.content}`).join('\n') 
            : 'No prior history.';

        let prompt = `You are a conversational speaking coach conducting a ${context}

Current Question / Topic: "${question}"
Student's Latest Answer: "${answer}"
Conversation History (last few turns):
${historyText}

Follow-up attempt number: ${followUpCount}

Criteria for SATISFIED:
- Response is relevant to the question in any way, even loosely
- Accept short or casual answers (e.g., "ok ok", "yes", or brief thoughts)
- Do NOT be overly strict. If it relates to the topic, mark as SATISFIED.

TASK:
1. Determine if you are SATISFIED with the answer.
2. Write your next spoken response (aiResponse).

If NOT satisfied:
Your \`aiResponse\` should be an encouraging, natural follow-up asking them to elaborate or try again. (Under 20 words).

If SATISFIED:
Your \`aiResponse\` should acknowledge their good answer naturally (e.g., "That's a great point about X.") AND seamlessly ask them the next question in the queue.
Next Question to ask: ${nextQuestion ? `"${nextQuestion}"` : "None. Congratulate them on finishing."}

Output ONLY valid JSON, nothing else:
{"satisfied": boolean, "aiResponse": "Your spoken text here"}`;

        if (part === 'listening') {
            prompt = `You are evaluating a student's spoken response to a listening exercise.

Original Audio Transcript: "${question}"
Student's Response: "${answer}"

Criteria for SATISFIED:
- The student's response accurately reflects the meaning of the original audio transcript.

If SATISFIED, output {"satisfied": true, "aiResponse": "Correct! Let's move on to the next one."}
If NOT satisfied, output {"satisfied": false, "aiResponse": "Not quite! Listen closely and try again."}

Output ONLY valid JSON, nothing else.`;
        } else if (part === 'reading') {
            prompt = `You are evaluating a student's read-aloud response.

Text to Read: "${question}"
Student's Spoken Response: "${answer}"

Criteria for SATISFIED:
- The student's spoken response closely matches the text they were supposed to read.

If SATISFIED, output {"satisfied": true, "aiResponse": "Excellent reading! Next one."}
If NOT satisfied, output {"satisfied": false, "aiResponse": "You missed a few words. Let's try reading it again."}

Output ONLY valid JSON, nothing else.`;
        }

        const responseText = await generateOpenAIContent(prompt, { model: 'gpt-4o-mini' });
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        // Fallback mapping for older prompts just in case
        if (result.followUp && !result.aiResponse) {
            result.aiResponse = result.followUp;
        }

        return Response.json(result);
    } catch (error) {
        console.error('Evaluate answer error:', error);
        return Response.json({ satisfied: true, aiResponse: "Great! Let's continue." });
    }
}
