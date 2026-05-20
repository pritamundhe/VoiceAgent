import { generateOpenAIContent } from '../../../lib/openai';
import { calculateMetrics } from '../../../lib/analytics';
import { runMLAnalysis } from '../../../lib/mlAnalysis';
import { calculateXp, getRankFromXp, getLevelFromXp } from '../../../lib/xp';
import { checkAndAwardBadges } from '../../../lib/badges';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// -----------------------------------------------------------------------
// Helper: get ISO week number from a date
// -----------------------------------------------------------------------
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// -----------------------------------------------------------------------
// Helper: determine if a user has already had a session today
// -----------------------------------------------------------------------
function isFirstSessionToday(allSessions) {
  const today = new Date().toDateString();
  return !allSessions.some(s => new Date(s.timestamp).toDateString() === today);
}

export async function POST(request) {
  try {
    const {
      transcript,
      duration,
      mode,
      prompt: userPrompt,
      taskType,
      repeatResults
    } = await request.json();

    if (!transcript) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    // ----------------------------------------------------------------
    // 1. Calculate base speech metrics (fluency, WPM, fillers, etc.)
    // ----------------------------------------------------------------
    const metrics = calculateMetrics(transcript, duration);
    if (!metrics) {
      return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
    }

    // ----------------------------------------------------------------
    // 2. Run ML analysis pipeline
    //    TF-IDF, readability, coherence, vocabulary diversity, etc.
    // ----------------------------------------------------------------
    const mlMetrics = runMLAnalysis(transcript, duration);

    // ----------------------------------------------------------------
    // 3. OpenAI AI Coach analysis
    // ----------------------------------------------------------------
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    let aiPrompt = '';

    if (taskType === 'repeat' && repeatResults) {
      const history = repeatResults
        .map((r, i) => `S${i + 1}: Target: "${r.target}" | Spoken: "${r.spoken}"`)
        .join('\n');

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
- Vocabulary Richness (type-token ratio): ${metrics.vocabRichness}
- Flesch Readability Score: ${mlMetrics.readabilityScore}/100
- Semantic Coherence: ${mlMetrics.coherenceScore}/100
- Vocabulary Diversity (Simpson Index): ${mlMetrics.vocabularyDiversity}
- Hesitation Score: ${mlMetrics.hesitationScore}/100
- Top Keywords (TF-IDF): ${mlMetrics.tfidfTopKeywords.join(', ')}

Transcript:
"${transcript}"

Instruction:
Provide a structured evaluation in JSON format with these exact keys:
- topic: (Briefly identify what the user spoke about)
- feedback: (A supportive 2-3 sentence summary referencing the ML metrics above)
- suggestions: (An array of exactly 3 tactical, short improvement tips)
- confidenceScore: (A score from 0 to 100 based on word flow, certainty, and delivery)

Return ONLY the JSON. No conversational text.
`;
    }

    const aiResponseText = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });

    let aiAnalysis;
    try {
      const cleaned = aiResponseText.replace(/```json|```/g, '').trim();
      aiAnalysis = JSON.parse(cleaned);
    } catch (pe) {
      console.error('AI JSON Parse Error:', pe, aiResponseText);
      aiAnalysis = {
        topic: 'General Speech',
        feedback: 'Analyzed your speech session. ML analysis has been completed.',
        suggestions: [
          'Focus on reducing filler words.',
          'Try to vary your pace more.',
          'Speak with more intent and structure.',
        ],
        confidenceScore: 70,
      };
    }

    console.log(`\n[SESSION ANALYSIS] Report generated`);
    console.log(`   Topic: ${aiAnalysis.topic}`);
    console.log(`   Fluency: ${metrics.fluencyScore} | ML Score: ${mlMetrics.overallMlScore}`);
    console.log(`   Keywords: ${mlMetrics.tfidfTopKeywords.join(', ')}`);

    let xpData = null;
    let newBadges = [];

    // ----------------------------------------------------------------
    // 4. Persist to MongoDB — session + XP + badges
    // ----------------------------------------------------------------
    try {
      await dbConnect();
      const token = request.cookies.get('token')?.value;

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Fetch user and existing sessions before saving
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const existingSessions = await Session.find({ userId }).sort({ timestamp: -1 });

        // Check periodic XP resets (weekly / monthly)
        user.checkAndResetPeriodic();

        // Determine if this is the first session today
        const firstToday = isFirstSessionToday(existingSessions);

        // ---- Compute XP ----
        const { xpGained, breakdown } = calculateXp({
          duration: duration || 0,
          fluencyScore: metrics.fluencyScore || 0,
          confidenceScore: aiAnalysis.confidenceScore || 0,
          overallMlScore: mlMetrics.overallMlScore || 0,
          mode,
          streak: user.streak || 0,
          isFirstToday: firstToday,
        });

        // ---- Time partitioning for leaderboard queries ----
        const now = new Date();
        const weekNumber = getISOWeek(now);
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = now.getFullYear();

        // ---- Save session ----
        const newSession = new Session({
          userId,
          transcript,
          mode,
          prompt: userPrompt,
          metrics: {
            ...metrics,
            fillerCounts: metrics.fillerCounts,  // Now saved correctly
            ...mlMetrics,
            confidenceScore: aiAnalysis.confidenceScore || 0,
          },
          aiAnalysis,
          xpEarned: xpGained,
          weekNumber,
          monthKey,
          yearKey,
          timestamp: now,
        });

        await newSession.save();
        console.log(`   Session saved for user: ${userId}`);

        // ---- Update user stats ----
        user.xp = (user.xp || 0) + xpGained;
        user.weeklyXp = (user.weeklyXp || 0) + xpGained;
        user.monthlyXp = (user.monthlyXp || 0) + xpGained;
        user.totalSessions = (user.totalSessions || 0) + 1;
        user.totalPracticeMinutes = (user.totalPracticeMinutes || 0) + Math.round((duration || 0) / 60);

        // ---- Update rank and level ----
        const newRank = getRankFromXp(user.xp);
        const newLevel = getLevelFromXp(user.xp);
        const rankedUp = newRank !== user.rank;

        if (rankedUp) {
          console.log(`   User ranked up to ${newRank}!`);
        }

        user.rank = newRank;
        user.level = newLevel;

        // ---- Update streak ----
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActiveDate = user.lastActive ? new Date(user.lastActive) : null;
        if (lastActiveDate) lastActiveDate.setHours(0, 0, 0, 0);

        const diffDays = lastActiveDate
          ? Math.floor((today - lastActiveDate) / 86400000)
          : null;

        if (diffDays === null) {
          user.streak = 1;
        } else if (diffDays === 1) {
          user.streak = (user.streak || 0) + 1;
        } else if (diffDays > 1) {
          user.streak = 1;
        }
        // diffDays === 0 means already active today — streak unchanged

        if (user.streak > (user.bestStreak || 0)) {
          user.bestStreak = user.streak;
        }
        user.lastActive = new Date();

        // ---- Check and award badges ----
        const allSessionsAfterSave = [...existingSessions, newSession];
        newBadges = checkAndAwardBadges(user, newSession, allSessionsAfterSave);

        if (newBadges.length > 0) {
          user.badges = [...(user.badges || []), ...newBadges];
          console.log(`   Badges awarded: ${newBadges.map(b => b.name).join(', ')}`);
        }

        await user.save();

        xpData = {
          xpGained,
          breakdown,
          currentXp: user.xp,
          currentLevel: user.level,
          rank: user.rank,
          streak: user.streak,
          bestStreak: user.bestStreak,
          rankedUp,
          newBadges,
          isFirstToday: firstToday,
        };

        console.log(`   User ${userId}: +${xpGained} XP -> ${user.xp} total | Rank: ${user.rank}`);
      } else {
        console.warn('   No auth token — session not saved to DB.');
      }
    } catch (dbErr) {
      console.error('   DB save failed:', dbErr.message);
    }

    return Response.json({
      metrics: { ...metrics, ...mlMetrics },
      aiAnalysis,
      xpData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Session analysis error:', error);
    return Response.json({ error: 'Failed to analyze session', details: error.message }, { status: 500 });
  }
}
