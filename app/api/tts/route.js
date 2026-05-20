import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req) {
    try {
        const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = await req.json(); // George voice

        const apiKey = process.env.ELEVENLABS_API_KEY;
        console.log('[TTS] API Key present:', !!apiKey, '| Key prefix:', apiKey?.slice(0, 10));

        if (!apiKey) {
            console.error('[TTS] No ElevenLabs API key found in env!');
            return Response.json({ error: 'No ElevenLabs API key' }, { status: 500 });
        }

        const client = new ElevenLabsClient({ apiKey });

        console.log(`[TTS] Using voice: ${voiceId}, model: eleven_v3`);

        const audioStream = await client.textToSpeech.convert(voiceId, {
            text,
            modelId: "eleven_v3",
            outputFormat: "mp3_44100_128",
        });

        // Collect the stream into a buffer
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        console.log(`[TTS] Success, audio size: ${audioBuffer.length} bytes`);

        return new Response(audioBuffer, {
            headers: { 'Content-Type': 'audio/mpeg' },
        });

    } catch (err) {
        console.error('[TTS] Error:', err.message, err?.body || '');
        return Response.json({ error: err.message }, { status: 500 });
    }
}
