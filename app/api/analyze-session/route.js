import { generateOpenAIContent } from '../../../lib/openai';
import { calculateMetrics } from '../../../lib/analytics';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

export async function POST(request) {
    try {
        const { transcript, duration, mode, prompt: userPrompt, taskType, repeatResults } = await request.json();

        if (!transcript) {
            return Response.json({ error: 'No transcript provided' }, { status: 400 });
        }

        // 1. Calculate base metrics
        const metrics = calculateMetrics(transcript, duration);
        if (!metrics) {
            return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
        }

        // 2. Core OpenAI Analysis
        if (!process.env.OPENAI_API_KEY) {
            return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
        }

        let aiPrompt = "";
        
        if (taskType === 'repeat' && repeatResults) {
            const history = repeatResults.map((r, i) => `S${i+1}: Target: "${r.target}" | Spoken: "${r.spoken}"`).join('\n');
            aiPrompt = `
You are an expert speech coach evaluating a repetitive listening exercise.
Here is the user's performance:
${history}

Provide a structured evaluation in JSON format with these exact keys:
- topic: "Repeat Sentence Practice"
- feedback: (A highly concise 2-sentence summary of their listening accuracy and pronunciation)
- suggestions: (An array of exactly 2 tactical, short tips for fixing any missed words)
- confidenceScore: (A score from 0 to 100 based on mapping accuracy)

Return ONLY the JSON. No conversational text.
`;
        } else {
            aiPrompt = `
You are an expert speech coach. Analyze the following transcript from a "${mode}" session.
The user was responding to this prompt: "${userPrompt || 'General Practice'}"

Metrics already calculated:
- WPM: ${metrics.wpm}
- Total Words: ${metrics.totalWords}
- Filler Word Rate: ${(metrics.totalFillers / Math.max(1, metrics.totalWords) * 100).toFixed(1)}%
- Vocabulary Richness: ${metrics.vocabRichness}

Transcript: 
"${transcript}"

Instruction: 
Provide a structured evaluation in JSON format with these exact keys:
- topic: (Briefly identify what the user spoke about)
- feedback: (A supportive 2-3 sentence summary of the performance)
- suggestions: (An array of exactly 3 tactical, short improvement tips)
- confidenceScore: (A score from 0 to 100 based on word flow and certainty)

Return ONLY the JSON. No conversational text.
`;
        }

        const aiResponseText = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
        
        let aiAnalysis;
        try {
            // Remove markdown format if any
            const cleaned = aiResponseText.replace(/```json|```/g, '').trim();
            aiAnalysis = JSON.parse(cleaned);
        } catch (pe) {
            console.error('AI JSON Parse Error:', pe, aiResponseText);
            aiAnalysis = {
                topic: "General Speech",
                feedback: "Analyzed your speech session but encountered a technical error in parsing detailed feedback.",
                suggestions: ["Focus on reducing filler words.", "Try to vary your pace more.", "Speak with more intent."],
                confidenceScore: 70
            };
        }

        console.log(`\n✅ [SESSION ANALYSIS] Report generated successfully!`);
        console.log(`   - Topic: ${aiAnalysis.topic}`);
        console.log(`   - Fluency Score: ${metrics.fluencyScore}`);
        console.log(`   - Words: ${metrics.totalWords}\n`);

        let xpData = null;

        // 3. Persist to MongoDB
        try {
            await dbConnect();
            const token = request.cookies.get('token')?.value;
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                const userId = decoded.userId;

                const newSession = new Session({
                    userId,
                    transcript,
                    mode,
                    prompt: userPrompt,
                    metrics,
                    aiAnalysis,
                    timestamp: new Date()
                });

                await newSession.save();
                console.log(`   - Session saved to DB for user: ${userId}`);

                // --- XP & RANK LOGIC ---
                const user = await User.findById(userId);
                if (user) {
                    const xpGained = Math.round((duration || 0) + (metrics.fluencyScore || 0) * 0.5);
                    user.xp = (user.xp || 0) + xpGained;

                    const getRank = (xp) => {
                        if (xp >= 10000) return 'Master';
                        if (xp >= 5000) return 'Expert';
                        if (xp >= 3000) return 'Advanced';
                        if (xp >= 1500) return 'Intermediate';
                        if (xp >= 500) return 'Beginner';
                        return 'Newbie';
                    };
                    
                    const newRank = getRank(user.xp);
                    if (newRank !== user.rank) {
                        user.level = (user.level || 1) + 1;
                        user.rank = newRank;
                        console.log(`   🏆 User leveled up to ${newRank}!`);
                    }

                    await user.save();
                    
                    xpData = {
                        xpGained,
                        currentXp: user.xp,
                        currentLevel: user.level,
                        rank: user.rank
                    };
                    console.log(`   - User ${userId} gained ${xpGained} XP. Now Rank: ${user.rank} (${user.xp} XP)`);
                }
            } else {
                console.warn('   - No auth token found, session not saved to DB.');
            }
        } catch (dbErr) {
            console.error('   - Failed to save session to DB:', dbErr.message);
        }

        return Response.json({
            metrics,
            aiAnalysis,
            xpData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Session analysis error:', error);
        return Response.json({ error: 'Failed to analyze session', details: error.message }, { status: 500 });
    }
}
