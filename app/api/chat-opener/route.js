import { generateOpenAIContent } from '../../../lib/openai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function POST(request) {
  try {
    const { mode, prompt: sessionPrompt, modeTitle } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    // Build a role-specific opening line
    let systemInstruction = '';

    if (mode === 'interview') {
      systemInstruction = `You are a professional hiring manager starting an interview. 
Greet the candidate warmly and ask them the interview question naturally, as if you're really talking to them.
Keep it to 2 short sentences max. Be friendly but professional.`;
    } else if (mode === 'sales') {
      systemInstruction = `You are a potential client or prospect. 
Start the conversation naturally — maybe ask what they're offering or set the scene briefly.
Keep it to 2 short sentences max. Sound skeptical but open.`;
    } else if (mode === 'public-speaking') {
      systemInstruction = `You are a speaking coach starting a practice session.
Welcome the speaker warmly and set up the topic they'll be speaking on.
Keep it to 2 short sentences max. Be encouraging.`;
    } else if (mode === 'negotiation') {
      systemInstruction = `You are the other party in a negotiation. 
Start the meeting naturally — greet them and set the scene briefly.
Keep it to 2 short sentences max. Be professional and slightly guarded.`;
    } else if (mode === 'group-discussion') {
      systemInstruction = `You are a moderator opening a group discussion.
Introduce the topic engagingly and invite the user to share their opening thoughts.
Keep it to 2 short sentences max. Be neutral and thought-provoking.`;
    } else if (mode === 'networking') {
      systemInstruction = `You are a professional at a networking event. 
Walk up and start a natural icebreaker conversation.
Keep it to 2 short sentences max. Be warm and casual.`;
    } else if (mode === 'media-interview') {
      systemInstruction = `You are a journalist or TV interviewer. 
Open the interview with a brief welcome and your first question.
Keep it to 2 short sentences max. Be sharp and direct.`;
    } else if (mode === 'conflict-resolution') {
      systemInstruction = `You are the other person in a workplace conflict situation.
Set the scene briefly — you have an issue to discuss.
Keep it to 2 short sentences max. Be tense but civil.`;
    } else {
      systemInstruction = `You are an AI conversation coach starting a practice session.
Warmly welcome the user and naturally introduce the topic they'll be practicing.
Keep it to 2 short sentences max. Be encouraging and clear.`;
    }

    const promptText = `${systemInstruction}

The current practice topic/prompt is: "${sessionPrompt || modeTitle || 'general speaking practice'}"

Generate your opening line now. Speak directly to the user. No labels, no quotes — just the words you would say.`;

    const opener = await generateOpenAIContent(promptText, { model: 'gpt-4o-mini' });

    // TTS via ElevenLabs
    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
        const audioStream = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
          text: opener,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        });
        const chunks = [];
        for await (const chunk of audioStream) chunks.push(chunk);
        audioBase64 = Buffer.concat(chunks).toString('base64');
      } catch (ttsErr) {
        console.error('[Chat Opener] ElevenLabs TTS error:', ttsErr.message);
      }
    }

    return Response.json({ opener, audioBase64 });

  } catch (err) {
    console.error('[Chat Opener] Error:', err.message);
    return Response.json({ error: 'Failed to generate opener', details: err.message }, { status: 500 });
  }
}
