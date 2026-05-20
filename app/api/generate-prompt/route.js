import { generateOpenAIContent } from '../../../lib/openai';

export async function POST(request) {
    try {
        const { modeId, modeTitle, description, taskType, part, generateQueue } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            return Response.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
        }

        let prompt = `You are a creative prompt generator for a speech practice application.
Produce exactly ONE creative, simple, and relatable scenario prompt for the practice mode: "${modeTitle}" (${description}).
IMPORTANT: The topic MUST be very common and easy to understand for everyone (e.g., daily life, common experiences, basic opinions). Avoid hard, niche, or overly technical topics.
The prompt MUST BE EXTREMELY SHORT (under 12 words) and direct. Do not include any additional commentary, quotation marks, or prefixes. Make it specific and unique every time.`;

        if (generateQueue) {
            prompt = `You are a professional conversational coach and English tutor.
For the practice mode: "${modeTitle}" (${description}), choose ONE specific, simple, clear, and relatable topic (e.g., "A memorable vacation", "Dealing with a busy workday", "Pitching a food delivery app").
Then, generate exactly 5 simple, clear, direct, and conversational questions that are all strictly relevant to that chosen topic.

Requirements:
1. Every question must be extremely simple and easy for a beginner/intermediate student to understand and answer.
2. Every question must directly relate to the chosen topic.
3. The questions should progress naturally (e.g., introducing the topic, describing a scenario, sharing an opinion).
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
    "Question 5"
  ]
}`;
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
            prompt = `You are an expert ${part.toUpperCase()} examiner algorithm.
Generate exactly ONE extremely short, highly realistic practice prompt for a student doing the following task:
Exam Section: ${part.toUpperCase()}
Task Name: ${modeTitle}
Task Description: ${description}

The prompt MUST BE specific to the task format. For example, if it's "Describe an Event", ask them to describe a specific event.
OUTPUT ONLY THE PROMPT TEXT. No quotes, no intro, under 15 words. Make it different every time.`;
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
                            "What is the best piece of advice you've ever received?"
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
