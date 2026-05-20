import { generateOpenAIContent } from '../../../lib/openai';
import { MODES } from '../../../lib/modes';

export async function POST(request) {
    try {
        const { modeId, modeTitle, description, taskType, part, generateQueue } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return Response.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
        }

        // Find the mode configuration to fetch sample prompts
        const modeObj = MODES.find(m => m.id === modeId || m.title === modeTitle);
        const samplePrompts = modeObj?.prompts || [];
        const samplesText = samplePrompts.length > 0
            ? `Here are some example prompts/scenarios for this practice mode to show the context, style, and scope:\n${samplePrompts.slice(0, 5).map(p => `- "${p}"`).join('\n')}`
            : '';

        let prompt = `You are a creative prompt generator for a speech practice application.
Produce exactly ONE creative, specific, and relatable scenario prompt for the practice mode: "${modeTitle}" (${description}).

${samplesText}

Guidelines:
1. Do NOT choose generic topics like "A memorable vacation", "favorite hobbies", or "traveling" unless the mode is explicitly about travel or networking small talk.
2. The prompt must fit the theme of "${modeTitle}" perfectly and be inspired by the examples above (but not identical).
3. The prompt MUST BE EXTREMELY SHORT (under 12 words) and direct. Do not include any additional commentary, quotation marks, or prefixes.
4. Make it specific, creative, and unique every time (e.g., use different roles, scenarios, or industries in successive runs).`;

        if (generateQueue) {
            if (part === 'reading' || part === 'listening') {
                prompt = `You are an English tutor generating practice material for a ${part} exercise.
You are generating practice content for the practice mode: "${modeTitle}" (${description}).

Task: Choose ONE specific, creative, and relatable topic.
Generate exactly 10 short, engaging sentences or very short paragraphs (under 15 words each) about this topic that the student must listen to or read, and then accurately repeat or transcribe.
DO NOT ASK QUESTIONS. Generate statements, facts, or narrative sentences.

Output ONLY a raw JSON object and NOTHING ELSE. Do NOT wrap in markdown code blocks.

JSON Structure:
{
  "topic": "The specific topic chosen",
  "questions": [
    "Sentence 1 to read aloud.",
    "Sentence 2 to read aloud.",
    "Sentence 3 to read aloud.",
    "Sentence 4 to read aloud.",
    "Sentence 5 to read aloud.",
    "Sentence 6 to read aloud.",
    "Sentence 7 to read aloud.",
    "Sentence 8 to read aloud.",
    "Sentence 9 to read aloud.",
    "Sentence 10 to read aloud."
  ]
}`;
            } else {
                prompt = `You are a professional conversational coach and English tutor.
You are generating practice questions for the practice mode: "${modeTitle}" (${description}).

${samplesText}

Task: Choose ONE specific, creative, and relatable topic or scenario that fits the theme of "${modeTitle}" perfectly.
Guidelines for topic selection:
1. Do NOT choose generic topics like "A memorable vacation", "favorite hobbies", or "traveling" unless the mode is explicitly about travel or networking small talk.
2. The topic must be highly specific to "${modeTitle}".
   - If the mode is "Job Interview", choose a specific role (e.g. Project Manager, Customer Service Representative, Data Analyst) and a scenario (e.g., explaining how you handle a project delay, answering a strength/weakness question).
   - If the mode is "Pitch", choose a specific startup idea, project, or concept to pitch (e.g., pitching a smart compost bin, pitching a local grocery delivery service).
   - If the mode is "Negotiation", choose a specific negotiation scenario (e.g., negotiating flexible hours, vendor contract pricing).
   - If the mode is "Sales Pitch", choose a specific product or service to sell.
   - If the mode is "Stories", choose a specific story prompt (e.g., describing a time you had to make a quick decision).
   - If the mode is "Conflict Resolution", choose a workplace disagreement scenario.
3. Make the chosen topic specific, clear, and relatable (under 10 words, e.g., "Answering behavioral questions for a software engineer interview" or "Negotiating contract terms with a freelance client").
4. Choose a different, unique topic every time. Use a different industry, role, or context (e.g., technology, healthcare, education, retail, finance).

Once you have chosen the topic, generate exactly 10 simple, clear, direct, and conversational questions that are all strictly relevant to that chosen topic.

Requirements for questions:
1. Every question must be extremely simple and easy for a beginner/intermediate student to understand and answer.
2. Every question must directly relate to the chosen topic.
3. The questions should progress naturally (e.g., introducing the topic, describing a scenario, sharing an opinion, discussing challenges, reflecting on future ideas).
4. Keep questions under 15 words each.
5. Output ONLY a raw JSON object and NOTHING ELSE. Do NOT wrap in markdown code blocks, do NOT write any intro/outro. Just output the raw JSON.

JSON Structure:
{
  "topic": "The specific topic chosen",
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5",
    "Question 6",
    "Question 7",
    "Question 8",
    "Question 9",
    "Question 10"
  ]
}`;
            }
        } else if (taskType === 'repeat') {
            prompt = `You are a beginner-friendly English tutor.
Generate EXACTLY 5 very simple, easy-to-understand sentences for a beginner student to listen to and repeat.
Output ONLY a raw JSON array of 5 strings and NOTHING ELSE. No markdown formatting, no code blocks, just the JSON raw array.
Example: ["I like to read.", "She is at school.", "The sky is blue.", "He has a dog.", "We are happy."]`;
        } else if (taskType === 'short') {
            prompt = `You are a Quiz Master.
Generate EXACTLY 5 very short, simple factual questions (GK, Science, Geography, History, Math, Basics).
Each question must have a clear ONE-WORD answer.
Output ONLY a raw JSON array of 5 objects and NOTHING ELSE. No markdown formatting, no code blocks.
Structure: [{"q": "What is the capital of France?", "a": "Paris"}, ...]`;
        } else if (taskType && taskType.includes('fitb')) {
            prompt = `You are a beginner-friendly English Tutor.
Generate EXACTLY 5 "Fill in the Blank" VERY SIMPLE daily-life sentences.
Each sentence must have ONE clear blank represented by "___".
Output ONLY a raw JSON array of 5 objects and NOTHING ELSE. No markdown formatting, no code blocks.
Structure: [{"q": "The apple is ___ in color.", "a": "red"}, ...]`;
        } else if (taskType && part) {
            if (part === 'reading' || part === 'listening') {
                prompt = `You are an expert ${part.toUpperCase()} examiner algorithm.
Generate exactly ONE extremely short, highly realistic practice text for a student to listen to or read for the following task:
Task Name: ${modeTitle}
Task Description: ${description}

The text MUST be a statement, fact, or short narrative. DO NOT ask a question.
OUTPUT ONLY THE TEXT. No quotes, no intro, under 15 words. Make it different every time.`;
            } else {
                prompt = `You are an expert ${part.toUpperCase()} examiner algorithm.
Generate exactly ONE extremely short, highly realistic practice prompt for a student doing the following task:
Exam Section: ${part.toUpperCase()}
Task Name: ${modeTitle}
Task Description: ${description}

The prompt MUST BE specific to the task format. For example, if it's "Describe an Event", ask them to describe a specific event.
OUTPUT ONLY THE PROMPT TEXT. No quotes, no intro, under 15 words. Make it different every time.`;
            }
        }

        const responseText = await generateOpenAIContent(prompt, { model: 'gpt-4o-mini' });

        if (taskType === 'repeat' || taskType === 'short' || (taskType && taskType.includes('fitb')) || generateQueue) {
            try {
                // OpenAI might wrap in markdown blocks occasionally despite instructions
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                return Response.json({ prompt: parsed });
            } catch (e) {
                console.error("Failed to parse array, falling back", e);
                const fallback = taskType === 'short' 
                    ? [{"q": "What color is the sky?", "a": "Blue"}, {"q": "What is 2 plus 2?", "a": "Four"}, {"q": "Which planet do we live on?", "a": "Earth"}, {"q": "What is the capital of India?", "a": "Delhi"}, {"q": "What is the opposite of hot?", "a": "Cold"}]
                    : (taskType && taskType.includes('fitb'))
                    ? [{"q": "The sun ___ in the east.", "a": "rises"}, {"q": "Water boils at 100 ___ Celsius.", "a": "degrees"}, {"q": "Cats are known for their ability to ___.", "a": "climb"}, {"q": "Plants need ___ to grow.", "a": "water"}, {"q": "The moon orbits the ___.", "a": "earth"}]
                    : generateQueue
                    ? {
                        topic: `General ${modeTitle} Scenarios`,
                        questions: [
                            `What is your favorite part about ${modeTitle}?`,
                            "How do you usually practice or learn new things?",
                            "What is a big goal you want to achieve this year?",
                            "Can you describe one challenge you overcame recently?",
                            "What is the best piece of advice you've ever received?",
                            "How do you stay motivated during tough times?",
                            "What does success look like to you?",
                            "Tell me about a skill you would like to master.",
                            "How do you balance work or school with your personal life?",
                            "What is the most important lesson you learned this week?"
                        ]
                      }
                    : ["The quick brown fox jumps over the lazy dog.", "I like to drink coffee in the morning.", "Where is the nearest train station?", "She bought a new pair of shoes.", "It is raining heavily today."];
                return Response.json({ prompt: fallback });
            }
        }

        return Response.json({ prompt: responseText.trim().replace(/^"|"$/g, '') });
    } catch (error) {
        console.error('Prompt generation error:', error);
        return Response.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}
