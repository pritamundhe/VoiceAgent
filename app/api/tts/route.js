export async function POST(req) {
    try {
        const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json(); // Bella voice as default
        
        if (!process.env.ELEVENLABS_API_KEY) {
            return Response.json({ error: 'No ElevenLabs API key' }, { status: 500 });
        }
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_turbo_v2_5", // Using turbo v2.5 for free tier support and speed
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ElevenLabs error (${response.status}): ${errorText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        return new Response(arrayBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg'
            }
        });
    } catch(err) {
        console.error('TTS generation error:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}
