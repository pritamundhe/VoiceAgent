import { generateDeepSeekContent } from '../../../lib/deepseek';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function POST(request) {
  try {
    const { transcript, mode, prompt: userPrompt } = await request.json();

    if (!transcript) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json({ error: 'DEEPSEEK_API_KEY is not configured' }, { status: 500 });
    }

    let prompt = `You are an AI conversational partner chatting directly with the user. Keep the flow continuous and engaging.\n\n`;
    prompt += `User just said:\n"${transcript}"\n\n`;

    prompt += `Instruction: Respond with exactly ONE short, natural sentence (under 20 words) reacting to their speech, followed immediately by ONE engaging follow-up question or coaching tip to keep them talking. Be extremely concise. Do not write paragraphs.\n`;

    if (userPrompt) {
      prompt += `Context: The user is currently responding to this specific prompt: "${userPrompt}". Your feedback should relate to how well they addressed it if applicable.\n`;
    }

    if (mode === 'interview') {
      prompt += `Context: You are the interviewer. Act like a hiring manager and ask the next interview question.`;
    } else if (mode === 'sales') {
      prompt += `Context: You are a potential client. Ask a question about their product or pitch.`;
    } else if (mode === 'public-speaking') {
      prompt += `Context: You are a speaking coach. Ask them to clarify or expand on their main point.`;
    } else {
      prompt += `Context: Friendly chat. Ask a natural follow-up question to continue the conversation.`;
    }

    const responseText = await generateDeepSeekContent(prompt, { model: 'deepseek-chat' });

    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
        const audioStream = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
          text: responseText,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        });

        const chunks = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        audioBase64 = Buffer.concat(chunks).toString('base64');
      } catch (audioErr) {
        console.error('ElevenLabs TTS Error:', audioErr);
      }
    }

    return Response.json({ response: responseText, audioBase64 });

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return Response.json({ error: 'Failed to generate response', details: error.message }, { status: 500 });
  }
}
