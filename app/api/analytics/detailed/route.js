import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// -----------------------------------------------------------------------
// GET /api/analytics/detailed
// Returns comprehensive analytics including per-mode stats, ML metric
// aggregations, activity heatmap data, and best/worst session highlights.
// -----------------------------------------------------------------------
export async function GET(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(userId)
      .select('name rank level xp streak bestStreak totalSessions totalPracticeMinutes createdAt')
      .lean();

    const sessions = await Session.find({ userId }).sort({ timestamp: 1 }).lean();

    if (sessions.length === 0) {
      return NextResponse.json({ empty: true, user });
    }

    // ----------------------------------------------------------------
    // 1. Overall aggregates
    // ----------------------------------------------------------------
    const totalSessions = sessions.length;
    let totalFluency = 0, totalWpm = 0, totalMlScore = 0,
        totalReadability = 0, totalCoherence = 0, totalDiversity = 0,
        totalHesitation = 0;

    sessions.forEach(s => {
      totalFluency     += s.metrics?.fluencyScore     || 0;
      totalWpm         += s.metrics?.wpm              || 0;
      totalMlScore     += s.metrics?.overallMlScore   || 0;
      totalReadability += s.metrics?.readabilityScore || 0;
      totalCoherence   += s.metrics?.coherenceScore   || 0;
      totalDiversity   += s.metrics?.vocabularyDiversity || 0;
      totalHesitation  += s.metrics?.hesitationScore  || 0;
    });

    const avgFluency      = Math.round(totalFluency / totalSessions);
    const avgWpm          = Math.round(totalWpm / totalSessions);
    const avgMlScore      = Math.round(totalMlScore / totalSessions);
    const avgReadability  = Math.round(totalReadability / totalSessions);
    const avgCoherence    = Math.round(totalCoherence / totalSessions);
    const avgDiversity    = parseFloat((totalDiversity / totalSessions).toFixed(3));
    const avgHesitation   = Math.round(totalHesitation / totalSessions);

    // ----------------------------------------------------------------
    // 2. Per-mode breakdown
    // ----------------------------------------------------------------
    const modeMap = {};
    sessions.forEach(s => {
      if (!s.mode) return;
      if (!modeMap[s.mode]) {
        modeMap[s.mode] = {
          sessions: 0, totalFluency: 0, totalWpm: 0,
          totalMlScore: 0, totalWords: 0
        };
      }
      modeMap[s.mode].sessions++;
      modeMap[s.mode].totalFluency  += s.metrics?.fluencyScore   || 0;
      modeMap[s.mode].totalWpm      += s.metrics?.wpm            || 0;
      modeMap[s.mode].totalMlScore  += s.metrics?.overallMlScore || 0;
      modeMap[s.mode].totalWords    += s.metrics?.totalWords     || 0;
    });

    const modeBreakdown = Object.entries(modeMap).map(([mode, data]) => ({
      mode,
      sessions: data.sessions,
      avgFluency:  Math.round(data.totalFluency / data.sessions),
      avgWpm:      Math.round(data.totalWpm / data.sessions),
      avgMlScore:  Math.round(data.totalMlScore / data.sessions),
      totalWords:  data.totalWords,
    })).sort((a, b) => b.sessions - a.sessions);

    // ----------------------------------------------------------------
    // 3. Trend data (chronological, last 30 sessions)
    // ----------------------------------------------------------------
    const recent30 = sessions.slice(-30);
    const trends = {
      fluency:       recent30.map(s => s.metrics?.fluencyScore   || 0),
      wpm:           recent30.map(s => s.metrics?.wpm            || 0),
      mlScore:       recent30.map(s => s.metrics?.overallMlScore || 0),
      coherence:     recent30.map(s => s.metrics?.coherenceScore || 0),
      hesitation:    recent30.map(s => s.metrics?.hesitationScore || 0),
      vocabDiversity:recent30.map(s => parseFloat((s.metrics?.vocabularyDiversity || 0).toFixed(3))),
      labels: recent30.map(s =>
        new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
    };

    // ----------------------------------------------------------------
    // 4. Activity heatmap (last 365 days — like GitHub contribution graph)
    //    Returns a map of "YYYY-MM-DD" -> session count
    // ----------------------------------------------------------------
    const heatmap = {};
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    sessions
      .filter(s => new Date(s.timestamp) >= oneYearAgo)
      .forEach(s => {
        const dateKey = new Date(s.timestamp).toISOString().split('T')[0];
        heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
      });

    // ----------------------------------------------------------------
    // 5. Best and worst sessions
    // ----------------------------------------------------------------
    const sorted = [...sessions].sort((a, b) =>
      (b.metrics?.overallMlScore || 0) - (a.metrics?.overallMlScore || 0)
    );
    const bestSession = sorted[0] ? {
      _id: sorted[0]._id,
      mode: sorted[0].mode,
      topic: sorted[0].aiAnalysis?.topic,
      fluencyScore: sorted[0].metrics?.fluencyScore,
      mlScore: sorted[0].metrics?.overallMlScore,
      wpm: sorted[0].metrics?.wpm,
      timestamp: sorted[0].timestamp,
    } : null;
    const worstSession = sorted[sorted.length - 1] && sorted.length > 1 ? {
      _id: sorted[sorted.length - 1]._id,
      mode: sorted[sorted.length - 1].mode,
      topic: sorted[sorted.length - 1].aiAnalysis?.topic,
      fluencyScore: sorted[sorted.length - 1].metrics?.fluencyScore,
      mlScore: sorted[sorted.length - 1].metrics?.overallMlScore,
      wpm: sorted[sorted.length - 1].metrics?.wpm,
      timestamp: sorted[sorted.length - 1].timestamp,
    } : null;

    // ----------------------------------------------------------------
    // 6. Filler word aggregation (all sessions)
    // ----------------------------------------------------------------
    const fillers = {};
    sessions.forEach(s => {
      if (s.metrics?.fillerCounts) {
        const fc = s.metrics.fillerCounts;
        // fillerCounts may be a plain object or Map — handle both
        const entries = fc instanceof Map
          ? [...fc.entries()]
          : Object.entries(fc);
        entries.forEach(([word, count]) => {
          fillers[word] = (fillers[word] || 0) + (count || 0);
        });
      }
    });

    // ----------------------------------------------------------------
    // 7. Vocabulary growth over time (unique word counts per session)
    // ----------------------------------------------------------------
    const vocabGrowth = recent30.map(s => ({
      date: new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uniqueWords: s.metrics?.uniqueWords || 0,
    }));

    // ----------------------------------------------------------------
    // 8. Most-used mode
    // ----------------------------------------------------------------
    let mostUsedMode = 'N/A';
    let maxCount = 0;
    Object.entries(modeMap).forEach(([mode, data]) => {
      if (data.sessions > maxCount) {
        maxCount = data.sessions;
        mostUsedMode = mode;
      }
    });

    return NextResponse.json({
      user,
      totalSessions,
      avgFluency,
      avgWpm,
      avgMlScore,
      avgReadability,
      avgCoherence,
      avgDiversity,
      avgHesitation,
      mostUsedMode,
      modeBreakdown,
      trends,
      heatmap,
      fillers,
      bestSession,
      worstSession,
      vocabGrowth,
      recentSessions: sessions.slice(-10).reverse().map(s => ({
        _id: s._id,
        mode: s.mode,
        fluencyScore: s.metrics?.fluencyScore,
        mlScore: s.metrics?.overallMlScore,
        wpm: s.metrics?.wpm,
        hesitationScore: s.metrics?.hesitationScore,
        coherenceScore: s.metrics?.coherenceScore,
        timestamp: s.timestamp,
        topic: s.aiAnalysis?.topic,
        tfidfKeywords: s.metrics?.tfidfTopKeywords || [],
      })),
    });

  } catch (error) {
    console.error('Detailed analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch detailed analytics' }, { status: 500 });
  }
}
